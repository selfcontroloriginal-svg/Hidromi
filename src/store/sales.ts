import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface SaleItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
}

export interface Sale {
  id: string;
  client: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  installments: number;
  observations: string;
  vendor: string;
  vendorId: string;
  status: 'completed' | 'cancelled';
  date: string;
  created_at: string;
}

interface SalesStore {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  addSale: (sale: Omit<Sale, 'id' | 'created_at'>) => Promise<void>;
  getSales: () => Promise<void>;
  cancelSale: (id: string) => Promise<void>;
  getSalesByVendor: (vendorId: string) => Sale[];
  getSalesByDateRange: (startDate: string, endDate: string) => Sale[];
  getTotalSales: () => number;
  getTotalRevenue: () => number;
  clearError: () => void;
  syncWithSupabase: () => Promise<void>;
}

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => ({
      sales: [],
      loading: false,
      error: null,
      
      clearError: () => set({ error: null }),
      
      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('sales_complete')
            .select(`
              *,
              customers!inner(id, name, email, phone)
            `)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          // Convert Supabase data to our Sale format
          const salesData: Sale[] = (data || []).map(sale => ({
            id: sale.id,
            client: {
              id: sale.client_id,
              name: sale.customers?.name || 'Cliente',
              email: sale.customers?.email,
              phone: sale.customers?.phone,
              address: null
            },
            items: sale.items || [],
            subtotal: sale.subtotal,
            discount: sale.discount,
            total: sale.total,
            paymentMethod: sale.payment_method,
            installments: sale.installments,
            observations: sale.observations || '',
            vendor: 'Vendedor', // We'll need to join with profiles table later
            vendorId: sale.vendor_id || '',
            status: sale.status,
            date: sale.sale_date,
            created_at: sale.created_at
          }));

          set({ sales: salesData });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },
      
      addSale: async (sale) => {
        set({ loading: true, error: null });
        try {
          // Save to Supabase
          const { data, error } = await supabase
            .from('sales_complete')
            .insert([{
              client_id: sale.client.id,
              vendor_id: sale.vendorId || null,
              items: sale.items,
              subtotal: sale.subtotal,
              discount: sale.discount,
              total: sale.total,
              payment_method: sale.paymentMethod,
              installments: sale.installments,
              observations: sale.observations,
              status: sale.status,
              sale_date: sale.date
            }])
            .select()
            .single();

          if (error) {
            console.error('Sales insert error:', error);
            throw error;
          }

          // Create financial transaction for the sale
          try {
            const { error: financialError } = await supabase
              .from('financial_transactions')
              .insert([{
                type: 'entrada',
                category: 'Vendas',
                description: `Venda para ${sale.client.name}`,
                amount: sale.total,
                date: sale.date,
                payment_method: sale.paymentMethod,
                reference_id: data.id,
                reference_type: 'sale',
                vendor_id: sale.vendorId
              }]);

            if (financialError) {
              console.warn('Error creating financial transaction:', financialError);
            }
          } catch (financialErr) {
            console.warn('Financial transaction table may not exist yet:', financialErr);
          }

          const newSale: Sale = {
            ...sale,
            id: data.id,
            created_at: data.created_at
          };

          set(state => ({
            sales: [newSale, ...state.sales],
            loading: false
          }));
        } catch (error) {
          console.error('Error adding sale:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao adicionar venda'
          });
          throw error;
        }
      },

      getSales: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('sales_complete')
            .select(`
              *,
              customers!inner(id, name, email, phone)
            `)
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          // Convert Supabase data to our Sale format
          const salesData: Sale[] = (data || []).map(sale => ({
            id: sale.id,
            client: {
              id: sale.client_id,
              name: sale.customers?.name || 'Cliente',
              email: sale.customers?.email,
              phone: sale.customers?.phone,
              address: null
            },
            items: sale.items || [],
            subtotal: sale.subtotal,
            discount: sale.discount,
            total: sale.total,
            paymentMethod: sale.payment_method,
            installments: sale.installments,
            observations: sale.observations || '',
            vendor: 'Vendedor',
            vendorId: sale.vendor_id || '',
            status: sale.status,
            date: sale.sale_date,
            created_at: sale.created_at
          }));

          set({ sales: salesData, loading: false });
        } catch (error) {
          console.error('Error getting sales:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar vendas'
          });
        }
      },

      cancelSale: async (id) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase
            .from('sales_complete')
            .update({ status: 'cancelled' })
            .eq('id', id);

          if (error) {
            throw error;
          }

          set(state => ({
            sales: state.sales.map(sale => 
              sale.id === id ? { ...sale, status: 'cancelled' } : sale
            ),
            loading: false
          }));
        } catch (error) {
          console.error('Error cancelling sale:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao cancelar venda'
          });
          throw error;
        }
      },

      getSalesByVendor: (vendorId) => {
        return get().sales.filter(sale => sale.vendorId === vendorId);
      },

      getSalesByDateRange: (startDate, endDate) => {
        return get().sales.filter(sale => {
          const saleDate = new Date(sale.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return saleDate >= start && saleDate <= end;
        });
      },

      getTotalSales: () => {
        return get().sales.filter(sale => sale.status === 'completed').length;
      },

      getTotalRevenue: () => {
        return get().sales
          .filter(sale => sale.status === 'completed')
          .reduce((sum, sale) => sum + sale.total, 0);
      }
    }),
    {
      name: 'sales-storage',
      partialize: (state) => ({ sales: state.sales }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncWithSupabase();
        }
      }
    }
  )
);