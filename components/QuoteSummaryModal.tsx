
import React from 'react';
import type { Quote } from '../types';
import { Bot, DollarSign, Fuel, MapPin } from './icons';

interface QuoteSummaryModalProps {
    quote: Quote;
    onClose: () => void;
    onConfirm: () => void;
}

export const QuoteSummaryModal: React.FC<QuoteSummaryModalProps> = ({ quote, onClose, onConfirm }) => {
    const profit = quote.total - quote.fuelCost;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Resumo do Orçamento</h2>
                    <button onClick={onClose} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Route Info */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Rota e Distância</h3>
                        <div className="space-y-2 text-sm">
                            <RouteItem label="Partida" address={quote.currentLocation} />
                            <RouteItem label="Coleta" address={quote.origin} />
                            <RouteItem label="Entrega" address={quote.destination} />
                            <RouteItem label="Retorno" address={quote.returnAddress} />
                        </div>
                         <div className="mt-4 text-center bg-blue-50 p-3 rounded-md">
                            <p className="text-md font-medium text-blue-800">Distância Total do Percurso: <span className="font-bold text-lg">{quote.totalDistance.toFixed(1)} km</span></p>
                        </div>
                    </div>

                    {/* Financial Info */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Análise de Custo (Interno)</h3>
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-3">
                            <FinancialDetail icon={Fuel} label="Custo Estimado (Combustível)" value={quote.fuelCost} color="text-red-700" isCost/>
                            <FinancialDetail icon={DollarSign} label="Lucro Líquido Estimado" value={profit} color="text-green-700" />
                        </div>
                    </div>

                    {/* Total Price */}
                    <div className="text-center bg-white border-2 border-brand-blue-500 p-6 rounded-lg">
                        <p className="text-md font-semibold text-gray-700">Valor Total para o Cliente</p>
                        <p className="text-5xl font-bold text-brand-blue-700">R$ {quote.total.toFixed(2)}</p>
                         {quote.notes && <p className="text-sm text-gray-600 mt-2 italic">Observações: "{quote.notes}"</p>}
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-lg space-x-3">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-300">
                        Voltar e Editar
                    </button>
                    <button onClick={onConfirm} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 text-sm">
                        Confirmar e Salvar Orçamento
                    </button>
                </div>
            </div>
        </div>
    );
};

const RouteItem: React.FC<{label: string, address: string}> = ({label, address}) => (
    <div className="flex items-start">
        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
        <div>
            <span className="font-semibold text-gray-600">{label}:</span>
            <span className="ml-2 text-gray-800">{address}</span>
        </div>
    </div>
)

const FinancialDetail: React.FC<{icon: React.FC<any>, label: string, value: number, color: string, isCost?: boolean}> = ({icon: Icon, label, value, color, isCost}) => (
    <div className="flex justify-between items-center">
        <div className="flex items-center text-gray-600">
            <Icon className={`w-4 h-4 mr-2 ${color}`} />
            <span>{label}</span>
        </div>
        <span className={`font-bold text-lg ${color}`}>{isCost ? '-' : ''} R$ {value.toFixed(2)}</span>
    </div>
);
