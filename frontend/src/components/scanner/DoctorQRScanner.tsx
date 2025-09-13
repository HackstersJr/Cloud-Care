import React, { useState } from 'react';
import { X, Camera, FileText, AlertCircle } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface DoctorQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (token: string) => void;
}

const DoctorQRScanner: React.FC<DoctorQRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleScan = (result: string) => {
    if (result) {
      setError(null);
      onScan(result);
      onClose();
    }
  };

  const handleError = (err: unknown) => {
    console.error('QR Scanner error:', err);
    const error = err as Error;
    if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
      setError('Camera permission denied. Please enable camera access and try again.');
    } else if (error.name === 'NotFoundError' || error.message?.includes('camera')) {
      setError('No camera found. Please use manual input instead.');
      setScanMode('manual');
    } else {
      setError('Camera error occurred. Please try manual input.');
      setScanMode('manual');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Scan Patient QR Code</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Close scanner"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Mode Toggle */}
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setScanMode('camera')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'camera'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </button>
            <button
              onClick={() => setScanMode('manual')}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Manual
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Camera Scanner */}
          {scanMode === 'camera' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden bg-gray-100">
                <Scanner
                  onScan={(result) => {
                    if (result && result.length > 0) {
                      handleScan(result[0].rawValue);
                    }
                  }}
                  onError={handleError}
                  styles={{
                    container: { width: '100%', height: '300px' }
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Position the QR code within the camera frame
                </p>
                <button
                  onClick={() => setScanMode('manual')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Having trouble? Try manual input instead
                </button>
              </div>
            </div>
          )}

          {/* Manual Input */}
          {scanMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter QR Token
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste or type the QR token here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Scan Token
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('camera')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Use Camera
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorQRScanner;
