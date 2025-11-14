

export type Plan = 'free' | 'pro' | 'premium';

export type View = 'dashboard' | 'quotes' | 'services' | 'financial' | 'fleet' | 'settings';

export interface UserSettings {
  defaultKmValue: number;
  defaultMinCharge: number;
  defaultReturnAddress: string;
  fuelPrice: number;
}

export interface User {
  name: string;
  companyName: string;
  logo?: string;
  email: string;
  plan: Plan;
  settings: UserSettings;
}

export interface PlanDetails {
    name: string;
    price: number;
    quoteLimit: number | 'unlimited';
    features: string[];
}

export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'service_created';

export interface Quote {
  id: string;
  currentLocation: string; // Driver's starting point
  origin: string; // Client vehicle pickup
  destination: string; // Client vehicle dropoff
  returnAddress: string; // Driver's return point
  totalDistance: number; // Total km for the full trip
  kmValue: number;
  minCharge: number;
  extras: number;
  discount?: number;
  notes: string;
  total: number; // Price for the client
  fuelCost: number; // Internal cost
  status: QuoteStatus;
  createdAt: string;
  vehicleId?: string; // Link to the vehicle used for this quote
}

export type ServiceStatus = 'pending' | 'in_progress' | 'completed';

export interface Service {
  id: string;
  quoteId: string;
  clientName: string;
  clientPhone: string;
  status: ServiceStatus;
  value: number;
  cost: number;
  createdAt: string;
}

export interface ServiceWithDetails extends Service {
    origin: string;
    destination: string;
    profit: number;
}

export type TransactionType = 'revenue' | 'expense';

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
}

export interface Vehicle {
    id: string;
    plate: string;
    model: string;
    year: number;
    km: number;
    avgConsumption: number; // km/L
    nextMaintenanceKm: number;
}