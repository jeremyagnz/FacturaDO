export interface Company {
  id: string;
  name: string;
  rnc: string;
  commercialName?: string;
  status: CompanyStatus;
  taxRegime: TaxRegime;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  dgiiRegistered: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
}

export enum TaxRegime {
  ORDINARIO = 'ordinario',
  SIMPLIFICADO = 'simplificado',
  RST = 'rst',
}

export interface CreateCompanyDto {
  name: string;
  rnc: string;
  commercialName?: string;
  taxRegime?: TaxRegime;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface CompanyListResponse {
  data: Company[];
  total: number;
}
