export enum ECFType {
  FACTURA_CREDITO_FISCAL = '31',
  FACTURA_CONSUMIDOR_FINAL = '32',
  NOTA_DEBITO = '33',
  NOTA_CREDITO = '34',
  COMPRAS = '41',
  GASTOS_MENORES = '43',
  REGIMENES_ESPECIALES = '44',
  GUBERNAMENTAL = '45',
  EXPORTACIONES = '46',
  PAGOS_EXTERIOR = '47',
}

export const ECFTypeLabels: Record<ECFType, string> = {
  [ECFType.FACTURA_CREDITO_FISCAL]: 'Factura de Crédito Fiscal',
  [ECFType.FACTURA_CONSUMIDOR_FINAL]: 'Factura de Consumo',
  [ECFType.NOTA_DEBITO]: 'Nota de Débito',
  [ECFType.NOTA_CREDITO]: 'Nota de Crédito',
  [ECFType.COMPRAS]: 'Compras',
  [ECFType.GASTOS_MENORES]: 'Gastos Menores',
  [ECFType.REGIMENES_ESPECIALES]: 'Regímenes Especiales',
  [ECFType.GUBERNAMENTAL]: 'Gubernamental',
  [ECFType.EXPORTACIONES]: 'Exportaciones',
  [ECFType.PAGOS_EXTERIOR]: 'Pagos al Exterior',
};

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

export interface InvoiceItem {
  id: string;
  lineNumber: number;
  code?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  company?: { id: string; name: string; rnc: string };
  ecfNumber?: string;
  ecfType: ECFType;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  buyerRnc?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerEmail?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  digitalSignature?: string;
  signedAt?: string;
  dgiiTrackingId?: string;
  submittedAt?: string;
  acceptedAt?: string;
  xmlPath?: string;
  pdfPath?: string;
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceItemDto {
  lineNumber: number;
  code?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  discountRate?: number;
}

export interface CreateInvoiceDto {
  companyId: string;
  ecfType: ECFType;
  issueDate: string;
  dueDate?: string;
  buyerRnc?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerEmail?: string;
  paymentMethod?: PaymentMethod;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  items: CreateInvoiceItemDto[];
}

export interface InvoiceListResponse {
  data: Invoice[];
  total: number;
}

export interface InvoiceQueryParams {
  companyId?: string;
  status?: string;
  ecfType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
