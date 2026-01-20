import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useProductStore, Product } from '../store/products';
import { compressImage } from '../utils/imageUpload';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyFormatter';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [colors, setColors] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ncm, setNcm] = useState('');
  const [icms, setIcms] = useState('');
  const [ipi, setIpi] = useState('');
  const [pis, setPis] = useState('');
  const [cofins, setCofins] = useState('');
  const [cfop, setCfop] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addProduct, updateProduct, loading } = useProductStore();

  // Populate form when editing a product
  useEffect(() => {
    if (product && open) {
      setName(product.name);
      setCode(product.code);
      setColors(product.colors?.join(', ') || '');
      setPrice(product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setDescription(product.description);
      setPreviewUrl(product.imageUrl || '');
      setNcm(product.taxInfo?.ncm || '');
      setIcms(product.taxInfo?.icms?.toString() || '');
      setIpi(product.taxInfo?.ipi?.toString() || '');
      setPis(product.taxInfo?.pis?.toString() || '');
      setCofins(product.taxInfo?.cofins?.toString() || '');
      setCfop(product.taxInfo?.cfop || '');
      setImageFile(null); // Reset image file when editing
    } else if (!product && open) {
      // Reset form for new product
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setName('');
    setCode('');
    setColors('');
    setPrice('');
    setDescription('');
    setImageFile(null);
    setPreviewUrl('');
    setNcm('');
    setIcms('');
    setIpi('');
    setPis('');
    setCofins('');
    setCfop('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, etc.).');
      return;
    }

    // Validate file size (max 5MB for Base64 storage)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB para armazenamento otimizado.');
      return;
    }

    setIsUploading(true);

    try {
      // Compress image if it's too large
      let processedFile = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB, compress
        processedFile = await compressImage(file, 800, 0.8);
      }

      setImageFile(processedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Erro ao processar a imagem');
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      await processImageFile(file);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setPrice(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericPrice = parseCurrencyInput(price);
    
    const productData = {
      name,
      code,
      colors: colors.split(',').map(c => c.trim()).filter(c => c.length > 0),
      price: numericPrice,
      description,
      imageUrl: previewUrl, // This will be updated with the Base64 data
      stockQuantity: product?.stockQuantity || 0,
      taxInfo: {
        ncm,
        icms: Number(icms) || 0,
        ipi: Number(ipi) || 0,
        pis: Number(pis) || 0,
        cofins: Number(cofins) || 0,
        cfop
      }
    };

    try {
      if (product) {
        await updateProduct(product.id, productData, imageFile || undefined);
      } else {
        await addProduct(productData, imageFile || undefined);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    }
  };

  const handleDialogClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleDialogClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[700px] max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Nome do produto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Código *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Código do produto"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cores Disponíveis *</label>
              <input
                type="text"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Vermelho, Azul, Verde (separadas por vírgula)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Separe as cores com vírgulas</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
              <input
                type="text"
                value={price}
                onChange={handlePriceChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="75.000,00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Formato: 75.000,00 (use pontos para milhares e vírgula para centavos)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
                placeholder="Descrição detalhada do produto"
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium mb-2">Imagem do Produto</label>
              <div className="space-y-4">
                {previewUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Preview do produto"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="flex items-center text-white">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Processando imagem...
                        </div>
                      </div>
                    )}
                    {!isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Trocar Imagem
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                        <p className="text-lg font-medium text-gray-700">Processando imagem...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
                        <div className="text-center">
                          <p className="text-lg font-medium text-gray-700 mb-2">
                            Adicione uma imagem do produto
                          </p>
                          <p className="text-sm text-gray-500 mb-2">
                            Clique aqui ou arraste uma imagem
                          </p>
                          <p className="text-xs text-gray-400">
                            Formatos aceitos: JPG, PNG, GIF<br />
                            Tamanho máximo: 5MB<br />
                            Recomendado: 800x800px ou maior
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {!previewUrl && !isUploading && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Escolher Imagem do Computador
                  </button>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>💾 Armazenamento Otimizado:</strong> As imagens são convertidas e armazenadas 
                    diretamente no banco de dados, garantindo que permaneçam sempre disponíveis e 
                    não dependam de serviços externos.
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Informações Fiscais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">NCM *</label>
                  <input
                    type="text"
                    value={ncm}
                    onChange={(e) => setNcm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00000000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CFOP *</label>
                  <input
                    type="text"
                    value={cfop}
                    onChange={(e) => setCfop(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ICMS (%)</label>
                  <input
                    type="number"
                    value={icms}
                    onChange={(e) => setIcms(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IPI (%)</label>
                  <input
                    type="number"
                    value={ipi}
                    onChange={(e) => setIpi(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PIS (%)</label>
                  <input
                    type="number"
                    value={pis}
                    onChange={(e) => setPis(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">COFINS (%)</label>
                  <input
                    type="number"
                    value={cofins}
                    onChange={(e) => setCofins(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => handleDialogClose(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                disabled={loading || isUploading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || isUploading}
                className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {product ? 'Atualizar Produto' : 'Criar Produto'}
              </button>
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