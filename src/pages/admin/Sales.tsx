import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalesStore } from '../../store/sales';
import { ArrowLeft, Search, Filter, Download, X, Eye, Ban, Calendar, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { generateSalePDF } from '../../utils/salePdfGenerator';
import * as Dialog from '@radix-ui/react-dialog';
import { formatCurrency } from '../../utils/currencyFormatter';

function Sales() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  
  const { 
    sales, 
    loading, 
    error, 
    getSales, 
    cancelSale, 
    getTotalSales,
    getTotalRevenue,
    clearError 
  } = useSalesStore();

  useEffect(() => {
    getSales();
  }, [getSales]);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = saleDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCancelSale = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita.')) {
      try {
        await cancelSale(id);
      } catch (error) {
        console.error('Error cancelling sale:', error);
      }
    }
  };

  const handleDownloadPDF = async (sale: any) => {
    try {
      const pdfBlob = await generateSalePDF(sale);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Venda_${sale.client.name.replace(/\s+/g, '_')}_${new Date(sale.date).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF da venda');
    }
  };

  const handleViewDetails = (sale: any) => {
    setSelectedSale(sale);
    setShowSaleDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Vendas</h1>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{getTotalSales()}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">R$ {getTotalRevenue().toFixed(2)}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sales.filter(sale => 
                    new Date(sale.date).toDateString() === new Date().toDateString() && 
                    sale.status === 'completed'
                  ).length}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {getTotalSales() > 0 ? (getTotalRevenue() / getTotalSales()).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por cliente, ID ou vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Concluídas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas as Datas</option>
              <option value="today">Hoje</option>
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={clearError}
              className="ml-2 text-red-800 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID / Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Itens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
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
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{sale.id.substring(0, 8)}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.client.name}</div>
                      {sale.client.phone && (
                        <div className="text-sm text-gray-500">{sale.client.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.vendor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.items.length} item(s)</div>
                      <div className="text-sm text-gray-500">
                        {sale.items.slice(0, 2).map(item => item.name).join(', ')}
                        {sale.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      {sale.discount > 0 && (
                        <div className="text-sm text-gray-500">
                          Desc: R$ {sale.discount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getPaymentMethodText(sale.paymentMethod)}</div>
                      {sale.installments > 1 && (
                        <div className="text-sm text-gray-500">{sale.installments}x</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sale.status)}`}>
                        {getStatusText(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(sale)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Ver detalhes"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(sale)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Baixar PDF"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        {sale.status === 'completed' && (
                          <button
                            onClick={() => handleCancelSale(sale.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Cancelar venda"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda encontrada</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'As vendas realizadas aparecerão aqui'
                }
              </p>
            </div>
          )}
        </div>

        {/* Sale Details Modal */}
        <Dialog.Root open={showSaleDetails} onOpenChange={setShowSaleDetails}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[800px] max-h-[85vh] overflow-y-auto">
              <Dialog.Title className="text-xl font-semibold mb-4">
                Detalhes da Venda #{selectedSale?.id.substring(0, 8)}
              </Dialog.Title>

              {selectedSale && (
                <div className="space-y-6">
                  {/* Sale Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Informações da Venda</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">ID:</span> {selectedSale.id}</div>
                        <div><span className="font-medium">Data:</span> {new Date(selectedSale.date).toLocaleString('pt-BR')}</div>
                        <div><span className="font-medium">Vendedor:</span> {selectedSale.vendor}</div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedSale.status)}`}>
                            {getStatusText(selectedSale.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Cliente</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Nome:</span> {selectedSale.client.name}</div>
                        {selectedSale.client.email && (
                          <div><span className="font-medium">Email:</span> {selectedSale.client.email}</div>
                        )}
                        {selectedSale.client.phone && (
                          <div><span className="font-medium">Telefone:</span> {selectedSale.client.phone}</div>
                        )}
                        {selectedSale.client.address && (
                          <div><span className="font-medium">Endereço:</span> {selectedSale.client.address}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Itens Vendidos</h4>
                    <div className="space-y-3">
                      {selectedSale.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white rounded p-3">
                          <div className="flex items-center space-x-3">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            )}
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                {item.type === 'product' ? 'Produto' : 'Serviço'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">R$ {item.total.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">
                              {item.quantity}x {formatCurrency(item.price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Totals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Pagamento</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Método:</span> {getPaymentMethodText(selectedSale.paymentMethod)}</div>
                        {selectedSale.installments > 1 && (
                          <div><span className="font-medium">Parcelas:</span> {selectedSale.installments}x de R$ {(selectedSale.total / selectedSale.installments).toFixed(2)}</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Valores</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(selectedSale.subtotal)}</span>
                        </div>
                        {selectedSale.discount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Desconto:</span>
                            <span>- {formatCurrency(selectedSale.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(selectedSale.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Observations */}
                  {selectedSale.observations && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                      <p className="text-sm text-gray-700">{selectedSale.observations}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleDownloadPDF(selectedSale)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </button>
                    {selectedSale.status === 'completed' && (
                      <button
                        onClick={() => {
                          handleCancelSale(selectedSale.id);
                          setShowSaleDetails(false);
                        }}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Cancelar Venda
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}

export default Sales;