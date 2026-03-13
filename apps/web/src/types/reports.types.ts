export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  totalTax: number;
  invoicesByStatus: Record<string, number>;
  invoicesByType: Record<string, number>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
}
