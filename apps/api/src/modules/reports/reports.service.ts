import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Invoice, InvoiceStatus, ECFType } from '../invoices/invoice.entity';

export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  totalTax: number;
  invoicesByStatus: Record<string, number>;
  invoicesByType: Record<string, number>;
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
}

export interface ReportFilter {
  companyId: string;
  dateFrom: Date;
  dateTo: Date;
  ecfType?: ECFType;
  status?: InvoiceStatus;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}

  async getDashboardStats(companyId: string): Promise<DashboardStats> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalInvoices, totalRevenue, statusCounts, typeCounts, monthlyRevenue] =
      await Promise.all([
        this.invoiceRepository.count({ where: { companyId } }),
        this.invoiceRepository
          .createQueryBuilder('invoice')
          .select('SUM(invoice.totalAmount)', 'total')
          .addSelect('SUM(invoice.taxAmount)', 'tax')
          .where('invoice.companyId = :companyId', { companyId })
          .andWhere('invoice.status IN (:...statuses)', {
            statuses: [InvoiceStatus.ACCEPTED, InvoiceStatus.SUBMITTED],
          })
          .getRawOne<{ total: string; tax: string }>(),
        this.getCountByField(companyId, 'status'),
        this.getCountByField(companyId, 'ecfType'),
        this.getMonthlyRevenue(companyId, 12),
      ]);

    return {
      totalInvoices,
      totalRevenue: parseFloat(totalRevenue?.total ?? '0'),
      totalTax: parseFloat(totalRevenue?.tax ?? '0'),
      invoicesByStatus: statusCounts,
      invoicesByType: typeCounts,
      monthlyRevenue,
    };
  }

  async getInvoiceSummary(
    filter: ReportFilter,
  ): Promise<{ invoices: Invoice[]; totals: Record<string, number> }> {
    const { companyId, dateFrom, dateTo, ecfType, status } = filter;

    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere('invoice.issueDate BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (ecfType) qb.andWhere('invoice.ecfType = :ecfType', { ecfType });
    if (status) qb.andWhere('invoice.status = :status', { status });

    const invoices = await qb.orderBy('invoice.issueDate', 'ASC').getMany();

    const totals = invoices.reduce(
      (acc, inv) => ({
        subtotal: acc.subtotal + Number(inv.subtotal),
        taxAmount: acc.taxAmount + Number(inv.taxAmount),
        discountAmount: acc.discountAmount + Number(inv.discountAmount),
        totalAmount: acc.totalAmount + Number(inv.totalAmount),
        count: acc.count + 1,
      }),
      { subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0, count: 0 },
    );

    return { invoices, totals };
  }

  /**
   * 606 Report — Purchases and services (for DGII filing)
   */
  async generate606Report(
    companyId: string,
    year: number,
    month: number,
  ): Promise<Record<string, unknown>[]> {
    const dateFrom = new Date(year, month - 1, 1);
    const dateTo = new Date(year, month, 0);

    return this.invoiceRepository
      .createQueryBuilder('invoice')
      .select([
        'invoice.buyerRnc AS rnc_proveedor',
        'invoice.buyerName AS nombre_proveedor',
        'SUM(invoice.totalAmount) AS monto_total',
        'SUM(invoice.taxAmount) AS itbis_facturado',
      ])
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere('invoice.ecfType IN (:...types)', {
        types: [ECFType.COMPRAS, ECFType.GASTOS_MENORES],
      })
      .andWhere('invoice.issueDate BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('invoice.buyerRnc, invoice.buyerName')
      .getRawMany();
  }

  /**
   * 607 Report — Sales (for DGII filing)
   */
  async generate607Report(
    companyId: string,
    year: number,
    month: number,
  ): Promise<Record<string, unknown>[]> {
    const dateFrom = new Date(year, month - 1, 1);
    const dateTo = new Date(year, month, 0);

    return this.invoiceRepository
      .createQueryBuilder('invoice')
      .select([
        'invoice.ecfNumber AS ncf',
        'invoice.ecfType AS tipo_ncf',
        'invoice.issueDate AS fecha_comprobante',
        'invoice.buyerRnc AS rnc_cedula_comprador',
        'invoice.buyerName AS nombre_comprador',
        'invoice.subtotal AS monto_facturado_servicios',
        'invoice.taxAmount AS itbis_facturado',
        'invoice.totalAmount AS monto_total',
      ])
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere('invoice.ecfType IN (:...types)', {
        types: [ECFType.FACTURA_CREDITO_FISCAL, ECFType.FACTURA_CONSUMIDOR_FINAL],
      })
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: [InvoiceStatus.ACCEPTED, InvoiceStatus.SUBMITTED],
      })
      .andWhere('invoice.issueDate BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .orderBy('invoice.issueDate', 'ASC')
      .getRawMany();
  }

  private async getCountByField(
    companyId: string,
    field: string,
  ): Promise<Record<string, number>> {
    const results = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select(`invoice.${field}`, 'field')
      .addSelect('COUNT(*)', 'count')
      .where('invoice.companyId = :companyId', { companyId })
      .groupBy(`invoice.${field}`)
      .getRawMany<{ field: string; count: string }>();

    return results.reduce(
      (acc, r) => ({ ...acc, [r.field]: parseInt(r.count, 10) }),
      {} as Record<string, number>,
    );
  }

  private async getMonthlyRevenue(
    companyId: string,
    months: number,
  ): Promise<Array<{ month: string; revenue: number; count: number }>> {
    const results = await this.dataSource.query<
      Array<{ month: string; revenue: string; count: string }>
    >(
      `
      SELECT
        TO_CHAR(issue_date, 'YYYY-MM') AS month,
        SUM(total_amount) AS revenue,
        COUNT(*) AS count
      FROM invoices
      WHERE company_id = $1
        AND deleted_at IS NULL
        AND status IN ('accepted', 'submitted')
        AND issue_date >= NOW() - INTERVAL '${months} months'
      GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
      ORDER BY month ASC
    `,
      [companyId],
    );

    return results.map((r) => ({
      month: r.month,
      revenue: parseFloat(r.revenue),
      count: parseInt(r.count, 10),
    }));
  }
}
