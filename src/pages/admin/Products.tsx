import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../../store/products';
import { ProductDialog } from '../../components/ProductDialog';
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

function Products() {
  const navigate = useNavigate();
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { 
    products, 
    loading, 
    error, 
    getProducts, 
    deleteProduct, 
    syncWithSupabase 
  } = useProductStore();

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowProductDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleRefresh = async () => {
    await getProducts();
  };

  const handleDialogClose = () => {
    setShowProductDialog(false);
    setSelectedProduct(null);
    // Refresh data after closing dialog
    getProducts();
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
            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
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
                setSelectedProduct(null);
                setShowProductDialog(true);
              }}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Produto
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
              Carregando produtos...
            </div>
          </div>
        )}

        {products.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h3>
            <p className="text-gray-500 mb-6">Comece adicionando seu primeiro produto</p>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setShowProductDialog(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Produto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-64 object-cover"
                      style={{ aspectRatio: '4/5' }}
                      onError={(e) => {
                        // If image fails to load, show placeholder instead of fallback image
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Placeholder that shows when no image or image fails */}
                  <div 
                    className="w-full h-64 bg-gray-200 flex items-center justify-center"
                    style={{ 
                      aspectRatio: '4/5',
                      display: product.imageUrl ? 'none' : 'flex'
                    }}
                  >
                    <div className="text-center">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Sem imagem</p>
                    </div>
                  </div>
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 bg-white/90 text-blue-600 hover:bg-white rounded-full shadow-sm transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-white/90 text-red-600 hover:bg-white rounded-full shadow-sm transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{product.name}</h3>
                    <span className="text-sm text-gray-500 ml-2">#{product.code}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.colors.slice(0, 3).map((color, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                      >
                        {color}
                      </span>
                    ))}
                    {product.colors.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        +{product.colors.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-emerald-600">
                      {formatCurrency(product.price)}
                    </p>
                    <span className="text-sm text-gray-500">
                      Estoque: {product.stockQuantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ProductDialog
          open={showProductDialog}
          onOpenChange={handleDialogClose}
          product={selectedProduct}
        />
      </div>
    </div>
  );
}

export default Products;