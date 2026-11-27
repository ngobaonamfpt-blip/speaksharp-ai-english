import type { HairStyle, TopStyle } from './playerController';

export interface OnlineOutfit {
  hat: string;
  shirt: string;
  pants: string;
  shoe: string;
  bag: string;
  hair: HairStyle;
  top: TopStyle;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  pos: [number, number, number];
  fwd: [number, number, number];
  r: number;
  jumpH: number;
  moving: boolean;
  sprinting: boolean;
  outfit?: OnlineOutfit | null;
}

export interface OnlineChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
}

interface GlobalOnlineCallbacks {
  onStatusChange: (connected: boolean, onlineCount: number) => void;
  onPlayerUpdate: (player: RemotePlayerState) => void;
  onPlayerLeave: (id: string) => void;
  onPlayerEmote: (id: string, emoji: string) => void;
  onChat: (msg: OnlineChatMessage) => void;
}

/**
 * Zero-code Single Global Server WebSocket client.
 * Connects automatically to `/ws` on the current host (both localhost dev & Railway production).
 */
export class GlobalOnlineClient {
  private ws: WebSocket | null = null;
  private myId: string | null = null;
  private remoteIds = new Set<string>();
  private closed = false;
  private reconnectTimer: number | null = null;
  private callbacks: GlobalOnlineCallbacks;
  private worldId: string;

  constructor(callbacks: GlobalOnlineCallbacks, worldId = 'planet1') {
    this.callbacks = callbacks;
    this.worldId = worldId;
    this.connect();
  }

  private getWsUrl(): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws?world=${encodeURIComponent(this.worldId)}`;
  }

  private connect() {
    if (this.closed) return;
    try {
      const ws = new WebSocket(this.getWsUrl());
      this.ws = ws;

      ws.onopen = () => {
        this.callbacks.onStatusChange(true, this.remoteIds.size + 1);
      };

      ws.onmessage = (ev) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (msg.type === 'welcome' && typeof msg.id === 'string') {
          this.myId = msg.id;
          this.remoteIds.clear();
          const list = Array.isArray(msg.players) ? (msg.players as RemotePlayerState[]) : [];
          for (const p of list) {
            if (p.id !== this.myId) {
              this.remoteIds.add(p.id);
              this.callbacks.onPlayerUpdate(p);
            }
          }
          this.callbacks.onStatusChange(true, this.remoteIds.size + 1);
        } else if (msg.type === 'player' && msg.player) {
          const p = msg.player as RemotePlayerState;
          if (p.id === this.myId) return;
          this.remoteIds.add(p.id);
          this.callbacks.onPlayerUpdate(p);
          this.callbacks.onStatusChange(true, this.remoteIds.size + 1);
        } else if (msg.type === 'leave' && typeof msg.id === 'string') {
          this.remoteIds.delete(msg.id);
          this.callbacks.onPlayerLeave(msg.id);
          this.callbacks.onStatusChange(true, this.remoteIds.size + 1);
        } else if (msg.type === 'emote' && typeof msg.id === 'string' && typeof msg.emoji === 'string') {
          if (msg.id !== this.myId) {
            this.callbacks.onPlayerEmote(msg.id, msg.emoji);
          }
        } else if (msg.type === 'chat' && typeof msg.text === 'string') {
          this.callbacks.onChat({
            id: String(msg.id ?? ''),
            name: String(msg.name ?? 'Courier'),
            text: msg.text,
            ts: Number(msg.ts ?? Date.now()),
          });
        }
      };

      ws.onclose = () => {
        this.ws = null;
        this.callbacks.onStatusChange(false, 1);
        if (!this.closed) {
          this.reconnectTimer = window.setTimeout(() => this.connect(), 2500);
        }
      };

      ws.onerror = () => {
        // onclose handles reconnect cleanly
      };
    } catch {
      this.callbacks.onStatusChange(false, 1);
    }
  }

  sendState(state: Omit<RemotePlayerState, 'id'>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'state', ...state }));
    }
  }

  sendEmote(emoji: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'emote', emoji }));
    }
  }

  sendChat(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'chat', text }));
    }
  }

  dispose() {
    this.closed = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}
