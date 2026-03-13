import apiClient from './api.client';
import type { Company, CreateCompanyDto, CompanyListResponse } from '@/types/company.types';

export const companiesService = {
  list: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{ data: CompanyListResponse }>('/companies', { params });
    return data.data;
  },

  get: async (id: string): Promise<Company> => {
    const { data } = await apiClient.get<{ data: Company }>(`/companies/${id}`);
    return data.data;
  },

  create: async (dto: CreateCompanyDto): Promise<Company> => {
    const { data } = await apiClient.post<{ data: Company }>('/companies', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<CreateCompanyDto>): Promise<Company> => {
    const { data } = await apiClient.put<{ data: Company }>(`/companies/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },

  addUser: async (companyId: string, userId: string): Promise<void> => {
    await apiClient.post(`/companies/${companyId}/users/${userId}`);
  },

  removeUser: async (companyId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/companies/${companyId}/users/${userId}`);
  },
};
