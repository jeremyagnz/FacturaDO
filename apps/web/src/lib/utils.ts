import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = 'DOP',
  locale = 'es-DO',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, locale = 'es-DO'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(date));
}

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

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
