import { WebSocketServer, WebSocket } from 'ws';

/**
 * Single Global SpeakSharp 3D Online World Hub (ZERO room codes!).
 * Every player who opens the 3D world automatically joins this single shared planet server.
 */
export function attachGlobalWorldHub(httpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const players = new Map(); // id -> { id, name, pos, fwd, r, jumpH, moving, sprinting, outfit, emote, emoteAt, chat, chatAt, lastSeen }
  let nextSeq = 1;

  httpServer.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    if (url === '/ws' || url.startsWith('/ws?')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  const broadcast = (payload, excludeWs = null) => {
    const raw = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  };

  wss.on('connection', (ws) => {
    const id = `p_${Date.now().toString(36)}_${nextSeq++}`;
    ws._playerId = id;

    // Send welcome packet with assigned ID + snapshot of everyone already online
    ws.send(
      JSON.stringify({
        type: 'welcome',
        id,
        players: Array.from(players.values()),
      })
    );

    ws.on('message', (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      if (msg.type === 'state') {
        const prev = players.get(id) || {};
        const state = {
          id,
          name: typeof msg.name === 'string' ? msg.name.slice(0, 24) : prev.name || 'Courier',
          pos: Array.isArray(msg.pos) && msg.pos.length === 3 ? msg.pos : prev.pos || [0.18, 0.92, 0.34],
          fwd: Array.isArray(msg.fwd) && msg.fwd.length === 3 ? msg.fwd : prev.fwd || [0, 0, 1],
          r: typeof msg.r === 'number' ? msg.r : prev.r || 7.6,
          jumpH: typeof msg.jumpH === 'number' ? msg.jumpH : 0,
          moving: Boolean(msg.moving),
          sprinting: Boolean(msg.sprinting),
          outfit: msg.outfit || prev.outfit || null,
          lastSeen: Date.now(),
        };
        players.set(id, state);
        broadcast({ type: 'player', player: state }, ws);
      } else if (msg.type === 'emote' && typeof msg.emoji === 'string') {
        broadcast({ type: 'emote', id, emoji: msg.emoji.slice(0, 8) }, ws);
      } else if (msg.type === 'chat' && typeof msg.text === 'string') {
        const clean = msg.text.trim().slice(0, 120);
        if (!clean) return;
        const p = players.get(id);
        broadcast(
          {
            type: 'chat',
            id,
            name: p?.name || 'Courier',
            text: clean,
            ts: Date.now(),
          },
          ws
        );
      }
    });

    ws.on('close', () => {
      if (players.delete(id)) {
        broadcast({ type: 'leave', id });
      }
    });
  });

  // Periodic cleanup of stale connections (> 30s without heartbeat)
  const cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - 30000;
    for (const [id, p] of players.entries()) {
      if (p.lastSeen < cutoff) {
        players.delete(id);
        broadcast({ type: 'leave', id });
      }
    }
  }, 10000);
  cleanupTimer.unref?.();

  return wss;
}
