import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/products';
import { ProductDialog } from '../components/ProductDialog';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';

function Products() {
  const navigate = useNavigate();
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const products = useProductStore(state => state.products);
  const getProducts = useProductStore(state => state.getProducts);
  const deleteProduct = useProductStore(state => state.deleteProduct);

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
        console.error('Erro ao deletar produto:', error);
        alert('Erro ao deletar produto');
      }
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                  <span className="text-sm text-gray-500">Cód: {product.code}</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {product.colors.map((color, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                    >
                      {color}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-emerald-600">
                    {formatPrice(product.price)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ProductDialog
          open={showProductDialog}
          onOpenChange={setShowProductDialog}
          product={selectedProduct}
        />
      </div>
    </div>
  );
}

export default Products;