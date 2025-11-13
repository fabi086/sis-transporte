
import React from 'react';
import type { User } from '../types';

interface HeaderProps {
  user: User;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="h-20 bg-white shadow-md flex items-center justify-end px-4 md:px-8">
      <div className="flex items-center">
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
