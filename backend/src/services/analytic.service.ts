// backend/src/services/analytic.service.ts
// QStash replaces Kafka

import { AnalyticsEvent } from '../models/types';
import { logger } from '../utils/logger';

class AnalyticsService {
  private qstashUrl = 'https://qstash.upstash.io/v2/publish';
  private qstashToken = process.env.QSTASH_TOKEN;
  private webhookUrl = process.env.QSTASH_WEBHOOK_URL;
  private isEnabled = false;

  constructor() {
    logger.info(`🔍 QStash Config Check:`);
    logger.info(`   Token: ${this.qstashToken ? 'SET ✅' : 'MISSING ❌'}`);
    logger.info(`   Webhook URL: ${this.webhookUrl || 'MISSING ❌'}`);
    
    if (this.qstashToken && this.webhookUrl) {
      this.isEnabled = true;
      logger.info('✅ QStash analytics enabled');
    } else {
      logger.warn('⚠️  QStash not configured - analytics disabled');
      if (!this.qstashToken) logger.warn('   Missing QSTASH_TOKEN');
      if (!this.webhookUrl) logger.warn('   Missing QSTASH_WEBHOOK_URL');
    }
  }

  async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) {
      logger.debug('Analytics disabled, skipping event');
      return;
    }

    try {
      const targetUrl = this.webhookUrl!;
      
      logger.info(`📤 Sending to QStash for: ${targetUrl}`);
      
      const response = await fetch(this.qstashUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.qstashToken}`,
          'Content-Type': 'application/json',
          'Upstash-Forward': targetUrl,
        },
        body: JSON.stringify(event),
      });

      if (response.ok) {
        const result = await response.json() as { messageId?: string };
        logger.info(`📊 Analytics event sent to QStash: ${event.eventType}`);
        if (result.messageId) {
          logger.info(`   Message ID: ${result.messageId}`);
        }
      } else {
        const errorText = await response.text();
        logger.error(`❌ QStash publish failed (${response.status}): ${errorText}`);
      }
    } catch (error: any) {
      logger.error(`❌ QStash error: ${error.message}`);
      if (error.stack) {
        logger.error(`   Stack: ${error.stack.split('\n')[0]}`);
      }
    }
  }

  async gameStarted(
    gameId: string,
    player1: string,
    player2: string,
    isVsBot: boolean
  ): Promise<void> {
    await this.sendEvent({
      eventType: 'game_started',
      gameId,
      timestamp: new Date(),
      data: { player1, player2, isVsBot },
    });
  }

  async gameEnded(
    gameId: string,
    winner: string | undefined,
    duration: number,
    isVsBot: boolean
  ): Promise<void> {
    await this.sendEvent({
      eventType: 'game_ended',
      gameId,
      timestamp: new Date(),
      data: { winner, duration, isVsBot },
    });
  }

  async moveMade(
    gameId: string,
    playerId: string,
    position: { row: number; col: number }
  ): Promise<void> {
    await this.sendEvent({
      eventType: 'move_made',
      gameId,
      timestamp: new Date(),
      data: { playerId, movePosition: position },
    });
  }

  async playerDisconnected(gameId: string, playerId: string): Promise<void> {
    await this.sendEvent({
      eventType: 'player_disconnected',
      gameId,
      timestamp: new Date(),
      data: { playerId },
    });
  }

  async playerReconnected(gameId: string, playerId: string): Promise<void> {
    await this.sendEvent({
      eventType: 'player_reconnected',
      gameId,
      timestamp: new Date(),
      data: { playerId },
    });
  }
}

export const analyticsService = new AnalyticsService();