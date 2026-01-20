import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface ServiceStore {
  services: Service[];
  loading: boolean;
  error: string | null;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  getServices: () => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
}

export const useServiceStore = create<ServiceStore>()(
  persist(
    (set, get) => ({
      services: [],
      loading: false,
      error: null,
      
      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          set({ services: data || [] });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },
      
      addService: async (service) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('services')
            .insert([service])
            .select()
            .single();

          if (error) {
            throw error;
          }

          set(state => ({
            services: [data, ...state.services],
            loading: false
          }));
        } catch (error) {
          console.error('Error adding service:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao adicionar serviço'
          });
          throw error;
        }
      },

      getServices: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          set({ services: data || [], loading: false });
        } catch (error) {
          console.error('Error getting services:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar serviços'
          });
        }
      },

      updateService: async (id, service) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('services')
            .update(service)
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            services: state.services.map(s => 
              s.id === id ? { ...s, ...service } : s
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating service:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao atualizar serviço'
          });
          throw error;
        }
      },

      deleteService: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            services: state.services.filter(s => s.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting service:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao excluir serviço'
          });
          throw error;
        }
      }
    }),
    {
      name: 'services-storage',
      partialize: (state) => ({ services: state.services }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncWithSupabase();
        }
      }
    }
  )
);