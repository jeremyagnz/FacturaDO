import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { reportsService } from '@/services/reports.service';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';

export function ReportsPage() {
  const { selectedCompanyId, user } = useAuthStore();
  const companyId = selectedCompanyId ?? user?.companies?.[0]?.id ?? '';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: report607, isLoading: loading607 } = useQuery({
    queryKey: ['report-607', companyId, year, month],
    queryFn: () => reportsService.get607Report(companyId, year, month),
    enabled: !!companyId,
  });

  const { data: report606, isLoading: loading606 } = useQuery({
    queryKey: ['report-606', companyId, year, month],
    queryFn: () => reportsService.get606Report(companyId, year, month),
    enabled: !!companyId,
  });

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes DGII</h1>
          <p className="text-muted-foreground">
            Reportes 606, 607 y análisis de facturación
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 607 Report */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Reporte 607 — Ventas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Facturas de crédito fiscal y consumo emitidas
            </p>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['NCF', 'Tipo', 'Fecha', 'RNC Comprador', 'Cliente', 'Monto', 'ITBIS', 'Total'].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading607 &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading607 &&
                (report607 as Array<Record<string, unknown>>)?.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{row['ncf'] as string ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{row['tipo_ncf'] as string ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{row['fecha_comprobante'] as string ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{row['rnc_cedula_comprador'] as string ?? '—'}</td>
                    <td className="px-4 py-3">{row['nombre_comprador'] as string ?? '—'}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(row['monto_facturado_servicios']) || 0)}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(row['itbis_facturado']) || 0)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(row['monto_total']) || 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!loading607 && (!report607 || (report607 as unknown[]).length === 0) && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Sin datos para el período seleccionado
            </div>
          )}
        </div>
      </div>

      {/* 606 Report */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Reporte 606 — Compras</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compras y gastos registrados en el período
            </p>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['RNC Proveedor', 'Proveedor', 'Monto Total', 'ITBIS Facturado'].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading606 &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading606 &&
                (report606 as Array<Record<string, unknown>>)?.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{row['rnc_proveedor'] as string ?? '—'}</td>
                    <td className="px-4 py-3">{row['nombre_proveedor'] as string ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(row['monto_total']) || 0)}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(row['itbis_facturado']) || 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!loading606 && (!report606 || (report606 as unknown[]).length === 0) && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Sin datos para el período seleccionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
