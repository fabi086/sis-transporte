import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../services/api';
import type { Transaction } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Financial: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await api.getTransactions();
            setTransactions(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (!dateFilter.start && !dateFilter.end) return true;
            const date = new Date(t.date);
            const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
            const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
            
            if(startDate) startDate.setHours(0,0,0,0);
            if(endDate) endDate.setHours(23,59,59,999);

            if (startDate && date < startDate) return false;
            if (endDate && date > endDate) return false;
            
            return true;
        });
    }, [transactions, dateFilter]);

    const summary = useMemo(() => {
        const revenue = filteredTransactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
        const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { revenue, expenses, net: revenue - expenses };
    }, [filteredTransactions]);
    
    const expenseByCategory = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'expense');
        const categoryMap = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);

    if (loading) return <div>Carregando dados financeiros...</div>;

    const inputClasses = "w-full bg-gray-800 text-white rounded-lg py-2 px-3 border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 placeholder-gray-400";


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Financeiro</h1>
                <p className="text-gray-500">Controle suas receitas, despesas e veja seu lucro.</p>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col sm:flex-row gap-4 items-center">
                <label htmlFor="start-date" className="text-white font-medium">Filtrar por Período</label>
                <div className="flex items-center gap-2">
                    <input
                        id="start-date"
                        type="date"
                        value={dateFilter.start}
                        onChange={e => setDateFilter(p => ({...p, start: e.target.value}))}
                        className={inputClasses}
                    />
                    <span className="text-gray-400">até</span>
                    <input
                        type="date"
                        value={dateFilter.end}
                        onChange={e => setDateFilter(p => ({...p, end: e.target.value}))}
                        className={inputClasses}
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FinancialCard title="Receita Total" value={summary.revenue} color="text-green-600" />
                <FinancialCard title="Despesa Total" value={summary.expenses} color="text-red-600" />
                <FinancialCard title="Lucro Líquido" value={summary.net} color={summary.net >= 0 ? 'text-blue-600' : 'text-red-600'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Últimas Transações</h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredTransactions
                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                <div>
                                    <p className="font-semibold text-gray-700">{t.description}</p>
                                    <p className="text-sm text-gray-500">{t.category} - {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <p className={`font-bold ${t.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'revenue' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </p>
                            </div>
                        ))}
                         {filteredTransactions.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma transação encontrada para este período.</p>}
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Despesas por Categoria</h2>
                     {expenseByCategory.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                        {expenseByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                           <p>Nenhuma despesa no período.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface FinancialCardProps {
    title: string;
    value: number;
    color: string;
}

const FinancialCard: React.FC<FinancialCardProps> = ({ title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>R$ {value.toFixed(2)}</p>
    </div>
);