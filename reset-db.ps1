# Script para Reset Local do Banco de Dados (CCA. Split)
# Desenvolvido para uso exclusivo em testes do desenvolvedor.

Write-Host "Iniciando reset do banco de dados local..." -ForegroundColor Cyan

# 1. Finalizar processos ativos
Write-Host "Finalizando processos do CCA Contabil e Electron..." -ForegroundColor Yellow
Stop-Process -Name "cca-contabil" -ErrorAction SilentlyContinue
Stop-Process -Name "electron" -ErrorAction SilentlyContinue

# Aguardar um momento para garantir que os arquivos sejam liberados
Start-Sleep -Seconds 2

# 2. Caminhos de dados
$paths = @(
    "$env:APPDATA\cca-contabil",
    "$env:APPDATA\Electron"
)

# 3. Remover diretórios de dados
foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "Removendo dados em: $path" -ForegroundColor Green
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Caminho não encontrado (já limpo ou inexistente): $path" -ForegroundColor Gray
    }
}

Write-Host "`nReset concluído com sucesso!" -ForegroundColor Cyan
Write-Host "Você pode iniciar o app agora para criar uma nova conta." -ForegroundColor White
