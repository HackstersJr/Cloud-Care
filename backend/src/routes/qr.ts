import { Router } from 'express';

const router = Router();

// TODO: Implement QR code routes for data sharing
// - POST /qr/generate
// - GET /qr/access/:token
// - POST /qr/validate

router.get('/status', (req, res) => {
  res.json({ message: 'QR code routes coming soon' });
});

export default router;
