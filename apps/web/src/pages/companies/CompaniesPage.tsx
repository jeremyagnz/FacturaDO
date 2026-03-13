import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Building2, CheckCircle, Clock } from 'lucide-react';
import { companiesService } from '@/services/companies.service';
import { CompanyStatus } from '@/types/company.types';
import { formatRnc } from '@/lib/utils';
import { cn } from '@/lib/utils';

const statusConfig: Record<CompanyStatus, { label: string; className: string }> = {
  [CompanyStatus.ACTIVE]: { label: 'Activa', className: 'bg-green-100 text-green-700' },
  [CompanyStatus.INACTIVE]: { label: 'Inactiva', className: 'bg-gray-100 text-gray-600' },
  [CompanyStatus.SUSPENDED]: { label: 'Suspendida', className: 'bg-red-100 text-red-700' },
  [CompanyStatus.PENDING_APPROVAL]: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-700',
  },
};

export function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [, setShowCreateModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search],
    queryFn: () => companiesService.list({ search: search || undefined }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas (RNC)</h1>
          <p className="text-muted-foreground">Gestión de empresas para facturación</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Empresa
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o RNC..."
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Companies list */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((company) => (
            <div key={company.id} className="bg-white border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{formatRnc(company.rnc)}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    statusConfig[company.status]?.className,
                  )}
                >
                  {statusConfig[company.status]?.label}
                </span>
              </div>

              {company.city && (
                <p className="text-xs text-muted-foreground">{company.city}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground capitalize">
                  {company.taxRegime}
                </span>
                <div className="flex items-center gap-1">
                  {company.dgiiRegistered ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {company.dgiiRegistered ? 'DGII' : 'Sin DGII'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.data.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold">Sin empresas</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Crea tu primera empresa para comenzar a facturar.
          </p>
        </div>
      )}
    </div>
  );
}
