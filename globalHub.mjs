import { WebSocketServer, WebSocket } from 'ws';

/**
 * Single Global SpeakSharp 3D Online World Hub (ZERO room codes!).
 * Supports both World 1 (`planet1`) and World 2 (`planet2`) automatically via `/ws?world=...`.
 */
export function attachGlobalWorldHub(httpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const worlds = new Map(); // worldName -> Map<id, playerState>
  let nextSeq = 1;

  const getWorldMap = (worldName) => {
    let m = worlds.get(worldName);
    if (!m) {
      m = new Map();
      worlds.set(worldName, m);
    }
    return m;
  };

  httpServer.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    if (url === '/ws' || url.startsWith('/ws?')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  const broadcastWorld = (worldName, payload, excludeWs = null) => {
    const raw = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (
        client !== excludeWs &&
        client._worldName === worldName &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(raw);
      }
    }
  };

  wss.on('connection', (ws, req) => {
    const parsed = new URL(req.url || '/ws', 'http://localhost');
    const worldName = parsed.searchParams.get('world') === 'planet2' ? 'planet2' : 'planet1';
    const players = getWorldMap(worldName);
    const id = `p_${Date.now().toString(36)}_${nextSeq++}`;
    ws._playerId = id;
    ws._worldName = worldName;

    // Send welcome packet with assigned ID + snapshot of everyone already online in this world
    ws.send(
      JSON.stringify({
        type: 'welcome',
        id,
        world: worldName,
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
          quat: Array.isArray(msg.quat) && msg.quat.length === 4 ? msg.quat : prev.quat || null,
          r: typeof msg.r === 'number' ? msg.r : prev.r || 7.6,
          jumpH: typeof msg.jumpH === 'number' ? msg.jumpH : 0,
          moving: Boolean(msg.moving),
          sprinting: Boolean(msg.sprinting),
          outfit: msg.outfit || prev.outfit || null,
          lastSeen: Date.now(),
        };
        players.set(id, state);
        broadcastWorld(worldName, { type: 'player', player: state }, ws);
      } else if (msg.type === 'outfit' && msg.outfit) {
        const prev = players.get(id) || { id };
        prev.outfit = msg.outfit;
        if (typeof msg.name === 'string') prev.name = msg.name.slice(0, 24);
        prev.lastSeen = Date.now();
        players.set(id, prev);
        broadcastWorld(worldName, { type: 'outfit', id, name: prev.name, outfit: prev.outfit }, ws);
      } else if (msg.type === 'emote' && typeof msg.emoji === 'string') {
        broadcastWorld(worldName, { type: 'emote', id, emoji: msg.emoji.slice(0, 8) }, ws);
      } else if (msg.type === 'chat' && typeof msg.text === 'string') {
        const clean = msg.text.trim().slice(0, 120);
        if (!clean) return;
        const p = players.get(id);
        broadcastWorld(
          worldName,
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
        broadcastWorld(worldName, { type: 'leave', id });
      }
    });
  });

  // Periodic cleanup of stale connections (> 30s without heartbeat)
  const cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - 30000;
    for (const [worldName, players] of worlds.entries()) {
      for (const [id, p] of players.entries()) {
        if (p.lastSeen < cutoff) {
          players.delete(id);
          broadcastWorld(worldName, { type: 'leave', id });
        }
      }
    }
  }, 10000);
  cleanupTimer.unref?.();

  return wss;
}
