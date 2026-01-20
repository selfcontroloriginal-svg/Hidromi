import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Users, UserCog, Wallet, LogOut, BarChart3, Building, TrendingUp, UserCheck, ShoppingCart, Eye, Calendar as CalendarIcon, FileText, Database, Receipt, Wrench } from 'lucide-react';
import FixedLogo from '../components/FixedLogo';
import { PaymentReminderDialog } from '../components/PaymentReminderDialog';
import { CompanyInfoDialog } from '../components/CompanyInfoDialog';
import { SalesDialog } from '../components/SalesDialog';
import { useProductStore } from '../store/products';
import { useServiceStore } from '../store/services';
import { useClientStore } from '../store/clients';
import { useVendorStore } from '../store/vendors';
import { useVisitStore } from '../store/visits';
import { useSalesStore } from '../store/sales';
import { formatCurrency } from '../utils/currencyFormatter';

function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [showPaymentReminder, setShowPaymentReminder] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [showSalesDialog, setShowSalesDialog] = useState(false);

  const products = useProductStore(state => state.products);
  const services = useServiceStore(state => state.services);
  const clients = useClientStore(state => state.clients);
  const vendors = useVendorStore(state => state.vendors);
  const visits = useVisitStore(state => state.visits);
  const { getTotalSales, getTotalRevenue } = useSalesStore();

  const totalRevenue = getTotalRevenue();
  const totalCommissions = vendors.reduce((acc, vendor) => acc + vendor.pendingCommissions, 0);
  const netRevenue = totalRevenue - totalCommissions;

  useEffect(() => {
    const checkDuePayments = () => {
      const overdueClients = clients.filter(client => {
        if (!client.dueDate) return false;
        const dueDate = new Date(client.dueDate);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return dueDate.toDateString() === tomorrow.toDateString();
      });

      if (overdueClients.length > 0) {
        setShowPaymentReminder(true);
      }
    };

    checkDuePayments();
    const interval = setInterval(checkDuePayments, 1800000);
    return () => clearInterval(interval);
  }, [clients]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { 
      icon: Package, 
      label: 'Produtos', 
      color: 'bg-emerald-500 hover:bg-emerald-600', 
      onClick: () => navigate('/admin/products'),
      gradient: 'from-emerald-500 to-emerald-600'
    },
    { 
      icon: ShoppingBag, 
      label: 'Serviços', 
      color: 'bg-blue-500 hover:bg-blue-600', 
      onClick: () => navigate('/admin/services'),
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      icon: Users, 
      label: 'Clientes', 
      color: 'bg-purple-500 hover:bg-purple-600', 
      onClick: () => navigate('/admin/clients'),
      gradient: 'from-purple-500 to-purple-600'
    },
    { 
      icon: UserCog, 
      label: 'Vendedores', 
      color: 'bg-orange-500 hover:bg-orange-600', 
      onClick: () => navigate('/admin/vendors'),
      gradient: 'from-orange-500 to-orange-600'
    },
    { 
      icon: Wallet, 
      label: 'Financeiro', 
      color: 'bg-cyan-500 hover:bg-cyan-600', 
      onClick: () => navigate('/admin/financial'),
      gradient: 'from-cyan-500 to-cyan-600'
    },
    { 
      icon: ShoppingCart, 
      label: 'Vendas', 
      color: 'bg-green-500 hover:bg-green-600', 
      onClick: () => setShowSalesDialog(true),
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Receipt,
      label: 'Gestão de Vendas',
      color: 'bg-teal-500 hover:bg-teal-600',
      onClick: () => navigate('/admin/sales'),
      gradient: 'from-teal-500 to-teal-600'
    },
    { 
      icon: BarChart3, 
      label: 'Relatórios', 
      color: 'bg-indigo-500 hover:bg-indigo-600', 
      onClick: () => navigate('/admin/reports'),
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: CalendarIcon,
      label: 'Agendamentos',
      color: 'bg-pink-500 hover:bg-pink-600',
      onClick: () => navigate('/admin/schedule'),
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      icon: FileText,
      label: 'Orçamentos',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      onClick: () => navigate('/admin/quotations'),
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: Wrench,
      label: 'Manutenção',
      color: 'bg-red-500 hover:bg-red-600',
      onClick: () => navigate('/admin/maintenance'),
      gradient: 'from-red-500 to-red-600'
    },
    {
      icon: Building,
      label: 'Empresa',
      color: 'bg-gray-500 hover:bg-gray-600',
      onClick: () => setShowCompanyInfo(true),
      gradient: 'from-gray-500 to-gray-600'
    },
    {
      icon: Database,
      label: 'Verificar BD',
      color: 'bg-red-500 hover:bg-red-600',
      onClick: () => navigate('/admin/database-check'),
      gradient: 'from-red-500 to-red-600'
    }
  ];

  const growthReports = [
    {
      icon: UserCheck,
      title: 'Cadastros Iniciados',
      value: clients.length.toString(),
      growth: '+25%',
      color: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: ShoppingCart,
      title: 'Vendas Realizadas',
      value: getTotalSales().toString(),
      growth: '+32%',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Receita Total',
      value: formatCurrency(totalRevenue),
      growth: '+28%',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: Eye,
      title: 'Visitas Realizadas',
      value: visits.length.toString(),
      growth: '+40%',
      color: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-100">
      <div className="bg-white bg-opacity-90 shadow backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center py-6">
            <div className="flex items-center">
              <FixedLogo />
            </div>
            <p className="text-xl text-cyan-600 font-medium mt-2">Sistema Oficial</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 backdrop-blur-sm mb-8">
          <div className="flex justify-between items-center">
            <span className="text-xl text-gray-700">Bem-vindo, {profile?.full_name}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair do Sistema
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center p-4 md:p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 bg-gradient-to-br ${item.gradient} text-white`}
              >
                <Icon className="h-8 w-8 md:h-12 md:w-12 mb-2 md:mb-4" />
                <span className="text-sm md:text-xl font-medium text-center">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {growthReports.map((report, index) => {
            const Icon = report.icon;
            return (
              <div key={index} className={`${report.color} rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`${report.iconColor} bg-white rounded-full p-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-green-600 font-semibold">{report.growth}</span>
                </div>
                <h3 className="text-gray-800 font-medium mb-2">{report.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{report.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <PaymentReminderDialog
        open={showPaymentReminder}
        onOpenChange={setShowPaymentReminder}
        duePayments={clients
          .filter(client => {
            if (!client.dueDate) return false;
            const dueDate = new Date(client.dueDate);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return dueDate.toDateString() === tomorrow.toDateString();
          })
          .map(client => ({
            clientName: client.name,
            dueDate: client.dueDate || '',
            value: client.totalValue
          }))}
      />

      <CompanyInfoDialog
        open={showCompanyInfo}
        onOpenChange={setShowCompanyInfo}
      />

      <SalesDialog
        open={showSalesDialog}
        onOpenChange={setShowSalesDialog}
      />
    </div>
  );
}

export default AdminDashboard;