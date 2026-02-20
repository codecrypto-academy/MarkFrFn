'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getMainContract, getProductCatalogContract, getReadProvider, Product, unitsToEur, eurToUnits } from '@/lib/contracts';

export default function ProductsPanel({ companyId }: { companyId: bigint }) {
  const { signer } = useWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', ipfsImageHash: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const main = getMainContract(getReadProvider());
      const ps = await main.getCompanyProducts(companyId);
      setProducts(ps as unknown as Product[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [companyId]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) return;
    setSubmitting(true);
    setMessage('');
    try {
      const main = getMainContract(getReadProvider());
      const catalogAddr: string = await main.productCatalog();
      const catalog = getProductCatalogContract(catalogAddr, signer);
      const tx = await catalog.addProduct(
        companyId,
        form.name.trim(),
        form.description.trim(),
        eurToUnits(parseFloat(form.price)),
        BigInt(parseInt(form.stock)),
        form.ipfsImageHash.trim() || '',
      );
      await tx.wait();
      setMessage('✅ Producto agregado.');
      setForm({ name: '', description: '', price: '', stock: '', ipfsImageHash: '' });
      setShowForm(false);
      fetchProducts();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Productos ({products.length})</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition">
          {showForm ? 'Cancelar' : '+ Agregar producto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddProduct} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-3">
          <h4 className="font-medium">Nuevo producto</h4>
          <Input label="Nombre *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label="Descripción" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <Input label="Precio (EUR) *" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required min="0.01" step="0.01" />
          <Input label="Stock *" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} required min="0" />
          <Input label="IPFS Image Hash" value={form.ipfsImageHash} onChange={(v) => setForm({ ...form, ipfsImageHash: v })} placeholder="ipfs://..." />
          <button type="submit" disabled={submitting}
            className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg transition">
            {submitting ? 'Guardando…' : 'Guardar producto'}
          </button>
          {message && <p className="text-sm text-green-400">{message}</p>}
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando productos…</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay productos. Agrega el primero.</p>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => (
            <div key={p.productId.toString()} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-400">{p.description}</p>
                <p className="text-xs text-gray-600 mt-1">ID #{p.productId.toString()}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-semibold">{unitsToEur(p.price).toFixed(2)} EURT</p>
                <p className="text-sm text-gray-400">Stock: {p.stock.toString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, required, type = 'text', min, step, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; min?: string; step?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} min={min} step={step} placeholder={placeholder}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
    </div>
  );
}
