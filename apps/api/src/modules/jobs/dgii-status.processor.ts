import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { DgiiService } from '../dgii/dgii.service';

interface StatusCheckJob {
  invoiceId: string;
  trackingId: string;
}

@Processor('dgii-status')
export class DgiiStatusProcessor {
  private readonly logger = new Logger(DgiiStatusProcessor.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly dgiiService: DgiiService,
  ) {}

  @Process('check-status')
  async handleStatusCheck(job: Job<StatusCheckJob>): Promise<void> {
    const { invoiceId, trackingId } = job.data;
    this.logger.log(`Checking DGII status for invoice: ${invoiceId}`);

    const result = await this.dgiiService.checkStatus(trackingId);

    if (result.status === 'accepted') {
      await this.invoiceRepository.update(invoiceId, {
        status: InvoiceStatus.ACCEPTED,
        acceptedAt: new Date(),
        ecfNumber: result.ecfNumber,
        dgiiResponse: result as unknown as Record<string, unknown>,
      });
      this.logger.log(`Invoice ${invoiceId} accepted by DGII. NCF: ${result.ecfNumber}`);
    } else if (result.status === 'rejected') {
      await this.invoiceRepository.update(invoiceId, {
        status: InvoiceStatus.REJECTED,
        dgiiResponse: result as unknown as Record<string, unknown>,
      });
      this.logger.warn(`Invoice ${invoiceId} rejected by DGII: ${result.message}`);
    } else {
      // Still processing — re-queue for later
      this.logger.debug(`Invoice ${invoiceId} still processing at DGII`);
    }
  }
}
