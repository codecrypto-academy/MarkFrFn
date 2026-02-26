'use client';

import { useCompanyInvoices, unitsToEur } from '@/hooks/useContract';

export default function InvoicesPanel({ companyId }: { companyId: bigint }) {
  const { invoices, loading } = useCompanyInvoices(companyId);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Facturas ({invoices.length})</h3>
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando facturas…</p>
      ) : invoices.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay facturas aún.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.invoiceId.toString()} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Factura #{inv.invoiceId.toString()}</p>
                  <p className="text-sm text-gray-400 font-mono mt-1">
                    Cliente: {inv.customerAddress.slice(0,8)}…{inv.customerAddress.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(Number(inv.timestamp) * 1000).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-lg font-bold text-white">
                    {unitsToEur(inv.totalAmount).toFixed(2)} EURT
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    inv.isPaid
                      ? 'text-green-400 border-green-700 bg-green-900/30'
                      : 'text-yellow-400 border-yellow-700 bg-yellow-900/30'
                  }`}>
                    {inv.isPaid ? '✅ Pagada' : '⏳ Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
