import { Router } from 'express';

const router = Router();

// TODO: Implement doctor routes
// - GET /doctors
// - GET /doctors/:id
// - POST /doctors
// - PUT /doctors/:id
// - GET /doctors/:id/patients
// - GET /doctors/:id/appointments

router.get('/status', (req, res) => {
  res.json({ message: 'Doctor routes coming soon' });
});

export default router;
