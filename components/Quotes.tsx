

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Quote, User, PlanDetails, QuoteStatus, Vehicle } from '../types';
import { api } from '../services/api';
import { mapsService } from '../services/mapsService';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapPin, Bot, Trash, Truck, Edit } from './icons';
import { QuoteEditModal } from './QuoteEditModal';
import { QuoteSummaryModal } from './QuoteSummaryModal';

interface QuotesProps {
    user: User;
    planDetails: PlanDetails;
}

type GeolocationField = 'current' | 'return';

const statusConfig: Record<QuoteStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  service_created: { label: 'Serviço Criado', color: 'bg-blue-100 text-blue-800' },
};

export const Quotes: React.FC<QuotesProps> = ({ user, planDetails }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

    // Form state
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [currentLocation, setCurrentLocation] = useState('');
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [returnAddress, setReturnAddress] = useState(user.settings.defaultReturnAddress);
    const [kmValue, setKmValue] = useState(user.settings.defaultKmValue);
    const [minCharge, setMinCharge] = useState(user.settings.defaultMinCharge);
    const [extras, setExtras] = useState(0);
    const [notes, setNotes] = useState('');
    
    // UI state
    const [isCalculating, setIsCalculating] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [geocodingField, setGeocodingField] = useState<GeolocationField | null>(null);
    const [summaryQuote, setSummaryQuote] = useState<Quote | null>(null);

    const { getLocation, data: geoData, loading: geoLoading, error: geoError } = useGeolocation();

    useEffect(() => {
        if (geoData && geocodingField) {
            const fetchAddress = async () => {
                setIsReverseGeocoding(true);
                try {
                    const address = await mapsService.reverseGeocode(geoData.coords.latitude, geoData.coords.longitude);
                    if (geocodingField === 'current') {
                        setCurrentLocation(address);
                    } else if (geocodingField === 'return') {
                        setReturnAddress(address);
                    }
                } catch (e) {
                    const fallbackAddress = `Lat: ${geoData.coords.latitude.toFixed(4)}, Lon: ${geoData.coords.longitude.toFixed(4)}`;
                     if (geocodingField === 'current') {
                        setCurrentLocation(fallbackAddress);
                    } else if (geocodingField === 'return') {
                        setReturnAddress(fallbackAddress);
                    }
                } finally {
                    setIsReverseGeocoding(false);
                    setGeocodingField(null); // Reset after use
                }
            };
            fetchAddress();
        }
    }, [geoData, geocodingField]);

    const handleGeolocate = (field: GeolocationField) => {
        setGeocodingField(field);
        getLocation();
    };
    
    const fetchQuotesAndVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const [quotesData, vehiclesData] = await Promise.all([
                api.getQuotes(),
                api.getVehicles(),
            ]);
            setQuotes(quotesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setVehicles(vehiclesData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuotesAndVehicles();
    }, [fetchQuotesAndVehicles]);
    
    const handleEditQuote = (quote: Quote) => {
        setEditingQuote(quote);
    };

    const handleCloseModal = () => {
        setEditingQuote(null);
    };
    
    const handleUpdateQuote = async (updatedQuote: Quote) => {
        try {
            await api.updateQuote(updatedQuote);
            await fetchQuotesAndVehicles();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to update quote:", error);
            alert("Não foi possível atualizar o orçamento.");
        }
    };
    
    const handleCreateServiceFromQuote = async (quote: Quote) => {
         if (quote.status === 'service_created') {
            alert('Um serviço já foi criado para este orçamento.');
            return;
        }
        try {
            await api.addService(quote);
            await fetchQuotesAndVehicles();
            alert(`Serviço criado com sucesso para o orçamento de ${quote.origin} para ${quote.destination}.`);
            handleCloseModal();
        } catch (error) {
            console.error("Failed to create service:", error);
            alert("Não foi possível criar o serviço.");
        }
    };

    const handleDeleteQuote = async (quoteId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.')) {
            try {
                await api.deleteQuote(quoteId);
                await fetchQuotesAndVehicles();
            } catch (error) {
                console.error("Failed to delete quote:", error);
                alert("Não foi possível excluir o orçamento.");
            }
        }
    };

    const handleCalculateRoute = async () => {
        if (!selectedVehicleId) {
            alert('Por favor, selecione um veículo para o orçamento.');
            return;
        }
        if (!currentLocation || !origin || !destination || !returnAddress) {
            alert('Por favor, preencha todos os quatro endereços para calcular a rota.');
            return;
        }
        setIsCalculating(true);
        try {
            const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
            if (!selectedVehicle) {
                throw new Error("Veículo selecionado não encontrado.");
            }

            const routeLegs = [
                { from: currentLocation, to: origin },
                { from: origin, to: destination },
                { from: destination, to: returnAddress },
            ];
            const dist = await mapsService.calculateTotalRouteDistance(routeLegs);
            
            // Perform calculations
            const calculatedTotal = (dist * kmValue) + minCharge + extras;
            const finalTotal = Math.max(calculatedTotal, minCharge + extras);
            const calculatedFuelCost = (dist / selectedVehicle.avgConsumption) * user.settings.fuelPrice;

            // Create temporary quote object for summary
            const tempQuote: Omit<Quote, 'id' | 'createdAt' | 'status'> & { id?: string; createdAt?: string; status?: QuoteStatus } = {
                currentLocation,
                origin,
                destination,
                returnAddress,
                totalDistance: dist,
                kmValue,
                minCharge,
                extras,
                notes,
                total: finalTotal,
                fuelCost: calculatedFuelCost,
                vehicleId: selectedVehicleId,
            };
            
            setSummaryQuote({ ...tempQuote, id: 'temp', createdAt: new Date().toISOString(), status: 'pending' });

        } catch (error) {
            console.error("Failed to calculate distance:", error);
            const errorMessage = error instanceof Error ? error.message : "Não foi possível calcular a distância. Verifique os endereços e tente novamente.";
            alert(errorMessage);
        }
        setIsCalculating(false);
    };

    const handleConfirmAndSaveQuote = async () => {
        if (!summaryQuote) return;

        if (planDetails.quoteLimit !== 'unlimited' && quotes.length >= planDetails.quoteLimit) {
            alert(`Você atingiu o limite de ${planDetails.quoteLimit} orçamentos do seu plano. Faça upgrade para continuar.`);
            setSummaryQuote(null);
            return;
        }
        
        const { id, createdAt, status, ...newQuoteData } = summaryQuote;
        
        try {
            await api.addQuote(newQuoteData);
            await fetchQuotesAndVehicles();
            
            // Reset form
            setCurrentLocation('');
            setOrigin('');
            setDestination('');
            setExtras(0);
            setNotes('');
            setSelectedVehicleId('');
        } catch (error) {
            console.error("Failed to save quote:", error);
            alert("Ocorreu um erro ao salvar o orçamento.");
        } finally {
             setSummaryQuote(null); // Close modal
        }
    };
    
    const handleShareWhatsApp = (e: React.MouseEvent, quote: Quote) => {
        e.stopPropagation();
        const message = `Olá! Segue o seu orçamento de reboque:\n\n*Origem:* ${quote.origin}\n*Destino:* ${quote.destination}\n*Distância Total do Serviço:* ${quote.totalDistance} km\n\n*Valor Total: R$ ${quote.total.toFixed(2)}*\n\n*Observações:* ${quote.notes || 'Nenhuma'}\n\n---\nGerado por Reboque360`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const handleCreateServiceClick = async (e: React.MouseEvent, quote: Quote) => {
        e.stopPropagation();
        await handleCreateServiceFromQuote(quote);
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, quoteId: string, newStatus: QuoteStatus) => {
        e.stopPropagation();
        try {
            await api.updateQuoteStatus(quoteId, newStatus);
            await fetchQuotesAndVehicles();
        } catch (error) {
            console.error("Failed to update quote status:", error);
            alert("Erro ao atualizar o status do orçamento.");
        }
    };

    const filteredQuotes = useMemo(() => {
        let filtered = quotes;
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(q => q.status === statusFilter);
        }

        if (dateFilter.start) {
            const startDate = new Date(dateFilter.start);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(q => new Date(q.createdAt) >= startDate);
        }
        if (dateFilter.end) {
            const endDate = new Date(dateFilter.end);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(q => new Date(q.createdAt) <= endDate);
        }

        return filtered;
    }, [quotes, statusFilter, dateFilter]);

    const inputClassesFilters = "w-full bg-gray-800 text-white rounded-lg py-2 px-3 border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 placeholder-gray-400";

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                 <h1 className="text-3xl font-bold text-gray-800">Novo Orçamento</h1>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="space-y-6">
                        {/* VEHICLE SELECTOR */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Veículo
                                <span className="block text-xs text-gray-500 font-normal">Selecione o veículo para este serviço</span>
                            </label>
                            <select
                                value={selectedVehicleId}
                                onChange={e => setSelectedVehicleId(e.target.value)}
                                className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                            >
                                <option value="" disabled>-- Selecione um veículo --</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* ADDRESS FIELDS */}
                        <AddressInput label="Seu Local Atual (Partida)" subLabel="Onde você está agora" value={currentLocation} onChange={setCurrentLocation} placeholder="Ex: Rua das Flores, 123" onGeolocate={() => handleGeolocate('current')} isGeolocating={(geoLoading || isReverseGeocoding) && geocodingField === 'current'} geoError={geocodingField === 'current' ? geoError?.message : undefined} />
                        <AddressInput label="Origem (Busca do Veículo)" subLabel="Endereço de coleta" value={origin} onChange={setOrigin} placeholder="Ex: Av. Brasil, 456" />
                        <AddressInput label="Destino (Entrega)" subLabel="Endereço de entrega" value={destination} onChange={setDestination} placeholder="Ex: Rodovia Castelo Branco, km 10" />
                        <AddressInput label="Retorno (Sua Base)" subLabel="Endereço da sua garagem ou base" value={returnAddress} onChange={setReturnAddress} placeholder="Ex: Garagem Central" onGeolocate={() => handleGeolocate('return')} isGeolocating={(geoLoading || isReverseGeocoding) && geocodingField === 'return'} geoError={geocodingField === 'return' ? geoError?.message : undefined} />

                        {/* PRICING FIELDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <NumberInput label="Valor/km (R$)" value={kmValue} onChange={setKmValue} />
                            <NumberInput label="Saída Mínima (R$)" value={minCharge} onChange={setMinCharge} />
                        </div>
                         <NumberInput label="Custos Extras (R$)" value={extras} onChange={setExtras} placeholder="Pedágios, etc." />
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Observações</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-brand-blue-500 focus:border-brand-blue-500"></textarea>
                        </div>
                        
                        <button type="button" onClick={handleCalculateRoute} disabled={isCalculating} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-blue-600 hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 disabled:bg-gray-400">
                           <Bot className="h-5 w-5 mr-2" />
                           {isCalculating ? 'Calculando...' : 'Calcular e Ver Resumo'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center sticky top-0 z-10 flex-wrap">
                    <h2 className="text-xl font-bold text-white mr-4 hidden md:block">Histórico</h2>
                    <div className="flex w-full md:w-auto gap-2">
                         <input type="date" value={dateFilter.start} onChange={e => setDateFilter(p => ({...p, start: e.target.value}))} className={inputClassesFilters} />
                         <input type="date" value={dateFilter.end} onChange={e => setDateFilter(p => ({...p, end: e.target.value}))} className={inputClassesFilters} />
                    </div>
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className={`${inputClassesFilters} md:w-auto`}
                    >
                        <option value="all">Todos Status</option>
                        {Object.entries(statusConfig).map(([statusKey, { label }]) => (
                            <option key={statusKey} value={statusKey}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                    {loading ? <p>Carregando histórico...</p> : filteredQuotes.map(q => (
                        <div key={q.id} className="bg-white border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow duration-200">
                             <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                                 <div>
                                     <p className="font-bold text-gray-800">{q.origin} → {q.destination}</p>
                                     <p className="text-sm text-gray-500">{new Date(q.createdAt).toLocaleDateString('pt-BR')} - {q.totalDistance} km (total)</p>
                                     {q.vehicleId && vehicles.find(v => v.id === q.vehicleId) && 
                                       <p className="text-xs text-gray-500 mt-1 flex items-center"><Truck className="w-3 h-3 mr-1"/>{vehicles.find(v => v.id === q.vehicleId)?.model}</p>
                                     }
                                 </div>
                                 <p className="text-lg font-bold text-brand-blue-700 mt-2 sm:mt-0">R$ {q.total.toFixed(2)}</p>
                             </div>
                             {q.notes && <p className="text-sm text-gray-600 mt-2 italic">"{q.notes}"</p>}
                             <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 items-center justify-between">
                                <div className="flex flex-wrap gap-2 items-center">
                                  <button onClick={(e) => handleShareWhatsApp(e, q)} className="z-10 text-sm bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600">Compartilhar no WhatsApp</button>
                                  <button onClick={(e) => handleCreateServiceClick(e, q)} disabled={q.status === 'service_created'} className="z-10 text-sm bg-brand-blue-500 text-white py-1 px-3 rounded-md hover:bg-brand-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                      {q.status === 'service_created' ? 'Serviço Criado' : 'Criar Serviço'}
                                  </button>
                                  <div className="relative z-10">
                                      <select
                                          value={q.status}
                                          onChange={(e) => handleStatusChange(e, q.id, e.target.value as QuoteStatus)}
                                          onClick={(e) => e.stopPropagation()} // Prevent card click
                                          className={`text-sm font-semibold rounded-full px-3 py-1.5 appearance-none focus:outline-none cursor-pointer ${statusConfig[q.status]?.color || 'bg-gray-200'}`}
                                      >
                                          {Object.entries(statusConfig).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                                      </select>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={() => handleEditQuote(q)}
                                        className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full"
                                        aria-label="Editar Orçamento"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteQuote(q.id)} 
                                        className="p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 rounded-full"
                                        aria-label="Excluir Orçamento"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))}
                    {filteredQuotes.length === 0 && !loading && <p className="text-center text-gray-500 py-4">Nenhum orçamento encontrado com os filtros aplicados.</p>}
                </div>
            </div>
        </div>

        {editingQuote && (
            <QuoteEditModal 
                quote={editingQuote}
                onClose={handleCloseModal}
                onSave={handleUpdateQuote}
                onCreateService={handleCreateServiceFromQuote}
            />
        )}

        {summaryQuote && (
            <QuoteSummaryModal
                quote={summaryQuote}
                onClose={() => setSummaryQuote(null)}
                onConfirm={handleConfirmAndSaveQuote}
            />
        )}
        </>
    );
};

// --- Sub-components for the form ---

interface AddressInputProps {
    label: string;
    subLabel?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    onGeolocate?: () => void;
    isGeolocating?: boolean;
    geoError?: string;
}

const AddressInput: React.FC<AddressInputProps> = ({ label, subLabel, value, onChange, placeholder, onGeolocate, isGeolocating, geoError }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">
            {label}
            {subLabel && <span className="block text-xs text-gray-500 font-normal">{subLabel}</span>}
        </label>
        <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-brand-blue-500 focus:border-brand-blue-500" 
            placeholder={placeholder} 
            disabled={isGeolocating}
        />
        {onGeolocate && (
            <>
                <button 
                    type="button" 
                    onClick={onGeolocate} 
                    disabled={isGeolocating} 
                    className="mt-2 flex items-center text-sm text-brand-blue-600 hover:text-brand-blue-800 disabled:text-gray-400 disabled:cursor-wait"
                >
                    <MapPin className="h-4 w-4 mr-1" />
                    {isGeolocating ? 'Obtendo...' : 'Usar Localização Atual'}
                </button>
                {geoError && <p className="text-xs text-red-500 mt-1">{geoError}</p>}
            </>
        )}
    </div>
);

interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input 
            type="number" 
            step="0.01" 
            value={value} 
            onChange={e => onChange(parseFloat(e.target.value) || 0)} 
            className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder={placeholder}
        />
    </div>
);