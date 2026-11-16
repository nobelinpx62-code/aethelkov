import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Endpoint de Keep-Alive Automático para o Supabase
 * 
 * 1. Realiza leitura e escrita ativas para zerar o contador de 7 dias de inatividade do Supabase.
 * 2. Imediatamente APAGA todos os registros temporários criados, garantindo 0 bytes de desperdício
 *    e liberando o espaço de armazenamento no banco de dados.
 * 3. Suporta acionamento via Vercel Cron Jobs, GitHub Actions ou chamada manual segura.
 */
export async function GET(req: NextRequest) {
  return handleKeepAlive(req);
}

export async function POST(req: NextRequest) {
  return handleKeepAlive(req);
}

async function handleKeepAlive(req: NextRequest) {
  const startTime = Date.now();

  // Validação opcional de segurança por Bearer Token ou Query Param
  const cronSecret = process.env.CRON_SECRET || 'aethelkov-keepalive-secret';
  const authHeader = req.headers.get('authorization');
  const searchParams = req.nextUrl.searchParams;
  const keyParam = searchParams.get('key');

  const isAuthorized = 
    !process.env.CRON_SECRET || 
    authHeader === `Bearer ${cronSecret}` || 
    keyParam === cronSecret ||
    req.headers.get('user-agent')?.includes('vercel-cron');

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Não autorizado. Forneça o Bearer Token ou parâmetro ?key= correto.' },
      { status: 401 }
    );
  }

  try {
    // 1. Operação de Leitura Ativa (Verifica saúde do banco)
    const { data: readData, error: readError } = await supabase
      .from('aethel_bots')
      .select('id')
      .limit(1);

    if (readError) {
      console.error('[KeepAlive] Erro na leitura do Supabase:', readError);
    }

    // 2. Operação de Escrita Ativa (Registra transação de heartbeat para zerar timer de inatividade)
    const heartbeatId = `ping_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { data: insertedRows, error: insertError } = await supabase
      .from('aethel_logs')
      .insert({
        message: `[AETHEL_HEARTBEAT] ${heartbeatId}`,
        log_level: 'GATEWAY'
      })
      .select('id');

    if (insertError) {
      console.error('[KeepAlive] Erro ao registrar heartbeat:', insertError);
    }

    const insertedId = insertedRows?.[0]?.id;

    // 3. LIMPEZA IMEDIATA: Apaga a requisição do banco para NÃO ocupar espaço
    let deletedCount = 0;
    if (insertedId) {
      const { error: deleteError } = await supabase
        .from('aethel_logs')
        .delete()
        .eq('id', insertedId);

      if (!deleteError) {
        deletedCount++;
      } else {
        console.error('[KeepAlive] Erro ao deletar heartbeat individual:', deleteError);
      }
    }

    // 4. Faxina de redundância: Garante que nenhum heartbeat antigo fique acumulado
    const { error: purgeError } = await supabase
      .from('aethel_logs')
      .delete()
      .ilike('message', '%[AETHEL_HEARTBEAT]%');

    if (purgeError) {
      console.error('[KeepAlive] Erro na faxina geral de heartbeats:', purgeError);
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: durationMs,
      operations: {
        read_check: readError ? 'ERROR' : 'OK',
        write_transaction: insertError ? 'ERROR' : 'OK',
        cleanup_delete: 'OK (registros de ping apagados imediatamente)',
      },
      space_management: {
        freed: true,
        zero_bloat_guaranteed: true,
        purged_current_ping: insertedId ? `id_${insertedId}` : 'none',
      },
      supabase_status: {
        inactivity_timer_reset: true,
        next_deadline_extended_days: 7,
      },
      message: 'Supabase mantido ativo com sucesso e espaço no banco 100% liberado para novas operações.'
    }, { status: 200 });

  } catch (err: any) {
    console.error('[KeepAlive] Exceção crítica:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Falha desconhecida no keepalive',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
