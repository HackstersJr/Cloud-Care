import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Get vital signs
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { period = '7d' } = req.query;
    
    let days = 7;
    if (period === '30d') days = 30;
    else if (period === '90d') days = 90;

    // Generate mock vital signs data
    const vitalSigns = {
      bloodPressure: Array.from({length: days}, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        systolic: Math.floor(Math.random() * 30) + 110,
        diastolic: Math.floor(Math.random() * 20) + 70,
        recordedAt: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString(),
        source: Math.random() > 0.5 ? 'home_monitor' : 'manual_entry'
      })),
      
      heartRate: Array.from({length: days}, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bpm: Math.floor(Math.random() * 30) + 65,
        recordedAt: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString(),
        source: Math.random() > 0.3 ? 'wearable' : 'manual_entry',
        restingRate: Math.random() > 0.5
      })),
      
      bloodSugar: Array.from({length: Math.floor(days / 2)}, (_, i) => ({
        date: new Date(Date.now() - (days - i * 2 - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        level: Math.floor(Math.random() * 40) + 90,
        unit: 'mg/dL',
        mealRelation: ['fasting', 'before_meal', 'after_meal'][Math.floor(Math.random() * 3)],
        recordedAt: new Date(Date.now() - (days - i * 2 - 1) * 24 * 60 * 60 * 1000).toISOString(),
        source: 'glucose_meter'
      })),
      
      weight: Array.from({length: Math.floor(days / 3)}, (_, i) => ({
        date: new Date(Date.now() - (days - i * 3 - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        weight: Math.floor(Math.random() * 10) + 70,
        unit: 'kg',
        recordedAt: new Date(Date.now() - (days - i * 3 - 1) * 24 * 60 * 60 * 1000).toISOString(),
        source: 'smart_scale'
      })),
      
      temperature: Array.from({length: Math.floor(days / 5)}, (_, i) => ({
        date: new Date(Date.now() - (days - i * 5 - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temperature: (Math.random() * 2 + 97).toFixed(1),
        unit: 'F',
        recordedAt: new Date(Date.now() - (days - i * 5 - 1) * 24 * 60 * 60 * 1000).toISOString(),
        source: 'thermometer'
      }))
    };

    return res.status(200).json({
      status: 'success',
      data: vitalSigns,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Vital signs fetch error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'VITAL_SIGNS_FETCH_FAILED',
        message: 'Failed to load vital signs',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Add new vital sign reading
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { type, value, unit, notes, source } = req.body;

    if (!type || !value) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_VITAL_DATA',
          message: 'Type and value are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const allowedTypes = ['blood_pressure', 'heart_rate', 'blood_sugar', 'weight', 'temperature', 'oxygen_saturation'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'INVALID_VITAL_TYPE',
          message: `Type must be one of: ${allowedTypes.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    const newVitalSign = {
      id: `vital-${Date.now()}`,
      userId: user.id,
      type,
      value,
      unit: unit || 'standard',
      notes: notes || '',
      source: source || 'manual_entry',
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    logger.info(`Vital sign recorded - User: ${user.id}, Type: ${type}, Value: ${value}`);

    return res.status(201).json({
      status: 'success',
      data: newVitalSign,
      message: 'Vital sign recorded successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Record vital sign error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'RECORD_VITAL_FAILED',
        message: 'Failed to record vital sign',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get vital signs summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const summary = {
      latest: {
        bloodPressure: {
          systolic: Math.floor(Math.random() * 20) + 115,
          diastolic: Math.floor(Math.random() * 15) + 70,
          recordedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          status: 'normal'
        },
        heartRate: {
          bpm: Math.floor(Math.random() * 20) + 70,
          recordedAt: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
          status: 'normal'
        },
        bloodSugar: {
          level: Math.floor(Math.random() * 30) + 95,
          unit: 'mg/dL',
          recordedAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
          status: 'normal'
        },
        weight: {
          weight: Math.floor(Math.random() * 5) + 72,
          unit: 'kg',
          recordedAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
          trend: 'stable'
        }
      },
      ranges: {
        bloodPressure: { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } },
        heartRate: { min: 60, max: 100 },
        bloodSugar: { min: 70, max: 140 },
        weight: { min: 65, max: 85 }
      },
      alerts: [
        {
          type: 'blood_pressure',
          message: 'Blood pressure slightly elevated in last reading',
          severity: 'warning',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ].filter(() => Math.random() > 0.7) // Randomly show alerts
    };

    return res.status(200).json({
      status: 'success',
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Vital signs summary error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'VITAL_SUMMARY_FAILED',
        message: 'Failed to load vital signs summary',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
