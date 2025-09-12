import { Router } from 'express';

const router = Router();

// TODO: Implement ABHA integration routes
// - POST /abha/generate-otp
// - POST /abha/verify-otp
// - POST /abha/create-health-id
// - GET /abha/profile
// - PUT /abha/profile

router.get('/status', (req, res) => {
  res.json({ message: 'ABHA integration routes coming soon' });
});

export default router;
