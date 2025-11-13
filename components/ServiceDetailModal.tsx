import React from 'react';
// FIX: Import ServiceStatus from '../types' as it's not exported from './Services'
import type { ServiceWithDetails } from './Services';
import type { ServiceStatus } from '../types';
import { DollarSign, Fuel } from './icons';

interface ServiceDetailModalProps {
    service: ServiceWithDetails;
    onClose: () => void;
    onStatusChange: (serviceId: string, newStatus: ServiceStatus) => void;
}

const statusConfig: Record<ServiceStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
};

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, onClose, onStatusChange }) => {
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Detalhes do Serviço</h2>
                    <button onClick={onClose} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Service Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem label="Cliente" value={service.clientName} />
                        <InfoItem label="Telefone" value={service.clientPhone} />
                        <InfoItem label="Data" value={new Date(service.createdAt).toLocaleString('pt-BR')} />
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Status</label>
                             <select
                                value={service.status}
                                onChange={(e) => onStatusChange(service.id, e.target.value as ServiceStatus)}
                                className={`mt-1 text-sm font-semibold rounded-md p-2 outline-none w-full ${statusConfig[service.status].color}`}
                            >
                                {Object.entries(statusConfig).map(([statusKey, { label }]) => (
                                    <option key={statusKey} value={statusKey}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Route Info */}
                    <div>
                         <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Rota</h3>
                         <div className="space-y-2">
                            <InfoItem label="Origem" value={service.origin} />
                            <InfoItem label="Destino" value={service.destination} />
                         </div>
                    </div>


                    {/* Financial Info */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Financeiro</h3>
                         <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-3">
                            <FinancialDetail icon={DollarSign} label="Valor Cobrado do Cliente" value={service.value} color="text-green-700" />
                            <FinancialDetail icon={Fuel} label="Custo Estimado (Combustível)" value={service.cost} color="text-red-700" isCost/>
                             <hr />
                            <div className="flex justify-between items-center text-md">
                                <span className="font-bold text-gray-800">Lucro Líquido Estimado:</span>
                                <span className="font-bold text-2xl text-blue-800">R$ {service.profit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="bg-brand-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-brand-blue-700">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoItem: React.FC<{label: string, value: string}> = ({label, value}) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-md text-gray-800 font-semibold">{value}</p>
    </div>
);

const FinancialDetail: React.FC<{icon: React.FC<any>, label: string, value: number, color: string, isCost?: boolean}> = ({icon: Icon, label, value, color, isCost}) => (
    <div className="flex justify-between items-center">
        <div className="flex items-center text-gray-600">
            <Icon className={`w-4 h-4 mr-2 ${color}`} />
            <span>{label}</span>
        </div>
        <span className={`font-bold text-lg ${color}`}>{isCost ? '-' : ''} R$ {value.toFixed(2)}</span>
    </div>
);