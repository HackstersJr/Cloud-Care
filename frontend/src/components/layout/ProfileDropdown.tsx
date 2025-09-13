import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-2 text-gray-600 hover:text-gray-900 transition-colors min-w-[48px] min-h-[48px] justify-center"
        title="Profile menu"
      >
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-1">
          <span className="text-blue-600 text-sm font-medium">
            {getUserInitials()}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email
                }
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>

            {/* Menu Items */}
            <button
              onClick={handleProfile}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 mr-3 flex-shrink-0" />
              Profile
            </button>

            <button
              onClick={handleSettings}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
              Settings
            </button>

            <hr className="my-1" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileDropdown;
