/**
 * /api/daemon — Daemon de ejecución automática de propuestas aprobadas.
 *
 * GET /api/daemon → escanea todas las propuestas y ejecuta las elegibles:
 *   - deadline pasado
 *   - votesFor > votesAgainst
 *   - no ejecutada aún
 *   - DAO tiene fondos suficientes
 *
 * El frontend llama este endpoint periódicamente (cada 30s) via useEffect.
 * En producción se usaría un cron job (Vercel Cron, etc.).
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { DAO_ABI } from '@/lib/abi';

const RPC_URL      = process.env.RPC_URL            ?? 'http://127.0.0.1:8545';
const DAO_ADDRESS  = process.env.NEXT_PUBLIC_DAO_ADDRESS!;
const RELAYER_KEY  = process.env.RELAYER_PRIVATE_KEY!;

export async function GET() {
  const log: string[] = [];

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer  = new ethers.Wallet(RELAYER_KEY, provider);
    const dao      = new ethers.Contract(DAO_ADDRESS, DAO_ABI, relayer);

    const count = Number(await dao.getProposalCount());
    const now   = BigInt(Math.floor(Date.now() / 1000));

    log.push(`[daemon] Escaneando ${count} propuesta(s)...`);

    const executed: number[] = [];

    for (let i = 1; i <= count; i++) {
      const p = await dao.getProposal(i);

      const isExpired  = BigInt(p.deadline.toString()) < now;
      const isApproved = BigInt(p.votesFor.toString()) > BigInt(p.votesAgainst.toString());
      const notDone    = !p.executed;

      if (isExpired && isApproved && notDone) {
        log.push(`[daemon] Ejecutando propuesta #${i}...`);
        try {
          const tx = await dao.executeProposal(i, { gasLimit: 200_000 });
          await tx.wait();
          log.push(`[daemon] Propuesta #${i} ejecutada. Tx: ${tx.hash}`);
          executed.push(i);
        } catch (execErr: unknown) {
          const msg = execErr instanceof Error ? execErr.message : String(execErr);
          log.push(`[daemon] Error en propuesta #${i}: ${msg}`);
        }
      }
    }

    log.push(`[daemon] Done. Ejecutadas: ${executed.length}`);
    return NextResponse.json({ success: true, executed, log });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error en daemon';
    log.push(`[daemon] Fatal: ${msg}`);
    return NextResponse.json({ success: false, log, error: msg }, { status: 500 });
  }
}
