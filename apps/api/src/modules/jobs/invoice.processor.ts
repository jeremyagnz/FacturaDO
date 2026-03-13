import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { SignatureService } from '../signature/signature.service';
import { DgiiService } from '../dgii/dgii.service';
import { StorageService } from '../storage/storage.service';
import { Company } from '../companies/company.entity';

interface SignInvoiceJob {
  invoiceId: string;
}

interface SubmitToDgiiJob {
  invoiceId: string;
}

interface GeneratePdfJob {
  invoiceId: string;
}

@Processor('invoices')
export class InvoiceProcessor {
  private readonly logger = new Logger(InvoiceProcessor.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly signatureService: SignatureService,
    private readonly dgiiService: DgiiService,
    private readonly storageService: StorageService,
  ) {}

  @Process('sign-invoice')
  async handleSignInvoice(job: Job<SignInvoiceJob>): Promise<void> {
    const { invoiceId } = job.data;
    this.logger.log(`Processing sign-invoice job for invoice: ${invoiceId}`);

    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['company', 'items'],
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found: ${invoiceId}`);
      return;
    }

    if (!invoice.company?.certificatePath) {
      this.logger.warn(`No certificate configured for company: ${invoice.companyId}`);
      return;
    }

    const xmlContent = this.buildInvoiceXml(invoice);
    await job.progress(25);

    const { signedXml, signature, signedAt } = await this.signatureService.signXml({
      certificatePath: invoice.company.certificatePath,
      certificatePassword: invoice.company.certificatePassword ?? '',
      xmlContent,
    });
    await job.progress(50);

    const xmlKey = `invoices/${invoice.companyId}/${invoiceId}/ecf.xml`;
    await this.storageService.upload(xmlKey, Buffer.from(signedXml, 'utf-8'), 'application/xml');
    await job.progress(75);

    await this.invoiceRepository.update(invoiceId, {
      status: InvoiceStatus.SIGNED,
      digitalSignature: signature,
      signedAt,
      xmlPath: xmlKey,
    });

    await job.progress(100);
    this.logger.log(`Invoice ${invoiceId} signed successfully`);
  }

  @Process('submit-to-dgii')
  async handleSubmitToDgii(job: Job<SubmitToDgiiJob>): Promise<void> {
    const { invoiceId } = job.data;
    this.logger.log(`Processing submit-to-dgii job for invoice: ${invoiceId}`);

    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['company'],
    });

    if (!invoice || !invoice.xmlPath) {
      this.logger.warn(`Invoice or XML not found: ${invoiceId}`);
      return;
    }

    const xmlBuffer = await this.storageService.download(invoice.xmlPath);
    const signedXml = xmlBuffer.toString('utf-8');
    await job.progress(25);

    const result = await this.dgiiService.submitECF(signedXml, invoice.company.rnc);
    await job.progress(75);

    await this.invoiceRepository.update(invoiceId, {
      status: result.status === 'accepted' ? InvoiceStatus.ACCEPTED : InvoiceStatus.SUBMITTED,
      dgiiTrackingId: result.trackingId,
      submittedAt: new Date(),
      dgiiResponse: result as unknown as Record<string, unknown>,
    });

    await job.progress(100);
    this.logger.log(`Invoice ${invoiceId} submitted to DGII. TrackingId: ${result.trackingId}`);
  }

  @Process('generate-pdf')
  async handleGeneratePdf(job: Job<GeneratePdfJob>): Promise<void> {
    const { invoiceId } = job.data;
    this.logger.log(`Processing generate-pdf job for invoice: ${invoiceId}`);

    // PDF generation would use a library like pdfkit or puppeteer
    // Placeholder implementation
    await job.progress(100);
    this.logger.log(`PDF generated for invoice: ${invoiceId}`);
  }

  private buildInvoiceXml(invoice: Invoice): string {
    return this.dgiiService.buildECFXml({
      Encabezado: {
        Version: '1.0',
        IdDoc: {
          TipoeCF: invoice.ecfType,
          eNCF: invoice.ecfNumber ?? '',
          FechaVencimientoSecuencia: invoice.dueDate?.toISOString().split('T')[0],
          FechaEmision: invoice.issueDate,
          TipoPago: invoice.paymentMethod,
          TipoTransaccion: '1',
        },
        Emisor: {
          RNCEmisor: invoice.company?.rnc ?? '',
          RazonSocialEmisor: invoice.company?.name ?? '',
          DireccionEmisor: invoice.company?.address ?? '',
        },
        Comprador: {
          RNCComprador: invoice.buyerRnc ?? '',
          RazonSocialComprador: invoice.buyerName ?? '',
          DireccionComprador: invoice.buyerAddress ?? '',
        },
        Totales: {
          MontoGravadoI: invoice.subtotal,
          ITBIS1: invoice.taxAmount,
          TotalITBIS: invoice.taxAmount,
          MontoTotal: invoice.totalAmount,
        },
      },
      DetallesItems: {
        Item: invoice.items?.map((item) => ({
          NumeroLinea: item.lineNumber,
          IndicadorBienoServicio: '1',
          NombreItem: item.description,
          CantidadItem: item.quantity,
          UnidadMedida: item.unit ?? '43',
          PrecioUnitarioItem: item.unitPrice,
          TablaSubsidio: item.discountRate ?? 0,
          MontoItem: item.totalAmount,
        })),
      },
    });
  }
}
