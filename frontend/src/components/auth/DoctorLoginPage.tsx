import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, RefreshCw, Volume2 } from 'lucide-react';

interface DoctorLoginPageProps {
  onLogin: () => void;
  onBack: () => void;
  onAbhaLogin?: () => void;
}

const DoctorLoginPage = ({ onLogin, onBack, onAbhaLogin }: DoctorLoginPageProps) => {
  const [formData, setFormData] = useState({
    facilityId: '',
    password: '',
    captcha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState('Ax5=?');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (formData.facilityId && formData.password && formData.captcha) {
      onLogin();
    }
  };

  const refreshCaptcha = () => {
    // Generate a simple math captcha
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaText(`${num1}${operation}${num2}=?`);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img
                    src="https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop"
                    alt="National Health Authority"
                    className="w-8 h-8 rounded"
                  />
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">National Health</div>
                    <div className="text-gray-600">Authority</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Digital India</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors">
                Create ABHA Number
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex space-x-8">
              <a href="#" className="font-medium hover:text-blue-200 transition-colors">Home</a>
              <a href="#" className="hover:text-blue-200 transition-colors">About Us</a>
              <a href="#" className="hover:text-blue-200 transition-colors">Resource Center</a>
              <a href="#" className="hover:text-blue-200 transition-colors">Support</a>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <button 
                onClick={onAbhaLogin}
                className="flex items-center space-x-1 px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100 transition-colors"
              >
                <span>ABHA Login</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">
                <span>Doctor Login</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-blue-200 transition-colors">
                <span>Facility Login</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-120px)] py-12">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Doctor Login</h1>
            <p className="text-gray-600">Access your doctor dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Facility ID */}
            <div>
              <label htmlFor="facilityId" className="block text-sm font-medium text-gray-700 mb-2">
                Facility ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="facilityId"
                value={formData.facilityId}
                onChange={(e) => handleInputChange('facilityId', e.target.value)}
                placeholder="Enter facility Id"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div>
              <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                Captcha <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg font-mono text-lg font-bold text-gray-800 select-none">
                    {captchaText}
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Refresh captcha"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Audio captcha"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                id="captcha"
                value={formData.captcha}
                onChange={(e) => handleInputChange('captcha', e.target.value)}
                placeholder="Enter answer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Forgot your password?{' '}
              <button className="text-orange-600 hover:text-orange-700 font-medium">
                Reset here
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Address</strong></p>
                <p>National Health Authority 9th Floor, Tower</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Important Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-200">• Ayushman Bharat Digital Mission</a></li>
                <li><a href="#" className="hover:text-blue-200">• Ayushman Bharat Health</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Policies</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-200">• Terms and Conditions</a></li>
                <li><a href="#" className="hover:text-blue-200">• Website Policies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">ABHA App</h3>
              <div className="flex space-x-4">
                <div className="w-24 h-24 bg-white rounded-lg p-2">
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                    QR Code
                  </div>
                </div>
                <div className="w-24 h-24 bg-white rounded-lg p-2">
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                    QR Code
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DoctorLoginPage;
