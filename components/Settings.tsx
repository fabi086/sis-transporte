import React, { useState } from 'react';
import type { User } from '../types';
import { PLANS } from '../constants';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { api } from '../services/api';

interface SettingsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

export const Settings: React.FC<SettingsProps> = ({ user, setUser }) => {
  const [kmValue, setKmValue] = useState(user.settings.defaultKmValue);
  const [minCharge, setMinCharge] = useState(user.settings.defaultMinCharge);
  const [companyName, setCompanyName] = useState(user.companyName);
  const [returnAddress, setReturnAddress] = useState(user.settings.defaultReturnAddress);
  const [fuelPrice, setFuelPrice] = useState(user.settings.fuelPrice);
  
  // Hook for push notification logic
  const { isSubscribed, subscribeToPush, unsubscribeFromPush, error: pushError, loading: pushLoading, isSupported } = usePushNotifications();


  const handleSave = async () => {
    try {
      const updatedProfileData = {
        name: user.name, // Name is not editable here, but we pass it along
        company_name: companyName,
        default_km_value: kmValue,
        default_min_charge: minCharge,
        default_return_address: returnAddress,
        fuel_price: fuelPrice,
      };
      
      const updatedUserFromApi = await api.updateUserProfile(updatedProfileData);

      if (updatedUserFromApi) {
          // Update the app's central user state with the returned data from the API
          setUser(prevUser => ({
            ...prevUser,
            ...updatedUserFromApi,
          }));
      }

      alert('Configurações salvas com sucesso!');
    } catch (error) {
        console.error("Failed to save settings:", error);
        alert('Ocorreu um erro ao salvar as configurações.');
    }
  };

  const inputClasses = "mt-1 block w-full bg-gray-800 text-white rounded-lg py-3 px-4 border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 focus:ring-offset-white placeholder:text-gray-400";


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
        <p className="text-gray-500">Ajuste as preferências da sua conta e empresa.</p>
      </div>

      {/* Company Settings */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Dados da Empresa</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={`${inputClasses} md:w-1/2`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <div className="mt-2 flex items-center space-x-4">
              <img src={user.logo} alt="Logo" className="h-16 w-16 rounded-full object-cover" />
              <button className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-300">Alterar Logo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Settings */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Padrões de Orçamento</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor padrão por km (R$)</label>
              <input type="number" step="0.01" value={kmValue} onChange={e => setKmValue(parseFloat(e.target.value) || 0)} className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Saída mínima padrão (R$)</label>
              <input type="number" step="0.01" value={minCharge} onChange={e => setMinCharge(parseFloat(e.target.value) || 0)} className={inputClasses} />
            </div>
          </div>
           <div>
              <label className="block text-sm font-medium text-gray-700">Endereço de Retorno Padrão (Base)</label>
              <input type="text" value={returnAddress} onChange={e => setReturnAddress(e.target.value)} className={inputClasses} placeholder="Ex: Sua Garagem" />
            </div>
        </div>
      </div>
       {/* Cost Analysis Settings */}
       <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Análise de Custo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Preço do Combustível (R$/Litro)</label>
                <input type="number" step="0.01" value={fuelPrice} onChange={e => setFuelPrice(parseFloat(e.target.value) || 0)} className={inputClasses} placeholder="Ex: 5.89" />
            </div>
        </div>
         <p className="text-xs text-gray-500 mt-4">O consumo de combustível (km/L) agora é gerenciado individualmente para cada veículo na seção <span className="font-semibold">Frota</span>.</p>
      </div>

      {/* Notifications Settings */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Notificações</h2>
          {!isSupported ? (
              <p className="text-gray-600">Seu navegador não suporta notificações push.</p>
          ) : (
              <div>
                  <p className="text-gray-600 mb-4">Receba alertas sobre novos serviços e atualizações importantes diretamente no seu dispositivo.</p>
                  <button 
                      onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                      disabled={pushLoading}
                      className={`font-bold py-2 px-6 rounded-lg transition ${
                          isSubscribed 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                      } disabled:bg-gray-400 disabled:cursor-wait`}
                  >
                      {pushLoading ? 'Processando...' : (isSubscribed ? 'Desativar Notificações' : 'Ativar Notificações')}
                  </button>
                  {pushError && <p className="text-red-500 text-sm mt-4">{pushError.message}</p>}
              </div>
          )}
      </div>
      
      {/* Plan Settings */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Meu Plano</h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <p className="text-gray-600">Seu plano atual é:</p>
                <p className="text-3xl font-bold text-brand-blue-700">{PLANS[user.plan].name}</p>
                 <ul className="mt-2 text-sm list-disc list-inside text-gray-500">
                    {PLANS[user.plan].features.map(f => <li key={f}>{f}</li>)}
                </ul>
            </div>
             <button className="mt-4 md:mt-0 bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition">
                {user.plan === 'premium' ? 'Gerenciar Assinatura' : 'Fazer Upgrade'}
            </button>
        </div>
      </div>


      <div className="flex justify-end pt-4">
        <button onClick={handleSave} className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition">
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};
