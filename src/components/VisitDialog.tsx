import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useVisitStore, Visit, VisitStatus } from '../store/visits';
import { useAuth } from '../contexts/AuthContext';

interface VisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit?: Visit;
  mode?: 'create' | 'edit' | 'view';
}

const visitStatusOptions: { value: VisitStatus; label: string }[] = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'in_negotiation', label: 'Em Negociação' },
  { value: 'completed_purchase', label: 'Finalizado - Comprou' },
  { value: 'completed_no_purchase', label: 'Finalizado - Não Comprou' },
  { value: 'rescheduled', label: 'Reagendado' },
  { value: 'absent', label: 'Cliente Ausente' },
  { value: 'thinking', label: 'Cliente vai Pensar' }
];

export function VisitDialog({ open, onOpenChange, visit, mode = 'create' }: VisitDialogProps) {
  const { profile } = useAuth();
  const [clientName, setClientName] = useState(visit?.clientName || '');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(
    visit?.scheduledDate ? new Date(visit.scheduledDate) : null
  );
  const [status, setStatus] = useState<VisitStatus>(visit?.status || 'scheduled');
  const [notes, setNotes] = useState(visit?.notes || '');
  const [followUpDate, setFollowUpDate] = useState<Date | null>(
    visit?.followUpDate ? new Date(visit.followUpDate) : null
  );
  const [rejectionReason, setRejectionReason] = useState(visit?.rejectionReason || '');
  const [maintenanceType, setMaintenanceType] = useState(visit?.maintenanceType || '');
  const [location, setLocation] = useState(visit?.location || '');

  const addVisit = useVisitStore(state => state.addVisit);
  const updateVisit = useVisitStore(state => state.updateVisit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledDate || !profile?.id) return;

    const visitData = {
      clientName,
      vendorId: profile.id,
      scheduledDate: scheduledDate.toISOString(),
      status,
      notes,
      followUpDate: followUpDate?.toISOString(),
      rejectionReason,
      maintenanceType,
      location
    };

    if (visit) {
      updateVisit(visit.id, visitData);
    } else {
      addVisit(visitData);
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setClientName('');
    setScheduledDate(null);
    setStatus('scheduled');
    setNotes('');
    setFollowUpDate(null);
    setRejectionReason('');
    setMaintenanceType('');
    setLocation('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[500px] max-h-[85vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {mode === 'create' ? 'Nova Visita' : mode === 'edit' ? 'Editar Visita' : 'Detalhes da Visita'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Cliente</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data da Visita</label>
              <DatePicker
                selected={scheduledDate}
                onChange={(date) => setScheduledDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full px-3 py-2 border rounded-md"
                disabled={mode === 'view'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VisitStatus)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={mode === 'view'}
                required
              >
                {visitStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Localização</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Endereço da visita"
                disabled={mode === 'view'}
                required
              />
            </div>

            {status === 'thinking' && (
              <div>
                <label className="block text-sm font-medium mb-1">Data de Retorno</label>
                <DatePicker
                  selected={followUpDate}
                  onChange={(date) => setFollowUpDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={mode === 'view'}
                />
              </div>
            )}

            {status === 'completed_no_purchase' && (
              <div>
                <label className="block text-sm font-medium mb-1">Motivo da Não Compra</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  disabled={mode === 'view'}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Manutenção</label>
              <select
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={mode === 'view'}
              >
                <option value="">Selecione o tipo</option>
                <option value="preventive">Preventiva</option>
                <option value="corrective">Corretiva</option>
                <option value="installation">Instalação</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                disabled={mode === 'view'}
              />
            </div>

            {mode !== 'view' && (
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Salvar
                </button>
              </div>
            )}
          </form>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}