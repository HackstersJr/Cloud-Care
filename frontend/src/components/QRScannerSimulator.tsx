import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';

interface QRScannerSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRScannerSimulator: React.FC<QRScannerSimulatorProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Sample facility QR codes for testing (these represent facility tokens)
  const sampleFacilityQRCodes = [
    {
      name: "Dr. Archana Eye Clinic",
      token: "FACILITY_TOKEN_001_EYE_CLINIC",
      data: {
        type: 'HEALTHCARE_FACILITY',
        facility_id: 'clinic_001',
        name: 'Dr. Archana Eye Clinic',
        address: '123 Health Street, Medical District',
        contact: '+91-9876543210',
        specialization: 'Ophthalmology',
        registration: 'REG2024001',
        verified: true
      }
    },
    {
      name: "Dr Lal PathLabs",
      token: "FACILITY_TOKEN_002_PATHLABS",
      data: {
        type: 'HEALTHCARE_FACILITY',
        facility_id: 'lab_002',
        name: 'Dr Lal PathLabs',
        address: '456 Lab Avenue, Diagnostic Center',
        contact: '+91-9876543211',
        specialization: 'Pathology & Diagnostics',
        registration: 'REG2024002',
        verified: true
      }
    },
    {
      name: "Kidney Center Hospital",
      token: "FACILITY_TOKEN_003_KIDNEY_CENTER",
      data: {
        type: 'HEALTHCARE_FACILITY',
        facility_id: 'hospital_003',
        name: 'Kidney Center Hospital',
        address: '789 Medical Plaza, Hospital District',
        contact: '+91-9876543212',
        specialization: 'Nephrology & Multi-specialty',
        registration: 'REG2024003',
        verified: true
      }
    }
  ];

  const validateQRToken = async (token: string) => {
    try {
      setIsScanning(true);
      setScanResult('Validating QR token...');
      
      const response = await apiClient.validateQRToken(token);
      
      if (response.status === 'success' && response.data) {
        setValidationResult(response.data);
        setScanResult('QR token validated successfully!');
        
        setTimeout(() => {
          onClose();
          navigate('/qr-access', { 
            state: { 
              validationResult: response.data,
              token: token
            } 
          });
        }, 1500);
      } else {
        setScanResult('Invalid or expired QR token');
        setValidationResult(null);
      }
    } catch (error) {
      console.error('QR validation error:', error);
      setScanResult('Failed to validate QR token');
      setValidationResult(null);
    } finally {
      setTimeout(() => setIsScanning(false), 1000);
    }
  };

  const simulateScan = async (facilityData: any) => {
    if (!user) {
      setScanResult('Please login to scan QR codes');
      return;
    }

    // For demo purposes, treat facility data as a QR token
    await validateQRToken(facilityData.token);
  };

  const handleTextInput = async () => {
    if (scanResult.trim()) {
      try {
        // First try to parse as JSON (legacy facility format)
        const facilityData = JSON.parse(scanResult);
        if (facilityData.type === 'HEALTHCARE_FACILITY') {
          // Convert to token format for validation
          await validateQRToken(`FACILITY_${facilityData.facility_id}`);
          return;
        }
      } catch (error) {
        // Not JSON, treat as raw token
        await validateQRToken(scanResult.trim());
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">QR Code Scanner</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          <div className="bg-gray-900 rounded-lg h-64 mb-4 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg"></div>
            <div className="text-center text-white">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Point camera at QR code</p>
            </div>
            
            {/* Scanning animation */}
            {isScanning && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-20 animate-pulse">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Sample Facility QR Codes for Testing */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">Demo Facility QR Codes (Click to Share Your Data)</span>
            </div>
            {sampleFacilityQRCodes.map((sample, index) => (
              <button
                key={index}
                onClick={() => simulateScan(sample.data)}
                className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-left hover:bg-blue-100 transition-colors"
                disabled={isScanning}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">{sample.name}</span>
                  <span className="text-xs text-blue-600">📍 Share with facility</span>
                </div>
              </button>
            ))}
          </div>

          {/* Manual Input Option */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-2">
              <Upload className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Or paste facility QR data manually</span>
            </div>
            <textarea
              value={scanResult}
              onChange={(e) => setScanResult(e.target.value)}
              placeholder="Paste healthcare facility QR code JSON data here..."
              className="w-full h-20 p-2 border border-gray-300 rounded text-xs"
              disabled={isScanning}
            />
            <button
              onClick={handleTextInput}
              disabled={!scanResult.trim() || isScanning}
              className="mt-2 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              Share My Data with Facility
            </button>
          </div>

          {/* Status */}
          {isScanning && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                <span className="text-sm text-green-800">{scanResult}</span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click on a demo facility QR code above to share your data</li>
              <li>• Or paste a healthcare facility QR code JSON data in the text area</li>
              <li>• The scanner will verify the facility and prepare to share your health data</li>
              <li>• You control what information is shared with each facility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerSimulator;
