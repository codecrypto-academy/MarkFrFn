// ABIs mínimos para web-customer

export const ECOMMERCE_MAIN_ABI = [
  { name: 'getAllProducts', type: 'function', stateMutability: 'view', inputs: [],
    outputs: [{ type: 'tuple[]', components: [
      { name: 'productId', type: 'uint256' }, { name: 'companyId', type: 'uint256' },
      { name: 'companyAddress', type: 'address' }, { name: 'name', type: 'string' },
      { name: 'description', type: 'string' }, { name: 'price', type: 'uint256' },
      { name: 'stock', type: 'uint256' }, { name: 'ipfsImageHash', type: 'string' },
      { name: 'isActive', type: 'bool' }, { name: 'createdAt', type: 'uint256' },
    ] }] },
  { name: 'getCart', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'customer', type: 'address' }],
    outputs: [{ type: 'tuple[]', components: [
      { name: 'productId', type: 'uint256' }, { name: 'quantity', type: 'uint256' },
      { name: 'unitPrice', type: 'uint256' },
    ] }] },
  { name: 'getCartTotal', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'customer', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'getCustomerInvoices', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'customer', type: 'address' }], outputs: [{ type: 'uint256[]' }] },
  { name: 'getInvoice', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'invoiceId', type: 'uint256' }, { name: 'companyId', type: 'uint256' },
      { name: 'companyAddress', type: 'address' }, { name: 'customerAddress', type: 'address' },
      { name: 'totalAmount', type: 'uint256' }, { name: 'timestamp', type: 'uint256' },
      { name: 'isPaid', type: 'bool' }, { name: 'paymentTxHash', type: 'bytes32' },
    ] }] },
  { name: 'shoppingCart', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'invoiceSystem', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
] as const;

export const SHOPPING_CART_ABI = [
  { name: 'addToCart', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'productId', type: 'uint256' }, { name: 'quantity', type: 'uint256' }],
    outputs: [] },
  { name: 'removeFromCart', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'productId', type: 'uint256' }], outputs: [] },
] as const;

export const INVOICE_SYSTEM_ABI = [
  { name: 'createInvoice', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'companyId', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
] as const;
