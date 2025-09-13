import { Router } from 'express';
import { Request, Response } from 'express';
import { validateJWT, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../services/prisma';
import { body, query, param } from 'express-validator';
import { logger } from '../utils/logger';

const router = Router();

// Apply JWT validation to all routes
router.use(validateJWT);

/**
 * Get all consent requests for a patient
 * GET /api/consents
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user || user.role !== 'patient') {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Patient access required.' 
      });
      return;
    }

    // For now, we'll use the user's ID as patientId since we need to link users to patients
    const patientId = user.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const consentType = req.query.consentType as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      patientId: patientId
    };

    if (status) {
      where.status = status;
    }

    if (consentType) {
      where.consentType = consentType;
    }

    const [consents, total] = await Promise.all([
      prisma.consentRequest.findMany({
        where,
        orderBy: { requestedDate: 'desc' },
        skip,
        take: limit,
        include: {
          approvals: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.consentRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        consents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching consent requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consent requests'
    });
  }
});

/**
 * Get a specific consent request
 * GET /api/consents/:id
 */
router.get('/:id', 
  param('id').isUUID().withMessage('Invalid consent ID'),
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

      const consent = await prisma.consentRequest.findFirst({
        where: {
          id: id,
          patientId: patientId
        },
        include: {
          approvals: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!consent) {
        res.status(404).json({
          success: false,
          message: 'Consent request not found'
        });
        return;
      }

      res.json({
        success: true,
        data: consent
      });

    } catch (error) {
      logger.error('Error fetching consent request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch consent request'
      });
    }
  }
);

/**
 * Update consent request status (approve/deny/revoke)
 * PATCH /api/consents/:id/status
 */
router.patch('/:id/status',
  param('id').isUUID().withMessage('Invalid consent ID'),
  body('action').isIn(['approved', 'denied', 'revoked']).withMessage('Invalid action'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  validateRequest,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!user || user.role !== 'patient') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Patient access required.' 
        });
        return;
      }

      const patientId = user.id;

      // Check if consent request exists and belongs to patient
      const existingConsent = await prisma.consentRequest.findFirst({
        where: {
          id: id!,
          patientId: patientId
        }
      });

      if (!existingConsent) {
        res.status(404).json({
          success: false,
          message: 'Consent request not found'
        });
        return;
      }

      // Check if action is valid based on current status
      if (existingConsent.status === 'expired' || existingConsent.status === 'revoked') {
        res.status(400).json({
          success: false,
          message: 'Cannot modify expired or revoked consent requests'
        });
        return;
      }

      if (action === 'revoked' && existingConsent.status !== 'approved') {
        res.status(400).json({
          success: false,
          message: 'Can only revoke approved consent requests'
        });
        return;
      }

      // Update consent status
      const updateData: any = {
        status: action,
        updatedAt: new Date()
      };

      if (action === 'approved') {
        updateData.approvedDate = new Date();
        // Set validity period if not already set
        if (!existingConsent.validFrom || !existingConsent.validTo) {
          updateData.validFrom = new Date();
          updateData.validTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
        }
      } else if (action === 'denied') {
        updateData.deniedDate = new Date();
      } else if (action === 'revoked') {
        updateData.revokedDate = new Date();
      }

      // Use transaction to update consent and create approval record
      const result = await prisma.$transaction(async (tx) => {
        // Update consent request
        const updatedConsent = await tx.consentRequest.update({
          where: { id: id! },
          data: updateData,
          include: {
            approvals: {
              orderBy: { createdAt: 'desc' }
            }
          }
        });

        // Create approval record for audit trail
        await tx.consentApproval.create({
          data: {
            consentRequestId: id!,
            patientId: patientId,
            action: action as any,
            reason: reason || null,
            ipAddress: req.ip || null,
            userAgent: req.get('User-Agent') || null
          }
        });

        return updatedConsent;
      });

      logger.info(`Consent request ${id} ${action} by patient ${patientId}`);

      res.json({
        success: true,
        data: result,
        message: `Consent request ${action} successfully`
      });

    } catch (error) {
      logger.error('Error updating consent request status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update consent request status'
      });
    }
  }
);

/**
 * Create a new consent request (for testing purposes)
 * POST /api/consents
 */
router.post('/',
  body('facilityName').notEmpty().withMessage('Facility name is required'),
  body('requestorName').notEmpty().withMessage('Requestor name is required'),
  body('requestorEmail').isEmail().withMessage('Valid requestor email is required'),
  body('consentType').isIn(['data_access', 'subscription', 'emergency_access', 'research']).withMessage('Invalid consent type'),
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('permissionLevel').isIn(['read', 'write', 'full_access']).withMessage('Invalid permission level'),
  body('dataTypes').isArray().withMessage('Data types must be an array'),
  body('validFrom').optional().isISO8601().withMessage('Valid from must be a valid date'),
  body('validTo').optional().isISO8601().withMessage('Valid to must be a valid date'),
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

      const patientId = user.id;

      const {
        facilityName,
        requestorName,
        requestorEmail,
        consentType,
        purpose,
        permissionLevel,
        dataTypes,
        validFrom,
        validTo
      } = req.body;

      const consent = await prisma.consentRequest.create({
        data: {
          patientId,
          facilityName,
          requestorName,
          requestorEmail,
          consentType,
          purpose,
          permissionLevel,
          dataTypes,
          validFrom: validFrom ? new Date(validFrom) : null,
          validTo: validTo ? new Date(validTo) : null
        },
        include: {
          approvals: true
        }
      });

      logger.info(`New consent request created: ${consent.id} for patient ${patientId}`);

      res.status(201).json({
        success: true,
        data: consent,
        message: 'Consent request created successfully'
      });

    } catch (error) {
      logger.error('Error creating consent request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create consent request'
      });
    }
  }
);

export default router;
