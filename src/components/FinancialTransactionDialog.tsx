import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinancialStore, TransactionType, TRANSACTION_CATEGORIES, PAYMENT_METHODS, FinancialTransaction } from '../store/financial';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyFormatter';

interface FinancialTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinancialTransaction;
}

export function FinancialTransactionDialog({ open, onOpenChange, transaction }: FinancialTransactionDialogProps) {
  const { profile } = useAuth();
  const [type, setType] = useState<TransactionType>(transaction?.type || 'entrada');
  const [category, setCategory] = useState(transaction?.category || '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(
    transaction?.amount ? transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
  );
  const [date, setDate] = useState<Date>(
    transaction?.date ? new Date(transaction.date) : new Date()
  );
  const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method || 'Dinheiro');

  const { addTransaction, updateTransaction } = useFinancialStore();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !description || !amount) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const numericAmount = parseCurrencyInput(amount);
    
    const transactionData = {
      type,
      category,
      description,
      amount: numericAmount,
      date: date.toISOString(),
      payment_method: paymentMethod,
      vendor_id: profile?.id
    };

    try {
      if (transaction) {
        await updateTransaction(transaction.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Erro ao salvar transação');
    }
  };

  const resetForm = () => {
    setType('entrada');
    setCategory('');
    setDescription('');
    setAmount('');
    setDate(new Date());
    setPaymentMethod('Dinheiro');
  };

  const availableCategories = TRANSACTION_CATEGORIES[type] || [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-green-600" />
            {transaction ? 'Editar Transação' : 'Nova Transação Financeira'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Transação */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Transação *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType('entrada');
                    setCategory(''); // Reset category when changing type
                  }}
                  className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${
                    type === 'entrada'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  <div>
                    <div className="font-medium">Entrada</div>
                    <div className="text-xs">Receitas</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('saida');
                    setCategory(''); // Reset category when changing type
                  }}
                  className={`flex items-center justify-center p-4 border rounded-lg transition-colors ${
                    type === 'saida'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <TrendingDown className="h-5 w-5 mr-2" />
                  <div>
                    <div className="font-medium">Saída</div>
                    <div className="text-xs">Despesas</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium mb-1">Categoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione uma categoria</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium mb-1">Descrição *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descreva a transação"
                required
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0,00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Use vírgula para separar os centavos</p>
            </div>

            {/* Data e Método de Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data *</label>
                <DatePicker
                  selected={date}
                  onChange={(date) => setDate(date || new Date())}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Método de Pagamento *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resumo Visual */}
            <div className={`p-4 rounded-lg border-2 ${
              type === 'entrada' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${
                    type === 'entrada' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {type === 'entrada' ? '💰 Entrada' : '💸 Saída'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {category && `${category} - `}{description || 'Descrição da transação'}
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  type === 'entrada' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {type === 'entrada' ? '+' : '-'} R$ {amount || '0,00'}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors w-full md:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors w-full md:w-auto ${
                  type === 'entrada'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {transaction ? 'Atualizar' : 'Lançar'} {type === 'entrada' ? 'Entrada' : 'Saída'}
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