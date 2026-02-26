/**
 * metaTx.ts — Utilidades para construir y firmar meta-transacciones (EIP-712).
 *
 * Flujo:
 *  1. buildMetaTxRequest()  → construye ForwardRequest con el nonce actual
 *  2. signMetaTxRequest()   → firma con EIP-712 usando MetaMask (signer.signTypedData)
 *  3. El resultado se envía al endpoint /api/relay que lo ejecuta pagando gas
 */

import { ethers } from 'ethers';
import { FORWARDER_ADDRESS, CHAIN_ID, getForwarderContract, getReadProvider } from './contracts';

export interface ForwardRequest {
  from:  string;
  to:    string;
  value: bigint;
  gas:   bigint;
  nonce: bigint;
  data:  string;
}

// EIP-712 domain — debe coincidir EXACTAMENTE con el constructor de MinimalForwarder
const EIP712_DOMAIN = {
  name:              'MinimalForwarder',
  version:           '1',
  chainId:           CHAIN_ID,
  verifyingContract: FORWARDER_ADDRESS,
};

// EIP-712 types — debe coincidir con el TYPEHASH del contrato
const EIP712_TYPES = {
  ForwardRequest: [
    { name: 'from',  type: 'address' },
    { name: 'to',    type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas',   type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'data',  type: 'bytes' },
  ],
};

/**
 * Construye una ForwardRequest obteniendo el nonce actual del forwarder on-chain.
 */
export async function buildMetaTxRequest(
  provider: ethers.Provider,
  from: string,
  to: string,
  data: string,
  gasLimit: bigint = BigInt(500_000),
): Promise<ForwardRequest> {
  // Leer el nonce directamente desde Anvil (no desde MetaMask, que puede tener lag de bloque)
  const directProvider = getReadProvider();
  const forwarder = getForwarderContract(directProvider);
  const nonce = await forwarder.getNonce(from);

  return {
    from,
    to,
    value: BigInt(0),
    gas:   gasLimit,
    nonce: BigInt(nonce.toString()),
    data,
  };
}

/**
 * Firma una ForwardRequest con EIP-712 usando el signer de MetaMask.
 * Returns { request, signature } listo para enviar al relayer.
 */
export async function signMetaTxRequest(
  signer: ethers.Signer,
  provider: ethers.Provider,
  to: string,
  data: string,
  gasLimit?: bigint,
): Promise<{ request: ForwardRequest; signature: string }> {
  const from = await signer.getAddress();
  const request = await buildMetaTxRequest(provider, from, to, data, gasLimit);

  // signTypedData implementa EIP-712 — MetaMask muestra el mensaje estructurado al usuario
  const signature = await signer.signTypedData(EIP712_DOMAIN, EIP712_TYPES, {
    from:  request.from,
    to:    request.to,
    value: request.value,
    gas:   request.gas,
    nonce: request.nonce,
    data:  request.data,
  });

  return { request, signature };
}

/**
 * Serializa una ForwardRequest a JSON (bigint → string para fetch).
 */
export function serializeRequest(req: ForwardRequest) {
  return {
    from:  req.from,
    to:    req.to,
    value: req.value.toString(),
    gas:   req.gas.toString(),
    nonce: req.nonce.toString(),
    data:  req.data,
  };
}
