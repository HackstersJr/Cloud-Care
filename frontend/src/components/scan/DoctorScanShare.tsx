import { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import { QrCode, Users, Search, History, AlertCircle, FileText, Clock, CheckCircle, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api';
import QRScannerSimulator from '../QRScannerSimulator';
import QRCode from 'qrcode';

interface QRAccessRecord {
  id: string;
  patientName: string;
  shareToken: string;
  accessedAt: string;
  purpose: string;
  status: string;
  medicalRecords?: any[];
}

interface AvailableQRCode {
  token: string;
  shareType: string;
  expiresAt: string;
  accessCount: number;
  createdAt: string;
}

const DoctorScanShare = () => {
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [accessHistory, setAccessHistory] = useState<QRAccessRecord[]>([]);
  const [availableQRCodes, setAvailableQRCodes] = useState<AvailableQRCode[]>([]);
  const [doctorQRCode, setDoctorQRCode] = useState<string | null>(null);
  const [showDoctorQR, setShowDoctorQR] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Load access history on component mount
  useEffect(() => {
    loadAccessHistory();
  }, []);

  const loadAccessHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Use the regular QR history endpoint for now
      const response = await apiClient.getQRHistory();
      if (response.status === 'success' && response.data) {
        // Transform the data to match our interface
        const historyData = response.data.history || [];
        const transformedData = historyData.map((item: any) => ({
          id: item.token,
          patientName: 'Patient', // We'll need to get this from the patient data
          shareToken: item.token,
          accessedAt: item.created_at || item.createdAt,
          purpose: item.purpose || 'Medical Consultation',
          status: item.status
        }));
        setAccessHistory(transformedData.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to load access history:', error);
      // For now, set empty array if endpoint doesn't exist
      setAccessHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const clearScannedData = () => {
    setScannedData(null);
  };

  const generateDoctorQRCode = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Generate a facility QR code that patients can scan to share data with this doctor
      const facilityData = {
        type: 'HEALTHCARE_FACILITY',
        facility_id: user.id, // Use doctor's ID as facility ID
        name: `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim(),
        doctor_id: user.id,
        specialty: 'General Medicine', // Default specialty
        contact: user.email,
        purpose: 'MEDICAL_CONSULTATION'
      };
      
      // Create a QR code with the facility data
      const qrCodeData = JSON.stringify(facilityData);
      
      // Generate visual QR code using the qrcode library
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setDoctorQRCode(qrCodeDataUrl);
      setShowDoctorQR(true);
    } catch (error) {
      console.error('Failed to generate doctor QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Patient QR Scanner">
      <div className="space-y-6">
        {/* Doctor Scan Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setShowScanner(true)}
            disabled={loading}
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow text-center disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {loading ? 'Processing...' : 'Scan Patient QR Code'}
            </h3>
            <p className="text-sm text-gray-600">
              Scan patient-generated QR code to access their medical records
            </p>
          </button>

          <button 
            onClick={() => generateDoctorQRCode()}
            disabled={loading}
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow text-center disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Generate My QR Code</h3>
            <p className="text-sm text-gray-600">
              Generate QR code for patients to scan and share their data with you
            </p>
          </button>
        </div>

        {/* Scanned Patient Data Display */}
        {scannedData && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Patient Data Accessed</h3>
                  <p className="text-sm text-gray-600">Successfully retrieved medical records</p>
                </div>
              </div>
              <button 
                onClick={clearScannedData}
                className="text-gray-400 hover:text-gray-600"
                title="Clear scanned data"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {scannedData.patient?.name || 'N/A'}</p>
                <p><span className="font-medium">ABHA ID:</span> {scannedData.patient?.abhaId || 'N/A'}</p>
                <p><span className="font-medium">Date of Birth:</span> {scannedData.patient?.dateOfBirth ? new Date(scannedData.patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                <p><span className="font-medium">Gender:</span> {scannedData.patient?.gender || 'N/A'}</p>
              </div>
            </div>

            {scannedData.medicalRecords && scannedData.medicalRecords.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Medical Records ({scannedData.medicalRecords.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {scannedData.medicalRecords.map((record: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{record.type || 'Medical Record'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{record.description || record.diagnosis || 'No description available'}</p>
                      {record.doctor && (
                        <p className="text-xs text-gray-500 mt-1">
                          Dr. {record.doctor.name} - {record.doctor.specialty}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Doctor QR Code Display */}
        {showDoctorQR && doctorQRCode && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Your QR Code</h3>
                  <p className="text-sm text-gray-600">Show this to patients for data sharing</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDoctorQR(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Hide QR code"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <div className="mb-4">
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                  {/* Display the actual generated QR code */}
                  <div className="w-48 h-48 flex items-center justify-center mx-auto">
                    <img 
                      src={doctorQRCode} 
                      alt="Doctor QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Doctor:</span> Dr. {user?.firstName} {user?.lastName}</p>
                <p><span className="font-medium">Facility ID:</span> {user?.id}</p>
                <p><span className="font-medium">Purpose:</span> Medical Consultation</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How patients use this QR code:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Patient scans this QR code with their app</li>
                <li>• Patient confirms data sharing permissions</li>
                <li>• You receive access to their shared medical records</li>
                <li>• All interactions are logged for security</li>
              </ul>
            </div>
          </div>
        )}

        {/* Quick Actions for Doctors */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
              <Search className="w-4 h-4 text-blue-600 mr-2" />
              Search Patients
            </button>
            <button className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
              <FileText className="w-4 h-4 text-green-600 mr-2" />
              View All Records
            </button>
          </div>
        </div>

        {/* Doctor's QR Access History */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Patient QR Access</h3>
              <History className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : accessHistory.length > 0 ? (
              accessHistory.map((record, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.patientName || 'Anonymous Patient'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {record.purpose || 'Medical Consultation'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(record.accessedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accessed
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      {record.shareToken.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>No patient QR codes scanned yet</p>
                <p className="text-xs text-gray-400 mt-1">Scan patient QR codes to access their medical records</p>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Instructions */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">How to access patient records</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Ask patients to generate and show their QR code</li>
            <li>• Scan the patient's QR code using the scanner above</li>
            <li>• Review the medical records and patient information</li>
            <li>• All access is logged for security and audit purposes</li>
          </ul>
        </div>
      </div>

      {/* QR Scanner Modal - uses default behavior */}
      <QRScannerSimulator 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)}
      />
    </Layout>
  );
};

export default DoctorScanShare;
