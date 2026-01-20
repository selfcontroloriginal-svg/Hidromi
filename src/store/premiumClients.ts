import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PremiumClient {
  id: string;
  clientName: string;
  isPremium: boolean;
  paymentDue: string;
  planValue: number;
}

interface PremiumClientStore {
  clients: PremiumClient[];
  addClient: (client: Omit<PremiumClient, 'id'>) => void;
  getClients: () => PremiumClient[];
  getDuePayments: () => PremiumClient[];
}

export const usePremiumClientStore = create<PremiumClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      
      addClient: (client) => {
        const newClient = {
          ...client,
          id: crypto.randomUUID()
        };
        
        set(state => ({
          clients: [...state.clients, newClient]
        }));
      },

      getClients: () => {
        return get().clients;
      },

      getDuePayments: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        return get().clients.filter(client => 
          client.isPremium && client.paymentDue === tomorrowStr
        );
      }
    }),
    {
      name: 'premium-clients-storage'
    }
  )
);