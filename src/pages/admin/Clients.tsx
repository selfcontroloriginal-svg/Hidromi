import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientStore } from '../../store/clients';
import { ClientDialog } from '../../components/ClientDialog';
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

function Clients() {
  const navigate = useNavigate();
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const { 
    clients, 
    loading, 
    error, 
    getClients, 
    deleteClient, 
    clearError,
    syncWithSupabase 
  } = useClientStore();

  useEffect(() => {
    getClients();
  }, []);

  const handleEdit = (client) => {
    setSelectedClient(client);
    setShowClientDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteClient(id);
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleRefresh = async () => {
    await syncWithSupabase();
    await getClients();
  };

  const handleDialogClose = () => {
    setShowClientDialog(false);
    setSelectedClient(null);
    // Refresh data after closing dialog
    getClients();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clientes</h1>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => {
                setSelectedClient(null);
                setShowClientDialog(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Cliente
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={clearError}
              className="ml-2 text-red-800 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}

        {loading && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Carregando clientes...
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Documento
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Email
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    Endereço
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Agendamento
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500 md:hidden">
                        {client.phone || '-'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                          {client.documentType || 'CPF'}
                        </span>
                        {client.document || '-'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">{client.email || '-'}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{client.phone || '-'}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900">{client.address || '-'}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {client.scheduledDate ? new Date(client.scheduledDate).toLocaleString('pt-BR') : '-'}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ClientDialog
          open={showClientDialog}
          onOpenChange={handleDialogClose}
          client={selectedClient}
        />
      </div>
    </div>
  );
}

export default Clients;