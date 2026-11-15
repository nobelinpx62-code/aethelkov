import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

/**
 * POST /api/webhooks/mercadopago
 * Notificação instantânea IPN enviada pelo Mercado Pago quando o Pix é pago (suporta Orders e Payments)
 */
export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const body = await req.json().catch(() => ({}));

    // O Mercado Pago envia id ou resource na URL ou body
    const id = url.searchParams.get('data.id') || url.searchParams.get('id') || body.data?.id || body.id;
    const topic = body.topic || body.type || url.searchParams.get('topic') || url.searchParams.get('type') || '';

    if (!id) {
      return NextResponse.json({ status: 'ignored', message: 'No ID found' });
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.warn('[MercadoPago Webhook] Token de acesso não configurado.');
      return NextResponse.json({ status: 'unconfigured' });
    }

    let isApproved = false;
    let ramMb = 1024;
    let planId = '1gb';
    let userId = 'default-user';
    let amount = 0;

    // Se for tópico de order ou id alfanumérico longo
    if (topic.includes('order') || String(id).startsWith('ORD')) {
      const orderRes = await fetch(`https://api.mercadopago.com/v1/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const subStatus = orderData.transactions?.payments?.[0]?.status;

        if (orderData.status === 'processed' || orderData.status === 'closed' || subStatus === 'approved') {
          isApproved = true;
          amount = parseFloat(orderData.total_amount || '0');

          if (orderData.external_reference) {
            const parts = orderData.external_reference.split(':');
            if (parts[0]) planId = parts[0];
            if (parts[1]) ramMb = parseInt(parts[1], 10) || 1024;
            if (parts[2]) userId = parts[2];
          }
        }
      }
    } else {
      // Tópico de payment
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
      });

      if (mpRes.ok) {
        const payment = await mpRes.json();
        if (payment.status === 'approved') {
          isApproved = true;
          ramMb = payment.metadata?.ram_mb || 1024;
          planId = payment.metadata?.plan_id || '1gb';
          userId = payment.metadata?.user_id || 'default-user';
          amount = payment.transaction_amount || 0;
        }
      }
    }

    if (isApproved) {
      // Atualiza pagamento no banco
      await supabase
        .from('aethel_payments')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('payment_id', String(id));

      // Credita a RAM no usuário
      await supabase.from('aethel_user_bonus').insert({
        user_id: userId,
        bonus_ram_mb: ramMb,
        reason: `Assinatura Plano ${planId.toUpperCase()} (Mercado Pago Webhook #${id})`,
        expires_at: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Registra nos logs
      await supabase.from('aethel_logs').insert({
        log_level: 'INFO',
        message: `[Webhook Mercado Pago] Pagamento #${id} de R$ ${amount} APROVADO! +${ramMb} MB de RAM liberados instantaneamente.`,
      });
    }

    return NextResponse.json({ status: 'ok', approved: isApproved, id });
  } catch (err: any) {
    console.error('[MercadoPago Webhook Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'ok', service: 'Aethelkov Mercado Pago Webhook Gateway' });
}
