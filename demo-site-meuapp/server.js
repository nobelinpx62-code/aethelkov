const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 3000;
const SUBDOMAIN = process.env.SUBDOMAIN || 'meuapp';
const startTime = Date.now();

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeuApp &bull; Hospedado na Aethelkov</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #06070a;
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(34, 211, 238, 0.15) 0%, transparent 60%),
        radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
    }
    .glass-card {
      background: rgba(18, 20, 29, 0.7);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 32px;
      padding: 40px;
      max-width: 680px;
      width: 100%;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.2);
      position: relative;
    }
    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #67e8f9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .url-box {
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 28px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
    }
    .url-text {
      color: #38bdf8;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .metric-item {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 18px;
      padding: 14px;
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
    }
    .metric-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 24px;
      border-radius: 18px;
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      color: #ffffff;
      font-weight: 700;
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      text-decoration: none;
      box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
    }
    .btn-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(6, 182, 212, 0.4);
    }
    footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
      text-align: center;
    }
    @media (max-width: 600px) {
      .glass-card { padding: 24px; }
      h1 { font-size: 24px; }
      .metrics-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="glass-card">
    <div class="badge-status">
      <div class="pulse-dot"></div>
      <span>Malha Aethelkov &bull; Online 24/7</span>
    </div>

    <h1>Seu Site Está no Ar com Sucesso! 🚀</h1>
    <p>
      Esta aplicação web Node.js está rodando na malha de servidores <strong>Aethelkov</strong> com proxy reverso, balanceamento inteligente e terminação SSL/TLS automática.
    </p>

    <div class="url-box">
      <span style="color: #64748b;">URL Pública:</span>
      <span class="url-text">https://meuapp.linkthelkov.online</span>
    </div>

    <div class="metrics-grid">
      <div class="metric-item">
        <div class="metric-label">Runtime</div>
        <div class="metric-value">Node.js ` + process.version + `</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">Memória RSS</div>
        <div class="metric-value">` + (process.memoryUsage().rss / (1024 * 1024)).toFixed(1) + ` MB</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">SSL / HTTPS</div>
        <div class="metric-value" style="color: #34d399;">Ativo & Seguro</div>
      </div>
    </div>

    <button class="btn-action" onclick="testPing()">
      ⚡ Testar Resposta da API em Tempo Real
    </button>
  </div>

  <footer>
    Desenvolvido para Aethelkov Engine &bull; Linkthelkov.online
  </footer>

  <script>
    async function testPing() {
      const btn = document.querySelector('.btn-action');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Consultando endpoint...';
      try {
        const t0 = performance.now();
        const res = await fetch('/api/status');
        const data = await res.json();
        const latency = Math.round(performance.now() - t0);
        alert('✅ Resposta da API recebida em ' + latency + 'ms!\\n\\n' + JSON.stringify(data, null, 2));
      } catch (err) {
        alert('Erro ao testar endpoint: ' + err.message);
      } finally {
        btn.innerHTML = originalText;
      }
    }
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ONLINE',
      subdomain: SUBDOMAIN,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      memoryMb: (process.memoryUsage().rss / (1024 * 1024)).toFixed(2),
      platform: os.platform(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    }));
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`[Aethelkov] Servidor do site ativo na porta ${PORT}`);
  console.log(`[Aethelkov] Subdomínio configurado: https://${SUBDOMAIN}.linkthelkov.online`);
});
