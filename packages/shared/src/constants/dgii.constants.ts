/**
 * DGII Constants for Dominican Republic e-CF system
 */

// ITBIS (VAT) rates in Dominican Republic
export const ITBIS_STANDARD_RATE = 18; // 18%
export const ITBIS_REDUCED_RATE = 16;  // 16% for specific goods
export const ITBIS_EXEMPT_RATE = 0;    // Exempt

// Unit of measure codes (DGII standard)
export const UNIT_CODES = {
  UNIT: '43',      // Unidad
  SERVICE: '50',   // Servicio
  KG: '22',        // Kilogramo
  LITER: '27',     // Litro
  METER: '34',     // Metro
  BOX: '21',       // Caja
  DOZEN: '24',     // Docena
  HOUR: '26',      // Hora
  DAY: '25',       // Día
} as const;

// Transaction types
export const TRANSACTION_TYPES = {
  SALE: '1',
  VOID: '2',
  RETURN: '3',
} as const;

// Currency codes used in DR
export const CURRENCY_CODES = ['DOP', 'USD', 'EUR'] as const;

// DGII environment URLs
export const DGII_URLS = {
  SANDBOX: 'https://ecf.dgii.gov.do/testecf',
  PRODUCTION: 'https://ecf.dgii.gov.do',
  RNC_LOOKUP: 'https://dgii.gov.do/app/WebApps/ConsultasWeb',
} as const;

// Maximum sizes for e-CF
export const ECF_LIMITS = {
  MAX_ITEMS: 999,
  MAX_NCF_SEQUENCE: 99999999,
  MAX_AMOUNT: 999999999999.99,
} as const;
