import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export type VisitStatus = 
  | 'scheduled' 
  | 'in_negotiation' 
  | 'completed_purchase'
  | 'completed_no_purchase'
  | 'rescheduled'
  | 'absent'
  | 'thinking';

export interface Visit {
  id: string;
  clientName: string;
  clientId?: string;
  vendorId: string;
  scheduledDate: string;
  status: VisitStatus;
  notes: string;
  followUpDate?: string;
  rejectionReason?: string;
  maintenanceType?: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

interface VisitStore {
  visits: Visit[];
  loading: boolean;
  error: string | null;
  addVisit: (visit: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateVisit: (id: string, visit: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;
  getVisitsByVendor: (vendorId: string) => Visit[];
  getVisitsByStatus: (status: VisitStatus) => Visit[];
  getUpcomingVisits: (vendorId: string) => Visit[];
  syncWithSupabase: () => Promise<void>;
}

export const useVisitStore = create<VisitStore>()(
  persist(
    (set, get) => ({
      visits: [],
      loading: false,
      error: null,
      
      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('visits')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          const visitsData = (data || []).map(visit => ({
            id: visit.id,
            clientName: visit.client_name,
            clientId: visit.client_id,
            vendorId: visit.vendor_id,
            scheduledDate: visit.scheduled_date,
            status: visit.status,
            notes: visit.notes || '',
            followUpDate: visit.follow_up_date,
            rejectionReason: visit.rejection_reason,
            maintenanceType: visit.maintenance_type,
            location: visit.location,
            createdAt: visit.created_at,
            updatedAt: visit.updated_at
          }));

          set({ visits: visitsData });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },
      
      addVisit: async (visit) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('visits')
            .insert([{
              client_name: visit.clientName,
              client_id: visit.clientId,
              vendor_id: visit.vendorId,
              scheduled_date: visit.scheduledDate,
              status: visit.status,
              notes: visit.notes,
              follow_up_date: visit.followUpDate,
              rejection_reason: visit.rejectionReason,
              maintenance_type: visit.maintenanceType,
              location: visit.location
            }])
            .select()
            .single();

          if (error) {
            throw error;
          }

          const newVisit = {
            id: data.id,
            clientName: data.client_name,
            clientId: data.client_id,
            vendorId: data.vendor_id,
            scheduledDate: data.scheduled_date,
            status: data.status,
            notes: data.notes || '',
            followUpDate: data.follow_up_date,
            rejectionReason: data.rejection_reason,
            maintenanceType: data.maintenance_type,
            location: data.location,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
          
          set(state => ({
            visits: [newVisit, ...state.visits],
            loading: false
          }));
        } catch (error) {
          console.error('Error adding visit:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao adicionar visita'
          });
          throw error;
        }
      },

      updateVisit: async (id, visitUpdate) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('visits')
            .update({
              client_name: visitUpdate.clientName,
              client_id: visitUpdate.clientId,
              vendor_id: visitUpdate.vendorId,
              scheduled_date: visitUpdate.scheduledDate,
              status: visitUpdate.status,
              notes: visitUpdate.notes,
              follow_up_date: visitUpdate.followUpDate,
              rejection_reason: visitUpdate.rejectionReason,
              maintenance_type: visitUpdate.maintenanceType,
              location: visitUpdate.location,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            visits: state.visits.map(visit => 
              visit.id === id 
                ? { 
                    ...visit, 
                    ...visitUpdate,
                    updatedAt: new Date().toISOString()
                  } 
                : visit
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating visit:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao atualizar visita'
          });
          throw error;
        }
      },

      deleteVisit: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('visits')
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            visits: state.visits.filter(visit => visit.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting visit:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao excluir visita'
          });
          throw error;
        }
      },

      getVisitsByVendor: (vendorId) => {
        return get().visits.filter(visit => visit.vendorId === vendorId);
      },

      getVisitsByStatus: (status) => {
        return get().visits.filter(visit => visit.status === status);
      },

      getUpcomingVisits: (vendorId) => {
        const now = new Date();
        return get().visits.filter(visit => {
          const visitDate = new Date(visit.scheduledDate);
          return visit.vendorId === vendorId && visitDate >= now;
        }).sort((a, b) => 
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
      }
    }),
    {
      name: 'visits-storage',
      partialize: (state) => ({ visits: state.visits }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncWithSupabase();
        }
      }
    }
  )
);