import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileText, AlertCircle, Clock, Stethoscope, Plus, Edit, Trash2 } from 'lucide-react';
import MedicalRecordForm from './forms/MedicalRecordForm';
import AIInsights from './ai/AIInsights';
import { apiClient } from '../utils/api';

interface PatientRecord {
  id: string;
  title: string;
  recordType: string;
  visitDate: string;
  severity: string;
  description?: string;
  doctorName?: string;
  diagnosis?: string;
}

interface QRScanResult {
  patient: {
    id?: string;
    name: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
    email?: string;
  };
  records: PatientRecord[];
  shareType: string;
  accessCount: number;
  expiresAt?: string;
}

const PatientRecordsView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const qrData = location.state?.qrData as QRScanResult;
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [records, setRecords] = useState<PatientRecord[]>(qrData?.records || []);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PatientRecord | null>(null);

  const handleCreateMedicalRecord = async (formData: any) => {
    setIsLoading(true);
    try {
      const response = await apiClient.createMedicalRecord({
        ...formData,
        patientId: qrData.patient.id || formData.patientId
      });
      
      if (response.status === 'success' && response.data) {
        // Convert the medical record to PatientRecord format and add to the list
        const newRecord: PatientRecord = {
          id: response.data.id,
          title: response.data.title,
          recordType: response.data.recordType,
          visitDate: response.data.visitDate,
          severity: response.data.severity as 'low' | 'medium' | 'high',
          description: response.data.description,
          diagnosis: Array.isArray(response.data.diagnosis) ? response.data.diagnosis.join(', ') : response.data.diagnosis || undefined,
        };
        setRecords(prev => [newRecord, ...prev]);
        setShowMedicalRecordForm(false);
        // Show success message
        alert('Medical record created successfully!');
      } else {
        alert('Failed to create medical record: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error creating medical record:', error);
      alert('Error creating medical record: ' + (error.message || 'Network error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMedicalRecord = async (formData: any) => {
    if (!editingRecord) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.updateMedicalRecord(editingRecord.id, formData);
      
      if (response.status === 'success' && response.data) {
        // Update the record in the list
        const updatedRecord: PatientRecord = {
          id: response.data.id,
          title: response.data.title,
          recordType: response.data.recordType,
          visitDate: response.data.visitDate,
          severity: response.data.severity as 'low' | 'medium' | 'high',
          description: response.data.description,
          diagnosis: Array.isArray(response.data.diagnosis) ? response.data.diagnosis.join(', ') : response.data.diagnosis || undefined,
        };
        
        setRecords(prev => prev.map(record => 
          record.id === editingRecord.id ? updatedRecord : record
        ));
        
        setShowMedicalRecordForm(false);
        setEditingRecord(null);
        // Show success message
        alert('Medical record updated successfully!');
      } else {
        alert('Failed to update medical record: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error updating medical record:', error);
      alert('Error updating medical record: ' + (error.message || 'Network error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRecord = (record: PatientRecord) => {
    setEditingRecord(record);
    setShowMedicalRecordForm(true);
  };

  if (!qrData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Patient Data Found</h2>
          <p className="text-gray-600 mb-4">Please scan a valid QR code to view patient records.</p>
          <button
            onClick={() => navigate('/doctor-dashboard')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecordTypeIcon = (recordType: string) => {
    switch (recordType?.toLowerCase()) {
      case 'consultation':
        return <Stethoscope className="w-5 h-5" />;
      case 'lab_report':
        return <FileText className="w-5 h-5" />;
      case 'prescription':
        return <FileText className="w-5 h-5" />;
      case 'imaging':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/doctor-dashboard')}
                className="mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Back to Dashboard"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Patient Records</h1>
            </div>
            <div className="text-sm text-gray-500">
              Access Count: {qrData.accessCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Patient Information Card */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{qrData.patient.name}</h2>
                <p className="text-gray-600">Patient Information</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {qrData.patient.dateOfBirth && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(qrData.patient.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {qrData.patient.gender && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <p className="mt-1 text-sm text-gray-900">{qrData.patient.gender}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Share Type</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{qrData.shareType}</p>
              </div>
              {qrData.expiresAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Access Expires</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(qrData.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights Section */}
        <AIInsights 
          patientId={qrData.patient.id || ''}
          qrToken={location.state?.qrToken}
          patientData={{
            name: qrData.patient.name,
            age: qrData.patient.dateOfBirth ? 
              Math.floor((Date.now() - new Date(qrData.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
              undefined,
            gender: qrData.patient.gender
          }}
        />

        {/* Medical Records */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Medical Records ({records.length})
              </h3>
              <button
                onClick={() => setShowMedicalRecordForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Record
              </button>
            </div>
          </div>
          <div className="p-6">
            {records.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No medical records available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record, index) => (
                  <div
                    key={record.id || index}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                            {getRecordTypeIcon(record.recordType)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{record.title}</h4>
                            <p className="text-sm text-gray-600 capitalize">{record.recordType.replace('_', ' ')}</p>
                          </div>
                        </div>
                        
                        {record.description && (
                          <p className="text-sm text-gray-700 mb-2">{record.description}</p>
                        )}
                        
                        {record.diagnosis && (
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Diagnosis:</strong> {record.diagnosis}
                          </p>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{new Date(record.visitDate).toLocaleDateString()}</span>
                          {record.doctorName && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Dr. {record.doctorName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(record.severity)}`}>
                          {record.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Access Information */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-2" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">Access Information</p>
              <p className="text-yellow-700">
                This is a temporary access to patient records. The access will expire on{' '}
                {qrData.expiresAt ? new Date(qrData.expiresAt).toLocaleString() : 'the specified date'}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Record Form Modal */}
      <MedicalRecordForm
        isOpen={showMedicalRecordForm}
        onClose={() => {
          setShowMedicalRecordForm(false);
          setEditingRecord(null);
        }}
        onSubmit={editingRecord ? handleUpdateMedicalRecord : handleCreateMedicalRecord}
        patientInfo={{
          id: qrData.patient.id || '',
          name: qrData.patient.name
        }}
        initialData={editingRecord ? {
          patientId: qrData.patient.id || '',
          recordType: editingRecord.recordType,
          title: editingRecord.title,
          description: editingRecord.description,
          diagnosis: editingRecord.diagnosis,
          visitDate: editingRecord.visitDate,
          severity: editingRecord.severity as 'low' | 'medium' | 'high',
        } : undefined}
        isEditing={!!editingRecord}
      />
    </div>
  );
};

export default PatientRecordsView;
