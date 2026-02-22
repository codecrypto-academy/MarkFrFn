'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ethers } from 'ethers';
import {
  getReadProvider, getEuroTokenContract, getPaymentGatewayContract,
  eurToUnits, unitsToEur, CHAIN_ID, PAYMENT_GATEWAY_ADDRESS,
} from '@/lib/contracts';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface PaymentParams {
  merchantAddress: string;
  amount: number;
  invoiceId: number;
  date: string;
  redirectUrl: string;
}

type Status = 'idle' | 'connecting' | 'approving' | 'paying' | 'success' | 'error';

// ─── Componente principal (envuelto en Suspense para useSearchParams) ─────────
function PaymentPage() {
  const params = useSearchParams();

  const payParams: PaymentParams = {
    merchantAddress: params.get('merchant_address') ?? '',
    amount:          parseFloat(params.get('amount') ?? '0'),
    invoiceId:       parseInt(params.get('invoice') ?? '0'),
    date:            params.get('date') ?? '',
    redirectUrl:     params.get('redirect') ?? '',
  };

  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  // Auto-conectar silenciosamente al montar si MetaMask ya autorizó el sitio
  useEffect(() => {
    if (!window.ethereum) return;
    (async () => {
      try {
        const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== CHAIN_ID) return;
        const signer = await provider.getSigner();
        setAddress(await signer.getAddress());
      } catch { /* silently ignore */ }
    })();
  }, []);

  // Cargar balance cuando hay wallet conectada
  useEffect(() => {
    if (!address) return;
    const fetch = async () => {
      const contract = getEuroTokenContract(getReadProvider());
      const raw = await contract.balanceOf(address);
      setBalance(unitsToEur(raw));
    };
    fetch();
  }, [address]);

  const connect = async () => {
    if (!window.ethereum) { setMessage('Instala MetaMask para continuar.'); return; }
    setStatus('connecting');
    setMessage('');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        setMessage(`Red incorrecta. Conecta a Anvil Local (chainId ${CHAIN_ID}).`);
        setStatus('error');
        return;
      }
      const signer = await provider.getSigner();
      setAddress(await signer.getAddress());
      setStatus('idle');
    } catch {
      setMessage('Error al conectar MetaMask.');
      setStatus('error');
    }
  };

  const pay = async () => {
    if (!window.ethereum || !address) return;
    const amountUnits = eurToUnits(payParams.amount);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer   = await provider.getSigner();

    try {
      // 1. Approve
      setStatus('approving');
      setMessage('Aprobando gasto de tokens… confirma en MetaMask.');
      const token = getEuroTokenContract(signer);
      const approveTx = await token.approve(PAYMENT_GATEWAY_ADDRESS, amountUnits);
      await approveTx.wait();

      // 2. processPayment
      setStatus('paying');
      setMessage('Procesando pago… confirma en MetaMask.');
      const gateway = getPaymentGatewayContract(signer);
      const payTx = await gateway.processPayment(BigInt(payParams.invoiceId));
      const receipt = await payTx.wait();
      setTxHash(receipt.hash);

      setStatus('success');
      setMessage('¡Pago completado! Redirigiendo…');

      // Redirigir a la tienda
      if (payParams.redirectUrl) {
        setTimeout(() => {
          window.location.href = payParams.redirectUrl;
        }, 2500);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error en la transacción');
      setStatus('error');
    }
  };

  const hasSufficientBalance = balance !== null && balance >= payParams.amount;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">💳 Pasarela de Pago</h1>
          <p className="text-gray-400 text-sm mt-1">Powered by EuroToken (EURT)</p>
        </div>

        {/* Detalles del pago */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-3">
          <h2 className="font-semibold text-lg border-b border-gray-700 pb-2">Resumen del pago</h2>
          <Row label="Factura nº" value={`#${payParams.invoiceId}`} />
          <Row label="Comerciante" value={`${payParams.merchantAddress.slice(0,8)}…${payParams.merchantAddress.slice(-4)}`} />
          <Row label="Fecha" value={payParams.date} />
          <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
            <span className="text-gray-400">Total</span>
            <span className="text-2xl font-bold text-green-400">
              {payParams.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} EURT
            </span>
          </div>
        </div>

        {/* Wallet y balance */}
        {!address ? (
          <button
            onClick={connect}
            disabled={status === 'connecting'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition"
          >
            {status === 'connecting' ? 'Conectando…' : 'Conectar MetaMask'}
          </button>
        ) : (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Wallet conectada</span>
              <span className="font-mono text-sm">{address.slice(0,6)}…{address.slice(-4)}</span>
            </div>
            {balance !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Tu balance EURT</span>
                <span className={`font-semibold ${hasSufficientBalance ? 'text-green-400' : 'text-red-400'}`}>
                  {balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} EURT
                </span>
              </div>
            )}
            {!hasSufficientBalance && balance !== null && (
              <p className="text-yellow-400 text-sm">
                Saldo insuficiente.{' '}
                <a href="http://localhost:6001" className="underline">Compra más tokens aquí.</a>
              </p>
            )}
          </div>
        )}

        {/* Botón de pago */}
        {address && status !== 'success' && (
          <button
            onClick={pay}
            disabled={!hasSufficientBalance || ['approving', 'paying'].includes(status)}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition"
          >
            {status === 'approving' ? 'Aprobando tokens…'
              : status === 'paying' ? 'Procesando pago…'
              : `Pagar ${payParams.amount} EURT`}
          </button>
        )}

        {/* Estado */}
        {status === 'success' && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center space-y-2">
            <p className="text-green-400 font-semibold text-lg">✅ Pago completado</p>
            {txHash && (
              <p className="text-xs text-gray-400 font-mono break-all">Tx: {txHash}</p>
            )}
            <p className="text-sm text-gray-400">Redirigiendo a la tienda…</p>
          </div>
        )}
        {status === 'error' && message && (
          <p className="text-red-400 text-sm text-center">{message}</p>
        )}
        {['approving', 'paying'].includes(status) && message && (
          <p className="text-blue-400 text-sm text-center">{message}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-sm font-mono">{value}</span>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Cargando…</p></div>}>
      <PaymentPage />
    </Suspense>
  );
}
