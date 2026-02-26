'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import {
  getReadProvider, getMainContract, getCartContract, getInvoiceContract,
  CartItem, Product, unitsToEur, PAYMENT_GATEWAY_URL,
} from '@/lib/contracts';
import ConnectWallet from '@/components/ConnectWallet';

export default function CartPage() {
  const { address, signer } = useWallet();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCart = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const main = getMainContract(getReadProvider());
      const items: CartItem[] = (await main.getCart(address)) as unknown as CartItem[];
      setCartItems(items);

      // Cargar todos los productos para obtener nombres y companyId
      const allProducts: Product[] = (await main.getAllProducts()) as unknown as Product[];
      const map = new Map<string, Product>();
      allProducts.forEach((p) => map.set(p.productId.toString(), p));
      setProducts(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (address) fetchCart(); }, [address]);

  const removeItem = async (productId: bigint) => {
    if (!signer) return;
    try {
      const main = getMainContract(getReadProvider());
      const cartAddr: string = await main.shoppingCart();
      const cart = getCartContract(cartAddr, signer);
      const tx = await cart.removeFromCart(productId);
      await tx.wait();
      await fetchCart();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al quitar producto');
    }
  };

  const checkout = async () => {
    if (!signer || !address || cartItems.length === 0) return;

    // Asumir que todos los items son de la misma empresa (primer item)
    const firstItem = cartItems[0];
    const product = products.get(firstItem.productId.toString());
    if (!product) return;

    setCheckingOut(true);
    setMessage('');
    try {
      // 1. Crear factura en blockchain
      const main = getMainContract(getReadProvider());
      const invoiceAddr: string = await main.invoiceSystem();
      const invoiceContract = getInvoiceContract(invoiceAddr, signer);
      const tx = await invoiceContract.createInvoice(product.companyId);
      const receipt = await tx.wait();

      // 2. Obtener invoiceId del evento o leerlo del contrato
      const invoices: bigint[] = (await main.getCustomerInvoices(address)) as unknown as bigint[];
      const invoiceId = invoices[invoices.length - 1];
      const invoice = await main.getInvoice(invoiceId);

      // 3. Construir URL de pasarela
      const params = new URLSearchParams({
        merchant_address: invoice.companyAddress,
        amount: unitsToEur(invoice.totalAmount).toFixed(2),
        invoice: invoiceId.toString(),
        date: new Date().toISOString().split('T')[0],
        redirect: 'http://localhost:6004/orders',
      });

      // 4. Redirigir a la pasarela
      window.location.href = `${PAYMENT_GATEWAY_URL}?${params.toString()}`;
    } catch (err: unknown) {
      setCheckingOut(false);
      setMessage(err instanceof Error ? err.message : 'Error en el checkout');
    }
  };

  const total = cartItems.reduce((sum, item) => sum + unitsToEur(item.unitPrice) * Number(item.quantity), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition text-sm">← Tienda</Link>
          <h1 className="text-xl font-bold">🛒 Carrito</h1>
        </div>
        <ConnectWallet />
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {!address ? (
          <p className="text-gray-400 text-center py-12">Conecta MetaMask para ver tu carrito.</p>
        ) : loading ? (
          <p className="text-gray-500 text-center py-12">Cargando carrito…</p>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-400">Tu carrito está vacío.</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">Ver productos →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => {
              const p = products.get(item.productId.toString());
              return (
                <div key={item.productId.toString()} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p?.name ?? `Producto #${item.productId}`}</p>
                    <p className="text-sm text-gray-400">
                      {item.quantity.toString()} × {unitsToEur(item.unitPrice).toFixed(2)} EURT
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">
                      {(unitsToEur(item.unitPrice) * Number(item.quantity)).toFixed(2)} EURT
                    </span>
                    <button onClick={() => removeItem(item.productId)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-2 py-1 rounded transition">
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
              <span className="font-semibold text-lg">Total</span>
              <span className="text-2xl font-bold text-green-400">{total.toFixed(2)} EURT</span>
            </div>

            {message && <p className="text-red-400 text-sm">{message}</p>}

            <button
              onClick={checkout}
              disabled={checkingOut}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition"
            >
              {checkingOut ? 'Procesando…' : 'Pagar ahora →'}
            </button>
            <p className="text-xs text-gray-600 text-center">
              Se creará una factura en blockchain y se redirigirá a la pasarela de pago.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
