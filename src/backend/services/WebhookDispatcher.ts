import axios from 'axios';
import { Logger } from '../infrastructure/Logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WebhookDispatcher {
  /**
   * Dispatch an event to all subscribed external systems with retry & backoff.
   */
  static async dispatchEvent(eventType: string, payload: any): Promise<void> {
    try {
      const subscriptions = await prisma.webhookSubscription.findMany({
        where: { isActive: true, events: { contains: eventType } }
      });

      if (subscriptions.length === 0) return;

      Logger.info(`[UECP] Dispatching event ${eventType} to ${subscriptions.length} systems.`);

      for (const sub of subscriptions) {
        // Run asynchronously without awaiting so we don't block the caller
        this.sendWithRetry(sub, eventType, payload).catch(err => {
          Logger.error(`[UECP] Exhausted retries for ${sub.systemName}: ${err}`);
        });
      }
    } catch (error) {
      Logger.error(`[UECP] Failed to fetch subscriptions: ${error}`);
    }
  }

  private static async sendWithRetry(subscription: any, eventType: string, payload: any, attempt = 1): Promise<void> {
    const maxAttempts = 3;
    const backoff = attempt * 1000;

    try {
      await axios.post(subscription.endpointUrl, {
        event: eventType,
        data: payload,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(subscription.secretKey ? { 'Authorization': `Bearer ${subscription.secretKey}` } : {})
        },
        timeout: 5000
      });
      
      Logger.info(`[UECP] Successfully dispatched ${eventType} to ${subscription.systemName}`);
    } catch (error: any) {
      if (attempt < maxAttempts) {
        Logger.warn(`[UECP] Retry ${attempt}/${maxAttempts} for ${subscription.systemName} in ${backoff}ms`);
        await new Promise(res => setTimeout(res, backoff));
        return this.sendWithRetry(subscription, eventType, payload, attempt + 1);
      } else {
        throw new Error(`Failed to dispatch after ${maxAttempts} attempts. Last error: ${error.message}`);
      }
    }
  }
}
