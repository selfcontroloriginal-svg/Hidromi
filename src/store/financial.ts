import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export type TransactionType = 'entrada' | 'saida';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_method: string;
  reference_id?: string;
  reference_type?: string;
  vendor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  transacoesHoje: number;
  maioresEntradas: FinancialTransaction[];
  maioresSaidas: FinancialTransaction[];
}

interface FinancialStore {
  transactions: FinancialTransaction[];
  loading: boolean;
  error: string | null;
  addTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<FinancialTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactions: () => Promise<void>;
  getTransactionsByDateRange: (startDate: string, endDate: string) => FinancialTransaction[];
  getTransactionsByType: (type: TransactionType) => FinancialTransaction[];
  getTransactionsByCategory: (category: string) => FinancialTransaction[];
  getSummary: () => FinancialSummary;
  clearError: () => void;
  syncWithSupabase: () => Promise<void>;
}

// Categorias predefinidas
export const TRANSACTION_CATEGORIES = {
  entrada: [
    'Vendas',
    'Serviços',
    'Comissões Recebidas',
    'Juros Recebidos',
    'Outras Receitas'
  ],
  saida: [
    'Fornecedores',
    'Salários',
    'Comissões Pagas',
    'Aluguel',
    'Energia Elétrica',
    'Telefone/Internet',
    'Combustível',
    'Manutenção',
    'Marketing',
    'Impostos',
    'Outras Despesas'
  ]
};

export const PAYMENT_METHODS = [
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'PIX',
  'Transferência Bancária',
  'Cheque',
  'Boleto'
];

export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      loading: false,
      error: null,
      
      clearError: () => set({ error: null }),
      
      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .order('date', { ascending: false });

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          set({ transactions: data || [] });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },
      
      addTransaction: async (transaction) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('financial_transactions')
            .insert([{
              ...transaction,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) {
            throw error;
          }

          set(state => ({
            transactions: [data, ...state.transactions],
            loading: false
          }));
        } catch (error) {
          console.error('Error adding transaction:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao adicionar transação'
          });
          throw error;
        }
      },

      updateTransaction: async (id, transactionUpdate) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('financial_transactions')
            .update({ ...transactionUpdate, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            transactions: state.transactions.map(t => 
              t.id === id ? { ...t, ...transactionUpdate, updated_at: new Date().toISOString() } : t
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error updating transaction:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao atualizar transação'
          });
          throw error;
        }
      },

      deleteTransaction: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            transactions: state.transactions.filter(t => t.id !== id),
            loading: false
          }));
        } catch (error) {
          console.error('Error deleting transaction:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao excluir transação'
          });
          throw error;
        }
      },

      getTransactions: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .order('date', { ascending: false });

          if (error) {
            throw error;
          }

          set({ transactions: data || [], loading: false });
        } catch (error) {
          console.error('Error getting transactions:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar transações'
          });
        }
      },

      getTransactionsByDateRange: (startDate, endDate) => {
        return get().transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return transactionDate >= start && transactionDate <= end;
        });
      },

      getTransactionsByType: (type) => {
        return get().transactions.filter(transaction => transaction.type === type);
      },

      getTransactionsByCategory: (category) => {
        return get().transactions.filter(transaction => transaction.category === category);
      },

      getSummary: () => {
        const transactions = get().transactions;
        const today = new Date().toDateString();
        
        const totalEntradas = transactions
          .filter(t => t.type === 'entrada')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalSaidas = transactions
          .filter(t => t.type === 'saida')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const saldo = totalEntradas - totalSaidas;
        
        const transacoesHoje = transactions
          .filter(t => new Date(t.date).toDateString() === today).length;
        
        const maioresEntradas = transactions
          .filter(t => t.type === 'entrada')
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        
        const maioresSaidas = transactions
          .filter(t => t.type === 'saida')
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        return {
          totalEntradas,
          totalSaidas,
          saldo,
          transacoesHoje,
          maioresEntradas,
          maioresSaidas
        };
      }
    }),
    {
      name: 'financial-storage',
      partialize: (state) => ({ transactions: state.transactions }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncWithSupabase();
        }
      }
    }
  )
);