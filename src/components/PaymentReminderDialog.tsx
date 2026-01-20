import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duePayments: Array<{
    clientName: string;
    dueDate: string;
    value: number;
  }>;
}

export function PaymentReminderDialog({ open, onOpenChange, duePayments }: PaymentReminderDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[500px] max-h-[80vh] overflow-y-auto shadow-xl">
          <Dialog.Title className="text-xl font-semibold mb-4 text-red-600">
            Cobranças Pendentes para Amanhã
          </Dialog.Title>

          <div className="space-y-4">
            {duePayments.map((payment, index) => (
              <div
                key={index}
                className="p-4 bg-red-50 border border-red-100 rounded-lg"
              >
                <h3 className="font-medium text-gray-900">{payment.clientName}</h3>
                <p className="text-sm text-gray-600">
                  Vencimento: {format(new Date(payment.dueDate), "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Valor: R$ {payment.value.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              Fechar
            </button>
          </div>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}