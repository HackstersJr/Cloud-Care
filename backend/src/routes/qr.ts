import { Router } from 'express';
import { qrController } from '../controllers/qrController';
import { validateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

/**
 * QR Code Routes for Medical Record Sharing
 * All routes handle blockchain-based consent management
 */

// Status endpoint - no authentication required
router.get('/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'QR service is operational',
    features: [
      'blockchain_consent_management',
      'secure_token_generation',
      'expiration_control',
      'access_logging',
      'data_filtering_by_share_type'
    ],
    timestamp: new Date().toISOString()
  });
});

// Generate QR code for sharing medical records (authenticated)
router.post('/generate',
  validateJWT,
  [
    body('recordIds')
      .isArray({ min: 1 })
      .withMessage('At least one record ID is required'),
    body('recordIds.*')
      .isString()
      .withMessage('Record IDs must be strings'),
    body('facilityId')
      .optional()
      .isString()
      .withMessage('Facility ID must be a string'),
    body('expiresInHours')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('Expiration must be between 1 and 168 hours (7 days)'),
    body('shareType')
      .optional()
      .isIn(['full', 'summary', 'emergency'])
      .withMessage('Share type must be full, summary, or emergency')
  ],
  validateRequest,
  qrController.generateQRCode.bind(qrController)
);

// Access medical records via QR token (public endpoint with token validation)
router.get('/access/:token',
  [
    param('token')
      .isUUID()
      .withMessage('Invalid QR token format'),
    query('facilityId')
      .optional()
      .isString()
      .withMessage('Facility ID must be a string'),
    query('accessorId')
      .optional()
      .isString()
      .withMessage('Accessor ID must be a string')
  ],
  validateRequest,
  qrController.accessViaQR.bind(qrController)
);

// Validate QR token without accessing data (public endpoint)
router.post('/validate',
  [
    body('token')
      .isUUID()
      .withMessage('Invalid QR token format'),
    body('checksum')
      .optional()
      .isString()
      .withMessage('Checksum must be a string')
  ],
  validateRequest,
  qrController.validateQRToken.bind(qrController)
);

// Revoke QR token and blockchain consent (authenticated)
router.delete('/revoke/:token',
  validateJWT,
  [
    param('token')
      .isUUID()
      .withMessage('Invalid QR token format')
  ],
  validateRequest,
  qrController.revokeQRToken.bind(qrController)
);

// Get user's QR sharing history (authenticated)
router.get('/history',
  validateJWT,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  qrController.getQRHistory.bind(qrController)
);

// AI Insights Routes for Doctor Portal

// Generate comprehensive AI insights based on patient and family data
router.post('/ai/insights',
  [
    body('patientId')
      .isString()
      .withMessage('Patient ID is required'),
    body('qrToken')
      .optional()
      .isUUID()
      .withMessage('QR token must be a valid UUID'),
    body('consultationType')
      .optional()
      .isIn(['routine', 'emergency', 'follow_up', 'initial'])
      .withMessage('Consultation type must be routine, emergency, follow_up, or initial'),
    body('symptoms')
      .optional()
      .isArray()
      .withMessage('Symptoms must be an array'),
    body('chiefComplaint')
      .optional()
      .isString()
      .withMessage('Chief complaint must be a string')
  ],
  validateRequest,
  qrController.generateAIInsights.bind(qrController)
);

// Generate quick AI suggestions for immediate reference
router.post('/ai/quick-suggestions',
  [
    body('patientId')
      .isString()
      .withMessage('Patient ID is required'),
    body('symptoms')
      .isArray({ min: 1 })
      .withMessage('At least one symptom is required'),
    body('symptoms.*')
      .isString()
      .withMessage('Each symptom must be a string')
  ],
  validateRequest,
  qrController.generateQuickSuggestions.bind(qrController)
);

export default router;
