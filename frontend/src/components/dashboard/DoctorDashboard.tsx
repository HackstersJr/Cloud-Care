import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Stethoscope, QrCode, Search, Clock, AlertCircle, UserCheck, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api';
import DoctorQRScanner from '../scanner/DoctorQRScanner';
import Layout from '../layout/Layout';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrScanResult, setQrScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const doctorStats = [
    { label: 'Patients Today', value: '12', icon: Users, color: 'bg-blue-500' },
    { label: 'Scanned QRs', value: '8', icon: QrCode, color: 'bg-green-500' },
    { label: 'Pending Reviews', value: '5', icon: FileText, color: 'bg-orange-500' },
    { label: 'Consultations', value: '18', icon: Stethoscope, color: 'bg-purple-500' }
  ];

  const recentPatients = [
    { name: 'John Doe', time: '10:30 AM', status: 'Completed', id: '001' },
    { name: 'Jane Smith', time: '11:15 AM', status: 'In Progress', id: '002' },
    { name: 'Mike Johnson', time: '2:00 PM', status: 'Scheduled', id: '003' },
    { name: 'Sarah Wilson', time: '3:30 PM', status: 'Scheduled', id: '004' }
  ];

  const handleQRScan = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!scanInput.trim()) return;
    
    setIsScanning(true);
    setQrScanResult(null); // Clear previous results
    
    try {
      const response = await apiClient.accessViaQR(scanInput.trim(), {
        accessorId: user?.id || '',
        facilityId: user?.facilityId || 'default-facility',
        purpose: 'medical_consultation'
      });
      
      if (response && response.status === 'success' && response.data) {
        // Navigate to the patient records page with the data
        navigate('/patient-records', { 
          state: { qrData: response.data } 
        });
        setScanInput(''); // Clear input after successful scan
      } else {
        setQrScanResult({ error: response?.message || 'Failed to scan QR code' });
      }
    } catch (error: any) {
      console.error('QR scan error:', error);
      setQrScanResult({ error: error.message || 'Network error occurred' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQRScan();
    }
  };

  const handleQRScanFromModal = async (token: string) => {
    setIsScanning(true);
    
    try {
      const response = await apiClient.accessViaQR(token, {
        accessorId: user?.id || '',
        facilityId: user?.facilityId || 'default-facility',
        purpose: 'medical_consultation'
      });
      
      if (response && response.status === 'success' && response.data) {
        // Navigate to the patient records page with the data
        navigate('/patient-records', { 
          state: { qrData: response.data } 
        });
      } else {
        setQrScanResult({ error: response?.message || 'Failed to scan QR code' });
        // Show error in dashboard briefly
        setTimeout(() => {
          const resultsSection = document.getElementById('qr-scanner-section');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('QR scan error:', error);
      setQrScanResult({ error: error.message || 'Network error occurred' });
      // Show error in dashboard briefly
      setTimeout(() => {
        const resultsSection = document.getElementById('qr-scanner-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout title="Doctor Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, Dr. {user?.firstName || 'Doctor'}!</h2>
          <p className="text-green-100">Manage patient records and consultations securely.</p>
          <div className="mt-4 flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            <span className="text-sm">Facility Access: Active</span>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {doctorStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner Section */}
        <div id="qr-scanner-section" className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Patient QR Scanner
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={() => setShowQRScanner(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Camera className="w-4 h-4 mr-2" />
                Use Camera
              </button>
              <span className="text-gray-500">or</span>
              <span className="text-sm text-gray-600">paste token below</span>
            </div>
            <form onSubmit={handleQRScan} className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter QR token or scan QR code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <button
                  type="submit"
                  disabled={isScanning || !scanInput.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScanning ? 'Scanning...' : 'Scan'}
                </button>
              </div>
            </form>

            {qrScanResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                {qrScanResult.error ? (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{qrScanResult.error}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <UserCheck className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-medium text-gray-900">Patient Records Access</h4>
                    </div>
                    
                    {/* Patient Information */}
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-sm text-gray-700 mb-2">Patient Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>Name:</strong> {qrScanResult.patient?.name || 'Unknown'}</p>
                        <p><strong>DOB:</strong> {qrScanResult.patient?.dateOfBirth ? new Date(qrScanResult.patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Gender:</strong> {qrScanResult.patient?.gender || 'N/A'}</p>
                        <p><strong>Share Type:</strong> {qrScanResult.shareType || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Access Information */}
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-sm text-gray-700 mb-2">Access Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>Records Available:</strong> {qrScanResult.records?.length || 0}</p>
                        <p><strong>Access Count:</strong> {qrScanResult.accessCount || 0}</p>
                        <p><strong>Expires:</strong> {qrScanResult.expiresAt ? new Date(qrScanResult.expiresAt).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Records List */}
                    {qrScanResult.records && qrScanResult.records.length > 0 && (
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-sm text-gray-700 mb-2">Medical Records ({qrScanResult.records.length})</h5>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {qrScanResult.records.map((record: any, idx: number) => (
                            <div key={idx} className="text-xs bg-gray-50 p-2 rounded border flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">{record.title}</p>
                                <p className="text-gray-600">Type: {record.recordType} | Date: {new Date(record.visitDate).toLocaleDateString()}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.severity === 'high' ? 'bg-red-100 text-red-800' :
                                record.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {record.severity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Today's Schedule
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentPatients.map((patient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.time}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="font-medium text-gray-900">Patient Search</h4>
          <p className="text-sm text-gray-600 mt-1">Find patient records</p>
        </button>
        
        <button 
          onClick={() => setShowQRScanner(true)}
          className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <QrCode className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="font-medium text-gray-900">Scan Patient QR</h4>
          <p className="text-sm text-gray-600 mt-1">Use camera to scan QR codes</p>
        </button>
        
        <button className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <h4 className="font-medium text-gray-900">Medical Records</h4>
          <p className="text-sm text-gray-600 mt-1">View and manage records</p>
        </button>

        <button className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow text-left">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <Stethoscope className="w-5 h-5 text-orange-600" />
          </div>
          <h4 className="font-medium text-gray-900">Consultations</h4>
          <p className="text-sm text-gray-600 mt-1">Manage appointments</p>
        </button>
      </div>

      {/* QR Scanner Modal */}
      <DoctorQRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScanFromModal}
      />
      </div>
    </Layout>
  );
};

export default DoctorDashboard;
