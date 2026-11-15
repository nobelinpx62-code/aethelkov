import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkUserSubscription } from '@/lib/subscriptionManager';

export const dynamic = 'force-dynamic';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

const PLAN_PRICES: Record<string, { name: string; ramMb: number; price: number; tier: number }> = {
  'free': { name: 'Starter', ramMb: 100, price: 0, tier: 0 },
  '1gb': { name: 'Gold', ramMb: 1024, price: 5.00, tier: 1 },
  '2gb': { name: 'Platinum', ramMb: 2048, price: 10.00, tier: 2 },
  '4gb': { name: 'Diamond', ramMb: 4096, price: 23.99, tier: 3 },
  '8gb': { name: 'Monster', ramMb: 8192, price: 45.00, tier: 4 },
};

/**
 * POST /api/payments/pix
 * Gera cobrança Pix com suporte a Regra de Upgrade (50% OFF) e Bloqueio de Plano Duplicado
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

    // ========================================================
    // REGRA DE ASSINATURA: BLOQUEIO DO MESMO PLANO & UPGRADE COM 50% OFF
    // ========================================================
    let isUpgrade = false;
    let finalPrice = plan.price;

    const currentSub = await checkUserSubscription(userId);
    if (currentSub.isActive && currentSub.planId) {
      const currentTier = PLAN_PRICES[currentSub.planId]?.tier || 0;
      const targetTier = plan.tier;

      // 1. Bloqueia comprar o mesmo plano novamente enquanto ativo
      if (currentSub.planId === planId) {
        return NextResponse.json({
          error: `Você já possui o Plano ${plan.name} ativo com ${currentSub.daysRemaining} dias restantes! Não é possível comprar o mesmo plano novamente. Escolha um plano superior para fazer Upgrade com 50% de desconto.`,
        }, { status: 400 });
      }

      // 2. Se for plano inferior, não permite downgrade pago
      if (targetTier < currentTier) {
        return NextResponse.json({
          error: `Seu plano atual (${PLAN_PRICES[currentSub.planId]?.name || 'Superior'}) já possui mais recursos do que o plano ${plan.name}.`,
        }, { status: 400 });
      }

      // 3. Se for upgrade para plano superior: paga apenas metade (50% OFF)!
      if (targetTier > currentTier) {
        isUpgrade = true;
        finalPrice = Math.round((plan.price / 2) * 100) / 100;
      }
    }

    const email = payerEmail?.trim() || 'cliente@aethelkov.app';
    const nameParts = (payerName?.trim() || 'Cliente Aethel').split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Aethel';

    // Higieniza o external_reference (prefixo up- identifica upgrades)
    const safeUserId = (userId || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
    const extRef = isUpgrade
      ? `up-${planId}-${plan.ramMb}-${safeUserId}`
      : `${planId}-${plan.ramMb}-${safeUserId}`;
    const idempotencyKey = `aethel-${planId}-${safeUserId}-${Date.now()}`;

    const description = isUpgrade
      ? `Aethelkov - Upgrade Plano ${plan.name} (50% OFF - ${plan.ramMb} MB RAM)`
      : `Aethelkov - Plano ${plan.name} (${plan.ramMb} MB RAM)`;

    // 1. Tenta gerar via nova API de Orders (Padrão Oficial 2026 Mercado Pago)
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
          total_amount: finalPrice.toFixed(2),
          external_reference: extRef,
          description,
          payer: {
            email,
            first_name: firstName,
            last_name: lastName,
          },
          transactions: {
            payments: [
              {
                amount: finalPrice.toFixed(2),
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

        // Registra nos logs
        try {
          await supabase.from('aethel_logs').insert({
            log_level: 'INFO',
            message: `[Pix Criado] Pedido #${orderData.id} - ${isUpgrade ? 'UPGRADE (50% OFF)' : 'NOVO PLANO'} ${plan.name} por R$ ${finalPrice.toFixed(2)}`,
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
          amount: finalPrice,
          originalPrice: plan.price,
          isUpgrade,
          ramMb: plan.ramMb,
          planName: plan.name,
        });
      } else {
        const orderErrData = await orderRes.json().catch(() => ({}));
        console.warn('[MercadoPago] Orders API retornou status não-ok:', orderRes.status, orderErrData);
        const detailMsg = orderErrData.errors?.[0]?.message || orderErrData.message || 'Erro ao processar pedido no Mercado Pago.';
        return NextResponse.json({ error: detailMsg, details: orderErrData }, { status: orderRes.status || 400 });
      }
    } catch (orderErr: any) {
      console.warn('[MercadoPago] Orders API falhou com exceção:', orderErr);
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
        transaction_amount: finalPrice,
        description,
        payment_method_id: 'pix',
        payer: {
          email,
          first_name: firstName,
          last_name: lastName,
        },
        notification_url: 'https://linkthelkov.online/api/webhooks/mercadopago',
        metadata: {
          plan_id: planId,
          ram_mb: plan.ramMb,
          user_id: userId || 'default-user',
          is_upgrade: isUpgrade,
        },
      }),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error('[MercadoPago] Erro ao criar Pix (Payments):', mpData);
      return NextResponse.json({
        error: mpData.message || mpData.cause?.[0]?.description || 'Falha ao gerar cobrança no Mercado Pago.',
        details: mpData,
      }, { status: mpRes.status || 400 });
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url;

    return NextResponse.json({
      success: true,
      paymentId: mpData.id,
      status: mpData.status,
      qrCode,
      qrCodeBase64,
      ticketUrl,
      amount: finalPrice,
      originalPrice: plan.price,
      isUpgrade,
      ramMb: plan.ramMb,
      planName: plan.name,
    });
  } catch (err: any) {
    console.error('[Pix API Internal Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
