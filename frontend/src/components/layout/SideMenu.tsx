import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Shield, Clock, Languages, Share2, HelpCircle, 
  FileText, Handshake, Settings, Info, MessageCircle, 
  LogOut, Smartphone, Home, Link, Users 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', action: () => { navigate('/dashboard'); onClose(); } },
    { icon: Link, label: 'Linked Facilities', action: () => { navigate('/facilities'); onClose(); } },
    { icon: Users, label: 'Family Health Network', action: () => { navigate('/family'); onClose(); } },
    { icon: Shield, label: 'Health locker', action: () => {} },
    { icon: Clock, label: 'Token history', action: () => {} },
    { icon: Languages, label: 'Language change', action: () => {} },
    { icon: Share2, label: 'Share app link', action: () => {} },
    { icon: HelpCircle, label: 'FAQ', action: () => {} },
    { icon: FileText, label: 'Privacy policy', action: () => {} },
    { icon: Handshake, label: 'Terms of use', action: () => {} },
    { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); onClose(); } },
    { icon: Smartphone, label: 'Wearables', action: () => { navigate('/wearables'); onClose(); } },
    { icon: Info, label: 'About us', action: () => {} },
    { icon: MessageCircle, label: 'Contact us', action: () => {} }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 transform transition-transform">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-lg mr-3"></div>
              <span className="font-semibold">Menu</span>
            </div>
            <button onClick={onClose} className="text-white" title="Close menu">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <item.icon className="w-5 h-5 text-gray-600 mr-4" />
                <span className="text-gray-900">{item.label}</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
          
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <LogOut className="w-5 h-5 text-red-600 mr-4" />
              <span className="text-gray-900">Logout</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SideMenu;