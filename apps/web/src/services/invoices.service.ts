import apiClient from './api.client';
import type {
  Invoice,
  CreateInvoiceDto,
  InvoiceListResponse,
  InvoiceQueryParams,
} from '@/types/invoice.types';

export const invoicesService = {
  list: async (params?: InvoiceQueryParams) => {
    const { data } = await apiClient.get<{ data: InvoiceListResponse }>('/invoices', { params });
    return data.data;
  },

  get: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.get<{ data: Invoice }>(`/invoices/${id}`);
    return data.data;
  },

  create: async (dto: CreateInvoiceDto): Promise<Invoice> => {
    const { data } = await apiClient.post<{ data: Invoice }>('/invoices', dto);
    return data.data;
  },

  sign: async (id: string): Promise<void> => {
    await apiClient.post(`/invoices/${id}/sign`);
  },

  submitToDgii: async (id: string): Promise<void> => {
    await apiClient.post(`/invoices/${id}/submit`);
  },

  cancel: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.patch<{ data: Invoice }>(`/invoices/${id}/cancel`);
    return data.data;
  },
};
