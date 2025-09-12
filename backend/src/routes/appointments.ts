import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Get user appointments
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const mockAppointments = [
      {
        id: 'apt-1',
        doctorName: 'Dr. Sarah Smith',
        specialty: 'Cardiology',
        facility: 'City Medical Center',
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        appointmentTime: '10:00 AM',
        duration: 30,
        type: 'Follow-up',
        status: 'confirmed',
        reason: 'Blood pressure check',
        location: '123 Medical Plaza, Room 204',
        telehealth: false,
        preparation: ['Bring current medications list', 'Fast for 8 hours before appointment'],
        reminderSent: true
      },
      {
        id: 'apt-2',
        doctorName: 'Dr. Michael Johnson',
        specialty: 'Endocrinology',
        facility: 'Diabetes Care Clinic',
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        appointmentTime: '2:30 PM',
        duration: 45,
        type: 'Consultation',
        status: 'confirmed',
        reason: 'Diabetes management review',
        location: '456 Health Street, Suite 302',
        telehealth: false,
        preparation: ['Bring glucose meter', 'Record blood sugar levels for past week'],
        reminderSent: false
      },
      {
        id: 'apt-3',
        doctorName: 'Dr. Lisa Wilson',
        specialty: 'General Practice',
        facility: 'Virtual Health Clinic',
        appointmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        appointmentTime: '11:00 AM',
        duration: 20,
        type: 'Telehealth',
        status: 'pending',
        reason: 'Annual wellness check',
        location: 'Virtual - Zoom link will be provided',
        telehealth: true,
        preparation: ['Ensure stable internet connection', 'Have recent lab results ready'],
        reminderSent: false
      }
    ];

    return res.status(200).json({
      status: 'success',
      data: { appointments: mockAppointments },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Appointments fetch error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'APPOINTMENTS_FETCH_FAILED',
        message: 'Failed to load appointments',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Schedule new appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { doctorId, facility, appointmentDate, appointmentTime, reason, type } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_APPOINTMENT_DATA',
          message: 'Doctor ID, date, time, and reason are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const newAppointment = {
      id: `apt-${Date.now()}`,
      doctorId,
      doctorName: `Dr. ${doctorId}`, // In real app, fetch from doctor service
      facility: facility || 'Medical Center',
      appointmentDate,
      appointmentTime,
      duration: 30,
      type: type || 'Consultation',
      status: 'pending',
      reason,
      location: 'To be confirmed',
      telehealth: false,
      preparation: [],
      reminderSent: false,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    logger.info(`Appointment scheduled - User: ${user.id}, Doctor: ${doctorId}, Date: ${appointmentDate}`);

    return res.status(201).json({
      status: 'success',
      data: newAppointment,
      message: 'Appointment scheduled successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Schedule appointment error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'SCHEDULE_APPOINTMENT_FAILED',
        message: 'Failed to schedule appointment',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Cancel appointment
router.delete('/:appointmentId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { appointmentId } = req.params;
    const { reason } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        error: {
          status: 'error',
          statusCode: 400,
          code: 'MISSING_APPOINTMENT_ID',
          message: 'Appointment ID is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    logger.info(`Appointment cancelled - User: ${user.id}, Appointment: ${appointmentId}, Reason: ${reason}`);

    return res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      data: {
        appointmentId,
        cancelledAt: new Date().toISOString(),
        cancelledBy: user.id,
        reason: reason || 'No reason provided'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Cancel appointment error:', error);
    return res.status(500).json({
      error: {
        status: 'error',
        statusCode: 500,
        code: 'CANCEL_APPOINTMENT_FAILED',
        message: 'Failed to cancel appointment',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
