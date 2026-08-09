import { Queue, Worker, Job } from 'bullmq';
import CircuitBreaker from 'opossum';
import { redisManager } from '../infrastructure/RedisClient';
import { prisma } from '../../db/client';

export class UECPOutboundService {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private breaker: CircuitBreaker | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Only initialize if Redis is connected
    if (redisManager.isConnected) {
      this.queue = new Queue('UECP_Outbound_Queue', { connection: redisManager.client as any });

      // Opossum Circuit Breaker Options
      const breakerOptions = {
        timeout: 5000,           // If request takes longer than 5s, trigger a failure
        errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
        resetTimeout: 30000      // Wait 30s before trying again (Half-Open state)
      };

      // The actual async function to call external webhooks
      const fireWebhook = async (payload: any) => {
        const response = await fetch(payload.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-HMAC-Signature': payload.signature // Pre-calculated
          },
          body: JSON.stringify(payload.data)
        });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return response.json();
      };

      this.breaker = new CircuitBreaker(fireWebhook, breakerOptions);

      // Circuit Breaker Event Listeners for SOC Auditing
      this.breaker.on('open', () => console.warn('[UECP CircuitBreaker] CIRCUIT TRIPPED - External System Down'));
      this.breaker.on('halfOpen', () => console.info('[UECP CircuitBreaker] HALF OPEN - Testing recovery...'));
      this.breaker.on('close', () => console.info('[UECP CircuitBreaker] CLOSED - External System Recovered'));

      // Worker processing the Queue
      this.worker = new Worker('UECP_Outbound_Queue', async (job: Job) => {
        try {
          await this.breaker!.fire(job.data);
          // Async Log Success
          await this.logAuditAsync(job.data.systemId, 'OUTBOUND', job.data.targetUrl, 200, null);
        } catch (error: any) {
          // Log Failure
          await this.logAuditAsync(job.data.systemId, 'OUTBOUND', job.data.targetUrl, 500, error.message);
          throw error; // Let BullMQ handle the exponential backoff retry
        }
      }, { connection: redisManager.client as any });
    }
  }

  /**
   * Enqueues an event to be sent to an external system
   * Employs Exponential Backoff for retries
   */
  public async dispatchWebhook(systemId: string, targetUrl: string, data: any, signature: string) {
    if (!this.queue) {
      console.warn('[UECP_Outbound] Redis disconnected. Cannot queue webhook.');
      return;
    }

    await this.queue.add('send_webhook', {
      systemId,
      targetUrl,
      data,
      signature
    }, {
      attempts: 10,                 // Try up to 10 times
      backoff: {
        type: 'exponential',        // 1s, 2s, 4s, 8s, 16s...
        delay: 1000
      }
    });
  }

  private async logAuditAsync(systemId: string, direction: string, endpoint: string, status: number, errorMsg: string | null) {
    prisma.uECPAuditLog.create({
      data: {
        systemId,
        direction,
        endpoint,
        status,
        errorMessage: errorMsg
      }
    }).catch(() => {});
  }
}

export const uecpOutboundService = new UECPOutboundService();
