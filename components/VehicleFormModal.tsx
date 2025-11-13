import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../types';

interface VehicleFormModalProps {
    vehicle: Vehicle | null;
    onClose: () => void;
    onSave: (vehicle: Omit<Vehicle, 'id'> | Vehicle) => void;
}

const emptyVehicle: Omit<Vehicle, 'id'> = {
    plate: '',
    model: '',
    year: new Date().getFullYear(),
    km: 0,
    avgConsumption: 0,
    nextMaintenanceKm: 0,
};

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ vehicle, onClose, onSave }) => {
    const [formData, setFormData] = useState(emptyVehicle);

    useEffect(() => {
        if (vehicle) {
            setFormData(vehicle);
        } else {
            setFormData(emptyVehicle);
        }
    }, [vehicle]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{vehicle ? 'Editar Veículo' : 'Adicionar Novo Veículo'}</h2>
                    <button onClick={onClose} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <FormInput label="Placa" name="plate" value={formData.plate} onChange={handleChange} placeholder="ABC1D23" required />
                    <FormInput label="Modelo" name="model" value={formData.model} onChange={handleChange} placeholder="Ex: VW Delivery Express" required />
                    <FormInput label="Ano" name="year" type="number" value={formData.year} onChange={handleChange} required />
                    <FormInput label="Quilometragem (km)" name="km" type="number" value={formData.km} onChange={handleChange} required />
                    <FormInput label="Consumo Médio (km/L)" name="avgConsumption" type="number" step="0.1" value={formData.avgConsumption} onChange={handleChange} required />
                    <FormInput label="Próxima Manutenção (km)" name="nextMaintenanceKm" type="number" value={formData.nextMaintenanceKm} onChange={handleChange} required />
                

                    <div className="flex justify-end items-center pt-4 border-t space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-brand-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-blue-700 text-sm">
                            Salvar Veículo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const FormInput: React.FC<FormInputProps> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input 
            {...props}
            className="mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-blue-500 focus:border-brand-blue-500"
        />
    </div>
);