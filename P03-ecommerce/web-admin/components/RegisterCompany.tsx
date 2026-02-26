'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getMainContract, getCompanyRegistryContract, getReadProvider } from '@/lib/contracts';
import { ethers } from 'ethers';

export default function RegisterCompany() {
  const { signer } = useWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !name.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      const main = getMainContract(getReadProvider());
      const registryAddr: string = await main.companyRegistry();
      const registry = getCompanyRegistryContract(registryAddr, signer);
      const tx = await registry.registerCompany(name.trim(), description.trim());
      await tx.wait();
      setStatus('success');
      setMessage('✅ Empresa registrada. Recarga la página para ver tu dashboard.');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error al registrar');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Registrar empresa</h2>
          <p className="text-sm text-gray-400 mt-1">Tu wallet no tiene empresa registrada. Crea una para empezar.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre de la empresa *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Mi Tienda Online"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descripción</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Descripción de tu tienda"
            />
          </div>
          <button
            type="submit" disabled={status === 'loading' || !name.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {status === 'loading' ? 'Registrando…' : 'Registrar empresa'}
          </button>
          {message && (
            <p className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
