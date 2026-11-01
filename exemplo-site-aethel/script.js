// Atualização do Relógio em Tempo Real
function updateClock() {
  const clockEl = document.getElementById('serverClock');
  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('pt-BR');
  }
}
setInterval(updateClock, 1000);
updateClock();

// Teste de Latência
const btnPing = document.getElementById('btnPing');
const pingValue = document.getElementById('pingValue');

btnPing?.addEventListener('click', () => {
  btnPing.disabled = true;
  btnPing.innerHTML = '<span>⏳ Testando Nó...</span>';
  
  setTimeout(() => {
    const fakeMs = Math.floor(Math.random() * 10) + 8; // 8ms a 18ms
    if (pingValue) {
      pingValue.textContent = fakeMs + ' ms';
      pingValue.classList.add('text-emerald');
    }
    btnPing.disabled = false;
    btnPing.innerHTML = '<span>⚡ Testar Novamente (' + fakeMs + 'ms)</span>';
  }, 300);
});

// Simulação de Rota de API / Proxy 24/7
const btnProxy = document.getElementById('btnProxy');
const outputConsole = document.getElementById('outputConsole');
const consoleText = document.getElementById('consoleText');

btnProxy?.addEventListener('click', () => {
  if (outputConsole && consoleText) {
    outputConsole.style.display = 'block';
    const payload = {
      status: "SUCCESS_200",
      node_runtime: "Aethel Kov Edge Engine",
      subdomain_ssl: "ACTIVE (Let's Encrypt TLS 1.3)",
      memory_allocated: "512 MB RAM",
      timestamp: new Date().toISOString(),
      proxy_forwarding: "24/7 Enabled",
      message: "Aplicação web respondendo instantaneamente em rota pública!"
    };
    
    consoleText.textContent = JSON.stringify(payload, null, 2);
  }
});
