import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateApiRequest } from '@/lib/serverApiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/app/[id]/logs
 * Retorna os logs do terminal da aplicação
 * Estilo Discloud: https://api.discloud.app/v2/app/:id/logs
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authenticateApiRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  const { id } = params;

  try {
    const { data: bot, error: botErr } = await supabase
      .from('aethel_bots')
      .select('id, bot_name, status, platform')
      .eq('id', id)
      .single();

    if (botErr || !bot) {
      return NextResponse.json(
        { status: 'error', statusCode: 404, message: `Aplicação com ID "${id}" não foi encontrada.` },
        { status: 404 }
      );
    }

    const { data: logs, error: logsErr } = await supabase
      .from('aethel_logs')
      .select('*')
      .eq('bot_id', id)
      .order('created_at', { ascending: true })
      .limit(200);

    if (logsErr) {
      return NextResponse.json(
        { status: 'error', statusCode: 500, message: logsErr.message },
        { status: 500 }
      );
    }

    const formattedLines = (logs || []).map((l) => {
      const time = new Date(l.created_at).toLocaleTimeString('pt-BR');
      return `[${time}] [${l.log_level || 'INFO'}] ${l.message}`;
    });

    const fullTerminalLog = formattedLines.length > 0 
      ? formattedLines.join('\n')
      : `[${new Date().toLocaleTimeString('pt-BR')}] [Aethel] Instância ${bot.bot_name} ativa e aguardando eventos. Nenhum erro registrado.`;

    const smallLog = formattedLines.slice(-25).join('\n') || fullTerminalLog;

    return NextResponse.json({
      status: 'ok',
      statusCode: 200,
      logs: {
        small: smallLog,
        big: fullTerminalLog,
      },
      terminal: fullTerminalLog,
      totalLines: formattedLines.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', statusCode: 500, message: err.message },
      { status: 500 }
    );
  }
}

