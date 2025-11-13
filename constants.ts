
import type { Plan, PlanDetails, View } from './types';
// FIX: Import FC and SVGProps from react to resolve type conflicts.
import type { FC, SVGProps } from 'react';
import { Home, FileText, Wrench, DollarSign, Truck, Settings } from './components/icons';

export const NAV_ITEMS: { view: View; label: string; icon: FC<SVGProps<SVGSVGElement>>; plan?: Plan[] }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: Home },
  { view: 'quotes', label: 'Orçamentos', icon: FileText },
  { view: 'services', label: 'Serviços', icon: Wrench },
  { view: 'financial', label: 'Financeiro', icon: DollarSign, plan: ['pro', 'premium'] },
  { view: 'fleet', label: 'Frota', icon: Truck, plan: ['premium'] },
  { view: 'settings', label: 'Configurações', icon: Settings },
];

export const PLANS: Record<Plan, PlanDetails> = {
  free: {
    name: 'Gratuito',
    price: 0,
    quoteLimit: 10,
    features: ['Até 10 orçamentos/mês'],
  },
  pro: {
    name: 'Pro',
    price: 39.90,
    quoteLimit: 'unlimited',
    features: ['Orçamentos ilimitados', 'Módulo Financeiro Completo'],
  },
  premium: {
    name: 'Premium',
    price: 69.90,
    quoteLimit: 'unlimited',
    features: ['Todos os recursos do Pro', 'Módulo de Frota', 'Relatórios Avançados'],
  },
};
