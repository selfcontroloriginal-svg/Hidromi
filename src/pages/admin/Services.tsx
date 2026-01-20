import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceStore } from '../../store/services';
import { ServiceDialog } from '../../components/ServiceDialog';
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

function Services() {
  const navigate = useNavigate();
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const { 
    services, 
    loading, 
    error, 
    getServices, 
    deleteService, 
    syncWithSupabase 
  } = useServiceStore();

  useEffect(() => {
    getServices();
  }, [getServices]);

  const handleEdit = (service) => {
    setSelectedService(service);
    setShowServiceDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        await deleteService(id);
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleRefresh = async () => {
    await syncWithSupabase();
    await getServices();
  };

  const handleDialogClose = (open) => {
    setShowServiceDialog(open);
    if (!open) {
      setSelectedService(null);
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
            <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => {
                setSelectedService(null);
                setShowServiceDialog(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Serviço
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Carregando serviços...
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">{service.description}</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(service.price)}
              </p>
            </div>
          ))}
        </div>

        <ServiceDialog
          open={showServiceDialog}
          onOpenChange={handleDialogClose}
          service={selectedService}
        />
      </div>
    </div>
  );
}

export default Services;