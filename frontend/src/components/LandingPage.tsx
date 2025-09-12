import { Heart, Shield, Users, Activity, User, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../App';

interface LandingPageProps {
  onLogin: (userType: UserType) => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const navigate = useNavigate();

  const handleLoginClick = (type: UserType) => {
    if (type === 'abha') {
      // Navigate to the PWA login page for ABHA users
      navigate('/login');
    } else if (type === 'doctor') {
      // Handle doctor login directly
      onLogin(type);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <img
                  src="/symbol1.svg"
                  alt="National Health Authority"
                  className="h-10 w-auto"
                />
              </div>
              <div className="h-10 w-px bg-gray-300 mx-3"></div>
              <div className="flex items-center">
                <img
                  src="/symbol2.svg"
                  alt="ABDM Digital Mission"
                  className="h-9 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => handleLoginClick('abha')}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">ABHA Login</span>
                <span className="sm:hidden">Login</span>
              </button>
              <button
                onClick={() => handleLoginClick('doctor')}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Doctor Login</span>
                <span className="sm:hidden">Doctor</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center h-auto sm:h-14 py-2 sm:py-0">
            <div className="flex flex-wrap space-x-4 sm:space-x-8">
              <a href="#" className="font-medium hover:text-blue-200 transition-colors text-sm sm:text-base">Home</a>
              <a href="#" className="hover:text-blue-200 transition-colors text-sm sm:text-base">About Us</a>
              <a href="#" className="hover:text-blue-200 transition-colors text-sm sm:text-base">Resource Center</a>
              <a href="#" className="hover:text-blue-200 transition-colors text-sm sm:text-base">Support</a>
            </div>
            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <span>Generate ABHA</span>
              <span>Register Health Facility</span>
              <span>Healthcare Professionals Registry</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900 leading-tight">
              Create Ayushman Bharat Health Account - 
              <span className="text-orange-600"> ABHA Number</span>
            </h1>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-700">
              Creating India's Digital Health Mission
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              ABHA - Ayushman Bharat Health Account - Key to your digital healthcare journey.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleLoginClick('abha')}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors text-center"
              >
                Create ABHA Number
              </button>
              <div className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                Already have ABHA number? 
                <button
                  onClick={() => handleLoginClick('abha')}
                  className="text-orange-600 hover:text-orange-700 ml-1 font-medium"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
          <div className="relative order-1 lg:order-2">
            <div className="bg-gradient-to-br from-blue-100 to-orange-100 rounded-2xl p-4 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-orange-500/10"></div>
              <img
                src="/healthcare-illustration.svg"
                alt="Digital Healthcare"
                className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white p-2 sm:p-3 rounded-lg shadow-lg">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white p-2 sm:p-3 rounded-lg shadow-lg">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <section className="mt-8 sm:mt-16">
          <div className="bg-blue-600 text-white rounded-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-4">Benefits of ABHA Number</h2>
            <p className="text-center text-blue-100 mb-8 sm:mb-12 max-w-4xl mx-auto text-sm sm:text-base">
              ABHA number is a 14 digit number that will uniquely identify you as a participant in India's digital healthcare ecosystem. 
              ABHA number will establish a strong and trustable identity for you that will be accepted by healthcare providers across the country.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
                <Shield className="w-8 h-8 sm:w-12 sm:h-12 text-blue-200 mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Unique & Trustable Identity</h3>
                <p className="text-xs sm:text-sm text-blue-100">
                  Establish unique identity across different healthcare providers and health programs.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
                <Users className="w-8 h-8 sm:w-12 sm:h-12 text-blue-200 mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Unified Benefits</h3>
                <p className="text-xs sm:text-sm text-blue-100">
                  Link all healthcare benefits ranging from wellness, preventive and curative care.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
                <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-blue-200 mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Hassle-free Access</h3>
                <p className="text-xs sm:text-sm text-blue-100">
                  Avoid long lines for registration in hospitals and other healthcare facilities.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
                <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-blue-200 mx-auto mb-4" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Easy PHR Sign Up</h3>
                <p className="text-xs sm:text-sm text-blue-100">
                  Seamless sign up for PHR (Personal Health Records) applications.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}