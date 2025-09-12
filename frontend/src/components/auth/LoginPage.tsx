import React, { useState } from 'react';
import { Smartphone, Mail, CreditCard, MapPin, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [formData, setFormData] = useState({ value: '', otp: '' });
  const [showOTP, setShowOTP] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleBackToLanding = () => {
    navigate('/');
  };

  const loginMethods = [
    {
      id: 'mobile',
      title: 'Mobile Number',
      icon: Smartphone,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      id: 'abha-address',
      title: 'ABHA Address',
      icon: MapPin,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'abha-number',
      title: 'ABHA Number',
      icon: CreditCard,
      color: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    }
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setShowOTP(false);
    setFormData({ value: '', otp: '' });
  };

  const handleSendOTP = () => {
    if (formData.value) {
      setShowOTP(true);
    }
  };

  const handleLogin = async () => {
    if (formData.otp) {
      await login({ method: selectedMethod, ...formData });
    }
  };

  const getPlaceholder = () => {
    switch (selectedMethod) {
      case 'mobile': return 'Enter mobile number';
      case 'abha-address': return 'Enter ABHA address';
      case 'abha-number': return 'Enter ABHA number';
      case 'email': return 'Enter email address';
      default: return '';
    }
  };

  if (selectedMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
          {/* Back Button */}
          <button
            onClick={handleBackToLanding}
            className="absolute top-4 left-4 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="text-center mb-8 mt-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ABHA Login</h1>
            <p className="text-gray-600">Secure healthcare access</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {loginMethods.find(m => m.id === selectedMethod)?.title}
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={getPlaceholder()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {!showOTP ? (
              <button
                onClick={handleSendOTP}
                disabled={!formData.value}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                Send OTP
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={formData.otp.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                >
                  Verify & Login
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedMethod('')}
              className="w-full text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Back to login methods
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
        {/* Back Button */}
        <button
          onClick={handleBackToLanding}
          className="absolute top-4 left-4 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="text-center mb-8 mt-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Choose your login method</p>
        </div>

        <div className="space-y-4 mb-8">
          {loginMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className={`w-12 h-12 rounded-full ${method.color} flex items-center justify-center mr-4`}>
                <method.icon className={`w-6 h-6 ${method.iconColor}`} />
              </div>
              <span className="font-medium text-gray-900">{method.title}</span>
            </button>
          ))}
        </div>

        <div className="border-t pt-6">
          <p className="text-sm text-gray-600 text-center mb-4">Other Login Method</p>
          <button
            onClick={() => handleMethodSelect('email')}
            className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <span className="font-medium text-gray-900">Email</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Don't have an ABHA number?</p>
          <button className="text-orange-600 font-medium hover:underline">Create now</button>
          
          <p className="text-sm text-gray-600 mt-4 mb-2">Don't have an ABHA address?</p>
          <button className="text-orange-600 font-medium hover:underline">Register</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;