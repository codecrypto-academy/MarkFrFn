/**
 * /api/relay — Endpoint server-side que ejecuta meta-transacciones.
 *
 * Recibe: { request: ForwardRequest (strings), signature: string }
 * Ejecuta: forwarder.execute(request, signature) pagando gas con la wallet del relayer.
 * Retorna: { txHash, success } o { error }
 *
 * La clave privada del relayer NUNCA llega al cliente.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { FORWARDER_ABI } from '@/lib/abi';

const RPC_URL           = process.env.RPC_URL            ?? 'http://127.0.0.1:8545';
const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS!;
const RELAYER_KEY       = process.env.RELAYER_PRIVATE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { request, signature } = await req.json() as {
      request: {
        from: string; to: string;
        value: string; gas: string; nonce: string; data: string;
      };
      signature: string;
    };

    if (!request || !signature) {
      return NextResponse.json({ error: 'request y signature son requeridos' }, { status: 400 });
    }

    // Reconstruir la ForwardRequest con bigint
    const forwardRequest = {
      from:  request.from,
      to:    request.to,
      value: BigInt(request.value),
      gas:   BigInt(request.gas),
      nonce: BigInt(request.nonce),
      data:  request.data,
    };

    // Wallet del relayer (server-side, paga gas)
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer  = new ethers.Wallet(RELAYER_KEY, provider);
    const forwarder = new ethers.Contract(FORWARDER_ADDRESS, FORWARDER_ABI, relayer);

    // Verificar la firma antes de ejecutar
    const isValid = await forwarder.verify(forwardRequest, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Firma inválida o nonce incorrecto' }, { status: 400 });
    }

    // Ejecutar la meta-transacción
    const tx = await forwarder.execute(forwardRequest, signature, {
      gasLimit: forwardRequest.gas + BigInt(50_000), // margen para overhead del forwarder
    });
    const receipt = await tx.wait();

    return NextResponse.json({ success: true, txHash: receipt.hash });
  } catch (err: unknown) {
    console.error('[relay]', err);
    const msg = err instanceof Error ? err.message : 'Error interno del relayer';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
