import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface QuotationItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Quotation {
  id: string;
  client_id: string;
  vendor_id: string;
  items: QuotationItem[];
  total_value: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  valid_until: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface QuotationStore {
  quotations: Quotation[];
  loading: boolean;
  error: string | null;
  addQuotation: (quotation: Omit<Quotation, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  getQuotations: () => Promise<void>;
  getQuotationsByVendor: (vendorId: string) => Quotation[];
  clearError: () => void;
  syncWithSupabase: () => Promise<void>;
}

export const useQuotationStore = create<QuotationStore>()(
  persist(
    (set, get) => ({
      quotations: [],
      loading: false,
      error: null,
      
      clearError: () => set({ error: null }),
      
      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('quotations')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          set({ quotations: data || [] });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },
      
      addQuotation: async (quotation) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('quotations')
            .insert([{
              ...quotation,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) {
            throw error;
          }

          set(state => ({
            quotations: [data, ...state.quotations],
            loading: false
          }));
        } catch (error) {
          console.error('Error adding quotation:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao adicionar orçamento'
          });
          throw error;
        }
      },

      updateQuotation: async (id, quotation) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('quotations')
            .update({ ...quotation, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            quotations: state.quotations.map(q => 
              q.id === id ? { ...q, ...quotation, updated_at: new Date().toISOString() } : q
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating quotation:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao atualizar orçamento'
          });
          throw error;
        }
      },

      deleteQuotation: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('quotations')
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            quotations: state.quotations.filter(q => q.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting quotation:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao excluir orçamento'
          });
          throw error;
        }
      },

      getQuotations: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('quotations')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          set({ quotations: data || [], loading: false });
        } catch (error) {
          console.error('Error getting quotations:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar orçamentos'
          });
        }
      },

      getQuotationsByVendor: (vendorId) => {
        return get().quotations.filter(q => q.vendor_id === vendorId);
      }
    }),
    {
      name: 'quotations-storage',
      partialize: (state) => ({ quotations: state.quotations }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncWithSupabase();
        }
      }
    }
  )
);