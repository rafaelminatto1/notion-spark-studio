# Script de configuração do MCP Vercel para Notion Spark Studio
Write-Host "🚀 Configurando MCP Vercel..." -ForegroundColor Green

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ Arquivo .env criado a partir do exemplo" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANTE: Edite o arquivo .env e adicione seu token da Vercel!" -ForegroundColor Red
    Write-Host "   Obtenha seu token em: https://vercel.com/account/tokens" -ForegroundColor Cyan
}

# Verificar se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Compilar o projeto
Write-Host "🔨 Compilando TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilação concluída com sucesso!" -ForegroundColor Green
    
    # Mostrar instruções de configuração do Cursor
    Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
    Write-Host "1. Edite o arquivo .env e adicione seu token da Vercel" -ForegroundColor White
    Write-Host "2. No Cursor, vá para Settings → Tools → Model Context Protocol (MCP)" -ForegroundColor White
    Write-Host "3. Clique em '+ Add MCP tool' e configure:" -ForegroundColor White
    Write-Host "   - Name: Vercel MCP" -ForegroundColor Gray
    Write-Host "   - Command: node" -ForegroundColor Gray
    Write-Host "   - Args: [`"$(Get-Location)\dist\index.js`"]" -ForegroundColor Gray
    Write-Host "   - Env: {`"VERCEL_API_TOKEN`": `"your_token_here`"}" -ForegroundColor Gray
    Write-Host "`n4. Reinicie o Cursor e teste com comandos como:" -ForegroundColor White
    Write-Host "   'Liste meus projetos da Vercel'" -ForegroundColor Gray
    Write-Host "   'Qual o status do último deploy?'" -ForegroundColor Gray
    
    Write-Host "`n🎉 Setup concluído! Você agora tem superpoderes Vercel no Cursor!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro na compilação. Verifique os logs acima." -ForegroundColor Red
} 