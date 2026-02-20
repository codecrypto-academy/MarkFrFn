// ABIs mínimos — mantener en sync con los contratos Solidity

export const ECOMMERCE_MAIN_ABI = [
  // Addresses de sub-contratos
  { name: 'euroToken',        type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'companyRegistry',  type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'productCatalog',   type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'invoiceSystem',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  // Conveniencias
  { name: 'getAllProducts',       type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'tuple[]', components: [
    { name: 'productId', type: 'uint256' }, { name: 'companyId', type: 'uint256' },
    { name: 'companyAddress', type: 'address' }, { name: 'name', type: 'string' },
    { name: 'description', type: 'string' }, { name: 'price', type: 'uint256' },
    { name: 'stock', type: 'uint256' }, { name: 'ipfsImageHash', type: 'string' },
    { name: 'isActive', type: 'bool' }, { name: 'createdAt', type: 'uint256' },
  ] }] },
  { name: 'getCompanyProducts', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ type: 'tuple[]', components: [
      { name: 'productId', type: 'uint256' }, { name: 'companyId', type: 'uint256' },
      { name: 'companyAddress', type: 'address' }, { name: 'name', type: 'string' },
      { name: 'description', type: 'string' }, { name: 'price', type: 'uint256' },
      { name: 'stock', type: 'uint256' }, { name: 'ipfsImageHash', type: 'string' },
      { name: 'isActive', type: 'bool' }, { name: 'createdAt', type: 'uint256' },
    ] }] },
  { name: 'getCompany', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'companyId', type: 'uint256' }, { name: 'companyAddress', type: 'address' },
      { name: 'name', type: 'string' }, { name: 'description', type: 'string' },
      { name: 'isActive', type: 'bool' }, { name: 'registrationDate', type: 'uint256' },
    ] }] },
  { name: 'getCompanyByAddress', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'companyId', type: 'uint256' }, { name: 'companyAddress', type: 'address' },
      { name: 'name', type: 'string' }, { name: 'description', type: 'string' },
      { name: 'isActive', type: 'bool' }, { name: 'registrationDate', type: 'uint256' },
    ] }] },
  { name: 'getCompanyInvoices', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'companyId', type: 'uint256' }],
    outputs: [{ type: 'uint256[]' }] },
  { name: 'getInvoice', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'invoiceId', type: 'uint256' }, { name: 'companyId', type: 'uint256' },
      { name: 'companyAddress', type: 'address' }, { name: 'customerAddress', type: 'address' },
      { name: 'totalAmount', type: 'uint256' }, { name: 'timestamp', type: 'uint256' },
      { name: 'isPaid', type: 'bool' }, { name: 'paymentTxHash', type: 'bytes32' },
    ] }] },
] as const;

export const COMPANY_REGISTRY_ABI = [
  { name: 'registerCompany', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'name', type: 'string' }, { name: 'description', type: 'string' }],
    outputs: [{ type: 'uint256' }] },
  { name: 'isCompanyOwner', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'addr', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'addressToCompanyId', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'addr', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'companyCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

export const PRODUCT_CATALOG_ABI = [
  { name: 'addProduct', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'companyId', type: 'uint256' }, { name: 'name', type: 'string' },
      { name: 'description', type: 'string' }, { name: 'price', type: 'uint256' },
      { name: 'stock', type: 'uint256' }, { name: 'ipfsImageHash', type: 'string' },
    ], outputs: [{ type: 'uint256' }] },
  { name: 'updateProduct', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'productId', type: 'uint256' }, { name: 'price', type: 'uint256' },
      { name: 'stock', type: 'uint256' },
    ], outputs: [] },
] as const;

export const EUROTOKEN_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;
