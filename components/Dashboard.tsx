
import React, { useEffect, useState } from 'react';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';
import { api } from '../services/api';
import type { Plan } from '../types';
import { FileText, Wrench, DollarSign, Truck } from './icons';

interface SummaryData {
  pendingServices: number;
  inProgressServices: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

// Mock data for the chart
const chartData = [
  { name: 'Jan', Receita: 4000, Despesa: 2400 },
  { name: 'Fev', Receita: 3000, Despesa: 1398 },
  { name: 'Mar', Receita: 5000, Despesa: 3800 },
  { name: 'Abr', Receita: 2780, Despesa: 1908 },
  { name: 'Mai', Receita: 1890, Despesa: 1800 },
  { name: 'Jun', Receita: 2390, Despesa: 1800 },
];

export const Dashboard: React.FC<{ userPlan: Plan }> = ({ userPlan }) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await api.getDashboardSummary();
        setSummary(data);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading || !summary) {
    return <div className="text-center p-8">Carregando dados...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Resumo de suas atividades recentes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard icon={FileText} title="Serviços Pendentes" value={summary.pendingServices.toString()} color="bg-yellow-400" />
        <DashboardCard icon={Wrench} title="Serviços em Andamento" value={summary.inProgressServices.toString()} color="bg-blue-400" />
        <DashboardCard icon={DollarSign} title="Receita Total" value={`R$ ${summary.totalRevenue.toFixed(2)}`} color="bg-green-400" />
        <DashboardCard icon={Truck} title="Lucro Líquido" value={`R$ ${summary.netProfit.toFixed(2)}`} color="bg-indigo-400" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Visão Geral Financeira (Últimos 6 Meses)</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

interface CardProps {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: string;
  color: string;
}

const DashboardCard: React.FC<CardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);
