import React from 'react';
import type { View, Plan } from '../types';
import { NAV_ITEMS } from '../constants';
import { LogOut, Truck } from './icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  userPlan: Plan;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, userPlan, isOpen, setIsOpen, onLogout }) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
      
      {/* Sidebar */}
      <div className={`
        bg-brand-blue-950 text-white flex flex-col 
        fixed inset-y-0 left-0 h-full z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        
        md:relative md:translate-x-0 md:w-20 lg:w-64 md:flex-shrink-0
      `}>
        <div className="flex items-center justify-center lg:justify-start lg:pl-6 h-20 border-b border-brand-blue-900 flex-shrink-0">
          <Truck className="h-8 w-8 text-white" />
          <h1 className="hidden lg:block ml-3 text-2xl font-bold">Reboque360</h1>
        </div>
        <nav className="flex-1 px-2 lg:px-4 py-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.view;
            const isDisabled = item.plan && !item.plan.includes(userPlan);

            return (
              <button
                key={item.view}
                onClick={() => !isDisabled && setCurrentView(item.view)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-brand-blue-700 text-white'
                    : 'text-gray-400 hover:bg-brand-blue-900 hover:text-white'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <item.icon className="h-6 w-6" />
                <span className="hidden lg:block ml-4">{item.label}</span>
                {isDisabled && <span className="hidden lg:block ml-auto text-xs bg-yellow-500 text-black rounded-full px-2 py-0.5">PRO</span>}
              </button>
            );
          })}
        </nav>
        <div className="px-2 lg:px-4 py-4 border-t border-brand-blue-900 flex-shrink-0">
           <button onClick={onLogout} className="w-full flex items-center justify-center lg:justify-start p-3 rounded-lg text-gray-400 hover:bg-brand-blue-900 hover:text-white transition-colors duration-200">
            <LogOut className="h-6 w-6" />
            <span className="hidden lg:block ml-4">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};