export const ESCROW_ABI = [
  // ─── Owner ─────────────────────────────────────────────────────────────────
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'addToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  // ─── Tokens ────────────────────────────────────────────────────────────────
  {
    name: 'allowedTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getAllowedTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]' }],
  },
  // ─── Operations ────────────────────────────────────────────────────────────
  {
    name: 'operationCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getAllOperations',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'id',       type: 'uint256' },
          { name: 'creator',  type: 'address' },
          { name: 'tokenA',   type: 'address' },
          { name: 'tokenB',   type: 'address' },
          { name: 'amountA',  type: 'uint256' },
          { name: 'amountB',  type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'createOperation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA',  type: 'address' },
      { name: 'tokenB',  type: 'address' },
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'completeOperation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'cancelOperation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  // ─── Events ────────────────────────────────────────────────────────────────
  {
    name: 'TokenAdded',
    type: 'event',
    inputs: [{ name: 'token', type: 'address', indexed: true }],
  },
  {
    name: 'OperationCreated',
    type: 'event',
    inputs: [
      { name: 'id',      type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'tokenA',  type: 'address', indexed: false },
      { name: 'tokenB',  type: 'address', indexed: false },
      { name: 'amountA', type: 'uint256', indexed: false },
      { name: 'amountB', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'OperationCompleted',
    type: 'event',
    inputs: [
      { name: 'id',        type: 'uint256', indexed: true },
      { name: 'completer', type: 'address', indexed: true },
    ],
  },
  {
    name: 'OperationCancelled',
    type: 'event',
    inputs: [{ name: 'id', type: 'uint256', indexed: true }],
  },
] as const;

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;
