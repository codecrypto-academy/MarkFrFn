'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useWallet } from '@/contexts/WalletContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function BuyForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { address } = useWallet();

  const [amount, setAmount] = useState('100');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !address) return;

    const euros = parseFloat(amount);
    if (isNaN(euros) || euros < 1) {
      setMessage('Introduce una cantidad válida (mínimo 1 EUR).');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      // 1. Crear PaymentIntent en el backend
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: euros, walletAddress: address }),
      });
      const { clientSecret, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);

      // 2. Confirmar pago con Stripe
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Formulario de tarjeta no disponible');

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });
      if (stripeError) throw new Error(stripeError.message);

      setStatus('success');
      setMessage(`✅ Pago procesado. Se acreditarán ${euros} EURT a tu wallet en breve.`);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Cantidad a comprar (EUR)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <span className="text-gray-400 text-sm">EUR = {amount} EURT</span>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Datos de tarjeta</label>
        <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3">
          <CardElement options={{ style: { base: { color: '#fff', fontSize: '16px' } } }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Tarjeta de prueba: <span className="font-mono">4242 4242 4242 4242</span> · cualquier fecha futura · cualquier CVC
        </p>
      </div>

      {!address && (
        <p className="text-yellow-400 text-sm">Conecta MetaMask para poder comprar tokens.</p>
      )}

      <button
        type="submit"
        disabled={!stripe || !address || status === 'loading'}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition"
      >
        {status === 'loading' ? 'Procesando…' : `Comprar ${amount} EURT`}
      </button>

      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </form>
  );
}

export default function BuyTokens() {
  return (
    <Elements stripe={stripePromise}>
      <BuyForm />
    </Elements>
  );
}
