import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useVisitStore } from '../store/visits';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Phone, MapPin, Package, CreditCard } from 'lucide-react';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarProps {
  vendorId?: string;
  onEventSelect?: (event: any) => void;
}

export function Calendar({ vendorId, onEventSelect }: CalendarProps) {
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [showVisitDetails, setShowVisitDetails] = useState(false);
  
  const { visits, getVisitsByVendor, syncWithSupabase } = useVisitStore();

  useEffect(() => {
    // Sync visits with Supabase when component mounts
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Filter visits based on vendorId if provided, otherwise use all visits
  const filteredVisits = vendorId 
    ? visits.filter(visit => visit.vendorId === vendorId)
    : visits;

  const events = filteredVisits.map(visit => ({
    id: visit.id,
    title: `${visit.clientName}`,
    start: new Date(visit.scheduledDate),
    end: new Date(new Date(visit.scheduledDate).getTime() + 60 * 60 * 1000), // 1 hour duration
    visit: visit,
  }));

  const handleEventSelect = (event: any) => {
    if (event.visit) {
      setSelectedVisit(event.visit);
      setShowVisitDetails(true);
    }
    
    // Call the optional onEventSelect prop if provided
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: '#3b82f6', // Blue background  
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const slotStyleGetter = () => {
    return {
      style: {
        color: 'white',
        border: 'none',
      }
    };
  };

  return (
    <div className="h-[600px] bg-white rounded-lg shadow-md p-4">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="pt-BR"
        onSelectEvent={handleEventSelect}
        eventPropGetter={eventStyleGetter}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "Não há eventos neste período.",
        }}
      />

      <Dialog.Root open={showVisitDetails} onOpenChange={setShowVisitDetails}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[500px]">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Detalhes da Visita
            </Dialog.Title>

            {selectedVisit && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-lg font-medium">{selectedVisit.clientName}</h3>
                  <span className={`px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800`}>
                    {selectedVisit.status === 'scheduled' ? 'Agendada' :
                     selectedVisit.status === 'in_negotiation' ? 'Em Negociação' :
                     selectedVisit.status === 'completed_purchase' ? 'Venda Realizada' :
                     selectedVisit.status === 'completed_no_purchase' ? 'Sem Venda' :
                     selectedVisit.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{selectedVisit.location}</span>
                  </div>

                  {selectedVisit.notes && (
                    <div className="text-gray-600">
                      <strong>Observações:</strong> {selectedVisit.notes}
                    </div>
                  )}
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Detalhes da Visita</h4>
                  <p className="text-gray-600">
                    Data: {format(new Date(selectedVisit.scheduledDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowVisitDetails(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}

            <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}