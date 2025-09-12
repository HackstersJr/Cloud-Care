import React, { useState } from 'react';
import Layout from './layout/Layout';
import { 
  Shield, Clock, Languages, Share2, HelpCircle, 
  FileText, Handshake, Settings as SettingsIcon, 
  Info, MessageCircle, LogOut, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();
  
  const menuItems = [
    { icon: Shield, label: 'Health locker', color: 'bg-blue-100 text-blue-600' },
    { icon: Clock, label: 'Token history', color: 'bg-orange-100 text-orange-600' },
    { icon: Languages, label: 'Language change', color: 'bg-green-100 text-green-600' },
    { icon: Share2, label: 'Share app link', color: 'bg-purple-100 text-purple-600' },
    { icon: HelpCircle, label: 'FAQ', color: 'bg-yellow-100 text-yellow-600' },
    { icon: FileText, label: 'Privacy policy', color: 'bg-indigo-100 text-indigo-600' },
    { icon: Handshake, label: 'Terms of use', color: 'bg-teal-100 text-teal-600' },
    { icon: SettingsIcon, label: 'Settings', color: 'bg-gray-100 text-gray-600' },
    { icon: Info, label: 'About us', color: 'bg-pink-100 text-pink-600' },
    { icon: MessageCircle, label: 'Contact us', color: 'bg-cyan-100 text-cyan-600' }
  ];

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <Layout title="Menu">
      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mr-4`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-900">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
        
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mr-4">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-900">Logout</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout from your ABHA account?</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Settings;