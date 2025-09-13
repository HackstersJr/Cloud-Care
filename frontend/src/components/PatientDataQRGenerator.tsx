import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, X, Shield, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';

interface PatientDataQRGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QRGenerateResponse {
  token: string;
  qrCodeUrl: string;
  expiresAt: string;
  permissions: any;
  blockchainTxHash?: string;
}

const PatientDataQRGenerator: React.FC<PatientDataQRGeneratorProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrData, setQrData] = useState<QRGenerateResponse | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState({
    read: true,
    download: false,
    timeAccess: 'limited' as 'unlimited' | 'limited' | 'once'
  });
  const [purpose, setPurpose] = useState('MEDICAL_CONSULTATION');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [copySuccess, setCopySuccess] = useState(false);

  const generateQRCode = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const response = await apiClient.generateQRCode({
        recordIds: ['all'], // Default to all records
        shareType: 'summary',
        expiresInHours,
        facilityId: 'default' // Default facility for patient-generated QR
      });

      if (response.status === 'success' && response.data) {
        // Map the response to our local interface
        const mappedData: QRGenerateResponse = {
          token: response.data.shareToken,
          qrCodeUrl: response.data.qrCode || '',
          expiresAt: response.data.expiresAt,
          permissions: selectedPermissions,
          blockchainTxHash: response.data.blockchainHash
        };
        
        setQrData(mappedData);
        
        // Generate visual QR code from the token
        const qrCodeDataUrl = await QRCode.toDataURL(response.data.shareToken, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrCodeDataUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `health-qr-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToken = async () => {
    if (qrData?.token) {
      try {
        await navigator.clipboard.writeText(qrData.token);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy token:', error);
      }
    }
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl) return;
    
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'health-qr.png', { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Health QR Code',
          text: 'Share this QR code to provide access to my health data',
          files: [file]
        });
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Generate Health QR Code</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!qrData ? (
            // QR Generation Form
            <div className="space-y-6">
              {/* Purpose Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="MEDICAL_CONSULTATION">Medical Consultation</option>
                  <option value="EMERGENCY_ACCESS">Emergency Access</option>
                  <option value="HEALTH_CHECKUP">Health Checkup</option>
                  <option value="PRESCRIPTION_RENEWAL">Prescription Renewal</option>
                </select>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires in (hours)
                </label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value={1}>1 hour</option>
                  <option value={4}>4 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>1 week</option>
                </select>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.read}
                      onChange={(e) => setSelectedPermissions(prev => ({ ...prev, read: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Allow reading data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.download}
                      onChange={(e) => setSelectedPermissions(prev => ({ ...prev, download: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Allow downloading data</span>
                  </label>
                </div>
              </div>

              {/* Time Access */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Type
                </label>
                <select
                  value={selectedPermissions.timeAccess}
                  onChange={(e) => setSelectedPermissions(prev => ({ 
                    ...prev, 
                    timeAccess: e.target.value as 'unlimited' | 'limited' | 'once'
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="once">One-time access</option>
                  <option value="limited">Limited access</option>
                  <option value="unlimited">Unlimited access</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateQRCode}
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Generate Secure QR Code
                  </>
                )}
              </button>
            </div>
          ) : (
            // Generated QR Code Display
            <div className="space-y-6">
              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  {qrCodeUrl && (
                    <img 
                      src={qrCodeUrl} 
                      alt="Health QR Code" 
                      className="w-64 h-64 mx-auto"
                    />
                  )}
                </div>
              </div>

              {/* QR Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Token:</span>
                  <div className="flex items-center">
                    <span className="text-sm font-mono text-gray-900 mr-2">
                      {qrData.token.substring(0, 16)}...
                    </span>
                    <button
                      onClick={copyToken}
                      className="text-blue-600 hover:text-blue-700"
                      title="Copy token"
                    >
                      {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Expires:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(qrData.expiresAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Purpose:</span>
                  <span className="text-sm text-gray-900">{purpose.replace('_', ' ')}</span>
                </div>

                {qrData.blockchainTxHash && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Blockchain:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {qrData.blockchainTxHash.substring(0, 10)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={shareQRCode}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
              </div>

              {/* Generate New Button */}
              <button
                onClick={() => {
                  setQrData(null);
                  setQrCodeUrl('');
                }}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Generate New QR Code
              </button>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Security Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• QR code expires automatically</li>
                  <li>• Blockchain-secured consent management</li>
                  <li>• Access tracking and audit trail</li>
                  <li>• Revokable permissions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDataQRGenerator;
