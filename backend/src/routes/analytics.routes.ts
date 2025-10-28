import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Webhook endpoint for QStash
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    logger.info(`📊 Analytics webhook received: ${event.eventType}`);
    logger.info(`   Game ID: ${event.gameId}`);
    logger.info(`   Data: ${JSON.stringify(event.data)}`);
    
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing analytics webhook:', error);
    res.status(500).json({ error: 'Failed to process' });
  }
});

// Get metrics endpoint (optional, for viewing stats)
router.get('/metrics', (req, res) => {
  res.json({ message: 'Analytics metrics endpoint' });
});

export default router;