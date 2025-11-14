import React, { useState, useMemo, useEffect } from 'react';
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
import { getSupabase, setSupabaseCredentials } from './lib/supabase';
import { Auth } from './components/Auth';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

// Mock user settings, can be moved to user profile in DB later
const initialUserSettings = {
  defaultKmValue: 5.50,
  defaultMinCharge: 150.00,
  defaultReturnAddress: 'Garagem Central, São Paulo, SP',
  fuelPrice: 5.89,
  vehicleConsumption: 8.5, // km/L
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [supabase, setSupabase] = useState<SupabaseClient | null>(() => getSupabase());
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // User state is now a combination of auth data and app-specific settings
  const [user, setUser] = useState<User>({
    name: 'Convidado',
    companyName: 'Reboques',
    logo: 'https://picsum.photos/100',
    email: '',
    plan: 'premium', // For now, we keep plan logic on the frontend
    settings: initialUserSettings,
  });
  
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Derive user object from session
  useEffect(() => {
    if (session) {
      setUser(prevUser => ({
        ...prevUser,
        name: session.user.user_metadata.name || 'Usuário',
        companyName: session.user.user_metadata.companyName || 'Minha Empresa',
        email: session.user.email || '',
      }));
    } else {
       setUser(prevUser => ({
        ...prevUser,
        name: 'Convidado',
        companyName: 'Reboques',
        email: '',
      }));
    }
  }, [session]);

  const handleSetCredentials = (url: string, key: string) => {
    const newSupabaseClient = setSupabaseCredentials(url, key);
    if(newSupabaseClient) {
      setSupabase(newSupabaseClient);
    } else {
      alert("Falha ao configurar as credenciais do Supabase. Verifique os valores e tente novamente.");
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if(error) console.error("Error logging out:", error);
    }
  };

  const handleViewChange = (view: View) => {
    // Prevent access to fleet page if not on premium plan
    if (view === 'fleet' && user.plan !== 'premium') {
      alert('Acesso ao módulo de Frota disponível apenas no plano Premium.');
      return;
    }
    setCurrentView(view);
    // Close sidebar on navigation in mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
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

  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-gray-100">
          <div className="text-xl font-semibold text-gray-700">Carregando...</div>
      </div>
    );
  }

  if (!session) {
      return <Auth onSetCredentials={handleSetCredentials} supabase={supabase} />;
  }


  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleViewChange} 
        userPlan={user.plan} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 relative">
          {renderView()}
          {currentView !== 'quotes' && (
             <button
              onClick={() => handleViewChange('quotes')}
              className="fixed bottom-8 right-8 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 z-20"
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