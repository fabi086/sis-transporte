
import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Quotes } from './components/Quotes';
import { Services } from './components/Services';
import { Financial } from './components/Financial';
import { Fleet } from './components/Fleet';
import { Settings } from './components/Settings';
import type { User, Plan, View } from './types';
import { PLANS } from './constants';
import { Plus } from './components/icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Mock user state, including the subscription plan
  const [user, setUser] = useState<User>({
    name: 'João Silva',
    companyName: 'Reboques Rápidos',
    logo: 'https://picsum.photos/100',
    email: 'joao.silva@reboques.com',
    plan: 'premium' as Plan,
    settings: {
      defaultKmValue: 5.50,
      defaultMinCharge: 150.00,
      defaultReturnAddress: 'Garagem Central, São Paulo, SP',
      fuelPrice: 5.89,
      vehicleConsumption: 8.5, // km/L
    }
  });

  const handleViewChange = (view: View) => {
    // Prevent access to fleet page if not on premium plan
    if (view === 'fleet' && user.plan !== 'premium') {
      alert('Acesso ao módulo de Frota disponível apenas no plano Premium.');
      return;
    }
    setCurrentView(view);
  };
  
  const currentPlanDetails = useMemo(() => PLANS[user.plan], [user.plan]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard userPlan={user.plan} />;
      case 'quotes':
        return <Quotes user={user} planDetails={currentPlanDetails} />;
      case 'services':
        return <Services />;
      case 'financial':
        return user.plan !== 'free' ? <Financial /> : <PlanUpgradeCTA feature="Módulo Financeiro" />;
      case 'fleet':
        return user.plan === 'premium' ? <Fleet /> : <PlanUpgradeCTA feature="Módulo de Frota" />;
      case 'settings':
        return <Settings user={user} setUser={setUser} />;
      default:
        return <Dashboard userPlan={user.plan} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar currentView={currentView} setCurrentView={handleViewChange} userPlan={user.plan} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 relative">
          {renderView()}
          {currentView !== 'quotes' && (
             <button
              onClick={() => handleViewChange('quotes')}
              className="fixed bottom-8 right-8 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 z-50"
              aria-label="Novo Orçamento"
            >
              <Plus className="h-6 w-6" />
            </button>
          )}
        </main>
      </div>
    </div>
  );
};

const PlanUpgradeCTA: React.FC<{feature: string}> = ({ feature }) => (
    <div className="flex items-center justify-center h-full">
        <div className="text-center bg-white p-10 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{feature} é um recurso premium</h2>
            <p className="text-gray-600 mb-6">Faça o upgrade do seu plano para acessar essa funcionalidade e muito mais.</p>
            <button className="bg-brand-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-700 transition">
                Ver Planos
            </button>
        </div>
    </div>
);

export default App;