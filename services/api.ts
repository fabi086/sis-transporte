import type { Quote, Service, Transaction, Vehicle, ServiceStatus, QuoteStatus, Profile, User } from '../types';
import { supabase } from '../lib/supabase';

/*
  ==================================================================================
  INSTRUÇÕES PARA CONFIGURAÇÃO DO BANCO DE DADOS - SUPABASE
  ==================================================================================
  1. Vá para o "SQL Editor" no painel do seu projeto Supabase.
  2. Copie e cole os comandos SQL abaixo e execute-os para criar todas as
     tabelas, políticas de segurança (RLS) e gatilhos necessários.
  ----------------------------------------------------------------------------------

-- Habilita a extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABELA: profiles (para armazenar configurações e dados do usuário)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  company_name TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'free',
  default_km_value NUMERIC DEFAULT 5.50,
  default_min_charge NUMERIC DEFAULT 150.00,
  default_return_address TEXT,
  fuel_price NUMERIC DEFAULT 5.89
);
-- Políticas de Segurança (RLS) para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Função e Gatilho (Trigger) para criar um perfil quando um novo usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, company_name)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'companyName');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativa o gatilho
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- TABELA: vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  km NUMERIC NOT NULL,
  avg_consumption NUMERIC NOT NULL,
  next_maintenance_km NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS para vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = user_id);

-- TABELA: quotes
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  current_location TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  return_address TEXT NOT NULL,
  total_distance NUMERIC NOT NULL,
  km_value NUMERIC NOT NULL,
  min_charge NUMERIC NOT NULL,
  extras NUMERIC DEFAULT 0,
  discount NUMERIC,
  notes TEXT,
  total NUMERIC NOT NULL,
  fuel_cost NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS para quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own quotes" ON public.quotes FOR ALL USING (auth.uid() = user_id);

-- TABELA: services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  value NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS para services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own services" ON public.services FOR ALL USING (auth.uid() = user_id);

-- TABELA: transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'revenue' or 'expense'
  category TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS para transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- STORAGE BUCKET: logos
-- Cria o bucket para armazenar os logos das empresas
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Segurança para o bucket 'logos'
CREATE POLICY "Allow public read access to logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Allow users to update their own logo" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.uid() = owner);
CREATE POLICY "Allow users to delete their own logo" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.uid() = owner);

*/

// Helper to get current user ID
const getUserId = async (): Promise<string> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('User not authenticated.');
    return user.id;
};

