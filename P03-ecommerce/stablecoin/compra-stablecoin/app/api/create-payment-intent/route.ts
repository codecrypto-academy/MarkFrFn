import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { amount, walletAddress } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
    }
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address requerida' }, { status: 400 });
    }

    // Stripe trabaja en céntimos (amount en EUR → centimos)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      metadata: {
        walletAddress,
        eurtAmount: String(amount),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
