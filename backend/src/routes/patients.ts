import { Router } from 'express';

const router = Router();

// TODO: Implement patient routes
// - GET /patients
// - GET /patients/:id
// - POST /patients
// - PUT /patients/:id
// - DELETE /patients/:id
// - GET /patients/:id/medical-records
// - POST /patients/:id/family-link

router.get('/status', (req, res) => {
  res.json({ message: 'Patient routes coming soon' });
});

export default router;
