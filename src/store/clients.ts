import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  scheduledDate: string | null;
  created_at: string;
  totalValue: number;
  isPremium: boolean;
  purchasedItem: string | null;
  dueDate: string | null;
}

interface ClientStore {
  clients: Client[];
  loading: boolean;
  error: string | null;
  addClient: (client: Omit<Client, 'id' | 'created_at'>) => Promise<void>;
  getClients: () => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientsByVendor: (vendorId: string) => Client[];
  clearError: () => void;
  syncWithSupabase: () => Promise<void>;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      loading: false,
      error: null,
      
      clearError: () => set({ error: null }),
      
      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          const clientsWithDefaults: Client[] = (data || []).map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            documentType: 'CPF', // Default since this field doesn't exist in DB yet
            document: '', // Default since this field doesn't exist in DB yet
            scheduledDate: null, // This field doesn't exist in the current DB schema
            created_at: client.created_at,
            totalValue: 0, // This field doesn't exist in the current DB schema
            isPremium: false, // This field doesn't exist in the current DB schema
            purchasedItem: null, // This field doesn't exist in the current DB schema
            dueDate: null // This field doesn't exist in the current DB schema
          }));

          set({ clients: clientsWithDefaults });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },
      
      addClient: async (client) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('customers')
            .insert([{
              name: client.name,
              email: client.email,
              phone: client.phone,
              address: client.address
            }])
            .select()
            .single();

          if (error) {
            console.error('Supabase insert error:', error);
            if (error.code === '23505' && error.message.includes('email')) {
              throw new Error('Este email já está cadastrado no sistema');
            }
            throw new Error(`Erro ao salvar cliente: ${error.message}`);
          }

          const newClient: Client = {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            documentType: client.documentType || 'CPF',
            document: client.document || '',
            scheduledDate: client.scheduledDate,
            created_at: data.created_at,
            totalValue: client.totalValue || 0,
            isPremium: client.isPremium || false,
            purchasedItem: client.purchasedItem,
            dueDate: client.dueDate
          };

          set(state => ({
            clients: [newClient, ...state.clients],
            loading: false
          }));
          return data.id;
        } catch (error) {
          console.error('Error adding client:', error);
          const errorMessage = error instanceof Error
            ? error.message
            : 'Erro ao adicionar cliente. Verifique sua conexão com o banco de dados.';
          set({
            loading: false,
            error: errorMessage
          });
          throw error;
        }
      },

      getClients: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Supabase error:', error);
            set({
              loading: false,
              error: `Erro ao carregar clientes: ${error.message}`
            });
            return;
          }

          const clientsWithDefaults: Client[] = (data || []).map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            documentType: 'CPF',
            document: '',
            scheduledDate: null,
            created_at: client.created_at,
            totalValue: 0,
            isPremium: false,
            purchasedItem: null,
            dueDate: null
          }));

          set({ clients: clientsWithDefaults, loading: false });
        } catch (error) {
          console.error('Error getting clients:', error);
          set({
            loading: false,
            error: 'Erro ao carregar clientes. Verifique sua conexão com o banco de dados.'
          });
        }
      },

      updateClient: async (id, client) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('customers')
            .update({
              name: client.name,
              email: client.email,
              phone: client.phone,
              address: client.address
            })
            .eq('id', id);

          if (error) {
            console.error('Supabase update error:', error);
            if (error.code === '23505' && error.message.includes('email')) {
              throw new Error('Este email já está cadastrado no sistema');
            }
            throw new Error(`Erro ao atualizar cliente: ${error.message}`);
          }

          set(state => ({
            clients: state.clients.map(c =>
              c.id === id ? {
                ...c,
                ...client,
                documentType: client.documentType !== undefined ? client.documentType : c.documentType,
                document: client.document !== undefined ? client.document : c.document,
              } : c
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating client:', error);
          const errorMessage = error instanceof Error
            ? error.message
            : 'Erro ao atualizar cliente. Verifique sua conexão com o banco de dados.';
          set({
            loading: false,
            error: errorMessage
          });
          throw error;
        }
      },

      deleteClient: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

          if (error) {
            throw new Error(`Erro ao excluir cliente: ${error.message}`);
          }

          set(state => ({
            clients: state.clients.filter(c => c.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting client:', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Erro ao excluir cliente. Verifique sua conexão com o banco de dados.'
          });
          throw error;
        }
      },

      getClientsByVendor: (vendorId) => {
        return get().clients;
      }
    }),
    {
      name: 'clients-storage',
      partialize: (state) => ({ clients: state.clients })
    }
  )
);