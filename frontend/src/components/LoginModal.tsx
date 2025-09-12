import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Stethoscope } from 'lucide-react';
import { UserType } from '../App';

interface LoginModalProps {
  type: UserType;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ type, onClose, onSuccess }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    captcha: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login success
    onSuccess();
  };

  const isDoctor = type === 'doctor';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            {isDoctor ? (
              <Stethoscope className="w-5 h-5 text-blue-600" />
            ) : (
              <User className="w-5 h-5 text-blue-600" />
            )}
            <h2 className="text-xl font-semibold">
              {isDoctor ? 'Doctor Login' : 'ABHA Login'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isDoctor ? 'Doctor ID' : 'ABHA Number'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder={isDoctor ? 'Enter doctor ID' : 'Enter ABHA number'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Captcha <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-3">
              <div className="bg-gray-100 border border-gray-300 rounded px-3 py-2 text-lg font-mono">
                5+2=?
              </div>
              <input
                type="text"
                value={formData.captcha}
                onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
                placeholder="Enter answer"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            Login
          </button>

          {!isDoctor && (
            <div className="text-center text-sm text-gray-600">
              Don't have ABHA number? 
              <a href="#" className="text-orange-600 hover:text-orange-700 ml-1 font-medium">
                Create now
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}