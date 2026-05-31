import { Request, Response } from 'express';

export interface SignalEvent {
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'DANGER';
  message: string;
  targetRole?: string;
  targetDepartment?: string;
  metadata?: any;
}

class NotificationEngineClass {
  private clients: { id: string; res: Response; role: string; department: string }[] = [];

  public handleConnection(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE

    const user = (req as any).user;
    const role = user?.role || 'Guest';
    const department = user?.department || 'None';
    const clientId = Date.now().toString();

    const newClient = { id: clientId, res, role, department };
    this.clients.push(newClient);

    req.on('close', () => {
      this.clients = this.clients.filter(client => client.id !== clientId);
    });
  }

  public broadcast(event: SignalEvent) {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    
    this.clients.forEach(client => {
      let shouldSend = false;
      
      if (!event.targetRole && !event.targetDepartment) {
        shouldSend = true; // Global broadcast
      } else if (event.targetRole && client.role === event.targetRole) {
        shouldSend = true;
      } else if (event.targetDepartment && client.department === event.targetDepartment) {
        shouldSend = true;
      }

      if (shouldSend) {
        client.res.write(payload);
      }
    });
  }
}

export const NotificationEngine = new NotificationEngineClass();
