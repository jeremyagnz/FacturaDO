import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { reportsService } from '@/services/reports.service';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';

export function DashboardPage() {
  const { selectedCompanyId, user } = useAuthStore();
  const companyId = selectedCompanyId ?? user?.companies?.[0]?.id ?? '';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', companyId],
    queryFn: () => reportsService.getDashboardStats(companyId),
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Sin empresa seleccionada</h2>
        <p className="text-muted-foreground mt-2">
          Crea o selecciona una empresa para ver el dashboard.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Facturas',
      value: stats?.totalInvoices?.toLocaleString('es-DO') ?? '0',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ingresos Totales',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'ITBIS Total',
      value: formatCurrency(stats?.totalTax ?? 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Aceptadas DGII',
      value: stats?.invoicesByStatus?.accepted?.toLocaleString('es-DO') ?? '0',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de facturación electrónica</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-start gap-4">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xl font-bold mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Ingresos Mensuales</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={stats?.monthlyRevenue ?? []}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214.3 31.8% 91.4%)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="hsl(215.4 16.3% 46.9%)"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="hsl(215.4 16.3% 46.9%)"
              tickFormatter={(v: number) => `RD$${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
              labelFormatter={(label: string) => `Mes: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(221.2 83.2% 53.3%)"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Estado de Facturas</h2>
          <div className="space-y-3">
            {Object.entries(stats?.invoicesByStatus ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">
                  {statusLabels[status] ?? status}
                </span>
                <span className="font-medium">{(count as number).toLocaleString('es-DO')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Facturas por Tipo e-CF</h2>
          <div className="space-y-3">
            {Object.entries(stats?.invoicesByType ?? {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo {type}</span>
                <span className="font-medium">{(count as number).toLocaleString('es-DO')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  signed: 'Firmada',
  submitted: 'Enviada a DGII',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
};
