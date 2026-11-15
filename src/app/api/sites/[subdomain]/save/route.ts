import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import JSZip from 'jszip';

export async function POST(
  req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const subdomain = decodeURIComponent(params.subdomain).toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomínio inválido.' }, { status: 400 });
    }

    const body = await req.json();
    const { files, botId } = body;

    if (!files || typeof files !== 'object') {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Empacota os arquivos do site em um ZIP
    const zip = new JSZip();
    for (const [filePath, content] of Object.entries(files)) {
      if (typeof content === 'string') {
        zip.file(filePath, content);
      }
    }

    // Garante que exista aethel.config se não estiver no pacote
    if (!files['aethel.config']) {
      const configText = `NAME=${subdomain}\nTYPE=site\nMAIN=index.html\nSUBDOMAIN=${subdomain}\n`;
      zip.file('aethel.config', configText);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    // Salva no Supabase Storage: sites/${subdomain}.zip
    const { error: storageError } = await supabase.storage
      .from('aethel-deployments')
      .upload(`sites/${subdomain}.zip`, zipBuffer, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (storageError) {
      console.warn('[SiteSave] Aviso no upload de sites/' + subdomain + '.zip:', storageError.message);
    }

    // Atualiza metadados no Supabase se botId fornecido
    if (botId) {
      await supabase
        .from('aethel_bots')
        .update({
          main_file: files['index.html'] ? 'index.html' : 'server.js',
          storage_size_bytes: zipBuffer.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', botId);
    }

    return NextResponse.json({
      success: true,
      subdomain,
      sizeBytes: zipBuffer.length,
    });
  } catch (err: any) {
    console.error('[SiteSave] Erro ao salvar site:', err);
    return NextResponse.json({ error: err.message || 'Falha ao salvar arquivos do site.' }, { status: 500 });
  }
}
