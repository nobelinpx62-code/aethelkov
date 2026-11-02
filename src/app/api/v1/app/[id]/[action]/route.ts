import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateApiRequest } from '@/lib/serverApiAuth';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/v1/app/[id]/[action]
 * Inicia, para ou reinicia a aplicação
 * Estilo Discloud: https://api.discloud.app/v2/app/:id/restart (start | stop | restart)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  const auth = authenticateApiRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  const { id, action } = params;
  const validActions = ['start', 'stop', 'restart'];

  if (!validActions.includes(action.toLowerCase())) {
    return NextResponse.json(
      {
        status: 'error',
        statusCode: 400,
        message: `Ação inválida "${action}". As ações suportadas são: "start", "stop" ou "restart".`,
      },
      { status: 400 }
    );
  }

  try {
    const { data: bot, error } = await supabase
      .from('aethel_bots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !bot) {
      return NextResponse.json(
        { status: 'error', statusCode: 404, message: `Aplicação com ID "${id}" não encontrada.` },
        { status: 404 }
      );
    }

    let nextStatus = 'ONLINE';
    let logMessage = '';

    if (action === 'stop') {
      nextStatus = 'STOPPED';
      logMessage = `[API REST v1] Instância pausada via comando PUT /api/v1/app/${id}/stop.`;
    } else if (action === 'start') {
      nextStatus = 'ONLINE';
      logMessage = `[API REST v1] Instância iniciada via comando PUT /api/v1/app/${id}/start.`;
    } else if (action === 'restart') {
      nextStatus = 'ONLINE';
      logMessage = `[API REST v1] Instância reiniciada via comando PUT /api/v1/app/${id}/restart.`;
    }

    // Atualiza status no banco de dados
    await supabase
      .from('aethel_bots')
      .update({
        status: nextStatus,
        last_restart_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Registra o log da ação
    await supabase.from('aethel_logs').insert({
      bot_id: id,
      log_level: 'GATEWAY',
      message: logMessage,
    });

    // Se for Telegram e a ação for start ou restart, re-sincroniza o webhook
    if (bot.platform === 'TELEGRAM' && nextStatus === 'ONLINE' && bot.token_encrypted) {
      const webhookUrl = `https://aethelkov.vercel.app/api/telegram?botId=${id}`;
      try {
        await fetch(
          `https://api.telegram.org/bot${bot.token_encrypted}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
        );
      } catch (_) {}
    }

    return NextResponse.json({
      status: 'ok',
      statusCode: 200,
      message: `Ação "${action}" executada com sucesso para a aplicação "${bot.bot_name}".`,
      apps: {
        id: bot.id,
        name: bot.bot_name,
        status: nextStatus,
        online: nextStatus === 'ONLINE',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', statusCode: 500, message: err.message },
      { status: 500 }
    );
  }
}

