import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  User, Heart, Activity, Moon, Zap, FileText, 
  Calendar, AlertCircle, ArrowLeft,
  Download, Share2, Clock
} from 'lucide-react';

interface PatientQRData {
  type: string;
  id: string;
  abha: string;
  name: string;
  dob: string;
  bg: string;
  records_count: number;
  latest_record: string;
  wearable?: {
    steps: number;
    hr: number;
    cal: number;
    sleep: number;
  };
  generated: string;
  expires: string;
  checksum: string;
  data_url?: string;
}

const PatientDataLanding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState<PatientQRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Get data from navigation state (from QR scanner)
      if (location.state?.qrData) {
        setQrData(location.state.qrData);
        setLoading(false);
        return;
      }

      // Get data from URL parameters (from QR code URL)
      const urlParams = new URLSearchParams(location.search);
      const dataParam = urlParams.get('data');
      
      if (dataParam) {
        const decodedData = JSON.parse(atob(dataParam));
        setQrData(decodedData);
        setLoading(false);
        return;
      }

      setError('No patient data found');
      setLoading(false);
    } catch (err) {
      console.error('Error parsing QR data:', err);
      setError('Invalid QR code data');
      setLoading(false);
    }
  }, [location]);

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error || !qrData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-6">{error || 'No patient data found'}</p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const expired = isExpired(qrData.expires);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Patient Health Data</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Expiry Warning */}
        {expired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">QR Code Expired</h3>
                <p className="text-sm text-red-700 mt-1">
                  This QR code expired on {formatTime(qrData.expires)}. Please request a new one from the patient.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{qrData.name}</h2>
                  <p className="text-sm text-gray-600">ABHA: {qrData.abha}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium">{formatDate(qrData.dob)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-gray-500 mr-2" />
                  <div>
                    <p className="text-xs text-gray-500">Blood Group</p>
                    <p className="text-sm font-medium">{qrData.bg}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Records Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {qrData.records_count} records
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Latest record: <span className="font-medium">{formatDate(qrData.latest_record)}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Full medical records require patient authorization to access
                </p>
              </div>
            </div>

            {/* Wearable Data */}
            {qrData.wearable && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <Activity className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Today's Wearable Data</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Steps</p>
                        <p className="text-lg font-bold text-blue-900">{qrData.wearable.steps.toLocaleString()}</p>
                      </div>
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-red-600 font-medium">Heart Rate</p>
                        <p className="text-lg font-bold text-red-900">{qrData.wearable.hr} bpm</p>
                      </div>
                      <Heart className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-orange-600 font-medium">Calories</p>
                        <p className="text-lg font-bold text-orange-900">{qrData.wearable.cal}</p>
                      </div>
                      <Zap className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-600 font-medium">Sleep</p>
                        <p className="text-lg font-bold text-purple-900">{qrData.wearable.sleep}h</p>
                      </div>
                      <Moon className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">QR Code Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Generated</p>
                  <p className="font-medium">{formatTime(qrData.generated)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Expires</p>
                  <p className={`font-medium ${expired ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatTime(qrData.expires)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Checksum</p>
                  <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{qrData.checksum}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button 
                  className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={expired}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Request Full Records
                </button>
                <button 
                  className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print Summary
                </button>
                <button 
                  className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Summary
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">🔒 Privacy Notice</h4>
              <p className="text-xs text-yellow-800">
                This QR code contains encrypted patient data. Access is logged and monitored. 
                Only use this data for authorized medical purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDataLanding;
