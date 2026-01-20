import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Trash2, RefreshCw } from 'lucide-react';
import { checkDatabaseTables, cleanTestData } from '../../utils/databaseCheck';

function DatabaseCheck() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleCheckDatabase = async () => {
    setIsChecking(true);
    try {
      const result = await checkDatabaseTables();
      setResults(result);
    } catch (error) {
      console.error('Erro ao verificar banco:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCleanData = async () => {
    if (!confirm('Tem certeza que deseja limpar os dados de teste? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsCleaning(true);
    try {
      await cleanTestData();
      alert('Dados de teste limpos com sucesso!');
      // Verificar novamente após limpeza
      await handleCheckDatabase();
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      alert('Erro ao limpar dados de teste');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Verificação do Banco de Dados</h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Análise do Banco</h2>
            <div className="flex gap-4">
              <button
                onClick={handleCheckDatabase}
                disabled={isChecking}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isChecking ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Database className="h-5 w-5 mr-2" />
                )}
                {isChecking ? 'Verificando...' : 'Verificar Banco'}
              </button>
              
              <button
                onClick={handleCleanData}
                disabled={isCleaning}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
              >
                {isCleaning ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5 mr-2" />
                )}
                {isCleaning ? 'Limpando...' : 'Limpar Dados de Teste'}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Esta ferramenta verifica se há dados no banco que não pertencem ao sistema de gestão empresarial.
            Abra o console do navegador (F12) para ver os detalhes completos.
          </div>

          {results && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Tabelas do Sistema</h3>
                <p className="text-green-700">
                  {results.systemTables?.length || 0} tabelas encontradas
                </p>
                <div className="mt-2 text-sm text-green-600">
                  {results.systemTables?.join(', ') || 'Nenhuma'}
                </div>
              </div>

              {results.extraTables?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Tabelas Extras</h3>
                  <p className="text-yellow-700">
                    {results.extraTables.length} tabelas que podem não ser do sistema
                  </p>
                  <div className="mt-2 text-sm text-yellow-600">
                    {results.extraTables.join(', ')}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Resumo</h3>
                <p className="text-blue-700">
                  Total de {results.totalTables} tabelas no banco de dados
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ Importante</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• As tabelas do Supabase Auth (auth.*) são normais e necessárias</li>
            <li>• Tabelas extras podem ser de outros projetos no mesmo banco</li>
            <li>• A limpeza remove apenas dados de teste, não as estruturas das tabelas</li>
            <li>• Sempre faça backup antes de limpar dados importantes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DatabaseCheck;