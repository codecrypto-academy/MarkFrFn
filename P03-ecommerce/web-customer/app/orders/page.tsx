'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { getReadProvider, getMainContract, Invoice, unitsToEur } from '@/lib/contracts';
import ConnectWallet from '@/components/ConnectWallet';

export default function OrdersPage() {
  const { address } = useWallet();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) { setInvoices([]); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const main = getMainContract(getReadProvider());
        const ids: bigint[] = (await main.getCustomerInvoices(address)) as unknown as bigint[];
        const invs = await Promise.all(ids.map((id) => main.getInvoice(id)));
        setInvoices((invs as unknown as Invoice[]).reverse()); // más reciente primero
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 8000); // refresco automático para ver cuando se paga
    return () => clearInterval(interval);
  }, [address]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition text-sm">← Tienda</Link>
          <h1 className="text-xl font-bold">📦 Mis pedidos</h1>
        </div>
        <ConnectWallet />
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {!address ? (
          <p className="text-gray-400 text-center py-12">Conecta MetaMask para ver tus pedidos.</p>
        ) : loading && invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Cargando pedidos…</p>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-gray-400">Todavía no tienes pedidos.</p>
            <Link href="/" className="text-blue-400 text-sm">Empieza a comprar →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.invoiceId.toString()} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pedido #{inv.invoiceId.toString()}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      Empresa: {inv.companyAddress.slice(0,8)}…{inv.companyAddress.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(Number(inv.timestamp) * 1000).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold">
                      {unitsToEur(inv.totalAmount).toFixed(2)} EURT
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      inv.isPaid
                        ? 'text-green-400 border-green-700 bg-green-900/30'
                        : 'text-yellow-400 border-yellow-700 bg-yellow-900/30'
                    }`}>
                      {inv.isPaid ? '✅ Pagado' : '⏳ Pendiente de pago'}
                    </span>
                  </div>
                </div>
                {!inv.isPaid && (
                  <div className="mt-3 border-t border-gray-700 pt-3">
                    <Link
                      href={`http://localhost:6002?merchant_address=${inv.companyAddress}&amount=${unitsToEur(inv.totalAmount).toFixed(2)}&invoice=${inv.invoiceId}&date=${new Date(Number(inv.timestamp)*1000).toISOString().split('T')[0]}&redirect=http://localhost:6004/orders`}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Ir a pagar →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
