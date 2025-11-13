
import React, { useState, useEffect, useCallback } from 'react';
import type { Quote, User, PlanDetails } from '../types';
import { api } from '../services/api';
import { mapsService } from '../services/mapsService';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapPin, Bot, Fuel, DollarSign } from './icons';
import { QuoteEditModal } from './QuoteEditModal';

interface QuotesProps {
    user: User;
    planDetails: PlanDetails;
}

export const Quotes: React.FC<QuotesProps> = ({ user, planDetails }) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

    // Form state
    const [currentLocation, setCurrentLocation] = useState('');
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [returnAddress, setReturnAddress] = useState(user.settings.defaultReturnAddress);
    const [totalDistance, setTotalDistance] = useState(0);
    const [kmValue, setKmValue] = useState(user.settings.defaultKmValue);
    const [minCharge, setMinCharge] = useState(user.settings.defaultMinCharge);
    const [extras, setExtras] = useState(0);
    const [notes, setNotes] = useState('');
    
    // Calculated values
    const [total, setTotal] = useState(0);
    const [fuelCost, setFuelCost] = useState(0);
    const [profit, setProfit] = useState(0);

    // UI state
    const [isCalculating, setIsCalculating] = useState(false);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

    const { getLocation, data: geoData, loading: geoLoading, error: geoError } = useGeolocation();

    useEffect(() => {
        if (geoData) {
            const fetchAddress = async () => {
                setIsReverseGeocoding(true);
                try {
                    const address = await mapsService.reverseGeocode(geoData.coords.latitude, geoData.coords.longitude);
                    setCurrentLocation(address);
                } catch (e) {
                    setCurrentLocation(`Lat: ${geoData.coords.latitude.toFixed(4)}, Lon: ${geoData.coords.longitude.toFixed(4)}`);
                } finally {
                    setIsReverseGeocoding(false);
                }
            };
            fetchAddress();
        }
    }, [geoData]);
    
    const fetchQuotes = useCallback(async () => {
        setLoading(true);
        const data = await api.getQuotes();
        setQuotes(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    // Main calculation effect
    useEffect(() => {
        const calculatedTotal = (totalDistance * kmValue) + minCharge + extras;
        const finalTotal = Math.max(calculatedTotal, minCharge + extras);
        setTotal(finalTotal);

        const calculatedFuelCost = (totalDistance / user.settings.vehicleConsumption) * user.settings.fuelPrice;
        setFuelCost(calculatedFuelCost);

        setProfit(finalTotal - calculatedFuelCost);

    }, [totalDistance, kmValue, minCharge, extras, user.settings.vehicleConsumption, user.settings.fuelPrice]);
    
    const handleEditQuote = (quote: Quote) => {
        setEditingQuote(quote);
    };

    const handleCloseModal = () => {
        setEditingQuote(null);
    };
    
    const handleUpdateQuote = async (updatedQuote: Quote) => {
        try {
            await api.updateQuote(updatedQuote);
            await fetchQuotes(); // Refresh the list
            handleCloseModal();
        } catch (error) {
            console.error("Failed to update quote:", error);
            alert("Não foi possível atualizar o orçamento.");
        }
    };
    
    const handleCreateServiceFromQuote = async (quote: Quote) => {
        try {
            await api.addService(quote);
            alert(`Serviço criado com sucesso para o orçamento de ${quote.origin} para ${quote.destination}.`);
            handleCloseModal();
        } catch (error) {
            console.error("Failed to create service:", error);
            alert("Não foi possível criar o serviço.");
        }
    };

    const handleCalculateRoute = async () => {
        if (!currentLocation || !origin || !destination || !returnAddress) {
            alert('Por favor, preencha todos os quatro endereços para calcular a rota.');
            return;
        }
        setIsCalculating(true);
        try {
            const routeLegs = [
                { from: currentLocation, to: origin },
                { from: origin, to: destination },
                { from: destination, to: returnAddress },
            ];
            const dist = await mapsService.calculateTotalRouteDistance(routeLegs);
            setTotalDistance(dist);
        } catch (error) {
            console.error("Failed to calculate distance:", error);
            alert("Não foi possível calcular a distância. Tente novamente.");
        }
        setIsCalculating(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (planDetails.quoteLimit !== 'unlimited' && quotes.length >= planDetails.quoteLimit) {
            alert(`Você atingiu o limite de ${planDetails.quoteLimit} orçamentos do seu plano. Faça upgrade para continuar.`);
            return;
        }
        if (totalDistance === 0) {
            alert('Por favor, calcule a rota antes de salvar o orçamento.');
            return;
        }

        const newQuote: Omit<Quote, 'id' | 'createdAt'> = { currentLocation, origin, destination, returnAddress, totalDistance, kmValue, minCharge, extras, notes, total, fuelCost };
        await api.addQuote(newQuote);
        await fetchQuotes();
        
        // Reset form
        setCurrentLocation('');
        setOrigin('');
        setDestination('');
        setTotalDistance(0);
        setExtras(0);
        setNotes('');
    };

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                 <h1 className="text-3xl font-bold text-gray-800">Novo Orçamento</h1>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ADDRESS FIELDS */}
                        <AddressInput label="Seu Local Atual (Partida)" subLabel="Onde você está agora" value={currentLocation} onChange={setCurrentLocation} placeholder="Ex: Rua das Flores, 123" onGeolocate={getLocation} isGeolocating={geoLoading || isReverseGeocoding} geoError={geoError?.message} />
                        <AddressInput label="Origem (Busca do Veículo)" subLabel="Endereço de coleta" value={origin} onChange={setOrigin} placeholder="Ex: Av. Brasil, 456" />
                        <AddressInput label="Destino (Entrega)" subLabel="Endereço de entrega" value={destination} onChange={setDestination} placeholder="Ex: Rodovia Castelo Branco, km 10" />
                        <AddressInput label="Retorno (Sua Base)" subLabel="Endereço da sua garagem ou base" value={returnAddress} onChange={setReturnAddress} placeholder="Ex: Garagem Central" />

                        <button type="button" onClick={handleCalculateRoute} disabled={isCalculating} className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue-600 hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-500 disabled:bg-gray-400">
                           <Bot className="h-5 w-5 mr-2" />
                           {isCalculating ? 'Calculando...' : 'Calcular Rota Completa'}
                        </button>
                        
                        {totalDistance > 0 && <p className="text-center text-sm font-medium text-gray-600">Distância Total do Percurso: <span className="font-bold">{totalDistance} km</span></p>}

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
                        
                        {/* COST ANALYSIS (INTERNAL) */}
                        {totalDistance > 0 && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md space-y-3">
                                <h3 className="font-bold text-blue-800 text-md">Análise de Custo (Interno)</h3>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center text-red-700">
                                        <Fuel className="h-4 w-4 mr-2"/>
                                        <span>Custo Combustível:</span>
                                    </div>
                                    <span className="font-bold text-red-700">- R$ {fuelCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center text-green-700">
                                        <DollarSign className="h-4 w-4 mr-2"/>
                                        <span>Lucro Estimado:</span>
                                    </div>
                                    <span className="font-bold text-green-700">R$ {profit.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {/* TOTAL PRICE (FOR CLIENT) */}
                        <div className="text-center bg-white border border-gray-200 p-6 rounded-lg">
                            <p className="text-sm text-gray-600">Valor Total para o Cliente</p>
                            <p className="text-4xl font-bold text-brand-blue-700">R$ {total.toFixed(2)}</p>
                        </div>

                        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Salvar Orçamento
                        </button>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                 <h1 className="text-3xl font-bold text-gray-800">Histórico de Orçamentos</h1>
                <div className="bg-white p-6 rounded-lg shadow-lg space-y-4 max-h-[80vh] overflow-y-auto">
                    {loading ? <p>Carregando histórico...</p> : quotes.map(q => (
                        <button 
                            key={q.id} 
                            onClick={() => handleEditQuote(q)}
                            className="w-full text-left border border-gray-200 p-4 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{q.origin} → {q.destination}</p>
                                    <p className="text-sm text-gray-500">{new Date(q.createdAt).toLocaleDateString('pt-BR')} - {q.totalDistance} km (total)</p>
                                </div>
                                <p className="text-lg font-bold text-brand-blue-700 mt-2 sm:mt-0">R$ {q.total.toFixed(2)}</p>
                            </div>
                             {q.notes && <p className="text-sm text-gray-600 mt-2 italic">"{q.notes}"</p>}
                             <div className="mt-3 flex flex-wrap gap-2">
                                <button onClick={(e) => handleShareWhatsApp(e, q)} className="relative z-10 text-sm bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600">Compartilhar no WhatsApp</button>
                                <button onClick={(e) => handleCreateServiceClick(e, q)} className="relative z-10 text-sm bg-brand-blue-500 text-white py-1 px-3 rounded-md hover:bg-brand-blue-600">Criar Serviço</button>
                            </div>
                        </button>
                    ))}
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