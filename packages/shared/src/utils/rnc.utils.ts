/**
 * RNC (Registro Nacional del Contribuyente) utility functions
 */

/**
 * Validates a Dominican RNC (9 digits) or cedula (11 digits)
 */
export function isValidRnc(rnc: string): boolean {
  const clean = rnc.replace(/\D/g, '');
  if (clean.length !== 9 && clean.length !== 11) return false;

  if (clean.length === 9) {
    return validateRnc9(clean);
  }
  return validateCedula11(clean);
}

function validateRnc9(rnc: string): boolean {
  const weights = [7, 9, 8, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    sum += parseInt(rnc[i], 10) * weights[i];
  }

  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit === parseInt(rnc[8], 10);
}

function validateCedula11(cedula: string): boolean {
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    let product = parseInt(cedula[i], 10) * weights[i];
    if (product >= 10) product -= 9;
    sum += product;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cedula[10], 10);
}

/**
 * Formats an RNC/cedula with dashes for display
 */
export function formatRnc(rnc: string): string {
  const clean = rnc.replace(/\D/g, '');
  if (clean.length === 9) {
    return `${clean.slice(0, 1)}-${clean.slice(1, 8)}-${clean.slice(8)}`;
  }
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 10)}-${clean.slice(10)}`;
  }
  return rnc;
}

/**
 * Cleans RNC by removing non-digit characters
 */
export function cleanRnc(rnc: string): string {
  return rnc.replace(/\D/g, '');
}
