import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Package, ShoppingBag, Plus, User, CreditCard, FileText, DollarSign } from 'lucide-react';
import { useProductStore } from '../store/products';
import { useServiceStore } from '../store/services';
import { useClientStore } from '../store/clients';
import { useSalesStore } from '../store/sales';
import { ClientDialog } from './ClientDialog';
import { generateSalePDF } from '../utils/salePdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currencyFormatter';

interface SalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SaleItem = {
  id: string;
  type: 'product' | 'service';
  name: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
};

export function SalesDialog({ open, onOpenChange }: SalesDialogProps) {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<'items' | 'client' | 'payment' | 'summary'>('items');
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('money');
  const [installments, setInstallments] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [observations, setObservations] = useState('');

  const products = useProductStore(state => state.products);
  const services = useServiceStore(state => state.services);
  const clients = useClientStore(state => state.clients);
  const addSale = useSalesStore(state => state.addSale);

  const addItemToSale = (item: any, type: 'product' | 'service') => {
    const existingItem = selectedItems.find(i => i.id === item.id && i.type === type);
    
    if (existingItem) {
      setSelectedItems(selectedItems.map(i => 
        i.id === item.id && i.type === type 
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
          : i
      ));
    } else {
      const newItem: SaleItem = {
        id: item.id,
        type,
        name: item.name,
        price: item.price,
        quantity: 1,
        total: item.price,
        imageUrl: type === 'product' ? item.imageUrl : undefined
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const removeItemFromSale = (itemId: string, type: 'product' | 'service') => {
    setSelectedItems(selectedItems.filter(i => !(i.id === itemId && i.type === type)));
  };

  const updateItemQuantity = (itemId: string, type: 'product' | 'service', quantity: number) => {
    if (quantity <= 0) {
      removeItemFromSale(itemId, type);
      return;
    }

    setSelectedItems(selectedItems.map(i => 
      i.id === itemId && i.type === type 
        ? { ...i, quantity, total: quantity * i.price }
        : i
    ));
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount;
  };

  const handleFinalizeSale = async () => {
    if (!selectedClient || selectedItems.length === 0) {
      alert('Selecione um cliente e adicione itens à venda');
      return;
    }

    const saleData = {
      client: selectedClient,
      items: selectedItems,
      subtotal: calculateSubtotal(),
      discount,
      total: calculateTotal(),
      paymentMethod,
      installments,
      observations,
      vendor: profile?.full_name || 'Vendedor',
      vendorId: profile?.id || '',
      status: 'completed' as const,
      date: new Date().toISOString()
    };

    try {
      await addSale(saleData);
      // Don't show alert here, just close dialog
      resetSale();
      onOpenChange(false);
    } catch (error) {
      console.error('Error finalizing sale:', error);
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao finalizar venda';
      alert(`Erro ao finalizar venda: ${errorMessage}`);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedClient || selectedItems.length === 0) {
      alert('Selecione um cliente e adicione itens à venda');
      return;
    }

    const saleData = {
      id: crypto.randomUUID(),
      client: selectedClient,
      items: selectedItems,
      subtotal: calculateSubtotal(),
      discount,
      total: calculateTotal(),
      paymentMethod,
      installments,
      observations,
      vendor: profile?.full_name || 'Vendedor',
      company: {
        name: 'HidroMineral',
        cnpj: '24.395.398/0001-70',
        phone: '(66) 2102-5000',
        address: 'Rua dos Cajueiros, 1366 - Bairro Setor Residencial Norte - Sinop-MT'
      },
      date: new Date().toISOString()
    };

    try {
      const pdfBlob = await generateSalePDF(saleData);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Venda_${selectedClient.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF da venda');
    }
  };

  const resetSale = () => {
    setCurrentStep('items');
    setSelectedItems([]);
    setSelectedClient(null);
    setPaymentMethod('money');
    setInstallments(1);
    setDiscount(0);
    setObservations('');
  };

  const handleClientDialogClose = () => {
    setShowClientDialog(false);
    // Refresh clients after adding new one
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      money: 'Dinheiro',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      pix: 'PIX',
      transfer: 'Transferência',
      check: 'Cheque'
    };
    return methods[method] || method;
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[95vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-2xl font-semibold mb-6 flex items-center">
              <ShoppingBag className="h-6 w-6 mr-2 text-blue-600" />
              Sistema de Vendas
            </Dialog.Title>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[
                  { key: 'items', label: 'Itens', icon: Package },
                  { key: 'client', label: 'Cliente', icon: User },
                  { key: 'payment', label: 'Pagamento', icon: CreditCard },
                  { key: 'summary', label: 'Resumo', icon: FileText }
                ].map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.key;
                  const isCompleted = ['items', 'client', 'payment', 'summary'].indexOf(currentStep) > index;
                  
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isActive ? 'bg-blue-600 text-white' : 
                        isCompleted ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                      {index < 3 && (
                        <div className={`w-8 h-0.5 mx-4 ${
                          isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 'items' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Products Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        Produtos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                          <div key={product.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-32 object-cover rounded-md mb-3"
                              />
                            )}
                            <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold text-blue-600">
                                {formatCurrency(product.price)}
                              </span>
                              <button
                                onClick={() => addItemToSale(product, 'product')}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                              >
                                Vender
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ShoppingBag className="h-5 w-5 mr-2 text-cyan-600" />
                        Serviços
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((service) => (
                          <div key={service.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <h4 className="font-medium text-gray-900 mb-1">{service.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold text-cyan-600">
                                {formatCurrency(service.price)}
                              </span>
                              <button
                                onClick={() => addItemToSale(service, 'service')}
                                className="px-3 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 text-sm"
                              >
                                Vender
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cart Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrinho de Vendas</h3>
                    {selectedItems.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhum item selecionado</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedItems.map((item) => (
                          <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                              <button
                                onClick={() => removeItemFromSale(item.id, item.type)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.type, item.quantity - 1)}
                                  className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.type, item.quantity + 1)}
                                  className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-semibold">R$ {item.total.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold">Total:</span>
                            <span className="text-lg font-bold text-blue-600">
                              {formatCurrency(calculateSubtotal())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep('client')}
                    disabled={selectedItems.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Próximo: Selecionar Cliente
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'client' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Selecionar Cliente</h3>
                
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Escolha um cliente existente ou adicione um novo</p>
                  <button
                    onClick={() => setShowClientDialog(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cliente
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedClient?.id === client.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
                      {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep('items')}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setCurrentStep('payment')}
                    disabled={!selectedClient}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Próximo: Pagamento
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Forma de Pagamento</h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { value: 'money', label: 'Dinheiro', icon: DollarSign },
                    { value: 'credit', label: 'Cartão de Crédito', icon: CreditCard },
                    { value: 'debit', label: 'Cartão de Débito', icon: CreditCard },
                    { value: 'pix', label: 'PIX', icon: DollarSign },
                    { value: 'transfer', label: 'Transferência', icon: DollarSign },
                    { value: 'check', label: 'Cheque', icon: FileText }
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                          paymentMethod === method.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === 'credit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Parcelas
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num}x {num === 1 ? 'à vista' : `de R$ ${(calculateTotal() / num).toFixed(2)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desconto (R$)
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    max={calculateSubtotal()}
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Observações sobre a venda..."
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep('client')}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setCurrentStep('summary')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Próximo: Resumo
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'summary' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Resumo da Venda</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                      <p className="text-gray-700">{selectedClient?.name}</p>
                      {selectedClient?.email && <p className="text-sm text-gray-600">{selectedClient.email}</p>}
                      {selectedClient?.phone && <p className="text-sm text-gray-600">{selectedClient.phone}</p>}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Pagamento</h4>
                      <p className="text-gray-700">{getPaymentMethodText(paymentMethod)}</p>
                      {paymentMethod === 'credit' && installments > 1 && (
                        <p className="text-sm text-gray-600">{installments}x de R$ {(calculateTotal() / installments).toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Itens</h4>
                    <div className="space-y-2">
                      {selectedItems.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span>{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-3 pt-3 space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Desconto:</span>
                          <span>- {formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {observations && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                    <p className="text-gray-700">{observations}</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep('payment')}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Voltar
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleGeneratePDF}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </button>
                    <button
                      onClick={handleFinalizeSale}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Finalizar Venda
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ClientDialog
        open={showClientDialog}
        onOpenChange={handleClientDialogClose}
      />
    </>
  );
}