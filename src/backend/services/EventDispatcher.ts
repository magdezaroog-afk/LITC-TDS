import { EventEmitter } from 'events';
import { redisManager } from '../infrastructure/RedisClient';

class EventDispatcher extends EventEmitter {
  constructor() {
    super();
    this.setupRedisListener();
  }

  private setupRedisListener() {
    if (redisManager.sub) {
      redisManager.sub.subscribe('LITC_SYSTEM_EVENTS', (err) => {
        if (err) console.error('[EventDispatcher] Failed to subscribe to Redis', err);
      });

      redisManager.sub.on('message', (channel, message) => {
        if (channel === 'LITC_SYSTEM_EVENTS') {
          try {
            const eventData = JSON.parse(message);
            // Re-emit locally for local listeners
            this.emit(eventData.eventName, eventData.payload);
          } catch (e) {
            console.error('[EventDispatcher] Error parsing event', e);
          }
        }
      });
    }
  }

  /**
   * Dispatches an event to the whole cluster (Redis) and locally (EventEmitter)
   */
  public dispatch(eventName: string, payload: any) {
    // 1. Emit locally for listeners on this specific Node
    this.emit(eventName, payload);

    // 2. Broadcast via Redis to all other Nodes/External Systems (UECP Prep)
    if (redisManager.client && redisManager.isConnected) {
      const message = JSON.stringify({ eventName, payload, timestamp: new Date() });
      redisManager.publish('LITC_SYSTEM_EVENTS', message);
    }
  }
}

export const eventDispatcher = new EventDispatcher();

// Useful standard event names
export const SYSTEM_EVENTS = {
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_STATE_CHANGED: 'TICKET_STATE_CHANGED',
  TICKET_SLA_BREACHED: 'TICKET_SLA_BREACHED',
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',
};
