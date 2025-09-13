import React, { useState } from 'react';
import { X, Save, Plus, AlertCircle, FileText } from 'lucide-react';

interface MedicalRecordFormData {
  patientId: string;
  recordType: string;
  title: string;
  description: string;
  diagnosis?: string;
  symptoms?: string;
  medications?: string;
  labResults?: string;
  imagingResults?: string;
  notes?: string;
  visitDate: string;
  followUpRequired: boolean;
  followUpDate?: string;
  severity: 'low' | 'medium' | 'high';
  confidentialityLevel: 'public' | 'private' | 'restricted';
  shareableViaQR: boolean;
}

interface MedicalRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicalRecordFormData) => Promise<void>;
  patientInfo?: {
    id: string;
    name: string;
  };
  initialData?: Partial<MedicalRecordFormData>;
  isEditing?: boolean;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientInfo,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<MedicalRecordFormData>({
    patientId: patientInfo?.id || initialData?.patientId || '',
    recordType: initialData?.recordType || 'consultation',
    title: initialData?.title || '',
    description: initialData?.description || '',
    diagnosis: initialData?.diagnosis || '',
    symptoms: initialData?.symptoms || '',
    medications: initialData?.medications || '',
    labResults: initialData?.labResults || '',
    imagingResults: initialData?.imagingResults || '',
    notes: initialData?.notes || '',
    visitDate: initialData?.visitDate || new Date().toISOString().split('T')[0],
    followUpRequired: initialData?.followUpRequired || false,
    followUpDate: initialData?.followUpDate || '',
    severity: initialData?.severity || 'medium',
    confidentialityLevel: initialData?.confidentialityLevel || 'private',
    shareableViaQR: initialData?.shareableViaQR || true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const recordTypes = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'lab_report', label: 'Lab Report' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.visitDate) {
      newErrors.visitDate = 'Visit date is required';
    }
    if (formData.followUpRequired && !formData.followUpDate) {
      newErrors.followUpDate = 'Follow-up date is required when follow-up is needed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit medical record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              {isEditing ? <FileText className="w-5 h-5 text-green-600" /> : <Plus className="w-5 h-5 text-green-600" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Update Medical Record' : 'Add New Medical Record'}
              </h3>
              {patientInfo && (
                <p className="text-sm text-gray-600">Patient: {patientInfo.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Close form"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Record Type *
              </label>
              <select
                name="recordType"
                value={formData.recordType}
                onChange={handleInputChange}
                title="Select record type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                {recordTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity *
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                title="Select severity level"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Routine Checkup, Lab Results, Surgery Report"
              className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Detailed description of the medical record..."
              className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Medical Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                rows={3}
                placeholder="Primary and secondary diagnoses..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows={3}
                placeholder="Patient reported symptoms..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medications
            </label>
            <textarea
              name="medications"
              value={formData.medications}
              onChange={handleInputChange}
              rows={3}
              placeholder="Prescribed medications, dosages, and instructions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Results
              </label>
              <textarea
                name="labResults"
                value={formData.labResults}
                onChange={handleInputChange}
                rows={3}
                placeholder="Laboratory test results..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imaging Results
              </label>
              <textarea
                name="imagingResults"
                value={formData.imagingResults}
                onChange={handleInputChange}
                rows={3}
                placeholder="X-ray, MRI, CT scan results..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional medical notes and observations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Dates and Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visit Date *
              </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleInputChange}
                  title="Select visit date"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                    errors.visitDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              {errors.visitDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.visitDate}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  name="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>Follow-up Required</span>
              </label>
              {formData.followUpRequired && (
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleInputChange}
                  title="Select follow-up date"
                  placeholder="Follow-up date"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                    errors.followUpDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              )}
              {errors.followUpDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.followUpDate}
                </p>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidentiality Level
                </label>
                <select
                  name="confidentialityLevel"
                  value={formData.confidentialityLevel}
                  onChange={handleInputChange}
                  title="Select confidentiality level"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="shareableViaQR"
                    checked={formData.shareableViaQR}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>Allow QR Code Sharing</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Patient can share this record via QR code
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Record' : 'Save Record'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalRecordForm;
