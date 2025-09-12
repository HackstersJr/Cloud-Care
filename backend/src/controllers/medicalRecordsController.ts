import { Request, Response } from 'express';
import { MedicalRecord } from '../models/types';
import { blockchainService } from '../services/blockchainService';
import { DatabaseService } from '../services/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export class MedicalRecordsController {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Create a new medical record with blockchain hash storage
   */
  async createMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        patientId,
        recordType,
        title,
        description,
        diagnosis,
        symptoms,
        medications,
        labResults,
        imagingResults,
        notes,
        visitDate,
        followUpRequired,
        followUpDate,
        severity,
        confidentialityLevel,
        shareableViaQR
      } = req.body;

      // Validate required fields
      if (!patientId || !recordType || !title || !description) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: patientId, recordType, title, description'
        });
        return;
      }

      // Check if user has permission to create records for this patient
      const canAccess = await this.checkPatientAccess(req.user!.id, patientId, req.user!.role);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Cannot create medical records for this patient'
        });
        return;
      }

      // Create medical record object
      const recordId = uuidv4();
      const now = new Date();
      
      const medicalRecord: MedicalRecord = {
        id: recordId,
        patientId,
        doctorId: req.user!.role === 'doctor' ? req.user!.id : undefined,
        recordType,
        title,
        description,
        diagnosis: diagnosis || [],
        symptoms: symptoms || [],
        medications: medications || [],
        labResults: labResults || [],
        imagingResults: imagingResults || [],
        notes,
        visitDate: new Date(visitDate),
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        severity: severity || 'medium',
        status: 'active',
        confidentialityLevel: confidentialityLevel || 'restricted',
        shareableViaQR: shareableViaQR || false,
        qrExpiresAt: shareableViaQR ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined, // 24 hours
        createdAt: now,
        updatedAt: now,
        isActive: true
      };

      // Generate blockchain hash for the medical record
      logger.info(`Generating blockchain hash for medical record ${recordId}`);
      const dataHash = blockchainService.generateDataHash({
        recordId: medicalRecord.id,
        patientId: medicalRecord.patientId,
        recordType: medicalRecord.recordType,
        title: medicalRecord.title,
        description: medicalRecord.description,
        diagnosis: medicalRecord.diagnosis,
        symptoms: medicalRecord.symptoms,
        medications: medicalRecord.medications,
        labResults: medicalRecord.labResults,
        imagingResults: medicalRecord.imagingResults,
        notes: medicalRecord.notes,
        visitDate: medicalRecord.visitDate,
        createdAt: medicalRecord.createdAt
      });

      try {
        // Store hash on blockchain for data integrity
        logger.info(`Storing medical record hash on blockchain for record ${recordId}`);
        const blockchainResult = await blockchainService.storeMedicalRecordHash(
          patientId,
          recordId,
          dataHash
        );

        medicalRecord.blockchainHash = blockchainResult.transactionHash;
        
        logger.info(`Medical record ${recordId} hash stored on blockchain: ${blockchainResult.transactionHash}`);
      } catch (blockchainError) {
        logger.warn(`Failed to store medical record ${recordId} on blockchain:`, blockchainError);
        // Continue without blockchain storage - log the issue but don't fail the entire operation
        medicalRecord.blockchainHash = undefined;
      }

      // Save to database
      const savedRecord = await this.db.createMedicalRecord(medicalRecord);

      logger.info(`Medical record created successfully: ${recordId}`, {
        patientId,
        recordType,
        blockchainHash: medicalRecord.blockchainHash,
        userId: req.user!.id
      });

      res.status(201).json({
        success: true,
        message: 'Medical record created successfully',
        data: {
          record: savedRecord,
          blockchainVerified: !!medicalRecord.blockchainHash,
          dataIntegrityHash: dataHash
        }
      });

    } catch (error) {
      logger.error('Failed to create medical record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create medical record',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get medical record by ID with blockchain verification
   */
  async getMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Medical record ID is required'
        });
        return;
      }

      const record = await this.db.getMedicalRecord(id);
      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
        return;
      }

      // Check access permissions
      const canAccess = await this.checkPatientAccess(req.user!.id, record.patientId, req.user!.role);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Cannot view this medical record'
        });
        return;
      }

      // Verify blockchain integrity if hash exists
      let blockchainVerified = false;
      let integrityStatus = 'unknown';

      if (record.blockchainHash) {
        try {
          // Generate current hash of the record
          const currentHash = blockchainService.generateDataHash({
            recordId: record.id,
            patientId: record.patientId,
            recordType: record.recordType,
            title: record.title,
            description: record.description,
            diagnosis: record.diagnosis,
            symptoms: record.symptoms,
            medications: record.medications,
            labResults: record.labResults,
            imagingResults: record.imagingResults,
            notes: record.notes,
            visitDate: record.visitDate,
            createdAt: record.createdAt
          });

          // Verify against blockchain
          const blockchainRecord = await blockchainService.verifyMedicalRecordHash(record.blockchainHash);
          
          if (blockchainRecord && blockchainRecord.hash === currentHash) {
            blockchainVerified = true;
            integrityStatus = 'verified';
          } else {
            integrityStatus = 'tampered';
            logger.warn(`Medical record ${id} integrity verification failed`, {
              currentHash,
              blockchainHash: blockchainRecord?.hash,
              blockchainTransaction: record.blockchainHash
            });
          }
        } catch (verificationError) {
          logger.error(`Failed to verify medical record ${id} on blockchain:`, verificationError);
          integrityStatus = 'verification_failed';
        }
      }

      res.json({
        success: true,
        data: {
          record,
          integrity: {
            blockchainVerified,
            status: integrityStatus,
            blockchainHash: record.blockchainHash
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get medical record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve medical record'
      });
    }
  }

  /**
   * Update medical record with new blockchain hash
   */
  async updateMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Medical record ID is required'
        });
        return;
      }

      const existingRecord = await this.db.getMedicalRecord(id);
      if (!existingRecord) {
        res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
        return;
      }

      // Check access permissions
      const canAccess = await this.checkPatientAccess(req.user!.id, existingRecord.patientId, req.user!.role);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Cannot update this medical record'
        });
        return;
      }

      // Update the record
      const updatedRecord = {
        ...existingRecord,
        ...updateData,
        updatedAt: new Date()
      };

      // Generate new blockchain hash for updated data
      const newDataHash = blockchainService.generateDataHash({
        recordId: updatedRecord.id,
        patientId: updatedRecord.patientId,
        recordType: updatedRecord.recordType,
        title: updatedRecord.title,
        description: updatedRecord.description,
        diagnosis: updatedRecord.diagnosis,
        symptoms: updatedRecord.symptoms,
        medications: updatedRecord.medications,
        labResults: updatedRecord.labResults,
        imagingResults: updatedRecord.imagingResults,
        notes: updatedRecord.notes,
        visitDate: updatedRecord.visitDate,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt
      });

      try {
        // Store new hash on blockchain
        const blockchainResult = await blockchainService.storeMedicalRecordHash(
          updatedRecord.patientId,
          `${updatedRecord.id}-updated-${Date.now()}`,
          newDataHash
        );

        updatedRecord.blockchainHash = blockchainResult.transactionHash;
        
        logger.info(`Updated medical record ${id} hash stored on blockchain: ${blockchainResult.transactionHash}`);
      } catch (blockchainError) {
        logger.warn(`Failed to store updated medical record ${id} on blockchain:`, blockchainError);
      }

      // Save updated record
      const savedRecord = await this.db.updateMedicalRecord(id, updatedRecord);

      logger.info(`Medical record updated successfully: ${id}`, {
        userId: req.user!.id,
        blockchainHash: updatedRecord.blockchainHash
      });

      res.json({
        success: true,
        message: 'Medical record updated successfully',
        data: {
          record: savedRecord,
          blockchainVerified: !!updatedRecord.blockchainHash,
          newDataIntegrityHash: newDataHash
        }
      });

    } catch (error) {
      logger.error('Failed to update medical record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update medical record'
      });
    }
  }

  /**
   * Get all medical records for a patient
   */
  async getPatientMedicalRecords(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 20, recordType, severity, status } = req.query;

      if (!patientId) {
        res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
        return;
      }

      // Check access permissions
      const canAccess = await this.checkPatientAccess(req.user!.id, patientId, req.user!.role);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Cannot view medical records for this patient'
        });
        return;
      }

      const filters = {
        recordType: recordType as string,
        severity: severity as string,
        status: status as string
      };

      const records = await this.db.getMedicalRecordsByPatient(
        patientId,
        Number(page),
        Number(limit),
        filters
      );

      // Add blockchain verification status for each record
      const recordsWithVerification = await Promise.all(
        records.map(async (record) => {
          let integrityStatus = 'unknown';
          
          if (record.blockchainHash) {
            try {
              const currentHash = blockchainService.generateDataHash({
                recordId: record.id,
                patientId: record.patientId,
                recordType: record.recordType,
                title: record.title,
                description: record.description,
                diagnosis: record.diagnosis,
                symptoms: record.symptoms,
                medications: record.medications,
                labResults: record.labResults,
                imagingResults: record.imagingResults,
                notes: record.notes,
                visitDate: record.visitDate,
                createdAt: record.createdAt
              });

              const blockchainRecord = await blockchainService.verifyMedicalRecordHash(record.blockchainHash);
              integrityStatus = (blockchainRecord && blockchainRecord.hash === currentHash) ? 'verified' : 'tampered';
            } catch {
              integrityStatus = 'verification_failed';
            }
          }

          return {
            ...record,
            integrityStatus,
            blockchainVerified: integrityStatus === 'verified'
          };
        })
      );

      res.json({
        success: true,
        data: {
          records: recordsWithVerification,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: records.length
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get patient medical records:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient medical records'
      });
    }
  }

  /**
   * Verify record integrity using blockchain
   */
  async verifyRecordIntegrity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Medical record ID is required'
        });
        return;
      }

      const record = await this.db.getMedicalRecord(id);
      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Medical record not found'
        });
        return;
      }

      // Check access permissions
      const canAccess = await this.checkPatientAccess(req.user!.id, record.patientId, req.user!.role);
      if (!canAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Cannot verify this medical record'
        });
        return;
      }

      if (!record.blockchainHash) {
        res.json({
          success: true,
          data: {
            verified: false,
            status: 'no_blockchain_hash',
            message: 'This record was not stored on blockchain'
          }
        });
        return;
      }

      // Generate current hash and compare with blockchain
      const currentHash = blockchainService.generateDataHash({
        recordId: record.id,
        patientId: record.patientId,
        recordType: record.recordType,
        title: record.title,
        description: record.description,
        diagnosis: record.diagnosis,
        symptoms: record.symptoms,
        medications: record.medications,
        labResults: record.labResults,
        imagingResults: record.imagingResults,
        notes: record.notes,
        visitDate: record.visitDate,
        createdAt: record.createdAt
      });

      const blockchainRecord = await blockchainService.verifyMedicalRecordHash(record.blockchainHash);
      
      if (!blockchainRecord) {
        res.json({
          success: true,
          data: {
            verified: false,
            status: 'blockchain_not_found',
            message: 'Record not found on blockchain',
            transactionHash: record.blockchainHash
          }
        });
        return;
      }

      const isVerified = blockchainRecord.hash === currentHash;

      res.json({
        success: true,
        data: {
          verified: isVerified,
          status: isVerified ? 'verified' : 'tampered',
          message: isVerified 
            ? 'Record integrity verified - no tampering detected'
            : 'Record integrity compromised - data may have been tampered with',
          details: {
            transactionHash: record.blockchainHash,
            currentHash,
            blockchainHash: blockchainRecord.hash,
            blockchainTimestamp: blockchainRecord.timestamp,
            explorerUrl: `https://amoy.polygonscan.com/tx/${record.blockchainHash}`
          }
        }
      });

    } catch (error) {
      logger.error('Failed to verify record integrity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify record integrity'
      });
    }
  }

  /**
   * Check if user has access to patient's medical records
   */
  private async checkPatientAccess(userId: string, patientId: string, userRole: string): Promise<boolean> {
    try {
      switch (userRole) {
        case 'admin':
          return true; // Admins have access to all records
        
        case 'doctor':
        case 'nurse':
          // Healthcare providers need to be authorized for this patient
          // This would typically check if they have an active care relationship
          return await this.db.checkHealthcareProviderAccess(userId, patientId);
        
        case 'patient':
          // Patients can only access their own records
          const patient = await this.db.getPatientByUserId(userId);
          return patient?.id === patientId;
        
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error checking patient access:', error);
      return false;
    }
  }
}

export const medicalRecordsController = new MedicalRecordsController();
