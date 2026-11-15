import { NextRequest, NextResponse } from 'next/server';
import {
  getUserSubdomainQuota,
  listUserSubdomains,
  registerSubdomain,
  deleteSubdomain,
  validateSubdomainFormat,
  isSubdomainAvailable,
} from '@/lib/subdomainManager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const checkSubdomain = searchParams.get('check');

    if (checkSubdomain) {
      const format = validateSubdomainFormat(checkSubdomain);
      if (!format.valid) {
        return NextResponse.json({ available: false, error: format.error });
      }
      const available = await isSubdomainAvailable(checkSubdomain);
      return NextResponse.json({
        available,
        subdomain: checkSubdomain.toLowerCase(),
        url: `https://${checkSubdomain.toLowerCase()}.linkthelkov.online`,
      });
    }

    const quota = await getUserSubdomainQuota(userId);
    const subdomains = await listUserSubdomains(userId);

    return NextResponse.json({
      success: true,
      quota,
      subdomains,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao consultar subdomínios.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subdomain, appId, appName, userId } = body;

    if (!subdomain) {
      return NextResponse.json({ error: 'O nome do subdomínio é obrigatório.' }, { status: 400 });
    }

    const result = await registerSubdomain({
      subdomain,
      appId: appId || '',
      appName: appName || subdomain,
      userId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      subdomain: subdomain.toLowerCase(),
      url: result.url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao registrar subdomínio.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subdomain = searchParams.get('subdomain');
    const userId = searchParams.get('userId') || undefined;

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomínio não informado.' }, { status: 400 });
    }

    const result = await deleteSubdomain(subdomain, userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Subdomínio ${subdomain} desvinculado com sucesso.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao remover subdomínio.' }, { status: 500 });
  }
}
