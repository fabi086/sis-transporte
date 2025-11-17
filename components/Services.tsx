

import React, { useState, useEffect, useMemo } from 'react';
import type { Service, ServiceStatus, Quote, ServiceWithDetails } from '../types';
import { api } from '../services/api';
import { ServiceDetailModal } from './ServiceDetailModal';

const statusConfig: Record<ServiceStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 border-blue-500' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-500' },
};

export const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [viewingService, setViewingService] = useState<ServiceWithDetails | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [servicesData, quotesData] = await Promise.all([
            api.getServices(),
            api.getQuotes(),
        ]);
        setServices(servicesData);
        setQuotes(quotesData);
      } catch (error) {
        console.error("Failed to fetch service data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusChange = async (serviceId: string, newStatus: ServiceStatus) => {
    try {
      const updatedService = await api.updateServiceStatus(serviceId, newStatus);
      setServices(prevServices =>
        prevServices.map(s =>
          s.id === serviceId ? { ...s, status: newStatus } : s
        )
      );
      // Also update the service in the modal if it's open
      if (viewingService && viewingService.id === serviceId) {
          setViewingService(prev => prev ? {...prev, status: newStatus} : null);
      }
    } catch (error) {
      console.error("Failed to update service status:", error);
      alert("Erro ao atualizar o status do serviço.");
    }
  };
  
  const filteredAndSortedServices = useMemo(() => {
    const quotesMap = new Map(quotes.map(q => [q.id, q]));
    
    const servicesWithDetails: ServiceWithDetails[] = services.map(service => {
        // FIX: Explicitly type `quote` to resolve type inference issues.
        const quote: Quote | undefined = quotesMap.get(service.quoteId);
        return {
            ...service,
            origin: quote?.origin || 'N/A',
            destination: quote?.destination || 'N/A',
            profit: service.value - service.cost,
        };
    });

    let filtered: ServiceWithDetails[] = servicesWithDetails;

    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter.start) {
        const startDate = new Date(dateFilter.start);
        startDate.setHours(0, 0, 0, 0); // Start of the day
        filtered = filtered.filter(s => new Date(s.createdAt) >= startDate);
    }
    if (dateFilter.end) {
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999); // End of the day
        filtered = filtered.filter(s => new Date(s.createdAt) <= endDate);
    }

    // Apply search filter
    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        filtered = filtered.filter((s: ServiceWithDetails) => 
            s.clientName.toLowerCase().includes(lowercasedTerm) ||
            s.origin.toLowerCase().includes(lowercasedTerm) ||
            s.destination.toLowerCase().includes(lowercasedTerm)
        );
    }

    // Apply sorting
    filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        // FIX: Corrected a typo where 'b' was used instead of 'dateB'.
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [services, quotes, statusFilter, searchTerm, sortBy, dateFilter]);

  if (loading) {
    return <div className="text-center p-8">Carregando serviços...</div>;
  }

  const inputClasses = "w-full bg-gray-800 text-white rounded-lg py-2 px-3 border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 placeholder-gray-400";

  return (
    <>
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Histórico de Serviços</h1>
        <p className="text-gray-500">Pesquise e gerencie todos os seus serviços.</p>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center sticky top-0 z-10 flex-wrap">
        <input 
          type="text"
          placeholder="Buscar por cliente ou local..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={`${inputClasses} md:flex-1`}
        />
        <div className="flex w-full md:w-auto gap-2">
            <input type="date" value={dateFilter.start} onChange={e => setDateFilter(prev => ({...prev, start: e.target.value}))} className={inputClasses} />
             <input type="date" value={dateFilter.end} onChange={e => setDateFilter(prev => ({...prev, end: e.target.value}))} className={inputClasses} />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value as any)}
          className={`${inputClasses} md:w-auto`}
        >
          <option value="all">Todos os Status</option>
          {Object.entries(statusConfig).map(([statusKey, { label }]) => (
            <option key={statusKey} value={statusKey}>{label}</option>
          ))}
        </select>
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value as any)}
          className={`${inputClasses} md:w-auto`}
        >
          <option value="newest">Mais Recentes</option>
          <option value="oldest">Mais Antigos</option>
        </select>
      </div>
      
      <div className="space-y-4">
        {filteredAndSortedServices.length > 0 ? (
            filteredAndSortedServices.map(service => (
                <ServiceHistoryCard key={service.id} service={service} onStatusChange={handleStatusChange} onViewDetails={() => setViewingService(service)} />
            ))
        ) : (
            <div className="text-center bg-white p-10 rounded-lg shadow-md">
                <p className="text-gray-500">Nenhum serviço encontrado com os filtros aplicados.</p>
            </div>
        )}
      </div>

    </div>
    {viewingService && (
        <ServiceDetailModal 
            service={viewingService}
            onClose={() => setViewingService(null)}
            onStatusChange={handleStatusChange}
        />
    )}
    </>
  );
};

interface ServiceHistoryCardProps {
  service: ServiceWithDetails;
  onStatusChange: (serviceId: string, newStatus: ServiceStatus) => void;
  onViewDetails: () => void;
}

const FinancialDetail: React.FC<{label: string, value: number, color: string}> = ({label, value, color}) => (
    <div className="flex justify-between items-baseline text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-bold ${color}`}>R$ {value.toFixed(2)}</span>
    </div>
);

const ServiceHistoryCard: React.FC<ServiceHistoryCardProps> = ({ service, onStatusChange, onViewDetails }) => {
  const statusInfo = statusConfig[service.status];
  return (
    <button onClick={onViewDetails} className={`w-full text-left bg-white p-4 rounded-lg shadow-md border-l-4 ${statusInfo.color.replace('text-', 'border-').replace('bg-green-100', 'border-green-500').replace('bg-blue-100', 'border-blue-500').replace('bg-yellow-100', 'border-yellow-500')} hover:shadow-lg hover:border-brand-blue-500 transition-all`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2">
                <h3 className="font-bold text-gray-800 text-lg">{service.clientName}</h3>
                <p className="text-sm text-gray-500 truncate" title={`${service.origin} → ${service.destination}`}>{service.origin} → {service.destination}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(service.createdAt).toLocaleString('pt-BR')}</p>
            </div>

            <div className="space-y-1">
                 <FinancialDetail label="Valor Cobrado:" value={service.value} color="text-green-700" />
                 <FinancialDetail label="Custo:" value={service.cost} color="text-red-700" />
                 <hr className="my-1"/>
                 <FinancialDetail label="Lucro Líquido:" value={service.profit} color="text-blue-800 font-bold" />
            </div>

            <div className="text-left md:text-right">
                <div className={`text-sm font-semibold rounded-full px-3 py-1.5 inline-block ${statusInfo.color}`}>
                    {statusInfo.label}
                </div>
            </div>
        </div>
    </button>
  );
};