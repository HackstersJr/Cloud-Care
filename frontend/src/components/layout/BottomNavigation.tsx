import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Link, QrCode, CheckSquare } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { 
      path: '/records', 
      icon: FileText, 
      label: 'My Records',
      isActive: location.pathname === '/records'
    },
    { 
      path: '/facilities', 
      icon: Link, 
      label: 'Linked Facilities',
      isActive: location.pathname === '/facilities'
    },
    { 
      path: '/scan', 
      icon: QrCode, 
      label: 'Scan & Share',
      isActive: location.pathname === '/scan'
    },
    { 
      path: '/consents', 
      icon: CheckSquare, 
      label: 'Consents',
      isActive: location.pathname === '/consents'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                item.isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 mb-1 ${
                item.isActive ? 'text-orange-600' : 'text-current'
              }`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;