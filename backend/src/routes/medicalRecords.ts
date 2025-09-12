import { Router } from 'express';
import { medicalRecordsController } from '../controllers/medicalRecordsController';
import { validateJWT } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(validateJWT);

// Medical Records Routes with Blockchain Integration

/**
 * @route POST /api/medical-records
 * @desc Create a new medical record with blockchain hash storage
 * @access Private (Doctors, Nurses, Admins)
 */
router.post('/', medicalRecordsController.createMedicalRecord.bind(medicalRecordsController));

/**
 * @route GET /api/medical-records/:id
 * @desc Get medical record by ID with blockchain verification
 * @access Private (Patient own records, assigned healthcare providers, admins)
 */
router.get('/:id', medicalRecordsController.getMedicalRecord.bind(medicalRecordsController));

/**
 * @route PUT /api/medical-records/:id
 * @desc Update medical record with new blockchain hash
 * @access Private (Assigned healthcare providers, admins)
 */
router.put('/:id', medicalRecordsController.updateMedicalRecord.bind(medicalRecordsController));

/**
 * @route GET /api/medical-records/patient/:patientId
 * @desc Get all medical records for a patient
 * @access Private (Patient own records, assigned healthcare providers, admins)
 */
router.get('/patient/:patientId', medicalRecordsController.getPatientMedicalRecords.bind(medicalRecordsController));

/**
 * @route POST /api/medical-records/:id/verify
 * @desc Verify medical record integrity using blockchain
 * @access Private (Any authenticated user who can view the record)
 */
router.post('/:id/verify', medicalRecordsController.verifyRecordIntegrity.bind(medicalRecordsController));

// Legacy status endpoint for backward compatibility
router.get('/status', (req, res) => {
  res.json({ 
    message: 'Medical Records API with Blockchain Integration - Operational',
    features: [
      'Create medical records with blockchain hash storage',
      'Retrieve records with integrity verification',
      'Update records with new blockchain hashes',
      'Verify data integrity using Polygon blockchain',
      'HIPAA-compliant access controls'
    ],
    blockchain: {
      network: 'Polygon Amoy Testnet',
      status: 'operational',
      features: ['Immutable hash storage', 'Tamper detection', 'Cost-effective transactions']
    }
  });
});

export default router;
