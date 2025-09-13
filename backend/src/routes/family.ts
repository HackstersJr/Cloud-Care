import { Router } from 'express';
import { Request, Response } from 'express';
import { validateJWT, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../services/prisma';
import { blockchainService } from '../services/blockchainService';
import { body, query, param } from 'express-validator';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = Router();

// Apply JWT validation to all routes
router.use(validateJWT);

// =============================================================================
// FAMILY GROUP MANAGEMENT
// =============================================================================

/**
 * Create a new family group
 * POST /api/family/groups
 */
router.post('/groups',
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }).withMessage('Family name must be 2-100 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const { name, description } = req.body;
      const userId = user.id;

      // Get the actual patient record
      const patient = await prisma.patient.findUnique({
        where: { userId: userId }
      });

      if (!patient) {
        res.status(404).json({
          success: false,
          message: 'Patient record not found'
        });
        return;
      }

      const patientId = patient.id;

      // Generate unique invite code
      const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      // Create family group with the creator as admin
      const familyGroup = await prisma.$transaction(async (tx) => {
        const group = await tx.familyGroup.create({
          data: {
            name,
            description,
            adminId: patientId,
            inviteCode,
            settings: {
              autoApproveFamily: false,
              emergencyAccess: true,
              shareByDefault: false
            }
          }
        });

        // Add creator as admin member
        await tx.familyMember.create({
          data: {
            familyGroupId: group.id,
            patientId: patientId,
            relationship: 'parent', // Default, can be changed
            role: 'admin',
            permissions: ['full_access']
          }
        });

        return group;
      });

      logger.info(`Family group created: ${familyGroup.id} by patient ${patientId}`);

      res.status(201).json({
        success: true,
        data: familyGroup,
        message: 'Family group created successfully'
      });

    } catch (error) {
      logger.error('Error creating family group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create family group'
      });
    }
  }
);

/**
 * Get family groups for current patient
 * GET /api/family/groups
 */
router.get('/groups', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user || user.role !== 'patient') {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Patient access required.' 
      });
      return;
    }

    // Get Patient record using User.id
    const patient = await prisma.patient.findUnique({
      where: { userId: user.id }
    });
    
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
      return;
    }

    const familyGroups = await prisma.familyGroup.findMany({
      where: {
        OR: [
          { adminId: patient.id }, // Groups where patient is admin
          { 
            members: {
              some: {
                patientId: patient.id,
                isActive: true
              }
            }
          } // Groups where patient is a member
        ],
        isActive: true
      },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        members: {
          where: { isActive: true },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true
              }
            }
          }
        },
        _count: {
          select: {
            members: { where: { isActive: true } },
            sharedRecords: { where: { isActive: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: familyGroups
    });

  } catch (error) {
    logger.error('Error fetching family groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family groups'
    });
  }
});

/**
 * Get specific family group details
 * GET /api/family/groups/:id
 */
router.get('/groups/:id',
  param('id').isUUID().withMessage('Invalid family group ID'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const patientId = user.id;

      // Check if user is member of this family group
      const membership = await prisma.familyMember.findFirst({
        where: {
          familyGroupId: id,
          patientId: patientId,
          isActive: true
        }
      });

      if (!membership) {
        res.status(404).json({
          success: false,
          message: 'Family group not found or access denied'
        });
        return;
      }

      const familyGroup = await prisma.familyGroup.findUnique({
        where: { id },
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          members: {
            where: { isActive: true },
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                  gender: true
                }
              }
            },
            orderBy: { joinedAt: 'asc' }
          },
          sharedRecords: {
            where: { isActive: true },
            include: {
              record: {
                select: {
                  id: true,
                  title: true,
                  recordType: true,
                  visitDate: true,
                  createdAt: true
                }
              },
              sharer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { sharedAt: 'desc' }
          }
        }
      });

      res.json({
        success: true,
        data: familyGroup
      });

    } catch (error) {
      logger.error('Error fetching family group details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch family group details'
      });
    }
  }
);

