import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Dashboard stats endpoint
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Generate comprehensive dashboard statistics for healthcare
    const mockStats = {
      // Frontend expected fields
      linkedFacilities: Math.floor(Math.random() * 5) + 2,
      healthRecords: Math.floor(Math.random() * 25) + 10,
      pendingConsents: Math.floor(Math.random() * 3),
      connectedDevices: Math.floor(Math.random() * 4) + 1,
      
      // Additional healthcare metrics
      totalRecords: Math.floor(Math.random() * 20) + 5,
      recentVisits: Math.floor(Math.random() * 8) + 2,
      pendingTests: Math.floor(Math.random() * 3),
      upcomingAppointments: Math.floor(Math.random() * 4) + 1,
      completedAppointments: Math.floor(Math.random() * 15) + 5,
      healthScore: Math.floor(Math.random() * 20) + 80, // 80-100
      lastCheckup: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextAppointment: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      activeWearables: Math.floor(Math.random() * 3) + 1,
      blockchainVerified: Math.floor(Math.random() * 45) + 5,
      
      // Medical insights
      avgVitalSigns: {
        heartRate: Math.floor(Math.random() * 20) + 70,
        bloodPressure: {
          systolic: Math.floor(Math.random() * 20) + 110,
          diastolic: Math.floor(Math.random() * 15) + 70
        },
        bloodSugar: Math.floor(Math.random() * 30) + 90,
        temperature: (Math.random() * 2 + 97).toFixed(1)
      },
      
      // Weekly health trends
      weeklyHealthTrend: {
        steps: Array.from({length: 7}, () => Math.floor(Math.random() * 3000) + 7000),
        sleep: Array.from({length: 7}, () => Math.floor(Math.random() * 2) + 7),
        heartRate: Array.from({length: 7}, () => Math.floor(Math.random() * 15) + 70)
      },
      
      // Prescription and medication tracking
      activePrescriptions: Math.floor(Math.random() * 5) + 1,
      medicationAdherence: Math.floor(Math.random() * 15) + 85, // 85-100%
      pendingRefills: Math.floor(Math.random() * 2),
      
      // Emergency and alerts
      criticalAlerts: Math.floor(Math.random() * 2), // Usually 0-1
      healthReminders: Math.floor(Math.random() * 3) + 1,
      
      // Insurance and billing
      insuranceClaims: {
        pending: Math.floor(Math.random() * 3),
        approved: Math.floor(Math.random() * 8) + 2,
        denied: Math.floor(Math.random() * 2)
      },
      estimatedCosts: Math.floor(Math.random() * 500) + 100
    };

    logger.info(`Dashboard stats requested by user: ${user?.userId}`);

    return res.status(200).json({
      status: 'success',
      data: mockStats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Dashboard stats error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'DASHBOARD_STATS_FAILED',
        message: 'Failed to load dashboard statistics',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Dashboard activity endpoint
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Generate comprehensive recent activity for healthcare
    const activityTypes = [
      'Health Data Synced', 'Lab Result Uploaded', 'Prescription Filled', 
      'Appointment Scheduled', 'Blockchain Verification', 'Consent Updated',
      'Device Connected', 'Vital Signs Recorded', 'Insurance Claim Processed',
      'Medication Reminder', 'Health Alert Resolved', 'Record Shared'
    ];
    
    const descriptions: Record<string, string> = {
      'Health Data Synced': 'Wearable device data synchronized successfully',
      'Lab Result Uploaded': 'Blood test results have been uploaded and verified', 
      'Prescription Filled': 'Medication prescription has been filled at pharmacy',
      'Appointment Scheduled': 'New appointment scheduled with healthcare provider',
      'Blockchain Verification': 'Medical records verified on blockchain network',
      'Consent Updated': 'Data sharing consent preferences have been updated',
      'Device Connected': 'New health monitoring device successfully connected',
      'Vital Signs Recorded': 'Daily vital signs measurements recorded and analyzed',
      'Insurance Claim Processed': 'Insurance claim has been submitted and processed',
      'Medication Reminder': 'Medication adherence reminder sent and acknowledged',
      'Health Alert Resolved': 'Critical health alert has been reviewed and resolved',
      'Record Shared': 'Medical records shared with authorized healthcare provider'
    };
    
    const categories = ['medical', 'data', 'appointment', 'system', 'insurance', 'medication'];
    const statuses = ['completed', 'pending', 'in-progress'];
    
    const mockActivities = Array.from({length: 8}, (_, index) => {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)] || 'Health Data Synced';
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      return {
        id: `activity-${Date.now()}-${index}`,
        type,
        description: descriptions[type] || 'Health system activity completed',
        timestamp: timestamp.toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)] || 'completed',
        category: categories[Math.floor(Math.random() * categories.length)] || 'system'
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    logger.info(`Dashboard activity requested by user: ${user?.userId}`);

    return res.status(200).json({
      status: 'success',
      data: { activities: mockActivities },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Dashboard activity error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'DASHBOARD_ACTIVITY_FAILED',
        message: 'Failed to load dashboard activity',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Health alerts endpoint
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const alertTypes = ['critical', 'warning', 'info', 'medication', 'appointment'];
    const mockAlerts = Array.from({length: Math.floor(Math.random() * 5) + 2}, (_, index) => {
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
      
      let message = '';
      switch(type) {
        case 'critical':
          message = 'Blood pressure reading outside normal range - please contact your doctor';
          break;
        case 'warning': 
          message = 'Medication refill needed within 3 days';
          break;
        case 'info':
          message = 'Your latest lab results are now available for review';
          break;
        case 'medication':
          message = 'Time to take your prescribed medication';
          break;
        case 'appointment':
          message = 'Upcoming appointment reminder: Tomorrow at 2:00 PM';
          break;
      }
      
      return {
        id: `alert-${Date.now()}-${index}`,
        type,
        message,
        timestamp: timestamp.toISOString(),
        isRead: Math.random() > 0.3,
        priority: type === 'critical' ? 'high' : type === 'warning' ? 'medium' : 'low'
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.status(200).json({
      status: 'success',
      data: { alerts: mockAlerts },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Dashboard alerts error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'DASHBOARD_ALERTS_FAILED',
        message: 'Failed to load health alerts',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Health trends endpoint
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { period = '7d' } = req.query;
    
    let days = 7;
    if (period === '30d') days = 30;
    else if (period === '90d') days = 90;
    
    const trends = {
      vitals: {
        heartRate: Array.from({length: days}, (_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 20) + 70
        })),
        bloodPressure: Array.from({length: days}, (_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          systolic: Math.floor(Math.random() * 20) + 110,
          diastolic: Math.floor(Math.random() * 15) + 70
        })),
        weight: Array.from({length: days}, (_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 5) + 70
        }))
      },
      activity: {
        steps: Array.from({length: days}, (_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 3000) + 7000
        })),
        sleep: Array.from({length: days}, (_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 2) + 7
        })),
        exercise: Array.from({length: days}, (_, i) => ({
          date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          minutes: Math.floor(Math.random() * 60) + 20
        }))
      }
    };

    return res.status(200).json({
      status: 'success',
      data: trends,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Dashboard trends error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'DASHBOARD_TRENDS_FAILED',
        message: 'Failed to load health trends',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
