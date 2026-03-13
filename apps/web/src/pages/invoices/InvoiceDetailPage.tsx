import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, PenLine, XCircle, Download } from 'lucide-react';
import { invoicesService } from '@/services/invoices.service';
import { InvoiceStatus, ECFTypeLabels } from '@/types/invoice.types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesService.get(id!),
    enabled: !!id,
  });

  const signMutation = useMutation({
    mutationFn: () => invoicesService.sign(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  const submitMutation = useMutation({
    mutationFn: () => invoicesService.submitToDgii(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoicesService.cancel(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {invoice.ecfNumber ? `e-CF ${invoice.ecfNumber}` : 'Factura Borrador'}
          </h1>
          <p className="text-muted-foreground">
            {ECFTypeLabels[invoice.ecfType]} · {formatDate(invoice.issueDate)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {invoice.status === InvoiceStatus.DRAFT && (
            <button
              onClick={() => signMutation.mutate()}
              disabled={signMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <PenLine className="h-4 w-4" />
              Firmar
            </button>
          )}
          {invoice.status === InvoiceStatus.SIGNED && (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Enviar a DGII
            </button>
          )}
          {invoice.xmlPath && (
            <button className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-muted transition-colors">
              <Download className="h-4 w-4" />
              XML
            </button>
          )}
          {![InvoiceStatus.CANCELLED, InvoiceStatus.ACCEPTED].includes(invoice.status) && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Invoice details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Información del Emisor
          </h2>
          <div className="space-y-2">
            <p className="font-semibold">{invoice.company?.name}</p>
            <p className="text-sm text-muted-foreground">RNC: {invoice.company?.rnc}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Información del Comprador
          </h2>
          <div className="space-y-2">
            <p className="font-semibold">{invoice.buyerName ?? '—'}</p>
            {invoice.buyerRnc && (
              <p className="text-sm text-muted-foreground">RNC: {invoice.buyerRnc}</p>
            )}
            {invoice.buyerEmail && (
              <p className="text-sm text-muted-foreground">{invoice.buyerEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Detalle de Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Desc.', 'ITBIS', 'Total'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 text-muted-foreground">{item.lineNumber}</td>
                  <td className="px-4 py-3">
                    {item.code && (
                      <p className="text-xs text-muted-foreground">{item.code}</p>
                    )}
                    <p>{item.description}</p>
                  </td>
                  <td className="px-4 py-3">{item.quantity} {item.unit ?? ''}</td>
                  <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3">
                    {item.discountRate > 0 ? `${item.discountRate}%` : '—'}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(item.taxAmount)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t px-6 py-4">
          <div className="flex flex-col items-end gap-2">
            <div className="flex justify-between w-64 text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between w-64 text-sm text-green-600">
                <span>Descuento:</span>
                <span>-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 text-sm">
              <span className="text-muted-foreground">ITBIS (18%):</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between w-64 font-bold text-base border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
