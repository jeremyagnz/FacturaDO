import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';
import { CreateInvoiceDto, InvoiceQueryDto } from './dto/invoice.dto';
import { User } from '../auth/user.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepository: Repository<InvoiceItem>,
    @InjectQueue('invoices')
    private readonly invoiceQueue: Queue,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateInvoiceDto, _user: User): Promise<Invoice> {
    return this.dataSource.transaction(async (manager) => {
      const { items, ...invoiceData } = dto;

      const invoice = manager.create(Invoice, {
        ...invoiceData,
        status: InvoiceStatus.DRAFT,
      });

      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;
      let discountAmount = 0;

      const invoiceItems = items.map((itemDto) => {
        const lineSubtotal = itemDto.quantity * itemDto.unitPrice;
        const lineDiscount = lineSubtotal * ((itemDto.discountRate ?? 0) / 100);
        const lineTaxable = lineSubtotal - lineDiscount;
        const lineTax = lineTaxable * ((itemDto.taxRate ?? 18) / 100);

        subtotal += lineSubtotal;
        taxAmount += lineTax;
        discountAmount += lineDiscount;

        return manager.create(InvoiceItem, {
          ...itemDto,
          subtotal: lineSubtotal,
          discountAmount: lineDiscount,
          taxAmount: lineTax,
          totalAmount: lineTaxable + lineTax,
        });
      });

      invoice.subtotal = subtotal;
      invoice.taxAmount = taxAmount;
      invoice.discountAmount = discountAmount;
      invoice.totalAmount = subtotal - discountAmount + taxAmount;

      const savedInvoice = await manager.save(Invoice, invoice);

      for (const item of invoiceItems) {
        item.invoiceId = savedInvoice.id;
      }
      await manager.save(InvoiceItem, invoiceItems);

      return manager.findOneOrFail(Invoice, {
        where: { id: savedInvoice.id },
        relations: ['items', 'company'],
      });
    });
  }

  async findAll(
    query: InvoiceQueryDto,
    user: User,
  ): Promise<{ data: Invoice[]; total: number }> {
    const { companyId, status, ecfType, search, dateFrom, dateTo, page = 1, limit = 20 } = query;

    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.company', 'company')
      .leftJoinAndSelect('invoice.items', 'items');

    if (companyId) {
      qb.andWhere('invoice.companyId = :companyId', { companyId });
    }
    if (status) {
      qb.andWhere('invoice.status = :status', { status });
    }
    if (ecfType) {
      qb.andWhere('invoice.ecfType = :ecfType', { ecfType });
    }
    if (search) {
      qb.andWhere(
        '(invoice.ecfNumber ILIKE :search OR invoice.buyerName ILIKE :search OR invoice.buyerRnc ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (dateFrom) {
      qb.andWhere('invoice.issueDate >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('invoice.issueDate <= :dateTo', { dateTo });
    }

    const [data, total] = await qb
      .orderBy('invoice.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['items', 'company'],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async sign(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be signed');
    }

    // Queue the signing job
    await this.invoiceQueue.add('sign-invoice', { invoiceId: id }, { priority: 1 });

    return invoice;
  }

  async submitToDgii(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (invoice.status !== InvoiceStatus.SIGNED) {
      throw new BadRequestException('Only signed invoices can be submitted to DGII');
    }

    // Queue the DGII submission job
    await this.invoiceQueue.add(
      'submit-to-dgii',
      { invoiceId: id },
      { priority: 2, delay: 0 },
    );

    return invoice;
  }

  async cancel(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (
      invoice.status === InvoiceStatus.CANCELLED ||
      invoice.status === InvoiceStatus.ACCEPTED
    ) {
      throw new BadRequestException('Cannot cancel this invoice');
    }

    await this.invoiceRepository.update(id, { status: InvoiceStatus.CANCELLED });
    return this.findOne(id);
  }
}
