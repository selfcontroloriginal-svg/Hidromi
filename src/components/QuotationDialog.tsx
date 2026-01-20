import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Trash2, Share2, Download } from 'lucide-react';
import { useQuotationStore, QuotationItem } from '../store/quotations';
import { useClientStore } from '../store/clients';
import { useProductStore } from '../store/products';
import { useServiceStore } from '../store/services';
import { useAuth } from '../contexts/AuthContext';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { formatCurrency } from '../utils/currencyFormatter';

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId?: string;
}

export function QuotationDialog({ open, onOpenChange, quotationId }: QuotationDialogProps) {
  const { profile } = useAuth();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [validUntil, setValidUntil] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  const [notes, setNotes] = useState('');
  
  const clients = useClientStore(state => state.clients);
  const products = useProductStore(state => state.products);
  const services = useServiceStore(state => state.services);
  const quotations = useQuotationStore(state => state.quotations);
  const addQuotation = useQuotationStore(state => state.addQuotation);
  const updateQuotation = useQuotationStore(state => state.updateQuotation);

  useEffect(() => {
    if (quotationId) {
      const quotation = quotations.find(q => q.id === quotationId);
      if (quotation) {
        setSelectedClient({ value: quotation.client_id, label: clients.find(c => c.id === quotation.client_id)?.name });
        setItems(quotation.items);
        setValidUntil(new Date(quotation.valid_until));
        setNotes(quotation.notes);
      }
    }
  }, [quotationId, quotations, clients]);

  const handleAddItem = () => {
    setItems([...items, {
      id: '',
      type: 'product',
      name: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    
    if (field === 'id') {
      const [type, id] = value.split(':');
      const itemData = type === 'product' 
        ? products.find(p => p.id === id)
        : services.find(s => s.id === id);
      
      if (itemData) {
        item.id = id;
        item.type = type;
        item.name = itemData.name;
        item.price = itemData.price;
        item.total = item.quantity * itemData.price;
      }
    } else if (field === 'quantity') {
      item.quantity = value;
      item.total = value * item.price;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !profile?.id) return;

    const quotationData = {
      client_id: selectedClient.value,
      vendor_id: profile.id,
      items,
      total_value: calculateTotal(),
      status: 'draft' as const,
      valid_until: validUntil.toISOString(),
      notes
    };

    try {
      if (quotationId) {
        await updateQuotation(quotationId, quotationData);
      } else {
        await addQuotation(quotationData);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Erro ao salvar orçamento');
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedClient || items.length === 0) {
      alert('Por favor, selecione um cliente e adicione itens ao orçamento');
      return;
    }

    const client = clients.find(c => c.id === selectedClient.value);
    if (!client) {
      alert('Cliente não encontrado');
      return;
    }

    const quotationData = {
      id: quotationId || 'NOVO',
      client,
      items,
      total_value: calculateTotal(),
      valid_until: validUntil.toISOString(),
      notes,
      company: {
        name: 'HidroMineral',
        cnpj: '24.395.398/0001-70',
        phone: '(66) 2102-5000',
        address: 'Rua dos Cajueiros, 1366 - Bairro Setor Residencial Norte - Sinop-MT'
      }
    };

    try {
      const pdfBlob = await generateQuotationPDF(quotationData);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Orcamento_${client.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  const handleShareWhatsApp = async () => {
    if (!selectedClient || items.length === 0) {
      alert('Por favor, selecione um cliente e adicione itens ao orçamento');
      return;
    }

    const client = clients.find(c => c.id === selectedClient.value);
    if (!client) {
      alert('Cliente não encontrado');
      return;
    }

    // Create WhatsApp message with FIXED company data
    const message = `🏢 *HidroMineral*

Olá *${client.name}*! 

Segue o orçamento solicitado:

📋 *ORÇAMENTO #${quotationId || 'NOVO'}*
💰 *Valor Total: R$ ${calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*
📅 *Válido até: ${validUntil.toLocaleDateString('pt-BR')}*

*ITENS:*
${items.map(item => `• ${item.name}\n  Qtd: ${item.quantity} | Valor: R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join('\n\n')}

${notes ? `\n📝 *Observações:*\n${notes}\n` : ''}
---
📞 (66) 2102-5000
📍 Rua dos Cajueiros, 1366 - Bairro Setor Residencial Norte - Sinop-MT
🏢 CNPJ: 24.395.398/0001-70

*Aguardamos seu retorno para confirmarmos o pedido!*

_Obrigado pela confiança!_ ✨`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Try to get client phone number for direct message
    let whatsappUrl = '';
    if (client.phone) {
      // Remove non-numeric characters and format phone
      const cleanPhone = client.phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    } else {
      // Open WhatsApp without specific number
      whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    }

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  const resetForm = () => {
    setSelectedClient(null);
    setItems([]);
    setValidUntil(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setNotes('');
  };

  const allItems = [
    ...products.map(p => ({ value: `product:${p.id}`, label: `${p.name} (Produto)` })),
    ...services.map(s => ({ value: `service:${s.id}`, label: `${s.name} (Serviço)` }))
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[900px] max-h-[85vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {quotationId ? 'Editar Orçamento' : 'Novo Orçamento'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente</label>
              <Select
                value={selectedClient}
                onChange={setSelectedClient}
                options={clients.map(client => ({
                  value: client.id,
                  label: client.name
                }))}
                className="w-full"
                placeholder="Selecione um cliente"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Itens</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <Select
                        value={item.id ? { 
                          value: `${item.type}:${item.id}`,
                          label: `${item.name} (${item.type === 'product' ? 'Produto' : 'Serviço'})`
                        } : null}
                        onChange={(selected) => handleItemChange(index, 'id', selected?.value)}
                        options={allItems}
                        className="w-full min-w-[200px]"
                        placeholder="Selecione um item"
                      />
                    </div>
                    
                    <div className="w-20 flex-shrink-0">
                      <label className="block text-xs text-gray-500 mb-1">Qtd</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md"
                        min="1"
                      />
                    </div>

                    <div className="w-28 flex-shrink-0">
                      <label className="block text-xs text-gray-500 mb-1">Valor Unit.</label>
                      <input
                        type="text"
                        value={formatCurrency(item.price)}
                        className="w-full px-3 py-2 border rounded-md bg-gray-100"
                        disabled
                      />
                    </div>

                    <div className="w-28 flex-shrink-0">
                      <label className="block text-xs text-gray-500 mb-1">Total</label>
                      <input
                        type="text"
                        value={formatCurrency(item.total)}
                        className="w-full px-3 py-2 border rounded-md bg-gray-100 font-medium"
                        disabled
                      />
                    </div>

                    <div className="flex-shrink-0">
                      <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                      <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <div className="flex justify-end mt-4">
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-3 rounded-lg border border-blue-200">
                    <span className="font-medium text-gray-700">Total: </span>
                    <span className="text-xl font-bold text-blue-700">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Válido até</label>
              <DatePicker
                selected={validUntil}
                onChange={(date) => setValidUntil(date || new Date())}
                dateFormat="dd/MM/yyyy"
                className="w-full px-3 py-2 border rounded-md"
                minDate={new Date()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Adicione observações, condições especiais, forma de pagamento, etc..."
              />
            </div>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar WhatsApp
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Salvar
                </button>
              </div>
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