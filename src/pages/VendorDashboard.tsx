import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Users, BarChart3, LogOut, TrendingUp, UserCheck, ShoppingCart, Eye, Calendar as CalendarIcon, FileText, Wrench } from 'lucide-react';
import FixedLogo from '../components/FixedLogo';
import { ClientDialog } from '../components/ClientDialog';
import { VisitDialog } from '../components/VisitDialog';
import { SalesDialog } from '../components/SalesDialog';
import { MaintenanceDialog } from '../components/MaintenanceDialog';
import { Calendar } from '../components/Calendar';
import { useProductStore } from '../store/products';
import { useServiceStore } from '../store/services';
import { useClientStore } from '../store/clients';
import { useVisitStore, Visit } from '../store/visits';
import { formatCurrency } from '../utils/currencyFormatter';

function VendorDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showSalesDialog, setShowSalesDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | undefined>();
  const [currentView, setCurrentView] = useState<'dashboard' | 'products' | 'services' | 'reports' | 'calendar' | 'maintenance'>('dashboard');

  const products = useProductStore(state => state.products);
  const services = useServiceStore(state => state.services);
  const clients = useClientStore(state => state.getClientsByVendor(profile?.id || ''));
  const visits = useVisitStore(state => state.getVisitsByVendor(profile?.id || ''));

  const totalSales = clients.reduce((acc, client) => acc + client.totalValue, 0);
  const totalCommission = totalSales * 0.1; // 10% commission
  const receivedCommission = totalCommission * 0.7; // 70% received
  const pendingCommission = totalCommission - receivedCommission;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleViewChange = (view: 'dashboard' | 'products' | 'services' | 'reports' | 'calendar') => {
    setCurrentView(view);
  };

  const handleVisitSelect = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowVisitDialog(true);
  };

  const getVendorLevel = (sales: number) => {
    if (sales >= 100000) return { level: 'Diamante', color: 'text-blue-600' };
    if (sales >= 50000) return { level: 'Ouro', color: 'text-yellow-600' };
    if (sales >= 25000) return { level: 'Prata', color: 'text-gray-600' };
    return { level: 'Bronze', color: 'text-orange-600' };
  };

  const vendorLevel = getVendorLevel(totalSales);

  const visitStatusCount = visits.reduce((acc, visit) => {
    acc[visit.status] = (acc[visit.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const menuItems = [
    {
      icon: Package,
      label: 'Produtos',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      onClick: () => handleViewChange('products'),
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: ShoppingBag,
      label: 'Serviços',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => handleViewChange('services'),
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      label: 'Clientes',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => setShowClientDialog(true),
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: CalendarIcon,
      label: 'Agenda',
      color: 'bg-pink-500 hover:bg-pink-600',
      onClick: () => handleViewChange('calendar'),
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      icon: Eye,
      label: 'Nova Visita',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      onClick: () => setShowVisitDialog(true),
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: Wrench,
      label: 'Manutenção',
      color: 'bg-red-500 hover:bg-red-600',
      onClick: () => setShowMaintenanceDialog(true),
      gradient: 'from-red-500 to-red-600'
    },
    {
      icon: ShoppingCart,
      label: 'Vendas',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => setShowSalesDialog(true),
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: FileText,
      label: 'Orçamentos',
      color: 'bg-teal-500 hover:bg-teal-600',
      onClick: () => navigate('/vendor/quotations'),
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      icon: BarChart3,
      label: 'Relatórios',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      onClick: () => handleViewChange('reports'),
      gradient: 'from-indigo-500 to-indigo-600'
    }
  ];

  // Se não estiver no dashboard, mostrar a view específica em tela cheia
  if (currentView !== 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-cyan-600 hover:text-cyan-800 font-medium"
                >
                  ← Voltar ao Dashboard
                </button>
                <div className="w-16 h-16 flex items-center justify-center">
                  <FixedLogo />
                </div>
                <h1 className="text-xl font-semibold text-cyan-600">
                  {currentView === 'products' && 'Produtos Disponíveis'}
                  {currentView === 'services' && 'Serviços Disponíveis'}
                  {currentView === 'reports' && 'Relatórios'}
                  {currentView === 'calendar' && 'Agenda'}
                  {currentView === 'maintenance' && 'Agendamento de Manutenção'}
                </h1>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {currentView === 'calendar' && (
            <Calendar 
              vendorId={profile?.id} 
              onEventSelect={handleVisitSelect}
            />
          )}

          {currentView === 'products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-48 object-cover"
                      style={{ aspectRatio: '4/5' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  
                  <div 
                    className="w-full h-48 bg-gray-200 flex items-center justify-center"
                    style={{ 
                      aspectRatio: '4/5',
                      display: product.imageUrl ? 'none' : 'flex'
                    }}
                  >
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Código: {product.code}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.colors.slice(0, 2).map((color, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                        >
                          {color}
                        </span>
                      ))}
                      {product.colors.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                          +{product.colors.length - 2}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-lg font-semibold text-emerald-600">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentView === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-gray-600 text-sm mt-2">{service.description}</p>
                  <p className="mt-4 text-lg font-semibold text-blue-600">
                    {formatCurrency(service.price)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {currentView === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status das Visitas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600">Agendadas</h4>
                    <p className="text-2xl font-bold text-green-600">{visitStatusCount.scheduled || 0}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600">Em Negociação</h4>
                    <p className="text-2xl font-bold text-yellow-600">{visitStatusCount.in_negotiation || 0}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600">Finalizadas com Sucesso</h4>
                    <p className="text-2xl font-bold text-blue-600">{visitStatusCount.completed_purchase || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório Financeiro</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600">Total em Vendas</h4>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p>
                  </div>
                  <div className="bg-blue-50  rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600">Comissões Recebidas</h4>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(receivedCommission)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600">Comissões Pendentes</h4>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingCommission)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico de Vendas</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clients.map((client) => (
                        <tr key={client.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.purchasedItem}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {client.totalValue.toFixed(2)}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(client.totalValue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(client.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${client.isPremium ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                              {client.isPremium ? 'Premium' : 'Regular'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'maintenance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Agendamentos de Manutenção</h3>
                <p className="text-gray-600 mb-4">
                  Gerencie os agendamentos de manutenção dos equipamentos dos seus clientes.
                </p>
                <button
                  onClick={() => setShowMaintenanceDialog(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Agendar Nova Manutenção
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <VisitDialog
          open={showVisitDialog}
          onOpenChange={setShowVisitDialog}
          visit={selectedVisit}
          mode={selectedVisit ? 'edit' : 'create'}
        />
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 flex items-center justify-center">
                <FixedLogo />
              </div>
              <h1 className="text-xl font-semibold text-cyan-600">Painel do Vendedor</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Bem-vindo, {profile?.full_name}
            </h2>
            <div className={`font-medium ${vendorLevel.color}`}>
              Nível: {vendorLevel.level}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-xl shadow-md bg-gradient-to-br ${item.gradient} text-white transform hover:scale-105 transition-all duration-200`}
            >
              <item.icon className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3" />
              <span className="text-sm md:text-base font-medium text-center">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
          <div className="bg-green-100 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-green-600 bg-white rounded-full p-3">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-green-600 font-semibold">+15%</span>
            </div>
            <h3 className="text-gray-800 font-medium mb-2">Cadastros Iniciados</h3>
            <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
          </div>

          <div className="bg-blue-100 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-blue-600 bg-white rounded-full p-3">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <span className="text-green-600 font-semibold">+22%</span>
            </div>
            <h3 className="text-gray-800 font-medium mb-2">Vendas</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
          </div>

          <div className="bg-purple-100 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-purple-600 bg-white rounded-full p-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-green-600 font-semibold">+8%</span>
            </div>
            <h3 className="text-gray-800 font-medium mb-2">Meta Mensal</h3>
            <p className="text-2xl font-bold text-gray-900">68%</p>
          </div>

          <div className="bg-orange-100 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-orange-600 bg-white rounded-full p-3">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-green-600 font-semibold">+30%</span>
            </div>
            <h3 className="text-gray-800 font-medium mb-2">Visitas Realizadas</h3>
            <p className="text-2xl font-bold text-gray-900">{visits.length}</p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ClientDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
      />

      <VisitDialog
        open={showVisitDialog}
        onOpenChange={setShowVisitDialog}
        visit={selectedVisit}
        mode={selectedVisit ? 'edit' : 'create'}
      />

      <SalesDialog
        open={showSalesDialog}
        onOpenChange={setShowSalesDialog}
      />

      <MaintenanceDialog
        open={showMaintenanceDialog}
        onOpenChange={setShowMaintenanceDialog}
      />
    </div>
  );
}

export default VendorDashboard;