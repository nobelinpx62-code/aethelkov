import React from 'react';
import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';
import ClientSiteView from './ClientSiteView';

interface PageProps {
  params: {
    subdomain: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cleanSub = decodeURIComponent(params.subdomain).toLowerCase();
  return {
    title: `${cleanSub} • Hospedado na Aethelkov`,
    description: `Aplicação Web ${cleanSub} hospedada com subdomínio próprio e SSL na Aethelkov.`,
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

  return (
    <ClientSiteView 
      subdomain={cleanSub}
      bot={bot}
    />
  );
}
