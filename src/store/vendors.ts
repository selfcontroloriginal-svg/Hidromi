import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VendorLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Vendor {
  id: string;
  authId?: string; // ID do usuário de autenticação
  name: string;
  phone: string;
  email: string;
  address: string;
  photoUrl: string;
  commissionRate: number;
  totalSales: number;
  receivedCommissions: number;
  pendingCommissions: number;
  level: VendorLevel;
  createdAt: string;
}

interface VendorStore {
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'totalSales' | 'receivedCommissions' | 'pendingCommissions' | 'level' | 'createdAt'>) => Promise<void>;
  getVendors: () => Vendor[];
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  addSale: (id: string, amount: number) => void;
  payCommission: (id: string, amount: number) => void;
  calculateLevel: (vendor: Vendor) => VendorLevel;
}

// Sample data
const sampleVendors: Vendor[] = [
  {
    id: '1',
    name: 'Carlos Oliveira',
    phone: '(11) 98888-7777',
    email: 'carlos@example.com',
    address: 'Rua das Vendas, 123',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
    commissionRate: 10,
    totalSales: 75000,
    receivedCommissions: 5250,
    pendingCommissions: 2250,
    level: 'gold',
    createdAt: '2025-03-18T08:00:00.000Z'
  },
  {
    id: '2',
    name: 'Ana Silva',
    phone: '(11) 97777-6666',
    email: 'ana@example.com',
    address: 'Avenida do Comércio, 456',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    commissionRate: 10,
    totalSales: 120000,
    receivedCommissions: 8400,
    pendingCommissions: 3600,
    level: 'diamond',
    createdAt: '2025-03-18T08:30:00.000Z'
  },
  {
    id: '3',
    name: 'Roberto Santos',
    phone: '(11) 96666-5555',
    email: 'roberto@example.com',
    address: 'Rua do Sucesso, 789',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
    commissionRate: 10,
    totalSales: 35000,
    receivedCommissions: 2450,
    pendingCommissions: 1050,
    level: 'silver',
    createdAt: '2025-03-18T09:00:00.000Z'
  }
];

const calculateVendorLevel = (totalSales: number): VendorLevel => {
  if (totalSales >= 100000) return 'diamond';
  if (totalSales >= 50000) return 'gold';
  if (totalSales >= 25000) return 'silver';
  return 'bronze';
};

export const useVendorStore = create<VendorStore>()(
  persist(
    (set, get) => ({
      vendors: sampleVendors,
      
      addVendor: async (vendor) => {
        const newVendor = {
          ...vendor,
          id: crypto.randomUUID(),
          totalSales: 0,
          receivedCommissions: 0,
          pendingCommissions: 0,
          level: 'bronze',
          createdAt: new Date().toISOString()
        };
        
        set(state => ({
          vendors: [...state.vendors, newVendor]
        }));
      },

      getVendors: () => {
        return get().vendors;
      },

      updateVendor: (id, vendor) => {
        set(state => ({
          vendors: state.vendors.map(v => 
            v.id === id ? { ...v, ...vendor } : v
          )
        }));
      },

      deleteVendor: (id) => {
        set(state => ({
          vendors: state.vendors.filter(v => v.id !== id)
        }));
      },

      addSale: (id, amount) => {
        set(state => ({
          vendors: state.vendors.map(v => {
            if (v.id === id) {
              const newTotalSales = v.totalSales + amount;
              const commissionAmount = amount * (v.commissionRate / 100);
              return {
                ...v,
                totalSales: newTotalSales,
                pendingCommissions: v.pendingCommissions + commissionAmount,
                level: calculateVendorLevel(newTotalSales)
              };
            }
            return v;
          })
        }));
      },

      payCommission: (id, amount) => {
        set(state => ({
          vendors: state.vendors.map(v => {
            if (v.id === id) {
              return {
                ...v,
                receivedCommissions: v.receivedCommissions + amount,
                pendingCommissions: v.pendingCommissions - amount
              };
            }
            return v;
          })
        }));
      },

      calculateLevel: calculateVendorLevel
    }),
    {
      name: 'vendors-storage'
    }
  )
);