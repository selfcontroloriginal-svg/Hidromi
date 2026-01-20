import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FixedLogo from '../components/FixedLogo';
import * as Dialog from '@radix-ui/react-dialog';
import { X, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'vendor'>('admin');
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { user, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else if (user) {
        if (selectedRole === 'vendor') {
          navigate('/vendor');
        } else {
          navigate('/admin');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro ao conectar com o servidor. Por favor, tente novamente.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    setIsLoading(true);
    try {
      // Update email if provided
      if (newEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: newEmail
        });

        if (emailError) {
          throw new Error(`Erro ao atualizar email: ${emailError.message}`);
        }
      }

      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) {
          throw new Error(`Erro ao atualizar senha: ${passwordError.message}`);
        }
      }

      alert('Credenciais atualizadas com sucesso! Por favor, faça login novamente.');
      setShowResetDialog(false);
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
      await supabase.auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar credenciais');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 50%, #00acc1 100%)',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-md w-full mx-4">
        <div className="bg-white bg-opacity-95 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <FixedLogo />
            <p className="text-cyan-600 font-medium">Sistema Oficial</p>
            
            {/* Ícone de informações */}
            <button
              type="button"
              onClick={() => setShowInfoDialog(true)}
              className="mt-3 flex items-center text-sm text-cyan-600 hover:text-cyan-800 transition-colors"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Informações de Acesso
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Tipo de Acesso
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'vendor')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                disabled={isLoading}
              >
                <option value="admin">Administrativo</option>
                <option value="vendor">Vendedor</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowResetDialog(true)}
                className="text-sm text-cyan-600 hover:text-cyan-500"
              >
                Redefinir Credenciais
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading 
                  ? 'bg-cyan-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
              } transition-colors duration-200`}
            >
              {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Informações de Acesso */}
      <Dialog.Root open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[500px]">
            <Dialog.Title className="text-xl font-semibold mb-4 flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-cyan-600" />
              Informações de Acesso
            </Dialog.Title>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-3">💡 Como Acessar o Sistema:</h3>
                
                <div className="space-y-3">
                  <div className="bg-white/70 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-2">👨‍💼 Administrador (Demonstração)</h4>
                    <div className="text-sm text-blue-700">
                      <p><strong>Email:</strong> hidromineralbrasil@gmail.com</p>
                      <p><strong>Senha:</strong> Agua1050</p>
                      <p><strong>Tipo:</strong> Administrativo</p>
                    </div>
                  </div>

                  <div className="bg-white/70 rounded-lg p-3">
                    <h4 className="font-medium text-green-900 mb-2">🛍️ Vendedores</h4>
                    <div className="text-sm text-green-700">
                      <p><strong>Vendedores Reais:</strong> Use as credenciais criadas pelo administrador</p>
                      <p><strong>Demo:</strong> vendor@example.com / vendor123</p>
                      <p><strong>Tipo:</strong> Vendedor</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Importante</h4>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <p>• Selecione o <strong>tipo de acesso correto</strong> antes de fazer login</p>
                    <p>• Vendedores devem usar credenciais criadas pelo admin</p>
                    <p>• Em caso de problemas, contate o administrador</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowInfoDialog(false)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
              >
                Entendi
              </button>
            </div>

            <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showResetDialog} onOpenChange={setShowResetDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-[400px]">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Redefinir Credenciais
            </Dialog.Title>

            <form onSubmit={handleCredentialsReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Novo Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="novo@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResetDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newEmail && !newPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
              </div>
            </form>

            <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default Login;