import { useState } from 'react';
import Layout from './layout/Layout';
import { QrCode, Upload, Share2, History } from 'lucide-react';
import QRScannerSimulator from './QRScannerSimulator';
import PatientDataQRGenerator from './PatientDataQRGenerator';
import QRCodeDemo from './QRCodeDemo';

const ScanShare = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  
  const recentShares = [
    { facility: 'Archana Eye Clinic', date: '2024-01-15', token: 'TKN123456' },
    { facility: 'Dr Lal Pathlabs', date: '2024-01-10', token: 'TKN789012' },
    { facility: 'Kidney Center Hospital', date: '2024-01-08', token: 'TKN345678' }
  ];

  return (
    <Layout title="Scan & Share">
      <div className="space-y-6">
        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-600">Scan facility QR to share ABHA details</p>
          </button>

          <button className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload QR</h3>
            <p className="text-sm text-gray-600">Upload QR code from gallery</p>
          </button>
        </div>

        {/* Share Options */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Share ABHA Details</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Share2 className="w-5 h-5 text-blue-600 mr-3" />
              <span className="text-sm font-medium">Share with healthcare provider</span>
            </button>
            <button 
              onClick={() => setShowQRGenerator(true)}
              className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <QrCode className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-sm font-medium">Generate my complete health QR code</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Shares</h3>
              <History className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="divide-y">
            {recentShares.map((share, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{share.facility}</p>
                  <p className="text-sm text-gray-600">{new Date(share.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-gray-900">{share.token}</p>
                  <p className="text-xs text-gray-500">Token ID</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Section for Testing */}
        <QRCodeDemo />

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">How to use Scan & Share</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Visit a healthcare facility</li>
            <li>• Scan their QR code or upload from gallery</li>
            <li>• Confirm sharing your ABHA details</li>
            <li>• Receive a token number for verification</li>
          </ul>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerSimulator 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
      />

      {/* Patient Data QR Generator Modal */}
      <PatientDataQRGenerator
        isOpen={showQRGenerator}
        onClose={() => setShowQRGenerator(false)}
      />
    </Layout>
  );
};

export default ScanShare;