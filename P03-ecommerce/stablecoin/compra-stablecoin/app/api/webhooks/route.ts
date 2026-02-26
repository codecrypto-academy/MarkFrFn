import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ethers } from 'ethers';
import { EUROTOKEN_ABI } from '@/lib/abi';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// El webhook recibe el body sin parsear — necesita el raw body de la request
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature invalid';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { walletAddress, eurtAmount } = intent.metadata;

    if (!walletAddress || !eurtAmount) {
      return NextResponse.json({ error: 'Metadata incompleta' }, { status: 400 });
    }

    try {
      await mintTokens(walletAddress, parseFloat(eurtAmount));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al mintear';
      console.error('[webhook] Error minting:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function mintTokens(toAddress: string, eurAmount: number) {
  const rpcUrl  = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://localhost:8545';
  const privKey = process.env.MINTER_PRIVATE_KEY!;
  const tokenAddr = process.env.NEXT_PUBLIC_EUROTOKEN_ADDRESS!;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer   = new ethers.Wallet(privKey, provider);
  const token    = new ethers.Contract(tokenAddr, EUROTOKEN_ABI, signer);

  // 1 EUR = 1 EURT = 1_000_000 unidades (6 decimals)
  const amount = BigInt(Math.round(eurAmount * 1_000_000));

  const tx = await token.mint(toAddress, amount);
  await tx.wait();

  console.log(`[webhook] Minted ${eurAmount} EURT → ${toAddress}. Tx: ${tx.hash}`);
}
