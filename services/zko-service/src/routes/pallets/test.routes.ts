import { Router, Request, Response } from 'express';

const router = Router();

// Test endpoint - sprawdzenie czy zmiany są widoczne
router.get('/test-version', (req: Request, res: Response) => {
  res.json({ 
    version: 'v2-fixed',
    timestamp: new Date().toISOString(),
    message: 'Pallets module is working - NEW VERSION'
  });
});

export default router;
