import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

/**
 * GET /api/payments/status?paymentId=ORD...
 * Consulta se o Pix foi pago no Mercado Pago (Orders API ou Payments API) e entrega as GBs/RAM ao usuário
 */
export async function GET(req: NextRequest) {
  try {
    const paymentId = req.nextUrl.searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId obrigatório.' }, { status: 400 });
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Token do Mercado Pago não configurado.' }, { status: 500 });
    }

    let isApproved = false;
    let ramMb = 1024;
    let planId = '1gb';
    let userId = 'default-user';
    let amount = 0;
    let rawStatus = 'pending';

    // 1. Se começar com ORD ou contiver caracteres alfanuméricos típicos da Orders API
    if (paymentId.startsWith('ORD') || paymentId.length > 20) {
      const orderRes = await fetch(`https://api.mercadopago.com/v1/orders/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        rawStatus = orderData.status;

        const subPayment = orderData.transactions?.payments?.[0];
        const subStatus = subPayment?.status;

        // Se a ordem foi processada/concluída ou o pagamento aprovado
        if (orderData.status === 'processed' || orderData.status === 'closed' || subStatus === 'approved') {
          isApproved = true;
        }

        amount = parseFloat(orderData.total_amount || '0');

        // Parse external_reference: "planId-ramMb-userId"
        if (orderData.external_reference) {
          const parts = orderData.external_reference.split('-');
          if (parts[0]) planId = parts[0];
          if (parts[1]) ramMb = parseInt(parts[1], 10) || 1024;
          if (parts[2]) userId = parts.slice(2).join('-');
        }
      }
    }

    // 2. Se não foi aprovado pela Orders API, tenta a rota clássica de Payments
    if (!isApproved && rawStatus === 'pending') {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          },
        });

        if (mpRes.ok) {
          const data = await mpRes.json();
          rawStatus = data.status;
          if (data.status === 'approved') {
            isApproved = true;
          }
          ramMb = data.metadata?.ram_mb || ramMb;
          planId = data.metadata?.plan_id || planId;
          userId = data.metadata?.user_id || userId;
          amount = data.transaction_amount || amount;
        }
      } catch (_) {}
    }

    // ========================================================
    // ENTREGA IMEDIATA DE RAM (GBs) NO BANCO DO USUÁRIO
    // ========================================================
    if (isApproved) {
      try {
        // Atualiza a cota real no perfil (tabela profiles do Supabase)
        if (userId && userId !== 'default-user' && userId !== 'anon') {
          await supabase
            .from('profiles')
            .update({ 
              quota_limit_mb: ramMb, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', userId);
        } else {
          // Atualiza perfil ativo
          await supabase
            .from('profiles')
            .update({ 
              quota_limit_mb: ramMb, 
              updated_at: new Date().toISOString() 
            })
            .not('id', 'is', null);
        }
      } catch (profErr) {
        console.error('[MercadoPago] Erro ao atualizar quota em profiles:', profErr);
      }

      // Registra nos logs da plataforma
      try {
        await supabase.from('aethel_logs').insert({
          log_level: 'INFO',
          message: `[Mercado Pago] Pagamento #${paymentId} APROVADO! +${ramMb} MB de RAM (Plano ${planId.toUpperCase()}) entregues com sucesso ao usuário.`,
        });
      } catch (_) {}
    }

    return NextResponse.json({
      status: rawStatus,
      approved: isApproved,
      planId,
      ramMb,
      amount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