// =============================================================================
// FAMILY INVITATIONS
// =============================================================================

/**
 * Send family invitation
 * POST /api/family/invitations
 */
router.post('/invitations',
  body('familyGroupId').isUUID().withMessage('Valid family group ID required'),
  body('inviteeEmail').isEmail().withMessage('Valid email required'),
  body('inviteePhone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('proposedRelationship').isIn(['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'aunt_uncle', 'niece_nephew', 'cousin', 'guardian', 'other']).withMessage('Valid relationship required'),
  body('message').optional().isString().isLength({ max: 500 }).withMessage('Message must not exceed 500 characters'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { familyGroupId, inviteeEmail, inviteePhone, proposedRelationship, message } = req.body;
      
      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const patientId = user.id;

      // Check if user has permission to invite (admin or moderator)
      const membership = await prisma.familyMember.findFirst({
        where: {
          familyGroupId,
          patientId: patientId,
          isActive: true,
          role: { in: ['admin', 'moderator'] }
        }
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'Permission denied. Admin or moderator access required.'
        });
        return;
      }

      // Check if invitation already exists for this email
      const existingInvitation = await prisma.familyInvitation.findFirst({
        where: {
          familyGroupId,
          inviteeEmail,
          status: 'pending'
        }
      });

      if (existingInvitation) {
        res.status(400).json({
          success: false,
          message: 'Invitation already sent to this email'
        });
        return;
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await prisma.familyInvitation.create({
        data: {
          familyGroupId,
          invitedBy: patientId,
          inviteeEmail,
          inviteePhone,
          proposedRelationship,
          token,
          message,
          expiresAt
        },
        include: {
          familyGroup: {
            select: {
              name: true
            }
          },
          inviter: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info(`Family invitation sent: ${invitation.id} to ${inviteeEmail}`);

      // TODO: Send email invitation (integrate with email service)

      res.status(201).json({
        success: true,
        data: invitation,
        message: 'Family invitation sent successfully'
      });

    } catch (error) {
      logger.error('Error sending family invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send family invitation'
      });
    }
  }
);

/**
 * Get family invitations (sent and received)
 * GET /api/family/invitations
 */
