import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { MessengerProWorld } from './MessengerProWorld';
import { RoleplayWorld3D } from './RoleplayWorld3D';

type WorldEngineMode = 'native3d' | 'multiplayer' | 'airport' | 'supermarket';

const WORLD_OPTIONS: Array<{ id: WorldEngineMode; badge: string; icon: string; name: string; desc: string }> = [
  { id: 'native3d', badge: '1', icon: '🏝️', name: 'Thị trấn Anime 3D', desc: 'Giao thư & dạo phố biển' },
  { id: 'multiplayer', badge: '2', icon: '🪐', name: 'Hành tinh Online', desc: 'Thế giới mở Multiplayer' },
  { id: 'airport', badge: '3', icon: '✈️', name: 'Sân bay Quốc tế', desc: 'Check-in, An ninh & Gate B12' },
  { id: 'supermarket', badge: '4', icon: '🛒', name: 'Siêu thị Fresh Mart', desc: 'Mua sắm, Bánh nướng & Thu ngân' },
];

interface World3DProps {
  userName: string;
  totalXp: number;
  onEarnXp: (xp: number) => void;
  onSpendXp: (cost: number) => void;
  onEnterDebateArena: () => void;
}

export const World3D: React.FC<World3DProps> = ({
  userName,
  onEarnXp,
  onEnterDebateArena,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [worldEngine, setWorldEngine] = useState<WorldEngineMode>('native3d');
  const [mapMenuOpen, setMapMenuOpen] = useState(false);
  const [xpBanner, setXpBanner] = useState('');

  const handleEarnXp = useCallback(
    (xp: number, reason?: string) => {
      onEarnXp(xp);
      setXpBanner(`+${xp} XP · ${reason || 'Nhiệm vụ 3D hoàn thành!'}`);
      window.setTimeout(() => setXpBanner(''), 3600);
    },
    [onEarnXp]
  );

  const multiplayerUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (userName) params.set('name', userName);
    return `/messenger-game.html?${params.toString()}`;
  }, [userName]);

  // Listen for XP rewards from World 2 (Multiplayer Planet)
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === 'speaksharp-xp' && typeof ev.data.xp === 'number') {
        handleEarnXp(ev.data.xp, ev.data.reason);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleEarnXp]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: 'calc(100vh - 48px)',
        minHeight: 620,
        borderRadius: isFullscreen ? 0 : 22,
        overflow: 'hidden',
        background: '#78cbf8',
        boxShadow: '0 16px 40px rgba(20, 21, 23, 0.14)',
        border: isFullscreen ? 'none' : '2px solid rgba(20, 21, 23, 0.1)',
      }}
    >
      {worldEngine === 'native3d' ? (
        <MessengerProWorld
          userName={userName}
          onEarnXp={handleEarnXp}
          onEnterDebateArena={onEnterDebateArena}
        />
      ) : worldEngine === 'multiplayer' ? (
        <iframe
          ref={iframeRef}
          src={multiplayerUrl}
          title="SpeakSharp Thế giới 2 — Hành tinh Online"
          allow="autoplay; clipboard-write; fullscreen"
          onLoad={() => iframeRef.current?.contentWindow?.focus()}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />
      ) : (
        <RoleplayWorld3D
          mapId={worldEngine}
          userName={userName}
          onEarnXp={handleEarnXp}
        />
      )}

      {/* Live XP Sync Toast to SpeakSharp Profile */}
      {xpBanner && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#141517',
            color: '#f5bd33',
            padding: '8px 18px',
            borderRadius: 999,
            border: '2px solid #f5bd33',
            fontSize: 13,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 10px 24px rgba(0,0,0,0.28)',
            zIndex: 40,
            pointerEvents: 'none',
          }}
        >
          <Sparkles size={15} /> {xpBanner}
        </div>
      )}

      {/* Abeto-Style 4-Map World Switcher Button + Popover Menu (Top-Right below Checklist!) */}
      <button
        className="abeto-btn"
        onClick={() => setMapMenuOpen((v) => !v)}
        title="Chọn bản đồ 3D (Thị trấn · Hành tinh · Sân bay · Siêu thị)"
        style={{
          position: 'absolute',
          top: 70,
          right: 14,
          zIndex: 35,
          width: 46,
          height: 46,
          borderRadius: 12,
          border: '2px solid #243038',
          background:
            mapMenuOpen || worldEngine !== 'native3d'
              ? '#ffd859'
              : 'linear-gradient(180deg, #ffffff 0%, #f6f2e8 100%)',
          color: '#243038',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '3px 4px 0 rgba(36, 48, 56, 0.28), 0 0 0 1px rgba(255,255,255,0.6) inset',
          transition: 'all 0.14s ease',
        }}
      >
        <Globe2 size={21} strokeWidth={2.2} />
        <span
          style={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            background: '#243038',
            color: '#fffdf7',
            fontSize: 9.5,
            fontWeight: 900,
            padding: '1px 5px',
            borderRadius: 999,
            border: '1.5px solid #fffdf7',
            lineHeight: 1.2,
          }}
        >
          {WORLD_OPTIONS.find((o) => o.id === worldEngine)?.badge ?? '1'}
        </span>
      </button>

      {mapMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            right: 70,
            zIndex: 38,
            width: 256,
            background: 'rgba(255, 253, 247, 0.97)',
            border: '2.5px solid #243038',
            boxShadow: '5px 6px 0 rgba(36, 48, 56, 0.28)',
            borderRadius: 16,
            padding: 10,
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 900, color: '#465a67', padding: '2px 4px' }}>
            🗺️ CHỌN BẢN ĐỒ 3D ONLINE (4 MAPS)
          </div>
          {WORLD_OPTIONS.map((opt) => {
            const active = worldEngine === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setWorldEngine(opt.id);
                  setMapMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 11,
                  border: active ? '2px solid #243038' : '1.5px solid #cbd5e1',
                  background: active ? '#fef08a' : '#ffffff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: '#1d2a33' }}>
                    {opt.badge}. {opt.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom-Left Fullscreen Control */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 14,
          display: 'inline-flex',
          gap: 8,
          flexWrap: 'wrap',
          zIndex: 30,
        }}
      >
        <button
          className="abeto-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          style={{
            border: '2px solid #243038',
            background: 'linear-gradient(180deg, #ffffff 0%, #f6f2e8 100%)',
            color: '#465a67',
            padding: '7px 12px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '3px 4px 0 rgba(36, 48, 56, 0.28)',
            transition: 'all 0.14s ease',
          }}
        >
          {isFullscreen ? <Minimize2 size={14} strokeWidth={2.4} /> : <Maximize2 size={14} strokeWidth={2.4} />}
          <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>
      </div>
    </div>
  );
};
