// ABIs mínimos para la pasarela de pago

export const EUROTOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

export const PAYMENT_GATEWAY_ABI = [
  {
    name: 'processPayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'PaymentProcessed',
    type: 'event',
    inputs: [
      { name: 'invoiceId', type: 'uint256', indexed: true },
      { name: 'customer', type: 'address', indexed: true },
      { name: 'company', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;
