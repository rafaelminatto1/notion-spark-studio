#!/usr/bin/env node

/**
 * Script automatizado para corrigir warnings ESLint comuns
 * Foca em correções seguras e simples
 */

const fs = require('fs');
const path = require('path');

// Lista de tipos de correções a serem aplicadas
const fixes = {
  // Preferir nullish coalescing operator (??) em vez de logical or (||)
  nullishCoalescing: {
    // Padrões simples para variáveis básicas
    patterns: [
      {
        search: /(\w+\s*\?\.\w+\s*)\|\|\s*(\d+)/g,
        replace: '$1?? $2',
        description: 'Corrigir || para ?? com números'
      },
      {
        search: /(\w+\s*\?\.\w+\s*)\|\|\s*'([^']+)'/g,
        replace: '$1?? \'$2\'',
        description: 'Corrigir || para ?? com strings'
      },
      {
        search: /(\w+\s*\?\.\w+\s*)\|\|\s*"([^"]+)"/g,
        replace: '$1?? "$2"',
        description: 'Corrigir || para ?? com strings duplas'
      }
    ]
  },
  
  // Corrigir parâmetros não utilizados com prefixo _
  unusedParams: {
    patterns: [
      {
        search: /\(([a-zA-Z_]\w*),\s*([a-zA-Z_]\w*)\)\s*=>/g,
        replace: '(_$1, _$2) =>',
        description: 'Adicionar _ em parâmetros não utilizados'
      }
    ]
  },
  
  // Corrigir prefer-const
  preferConst: {
    patterns: [
      {
        search: /let\s+(\w+)\s*=\s*([^;]+);\s*$/gm,
        replace: 'const $1 = $2;',
        description: 'Mudar let para const quando apropriado'
      }
    ]
  }
};

// Arquivos que devem ser processados
const targetPatterns = [
  'src/**/*.ts',
  'src/**/*.tsx'
];

// Arquivos que devem ser ignorados
const ignorePatterns = [
  'node_modules',
  'dist',
  'build',
  '.next',
  '**/*.d.ts',
  '**/*.test.*',
  '**/*.spec.*'
];

function shouldProcessFile(filePath) {
  // Verificar se deve ser ignorado
  for (const ignore of ignorePatterns) {
    if (filePath.includes(ignore)) {
      return false;
    }
  }
  
  // Verificar se é um arquivo TypeScript/TSX
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

function applyFixes(content, filePath) {
  let modified = content;
  const appliedFixes = [];
  
  // Aplicar correções de nullish coalescing (mais seguras)
  for (const pattern of fixes.nullishCoalescing.patterns) {
    const before = modified;
    modified = modified.replace(pattern.search, pattern.replace);
    if (before !== modified) {
      appliedFixes.push(pattern.description);
    }
  }
  
  return { content: modified, fixes: appliedFixes };
}

function findTSFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!ignorePatterns.some(pattern => fullPath.includes(pattern))) {
          walk(fullPath);
        }
      } else if (shouldProcessFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function main() {
  console.log('🔧 Iniciando correção automatizada de warnings ESLint...\n');
  
  const rootDir = path.join(__dirname, '..');
  const srcDir = path.join(rootDir, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ Diretório src/ não encontrado');
    process.exit(1);
  }
  
  const files = findTSFiles(srcDir);
  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalFixes = 0;
  
  console.log(`📁 Encontrados ${files.length} arquivos TypeScript\n`);
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = applyFixes(content, filePath);
      
      totalFiles++;
      
      if (result.fixes.length > 0) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        modifiedFiles++;
        totalFixes += result.fixes.length;
        
        const relativePath = path.relative(rootDir, filePath);
        console.log(`✅ ${relativePath}`);
        result.fixes.forEach(fix => {
          console.log(`   • ${fix}`);
        });
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    }
  }
  
  console.log('\n📊 Resumo:');
  console.log(`   Arquivos analisados: ${totalFiles}`);
  console.log(`   Arquivos modificados: ${modifiedFiles}`);
  console.log(`   Total de correções: ${totalFixes}`);
  
  if (modifiedFiles > 0) {
    console.log('\n🎉 Correções aplicadas com sucesso!');
    console.log('💡 Execute "npm run lint" para verificar o resultado');
  } else {
    console.log('\n✨ Nenhuma correção necessária');
  }
}

if (require.main === module) {
  main();
}

module.exports = { applyFixes, findTSFiles }; 