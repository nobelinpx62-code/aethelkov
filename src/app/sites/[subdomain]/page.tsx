import React from 'react';
import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';
import JSZip from 'jszip';
import ClientSiteView from './ClientSiteView';

interface PageProps {
  params: {
    subdomain: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cleanSub = decodeURIComponent(params.subdomain).toLowerCase().trim();
  return {
    title: `${cleanSub} • Hospedado na Aethelkov`,
    description: `Site ${cleanSub} hospedado com subdomínio próprio e SSL na Aethelkov.`,
  };
}

export default async function HostedSitePage({ params }: PageProps) {
  const cleanSub = decodeURIComponent(params.subdomain).toLowerCase().trim();

  // Consulta no Supabase a aplicação vinculada a este subdomínio
  const { data: bot } = await supabase
    .from('aethel_bots')
    .select('*')
    .or(`assigned_node.eq.site:${cleanSub},bot_name.ilike.${cleanSub}`)
    .maybeSingle();

  let htmlContent: string | null = null;

  if (bot && bot.status === 'ONLINE') {
    try {
      // 1. Tenta baixar o pacote do site: sites/${cleanSub}.zip
      const { data: zipBlob, error } = await supabase.storage
        .from('aethel-deployments')
        .download(`sites/${cleanSub}.zip`);

      if (!error && zipBlob) {
        const arrayBuf = await zipBlob.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuf);

        // Procura index.html ou arquivo principal
        const mainEntry = bot.main_file || 'index.html';
        let htmlFile = zip.file(mainEntry);
        if (!htmlFile && mainEntry !== 'index.html') {
          htmlFile = zip.file('index.html');
        }

        if (htmlFile) {
          let html = await htmlFile.async('string');

          // Embutir style.css se presente no zip
          const cssFile = zip.file('style.css');
          if (cssFile) {
            const css = await cssFile.async('string');
            if (css && !html.includes(css)) {
              if (html.includes('</head>')) {
                html = html.replace('</head>', `<style>\n${css}\n</style></head>`);
              } else {
                html = `<style>\n${css}\n</style>\n` + html;
              }
            }
          }

          // Embutir script.js se presente no zip
          const jsFile = zip.file('script.js');
          if (jsFile) {
            const js = await jsFile.async('string');
            if (js && !html.includes(js)) {
              if (html.includes('</body>')) {
                html = html.replace('</body>', `<script>\n${js}\n</script></body>`);
              } else {
                html = html + `\n<script>\n${js}\n</script>`;
              }
            }
          }

          htmlContent = html;
        } else {
          // Se não tiver index.html puro, verifica se tem server.js com HTML embutido
          const serverFile = zip.file('server.js');
          if (serverFile) {
            const serverCode = await serverFile.async('string');
            const matchHtml = serverCode.match(/const\s+html\s*=\s*`([\s\S]*?)`;/);
            if (matchHtml && matchHtml[1]) {
              htmlContent = matchHtml[1];
            }
          }
        }
      }
    } catch (e) {
      console.warn('[HostedSitePage] Erro ao carregar pacote do site:', e);
    }
  }

  return (
    <ClientSiteView 
      subdomain={cleanSub}
      bot={bot}
      htmlContent={htmlContent}
    />
  );
}
