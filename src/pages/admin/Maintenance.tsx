import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMaintenanceStore, getMaintenanceTypeLabel } from '../../store/maintenance';
import { useClientStore } from '../../store/clients';
import { MaintenanceDialog } from '../../components/MaintenanceDialog';
import { ArrowLeft, Plus, CreditCard as Edit, Trash2, MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function Maintenance() {
  const navigate = useNavigate();
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { 
    maintenances, 
    loading, 
    error, 
    getMaintenances, 
    deleteMaintenance, 
    completeMaintenance,
    clearError 
  } = useMaintenanceStore();
  
  const clients = useClientStore(state => state.clients);

  useEffect(() => {
    getMaintenances();
  }, [getMaintenances]);

  const handleEdit = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setShowMaintenanceDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await deleteMaintenance(id);
      } catch (error) {
        console.error('Error deleting maintenance:', error);
      }
    }
  };

  const handleComplete = async (id: string) => {
    if (confirm('Marcar esta manutenção como concluída?')) {
      try {
        await completeMaintenance(id, 'Manutenção concluída com sucesso');
      } catch (error) {
        console.error('Error completing maintenance:', error);
      }
    }
  };

  const handleWhatsAppContact = (maintenance: any) => {
    if (!maintenance.clientPhone) {
      alert('Cliente não possui telefone cadastrado');
      return;
    }

    if (!maintenance.scheduledDate || isNaN(new Date(maintenance.scheduledDate).getTime())) {
      alert('Data de agendamento inválida');
      return;
    }

    const message = `Olá ${maintenance.clientName}! 

🔧 *Lembrete de Manutenção - HidroMineral*

Temos um agendamento de manutenção para seu equipamento:

📋 *Tipo:* ${getMaintenanceTypeLabel(maintenance.maintenanceType)}
📅 *Data:* ${format(new Date(maintenance.scheduledDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
🏠 *Produto:* ${maintenance.productName}

${maintenance.notes ? `📝 *Observações:* ${maintenance.notes}` : ''}

Estaremos chegando no horário agendado. Qualquer dúvida, entre em contato!

Atenciosamente,
Equipe HidroMineral 💧`;

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = maintenance.clientPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agendado': return <Clock className="h-4 w-4" />;
      case 'em_andamento': return <AlertCircle className="h-4 w-4" />;
      case 'concluido': return <CheckCircle className="h-4 w-4" />;
      case 'cancelado': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const filteredMaintenances = maintenances.filter(maintenance => {
    if (filterStatus === 'all') return true;
    return maintenance.status === filterStatus;
  });

  const upcomingMaintenances = maintenances.filter(m => {
    if (!m.scheduledDate || isNaN(new Date(m.scheduledDate).getTime())) {
      return false;
    }
    const today = new Date();
    const maintenanceDate = new Date(m.scheduledDate);
    const diffTime = maintenanceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return m.status === 'agendado' && diffDays <= 7 && diffDays >= 0;
  });

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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Agendamento de Manutenção</h1>
          </div>
          <button
            onClick={() => {
              setSelectedMaintenance(null);
              setShowMaintenanceDialog(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agendar Manutenção
          </button>
        </div>

        {/* Upcoming Maintenances Alert */}
        {upcomingMaintenances.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">
              ⚠️ Manutenções Próximas ({upcomingMaintenances.length})
            </h3>
            <div className="space-y-2">
              {upcomingMaintenances.slice(0, 3).map(maintenance => (
                <div key={maintenance.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded p-3 gap-2">
                  <div className="flex-1">
                    <span className="font-medium">{maintenance.clientName}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {maintenance.scheduledDate && !isNaN(new Date(maintenance.scheduledDate).getTime())
                        ? format(new Date(maintenance.scheduledDate), "dd/MM 'às' HH:mm")
                        : 'Data inválida'
                      }
                    </span>
                    <div className="text-sm text-gray-500">
                      {getMaintenanceTypeLabel(maintenance.maintenanceType)}
                    </div>
                  </div>
                  {maintenance.clientPhone && (
                    <button
                      onClick={() => handleWhatsAppContact(maintenance)}
                      className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors w-full md:w-auto justify-center"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Contatar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({maintenances.length})
            </button>
            <button
              onClick={() => setFilterStatus('agendado')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'agendado'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Agendados ({maintenances.filter(m => m.status === 'agendado').length})
            </button>
            <button
              onClick={() => setFilterStatus('concluido')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === 'concluido'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Concluídos ({maintenances.filter(m => m.status === 'concluido').length})
            </button>
          </div>
        </div>

        {/* Maintenances List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredMaintenances.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Clock className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma manutenção encontrada</h3>
              <p className="text-gray-500 mb-6">
                {filterStatus === 'all' 
                  ? 'Comece agendando a primeira manutenção'
                  : `Nenhuma manutenção com status "${getStatusText(filterStatus)}"`
                }
              </p>
              <button
                onClick={() => setShowMaintenanceDialog(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agendar Primeira Manutenção
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMaintenances.map((maintenance) => (
                    <tr key={maintenance.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{maintenance.clientName}</div>
                        {maintenance.clientPhone && (
                          <div className="text-sm text-gray-500">{maintenance.clientPhone}</div>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{maintenance.productName}</div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getMaintenanceTypeLabel(maintenance.maintenanceType)}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {maintenance.scheduledDate && !isNaN(new Date(maintenance.scheduledDate).getTime())
                            ? format(new Date(maintenance.scheduledDate), "dd/MM/yyyy", { locale: ptBR })
                            : 'Data inválida'
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          {maintenance.scheduledDate && !isNaN(new Date(maintenance.scheduledDate).getTime())
                            ? format(new Date(maintenance.scheduledDate), "HH:mm", { locale: ptBR })
                            : '--:--'
                          }
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(maintenance.status)}`}>
                          {getStatusIcon(maintenance.status)}
                          <span className="ml-1">{getStatusText(maintenance.status)}</span>
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col md:flex-row gap-1 md:gap-2">
                          {maintenance.clientPhone && (
                            <button
                              onClick={() => handleWhatsAppContact(maintenance)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Contatar via WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(maintenance)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {maintenance.status === 'agendado' && (
                            <button
                              onClick={() => handleComplete(maintenance.id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Marcar como concluído"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(maintenance.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <MaintenanceDialog
          open={showMaintenanceDialog}
          onOpenChange={setShowMaintenanceDialog}
          maintenance={selectedMaintenance}
        />
      </div>
    </div>
  );
}

export default Maintenance;