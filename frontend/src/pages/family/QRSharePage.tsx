import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Share2, 
  Download, 
  Users, 
  Heart, 
  FileText, 
  Clock,
  Shield,
  Copy,
  CheckCircle
} from 'lucide-react';
import { 
  getFamilyGroups, 
  getFamilySharedRecords,
  apiClient 
} from '../../utils/api';

interface QRShareData {
  patientId: string;
  patientName: string;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  familyMembers: Array<{
    name: string;
    relationship: string;
    canAccess: boolean;
  }>;
  sharedRecords: Array<{
    id: string;
    type: string;
    title: string;
    shareLevel: string;
    sharedAt: string;
  }>;
  medicalAlerts: Array<{
    type: 'allergy' | 'medication' | 'condition';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  lastUpdated: string;
  accessToken?: string;
}

const QRSharePage: React.FC = () => {
  const [qrData, setQrData] = useState<QRShareData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [familyGroups, setFamilyGroups] = useState<any[]>([]);
  const [selectedShareLevel, setSelectedShareLevel] = useState<'emergency' | 'family' | 'full'>('family');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadFamilyData();
  }, []);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      
      // Load family groups
      const groupsResponse = await getFamilyGroups();
      const groups = Array.isArray(groupsResponse.data) 
        ? groupsResponse.data 
        : (groupsResponse.data as any)?.groups || [];
      setFamilyGroups(groups);
      
      // If we have family groups, load shared records for each
      if (groups.length > 0) {
        await generateQRData();
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading family data:', err);
      setError(err.message || 'Failed to load family data');
    } finally {
      setLoading(false);
    }
  };

  const generateQRData = async () => {
    try {
      // Get current user info (this would normally come from auth context)
      const user = { 
        id: 'current-user-id', 
        name: 'Current User',
        // This would be actual user data from authentication context
      };

      // Collect family members from all groups
      const familyMembers: any[] = [];
      const sharedRecords: any[] = [];
      
      for (const group of familyGroups) {
        // Add family members (this would need proper API endpoint)
        if (group.members) {
          familyMembers.push(...group.members.map((member: any) => ({
            name: `${member.patient?.firstName || ''} ${member.patient?.lastName || ''}`.trim(),
            relationship: member.relationship,
            canAccess: true
          })));
        }
        
        // Get shared records for this group
        try {
          const recordsResponse = await getFamilySharedRecords(group.id);
          if (recordsResponse.data) {
            sharedRecords.push(...recordsResponse.data.map((record: any) => ({
              id: record.id,
              type: record.record?.type || 'Medical Record',
              title: record.record?.title || 'Untitled Record',
              shareLevel: record.shareLevel,
              sharedAt: record.sharedAt
            })));
          }
        } catch (recordErr) {
          console.warn(`Failed to load records for group ${group.id}:`, recordErr);
        }
      }

      // Generate QR data based on share level
      const baseData: QRShareData = {
        patientId: user.id,
        patientName: user.name,
        emergencyContacts: [
          // This would come from user profile/emergency contacts
          {
            name: 'Emergency Contact',
            relationship: 'spouse',
            phone: '+1234567890',
            email: 'emergency@example.com'
          }
        ],
        familyMembers: familyMembers,
        sharedRecords: sharedRecords,
        medicalAlerts: [
          // This would come from medical records/alerts
          {
            type: 'allergy',
            description: 'Penicillin allergy',
            severity: 'high'
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      // Add access token for authenticated access
      if (selectedShareLevel === 'full') {
        baseData.accessToken = apiClient.getAccessToken() || undefined;
      }

      // Filter data based on share level
      let filteredData = { ...baseData };
      
      if (selectedShareLevel === 'emergency') {
        filteredData = {
          patientId: baseData.patientId,
          patientName: baseData.patientName,
          emergencyContacts: baseData.emergencyContacts,
          familyMembers: baseData.familyMembers.filter(member => 
            ['spouse', 'parent', 'guardian'].includes(member.relationship)
          ),
          sharedRecords: baseData.sharedRecords.filter(record => 
            record.shareLevel === 'emergency'
          ),
          medicalAlerts: baseData.medicalAlerts.filter(alert => 
            alert.severity === 'critical' || alert.severity === 'high'
          ),
          lastUpdated: baseData.lastUpdated
        };
      } else if (selectedShareLevel === 'family') {
        filteredData = {
          ...baseData,
          sharedRecords: baseData.sharedRecords.filter(record => 
            ['emergency', 'family', 'summary'].includes(record.shareLevel)
          )
        };
      }

      setQrData(filteredData);
      
      // Generate QR code
      const qrPayload = {
        type: 'cloudcare-patient-family',
        version: '1.0',
        shareLevel: selectedShareLevel,
        data: filteredData,
        timestamp: Date.now()
      };
      
      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
      
    } catch (err: any) {
      console.error('Error generating QR data:', err);
      setError(err.message || 'Failed to generate QR code');
    }
  };

  const handleShareLevelChange = (level: 'emergency' | 'family' | 'full') => {
    setSelectedShareLevel(level);
  };

  useEffect(() => {
    if (familyGroups.length > 0) {
      generateQRData();
    }
  }, [selectedShareLevel]);

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `cloudcare-qr-${selectedShareLevel}-${Date.now()}.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const copyQRData = async () => {
    if (qrData) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const getShareLevelInfo = (level: string) => {
    switch (level) {
      case 'emergency':
        return {
          title: 'Emergency Access',
          description: 'Critical medical information and emergency contacts only',
          color: 'red',
          icon: <Shield className="w-5 h-5" />
        };
      case 'family':
        return {
          title: 'Family Sharing',
          description: 'Medical information shared with family members',
          color: 'blue',
          icon: <Users className="w-5 h-5" />
        };
      case 'full':
        return {
          title: 'Full Access',
          description: 'Complete medical records with authentication',
          color: 'green',
          icon: <FileText className="w-5 h-5" />
        };
      default:
        return {
          title: 'Unknown',
          description: '',
          color: 'gray',
          icon: <QrCode className="w-5 h-5" />
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating QR code...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Family QR Code</h1>
          <p className="text-gray-600">Share your medical information and family details securely</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code</h2>
              
              {/* Share Level Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select sharing level:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['emergency', 'family', 'full'].map((level) => {
                    const info = getShareLevelInfo(level);
                    return (
                      <button
                        key={level}
                        onClick={() => handleShareLevelChange(level as any)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          selectedShareLevel === level
                            ? `border-${info.color}-500 bg-${info.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {info.icon}
                          <span className="text-xs font-medium">{info.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {getShareLevelInfo(selectedShareLevel).description}
                </p>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="mb-6">
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={copyQRData}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Data Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shared Information</h2>
            
            {qrData ? (
              <div className="space-y-6">
                {/* Patient Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Patient Information</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>Name:</strong> {qrData.patientName}</p>
                    <p><strong>ID:</strong> {qrData.patientId}</p>
                    <p className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4" />
                      Updated: {new Date(qrData.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Family Members */}
                {qrData.familyMembers.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Family Members ({qrData.familyMembers.length})
                    </h3>
                    <div className="space-y-2">
                      {qrData.familyMembers.slice(0, 3).map((member, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                            </div>
                            {member.canAccess && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Access Granted
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {qrData.familyMembers.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{qrData.familyMembers.length - 3} more members
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                {qrData.emergencyContacts.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Emergency Contacts
                    </h3>
                    <div className="space-y-2">
                      {qrData.emergencyContacts.map((contact, index) => (
                        <div key={index} className="bg-red-50 p-3 rounded-lg">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{contact.relationship}</p>
                          <p className="text-sm text-gray-600">{contact.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shared Records */}
                {qrData.sharedRecords.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Shared Records ({qrData.sharedRecords.length})
                    </h3>
                    <div className="space-y-2">
                      {qrData.sharedRecords.slice(0, 3).map((record, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{record.title}</p>
                              <p className="text-sm text-gray-600">{record.type}</p>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {record.shareLevel}
                            </span>
                          </div>
                        </div>
                      ))}
                      {qrData.sharedRecords.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{qrData.sharedRecords.length - 3} more records
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical Alerts */}
                {qrData.medicalAlerts.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Medical Alerts
                    </h3>
                    <div className="space-y-2">
                      {qrData.medicalAlerts.map((alert, index) => (
                        <div key={index} className={`p-3 rounded-lg ${
                          alert.severity === 'critical' ? 'bg-red-100' :
                          alert.severity === 'high' ? 'bg-orange-100' :
                          alert.severity === 'medium' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{alert.description}</p>
                              <p className="text-sm text-gray-600 capitalize">{alert.type}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                              alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Level Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Share Level: {selectedShareLevel.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {getShareLevelInfo(selectedShareLevel).description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Generate QR code to see shared information</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRSharePage;
