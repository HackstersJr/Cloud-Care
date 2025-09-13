import React, { useState, useEffect, useCallback } from 'react';
import Layout from './layout/Layout';
import { FileText, Download, Calendar, Filter, RefreshCw, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, MedicalRecord } from '../utils/api';

interface RecordWithCategory extends MedicalRecord {
  category: string;
  size: string;
}

const MyRecords = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [records, setRecords] = useState<RecordWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  const categories = ['All', 'Lab Reports', 'Prescriptions', 'Imaging', 'Discharge Summary', 'General'];
  
  // Map backend record types to display categories
  const mapRecordTypeToCategory = (recordType: string): string => {
    const mapping: { [key: string]: string } = {
      'lab_report': 'Lab Reports',
      'prescription': 'Prescriptions',
      'imaging': 'Imaging',
      'discharge_summary': 'Discharge Summary',
      'consultation': 'General',
      'general': 'General'
    };
    return mapping[recordType] || 'General';
  };

  // Calculate estimated file size based on record content
  const calculateEstimatedSize = (record: MedicalRecord): string => {
    let sizeKB = 50; // Base size
    if (record.description) sizeKB += Math.ceil(record.description.length / 100);
    if (record.diagnosis && Array.isArray(record.diagnosis)) {
      sizeKB += Math.ceil(record.diagnosis.join(' ').length / 100);
    }
    if (record.medications && Array.isArray(record.medications)) {
      sizeKB += Math.ceil(JSON.stringify(record.medications).length / 100);
    }
    if (record.attachments && record.attachments.length > 0) {
      sizeKB += record.attachments.reduce((total, att) => total + (att.fileSize / 1024), 0);
    }
    
    if (sizeKB > 1024) {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    }
    return `${Math.round(sizeKB)} KB`;
  };

  // Fetch medical records from backend
  const fetchMedicalRecords = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    // Only patients can view their own records via this component
    if (user.role !== 'patient') {
      setError('This view is only available for patients');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Get medical records for the current authenticated patient user
      const response = await apiClient.getMyMedicalRecords();
      
      if ((response as any).success && response.data) {
        // Check if user needs to complete patient profile
        if (response.data.length === 0 && (response as any).meta?.requiresPatientProfile) {
          setError('Please complete your patient profile to view medical records.');
          setRecords([]);
          setLastRefresh(new Date());
          return;
        }

        // Transform backend records to include category and size
        const transformedRecords: RecordWithCategory[] = response.data.map((record: MedicalRecord) => ({
          ...record,
          category: mapRecordTypeToCategory(record.recordType),
          size: calculateEstimatedSize(record)
        }));
        
        // Sort by visit date (most recent first)
        transformedRecords.sort((a, b) => 
          new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
        );
        
        setRecords(transformedRecords);
        setLastRefresh(new Date());
      } else {
        setError((response as any).message || 'Failed to fetch medical records');
        setRecords([]);
      }
    } catch (err: any) {
      console.error('Error fetching medical records:', err);
      setError(err.message || 'Unable to load medical records. Please try again.');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.role]);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMedicalRecords();
  };

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    fetchMedicalRecords();
    
    const intervalId = setInterval(() => {
      fetchMedicalRecords();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchMedicalRecords]);

  const filteredRecords = selectedCategory === 'All' 
    ? records 
    : records.filter(record => record.category === selectedCategory);

  // Get facility name from record (fallback to default)
  const getFacilityName = (record: RecordWithCategory): string => {
    return record.facilityName || 'Healthcare Provider';
  };

  // Verify record blockchain integrity
  const handleVerifyRecord = async (recordId: string) => {
    try {
      const response = await apiClient.verifyMedicalRecord(recordId);
      if (response.status === 'success') {
        // Update record verification status in state
        setRecords(prev => prev.map(record => 
          record.id === recordId 
            ? { ...record, isVerified: response.data?.isValid || false }
            : record
        ));
      }
    } catch (error) {
      console.error('Failed to verify record:', error);
    }
  };

  if (loading && records.length === 0) {
    return (
      <Layout title="My Records">
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading your medical records...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Records">
      <div className="space-y-6">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Health Records</h2>
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
              {refreshing && <span className="ml-2 text-blue-600">Refreshing...</span>}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Unable to load records</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => fetchMedicalRecords()}
              className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Stats Summary */}
        {records.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Blockchain Verified</p>
                <p className="text-2xl font-bold text-green-600">
                  {records.filter(r => r.blockchainHash).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Recent (30 days)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {records.filter(r => 
                    new Date(r.visitDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
              {category !== 'All' && (
                <span className="ml-1 text-xs opacity-75">
                  ({records.filter(r => r.category === category).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-900 mb-1">{record.title}</h3>
                      {record.blockchainHash && (
                        <div className="ml-2 flex items-center">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 ml-1">Blockchain Protected</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{getFacilityName(record)}</p>
                    {record.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{record.description}</p>
                    )}
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(record.visitDate).toLocaleDateString()}
                      </span>
                      <span>{record.size}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        record.confidentialityLevel === 'confidential' 
                          ? 'bg-red-100 text-red-800'
                          : record.confidentialityLevel === 'restricted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {record.category}
                      </span>
                      {record.isVerified && (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {record.blockchainHash && !record.isVerified && (
                    <button 
                      onClick={() => handleVerifyRecord(record.id)}
                      className="flex items-center text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Verify
                    </button>
                  )}
                  <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRecords.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error ? 'Unable to load records' : 'No records found'}
            </h3>
            <p className="text-gray-600">
              {error 
                ? 'Please check your connection and try again.'
                : selectedCategory === 'All' 
                  ? 'Your medical records will appear here once they are added by healthcare providers.'
                  : `No records match the selected category "${selectedCategory}".`
              }
            </p>
            {error && (
              <button 
                onClick={() => fetchMedicalRecords()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyRecords;