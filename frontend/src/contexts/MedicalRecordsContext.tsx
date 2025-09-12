/**
 * CloudCare Medical Records Service
 * 
 * Provides medical records management with blockchain verification,
 * tamper detection, and comprehensive CRUD operations.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, MedicalRecord, BlockchainVerification } from '../utils/api';

interface MedicalRecordsContextType {
  records: MedicalRecord[];
  loading: boolean;
  error: string | null;
  currentRecord: MedicalRecord | null;
  verificationStatus: { [recordId: string]: BlockchainVerification };
  
  // CRUD Operations
  createRecord: (data: CreateRecordData) => Promise<MedicalRecord | null>;
  getRecord: (id: string) => Promise<MedicalRecord | null>;
  updateRecord: (id: string, data: Partial<MedicalRecord>) => Promise<MedicalRecord | null>;
  getPatientRecords: (patientId: string) => Promise<MedicalRecord[]>;
  
  // Blockchain Operations
  verifyRecord: (id: string) => Promise<BlockchainVerification | null>;
  verifyAllRecords: (recordIds: string[]) => Promise<void>;
  
  // Utility Methods
  refreshRecords: () => Promise<void>;
  clearError: () => void;
  setCurrentRecord: (record: MedicalRecord | null) => void;
}

interface CreateRecordData {
  patientId: string;
  title: string;
  description: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  visitDate: string;
  doctorId?: string;
  facilityName?: string;
  recordType: 'lab_report' | 'prescription' | 'imaging' | 'discharge_summary' | 'general';
  confidentialityLevel: 'normal' | 'restricted' | 'confidential';
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

interface MedicalRecordsStats {
  totalRecords: number;
  verifiedRecords: number;
  tamperedRecords: number;
  recentActivity: Array<{
    id: string;
    title: string;
    action: 'created' | 'updated' | 'verified' | 'tampered';
    timestamp: string;
  }>;
}

const MedicalRecordsContext = createContext<MedicalRecordsContextType | undefined>(undefined);

export function MedicalRecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] = useState<MedicalRecord | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{ [recordId: string]: BlockchainVerification }>({});

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Handle API errors consistently
   */
  const handleError = (error: unknown, defaultMessage: string) => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    setError(errorMessage);
    console.error(defaultMessage, error);
  };

  /**
   * Create new medical record with blockchain protection
   */
  const createRecord = async (data: CreateRecordData): Promise<MedicalRecord | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.createMedicalRecord(data);

      if (response.status === 'success' && response.data) {
        const newRecord = response.data;
        setRecords(prev => [newRecord, ...prev]);
        
        // Automatically verify the new record
        if (newRecord.blockchainHash) {
          setTimeout(() => verifyRecord(newRecord.id), 1000);
        }
        
        return newRecord;
      } else {
        setError(response.message || 'Failed to create medical record');
        return null;
      }
    } catch (error) {
      handleError(error, 'Failed to create medical record');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get medical record by ID
   */
  const getRecord = async (id: string): Promise<MedicalRecord | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getMedicalRecord(id);

      if (response.status === 'success' && response.data) {
        const record = response.data;
        setCurrentRecord(record);
        
        // Update records list if not already present
        setRecords(prev => {
          const exists = prev.find(r => r.id === record.id);
          if (!exists) {
            return [record, ...prev];
          }
          return prev.map(r => r.id === record.id ? record : r);
        });
        
        return record;
      } else {
        setError(response.message || 'Failed to fetch medical record');
        return null;
      }
    } catch (error) {
      handleError(error, 'Failed to fetch medical record');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update medical record (creates new blockchain hash)
   */
  const updateRecord = async (id: string, data: Partial<MedicalRecord>): Promise<MedicalRecord | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.updateMedicalRecord(id, data);

      if (response.status === 'success' && response.data) {
        const updatedRecord = response.data;
        
        setRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
        
        if (currentRecord?.id === id) {
          setCurrentRecord(updatedRecord);
        }
        
        // Clear previous verification status and verify updated record
        setVerificationStatus(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        
        if (updatedRecord.blockchainHash) {
          setTimeout(() => verifyRecord(id), 1000);
        }
        
        return updatedRecord;
      } else {
        setError(response.message || 'Failed to update medical record');
        return null;
      }
    } catch (error) {
      handleError(error, 'Failed to update medical record');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all medical records for a patient
   */
  const getPatientRecords = async (patientId: string): Promise<MedicalRecord[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getPatientMedicalRecords(patientId);

      if (response.status === 'success' && response.data) {
        const patientRecords = response.data;
        setRecords(patientRecords);
        return patientRecords;
      } else {
        setError(response.message || 'Failed to fetch patient records');
        return [];
      }
    } catch (error) {
      handleError(error, 'Failed to fetch patient records');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify medical record integrity on blockchain
   */
  const verifyRecord = async (id: string): Promise<BlockchainVerification | null> => {
    try {
      const response = await apiClient.verifyMedicalRecord(id);

      if (response.status === 'success' && response.data) {
        const verification = response.data;
        
        setVerificationStatus(prev => ({
          ...prev,
          [id]: verification
        }));
        
        // Update record verification status
        setRecords(prev => prev.map(record => 
          record.id === id 
            ? { ...record, isVerified: verification.isValid }
            : record
        ));
        
        if (currentRecord?.id === id) {
          setCurrentRecord(prev => prev ? { ...prev, isVerified: verification.isValid } : null);
        }
        
        return verification;
      } else {
        setError(response.message || 'Failed to verify medical record');
        return null;
      }
    } catch (error) {
      handleError(error, 'Failed to verify medical record');
      return null;
    }
  };

  /**
   * Verify multiple records in batch
   */
  const verifyAllRecords = async (recordIds: string[]): Promise<void> => {
    try {
      setLoading(true);
      
      const verificationPromises = recordIds.map(id => verifyRecord(id));
      await Promise.allSettled(verificationPromises);
      
    } catch (error) {
      handleError(error, 'Failed to verify records');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh records list
   */
  const refreshRecords = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // This would typically fetch current user's records
      // For now, we'll keep the existing records and just refresh verification status
      const recordIds = records.map(r => r.id);
      if (recordIds.length > 0) {
        await verifyAllRecords(recordIds);
      }
      
    } catch (error) {
      handleError(error, 'Failed to refresh records');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    records,
    loading,
    error,
    currentRecord,
    verificationStatus,
    createRecord,
    getRecord,
    updateRecord,
    getPatientRecords,
    verifyRecord,
    verifyAllRecords,
    refreshRecords,
    clearError,
    setCurrentRecord,
  };

  return (
    <MedicalRecordsContext.Provider value={value}>
      {children}
    </MedicalRecordsContext.Provider>
  );
}

export function useMedicalRecords() {
  const context = useContext(MedicalRecordsContext);
  if (context === undefined) {
    throw new Error('useMedicalRecords must be used within a MedicalRecordsProvider');
  }
  return context;
}

/**
 * Hook for medical records statistics and analytics
 */
export function useMedicalRecordsStats(): {
  stats: MedicalRecordsStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
} {
  const [stats, setStats] = useState<MedicalRecordsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { records, verificationStatus } = useMedicalRecords();

  const calculateStats = (): MedicalRecordsStats => {
    const totalRecords = records.length;
    const verifiedRecords = Object.values(verificationStatus).filter(v => v.isValid).length;
    const tamperedRecords = Object.values(verificationStatus).filter(v => v.tamperDetected).length;
    
    const recentActivity = records
      .slice(0, 10)
      .map(record => ({
        id: record.id,
        title: record.title,
        action: 'created' as const,
        timestamp: record.createdAt,
      }));

    return {
      totalRecords,
      verifiedRecords,
      tamperedRecords,
      recentActivity,
    };
  };

  const refreshStats = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const newStats = calculateStats();
      setStats(newStats);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate stats';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update stats when records or verification status changes
  useEffect(() => {
    if (records.length > 0) {
      const newStats = calculateStats();
      setStats(newStats);
    }
  }, [records, verificationStatus]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}

// Export types for use in components
export type { 
  MedicalRecord, 
  BlockchainVerification, 
  CreateRecordData, 
  MedicalRecordsStats 
};
