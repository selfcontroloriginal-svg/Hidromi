import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText } from 'lucide-react';
import Select from 'react-select';
import { useClientStore } from '../store/clients';
import { useProductStore } from '../store/products';
import { useServiceStore } from '../store/services';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ItemType = 'product' | 'service';

export function SaleDialog({ open, onOpenChange }: SaleDialogProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [itemType, setItemType] = useState<ItemType>('product');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('money');
  const [installments, setInstallments] = useState('1');
  const [showNFeButton, setShowNFeButton] = useState(false);
  
  const clients = useClientStore(state => state.clients);
  const products = useProductStore(state => state.products);
  const services = useServiceStore(state => state.services);

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.name
  }));

  const itemOptions = (itemType === 'product' ? products : services).map(item => ({
    value: item.id,
    label: item.name,
    price: item.price
  }));

  const handleItemSelect = (selected: any) => {
    setSelectedItem(selected);
    if (selected) {
      setFinalPrice(selected.price.toString());
      setShowNFeButton(itemType === 'product');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sale submission here
    setShowNFeButton(true);
  };

  const handleGenerateNFe = () => {
    if (!selectedItem || !selectedClient) return;

    const product = products.find(p => p.id === selectedItem.value);
    if (!product) return;

    // Here you would integrate with your NF-e service
    const nfeData = {
      client: clients.find(c => c.id === selectedClient.value),
      product: {
        ...product,
        quantity: 1,
        totalPrice: Number(finalPrice)
      },
      taxInfo: product.taxInfo
    };

    console.log('Generating NF-e with data:', nfeData);
    // Implement your NF-e generation logic here
    alert('Gerando NF-e...');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[500px] max-h-[85vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Lançar Venda
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente</label>
              <Select
                options={clientOptions}
                value={selectedClient}
                onChange={setSelectedClient}
                placeholder="Selecione um cliente"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Item</label>
              <select
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value as ItemType);
                  setSelectedItem(null);
                  setShowNFeButton(e.target.value === 'product');
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="product">Produto</option>
                <option value="service">Serviço</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {itemType === 'product' ? 'Produto' : 'Serviço'}
              </label>
              <Select
                options={itemOptions}
                value={selectedItem}
                onChange={handleItemSelect}
                placeholder={`Selecione um ${itemType === 'product' ? 'produto' : 'serviço'}`}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Valor Final</label>
              <input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data de Pagamento</label>
              <DatePicker
                selected={paymentDate}
                onChange={(date) => setPaymentDate(date)}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border rounded-md"
                placeholderText="Selecione a data"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Método de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="money">Dinheiro</option>
                <option value="credit">Cartão de Crédito</option>
                <option value="debit">Cartão de Débito</option>
                <option value="pix">PIX</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>

            {paymentMethod === 'credit' && (
              <div>
                <label className="block text-sm font-medium mb-1">Parcelas</label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}x {i === 0 ? 'à vista' : ''}
                    </option>
                  ))}
                </select>
              </div>
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Salvar
              </button>
            </div>
          </form>

          {showNFeButton && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={handleGenerateNFe}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FileText className="w-5 h-5 mr-2" />
                Emitir NF-e
              </button>
            </div>
          )}

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}