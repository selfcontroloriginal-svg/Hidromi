import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Eye, EyeOff, Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useVendorStore, Vendor } from '../store/vendors';
import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageUpload';

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor;
}

export function VendorDialog({ open, onOpenChange, vendor }: VendorDialogProps) {
  const [name, setName] = useState(vendor?.name || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [email, setEmail] = useState(vendor?.email || '');
  const [address, setAddress] = useState(vendor?.address || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(vendor?.photoUrl || '');
  const [commissionRate, setCommissionRate] = useState(vendor?.commissionRate?.toString() || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addVendor = useVendorStore(state => state.addVendor);
  const updateVendor = useVendorStore(state => state.updateVendor);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setConfirmPassword(result);
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
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Compress image if it's too large
      let processedFile = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB, compress
        processedFile = await compressImage(file, 400, 0.8); // Smaller size for profile photos
      }

      setPhotoFile(processedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Erro ao processar a imagem');
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendor && (!password || password !== confirmPassword)) {
      alert('As senhas devem coincidir');
      return;
    }

    if (!vendor && password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      let finalPhotoUrl = previewUrl;
      
      // If there's a new photo file, use the Base64 data
      if (photoFile && previewUrl.startsWith('data:image/')) {
        finalPhotoUrl = previewUrl;
      }

      const vendorData = {
        name,
        phone,
        email,
        address,
        photoUrl: finalPhotoUrl,
        commissionRate: Number(commissionRate)
      };

      if (vendor) {
        // Atualizar vendedor existente
        await updateVendor(vendor.id, vendorData);
        alert('Vendedor atualizado com sucesso!');
      } else {
        // Criar novo vendedor com autenticação
        
        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: name,
              role: 'vendor'
            }
          }
        });

        if (authError) {
          throw new Error(`Erro ao criar login: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('Erro ao criar usuário');
        }

        // 2. Criar perfil do vendedor
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            role: 'vendor',
            full_name: name
          }]);

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          // Continuar mesmo se houver erro no perfil, pois o usuário foi criado
        }

        // 3. Adicionar vendedor ao store local
        await addVendor({
          ...vendorData,
          authId: authData.user.id // Guardar referência do ID de autenticação
        });

        alert(`Vendedor cadastrado com sucesso!\n\nCredenciais de acesso:\nEmail: ${email}\nSenha: ${password}\n\nO vendedor pode fazer login no sistema com essas credenciais.`);
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar vendedor:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setPhotoFile(null);
    setPreviewUrl('');
    setCommissionRate('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsUploadingPhoto(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[600px] max-h-[85vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {vendor ? 'Editar Vendedor' : 'Novo Vendedor'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informações Básicas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Informações Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                    placeholder="Nome do vendedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telefone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Endereço *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                  placeholder="Endereço completo"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Foto do Vendedor *</label>
                <div className="space-y-4">
                  {previewUrl ? (
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="Preview do vendedor"
                        className="w-32 h-32 object-cover rounded-full border-4 border-gray-200 mx-auto"
                      />
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="flex items-center text-white">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          </div>
                        </div>
                      )}
                      {!isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              Trocar
                            </button>
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      {isUploadingPhoto ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-2" />
                          <p className="text-xs font-medium text-gray-700">Processando...</p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-xs font-medium text-gray-700 text-center">
                            Adicionar Foto
                          </p>
                          <p className="text-xs text-gray-500 text-center">
                            Clique ou arraste
                          </p>
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
                  
                  {!previewUrl && !isUploadingPhoto && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Escolher Foto do Computador
                    </button>
                  )}
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs text-orange-800">
                      <strong>📷 Foto Profissional:</strong> A foto será armazenada de forma segura no sistema. 
                      Recomendado: foto quadrada, boa qualidade, fundo neutro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Taxa de Comissão (%) *</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  placeholder="10.0"
                />
              </div>
            </div>

            {/* Credenciais de Acesso - Apenas para novos vendedores */}
            {!vendor && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-3">🔐 Credenciais de Acesso ao Sistema</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-blue-800">Email de Login *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="vendedor@empresa.com"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Este email será usado pelo vendedor para fazer login no sistema
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-800">Senha *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-800">Confirmar Senha *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        minLength={6}
                        placeholder="Repita a senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    🎲 Gerar Senha Aleatória
                  </button>
                </div>

                <div className="mt-3 bg-blue-100 rounded-md p-3">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Importante:</strong> Após criar o vendedor, anote as credenciais e repasse para ele. 
                    O vendedor poderá fazer login em <strong>/login</strong> selecionando "Vendedor\" como tipo de acesso.
                  </p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {vendor ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  vendor ? 'Atualizar Vendedor' : 'Criar Vendedor'
                )}
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