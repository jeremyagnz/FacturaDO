import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem]),
    BullModule.registerQueue({ name: 'invoices' }),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
