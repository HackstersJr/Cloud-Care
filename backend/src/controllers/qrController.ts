import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '../services/prisma';
import { logger } from '../utils/logger';
import { aiInsightsService, AIInsightRequest } from '../services/aiInsightsService';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class QRController {
  /**
   * Generate QR code for sharing medical records with consent
   * POST /qr/generate
   */
  async generateQRCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { recordIds, facilityId, expiresInHours = 24, shareType = 'full' } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User authentication required'
        });
        return;
      }

      if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'Record IDs are required'
        });
        return;
      }

      // First, find the patient record for this user
      const patient = await prisma.patient.findUnique({
        where: { userId: userId }
      });

      if (!patient) {
        res.status(404).json({
          status: 'error',
          message: 'Patient profile not found for user'
        });
        return;
      }

      // Handle "all" records case
      let actualRecordIds = recordIds;
      if (recordIds.length === 1 && recordIds[0] === 'all') {
        // Get all records for the patient
        const allRecords = await prisma.medicalRecord.findMany({
          where: { patientId: patient.id },
          select: { id: true }
        });
        actualRecordIds = allRecords.map((record: { id: string }) => record.id);
        
        if (actualRecordIds.length === 0) {
          res.status(404).json({
            status: 'error',
            message: 'No medical records found for user'
          });
          return;
        }
      }

      // Verify user owns all records (through their patient profile)
      const records = await prisma.medicalRecord.findMany({
        where: {
          id: { in: actualRecordIds },
          patientId: patient.id
        }
      });

      if (records.length !== actualRecordIds.length) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied to one or more records'
        });
        return;
      }

      // Generate unique share token
      const shareToken = uuidv4();
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      // Create QR share data
      const qrData = {
        token: shareToken,
        type: 'MEDICAL_RECORDS_SHARE',
        version: '1.0',
        shareType,
        recordCount: actualRecordIds.length,
        generatedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        checksum: this.generateChecksum(shareToken + userId + actualRecordIds.join(','))
      };

      // Generate QR code
      const qrCodeUrl = `${process.env.FRONTEND_URL}/qr/access/${shareToken}`;
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify({
        ...qrData,
        url: qrCodeUrl
      }), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Store QR token in database
      const qrShareToken = await prisma.qrShareToken.create({
        data: {
          token: shareToken,
          userId: userId,
          recordIds: actualRecordIds,
          facilityId: facilityId || 'public',
          shareType: shareType as any,
          expiresAt: expiresAt,
          blockchainHash: 'pending' // Will be updated after blockchain transaction
        }
      });

      // Mark records as shareable via QR
      await prisma.medicalRecord.updateMany({
        where: { id: { in: actualRecordIds } },
        data: { 
          shareableViaQr: true,
          qrExpiresAt: expiresAt
        }
      });

      res.json({
        status: 'success',
        message: 'QR code generated successfully',
        data: {
          qrCode: qrCodeImage,
          qrData,
          shareToken,
          expiresAt: expiresAt.toISOString(),
          blockchainHash: 'pending',
          accessUrl: qrCodeUrl,
          recordCount: actualRecordIds.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('QR generation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate QR code',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Access medical records via QR token
   * GET /qr/access/:token
   */
  async accessViaQR(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { facilityId, accessorId } = req.query;

      if (!token) {
        res.status(400).json({
          status: 'error',
          message: 'QR token is required'
        });
        return;
      }

      // Verify token exists and is not expired
      const tokenData = await prisma.qrShareToken.findFirst({
        where: {
          token: token,
          expiresAt: { gt: new Date() },
          revoked: false
        },
        include: {
          user: {
            include: {
              patient: true
            }
          }
        }
      });

      if (!tokenData) {
        res.status(404).json({
          status: 'error',
          message: 'Invalid or expired QR token'
        });
        return;
      }

      if (!tokenData.user.patient) {
        res.status(404).json({
          status: 'error',
          message: 'Patient profile not found'
        });
        return;
      }

      // Get medical records
      const records = await prisma.medicalRecord.findMany({
        where: {
          id: { in: tokenData.recordIds },
          patientId: tokenData.user.patient.id
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });

      // Filter data based on share type
      let sharedData;
      if (tokenData.shareType === 'full') {
        sharedData = records.map((record: any) => ({
          id: record.id,
          title: record.title,
          description: record.description,
          recordType: record.recordType,
          diagnosis: record.diagnosis,
          medications: record.medications,
          labResults: record.labResults,
          notes: record.notes,
          visitDate: record.visitDate,
          severity: record.severity
        }));
      } else {
        // Summary or emergency - limited data
        sharedData = records.map((record: any) => ({
          id: record.id,
          title: record.title,
          recordType: record.recordType,
          visitDate: record.visitDate,
          severity: record.severity
        }));
      }

      // Update access count and last accessed
      await prisma.qrShareToken.update({
        where: { id: tokenData.id },
        data: {
          accessCount: { increment: 1 },
          lastAccessed: new Date()
        }
      });

      // Get family data for the patient
      const familyData = await this.getFamilyDataForPatient(tokenData.user.patient.id);

      res.json({
        status: 'success',
        message: 'Medical records accessed successfully',
        data: {
          patient: {
            id: tokenData.user.patient.id, // Add patient ID for AI insights
            name: `${tokenData.user.patient?.firstName} ${tokenData.user.patient?.lastName}`,
            dateOfBirth: tokenData.user.patient?.dateOfBirth,
            gender: tokenData.user.patient?.gender
          },
          records: sharedData,
          familyData: familyData, // Add this line
          shareType: tokenData.shareType,
          recordCount: records.length,
          accessCount: tokenData.accessCount + 1,
          expiresAt: tokenData.expiresAt.toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('QR access error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to access medical records',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  
  /**
   * Validate QR token without accessing data
   * POST /qr/validate
   */
  async validateQRToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          status: 'error',
          message: 'QR token is required'
        });
        return;
      }

      const tokenData = await prisma.qrShareToken.findFirst({
        where: {
          token: token,
          expiresAt: { gt: new Date() },
          revoked: false
        },
        include: {
          user: {
            include: {
              patient: true
            }
          }
        }
      });

      if (!tokenData) {
        res.json({
          status: 'success',
          data: {
            valid: false,
            message: 'Invalid or expired QR token'
          }
        });
        return;
      }

      res.json({
        status: 'success',
        data: {
          valid: true,
          patientInfo: {
            name: `${tokenData.user.patient?.firstName} ${tokenData.user.patient?.lastName}`,
            age: tokenData.user.patient?.dateOfBirth 
              ? Math.floor((Date.now() - new Date(tokenData.user.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null,
            gender: tokenData.user.patient?.gender
          },
          shareType: tokenData.shareType,
          recordCount: tokenData.recordIds.length,
          expiresAt: tokenData.expiresAt.toISOString(),
          accessCount: tokenData.accessCount
        }
      });

    } catch (error: any) {
      logger.error('QR validation error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to validate QR token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get QR sharing history for user
   * GET /qr/history
   */
  async getQRHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20 } = req.query;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User authentication required'
        });
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [history, total] = await Promise.all([
        prisma.qrShareToken.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.qrShareToken.count({
          where: { userId }
        })
      ]);

      res.json({
        status: 'success',
        message: 'QR history retrieved successfully',
        data: {
          history,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('QR history error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve QR history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Revoke QR token
   * POST /qr/revoke/:token
   */
  async revokeQRToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User authentication required'
        });
        return;
      }

      const tokenData = await prisma.qrShareToken.findFirst({
        where: {
          token: token!,
          userId
        }
      });

      if (!tokenData) {
        res.status(404).json({
          status: 'error',
          message: 'QR token not found'
        });
        return;
      }

      await prisma.qrShareToken.update({
        where: { id: tokenData.id },
        data: {
          revoked: true,
          revokedAt: new Date()
        }
      });

      res.json({
        status: 'success',
        message: 'QR token revoked successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('QR revoke error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to revoke QR token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

    /**
   * Get family data for a patient to include in QR sharing
   */
  private async getFamilyDataForPatient(patientId: string) {
    try {
      // For now, return basic family info structure
      // This will be enhanced once family relationships are properly set up
      return {
        familyGroups: [],
        sharedMedicalHistory: [],
        emergencyContacts: [],
        hasFamilyData: false,
        message: "Family data integration pending - will be available once family groups are configured"
      };
    } catch (error) {
      logger.error('Error fetching family data:', error);
      return null;
    }
  }

  /**
   * Generate AI insights for doctor based on patient and family data
   */
  async generateAIInsights(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, qrToken, consultationType = 'routine', symptoms, chiefComplaint } = req.body;

      if (!patientId) {
        res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
        return;
      }

      // Validate that QR data was shared and doctor has access
      let qrShareToken = null;
      if (qrToken) {
        qrShareToken = await prisma.qrShareToken.findUnique({
          where: { token: qrToken },
          include: {
            user: {
              include: {
                patient: true
              }
            }
          }
        });

        if (!qrShareToken || qrShareToken.revoked) {
          res.status(404).json({
            success: false,
            message: 'QR token not found, expired, or revoked'
          });
          return;
        }
      }

      // Get patient data with medical records
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: true,
          medicalRecords: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Latest 10 records
            where: {
              isActive: true
            }
          }
        }
      });

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
        return;
      }

      // Get family data
      const familyData = await this.getFamilyDataForAI(patientId);

      // Prepare patient data for AI
      const patientData = {
        name: `${patient.firstName} ${patient.lastName}`,
        dateOfBirth: patient.dateOfBirth.toISOString(),
        gender: patient.gender || 'unknown',
        records: patient.medicalRecords.map((record: any) => ({
          id: record.id,
          title: record.title,
          description: record.description || '',
          recordType: record.recordType,
          diagnosis: record.diagnosis?.join(', ') || '',
          medications: record.medications?.map((med: any) => med.name || med.medication)?.join(', ') || '',
          labResults: record.labResults?.map((lab: any) => `${lab.test}: ${lab.value}`)?.join(', ') || '',
          notes: record.notes || '',
          visitDate: record.visitDate.toISOString(),
          severity: record.severity || 'unknown'
        }))
      };

      // Generate AI insights
      const insights = await aiInsightsService.generateMedicalInsights({
        patientData,
        familyData,
        consultationType: consultationType as 'routine' | 'emergency' | 'follow_up' | 'initial',
        symptoms: symptoms || [],
        chiefComplaint: chiefComplaint || ''
      });

      res.json({
        success: true,
        data: {
          insights,
          patientId,
          generatedAt: new Date().toISOString(),
          dataSource: qrToken ? 'qr_shared' : 'direct_access'
        }
      });

    } catch (error) {
      logger.error('Error generating AI insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI insights'
      });
    }
  }

  /**
   * Generate quick AI suggestions for immediate doctor reference
   */
  async generateQuickSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, symptoms } = req.body;

      if (!patientId) {
        res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
        return;
      }

      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Symptoms array is required for quick suggestions'
        });
        return;
      }

      // Get basic patient data
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
        return;
      }

      const patientAge = patient.dateOfBirth ? 
        Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
        30; // Default age if not available

      // Generate quick suggestions
      const suggestions = await aiInsightsService.generateQuickSuggestions(
        symptoms,
        patientAge,
        patient.gender || 'unknown'
      );

      res.json({
        success: true,
        data: {
          suggestions,
          patientId,
          generatedAt: new Date().toISOString(),
          contextUsed: {
            symptoms: symptoms,
            patientAge: patientAge,
            gender: patient.gender
          }
        }
      });

    } catch (error) {
      logger.error('Error generating quick suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate quick suggestions'
      });
    }
  }

  /**
   * Get family data formatted for AI analysis
   */
  private async getFamilyDataForAI(patientId: string) {
    try {
      // Get patient's family groups using correct model name from schema
      // Using familyMember (camelCase) as per Prisma convention
      const familyMemberships = await (prisma as any).familyMember.findMany({
        where: { patientId: patientId },
        include: {
          familyGroup: {
            include: {
              members: {
                include: {
                  patient: {
                    include: {
                      medicalRecords: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        where: {
                          isActive: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const familyGroups: any[] = [];
      const sharedMedicalHistory: any[] = [];
      const emergencyContacts: any[] = [];

      for (const membership of familyMemberships) {
        const familyMembers = membership.familyGroup.members.map((member: any) => ({
          id: member.patient.id,
          name: `${member.patient.firstName} ${member.patient.lastName}`,
          relationship: member.relationship,
          age: member.patient.dateOfBirth ? 
            Math.floor((Date.now() - new Date(member.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
            null,
          gender: member.patient.gender || 'unknown',
          bloodType: member.patient.bloodType || 'unknown',
          emergencyContact: member.patient.emergencyContact || {}
        }));

        familyGroups.push({
          groupId: membership.familyGroup.id,
          groupName: membership.familyGroup.name,
          relationship: membership.relationship,
          members: familyMembers
        });

        // Collect shared medical history
        for (const member of membership.familyGroup.members) {
          if (member.patientId !== patientId && member.patient.medicalRecords.length > 0) {
            member.patient.medicalRecords.forEach((record: any) => {
              sharedMedicalHistory.push({
                recordId: record.id,
                fromPatient: `${member.patient.firstName} ${member.patient.lastName}`,
                recordType: record.recordType,
                diagnosis: record.diagnosis?.join(', ') || '',
                medications: record.medications?.map((med: any) => med.name || med.medication)?.join(', ') || '',
                notes: record.notes || '',
                severity: record.severity || 'unknown',
                shareLevel: 'family',
                sharedAt: record.createdAt.toISOString()
              });
            });
          }
        }

        // Extract emergency contacts
        familyMembers.forEach((member: any) => {
          if (member.emergencyContact && typeof member.emergencyContact === 'object') {
            emergencyContacts.push({
              name: member.emergencyContact.name || member.name,
              relationship: member.relationship,
              contact: member.emergencyContact
            });
          }
        });
      }

      return {
        familyGroups,
        sharedMedicalHistory,
        emergencyContacts
      };

    } catch (error) {
      logger.error('Error fetching family data for AI:', error);
      return {
        familyGroups: [],
        sharedMedicalHistory: [],
        emergencyContacts: []
      };
    }
  }

  /**
   * Generate checksum for QR data integrity
   */
  private generateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }
}

export const qrController = new QRController();
