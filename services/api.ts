import type { Quote, Service, Transaction, Vehicle, ServiceStatus, QuoteStatus } from '../types';
import { supabase } from '../lib/supabase';

// Helper function to get data from localStorage
const getLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error)
{
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

// Helper function to set data to localStorage
const setLocalStorage = <T,>(key:string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
};

// --- MOCK DATA ---
const initialQuotes: Quote[] = [
    { id: 'q1', vehicleId: 'v1', currentLocation: 'Oficina, São Paulo, SP', origin: 'Morumbi, São Paulo, SP', destination: 'Aeroporto de Congonhas, São Paulo, SP', returnAddress: 'Garagem Central, São Paulo, SP', totalDistance: 125, kmValue: 5.5, minCharge: 150, extras: 50, notes: 'Pedágio incluso', total: 737.5, fuelCost: 86.62, createdAt: new Date(Date.now() - 86400000).toISOString(), status: 'service_created' },
    { id: 'q2', vehicleId: 'v2', currentLocation: 'Base, Itupeva, SP', origin: 'rua jose vila busquet', destination: 'geraldo ferraz itupeva', returnAddress: 'Base, Itupeva, SP', totalDistance: 205, kmValue: 5.5, minCharge: 150, extras: 0, notes: '', total: 1277.5, fuelCost: 150.29, createdAt: new Date(Date.now() - 172800000).toISOString(), status: 'service_created' },
    { id: 'q3', vehicleId: 'v1', currentLocation: 'Base, Campinas, SP', origin: 'Centro, Campinas, SP', destination: 'Viracopos, Campinas, SP', returnAddress: 'Base, Campinas, SP', totalDistance: 80, kmValue: 5.5, minCharge: 150, extras: 0, notes: '', total: 400, fuelCost: 55.80, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'service_created' },
    { id: 'q4', vehicleId: 'v1', currentLocation: 'Rua das Flores, 123', origin: 'avenida paulista, 5454', destination: 'rua geraldo ferraz, 320 itupeva', returnAddress: 'Garagem Central, São Paulo, SP', totalDistance: 219.1, kmValue: 5.5, minCharge: 150, extras: 0, notes: '', total: 1355.05, fuelCost: 160.89, createdAt: new Date().toISOString(), status: 'pending' },
];

const initialServices: Service[] = [
    { id: 's1', quoteId: 'q1', clientName: 'Ana', clientPhone: '11987654321', status: 'completed', value: 737.5, cost: 86.62, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 's2', quoteId: 'q2', clientName: 'Carlos', clientPhone: '21912345678', status: 'in_progress', value: 232.5, cost: 150.29, createdAt: new Date().toISOString() },
    { id: 's3', quoteId: 'q3', clientName: 'Mariana', clientPhone: '31955554444', status: 'pending', value: 400, cost: 55.80, createdAt: new Date().toISOString() },
];

const initialTransactions: Transaction[] = [
    { id: 't1', description: 'Serviço #s1', amount: 737.5, type: 'revenue', category: 'Serviço', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 't2', description: 'Combustível', amount: 250, type: 'expense', category: 'Combustível', date: new Date(Date.now() - 172800000).toISOString() },
    { id: 't3', description: 'Pedágio', amount: 35.70, type: 'expense', category: 'Pedágio', date: new Date(Date.now() - 86400000).toISOString() },
];

const initialVehicles: Vehicle[] = [
    { id: 'v1', plate: 'BRA2E19', model: 'VW Delivery Express', year: 2021, km: 150000, avgConsumption: 8.5, nextMaintenanceKm: 160000 },
    { id: 'v2', plate: 'MER1C05', model: 'Iveco Daily 35-150', year: 2022, km: 85000, avgConsumption: 9.0, nextMaintenanceKm: 90000 },
]

// Initialize with mock data if localStorage is empty
if (!localStorage.getItem('reboque360_quotes')) {
    setLocalStorage('reboque360_quotes', initialQuotes);
}
if (!localStorage.getItem('reboque360_services')) {
    setLocalStorage('reboque360_services', initialServices);
}
if (!localStorage.getItem('reboque360_transactions')) {
    setLocalStorage('reboque360_transactions', initialTransactions);
}
if (!localStorage.getItem('reboque360_vehicles')) {
    setLocalStorage('reboque360_vehicles', initialVehicles);
}

// --- API FUNCTIONS ---

/*
  DB TABLE SETUP FOR PUSH NOTIFICATIONS
  -----------------------------------------
  To store push subscriptions, you need to create a new table in your Supabase project.
  Go to the "SQL Editor" in your Supabase dashboard and run the following command:

  CREATE TABLE public.push_subscriptions (
    endpoint TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Enable Row Level Security
  ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

  -- Create policies to ensure users can only manage their own subscriptions
  CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

*/

export const api = {
  // Quotes
  getQuotes: async (): Promise<Quote[]> => getLocalStorage('reboque360_quotes', []),
  addQuote: async (quote: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<Quote> => {
    const quotes = await api.getQuotes();
    const newQuote: Quote = { ...quote, id: `q${Date.now()}`, createdAt: new Date().toISOString(), status: 'pending' };
    setLocalStorage('reboque360_quotes', [...quotes, newQuote]);
    return newQuote;
  },
  updateQuote: async (updatedQuote: Quote): Promise<Quote> => {
    const quotes = await api.getQuotes();
    const quoteIndex = quotes.findIndex(q => q.id === updatedQuote.id);
    if (quoteIndex === -1) throw new Error('Quote not found');
    quotes[quoteIndex] = updatedQuote;
    setLocalStorage('reboque360_quotes', quotes);
    return updatedQuote;
  },
  updateQuoteStatus: async (quoteId: string, status: QuoteStatus): Promise<Quote> => {
    const quotes = await api.getQuotes();
    const quoteIndex = quotes.findIndex(q => q.id === quoteId);
    if (quoteIndex === -1) throw new Error('Quote not found');
    quotes[quoteIndex].status = status;
    setLocalStorage('reboque360_quotes', quotes);
    return quotes[quoteIndex];
  },
  deleteQuote: async (quoteId: string): Promise<void> => {
    let quotes = await api.getQuotes();
    quotes = quotes.filter(q => q.id !== quoteId);
    setLocalStorage('reboque360_quotes', quotes);
  },

  // Services
  getServices: async (): Promise<Service[]> => getLocalStorage('reboque360_services', []),
  addService: async (quote: Quote): Promise<Service> => {
    const services = await api.getServices();
    // In a real app, you'd prompt for client name/phone or have it in the quote.
    const newService: Service = {
      id: `s${Date.now()}`,
      quoteId: quote.id,
      clientName: 'Novo Cliente', // Placeholder
      clientPhone: '00000000000', // Placeholder
      status: 'pending',
      value: quote.total,
      cost: quote.fuelCost, // Carrying over the fuel cost
      createdAt: new Date().toISOString(),
    };
    setLocalStorage('reboque360_services', [...services, newService]);

    // Update quote status directly
    const quotes = await api.getQuotes();
    const quoteIndex = quotes.findIndex(q => q.id === quote.id);
    if (quoteIndex !== -1) {
        quotes[quoteIndex].status = 'service_created';
        setLocalStorage('reboque360_quotes', quotes);
    }
    
    // TRIGGER PUSH NOTIFICATION: In a real backend, you would now query the 'push_subscriptions' table 
    // for the user's subscriptions and send a push message about the new service.
    
    return newService;
  },
  updateServiceStatus: async (serviceId: string, status: ServiceStatus): Promise<Service> => {
    const services = await api.getServices();
    const serviceIndex = services.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) throw new Error('Service not found');
    services[serviceIndex].status = status;
    setLocalStorage('reboque360_services', services);

    // TRIGGER PUSH NOTIFICATION: Here you would trigger a push message about the status update.

    return services[serviceIndex];
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => getLocalStorage('reboque360_transactions', []),
  addTransaction: async (transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> => {
    const transactions = await api.getTransactions();
    const newTransaction: Transaction = { ...transaction, id: `t${Date.now()}`, date: new Date().toISOString() };
    setLocalStorage('reboque360_transactions', [...transactions, newTransaction]);
    return newTransaction;
  },

  // Fleet
  getVehicles: async (): Promise<Vehicle[]> => getLocalStorage('reboque360_vehicles', []),
  addVehicle: async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const vehicles = await api.getVehicles();
    const newVehicle: Vehicle = { ...vehicle, id: `v${Date.now()}` };
    setLocalStorage('reboque360_vehicles', [...vehicles, newVehicle]);
    return newVehicle;
  },
  updateVehicle: async (updatedVehicle: Vehicle): Promise<Vehicle> => {
    let vehicles = await api.getVehicles();
    vehicles = vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
    setLocalStorage('reboque360_vehicles', vehicles);
    return updatedVehicle;
  },
  deleteVehicle: async (vehicleId: string): Promise<void> => {
    let vehicles = await api.getVehicles();
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    setLocalStorage('reboque360_vehicles', vehicles);
  },

  // Push Notifications
  savePushSubscription: async (subscription: PushSubscription): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const subscriptionData = subscription.toJSON();

    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: subscription.endpoint,
      user_id: user.id,
      p256dh: subscriptionData.keys?.p256dh,
      auth: subscriptionData.keys?.auth,
    }, { onConflict: 'endpoint' }); // Upsert based on the endpoint to avoid duplicates

    if (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  },

  removePushSubscription: async (endpoint: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .match({ endpoint: endpoint });

    if (error) {
      console.error('Error removing push subscription:', error);
      throw error;
    }
  },
  
  // Dashboard Data
  getDashboardSummary: async () => {
    const services = await api.getServices();
    const transactions = await api.getTransactions();
    const quotes = await api.getQuotes();
    const vehicles = await api.getVehicles();

    const revenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate costs by vehicle
    const costsByVehicle = vehicles.map(vehicle => {
        const vehicleServices = services.filter(service => {
            const quote = quotes.find(q => q.id === service.quoteId);
            return quote?.vehicleId === vehicle.id && service.status === 'completed';
        });
        const totalCost = vehicleServices.reduce((sum, service) => sum + service.cost, 0);
        return { name: vehicle.model, Custo: totalCost };
    });

    return {
        pendingServices: services.filter(s => s.status === 'pending').length,
        inProgressServices: services.filter(s => s.status === 'in_progress').length,
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: revenue - expenses,
        costsByVehicle,
    };
  }
};