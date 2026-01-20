export async function checkDatabaseTables() {
  const { supabase } = await import('../lib/supabase');
  
  try {
    // Lista todas as tabelas do schema public
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('Erro ao buscar tabelas:', error);
      return;
    }

    console.log('=== TABELAS NO BANCO DE DADOS ===');
    
    const systemTables = [
      'profiles',
      'products', 
      'services',
      'customers',
      'bank_accounts',
      'sales',
      'company_info',
      'quotations'
    ];

    const foundTables = tables?.map(t => t.table_name) || [];
    
    console.log('Tabelas do Sistema (esperadas):');
    systemTables.forEach(table => {
      const exists = foundTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    });

    console.log('\nTabelas Extras (podem não ser do sistema):');
    const extraTables = foundTables.filter(table => !systemTables.includes(table));
    
    if (extraTables.length === 0) {
      console.log('✅ Nenhuma tabela extra encontrada');
    } else {
      extraTables.forEach(table => {
        console.log(`❓ ${table}`);
      });
    }

    // Verificar dados em cada tabela do sistema
    console.log('\n=== CONTAGEM DE REGISTROS ===');
    for (const table of systemTables) {
      if (foundTables.includes(table)) {
        try {
          const { count, error: countError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            console.log(`${table}: ${count} registros`);
          }
        } catch (e) {
          console.log(`${table}: Erro ao contar registros`);
        }
      }
    }

    return {
      systemTables: foundTables.filter(table => systemTables.includes(table)),
      extraTables,
      totalTables: foundTables.length
    };

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Função para limpar dados de teste se necessário
export async function cleanTestData() {
  const { supabase } = await import('../lib/supabase');
  
  console.log('🧹 Iniciando limpeza de dados de teste...');
  
  try {
    // Limpar vendas de teste
    const { error: salesError } = await supabase
      .from('sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Manter apenas se houver dados específicos
    
    if (salesError) console.error('Erro ao limpar sales:', salesError);
    else console.log('✅ Sales limpo');

    // Limpar clientes de teste
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (customersError) console.error('Erro ao limpar customers:', customersError);
    else console.log('✅ Customers limpo');

    // Limpar produtos de teste
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (productsError) console.error('Erro ao limpar products:', productsError);
    else console.log('✅ Products limpo');

    console.log('🎉 Limpeza concluída!');
    
  } catch (error) {
    console.error('Erro durante limpeza:', error);
  }
}