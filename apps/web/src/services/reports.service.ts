import apiClient from './api.client';
import type { DashboardStats } from '@/types/reports.types';

export const reportsService = {
  getDashboardStats: async (companyId: string): Promise<DashboardStats> => {
    const { data } = await apiClient.get<{ data: DashboardStats }>(
      `/reports/dashboard/${companyId}`,
    );
    return data.data;
  },

  getInvoiceSummary: async (
    companyId: string,
    params: { dateFrom: string; dateTo: string; ecfType?: string; status?: string },
  ) => {
    const { data } = await apiClient.get(`/reports/summary/${companyId}`, { params });
    return data.data;
  },

  get606Report: async (companyId: string, year: number, month: number) => {
    const { data } = await apiClient.get(`/reports/606/${companyId}`, {
      params: { year, month },
    });
    return data.data;
  },

  get607Report: async (companyId: string, year: number, month: number) => {
    const { data } = await apiClient.get(`/reports/607/${companyId}`, {
      params: { year, month },
    });
    return data.data;
  },
};
