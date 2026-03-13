import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'invoice_id' })
  @Index()
  invoiceId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'integer' })
  lineNumber: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code?: string;

  @Column({ type: 'varchar', length: 1000 })
  description: string;

  @Column({ type: 'numeric', precision: 18, scale: 4, default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string;

  @Column({ type: 'numeric', precision: 18, scale: 4, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 18, name: 'tax_rate' })
  taxRate: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, name: 'discount_rate' })
  discountRate: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'subtotal' })
  subtotal: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, name: 'total_amount' })
  totalAmount: number;
}
