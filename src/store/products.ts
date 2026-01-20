import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { uploadProductImage, deleteProductImage, isSupabaseImageUrl } from '../utils/imageUpload';

export interface Product {
  id: string;
  name: string;
  code: string;
  colors: string[];
  price: number;
  description: string;
  imageUrl: string;
  stockQuantity: number;
  createdAt: string;
  taxInfo: {
    ncm: string;
    icms: number;
    ipi: number;
    pis: number;
    cofins: number;
    cfop: string;
  };
}

interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>, imageFile?: File) => Promise<void>;
  getProducts: () => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>, imageFile?: File) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getMostSoldProducts: () => Product[];
  syncWithSupabase: () => Promise<void>;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      loading: false,
      error: null,
      
      syncWithSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Sync error:', error);
            return;
          }

          const products: Product[] = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            code: item.name, // Use name as code for now
            colors: ['Padrão'], // Default colors
            price: item.price,
            description: item.description || '',
            imageUrl: item.image_url || '',
            stockQuantity: item.stock_quantity,
            createdAt: item.created_at,
            taxInfo: {
              ncm: '00000000',
              icms: 0,
              ipi: 0,
              pis: 0,
              cofins: 0,
              cfop: '0000'
            }
          }));

          set({ products });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },
      
      addProduct: async (product, imageFile) => {
        set({ loading: true, error: null });
        try {
          let imageUrl = product.imageUrl || '';

          // If there's an image file, convert it to Base64
          if (imageFile) {
            const uploadResult = await uploadProductImage(imageFile, 'temp-id');
            if (uploadResult.success && uploadResult.url) {
              imageUrl = uploadResult.url;
            } else {
              console.warn('Image upload failed:', uploadResult.error);
            }
          }

          // Insert the product into Supabase
          const { data: productData, error: productError } = await supabase
            .from('products')
            .insert([{
              name: product.name,
              description: product.description,
              price: product.price,
              stock_quantity: product.stockQuantity,
              image_url: imageUrl
            }])
            .select()
            .single();

          if (productError) {
            throw productError;
          }

          const newProduct: Product = {
            id: productData.id,
            name: productData.name,
            code: product.code,
            colors: product.colors,
            price: productData.price,
            description: productData.description || '',
            imageUrl: productData.image_url || '',
            stockQuantity: productData.stock_quantity,
            createdAt: productData.created_at,
            taxInfo: product.taxInfo
          };

          set(state => ({
            products: [newProduct, ...state.products],
            loading: false
          }));

        } catch (error) {
          console.error('Error adding product:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao adicionar produto'
          });
          throw error;
        }
      },

      getProducts: async () => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          const products = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            code: item.name, // Use name as code for now
            colors: ['Padrão'], // Default colors
            price: item.price,
            description: item.description || '',
            imageUrl: item.image_url || '',
            stockQuantity: item.stock_quantity,
            createdAt: item.created_at,
            taxInfo: {
              ncm: '00000000',
              icms: 0,
              ipi: 0,
              pis: 0,
              cofins: 0,
              cfop: '0000'
            }
          }));

          set({ products, loading: false });
        } catch (error) {
          console.error('Error getting products:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar produtos'
          });
        }
      },

      updateProduct: async (id, productUpdate, imageFile) => {
        set({ loading: true, error: null });
        try {
          let imageUrl = productUpdate.imageUrl;

          // If there's a new image file, upload it
          if (imageFile) {
            const uploadResult = await uploadProductImage(imageFile, id);
            if (uploadResult.success && uploadResult.url) {
              imageUrl = uploadResult.url;
            } else {
              console.warn('Image upload failed:', uploadResult.error);
            }
          }

          // Update product in Supabase
          const { error } = await supabase
            .from('products')
            .update({
              name: productUpdate.name,
              description: productUpdate.description,
              price: productUpdate.price,
              stock_quantity: productUpdate.stockQuantity,
              image_url: imageUrl
            })
            .eq('id', id);

          if (error) {
            throw error;
          }

          // Update local state
          set(state => ({
            products: state.products.map(p => 
              p.id === id ? { ...p, ...productUpdate, imageUrl } : p
            ),
            loading: false
          }));

        } catch (error) {
          console.error('Error updating product:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao atualizar produto'
          });
          throw error;
        }
      },

      deleteProduct: async (id) => {
        set({ loading: true, error: null });
        try {
          // Delete product from Supabase
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

          if (error) {
            throw error;
          }

          // Update local state
          set(state => ({
            products: state.products.filter(p => p.id !== id),
            loading: false
          }));

        } catch (error) {
          console.error('Error deleting product:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Erro ao excluir produto'
          });
          throw error;
        }
      },

      getMostSoldProducts: () => {
        return get().products.sort((a, b) => b.stockQuantity - a.stockQuantity).slice(0, 5);
      }
    }),
    {
      name: 'products-storage',
      partialize: (state) => ({ 
        // Don't persist products in localStorage anymore since they're in Supabase
        products: []
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always sync with Supabase on app start
          state.syncWithSupabase();
        }
      }
    }
  )
);