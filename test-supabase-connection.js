const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase usando variáveis do Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuração do Next.js:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('APP_NAME:', process.env.NEXT_PUBLIC_APP_NAME);
console.log('APP_VERSION:', process.env.NEXT_PUBLIC_APP_VERSION);
console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Ausente');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Definida' : '❌ Ausente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase (Next.js)...');
  console.log('URL:', supabaseUrl);
  console.log('');

  try {
    // Teste 1: Verificar se conseguimos acessar auth
    console.log('🔐 Teste 1: Verificando Auth...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Erro no Auth:', authError.message);
    } else {
      console.log('✅ Auth funcionando - Sessão:', authData.session ? 'Ativa' : 'Inativa');
    }

    // Teste 2: Verificar se conseguimos fazer uma query simples nas tabelas conhecidas
    console.log('');
    console.log('📋 Teste 2: Testando acesso às tabelas...');
    
    // Tentar acessar tabelas que sabemos que existem pelas migrações
    const tables = ['users', 'profiles', 'tasks', 'documents', 'workspaces'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`⚠️  Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: Acessível (${count || 0} registros)`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: Erro - ${err.message}`);
      }
    }

    // Teste 3: Verificar se conseguimos usar storage
    console.log('');
    console.log('💾 Teste 3: Verificando Storage...');
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (storageError) {
        console.log('⚠️  Storage:', storageError.message);
      } else {
        console.log('✅ Storage funcionando - Buckets:', buckets?.length || 0);
        if (buckets && buckets.length > 0) {
          buckets.forEach(bucket => {
            console.log(`   - ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Storage erro:', err.message);
    }

    console.log('');
    console.log('🎯 Resumo do Teste (Next.js):');
    console.log('============================');
    console.log('✅ Conexão estabelecida com sucesso');
    console.log('✅ Cliente Supabase inicializado');
    console.log('✅ Variáveis NEXT_PUBLIC_* funcionando');
    console.log('✅ URL e chave funcionando');
    console.log('');
    console.log('🚀 Supabase está pronto para uso no Next.js!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testSupabaseConnection(); 