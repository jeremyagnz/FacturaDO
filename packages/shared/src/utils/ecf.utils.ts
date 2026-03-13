import { ECFType } from '../types/ecf.types';

/**
 * Returns the document prefix for a given e-CF type
 */
export function getECFPrefix(ecfType: ECFType): string {
  const prefixes: Record<ECFType, string> = {
    [ECFType.FACTURA_CREDITO_FISCAL]: 'E31',
    [ECFType.FACTURA_CONSUMIDOR_FINAL]: 'E32',
    [ECFType.NOTA_DEBITO]: 'E33',
    [ECFType.NOTA_CREDITO]: 'E34',
    [ECFType.COMPRAS]: 'E41',
    [ECFType.GASTOS_MENORES]: 'E43',
    [ECFType.REGIMENES_ESPECIALES]: 'E44',
    [ECFType.GUBERNAMENTAL]: 'E45',
    [ECFType.EXPORTACIONES]: 'E46',
    [ECFType.PAGOS_EXTERIOR]: 'E47',
  };
  return prefixes[ecfType] ?? 'E31';
}

/**
 * Generates an e-CF number given prefix and sequence number
 * Format: E31{rnc_emisor}{sequence:8d}
 */
export function generateECFNumber(
  ecfType: ECFType,
  rnc: string,
  sequence: number,
): string {
  const prefix = getECFPrefix(ecfType);
  const cleanRnc = rnc.replace(/\D/g, '').padEnd(11, '0').slice(0, 11);
  const seq = sequence.toString().padStart(8, '0');
  return `${prefix}${cleanRnc}${seq}`;
}

/**
 * Validates an e-CF number format
 */
export function isValidECFNumber(ecfNumber: string): boolean {
  return /^E[0-9]{2}\d{11}\d{8}$/.test(ecfNumber);
}