router.get('/invitations',
  query('type').optional().isIn(['sent', 'received']).withMessage('Type must be sent or received'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { type } = req.query;
      
      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const patientId = user.id;

      let invitations;

      if (type === 'sent') {
        // Get invitations sent by this patient
        invitations = await prisma.familyInvitation.findMany({
          where: {
            invitedBy: patientId
          },
          include: {
            familyGroup: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } else if (type === 'received') {
        // Get invitations received by this patient's email
        const patient = await prisma.patient.findUnique({
          where: { userId: patientId }, // Fix: use userId instead of id
          include: {
            user: {
              select: { email: true }
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

        invitations = await prisma.familyInvitation.findMany({
          where: {
            inviteeEmail: patient.user.email,
            status: 'pending'
          },
          include: {
            familyGroup: {
              select: {
                name: true,
                description: true
              }
            },
            inviter: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        // Get all invitations
        const patient = await prisma.patient.findUnique({
          where: { userId: patientId }, // Fix: use userId instead of id
          include: {
            user: {
              select: { email: true }
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

        const [sent, received] = await Promise.all([
          prisma.familyInvitation.findMany({
            where: { invitedBy: patientId },
            include: {
              familyGroup: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.familyInvitation.findMany({
            where: {
              inviteeEmail: patient.user.email,
              status: 'pending'
            },
            include: {
              familyGroup: { select: { name: true, description: true } },
              inviter: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
          })
        ]);

        invitations = { sent, received };
      }

      res.json({
        success: true,
        data: invitations
      });

    } catch (error) {
      logger.error('Error fetching family invitations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch family invitations'
      });
    }
  }
);

/**
 * Respond to family invitation
 * PATCH /api/family/invitations/:token
 */
router.patch('/invitations/:token',
  param('token').isLength({ min: 64, max: 64 }).withMessage('Invalid invitation token'),
  body('action').isIn(['accept', 'decline']).withMessage('Action must be accept or decline'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { token } = req.params;
      const { action } = req.body;
      
      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const patientId = user.id;

      // Find invitation
      const patient = await prisma.patient.findUnique({
        where: { userId: patientId }, // Fix: use userId instead of id
        include: {
          user: {
            select: { email: true }
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

      const invitation = await prisma.familyInvitation.findFirst({
        where: {
          token,
          inviteeEmail: patient.user.email,
          status: 'pending'
        },
        include: {
          familyGroup: true
        }
      });

      if (!invitation) {
        res.status(404).json({
          success: false,
          message: 'Invitation not found or already responded'
        });
        return;
      }

      // Check if invitation is expired
      if (invitation.expiresAt < new Date()) {
        await prisma.familyInvitation.update({
          where: { id: invitation.id },
          data: { status: 'expired' }
        });

        res.status(400).json({
          success: false,
          message: 'Invitation has expired'
        });
        return;
      }

      const updatedInvitation = await prisma.$transaction(async (tx) => {
        // Update invitation status
        const updated = await tx.familyInvitation.update({
          where: { id: invitation.id },
          data: {
            status: action === 'accept' ? 'accepted' : 'declined',
            respondedAt: new Date()
          }
        });

        // If accepted, add as family member
        if (action === 'accept') {
          const newMember = await tx.familyMember.create({
            data: {
              familyGroupId: invitation.familyGroupId,
              patientId: patientId,
              relationship: invitation.proposedRelationship,
              role: 'member',
              permissions: ['view_basic_info', 'view_medical_history']
            }
          });

          // Store family member join on blockchain (non-blocking)
          try {
            const blockchainTx = await blockchainService.storeFamilyMemberJoin(
              invitation.familyGroupId,
              patientId,
              invitation.invitedBy,
              invitation.proposedRelationship
            );

            // Create blockchain record entry
            await tx.familyBlockchainRecord.create({
              data: {
                familyGroupId: invitation.familyGroupId,
                recordType: 'member_joined',
                dataHash: crypto.createHash('sha256').update(JSON.stringify({
                  familyGroupId: invitation.familyGroupId,
                  newMemberId: patientId,
                  relationship: invitation.proposedRelationship,
                  timestamp: new Date()
                })).digest('hex'),
                transactionHash: blockchainTx.hash,
                blockNumber: BigInt(blockchainTx.blockNumber),
                patientId: patientId,
                metadata: {
                  action: 'member_joined',
                  relationship: invitation.proposedRelationship,
                  invitedBy: invitation.invitedBy
                }
              }
            });

            logger.info(`Family member join recorded on blockchain: ${blockchainTx.hash}`);
          } catch (blockchainError) {
            logger.warn('Failed to store family member join on blockchain:', blockchainError);
            // Don't fail the main operation if blockchain fails
          }
        }

        return updated;
      });

      logger.info(`Family invitation ${action}ed: ${invitation.id} by patient ${patientId}`);

      res.json({
        success: true,
        data: updatedInvitation,
        message: `Invitation ${action}ed successfully`
      });

    } catch (error) {
      logger.error('Error responding to family invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to invitation'
      });
    }
  }
);

// =============================================================================
// FAMILY MEDICAL RECORD SHARING
// =============================================================================

/**
 * Share medical record with family
 * POST /api/family/share-record
 */
router.post('/share-record',
  body('familyGroupId').isUUID().withMessage('Valid family group ID required'),
  body('recordId').isUUID().withMessage('Valid medical record ID required'),
  body('shareLevel').isIn(['summary', 'partial', 'full', 'emergency']).withMessage('Valid share level required'),
  body('allowedMembers').optional().isArray().withMessage('Allowed members must be an array'),
  body('expiresAt').optional().isISO8601().withMessage('Valid expiration date required'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { familyGroupId, recordId, shareLevel, allowedMembers, expiresAt } = req.body;
      
      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const patientId = user.id;

      // Verify patient owns the medical record
      const record = await prisma.medicalRecord.findFirst({
        where: {
          id: recordId,
          patientId: patientId
        }
      });

      if (!record) {
        res.status(404).json({
          success: false,
          message: 'Medical record not found or access denied'
        });
        return;
      }

      // Verify patient is member of family group
      const membership = await prisma.familyMember.findFirst({
        where: {
          familyGroupId,
          patientId: patientId,
          isActive: true
        }
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'Not a member of this family group'
        });
        return;
      }

      // Check if record is already shared
      const existingShare = await prisma.familySharedRecord.findFirst({
        where: {
          familyGroupId,
          recordId,
          isActive: true
        }
      });

      if (existingShare) {
        res.status(400).json({
          success: false,
          message: 'Record is already shared with this family group'
        });
        return;
      }

      // Set permissions based on share level
      let permissions: string[];
      switch (shareLevel) {
        case 'summary':
          permissions = ['view_basic_info'];
          break;
        case 'partial':
          permissions = ['view_basic_info', 'view_medical_history'];
          break;
        case 'full':
          permissions = ['view_basic_info', 'view_medical_history', 'view_lab_results', 'view_prescriptions'];
          break;
        case 'emergency':
          permissions = ['emergency_access'];
          break;
        default:
          permissions = ['view_basic_info'];
      }

      const sharedRecord = await prisma.$transaction(async (tx) => {
        const shared = await tx.familySharedRecord.create({
          data: {
            familyGroupId,
            recordId,
            sharedBy: patientId,
            shareLevel,
            permissions: permissions as any,
            allowedMembers: allowedMembers || [],
            expiresAt: expiresAt ? new Date(expiresAt) : null
          },
          include: {
            record: {
              select: {
                id: true,
                title: true,
                recordType: true,
                visitDate: true
              }
            },
            familyGroup: {
              select: {
                name: true
              }
            }
          }
        });

        // Store medical record sharing on blockchain (non-blocking)
        try {
          const blockchainTx = await blockchainService.storeMedicalRecordShare(
            familyGroupId,
            recordId,
            patientId,
            shareLevel,
            allowedMembers || []
          );

          // Create blockchain record entry
          await tx.familyBlockchainRecord.create({
            data: {
              familyGroupId,
              recordType: 'record_shared',
              dataHash: crypto.createHash('sha256').update(JSON.stringify({
                familyGroupId,
                recordId,
                sharedBy: patientId,
                shareLevel,
                timestamp: new Date()
              })).digest('hex'),
              transactionHash: blockchainTx.hash,
              blockNumber: BigInt(blockchainTx.blockNumber),
              patientId: patientId,
              metadata: {
                action: 'record_shared',
                shareLevel,
                allowedMembers: allowedMembers || []
              }
            }
          });

          logger.info(`Medical record sharing recorded on blockchain: ${blockchainTx.hash}`);
        } catch (blockchainError) {
          logger.warn('Failed to store medical record sharing on blockchain:', blockchainError);
          // Don't fail the main operation if blockchain fails
        }

        return shared;
      });

      logger.info(`Medical record shared: ${recordId} with family group ${familyGroupId} by patient ${patientId}`);

      res.status(201).json({
        success: true,
        data: sharedRecord,
        message: 'Medical record shared successfully'
      });

    } catch (error) {
      logger.error('Error sharing medical record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to share medical record'
      });
    }
  }
);

/**
 * Get shared medical records for a family group
 * GET /api/family/groups/:id/shared-records
 */
router.get('/groups/:id/shared-records',
  param('id').isUUID().withMessage('Invalid family group ID'),
  query('patientId').optional().isUUID().withMessage('Invalid patient ID'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { patientId } = req.query;
      
      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const currentPatientId = user.id;

      // Verify patient is member of family group
      const membership = await prisma.familyMember.findFirst({
        where: {
          familyGroupId: id,
          patientId: currentPatientId,
          isActive: true
        }
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'Not a member of this family group'
        });
        return;
      }

      // Build where clause
      const where: any = {
        familyGroupId: id,
        isActive: true
      };

      // If specific patient requested, filter by that
      if (patientId) {
        where.record = {
          patientId: patientId as string
        };
      }

      // Filter based on allowed members if specified
      where.OR = [
        { allowedMembers: { isEmpty: true } }, // No restrictions
        { allowedMembers: { has: currentPatientId } } // Explicitly allowed
      ];

      const sharedRecords = await prisma.familySharedRecord.findMany({
        where,
        include: {
          record: {
            select: {
              id: true,
              title: true,
              description: true,
              recordType: true,
              visitDate: true,
              diagnosis: true,
              symptoms: true,
              severity: true,
              confidentialityLevel: true,
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true
                }
              }
            }
          },
          sharer: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { sharedAt: 'desc' }
      });

      res.json({
        success: true,
        data: sharedRecords
      });

    } catch (error) {
      logger.error('Error fetching shared medical records:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shared medical records'
      });
    }
  }
);

/**
 * Unshare medical record from family
 * DELETE /api/family/shared-records/:id
 */
router.delete('/shared-records/:id',
  param('id').isUUID().withMessage('Invalid shared record ID'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params;
      
      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const patientId = user.id;

      // Find the shared record
      const sharedRecord = await prisma.familySharedRecord.findUnique({
        where: { id },
        include: {
          record: {
            select: {
              patientId: true
            }
          }
        }
      });

      if (!sharedRecord) {
        res.status(404).json({
          success: false,
          message: 'Shared record not found'
        });
        return;
      }

      // Only the record owner can unshare
      if (sharedRecord.record.patientId !== patientId) {
        res.status(403).json({
          success: false,
          message: 'Only the record owner can unshare'
        });
        return;
      }

      await prisma.familySharedRecord.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info(`Medical record unshared: ${id} by patient ${patientId}`);

      res.json({
        success: true,
        message: 'Medical record unshared successfully'
      });

    } catch (error) {
      logger.error('Error unsharing medical record:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unshare medical record'
      });
    }
  }
);

/**
 * Get family health insights (for doctors)
 * GET /api/family/health-insights/:familyGroupId
 */
router.get('/health-insights/:familyGroupId',
  param('familyGroupId').isUUID().withMessage('Invalid family group ID'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { familyGroupId } = req.params;
      
      if (!user || user.role !== 'doctor') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Doctor access required.' 
        });
        return;
      }

      // Get family group with all shared records
      const familyGroup = await prisma.familyGroup.findUnique({
        where: { id: familyGroupId },
        include: {
          members: {
            where: { isActive: true },
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                  gender: true,
                  bloodType: true,
                  allergies: true,
                  chronicConditions: true,
                  familyHistory: true
                }
              }
            }
          },
          sharedRecords: {
            where: { isActive: true },
            include: {
              record: {
                select: {
                  id: true,
                  recordType: true,
                  diagnosis: true,
                  symptoms: true,
                  medications: true,
                  severity: true,
                  visitDate: true,
                  patient: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      dateOfBirth: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!familyGroup) {
        res.status(404).json({
          success: false,
          message: 'Family group not found'
        });
        return;
      }

      // Analyze family health patterns
      const insights = {
        familySize: familyGroup.members.length,
        sharedRecordsCount: familyGroup.sharedRecords.length,
        commonConditions: {},
        hereditaryRisks: [],
        ageDistribution: {},
        chronicConditionStats: {},
        medicationPatterns: {},
        members: familyGroup.members.map(member => ({
          id: member.patient.id,
          name: `${member.patient.firstName} ${member.patient.lastName}`,
          relationship: member.relationship,
          age: new Date().getFullYear() - new Date(member.patient.dateOfBirth).getFullYear(),
          gender: member.patient.gender,
          bloodType: member.patient.bloodType,
          allergies: member.patient.allergies,
          chronicConditions: member.patient.chronicConditions,
          recentRecords: familyGroup.sharedRecords
            .filter(sr => sr.record.patient.id === member.patient.id)
            .slice(0, 3)
            .map(sr => ({
              type: sr.record.recordType,
              diagnosis: sr.record.diagnosis,
              date: sr.record.visitDate
            }))
        }))
      };

      res.json({
        success: true,
        data: insights
      });

    } catch (error) {
      logger.error('Error fetching family health insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch family health insights'
      });
    }
  }
);

/**
 * Get aggregated family health insights for doctors
 * GET /api/family/insights-overview
 */
router.get('/insights-overview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user || user.role !== 'doctor') {
      res.status(403).json({ 
        status: 'error', 
        message: 'Access denied. Doctor access required.' 
      });
      return;
    }

    // Get recent family groups with shared records (for demo purposes)
    const recentFamilyGroups = await prisma.familyGroup.findMany({
      where: { 
        isActive: true,
        sharedRecords: {
          some: { isActive: true }
        }
      },
      include: {
        members: {
          where: { isActive: true },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                chronicConditions: true,
                allergies: true
              }
            }
          }
        },
        sharedRecords: {
          where: { isActive: true },
          include: {
            record: {
              select: {
                diagnosis: true,
                recordType: true,
                severity: true,
                visitDate: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            sharedRecords: true
          }
        }
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });

    // Generate insights for each family group
    const familyInsights = recentFamilyGroups.map(family => {
      const members = family.members;
      const records = family.sharedRecords;
      
      // Calculate common conditions
      const allConditions = members.flatMap(member => member.patient.chronicConditions);
      const conditionCounts = allConditions.reduce((acc: any, condition) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
      }, {});
      
      const commonConditions = Object.entries(conditionCounts)
        .filter(([_, count]) => (count as number) > 1)
        .map(([condition, _]) => condition);

      // Calculate age distribution
      const ageRanges = { "18-30": 0, "31-50": 0, "51+": 0 };
      members.forEach(member => {
        const age = new Date().getFullYear() - new Date(member.patient.dateOfBirth).getFullYear();
        if (age <= 30) ageRanges["18-30"]++;
        else if (age <= 50) ageRanges["31-50"]++;
        else ageRanges["51+"]++;
      });

      // Recent activity
      const recentRecords = records
        .sort((a, b) => new Date(b.record.visitDate).getTime() - new Date(a.record.visitDate).getTime())
        .slice(0, 3);
      
      const recentActivity = recentRecords.length > 0 
        ? `${recentRecords.length} new medical records shared`
        : "No recent activity";

      // Risk factors based on common conditions
      const riskFactors = [];
      if (commonConditions.includes('Hypertension') || commonConditions.includes('Diabetes Type 2')) {
        riskFactors.push('Genetic predisposition to cardiovascular disease');
      }
      if (commonConditions.includes('Asthma') || commonConditions.includes('Allergies')) {
        riskFactors.push('Family history of respiratory conditions');
      }
      if (commonConditions.length === 0) {
        riskFactors.push('Monitor for hereditary conditions');
      }

      return {
        familyGroupName: family.name,
        familyGroupId: family.id,
        totalMembers: members.length,
        commonConditions,
        riskFactors,
        recentActivity,
        memberAgeRanges: ageRanges,
        sharedRecords: records.length,
        lastUpdated: family.updatedAt
      };
    });

    res.json({
      status: 'success',
      data: familyInsights
    });

  } catch (error) {
    logger.error('Error fetching family insights overview:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch family insights overview'
    });
  }
});

export default router;
