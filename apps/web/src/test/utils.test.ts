import { describe, it, expect } from 'vitest';
import { formatCurrency, formatRnc, formatDate } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats DOP currency correctly', () => {
    const result = formatCurrency(1000, 'DOP', 'es-DO');
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('handles zero amount', () => {
    const result = formatCurrency(0, 'DOP', 'es-DO');
    expect(result).toBeDefined();
  });
});

describe('formatRnc', () => {
  it('formats 9-digit RNC with dashes', () => {
    const result = formatRnc('130000001');
    expect(result).toBe('1-3000000-1');
  });

  it('formats 11-digit cedula with dashes', () => {
    const result = formatRnc('00100000001');
    expect(result).toBe('001-0000000-1');
  });

  it('returns original if invalid length', () => {
    const result = formatRnc('123');
    expect(result).toBe('123');
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2025-01-15', 'es-DO');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
