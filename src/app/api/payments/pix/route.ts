import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

const PLAN_PRICES: Record<string, { name: string; ramMb: number; price: number }> = {
  'free': { name: 'Starter', ramMb: 100, price: 0 },
  '1gb': { name: 'Gold', ramMb: 1024, price: 5.00 },
  '2gb': { name: 'Platinum', ramMb: 2048, price: 10.00 },
  '4gb': { name: 'Diamond', ramMb: 4096, price: 23.99 },
  '8gb': { name: 'Monster', ramMb: 8192, price: 45.00 },
};

/**
 * POST /api/payments/pix
 * Gera cobrança Pix oficial via Mercado Pago API (suporta nova API de Orders e API clássica de Payments)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, payerEmail, payerName, userId } = body;

    const plan = PLAN_PRICES[planId];
    if (!plan || plan.price <= 0) {
      return NextResponse.json({ error: 'Plano inválido para cobrança.' }, { status: 400 });
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json({
        error: 'Chave de API do Mercado Pago (MERCADOPAGO_ACCESS_TOKEN) não configurada no servidor.',
      }, { status: 500 });
    }

    const email = payerEmail?.trim() || 'cliente@aethelkov.app';
    const nameParts = (payerName?.trim() || 'Cliente Aethel').split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Aethel';

    const extRef = `${planId}:${plan.ramMb}:${userId || 'anon'}`;
    const idempotencyKey = `aethel-${planId}-${userId || 'anon'}-${Date.now()}`;

    // 1. Tenta gerar via nova API de Orders (Padrão 2026 Mercado Pago)
    try {
      const orderRes = await fetch('https://api.mercadopago.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          type: 'online',
          processing_mode: 'automatic',
          total_amount: plan.price.toFixed(2),
          external_reference: extRef,
          description: `Aethelkov - Plano ${plan.name} (${plan.ramMb} MB RAM)`,
          payer: {
            email,
            first_name: firstName,
            last_name: lastName,
          },
          transactions: {
            payments: [
              {
                amount: plan.price.toFixed(2),
                payment_method: {
                  id: 'pix',
                  type: 'bank_transfer',
                },
              },
            ],
          },
        }),
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const paymentInfo = orderData.transactions?.payments?.[0];
        const qrCode = paymentInfo?.payment_method?.qr_code;
        const qrCodeBase64 = paymentInfo?.payment_method?.qr_code_base64;
        const ticketUrl = paymentInfo?.payment_method?.ticket_url;

        // Salva transação no Supabase
        try {
          await supabase.from('aethel_payments').insert({
            payment_id: String(orderData.id),
            user_id: userId || 'default-user',
            plan_id: planId,
            amount: plan.price,
            ram_mb: plan.ramMb,
            status: orderData.status || 'action_required',
            qr_code: qrCode,
            created_at: new Date().toISOString(),
          });
        } catch (_) {}

        return NextResponse.json({
          success: true,
          paymentId: orderData.id,
          orderId: orderData.id,
          subPaymentId: paymentInfo?.id,
          status: orderData.status,
          qrCode,
          qrCodeBase64,
          ticketUrl,
          amount: plan.price,
          ramMb: plan.ramMb,
          planName: plan.name,
        });
      }
    } catch (orderErr) {
      console.warn('[MercadoPago] Orders API falhou, tentando fallback para /v1/payments:', orderErr);
    }

    // 2. Fallback para API clássica de Payments
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: plan.price,
        description: `Aethelkov - Plano ${plan.name} (${plan.ramMb} MB RAM)`,
        payment_method_id: 'pix',
        payer: {
          email,
          first_name: firstName,
          last_name: lastName,
        },
        notification_url: 'https://aethelkov.vercel.app/api/webhooks/mercadopago',
        metadata: {
          plan_id: planId,
          ram_mb: plan.ramMb,
          user_id: userId || 'default-user',
        },
      }),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error('[MercadoPago] Erro ao criar Pix:', mpData);
      return NextResponse.json({
        error: mpData.message || mpData.cause?.[0]?.description || 'Falha ao gerar cobrança no Mercado Pago.',
        details: mpData,
      }, { status: mpRes.status || 400 });
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url;

    try {
      await supabase.from('aethel_payments').insert({
        payment_id: String(mpData.id),
        user_id: userId || 'default-user',
        plan_id: planId,
        amount: plan.price,
        ram_mb: plan.ramMb,
        status: mpData.status || 'pending',
        qr_code: qrCode,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      paymentId: mpData.id,
      status: mpData.status,
      qrCode,
      qrCodeBase64,
      ticketUrl,
      amount: plan.price,
      ramMb: plan.ramMb,
      planName: plan.name,
    });
  } catch (err: any) {
    console.error('[Pix API Internal Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
