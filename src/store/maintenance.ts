import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export type MaintenanceType = 'refil_30' | 'refil_90' | 'refil_120' | 'preventiva' | 'corretiva';
export type MaintenanceStatus = 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';

export interface Maintenance {
  id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  product_name: string;
  maintenance_type: MaintenanceType;
  scheduled_date: string;
  status: MaintenanceStatus;
  notes: string;
  vendor_id: string;
  vendor_name: string;
  created_at: string;
  completed_at?: string;
  next_maintenance_date?: string;
}

interface MaintenanceStore {
  maintenances: Maintenance[];
  loading: boolean;
  error: string | null;
  addMaintenance: (maintenance: Omit<Maintenance, 'id' | 'created_at'>) => Promise<void>;
  updateMaintenance: (id: string, maintenance: Partial<Maintenance>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;
  getMaintenances: () => Promise<void>;
  getMaintenancesByVendor: (vendorId: string) => Maintenance[];
  getUpcomingMaintenances: () => Maintenance[];
  completeMaintenance: (id: string, notes?: string) => Promise<void>;
  clearError: () => void;
  syncWithSupabase: () => Promise<void>;
}

const getMaintenanceTypeLabel = (type: MaintenanceType): string => {
  const labels = {
    refil_30: 'Troca de Refil (30 dias)',
    refil_90: 'Troca de Refil (90 dias)',
    refil_120: 'Troca de Refil (120 dias)',
    preventiva: 'Manutenção Preventiva',
    corretiva: 'Manutenção Corretiva'
  };
  return labels[type];
};

const getNextMaintenanceDate = (type: MaintenanceType): string => {
  const now = new Date();
  const days = {
    refil_30: 30,
    refil_90: 90,
    refil_120: 120,
    preventiva: 180, // 6 meses
    corretiva: 90 // 3 meses
  };
  
  const nextDate = new Date(now.getTime() + days[type] * 24 * 60 * 60 * 1000);
  return nextDate.toISOString();
};

export const useMaintenanceStore = create<MaintenanceStore>()(
  persist(
    (set, get) => ({
      maintenances: [],
      loading: false,
      error: null,
      
      clearError: () => set({ error: null }),
      
      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('maintenances')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          set({ maintenances: data || [] });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },
      
      addMaintenance: async (maintenance) => {
        set({ loading: true, error: null });
        try {
          const maintenanceData = {
            client_id: maintenance.client_id,
            client_name: maintenance.client_name,
            client_phone: maintenance.client_phone,
            product_name: maintenance.product_name,
            maintenance_type: maintenance.maintenance_type,
            scheduled_date: maintenance.scheduled_date,
            status: maintenance.status,
            notes: maintenance.notes,
            vendor_id: maintenance.vendor_id,
            vendor_name: maintenance.vendor_name,
            next_maintenance_date: getNextMaintenanceDate(maintenance.maintenance_type)
          };

          const { data, error } = await supabase
            .from('maintenances')
            .insert([maintenanceData])
            .select()
            .single();

          if (error) {
            throw error;
          }

          set(state => ({
            maintenances: [data, ...state.maintenances],
            loading: false
          }));
        } catch (error) {
          console.error('Error adding maintenance:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao agendar manutenção'
          });
          throw error;
        }
      },

      updateMaintenance: async (id, maintenanceUpdate) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('maintenances')
            .update(maintenanceUpdate)
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            maintenances: state.maintenances.map(m => 
              m.id === id ? { ...m, ...maintenanceUpdate } : m
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating maintenance:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao atualizar manutenção'
          });
          throw error;
        }
      },

      deleteMaintenance: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('maintenances')
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            maintenances: state.maintenances.filter(m => m.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting maintenance:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao excluir manutenção'
          });
          throw error;
        }
      },

      getMaintenances: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('maintenances')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          set({ maintenances: data || [], loading: false });
        } catch (error) {
          console.error('Error getting maintenances:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar manutenções'
          });
        }
      },

      getMaintenancesByVendor: (vendorId) => {
        return get().maintenances.filter(m => m.vendor_id === vendorId);
      },

      getUpcomingMaintenances: () => {
        const now = new Date();
        return get().maintenances
          .filter(m => m.status === 'agendado' && new Date(m.scheduled_date) >= now)
          .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
      },

      completeMaintenance: async (id, notes) => {
        set({ loading: true, error: null });
        try {
          const maintenance = get().maintenances.find(m => m.id === id);
          if (!maintenance) throw new Error('Manutenção não encontrada');

          const updates: Partial<Maintenance> = {
            status: 'concluido',
            completed_at: new Date().toISOString(),
            notes: notes || maintenance.notes
          };

          await get().updateMaintenance(id, updates);
        } catch (error) {
          console.error('Error completing maintenance:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao concluir manutenção'
          });
          throw error;
        }
      }
    }),
    {
      name: 'maintenance-storage',
      partialize: (state) => ({ maintenances: state.maintenances }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncWithSupabase();
        }
      }
    }
  )
);

export { getMaintenanceTypeLabel, getNextMaintenanceDate };