// ABIs mínimos necesarios para interactuar con los contratos desde el frontend.
// Deben mantenerse en sync con los contratos Solidity.

export const DAO_ABI = [
  // Fondos
  { name: 'fundDAO', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
  { name: 'totalBalance', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'userBalance', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'getUserBalance', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },

  // Propuestas
  {
    name: 'createProposal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'description', type: 'string' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getProposal',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id',           type: 'uint256' },
          { name: 'recipient',    type: 'address' },
          { name: 'amount',       type: 'uint256' },
          { name: 'deadline',     type: 'uint256' },
          { name: 'description',  type: 'string' },
          { name: 'votesFor',     type: 'uint256' },
          { name: 'votesAgainst', type: 'uint256' },
          { name: 'votesAbstain', type: 'uint256' },
          { name: 'executed',     type: 'bool' },
        ],
      },
    ],
  },
  { name: 'getProposalCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'proposalCount',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },

  // Votación
  {
    name: 'vote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'voteType',   type: 'uint8' },
    ],
    outputs: [],
  },
  { name: 'hasVoted', type: 'function', stateMutability: 'view', inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'voter', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'userVote', type: 'function', stateMutability: 'view', inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'voter', type: 'address' }], outputs: [{ type: 'uint8' }] },

  // Ejecución
  {
    name: 'executeProposal',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [],
  },

  // Eventos
  { name: 'FundsDeposited',   type: 'event', inputs: [{ name: 'user', type: 'address', indexed: true }, { name: 'amount', type: 'uint256' }] },
  { name: 'ProposalCreated',  type: 'event', inputs: [{ name: 'proposalId', type: 'uint256', indexed: true }, { name: 'creator', type: 'address', indexed: true }, { name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  { name: 'Voted',            type: 'event', inputs: [{ name: 'proposalId', type: 'uint256', indexed: true }, { name: 'voter', type: 'address', indexed: true }, { name: 'voteType', type: 'uint8' }] },
  { name: 'ProposalExecuted', type: 'event', inputs: [{ name: 'proposalId', type: 'uint256', indexed: true }, { name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }] },
] as const;

export const FORWARDER_ABI = [
  { name: 'getNonce', type: 'function', stateMutability: 'view', inputs: [{ name: 'from', type: 'address' }], outputs: [{ type: 'uint256' }] },
  {
    name: 'verify',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'req', type: 'tuple', components: [
        { name: 'from',  type: 'address' },
        { name: 'to',    type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas',   type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'data',  type: 'bytes' },
      ]},
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'req', type: 'tuple', components: [
        { name: 'from',  type: 'address' },
        { name: 'to',    type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas',   type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'data',  type: 'bytes' },
      ]},
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }, { type: 'bytes' }],
  },
] as const;
