
import React from 'react';
import type { User } from '../types';
import { Menu } from './icons';

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuClick }) => {
  return (
    <header className="h-20 bg-white shadow-md flex items-center justify-between px-4 md:px-8">
       <button onClick={onMenuClick} className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none">
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center ml-auto">
        <div className="text-right mr-4">
          <p className="font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.companyName}</p>
        </div>
        <img
          src={user.logo || 'https://picsum.photos/100'}
          alt="User Avatar"
          className="h-12 w-12 rounded-full object-cover"
        />
      </div>
    </header>
  );
};