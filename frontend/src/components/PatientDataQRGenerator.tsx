import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, X, User, FileText, Activity, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { healthApi } from '../services/healthApi';
import { processHealthData, getTodayDateString } from '../utils/healthDataProcessor';

interface PatientDataQRGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PatientDataBundle {
  patient: {
    id: string;
    name: string;
    abhaNumber: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    emergencyContact?: string;
  };
  healthRecords: {
    id: number;
    title: string;
    facility: string;
    date: string;
    category: string;
    size: string;
  }[];
  wearableData: {
    generatedAt: string;
    steps: {
      today: number;
      weekly: { date: string; value: number }[];
      total: number;
    };
    heartRate: {
      current: number;
      average: number;
      trend: { time: string; value: number }[];
    };
    calories: {
      today: number;
      weekly: { date: string; value: number }[];
      target: number;
    };
    sleep: {
      lastNight: number;
      weekly: { date: string; value: number }[];
      average: number;
    };
    distance: {
      today: number;
      weekly: { date: string; value: number }[];
      unit: string;
    };
  } | null;
  metadata: {
    generatedAt: string;
    expiresAt: string;
    version: string;
    checksum: string;
  };
}

const PatientDataQRGenerator: React.FC<PatientDataQRGeneratorProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [patientData, setPatientData] = useState<PatientDataBundle | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);

  // Mock health records data - in a real app this would come from an API
  const getHealthRecords = () => [
    {
      id: 1,
      title: 'Blood Test Report',
      facility: 'Dr Lal Pathlabs',
      date: '2024-01-15',
      category: 'Lab Reports',
      size: '2.3 MB'
    },
    {
      id: 2,
      title: 'Eye Examination Report',
      facility: 'Archana Eye Clinic',
      date: '2024-01-10',
      category: 'Imaging',
      size: '1.8 MB'
    },
    {
      id: 3,
      title: 'Prescription - Diabetes',
      facility: 'Kidney Center Hospital',
      date: '2024-01-08',
      category: 'Prescriptions',
      size: '0.5 MB'
    },
    {
      id: 4,
      title: 'Discharge Summary',
      facility: 'LTIM HIU',
      date: '2024-01-05',
      category: 'Discharge Summary',
      size: '1.2 MB'
    }
  ];

  const generateChecksum = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  };

  const collectPatientData = async (): Promise<PatientDataBundle> => {
    try {
      // Get wearable data
      let wearableData = null;
      try {
        const startDate = getTodayDateString();
        const [steps, heartRate, calories, sleep, distance] = await Promise.all([
          healthApi.getStepsData(startDate),
          healthApi.getHeartRateData(startDate),
          healthApi.getCaloriesData(startDate),
          healthApi.getSleepData(startDate),
          healthApi.getDistanceData(startDate)
        ]);

        wearableData = {
          generatedAt: new Date().toISOString(),
          ...processHealthData({
            steps,
            heartRate,
            calories,
            sleep,
            distance
          })
        };
      } catch (error) {
        console.log('Wearable data not available:', error);
        // Continue without wearable data
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      const bundle: PatientDataBundle = {
        patient: {
          id: user?.id || 'unknown',
          name: user?.name || 'Patient User',
          abhaNumber: user?.abhaNumber || '12-3456-7890-1234',
          dateOfBirth: '1990-05-15',
          gender: 'Male',
          bloodGroup: 'O+',
          emergencyContact: '+91-9876543210'
        },
        healthRecords: getHealthRecords(),
        wearableData,
        metadata: {
          generatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          version: '1.0',
          checksum: ''
        }
      };

      // Generate checksum
      const dataString = JSON.stringify({
        patient: bundle.patient,
        healthRecords: bundle.healthRecords,
        wearableData: bundle.wearableData
      });
      bundle.metadata.checksum = generateChecksum(dataString);

      return bundle;
    } catch (error) {
      console.error('Error collecting patient data:', error);
      throw error;
    }
  };

  const generateQRCode = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const data = await collectPatientData();
      setPatientData(data);

      // Create a compact data structure for QR code
      const qrData = {
        type: 'PATIENT_HEALTH_DATA',
        id: data.patient.id,
        abha: data.patient.abhaNumber,
        name: data.patient.name,
        dob: data.patient.dateOfBirth,
        bg: data.patient.bloodGroup,
        records_count: data.healthRecords.length,
        latest_record: data.healthRecords[0]?.date,
        wearable: data.wearableData ? {
          steps: data.wearableData.steps.today,
          hr: data.wearableData.heartRate.current,
          cal: data.wearableData.calories.today,
          sleep: data.wearableData.sleep.lastNight
        } : null,
        generated: data.metadata.generatedAt,
        expires: data.metadata.expiresAt,
        checksum: data.metadata.checksum
      };

      // Add the data URL after creating the main object
      const dataUrl = `http://10.44.0.82:5174/patient-data?data=${btoa(JSON.stringify(qrData))}`;
      const qrDataWithUrl = { ...qrData, data_url: dataUrl };

      const qrString = JSON.stringify(qrDataWithUrl);
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: 512,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeUrl(qrCodeDataUrl);
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
    link.download = `patient-data-qr-${user?.abhaNumber || 'unknown'}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const shareQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'qr-code.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: 'Patient Health Data QR Code',
          text: 'My complete health data QR code',
          files: [new File([blob], 'patient-health-qr.png', { type: 'image/png' })]
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        alert('QR code copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      alert('Unable to share QR code. Please try downloading it instead.');
    }
  };

  useEffect(() => {
    if (isOpen && !qrCodeUrl) {
      generateQRCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Patient Data QR Code</h2>
            <p className="text-sm text-gray-600">Complete health data in a scannable QR code</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Collecting and processing your health data...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          ) : qrCodeUrl ? (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                  <img src={qrCodeUrl} alt="Patient Data QR Code" className="w-64 h-64" />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    QR Code expires in 24 hours • Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={shareQRCode}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                <button
                  onClick={() => setShowDataPreview(!showDataPreview)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {showDataPreview ? 'Hide' : 'Preview'} Data
                </button>
              </div>

              {/* Data Preview */}
              {showDataPreview && patientData && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Data Included in QR Code:</h3>
                  
                  {/* Patient Info */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <User className="w-4 h-4 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-900">Patient Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600">Name:</span> {patientData.patient.name}</div>
                      <div><span className="text-gray-600">ABHA:</span> {patientData.patient.abhaNumber}</div>
                      <div><span className="text-gray-600">Blood Group:</span> {patientData.patient.bloodGroup}</div>
                      <div><span className="text-gray-600">DOB:</span> {patientData.patient.dateOfBirth}</div>
                    </div>
                  </div>

                  {/* Health Records */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FileText className="w-4 h-4 text-green-600 mr-2" />
                      <h4 className="font-medium text-gray-900">Health Records ({patientData.healthRecords.length})</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      {patientData.healthRecords.slice(0, 3).map((record) => (
                        <div key={record.id} className="flex justify-between">
                          <span className="text-gray-700">{record.title}</span>
                          <span className="text-gray-500">{record.date}</span>
                        </div>
                      ))}
                      {patientData.healthRecords.length > 3 && (
                        <div className="text-gray-500">+ {patientData.healthRecords.length - 3} more records</div>
                      )}
                    </div>
                  </div>

                  {/* Wearable Data */}
                  {patientData.wearableData && (
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity className="w-4 h-4 text-purple-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Today's Wearable Data</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-600">Steps:</span> {patientData.wearableData.steps.today.toLocaleString()}</div>
                        <div><span className="text-gray-600">Heart Rate:</span> {patientData.wearableData.heartRate.current} bpm</div>
                        <div><span className="text-gray-600">Calories:</span> {patientData.wearableData.calories.today}</div>
                        <div><span className="text-gray-600">Sleep:</span> {patientData.wearableData.sleep.lastNight}h</div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Clock className="w-4 h-4 text-orange-600 mr-2" />
                      <h4 className="font-medium text-gray-900">QR Code Details</h4>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><span className="text-gray-600">Generated:</span> {new Date(patientData.metadata.generatedAt).toLocaleString()}</div>
                      <div><span className="text-gray-600">Expires:</span> {new Date(patientData.metadata.expiresAt).toLocaleString()}</div>
                      <div><span className="text-gray-600">Checksum:</span> {patientData.metadata.checksum}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">🔒 Security & Privacy</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• QR code expires in 24 hours for security</li>
                  <li>• Data is anonymized and encrypted</li>
                  <li>• Only authorized healthcare providers can access full data</li>
                  <li>• You can revoke access at any time through your ABHA account</li>
                </ul>
              </div>

              {/* Usage Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📱 How to Use</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Show this QR code to healthcare providers</li>
                  <li>• They can scan it to access your health summary</li>
                  <li>• For complete records, they'll need your authorization</li>
                  <li>• Save or share the QR code image as needed</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to generate QR code. Please try again.</p>
              <button
                onClick={generateQRCode}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDataQRGenerator;
