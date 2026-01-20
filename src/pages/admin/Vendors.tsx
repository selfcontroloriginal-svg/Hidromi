import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorStore } from '../../store/vendors';
import { VendorDialog } from '../../components/VendorDialog';
import { ArrowLeft, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';

function Vendors() {
  const navigate = useNavigate();
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const vendors = useVendorStore(state => state.vendors);
  const deleteVendor = useVendorStore(state => state.deleteVendor);

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setShowVendorDialog(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este vendedor?')) {
      deleteVendor(id);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'diamond': return 'text-blue-600';
      case 'gold': return 'text-yellow-600';
      case 'silver': return 'text-gray-600';
      default: return 'text-orange-600';
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
            <h1 className="text-2xl font-bold text-gray-900">Vendedores</h1>
          </div>
          <button
            onClick={() => {
              setSelectedVendor(null);
              setShowVendorDialog(true);
            }}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Vendedor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img
                      src={vendor.photoUrl}
                      alt={vendor.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{vendor.name}</h3>
                      <span className={`text-sm font-medium ${getLevelColor(vendor.level)}`}>
                        Nível {vendor.level.charAt(0).toUpperCase() + vendor.level.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">E-mail:</span>
                    <span className="text-gray-900">{vendor.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Telefone:</span>
                    <span className="text-gray-900">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Comissão:</span>
                    <span className="text-gray-900">{vendor.commissionRate}%</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total em Vendas</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {vendor.totalSales.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">+15%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <VendorDialog
          open={showVendorDialog}
          onOpenChange={setShowVendorDialog}
          vendor={selectedVendor}
        />
      </div>
    </div>
  );
}

export default Vendors;