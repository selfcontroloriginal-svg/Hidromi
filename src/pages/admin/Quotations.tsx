import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotationStore } from '../../store/quotations';
import { useClientStore } from '../../store/clients';
import { useAuth } from '../../contexts/AuthContext';
import { QuotationDialog } from '../../components/QuotationDialog';
import { ArrowLeft, Plus, Edit, Trash2, Send, Check, X, Share2, Download } from 'lucide-react';
import { generateQuotationPDF } from '../../utils/pdfGenerator';
import { useCompanyStore } from '../../store/company';
import { formatCurrency } from '../../utils/currencyFormatter';

function Quotations() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<string | undefined>();
  
  const quotations = useQuotationStore(state => state.quotations);
  const getQuotations = useQuotationStore(state => state.getQuotations);
  const updateQuotation = useQuotationStore(state => state.updateQuotation);
  const deleteQuotation = useQuotationStore(state => state.deleteQuotation);
  
  const clients = useClientStore(state => state.clients);
  const { info: companyInfo, getInfo } = useCompanyStore();

  useEffect(() => {
    if (profile) {
      getQuotations();
      getInfo();
    }
  }, [getQuotations, getInfo, profile]);

  const handleStatusChange = async (id: string, status: 'sent' | 'accepted' | 'rejected') => {
    try {
      await updateQuotation(id, { status });
    } catch (error) {
      console.error('Error updating quotation status:', error);
      alert('Erro ao atualizar status do orçamento');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      try {
        await deleteQuotation(id);
      } catch (error) {
        console.error('Error deleting quotation:', error);
        alert('Erro ao excluir orçamento');
      }
    }
  };

  const handleDownloadPDF = async (quotation: any) => {
    const client = clients.find(c => c.id === quotation.client_id);
    if (!client) {
      alert('Cliente não encontrado');
      return;
    }

    const quotationData = {
      id: quotation.id,
      client,
      items: quotation.items,
      total_value: quotation.total_value,
      valid_until: quotation.valid_until,
      notes: quotation.notes,
      company: companyInfo || {
        name: 'Empresa',
        cnpj: '00.000.000/0000-00',
        phone: '(00) 0000-0000',
        address: 'Endereço da empresa'
      }
    };

    try {
      const pdfBlob = await generateQuotationPDF(quotationData);
      
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

  const handleShareWhatsApp = async (quotation: any) => {
    const client = clients.find(c => c.id === quotation.client_id);
    if (!client) {
      alert('Cliente não encontrado');
      return;
    }

    const message = `🏢 *${companyInfo?.name || 'Empresa'}*

Olá *${client.name}*! 

Segue o orçamento solicitado:

📋 *ORÇAMENTO #${quotation.id}*
💰 *Valor Total: R$ ${quotation.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*
📅 *Válido até: ${new Date(quotation.valid_until).toLocaleDateString('pt-BR')}*

*ITENS:*
${quotation.items.map((item: any) => `• ${item.name}\n  Qtd: ${item.quantity} | Valor: R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join('\n\n')}

${quotation.notes ? `\n📝 *Observações:*\n${quotation.notes}\n` : ''}
---
📞 ${companyInfo?.phone || '(00) 0000-0000'}
📍 ${companyInfo?.address || 'Endereço da empresa'}
🏢 CNPJ: ${companyInfo?.cnpj || '00.000.000/0000-00'}

*Aguardamos seu retorno para confirmarmos o pedido!*

_Obrigado pela confiança!_ ✨`;

    const encodedMessage = encodeURIComponent(message);
    
    let whatsappUrl = '';
    if (client.phone) {
      const cleanPhone = client.phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    } else {
      whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    }

    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'sent': return 'Enviado';
      case 'accepted': return 'Aceito';
      case 'rejected': return 'Recusado';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          </div>
          <button
            onClick={() => {
              setSelectedQuotation(undefined);
              setShowQuotationDialog(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Orçamento
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Válido até
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotations.map((quotation) => {
                  const client = clients.find(c => c.id === quotation.client_id);
                  return (
                    <tr key={quotation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatCurrency(quotation.total_value)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(quotation.valid_until).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quotation.status)}`}>
                          {getStatusText(quotation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadPDF(quotation)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Baixar PDF"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(quotation)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                            title="Compartilhar no WhatsApp"
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                          {quotation.status === 'draft' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedQuotation(quotation.id);
                                  setShowQuotationDialog(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Editar orçamento"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(quotation.id, 'sent')}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                title="Enviar orçamento"
                              >
                                <Send className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {quotation.status === 'sent' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(quotation.id, 'accepted')}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                title="Marcar como aceito"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(quotation.id, 'rejected')}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Marcar como recusado"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(quotation.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Excluir orçamento"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <QuotationDialog
          open={showQuotationDialog}
          onOpenChange={setShowQuotationDialog}
          quotationId={selectedQuotation}
        />
      </div>
    </div>
  );
}

export default Quotations;