import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ExternalLink } from 'lucide-react';

// Demo component to test QR code functionality
const QRCodeDemo: React.FC = () => {
  const navigate = useNavigate();

  // Sample QR data for testing
  const sampleQRData = {
    type: 'PATIENT_HEALTH_DATA',
    id: 'patient123',
    abha: '12-3456-7890-1234',
    name: 'John Smith',
    dob: '1990-05-15',
    bg: 'O+',
    records_count: 4,
    latest_record: '2024-01-15',
    wearable: {
      steps: 8547,
      hr: 72,
      cal: 1845,
      sleep: 7.5
    },
    generated: new Date().toISOString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    checksum: 'abc123def456'
  };

  const handleTestQRCode = () => {
    navigate('/patient-data', { 
      state: { qrData: sampleQRData } 
    });
  };

  const handleTestQRUrl = () => {
    const encodedData = btoa(JSON.stringify(sampleQRData));
    window.open(`/patient-data?data=${encodedData}`, '_blank');
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-2">
        <QrCode className="w-5 h-5 text-yellow-600 mr-2" />
        <h3 className="font-medium text-yellow-900">QR Code Demo</h3>
      </div>
      <p className="text-sm text-yellow-800 mb-3">
        Test the QR code functionality with sample patient data:
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleTestQRCode}
          className="flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
        >
          <QrCode className="w-4 h-4 mr-1" />
          Test QR Data View
        </button>
        <button
          onClick={handleTestQRUrl}
          className="flex items-center justify-center px-3 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-sm hover:bg-yellow-200 transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Test QR URL
        </button>
      </div>
    </div>
  );
};

export default QRCodeDemo;
