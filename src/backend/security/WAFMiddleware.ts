import { Request, Response, NextFunction } from 'express';
import { SIEMLogger } from './SIEMLogger';
import { prisma } from '../../db/client';
import { redisManager } from '../infrastructure/RedisClient';

export class WAFMiddleware {
  // Built-in Static Protection
  private static readonly SQLI_PATTERN = /(\b(SELECT|UPDATE|DELETE|INSERT|DROP|ALTER|UNION)\b)|(['"]\s*(OR|AND)\s*['"]?1['"]?\s*=\s*['"]?1)/i;
  private static readonly XSS_PATTERN = /(<script.*?>.*?<\/script>)|(javascript:)|(onerror=)|(onload=)/i;
  private static readonly PATH_TRAVERSAL_PATTERN = /(\.\.\/)|(\.\.\\)/;

  // In-Memory Cache for Dynamic Rules (O(1) lookup to protect Main Thread)
  private static blockedIPs: Set<string> = new Set();
  private static blockedPayloads: RegExp[] = [];
  
  // Cache Refresher (Syncs from DB every 30s instead of per-request)
  public static async refreshRulesCache() {
    try {
      const activeRules = await prisma.wAFRule.findMany({ where: { isActive: true } });
      const newBlockedIPs = new Set<string>();
      const newBlockedPayloads: RegExp[] = [];
      
      activeRules.forEach(rule => {
        if (rule.ruleType === 'IP_BLOCK') {
          newBlockedIPs.add(rule.target);
        } else if (rule.ruleType === 'PAYLOAD_BLOCK') {
          try { newBlockedPayloads.push(new RegExp(rule.target, 'i')); } catch(e) {}
        }
      });
      
      WAFMiddleware.blockedIPs = newBlockedIPs;
      WAFMiddleware.blockedPayloads = newBlockedPayloads;
      console.log(`[WAF Cache] Refreshed: ${newBlockedIPs.size} IPs, ${newBlockedPayloads.length} Payloads`);
    } catch (err) {
      console.error('[WAF Cache] Failed to refresh rules from DB:', err);
    }
  }

  /**
   * Software WAF Interceptor (High Performance O(1) matching)
   */
  static shield(req: Request, res: Response, next: NextFunction) {
    const sourceIp = req.ip || req.socket.remoteAddress || 'UNKNOWN';

    // 1. Dynamic IP Block (O(1) lookup)
    if (WAFMiddleware.blockedIPs.has(sourceIp)) {
      SIEMLogger.logEvent('WAF_BLOCK_DYNAMIC_IP', 'WARNING', sourceIp, { url: req.url });
      return res.status(403).json({ error: 'Access Denied: Your IP is banned by WAF Policy.' });
    }

    const payload = {
      body: JSON.stringify(req.body || {}),
      query: JSON.stringify(req.query || {}),
      url: req.url
    };
    
    const combinedPayload = `${payload.body} ${payload.query} ${payload.url}`;

    // 2. Dynamic Payload Block
    for (const regex of WAFMiddleware.blockedPayloads) {
      if (regex.test(combinedPayload)) {
        SIEMLogger.logEvent('WAF_BLOCK_DYNAMIC_PAYLOAD', 'CRITICAL', sourceIp, { url: req.url });
        return res.status(403).json({ error: 'Request blocked: Malicious payload matches dynamic WAF rule.' });
      }
    }

    // 3. Static Payload Blocks (SQLi, XSS)
    if (WAFMiddleware.SQLI_PATTERN.test(combinedPayload)) {
      SIEMLogger.logEvent('WAF_BLOCK_SQLI', 'CRITICAL', sourceIp, { url: req.url, payload: payload });
      return res.status(403).json({ error: 'Request blocked by WAF: SQL Injection detected.' });
    }

    if (WAFMiddleware.XSS_PATTERN.test(combinedPayload)) {
      SIEMLogger.logEvent('WAF_BLOCK_XSS', 'WARNING', sourceIp, { url: req.url, payload: payload });
      return res.status(403).json({ error: 'Request blocked by WAF: XSS detected.' });
    }

    if (WAFMiddleware.PATH_TRAVERSAL_PATTERN.test(combinedPayload)) {
      SIEMLogger.logEvent('WAF_BLOCK_PATH_TRAVERSAL', 'CRITICAL', sourceIp, { url: req.url });
      return res.status(403).json({ error: 'Request blocked by WAF: Path traversal detected.' });
    }

    next();
  }
}

// Subscribe to Redis Pub/Sub for instant invalidation across all Nodes
if (redisManager.sub) {
  redisManager.sub.subscribe('WAF_REFRESH', (err) => {
    if (!err) console.log('[WAF] Subscribed to WAF_REFRESH channel.');
  });
  
  redisManager.sub.on('message', (channel, message) => {
    if (channel === 'WAF_REFRESH') {
      console.log('[WAF] Instant Invalidation Triggered by Pub/Sub!');
      WAFMiddleware.refreshRulesCache();
    }
  });
}

// Start cache loop (fallback polling every 60s, just in case)
setInterval(WAFMiddleware.refreshRulesCache, 60000);
// Initial load
setTimeout(WAFMiddleware.refreshRulesCache, 1000);

