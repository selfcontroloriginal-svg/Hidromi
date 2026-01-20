import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, MessageCircle } from 'lucide-react';
import { useMaintenanceStore, MaintenanceType, MaintenanceStatus, getMaintenanceTypeLabel } from '../store/maintenance';
import { useClientStore } from '../store/clients';
import { useProductStore } from '../store/products';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance?: any;
  clientId?: string;
}

export function MaintenanceDialog({ open, onOpenChange, maintenance, clientId }: MaintenanceDialogProps) {
  const { profile } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string>(clientId || maintenance?.client_id || '');
  const [selectedProduct, setSelectedProduct] = useState(maintenance?.product_name || '');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>(maintenance?.maintenance_type || 'refil_30');
  const [scheduledDate, setScheduledDate] = useState<Date>(
    maintenance?.scheduled_date ? new Date(maintenance.scheduled_date) : new Date()
  );
  const [notes, setNotes] = useState(maintenance?.notes || '');
  const [status, setStatus] = useState<MaintenanceStatus>(maintenance?.status || 'agendado');

  const clients = useClientStore(state => state.clients);
  const products = useProductStore(state => state.products);
  const { addMaintenance, updateMaintenance } = useMaintenanceStore();

  const selectedClientData = clients.find(c => c.id === selectedClient);

  const maintenanceTypes: { value: MaintenanceType; label: string; description: string }[] = [
    { value: 'refil_30', label: 'Refil 30 dias', description: 'Troca de refil com validade de 30 dias' },
    { value: 'refil_90', label: 'Refil 90 dias', description: 'Troca de refil com validade de 90 dias' },
    { value: 'refil_120', label: 'Refil 120 dias', description: 'Troca de refil com validade de 120 dias' },
    { value: 'preventiva', label: 'Manutenção Preventiva', description: 'Verificação geral do equipamento' },
    { value: 'corretiva', label: 'Manutenção Corretiva', description: 'Reparo de problemas identificados' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !selectedProduct || !profile?.id) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    if (!client) {
      alert('Cliente não encontrado');
      return;
    }

    const maintenanceData = {
      client_id: selectedClient,
      client_name: client.name,
      client_phone: client.phone,
      product_name: selectedProduct,
      maintenance_type: maintenanceType,
      scheduled_date: scheduledDate.toISOString(),
      status,
      notes,
      vendor_id: profile.id,
      vendor_name: profile.full_name
    };

    try {
      if (maintenance) {
        await updateMaintenance(maintenance.id, maintenanceData);
      } else {
        await addMaintenance(maintenanceData);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving maintenance:', error);
      alert('Erro ao salvar agendamento de manutenção');
    }
  };

  const resetForm = () => {
    setSelectedClient(clientId || '');
    setSelectedProduct('');
    setMaintenanceType('refil_30');
    setScheduledDate(new Date());
    setNotes('');
    setStatus('agendado');
  };

  const handleWhatsAppContact = () => {
    if (!selectedClientData?.phone) {
      alert('Cliente não possui telefone cadastrado');
      return;
    }

    const message = `Olá ${selectedClientData.name}! 

🔧 *Agendamento de Manutenção - HidroMineral*

Estamos entrando em contato para agendar a manutenção do seu equipamento:

📋 *Tipo:* ${getMaintenanceTypeLabel(maintenanceType)}
📅 *Data Agendada:* ${scheduledDate.toLocaleDateString('pt-BR')} às ${scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
🏠 *Produto:* ${selectedProduct}

${notes ? `📝 *Observações:* ${notes}` : ''}

Por favor, confirme se a data e horário estão adequados para você.

Atenciosamente,
Equipe HidroMineral 💧`;

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = selectedClientData.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 w-[95vw] max-w-[600px] max-h-[85vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4 flex items-center">
            🔧 {maintenance ? 'Editar Manutenção' : 'Agendar Manutenção'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.phone ? `- ${client.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Produto/Equipamento *</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Manutenção *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {maintenanceTypes.map(type => (
                  <label
                    key={type.value}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      maintenanceType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="maintenanceType"
                      value={type.value}
                      checked={maintenanceType === type.value}
                      onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data e Hora *</label>
                <DatePicker
                  selected={scheduledDate}
                  onChange={(date) => setScheduledDate(date || new Date())}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={30}
                  dateFormat="dd/MM/yyyy HH:mm"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minDate={new Date()}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="agendado">Agendado</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Detalhes sobre a manutenção, problemas identificados, etc..."
              />
            </div>

            {selectedClientData?.phone && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-green-800">Contato Direto</h4>
                    <p className="text-sm text-green-600">
                      Envie uma mensagem diretamente para {selectedClientData.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleWhatsAppContact}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-full md:w-auto"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors w-full md:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors w-full md:w-auto"
              >
                {maintenance ? 'Atualizar' : 'Agendar'} Manutenção
              </button>
            </div>
          </form>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}