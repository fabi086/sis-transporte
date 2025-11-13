
import React, { useState, useEffect } from 'react';
import type { Quote } from '../types';
import { api } from '../services/api';

interface QuoteEditModalProps {
    quote: Quote;
    onClose: () => void;
    onSave: (updatedQuote: Quote) => void;
    onCreateService: (quote: Quote) => void;
}

const NumberInput: React.FC<{ label: string; value: number; onChange: (value: number) => void; }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input 
            type="number" 
            step="0.01" 
            value={value} 
            onChange={e => onChange(parseFloat(e.target.value) || 0)} 
            className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-blue-500 focus:border-brand-blue-500"
        />
    </div>
);


export const QuoteEditModal: React.FC<QuoteEditModalProps> = ({ quote, onClose, onSave, onCreateService }) => {
    const [editedQuote, setEditedQuote] = useState<Quote>(quote);
    const [total, setTotal] = useState(quote.total);

    useEffect(() => {
        const baseTotal = (editedQuote.totalDistance * editedQuote.kmValue) + editedQuote.minCharge + editedQuote.extras;
        const finalTotal = Math.max(baseTotal, editedQuote.minCharge + editedQuote.extras) - (editedQuote.discount || 0);
        setTotal(finalTotal);
    }, [editedQuote.kmValue, editedQuote.minCharge, editedQuote.extras, editedQuote.discount, editedQuote.totalDistance]);

    const handleChange = (field: keyof Quote, value: string | number) => {
        setEditedQuote(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave({ ...editedQuote, total, fuelCost: quote.fuelCost });
    };

    const handleCreateService = () => {
        // We use the updated quote from the modal state
        onCreateService({ ...editedQuote, total, fuelCost: quote.fuelCost });
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Editar Orçamento</h2>
                    <button onClick={onClose} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <p className="font-bold text-gray-800">{editedQuote.origin} → {editedQuote.destination}</p>
                        <p className="text-sm text-gray-500">{new Date(editedQuote.createdAt).toLocaleDateString('pt-BR')} - {editedQuote.totalDistance} km (total)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NumberInput label="Valor/km (R$)" value={editedQuote.kmValue} onChange={val => handleChange('kmValue', val)} />
                        <NumberInput label="Saída Mínima (R$)" value={editedQuote.minCharge} onChange={val => handleChange('minCharge', val)} />
                        <NumberInput label="Custos Extras (R$)" value={editedQuote.extras} onChange={val => handleChange('extras', val)} />
                        <NumberInput label="Desconto (R$)" value={editedQuote.discount || 0} onChange={val => handleChange('discount', val)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea value={editedQuote.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-blue-500 focus:border-brand-blue-500"></textarea>
                    </div>

                    <div className="text-center bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Novo Valor Total para o Cliente</p>
                        <p className="text-3xl font-bold text-brand-blue-700">R$ {total.toFixed(2)}</p>
                    </div>
                </div>

                <div className="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg space-x-3">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button onClick={handleCreateService} className="bg-brand-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-blue-600 text-sm">
                        Criar Serviço
                    </button>
                     <button onClick={handleSave} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 text-sm">
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};