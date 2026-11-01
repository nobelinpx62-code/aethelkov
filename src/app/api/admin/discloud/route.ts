import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Discloud API Token obrigatório.' }, { status: 400 });
    }

    // Consulta a API oficial da Discloud
    const discloudRes = await fetch('https://api.discloud.app/v2/user', {
      headers: {
        'api-token': token.trim(),
      },
    });

    const data = await discloudRes.json();

    if (!discloudRes.ok || data.status !== 'ok') {
      return NextResponse.json({
        error: data.message || 'Falha ao autenticar com a API da Discloud. Verifique o token.',
      }, { status: discloudRes.status || 400 });
    }

    const user = data.user || {};

    return NextResponse.json({
      success: true,
      account: {
        id: user.userID,
        totalRamMb: user.totalRamMb || 100,
        ramUsedMb: user.ramUsedMb || 0,
        subdomain: user.subdomain,
        plan: user.plan || 'Free',
        appsCount: (user.apps || []).length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
