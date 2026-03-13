import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import { invoicesService } from '@/services/invoices.service';
import { useAuthStore } from '@/store/auth.store';
import {
  InvoiceStatus,
  ECFTypeLabels,
  type InvoiceQueryParams,
} from '@/types/invoice.types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const statusConfig: Record<InvoiceStatus, { label: string; icon: React.ElementType; className: string }> = {
  [InvoiceStatus.DRAFT]: { label: 'Borrador', icon: FileText, className: 'bg-gray-100 text-gray-600' },
  [InvoiceStatus.SIGNED]: { label: 'Firmada', icon: CheckCircle, className: 'bg-blue-100 text-blue-700' },
  [InvoiceStatus.SUBMITTED]: { label: 'Enviada', icon: Send, className: 'bg-yellow-100 text-yellow-700' },
  [InvoiceStatus.ACCEPTED]: { label: 'Aceptada', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
  [InvoiceStatus.REJECTED]: { label: 'Rechazada', icon: XCircle, className: 'bg-red-100 text-red-700' },
  [InvoiceStatus.CANCELLED]: { label: 'Cancelada', icon: AlertCircle, className: 'bg-gray-100 text-gray-500' },
};

export function InvoicesPage() {
  const { selectedCompanyId, user } = useAuthStore();
  const companyId = selectedCompanyId ?? user?.companies?.[0]?.id ?? '';

  const [params, setParams] = useState<InvoiceQueryParams>({
    companyId,
    page: 1,
    limit: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesService.list(params),
    enabled: !!companyId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturas Electrónicas (e-CF)</h1>
          <p className="text-muted-foreground">Gestión de comprobantes fiscales electrónicos</p>
        </div>
        <Link
          to="/invoices/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Factura
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por NCF, cliente, RNC..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))}
        >
          <option value="">Todos los estados</option>
          {Object.values(InvoiceStatus).map((s) => (
            <option key={s} value={s}>{statusConfig[s]?.label}</option>
          ))}
        </select>
        <input
          type="date"
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          onChange={(e) => setParams((p) => ({ ...p, dateFrom: e.target.value, page: 1 }))}
        />
        <input
          type="date"
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          onChange={(e) => setParams((p) => ({ ...p, dateTo: e.target.value, page: 1 }))}
        />
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {['NCF', 'Tipo', 'Fecha', 'Cliente', 'Total', 'ITBIS', 'Estado'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                data?.data.map((invoice) => {
                  const status = statusConfig[invoice.status];
                  const StatusIcon = status?.icon ?? FileText;

                  return (
                    <tr key={invoice.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">
                        {invoice.ecfNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {ECFTypeLabels[invoice.ecfType] ?? invoice.ecfType}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">{invoice.buyerName ?? '—'}</p>
                        {invoice.buyerRnc && (
                          <p className="text-xs text-muted-foreground">{invoice.buyerRnc}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatCurrency(invoice.taxAmount, invoice.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            status?.className,
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="text-primary text-xs hover:underline"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!isLoading && data?.data.length === 0 && (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold">Sin facturas</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Crea tu primera factura electrónica.
            </p>
          </div>
        )}

        {/* Pagination */}
        {(data?.total ?? 0) > (params.limit ?? 20) && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              {data?.total} facturas en total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                disabled={(params.page ?? 1) <= 1}
                className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                disabled={
                  (params.page ?? 1) * (params.limit ?? 20) >= (data?.total ?? 0)
                }
                className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
