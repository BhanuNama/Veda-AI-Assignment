import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { WSMessage } from '../types';

const clients = new Map<string, Set<WebSocket>>();

function getJobId(req: IncomingMessage): string {
  try {
    const url = new URL(req.url || '', 'ws://localhost');
    return url.searchParams.get('jobId') || 'global';
  } catch {
    return 'global';
  }
}

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const jobId = getJobId(req);

    if (!clients.has(jobId)) clients.set(jobId, new Set());
    clients.get(jobId)!.add(ws);

    ws.send(JSON.stringify({ event: 'connected', data: { jobId } }));

    ws.on('close', () => {
      clients.get(jobId)?.delete(ws);
      if (clients.get(jobId)?.size === 0) clients.delete(jobId);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Error for jobId ${jobId}:`, err.message);
      clients.get(jobId)?.delete(ws);
    });
  });
}

export function broadcast(jobId: string, message: WSMessage): void {
  const sockets = clients.get(jobId);
  if (!sockets || sockets.size === 0) return;

  const payload = JSON.stringify(message);
  const dead: WebSocket[] = [];

  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    } else {
      dead.push(ws);
    }
  });

  dead.forEach((ws) => sockets.delete(ws));
}
