/**
 * e-CF Types as defined by DGII
 * Reference: Norma General 06-2018 and subsequent modifications
 */
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

export enum TaxRate {
  STANDARD = 18,
  REDUCED = 16,
  ZERO = 0,
  EXEMPT = 0,
}
