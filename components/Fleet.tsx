import React, { useState, useEffect, useCallback } from 'react';
import type { Vehicle } from '../types';
import { api } from '../services/api';
import { Truck, Edit, Trash } from './icons';
import { VehicleFormModal } from './VehicleFormModal';

export const Fleet: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const data = await api.getVehicles();
    setVehicles(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSaveVehicle = async (vehicleData: Omit<Vehicle, 'id'> | Vehicle) => {
    if ('id' in vehicleData) {
      // Editing existing vehicle
      await api.updateVehicle(vehicleData);
    } else {
      // Adding new vehicle
      await api.addVehicle(vehicleData);
    }
    await fetchVehicles();
    handleCloseModal();
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      await api.deleteVehicle(vehicleId);
      await fetchVehicles();
    }
  };

  if (loading) {
    return <div>Carregando frota...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Minha Frota</h1>
            <p className="text-gray-500">Gerencie os veículos e suas manutenções.</p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="bg-brand-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-blue-700 transition"
          >
            Adicionar Veículo
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteVehicle}
            />
          ))}
        </div>
         {vehicles.length === 0 && (
             <div className="md:col-span-2 lg:col-span-3 text-center bg-white p-10 rounded-lg shadow-md">
                <p className="text-gray-500">Nenhum veículo cadastrado ainda.</p>
            </div>
         )}
      </div>

      {isModalOpen && (
        <VehicleFormModal 
          vehicle={editingVehicle}
          onClose={handleCloseModal}
          onSave={handleSaveVehicle}
        />
      )}
    </>
  );
};

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onEdit, onDelete }) => {
    const kmToMaintenance = vehicle.nextMaintenanceKm - vehicle.km;
    const maintenanceAlert = kmToMaintenance <= 5000;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-brand-blue-500 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                      <Truck className="h-8 w-8 text-brand-blue-600 mr-4" />
                      <div>
                          <h2 className="text-xl font-bold text-gray-800">{vehicle.model}</h2>
                          <p className="text-lg text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block">{vehicle.plate}</p>
                      </div>
                  </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                      <span>Ano:</span>
                      <span className="font-semibold">{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Quilometragem:</span>
                      <span className="font-semibold">{vehicle.km.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Consumo Médio:</span>
                      <span className="font-semibold">{vehicle.avgConsumption} km/L</span>
                  </div>
              </div>
              
              <div className={`mt-4 p-3 rounded-lg ${maintenanceAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  <p className="font-bold text-sm">Próxima Manutenção:</p>
                  <p>{vehicle.nextMaintenanceKm.toLocaleString('pt-BR')} km</p>
                  {maintenanceAlert && <p className="text-xs font-bold mt-1">Faltam {kmToMaintenance.toLocaleString('pt-BR')} km! Agende a revisão.</p>}
              </div>
            </div>
            
            <div className="flex justify-end items-center mt-4 pt-4 border-t space-x-2">
                <button onClick={() => onEdit(vehicle)} className="p-2 text-gray-500 hover:text-brand-blue-600 hover:bg-gray-100 rounded-full transition-colors">
                    <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(vehicle.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors">
                    <Trash className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};