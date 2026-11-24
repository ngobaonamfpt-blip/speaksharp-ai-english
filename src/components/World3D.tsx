import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { MessengerProWorld } from './MessengerProWorld';

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
  const [worldEngine, setWorldEngine] = useState<'native3d' | 'multiplayer'>('native3d');
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
    const parentParams = new URLSearchParams(window.location.search);
    const joinId = parentParams.get('join');
    if (joinId) params.set('join', joinId);
    return `/messenger-game.html?${params.toString()}`;
  }, [userName]);

  // Listen for XP rewards when playing the PeerJS Multiplayer planet
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
      ) : (
        <iframe
          ref={iframeRef}
          src={multiplayerUrl}
          title="SpeakSharp Multiplayer 3D Planet"
          allow="autoplay; clipboard-write; fullscreen"
          onLoad={() => iframeRef.current?.contentWindow?.focus()}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
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

      {/* Bottom-Left World Switcher & Fullscreen Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          display: 'inline-flex',
          gap: 6,
          flexWrap: 'wrap',
          zIndex: 30,
        }}
      >
        <button
          onClick={() => setWorldEngine((w) => (w === 'native3d' ? 'multiplayer' : 'native3d'))}
          style={{
            border: '2px solid #232a2f',
            background: '#141517',
            color: '#f5bd33',
            padding: '6px 11px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 3px 0 #232a2f',
          }}
        >
          {worldEngine === 'native3d' ? '🌍 Hành tinh Messenger 3D' : '🌐 Phòng Multiplayer (PeerJS)'}
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          style={{
            border: '2px solid #232a2f',
            background: 'rgba(255, 253, 247, 0.94)',
            color: '#232a2f',
            padding: '6px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 3px 0 #232a2f',
          }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>

        {worldEngine === 'multiplayer' && (
          <a
            href={multiplayerUrl}
            target="_blank"
            rel="noreferrer"
            title="Mở ở tab mới (dùng để test Multiplayer 2 tab!)"
            style={{
              border: '2px solid #232a2f',
              background: '#f5bd33',
              color: '#141517',
              padding: '6px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 3px 0 #232a2f',
            }}
          >
            <ExternalLink size={14} />
            <span>Mở tab mới</span>
          </a>
        )}
      </div>
    </div>
  );
};
