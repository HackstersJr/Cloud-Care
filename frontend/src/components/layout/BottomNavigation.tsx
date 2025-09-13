import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, QrCode, CheckSquare, Home, Users, Stethoscope } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Patient navigation items
  const patientNavItems = [
    { 
      path: '/dashboard', 
      icon: Home, 
      label: 'Dashboard',
      isActive: location.pathname === '/dashboard'
    },
    { 
      path: '/records', 
      icon: FileText, 
      label: 'My Records',
      isActive: location.pathname === '/records'
    },
    { 
      path: '/family', 
      icon: Users, 
      label: 'Family',
      isActive: location.pathname === '/family'
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

  // Doctor navigation items
  const doctorNavItems = [
    { 
      path: '/doctor-dashboard', 
      icon: Stethoscope, 
      label: 'Dashboard',
      isActive: location.pathname === '/doctor-dashboard'
    },
    { 
      path: '/patient-records', 
      icon: FileText, 
      label: 'Records',
      isActive: location.pathname === '/patient-records'
    },
    { 
      path: '/doctor-dashboard', 
      icon: QrCode, 
      label: 'QR Scanner',
      isActive: false // This will just scroll to QR section
    },
    { 
      path: '/patients', 
      icon: Users, 
      label: 'Patients',
      isActive: location.pathname === '/patients'
    }
  ];

  // Choose navigation items based on user role
  const navItems = user?.role === 'doctor' ? doctorNavItems : patientNavItems;

  const handleNavigation = (item: typeof navItems[0]) => {
    if (user?.role === 'doctor' && item.label === 'QR Scanner') {
      // For doctors, navigate to dashboard and scroll to QR section
      navigate('/doctor-dashboard');
      setTimeout(() => {
        const qrSection = document.getElementById('qr-scanner-section');
        if (qrSection) {
          qrSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.path + item.label}
              onClick={() => handleNavigation(item)}
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