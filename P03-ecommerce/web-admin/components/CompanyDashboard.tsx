'use client';

import { useState } from 'react';
import { Company } from '@/lib/contracts';
import ProductsPanel from './ProductsPanel';
import InvoicesPanel from './InvoicesPanel';

type Tab = 'products' | 'invoices';

export default function CompanyDashboard({ company }: { company: Company }) {
  const [tab, setTab] = useState<Tab>('products');

  return (
    <div className="space-y-6">
      {/* Info empresa */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{company.name}</h2>
          <p className="text-gray-400 text-sm">{company.description}</p>
          <p className="text-xs text-gray-600 mt-1 font-mono">ID #{company.companyId.toString()} · {company.companyAddress.slice(0,8)}…</p>
        </div>
        <span className="text-green-400 text-sm font-medium bg-green-900/30 border border-green-700 px-3 py-1 rounded-full">
          Activa
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['products', 'invoices'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t === 'products' ? 'Productos' : 'Facturas'}
          </button>
        ))}
      </div>

      {tab === 'products' && <ProductsPanel companyId={company.companyId} />}
      {tab === 'invoices' && <InvoicesPanel companyId={company.companyId} />}
    </div>
  );
}
