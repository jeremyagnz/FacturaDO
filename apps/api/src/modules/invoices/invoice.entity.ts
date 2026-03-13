import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { Company } from '../companies/company.entity';
import { InvoiceItem } from './invoice-item.entity';

/**
 * e-CF Types (Tipos de e-CF) as defined by DGII Dominican Republic
 */
export enum ECFType {
  FACTURA_CREDITO_FISCAL = '31',         // Factura de Crédito Fiscal
  FACTURA_CONSUMIDOR_FINAL = '32',        // Factura de Consumo
  NOTA_DEBITO = '33',                     // Nota de Débito
  NOTA_CREDITO = '34',                    // Nota de Crédito
  COMPRAS = '41',                         // Compras
  GASTOS_MENORES = '43',                  // Gastos Menores
  REGIMENES_ESPECIALES = '44',            // Regímenes Especiales
  GUBERNAMENTAL = '45',                   // Gubernamental
  EXPORTACIONES = '46',                   // Exportaciones
  PAGOS_EXTERIOR = '47',                  // Pagos al Exterior
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SIGNED = 'signed',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'efectivo',
  CHECK = 'cheque',
  BANK_TRANSFER = 'transferencia',
  CREDIT_CARD = 'tarjeta_credito',
  DEBIT_CARD = 'tarjeta_debito',
  CREDIT = 'credito',
  BOND = 'bono',
  SWAP = 'permuta',
  OTHER = 'otro',
}

@Entity('invoices')
@Index(['companyId', 'ecfNumber'], { unique: true, where: '"ecf_number" IS NOT NULL' })
export class Invoice extends BaseEntity {
  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company, (company) => company.invoices, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ecf_number' })
  @Index()
  ecfNumber?: string;

  @Column({ type: 'enum', enum: ECFType })
  ecfType: ECFType;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'date', name: 'issue_date' })
  issueDate: Date;

  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate?: Date;

  // Buyer (cliente) information
  @Column({ type: 'varchar', length: 11, nullable: true, name: 'buyer_rnc' })
  buyerRnc?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'buyer_name' })
  buyerName?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'buyer_address' })
  buyerAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'buyer_email' })
  buyerEmail?: string;

  // Totals
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, name: 'subtotal' })
  subtotal: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'DOP' })
  currency: string;

  @Column({ type: 'numeric', precision: 10, scale: 6, default: 1, name: 'exchange_rate' })
  exchangeRate: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CREDIT })
  paymentMethod: PaymentMethod;

  // Digital signature
  @Column({ type: 'text', nullable: true, name: 'digital_signature' })
  digitalSignature?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'signed_at' })
  signedAt?: Date;

  // DGII integration
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'dgii_tracking_id' })
  dgiiTrackingId?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'accepted_at' })
  acceptedAt?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'dgii_response' })
  dgiiResponse?: Record<string, unknown>;

  // Storage
  @Column({ type: 'varchar', length: 512, nullable: true, name: 'xml_path' })
  xmlPath?: string;

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'pdf_path' })
  pdfPath?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];
}
