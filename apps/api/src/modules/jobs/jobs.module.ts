import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { InvoiceProcessor } from './invoice.processor';
import { DgiiStatusProcessor } from './dgii-status.processor';
import { Invoice } from '../invoices/invoice.entity';
import { Company } from '../companies/company.entity';
import { SignatureModule } from '../signature/signature.module';
import { DgiiModule } from '../dgii/dgii.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Company]),
    BullModule.registerQueue(
      { name: 'invoices' },
      { name: 'dgii-status' },
    ),
    SignatureModule,
    DgiiModule,
    StorageModule,
  ],
  providers: [InvoiceProcessor, DgiiStatusProcessor],
})
export class JobsModule {}
