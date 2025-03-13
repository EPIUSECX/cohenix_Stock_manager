import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Barcode, BoxSelect as BoxSeam, Home, LogOut, Scale } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Stock Take', icon: Barcode, path: '/scanner' },
    { name: 'Stock Entry', icon: BoxSeam, path: '/stock-entry' },
    { name: 'Stock Balance', icon: Scale, path: '/stock-balance' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="https://cohenix.com/favicon2.png"
                alt="Cohenix"
                className="h-8 w-auto"
              />
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-gray-900">Cohenix</h1>
                <span className="text-xs text-gray-500">Warehouse Management</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-cohenix-600 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16 pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="grid grid-cols-4 h-16 max-w-7xl mx-auto">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`cohenix-nav-button ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}