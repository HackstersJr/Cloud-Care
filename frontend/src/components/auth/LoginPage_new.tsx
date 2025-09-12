import { useState } from 'react';
import { Smartphone, Mail, CreditCard, MapPin, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { InlineLoading } from '../LoadingComponents';

const LoginPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [formData, setFormData] = useState({ value: '', otp: '' });
  const [showOTP, setShowOTP] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const { loginABHA, sendOTP, verifyOTP, loading, error, clearError } = useAuth();
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
    },
    {
      id: 'email',
      title: 'Email Address',
      icon: Mail,
      color: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setShowOTP(false);
    setFormData({ value: '', otp: '' });
    clearError();
  };

  const handleSendOTP = async () => {
    if (!formData.value) return;
    
    try {
      setSendingOTP(true);
      clearError();
      
      const method = (selectedMethod === 'mobile' || selectedMethod === 'email') 
        ? selectedMethod as 'mobile' | 'email'
        : 'mobile'; // Default for ABHA methods
      
      const success = await sendOTP(method, formData.value);
      if (success) {
        setShowOTP(true);
      }
    } catch (err) {
      console.error('Failed to send OTP:', err);
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp) return;
    
    try {
      clearError();
      
      const method = (selectedMethod === 'mobile' || selectedMethod === 'email') 
        ? selectedMethod as 'mobile' | 'email'
        : 'mobile'; // Default for ABHA methods
      
      const verified = await verifyOTP(method, formData.value, formData.otp);
      
      if (verified) {
        // If OTP is verified, proceed with ABHA login
        const success = await loginABHA({
          method: selectedMethod as 'mobile' | 'abha-address' | 'abha-number' | 'email',
          value: formData.value,
          otp: formData.otp
        });
        
        if (success) {
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Failed to verify OTP or login:', err);
    }
  };

  const getPlaceholder = () => {
    switch (selectedMethod) {
      case 'mobile': return 'Enter mobile number (+91XXXXXXXXXX)';
      case 'abha-address': return 'Enter ABHA address (name@abha)';
      case 'abha-number': return 'Enter ABHA number (XX-XXXX-XXXX-XXXX)';
      case 'email': return 'Enter email address';
      default: return '';
    }
  };

  const getInputType = () => {
    switch (selectedMethod) {
      case 'mobile': return 'tel';
      case 'email': return 'email';
      default: return 'text';
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
            disabled={loading || sendingOTP}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
                <button
                  onClick={clearError}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}

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
                type={getInputType()}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={getPlaceholder()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || sendingOTP}
              />
            </div>

            {!showOTP ? (
              <button
                onClick={handleSendOTP}
                disabled={!formData.value || sendingOTP}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center"
              >
                {sendingOTP ? (
                  <InlineLoading text="Sending OTP..." size="sm" color="gray" />
                ) : (
                  'Send OTP'
                )}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                    maxLength={6}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    OTP sent to {formData.value}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleVerifyOTP}
                    disabled={formData.otp.length !== 6 || loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <InlineLoading text="Verifying..." size="sm" color="gray" />
                    ) : (
                      'Verify & Login'
                    )}
                  </button>

                  <button
                    onClick={handleSendOTP}
                    disabled={sendingOTP || loading}
                    className="w-full text-blue-600 py-2 px-4 text-sm font-medium hover:text-blue-700 transition-colors"
                  >
                    {sendingOTP ? 'Resending...' : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}

            <div className="text-center">
              <button
                onClick={() => handleMethodSelect('')}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                disabled={loading || sendingOTP}
              >
                Choose different method
              </button>
            </div>
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

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="text-center mb-8 mt-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Choose your login method</p>
        </div>

        <div className="space-y-4">
          {loginMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              disabled={loading}
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center`}>
                  <method.icon className={`w-6 h-6 ${method.iconColor}`} />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">{method.title}</h3>
                  <p className="text-sm text-gray-600">
                    {method.id === 'mobile' && 'Login with your mobile number'}
                    {method.id === 'abha-address' && 'Use your ABHA address'}
                    {method.id === 'abha-number' && 'Use your ABHA number'}
                    {method.id === 'email' && 'Login with your email address'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Secure access powered by{' '}
            <span className="font-medium text-blue-600">ABHA</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
