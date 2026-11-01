# =====================================================================
# SCRIPT DE EMPACOTAMENTO AUTOMATICO PARA A DISCLOUD
# Gera o arquivo 'discloud.zip' pronto para upload no painel da Discloud
# =====================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) { $ScriptDir = Get-Location }
$SourceDir = Join-Path $ScriptDir "discloud-node"
$ZipOutput = Join-Path $ScriptDir "discloud.zip"

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "[+] AETHELKOV: Gerando pacote discloud.zip para a Discloud" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

if (Test-Path -Path $ZipOutput) {
    Remove-Item -Path $ZipOutput -Force
    Write-Host "[*] Arquivo discloud.zip anterior removido." -ForegroundColor Yellow
}

$FilesToZip = @(
    (Join-Path $SourceDir "discloud.config"),
    (Join-Path $SourceDir "farol.js"),
    (Join-Path $SourceDir "package.json")
)

if (Test-Path (Join-Path $SourceDir ".env")) {
    $FilesToZip += (Join-Path $SourceDir ".env")
} elseif (Test-Path (Join-Path $SourceDir ".env.example")) {
    $FilesToZip += (Join-Path $SourceDir ".env.example")
}

foreach ($f in $FilesToZip) {
    if (-not (Test-Path $f)) {
        Write-Error "[-] Arquivo obrigatorio nao encontrado: $f"
        exit 1
    }
}

Compress-Archive -Path $FilesToZip -DestinationPath $ZipOutput -CompressionLevel Optimal

if (Test-Path $ZipOutput) {
    $sizeKb = [math]::Round(((Get-Item $ZipOutput).Length / 1KB), 2)
    Write-Host "[OK] SUCESSO: Arquivo discloud.zip criado com exito!" -ForegroundColor Green
    Write-Host "[*] Caminho: $ZipOutput" -ForegroundColor White
    Write-Host "[*] Tamanho: $sizeKb KB" -ForegroundColor Gray
    Write-Host "[>] Agora basta enviar o 'discloud.zip' no painel da Discloud ou via .upload" -ForegroundColor Cyan
} else {
    Write-Error "[-] Falha ao gerar o arquivo zip."
}
