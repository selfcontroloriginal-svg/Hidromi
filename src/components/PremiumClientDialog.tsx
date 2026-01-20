import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X } from 'lucide-react';
import { usePremiumClientStore } from '../store/premiumClients';

interface PremiumClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PremiumClientData) => void;
}

export interface PremiumClientData {
  clientName: string;
  isPremium: boolean;
  paymentDue: string;
  planValue: number;
}

export function PremiumClientDialog({ open, onOpenChange, onSubmit }: PremiumClientDialogProps) {
  const [isPremium, setIsPremium] = React.useState(false);
  const [clientName, setClientName] = React.useState('');
  const [paymentDue, setPaymentDue] = React.useState('');
  const [planValue, setPlanValue] = React.useState('');
  const addClient = usePremiumClientStore(state => state.addClient);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientData = {
      clientName,
      isPremium,
      paymentDue,
      planValue: Number(planValue),
    };
    
    await addClient(clientData);
    onSubmit(clientData);
    onOpenChange(false);
    
    // Reset form
    setIsPremium(false);
    setClientName('');
    setPaymentDue('');
    setPlanValue('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[400px] max-h-[85vh] overflow-y-auto shadow-xl">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Cadastro de Cliente Premium
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="premium-switch" className="text-sm font-medium">
                Cliente Premium
              </label>
              <Switch.Root
                id="premium-switch"
                checked={isPremium}
                onCheckedChange={setIsPremium}
                className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-cyan-600 transition-colors"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>

            {isPremium && (
              <>
                <div>
                  <label htmlFor="payment-due" className="block text-sm font-medium mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    id="payment-due"
                    value={paymentDue}
                    onChange={(e) => setPaymentDue(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="plan-value" className="block text-sm font-medium mb-1">
                    Valor do Plano
                  </label>
                  <input
                    type="number"
                    id="plan-value"
                    value={planValue}
                    onChange={(e) => setPlanValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="R$ 0,00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md"
              >
                Salvar
              </button>
            </div>
          </form>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}