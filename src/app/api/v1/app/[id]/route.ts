import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateApiRequest } from '@/lib/serverApiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/app/[id]
 * Detalhes da aplicação especificada
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authenticateApiRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  const { id } = params;

  try {
    const { data: bot, error } = await supabase
      .from('aethel_bots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !bot) {
      return NextResponse.json(
        { status: 'error', statusCode: 404, message: `Aplicação com ID "${id}" não foi encontrada.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      statusCode: 200,
      apps: {
        id: bot.id,
        name: bot.bot_name,
        online: bot.status === 'ONLINE',
        status: bot.status,
        ram: Math.max(bot.ram_limit_mb || 100, 100),
        main: bot.main_file || 'bot.js',
        version: 'latest',
        platform: bot.platform,
        lang: 'javascript',
        node: bot.assigned_node || 'farol-alpha',
        configType: bot.config_type || 'discloud',
        createdAt: bot.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', statusCode: 500, message: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/app/[id]
 * Apaga a aplicação permanentemente da malha
 * Estilo Discloud: https://api.discloud.app/v2/app/:id/delete
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authenticateApiRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  const { id } = params;

  try {
    // Busca informações antes de deletar
    const { data: bot } = await supabase
      .from('aethel_bots')
      .select('id, bot_name')
      .eq('id', id)
      .single();

    if (!bot) {
      return NextResponse.json(
        { status: 'error', statusCode: 404, message: `Aplicação "${id}" não encontrada.` },
        { status: 404 }
      );
    }

    // Se for Telegram, limpa webhook
    try {
      const { data: fullBot } = await supabase
        .from('aethel_bots')
        .select('token_encrypted, platform')
        .eq('id', id)
        .single();

      if (fullBot?.platform === 'TELEGRAM' && fullBot.token_encrypted) {
        await fetch(`https://api.telegram.org/bot${fullBot.token_encrypted}/deleteWebhook?drop_pending_updates=true`);
      }
    } catch (_) {}

    // Exclui logs da instância
    await supabase.from('aethel_logs').delete().eq('bot_id', id);

    // Exclui a instância
    const { error: deleteError } = await supabase
      .from('aethel_bots')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { status: 'error', statusCode: 500, message: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      statusCode: 200,
      message: `Aplicação "${bot.bot_name}" (${id}) apagada permanentemente com sucesso. A cota de 100 MB de RAM foi liberada.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', statusCode: 500, message: err.message },
      { status: 500 }
    );
  }
}

