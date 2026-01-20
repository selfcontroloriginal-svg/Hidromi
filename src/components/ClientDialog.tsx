import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X, MapPin } from 'lucide-react';
import { useClientStore, Client } from '../store/clients';
import { useVisitStore } from '../store/visits';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
}

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
  const { profile } = useAuth();
  const [name, setName] = useState(client?.name || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  
  // Expanded address fields
  const [street, setStreet] = useState(client?.address?.split(',')[0]?.trim() || '');
  const [number, setNumber] = useState(client?.address?.split(',')[1]?.trim() || '');
  const [hasNoNumber, setHasNoNumber] = useState(false);
  const [neighborhood, setNeighborhood] = useState(client?.address?.split(',')[2]?.trim() || '');
  const [city, setCity] = useState(client?.address?.split(',')[3]?.trim() || '');
  const [state, setState] = useState(client?.address?.split(',')[4]?.trim() || '');
  const [zipCode, setZipCode] = useState('');
  
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>(client?.documentType || 'CPF');
  const [document, setDocument] = useState(client?.document || '');
  const [needsScheduling, setNeedsScheduling] = useState(!!client?.scheduledDate);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(
    client?.scheduledDate ? new Date(client.scheduledDate) : null
  );
  
  const addClient = useClientStore(state => state.addClient);
  const updateClient = useClientStore(state => state.updateClient);
  const addVisit = useVisitStore(state => state.addVisit);

  // CEP lookup function
  const handleZipCodeChange = async (value: string) => {
    const cleanZip = value.replace(/\D/g, '');
    const formattedZip = cleanZip.replace(/(\d{5})(\d{3})/, '$1-$2');
    setZipCode(formattedZip);

    if (cleanZip.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setState(data.uf || '');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const formatDocument = (value: string, type: 'CPF' | 'CNPJ') => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'CPF') {
      // Format CPF: 000.000.000-00
      return numbers
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // Format CNPJ: 00.000.000/0000-00
      return numbers
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value, documentType);
    setDocument(formatted);
  };

  const handleDocumentTypeChange = (type: 'CPF' | 'CNPJ') => {
    setDocumentType(type);
    setDocument(''); // Clear document when changing type
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine address fields
    const fullAddress = [
      street,
      hasNoNumber ? 'S/N' : number,
      neighborhood,
      city,
      state
    ].filter(Boolean).join(', ');
    
    const clientData = {
      name,
      email,
      phone,
      address: fullAddress,
      documentType,
      document,
      scheduledDate: needsScheduling ? scheduledDate?.toISOString() : null
    };

    try {
      if (client) {
        await updateClient(client.id, clientData);
        
        // Se está editando e há agendamento, criar/atualizar visita
        if (needsScheduling && scheduledDate && profile?.id) {
          try {
            await addVisit({
              clientName: name,
              clientId: client.id,
              vendorId: profile.id,
              scheduledDate: scheduledDate.toISOString(),
              status: 'scheduled',
              notes: `Visita agendada durante edição do cliente`,
              location: fullAddress || 'Local a definir'
            });
          } catch (visitError) {
            console.warn('Erro ao criar visita:', visitError);
          }
        }
      } else {
        // Primeiro adiciona o cliente
        const newClientId = await addClient(clientData);
        
        // Se há agendamento, criar visita automaticamente
        if (needsScheduling && scheduledDate && profile?.id) {
          try {
            await addVisit({
              clientName: name,
              clientId: typeof newClientId === 'string' ? newClientId : undefined,
              vendorId: profile.id,
              scheduledDate: scheduledDate.toISOString(),
              status: 'scheduled',
              notes: `Visita agendada durante cadastro do cliente`,
              location: fullAddress || 'Local a definir'
            });
          } catch (visitError) {
            console.warn('Erro ao criar visita agendada:', visitError);
            // Não falha o cadastro do cliente por causa da visita
          }
        }
      }
      onOpenChange(false);
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setStreet('');
      setNumber('');
      setHasNoNumber(false);
      setNeighborhood('');
      setCity('');
      setState('');
      setZipCode('');
      setDocumentType('CPF');
      setDocument('');
      setNeedsScheduling(false);
      setScheduledDate(null);
    } catch (error) {
      console.error('Error saving client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar cliente';
      alert(errorMessage);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Nome completo do cliente"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center mb-3">
                <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-gray-900">Endereço Completo</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">CEP</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => handleZipCodeChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="00000-000"
                  maxLength={9}
                />
                <p className="text-xs text-gray-500 mt-1">Digite o CEP para preenchimento automático</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Rua/Logradouro</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome da rua"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123"
                      disabled={hasNoNumber}
                    />
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={hasNoNumber}
                        onChange={(e) => {
                          setHasNoNumber(e.target.checked);
                          if (e.target.checked) setNumber('');
                        }}
                        className="mr-2"
                      />
                      Sem número
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bairro</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome do bairro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>

            {/* Document Type and Document Field */}
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2">Documento</label>
              
              {/* Document Type Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleDocumentTypeChange('CPF')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                    documentType === 'CPF'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  CPF
                </button>
                <button
                  type="button"
                  onClick={() => handleDocumentTypeChange('CNPJ')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                    documentType === 'CNPJ'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  CNPJ
                </button>
              </div>

              {/* Document Input */}
              <input
                type="text"
                value={document}
                onChange={handleDocumentChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                maxLength={documentType === 'CPF' ? 14 : 18}
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="scheduling-switch" className="text-sm font-medium">
                Agendar Visita?
              </label>
              <Switch.Root
                id="scheduling-switch"
                checked={needsScheduling}
                onCheckedChange={setNeedsScheduling}
                className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-cyan-600 transition-colors"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>

            {needsScheduling && (
              <div>
                <label className="block text-sm font-medium mb-1">Data do Agendamento</label>
                <DatePicker
                  selected={scheduledDate}
                  onChange={(date) => setScheduledDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholderText="Selecione data e hora"
                  required={needsScheduling}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors"
              >
                Salvar
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