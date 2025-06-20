# 🎯 Configuração MCP Vercel no Cursor - PASSO A PASSO

## ✅ Pré-requisitos Concluídos
- [x] Token Vercel configurado: `Lm96ITyzKUtvkgCA8ZjzOJXH`
- [x] Projeto compilado em `dist/index.js`
- [x] Servidor MCP testado e funcionando

## 🔧 Configuração no Cursor

### Passo 1: Abrir Configurações
1. Abra o **Cursor**
2. Pressione `Ctrl + ,` ou vá em **File → Preferences → Settings**
3. Na barra de pesquisa, digite: `Model Context Protocol`

### Passo 2: Adicionar MCP Tool
1. Clique em **Tools** no menu lateral
2. Encontre a seção **Model Context Protocol (MCP)**
3. Clique no botão **+ Add MCP tool**

### Passo 3: Configurar Dados
Preencha os campos exatamente como abaixo:

**Name:**
```
Vercel MCP - Notion Spark
```

**Command:**
```
node
```

**Args:** (copie exatamente)
```
["C:\\Users\\rafal\\cursor ai\\Notion Spark 2\\notion-spark-studio\\mcp-vercel\\dist\\index.js"]
```

**Environment Variables:**
```json
{
  "VERCEL_API_TOKEN": "Lm96ITyzKUtvkgCA8ZjzOJXH"
}
```

### Passo 4: Salvar e Reiniciar
1. Clique em **Save** ou **Apply**
2. **Reinicie o Cursor completamente** (feche e abra novamente)

## 🧪 Teste de Funcionamento

Após reiniciar o Cursor, teste com estes comandos:

### Comando 1: Listar Projetos
```
Liste meus projetos da Vercel
```

### Comando 2: Status do Notion Spark
```
Mostre detalhes do projeto notion-spark-studio
```

### Comando 3: Últimos Deployments
```
Quais foram os últimos 5 deployments?
```

### Comando 4: Status do Último Deploy
```
Qual é o status do último deployment de produção?
```

## 🎉 Comandos Avançados Disponíveis

### Monitoramento
- "Quantos deployments falharam hoje?"
- "Mostre deployments com erro"
- "Lista deployments de produção"

### Gestão de Projetos
- "Quais são minhas variáveis de ambiente?"
- "Buscar projeto por nome X"
- "Detalhes completos do projeto Y"

### Análise
- "Compare o tempo de build dos últimos deployments"
- "Quais regiões estão sendo usadas?"
- "Histórico de deployments da última semana"

## 🚨 Troubleshooting

### Problema: "MCP tool not found"
**Solução:** Verifique se o caminho está correto:
```
C:\Users\rafal\cursor ai\Notion Spark 2\notion-spark-studio\mcp-vercel\dist\index.js
```

### Problema: "Token inválido"
**Solução:** Confirme se o token está correto no Environment Variables:
```
Lm96ITyzKUtvkgCA8ZjzOJXH
```

### Problema: "Command not recognized"
**Solução:** 
1. Certifique-se que o Node.js está instalado
2. Teste no terminal: `node --version`
3. Recompile se necessário: `npm run build`

## ✅ Status Final
- [x] Token configurado
- [x] Servidor compilado
- [x] Configuração Cursor pronta
- [ ] **PRÓXIMO:** Configure no Cursor seguindo os passos acima

**Após configurar, você terá superpoderes Vercel diretamente no Cursor! 🚀** 