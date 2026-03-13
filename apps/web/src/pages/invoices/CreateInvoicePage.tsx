import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesService } from '@/services/invoices.service';
import { useAuthStore } from '@/store/auth.store';
import { ECFType, ECFTypeLabels, PaymentMethod } from '@/types/invoice.types';
import { formatCurrency } from '@/lib/utils';

const itemSchema = z.object({
  lineNumber: z.number().min(1),
  description: z.string().min(1, 'Descripción requerida'),
  code: z.string().optional(),
  quantity: z.number().min(0.0001, 'Cantidad debe ser mayor a 0'),
  unit: z.string().optional(),
  unitPrice: z.number().min(0, 'Precio debe ser mayor o igual a 0'),
  taxRate: z.number().min(0).max(100).optional().default(18),
  discountRate: z.number().min(0).max(100).optional().default(0),
});

const createInvoiceSchema = z.object({
  ecfType: z.nativeEnum(ECFType),
  issueDate: z.string().min(1, 'Fecha de emisión requerida'),
  dueDate: z.string().optional(),
  buyerRnc: z.string().optional(),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email().optional().or(z.literal('')),
  buyerAddress: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.CREDIT),
  currency: z.string().length(3).optional().default('DOP'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Debe agregar al menos un item'),
});

type CreateInvoiceForm = z.infer<typeof createInvoiceSchema>;

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedCompanyId, user } = useAuthStore();
  const companyId = selectedCompanyId ?? user?.companies?.[0]?.id ?? '';

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceForm>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      ecfType: ECFType.FACTURA_CREDITO_FISCAL,
      issueDate: new Date().toISOString().split('T')[0],
      paymentMethod: PaymentMethod.CREDIT,
      currency: 'DOP',
      items: [
        {
          lineNumber: 1,
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 18,
          discountRate: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  const totals = items.reduce(
    (acc, item) => {
      const sub = (item.quantity ?? 0) * (item.unitPrice ?? 0);
      const disc = sub * ((item.discountRate ?? 0) / 100);
      const taxable = sub - disc;
      const tax = taxable * ((item.taxRate ?? 18) / 100);
      return {
        subtotal: acc.subtotal + sub,
        discountAmount: acc.discountAmount + disc,
        taxAmount: acc.taxAmount + tax,
        totalAmount: acc.totalAmount + taxable + tax,
      };
    },
    { subtotal: 0, discountAmount: 0, taxAmount: 0, totalAmount: 0 },
  );

  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceForm) =>
      invoicesService.create({
        ...data,
        companyId,
        items: data.items.map((item, i) => ({ ...item, lineNumber: i + 1 })),
      }),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/invoices/${invoice.id}`);
    },
  });

  const onSubmit = (data: CreateInvoiceForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Nueva Factura Electrónica</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice header */}
        <div className="bg-white border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="col-span-full font-semibold">Datos del Comprobante</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo e-CF</label>
            <select
              {...register('ecfType')}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {Object.values(ECFType).map((type) => (
                <option key={type} value={type}>
                  {ECFTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Emisión</label>
            <input
              type="date"
              {...register('issueDate')}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Forma de Pago</label>
            <select
              {...register('paymentMethod')}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {Object.entries(PaymentMethod).map(([key, val]) => (
                <option key={key} value={val}>
                  {val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Moneda</label>
            <select
              {...register('currency')}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="DOP">DOP — Peso Dominicano</option>
              <option value="USD">USD — Dólar Americano</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>

        {/* Buyer info */}
        <div className="bg-white border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="col-span-full font-semibold">Datos del Comprador</h2>

          {[
            { name: 'buyerRnc', label: 'RNC / Cédula', placeholder: '130000001' },
            { name: 'buyerName', label: 'Razón Social', placeholder: 'Empresa Cliente SRL' },
            { name: 'buyerEmail', label: 'Correo Electrónico', placeholder: 'cliente@empresa.do' },
            { name: 'buyerAddress', label: 'Dirección', placeholder: 'Av. 27 de Febrero #200' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input
                {...register(name as keyof CreateInvoiceForm)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {errors[name as keyof CreateInvoiceForm] && (
                <p className="mt-1 text-xs text-destructive">
                  {errors[name as keyof CreateInvoiceForm]?.message as string}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Items</h2>
            <button
              type="button"
              onClick={() =>
                append({
                  lineNumber: fields.length + 1,
                  description: '',
                  quantity: 1,
                  unitPrice: 0,
                  taxRate: 18,
                  discountRate: 0,
                })
              }
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              Agregar item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {['Descripción', 'Cant.', 'Precio', 'ITBIS%', 'Desc%', 'Total', ''].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const item = items[index];
                  const sub = (item?.quantity ?? 0) * (item?.unitPrice ?? 0);
                  const disc = sub * ((item?.discountRate ?? 0) / 100);
                  const tax = (sub - disc) * ((item?.taxRate ?? 18) / 100);
                  const total = sub - disc + tax;

                  return (
                    <tr key={field.id} className="border-b">
                      <td className="px-3 py-2">
                        <input
                          {...register(`items.${index}.description`)}
                          placeholder="Descripción del producto/servicio"
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 min-w-[200px]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          className="w-20 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                          className="w-28 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                          className="w-16 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          {...register(`items.${index}.discountRate`, { valueAsNumber: true })}
                          className="w-16 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t px-6 py-4">
            <div className="flex flex-col items-end gap-2">
              {[
                { label: 'Subtotal:', value: totals.subtotal },
                { label: 'Descuento:', value: -totals.discountAmount },
                { label: 'ITBIS:', value: totals.taxAmount },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between w-64 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{formatCurrency(value)}</span>
                </div>
              ))}
              <div className="flex justify-between w-64 font-bold text-base border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear Factura
          </button>
        </div>
      </form>
    </div>
  );
}
