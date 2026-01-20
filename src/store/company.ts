import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface CompanyInfo {
  id?: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
}

interface CompanyStore {
  info: CompanyInfo | null;
  loading: boolean;
  error: string | null;
  setInfo: (info: CompanyInfo) => Promise<void>;
  getInfo: () => Promise<void>;
  syncWithSupabase: () => Promise<void>;
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set, get) => ({
      info: null,
      loading: false,
      error: null,

      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('company_info')
            .select()
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          set({ info: data });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },

      setInfo: async (info) => {
        set({ loading: true, error: null });
        try {
          const { data: existing } = await supabase
            .from('company_info')
            .select()
            .limit(1)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from('company_info')
              .update(info)
              .eq('id', existing.id);

            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('company_info')
              .insert([info]);

            if (error) throw error;
          }

          set({ info, loading: false });
        } catch (error) {
          console.error('Error setting company info:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao salvar informações da empresa'
          });
          throw error;
        }
      },

      getInfo: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('company_info')
            .select()
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          
          set({ info: data, loading: false });
        } catch (error) {
          console.error('Error getting company info:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar informações da empresa'
          });
        }
      }
    }),
    {
      name: 'company-storage',
      partialize: (state) => ({ info: state.info }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncWithSupabase();
        }
      }
    }
  )
);