export const api = {
  // Profile / User Settings
  getUserProfile: async (): Promise<Profile | null> => {
      const userId = await getUserId();
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
          console.error("Error fetching profile:", error);
          if (error.code === 'PGRST116') return null; // No rows found is not an error here
          throw error;
      }
      return data;
  },
  updateUserProfile: async (profileData: Partial<Profile>): Promise<User | null> => {
      const userId = await getUserId();
      const updateData = {
          name: profileData.name,
          company_name: profileData.company_name,
          logo_url: profileData.logo_url,
          default_km_value: profileData.default_km_value,
          default_min_charge: profileData.default_min_charge,
          default_return_address: profileData.default_return_address,
          fuel_price: profileData.fuel_price,
      };

      const { data, error } = await supabase.from('profiles').update(updateData).eq('id', userId).select().single();
      if (error) throw error;
      
      // Map back to User type
      return {
        name: data.name,
        companyName: data.company_name,
        logo: data.logo_url,
        email: '', // Not updated here
        plan: data.plan as any,
        settings: {
          defaultKmValue: data.default_km_value,
          defaultMinCharge: data.default_min_charge,
          defaultReturnAddress: data.default_return_address,
          fuelPrice: data.fuel_price,
        }
      };
  },
  uploadLogo: async (file: File): Promise<string> => {
      if (!supabase) throw new Error("Supabase client not initialized.");
      const userId = await getUserId();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, file, { upsert: true });

      if (uploadError) {
          throw uploadError;
      }

      const { data } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath);
      
      return data.publicUrl;
  },
  updateProfileLogo: async (logoUrl: string): Promise<User | null> => {
    return api.updateUserProfile({ logo_url: logoUrl });
  },


  // Quotes
  getQuotes: async (): Promise<Quote[]> => {
    const { data, error } = await supabase.from('quotes').select('*');
    if (error) throw error;
    // Map snake_case from DB to camelCase for the app
    return data.map(q => ({
        ...q,
        currentLocation: q.current_location,
        returnAddress: q.return_address,
        totalDistance: q.total_distance,
        kmValue: q.km_value,
        minCharge: q.min_charge,
        fuelCost: q.fuel_cost,
        createdAt: q.created_at,
        vehicleId: q.vehicle_id,
    }));
  },
  addQuote: async (quote: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<Quote> => {
    const userId = await getUserId();
    const { data, error } = await supabase
        .from('quotes')
        .insert({
            user_id: userId,
            vehicle_id: quote.vehicleId,
            current_location: quote.currentLocation,
            origin: quote.origin,
            destination: quote.destination,
            return_address: quote.returnAddress,
            total_distance: quote.totalDistance,
            km_value: quote.kmValue,
            min_charge: quote.minCharge,
            extras: quote.extras,
            discount: quote.discount,
            notes: quote.notes,
            total: quote.total,
            fuel_cost: quote.fuelCost,
        })
        .select()
        .single();
    if (error) throw error;
    return { ...data, vehicleId: data.vehicle_id, totalDistance: data.total_distance, kmValue: data.km_value, minCharge: data.min_charge, fuelCost: data.fuel_cost, returnAddress: data.return_address, currentLocation: data.current_location, createdAt: data.created_at };
  },
  updateQuote: async (updatedQuote: Quote): Promise<Quote> => {
    const { data, error } = await supabase
        .from('quotes')
        .update({
            km_value: updatedQuote.kmValue,
            min_charge: updatedQuote.minCharge,
            extras: updatedQuote.extras,
            discount: updatedQuote.discount,
            notes: updatedQuote.notes,
            total: updatedQuote.total,
        })
        .eq('id', updatedQuote.id)
        .select()
        .single();
    if (error) throw error;
    return { ...data, vehicleId: data.vehicle_id, totalDistance: data.total_distance, kmValue: data.km_value, minCharge: data.min_charge, fuelCost: data.fuel_cost, returnAddress: data.return_address, currentLocation: data.current_location, createdAt: data.created_at };
  },
  updateQuoteStatus: async (quoteId: string, status: QuoteStatus): Promise<Quote> => {
    const { data, error } = await supabase.from('quotes').update({ status }).eq('id', quoteId).select().single();
    if (error) throw error;
    return { ...data, vehicleId: data.vehicle_id, totalDistance: data.total_distance, kmValue: data.km_value, minCharge: data.min_charge, fuelCost: data.fuel_cost, returnAddress: data.return_address, currentLocation: data.current_location, createdAt: data.created_at };
  },
  deleteQuote: async (quoteId: string): Promise<void> => {
    const { error } = await supabase.from('quotes').delete().eq('id', quoteId);
    if (error) throw error;
  },

  // Services
  getServices: async (): Promise<Service[]> => {
    const { data, error } = await supabase.from('services').select('*');
    if (error) throw error;
    return data.map(s => ({
        ...s,
        quoteId: s.quote_id,
        clientName: s.client_name,
        clientPhone: s.client_phone,
        createdAt: s.created_at,
    }));
  },
  addService: async (quote: Quote): Promise<Service> => {
    const userId = await getUserId();
    const newServicePayload = {
      user_id: userId,
      quote_id: quote.id,
      client_name: 'Novo Cliente', // Placeholder
      client_phone: '00000000000', // Placeholder
      status: 'pending' as ServiceStatus,
      value: quote.total,
      cost: quote.fuelCost,
    };
    const { data: serviceData, error: serviceError } = await supabase.from('services').insert(newServicePayload).select().single();
    if (serviceError) throw serviceError;

    // Create a corresponding revenue transaction
    await api.addTransaction({
        description: `Receita do serviço #${serviceData.id.substring(0, 6)}`,
        amount: serviceData.value,
        type: 'revenue',
        category: 'Serviço',
        serviceId: serviceData.id,
        date: serviceData.created_at,
    });

    await api.updateQuoteStatus(quote.id, 'service_created');
    return { ...serviceData, quoteId: serviceData.quote_id, clientName: serviceData.client_name, clientPhone: serviceData.client_phone, createdAt: serviceData.created_at };
  },
  updateServiceStatus: async (serviceId: string, status: ServiceStatus): Promise<Service> => {
    const { data, error } = await supabase.from('services').update({ status }).eq('id', serviceId).select().single();
    if (error) throw error;
    return { ...data, quoteId: data.quote_id, clientName: data.client_name, clientPhone: data.client_phone, createdAt: data.created_at };
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) throw error;
    return data.map(t => ({...t, serviceId: t.service_id}));
  },
  addTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('transactions').insert({ ...transaction, user_id: userId, service_id: transaction.serviceId }).select().single();
    if (error) throw error;
    return {...data, serviceId: data.service_id};
  },

  // Fleet
  getVehicles: async (): Promise<Vehicle[]> => {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) throw error;
    return data.map(v => ({
        ...v,
        avgConsumption: v.avg_consumption,
        nextMaintenanceKm: v.next_maintenance_km,
    }));
  },
  addVehicle: async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('vehicles').insert({
        user_id: userId,
        plate: vehicle.plate,
        model: vehicle.model,
        year: vehicle.year,
        km: vehicle.km,
        avg_consumption: vehicle.avgConsumption,
        next_maintenance_km: vehicle.nextMaintenanceKm,
    }).select().single();
    if (error) throw error;
    return { ...data, avgConsumption: data.avg_consumption, nextMaintenanceKm: data.next_maintenance_km };
  },
  updateVehicle: async (updatedVehicle: Vehicle): Promise<Vehicle> => {
    const { id, ...updateData } = updatedVehicle;
    const { data, error } = await supabase.from('vehicles').update({
        plate: updateData.plate,
        model: updateData.model,
        year: updateData.year,
        km: updateData.km,
        avg_consumption: updateData.avgConsumption,
        next_maintenance_km: updateData.nextMaintenanceKm,
    }).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, avgConsumption: data.avg_consumption, nextMaintenanceKm: data.next_maintenance_km };
  },
  deleteVehicle: async (vehicleId: string): Promise<void> => {
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
    if (error) throw error;
  },

  // Push Notifications (already using Supabase)
  savePushSubscription: async (subscription: PushSubscription): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const userId = await getUserId();
    const subscriptionData = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: subscription.endpoint,
      user_id: userId,
      p256dh: subscriptionData.keys?.p256dh,
      auth: subscriptionData.keys?.auth,
    }, { onConflict: 'endpoint' });
    if (error) throw error;
  },
  removePushSubscription: async (endpoint: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase.from('push_subscriptions').delete().match({ endpoint: endpoint });
    if (error) throw error;
  },
  
  // Dashboard Data
  getDashboardSummary: async () => {
    const [services, transactions, quotes, vehicles] = await Promise.all([
        api.getServices(),
        api.getTransactions(),
        api.getQuotes(),
        api.getVehicles()
    ]);

    const revenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
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