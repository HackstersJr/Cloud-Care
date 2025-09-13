import { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { QrCode, Upload, Share2, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api';
import QRScannerSimulator from '../QRScannerSimulator';
import PatientDataQRGenerator from '../PatientDataQRGenerator';
import QRCodeDemo from '../QRCodeDemo';

const PatientScanShare = () => {
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [qrHistory, setQrHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load QR history on component mount
  useEffect(() => {
    loadQRHistory();
  }, []);

  const loadQRHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getQRHistory();
      if (response.status === 'success' && response.data) {
        // API returns { data: { history: [...], pagination: {...} } }
        const historyData = response.data.history || [];
        setQrHistory(historyData.slice(0, 5)); // Show last 5 records
      }
    } catch (error) {
      console.error('Failed to load QR history:', error);
      // If it's a UUID error, it means we have an old token format
      if (error instanceof Error && error.message.includes('uuid')) {
        console.warn('Old token format detected, please re-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiClient.generateQRCode({
        recordIds: ['all'], // Default to all records
        shareType: 'summary',
        expiresInHours: 24,
        facilityId: 'default' // Default facility for patient-generated QR
      });
      
      if (response.status === 'success') {
        setShowQRGenerator(true);
        // Refresh history after generating new QR
        await loadQRHistory();
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Scan & Share">
      <div className="space-y-6">
        {/* Patient Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Scan Facility QR</h3>
            <p className="text-sm text-gray-600">Scan healthcare facility QR to share your ABHA details</p>
          </button>

          <button className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload QR</h3>
            <p className="text-sm text-gray-600">Upload facility QR code from gallery</p>
          </button>
        </div>

        {/* Share Your Health Data */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Share Your Health Data</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Share2 className="w-5 h-5 text-blue-600 mr-3" />
              <span className="text-sm font-medium">Share with healthcare provider</span>
            </button>
            
            <button 
              onClick={() => setShowQRGenerator(true)}
              disabled={loading}
              className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <QrCode className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-sm font-medium">
                {loading ? 'Generating QR code...' : 'Generate my complete health QR code'}
              </span>
            </button>
          </div>
        </div>

        {/* My QR Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">My QR Activity</h3>
              <History className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : qrHistory.length > 0 ? (
              qrHistory.map((record: any, index: number) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {record.purpose || 'Medical Consultation'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Generated: {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {record.status} • Accessed: {record.accessCount || 0} times
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-gray-900">
                      {record.token.substring(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-500">QR Token</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>No QR codes generated yet</p>
                <p className="text-xs text-gray-400 mt-1">Generate a QR code to share your health data with doctors</p>
              </div>
            )}
          </div>
        </div>

        {/* Demo Section for Testing */}
        <QRCodeDemo />

        {/* Patient Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">How to share your health data</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Generate your QR code for doctors to scan</li>
            <li>• Visit a healthcare facility and scan their facility QR</li>
            <li>• Upload QR codes from your gallery if needed</li>
            <li>• Control who can access your medical information</li>
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

export default PatientScanShare;
