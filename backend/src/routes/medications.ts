import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Get user medications
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const mockMedications = [
      {
        id: 'med-1',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        prescribedBy: 'Dr. Smith',
        startDate: '2025-08-01',
        endDate: '2025-12-01',
        instructions: 'Take with food in the morning',
        remainingDoses: 87,
        totalDoses: 120,
        status: 'active',
        adherence: 94,
        sideEffects: ['Dry cough', 'Dizziness'],
        category: 'Blood Pressure'
      },
      {
        id: 'med-2',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        prescribedBy: 'Dr. Johnson',
        startDate: '2025-07-15',
        endDate: '2026-01-15',
        instructions: 'Take with meals',
        remainingDoses: 156,
        totalDoses: 180,
        status: 'active',
        adherence: 87,
        sideEffects: ['Nausea', 'Stomach upset'],
        category: 'Diabetes'
      },
      {
        id: 'med-3',
        name: 'Vitamin D3',
        dosage: '2000 IU',
        frequency: 'Once daily',
        prescribedBy: 'Dr. Wilson',
        startDate: '2025-06-01',
        endDate: null,
        instructions: 'Take with fatty meal',
        remainingDoses: 23,
        totalDoses: 90,
        status: 'low_stock',
        adherence: 98,
        sideEffects: [],
        category: 'Supplement'
      }
    ];

    return res.status(200).json({
      status: 'success',
      data: { medications: mockMedications },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Medications fetch error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'MEDICATIONS_FETCH_FAILED',
        message: 'Failed to load medications',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get medication reminders
router.get('/reminders', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const mockReminders = [
      {
        id: 'reminder-1',
        medicationId: 'med-1',
        medicationName: 'Lisinopril',
        dosage: '10mg',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        status: 'pending',
        type: 'daily_dose'
      },
      {
        id: 'reminder-2',
        medicationId: 'med-2',
        medicationName: 'Metformin',
        dosage: '500mg',
        scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        status: 'pending',
        type: 'daily_dose'
      },
      {
        id: 'reminder-3',
        medicationId: 'med-3',
        medicationName: 'Vitamin D3',
        dosage: '2000 IU',
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
        status: 'upcoming',
        type: 'refill_needed'
      }
    ];

    return res.status(200).json({
      status: 'success',
      data: { reminders: mockReminders },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Medication reminders error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'REMINDERS_FETCH_FAILED',
        message: 'Failed to load medication reminders',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Record medication taken
router.post('/taken', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { medicationId, reminderId, takenAt, notes } = req.body;

    if (!medicationId) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_MEDICATION_ID',
          message: 'Medication ID is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Mock response for recording medication taken
    const adherenceRecord = {
      id: `adherence-${Date.now()}`,
      medicationId,
      reminderId,
      userId: user.id,
      takenAt: takenAt || new Date().toISOString(),
      scheduledTime: new Date().toISOString(),
      status: 'taken',
      notes: notes || '',
      adherenceScore: Math.floor(Math.random() * 10) + 90 // 90-100%
    };

    logger.info(`Medication adherence recorded - User: ${user.id}, Medication: ${medicationId}`);

    return res.status(200).json({
      status: 'success',
      data: adherenceRecord,
      message: 'Medication adherence recorded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Record medication taken error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'RECORD_MEDICATION_FAILED',
        message: 'Failed to record medication taken',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
