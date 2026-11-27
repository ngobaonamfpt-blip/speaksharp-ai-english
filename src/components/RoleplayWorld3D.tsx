import React, { useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  Compass,
  MapPin,
  MessageCircle,
  Mic,
  Send,
  Volume2,
  X,
} from 'lucide-react';
import {
  AmbientLight,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';
import { AnimeInkPass, inkDisplayOutput, patchMaterialForInk } from '../lib/messenger/animeInkPass';
import {
  cycleGraphicsQuality,
  detectInitialGraphicsQuality,
  disposeObject3D,
  GFX_META,
  type GraphicsQuality,
  saveGraphicsQuality,
} from '../lib/messenger/perfOptimizer';
import { speakEnglish } from '../lib/messenger/englishQuests';
import { GlobalOnlineClient, type OnlineChatMessage, type RemotePlayerState } from '../lib/messenger/onlineClient';
import {
  animateChibi,
  buildChibiCourier,
  createSoftDropShadow,
  createToonGradient,
} from '../lib/messenger/playerController';
import {
  ROLEPLAY_MAPS,
  type RoleplayMapId,
  type RoleplayNpcSpec,
  type RoleplayQuest,
  type RoleplayReplyChoice,
} from '../lib/messenger/roleplayMaps';

interface RoleplayWorld3DProps {
  mapId: RoleplayMapId;
  userName?: string;
  onEarnXp: (xp: number, reason: string) => void;
}

const CHAR_SCALE = 3.15;

const PAPER_BTN_STYLE: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 12,
  background: 'linear-gradient(180deg, #ffffff 0%, #f6f2e8 100%)',
  border: '2px solid #243038',
  boxShadow: '3px 4px 0 rgba(36, 48, 56, 0.28), 0 0 0 1px rgba(255,255,255,0.6) inset',
  color: '#465a67',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  transition: 'transform 0.14s ease, box-shadow 0.14s ease',
};

function makeBadgeTex(done: boolean): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);
  const traceBubble = (ox: number, oy: number) => {
    const x = 18 + ox,
      y = 16 + oy,
      w = 88,
      h = 72,
      r = 20;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + w * 0.5 + 11, y + h);
    ctx.lineTo(x + w * 0.5, y + h + 18);
    ctx.lineTo(x + w * 0.5 - 11, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };
  ctx.fillStyle = '#2d3b45';
  traceBubble(4, 5);
  ctx.fill();
  ctx.fillStyle = done ? '#74e8a4' : '#ffe074';
  ctx.strokeStyle = '#2d3b45';
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  traceBubble(0, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#23303a';
  ctx.font = '900 46px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(done ? '✓' : '!', 62, 53);
  const tex = new CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeNameplateTex(label: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = 'rgba(255, 253, 247, 0.94)';
  ctx.strokeStyle = '#24323c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(14, 10, 228, 44, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1d2a33';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 16), 128, 33);
  const tex = new CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function loadSavedMapQuests(mapId: RoleplayMapId): string[] {
  try {
    const raw = localStorage.getItem(`speaksharp_roleplay_${mapId}_v1`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export const RoleplayWorld3D: React.FC<RoleplayWorld3DProps> = ({
  mapId,
  userName,
  onEarnXp,
}) => {
  const cfg = ROLEPLAY_MAPS[mapId];
  const hostRef = useRef<HTMLDivElement>(null);

  const [completedIds, setCompletedIds] = useState<string[]>(() => loadSavedMapQuests(mapId));
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [nearbyNpc, setNearbyNpc] = useState<RoleplayNpcSpec | null>(null);
  const [activeDialog, setActiveDialog] = useState<{
    npc: RoleplayNpcSpec;
    quest: RoleplayQuest;
    showVi: boolean;
    feedback: string | null;
    completedNow: boolean;
  } | null>(null);
  const [listeningMic, setListeningMic] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [toast, setToast] = useState('');
  const [fps, setFps] = useState(60);
  const [gfxQuality, setGfxQuality] = useState<GraphicsQuality>(() => detectInitialGraphicsQuality());
  const userLockedGfxRef = useRef(false);
  const [onlineConnected, setOnlineConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<OnlineChatMessage[]>([]);

  const liveDialogOpenRef = useRef(false);
  liveDialogOpenRef.current = Boolean(activeDialog);
  const liveGfxRef = useRef<GraphicsQuality>(gfxQuality);
  liveGfxRef.current = gfxQuality;
  const liveCompletedRef = useRef(completedIds);
  liveCompletedRef.current = completedIds;
  const liveUserNameRef = useRef(userName);
  liveUserNameRef.current = userName;
  const onEarnXpRef = useRef(onEarnXp);
  onEarnXpRef.current = onEarnXp;

  const teleportRef = useRef<((npcId: string) => void) | null>(null);
  const interactRef = useRef<(() => void) | null>(null);
  const recenterRef = useRef<(() => void) | null>(null);
  const sendChatRef = useRef<((text: string) => void) | null>(null);
  const virtualKeyRef = useRef<((code: string, down: boolean) => void) | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    setCompletedIds(loadSavedMapQuests(mapId));
    setActiveDialog(null);
    setNearbyNpc(null);
    setChatMessages([]);
  }, [mapId]);

  useEffect(() => {
    try {
      localStorage.setItem(`speaksharp_roleplay_${mapId}_v1`, JSON.stringify(completedIds));
    } catch {
      // ignore
    }
  }, [mapId, completedIds]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const mapCfg = ROLEPLAY_MAPS[mapId];

    const scene = new Scene();
    scene.background = new Color(mapCfg.skyColor);
    scene.fog = new FogExp2(mapCfg.id === 'airport' ? 0xd9f2f7 : 0xf2fbf7, 0.0055);

    const camera = new PerspectiveCamera(50, 1, 0.1, 180);
    const isLowPower =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    const renderer = new WebGLRenderer({
      antialias: !isLowPower,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPower ? 1 : 1.35));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = !isLowPower;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = !isLowPower;
    renderer.shadowMap.type = PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    // Warm sunlit Studio Ghibli architectural lighting + crisp soft shadows
    scene.add(new AmbientLight(0xffffff, 0.72));
    scene.add(new HemisphereLight(0xe0f7fa, 0xd6cfc2, 0.62));
    const sun = new DirectionalLight(0xfff5e0, 1.15);
    sun.position.set(14, 22, -16);
    if (!isLowPower) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 2;
      sun.shadow.camera.far = 60;
      sun.shadow.camera.left = -16;
      sun.shadow.camera.right = 16;
      sun.shadow.camera.top = 16;
      sun.shadow.camera.bottom = -16;
      sun.shadow.bias = -0.0004;
    }
    scene.add(sun);

    const toonGradient = createToonGradient();
    const updateMapProps = mapCfg.buildScene(scene, toonGradient);
    const animeInk = new AnimeInkPass(
      Math.max(1, host.clientWidth),
      Math.max(1, host.clientHeight),
      camera
    );

    // Build Player Avatar (same sculpted anime character as World 1!)
    const player = buildChibiCourier(toonGradient, {
      hatColor: 0x34424d,
      shirtColor: 0xc6514d,
      pantsColor: 0x26313d,
      shoeColor: 0x1c2128,
      bagColor: 0x36404a,
      hairStyle: 'bob',
      topStyle: 'coat',
    });
    player.scale.setScalar(CHAR_SCALE);
    player.add(createSoftDropShadow(0.18));
    scene.add(player);

    const pState = {
      x: mapCfg.spawn.x,
      z: mapCfg.spawn.z,
      y: 0,
      vy: 0,
      yaw: mapCfg.spawn.yaw,
      camYaw: mapCfg.spawn.yaw,
      camDist: 5.5,
      camPitch: 0.28,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    // Snap camera immediately to spawn over-the-shoulder view (no initial backward lerp!)
    {
      const initHoriz = Math.cos(pState.camPitch) * pState.camDist;
      camera.position.set(
        pState.x - Math.sin(pState.camYaw) * initHoriz,
        1.45 + Math.sin(pState.camPitch) * pState.camDist,
        pState.z - Math.cos(pState.camYaw) * initHoriz
      );
      camera.lookAt(pState.x, 1.1, pState.z);
    }

    // Build Quest NPCs
    const badgeTodo = makeBadgeTex(false);
    const badgeDone = makeBadgeTex(true);
    const npcNodes: Array<{
      spec: RoleplayNpcSpec;
      group: Group;
      ring: Mesh;
      badge: Sprite;
      badgeDone: boolean;
    }> = [];

    mapCfg.npcs.forEach((spec) => {
      const grp = buildChibiCourier(toonGradient, spec.style);
      grp.name = 'AnimatedNpc';
      grp.scale.setScalar(CHAR_SCALE);
      grp.position.set(spec.x, 0, spec.z);
      grp.rotation.y = spec.facingYaw;
      grp.add(createSoftDropShadow(0.18));
      scene.add(grp);

      const ring = new Mesh(
        new RingGeometry(0.55, 0.75, 22),
        new MeshBasicMaterial({
          color: 0xf5bd33,
          transparent: true,
          opacity: 0.72,
          side: DoubleSide,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(spec.x, 0.03, spec.z);
      scene.add(ring);

      const isDoneInit = liveCompletedRef.current.includes(spec.id);
      const badge = new Sprite(
        new SpriteMaterial({
          map: isDoneInit ? badgeDone : badgeTodo,
          transparent: true,
          depthWrite: false,
        })
      );
      badge.scale.set(0.7, 0.7, 1);
      badge.position.set(spec.x, 2.05, spec.z);
      scene.add(badge);

      npcNodes.push({ spec, group: grp, ring, badge, badgeDone: isDoneInit });
    });

    // Build Strolling Background NPCs
    const strollers = mapCfg.strollers.map((s) => {
      const grp = buildChibiCourier(toonGradient, s.style);
      grp.name = 'AnimatedNpc';
      grp.scale.setScalar(CHAR_SCALE);
      grp.position.set(s.waypoints[0][0], 0, s.waypoints[0][1]);
      grp.add(createSoftDropShadow(0.16));
      scene.add(grp);
      return {
        group: grp,
        waypoints: s.waypoints,
        wpIdx: 1,
        x: s.waypoints[0][0],
        z: s.waypoints[0][1],
        yaw: 0,
        pauseUntil: 0,
        speed: s.speed,
        phase: s.phase,
      };
    });

    // Single Global Online Server for this map (`airport` or `supermarket`)
    const remotePlayers = new Map<
      string,
      {
        group: Group;
        nameSprite: Sprite;
        tx: number;
        tz: number;
        ty: number;
        cx: number;
        cz: number;
        cy: number;
        tyaw: number;
        cyaw: number;
        moving: boolean;
        sprinting: boolean;
      }
    >();

    const onlineClient = new GlobalOnlineClient(
      {
        onStatusChange: (connected, count) => {
          setOnlineConnected(connected);
          setOnlineCount(count);
        },
        onPlayerUpdate: (rp: RemotePlayerState) => {
          let entry = remotePlayers.get(rp.id);
          const rx = rp.pos[0] ?? 0;
          const ry = rp.pos[1] ?? 0;
          const rz = rp.pos[2] ?? 0;
          const ryaw = Math.atan2(rp.fwd[0] ?? 0, rp.fwd[2] ?? 1);
          if (!entry) {
            const grp = buildChibiCourier(toonGradient, {
              hatColor: 0x2c3642,
              shirtColor: 0x3b82f6,
              pantsColor: 0x26313d,
              shoeColor: 0x1c2128,
              bagColor: 0x36404a,
              hairStyle: 'headphones',
              topStyle: 'coat',
            });
            grp.scale.setScalar(CHAR_SCALE);
            grp.add(createSoftDropShadow(0.18));
            scene.add(grp);
            const nameSprite = new Sprite(
              new SpriteMaterial({
                map: makeNameplateTex(rp.name || 'Traveler'),
                transparent: true,
                depthWrite: false,
              })
            );
            nameSprite.scale.set(1.4, 0.35, 1);
            scene.add(nameSprite);
            entry = {
              group: grp,
              nameSprite,
              tx: rx,
              tz: rz,
              ty: ry,
              cx: rx,
              cz: rz,
              cy: ry,
              tyaw: ryaw,
              cyaw: ryaw,
              moving: rp.moving,
              sprinting: rp.sprinting,
            };
            remotePlayers.set(rp.id, entry);
          } else {
            entry.tx = rx;
            entry.ty = ry;
            entry.tz = rz;
            entry.tyaw = ryaw;
            entry.moving = rp.moving;
            entry.sprinting = rp.sprinting;
          }
        },
        onPlayerLeave: (id) => {
          const e = remotePlayers.get(id);
          if (e) {
            scene.remove(e.group, e.nameSprite);
            remotePlayers.delete(id);
          }
        },
        onPlayerEmote: () => {},
        onChat: (msg) => {
          setChatMessages((prev) => [...prev.slice(-14), msg]);
        },
      },
      mapId
    );

    sendChatRef.current = (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      onlineClient.sendChat(clean);
      setChatMessages((prev) => [
        ...prev.slice(-14),
        { id: 'me', name: liveUserNameRef.current || 'Bạn', text: clean, ts: Date.now() },
      ]);
    };

    const hitsCollider = (nx: number, nz: number) => {
      const pad = 0.45;
      if (
        nx < mapCfg.bounds.minX ||
        nx > mapCfg.bounds.maxX ||
        nz < mapCfg.bounds.minZ ||
        nz > mapCfg.bounds.maxZ
      ) {
        return true;
      }
      for (const c of mapCfg.colliders) {
        if (nx > c.minX - pad && nx < c.maxX + pad && nz > c.minZ - pad && nz < c.maxZ + pad) {
          return true;
        }
      }
      return false;
    };

    let currentNearby: RoleplayNpcSpec | null = null;

    interactRef.current = () => {
      if (!currentNearby) return;
      setChecklistOpen(false);
      setActiveDialog({
        npc: currentNearby,
        quest: currentNearby.quest,
        showVi: false,
        feedback: null,
        completedNow: false,
      });
      speakEnglish(currentNearby.quest.promptEn);
    };

    teleportRef.current = (npcId: string) => {
      const target = mapCfg.npcs.find((n) => n.id === npcId);
      if (!target) return;
      const offsetZ = target.z < 0 ? 1.8 : -1.8;
      pState.x = target.x;
      pState.z = target.z + offsetZ;
      pState.yaw = Math.atan2(target.x - pState.x, target.z - pState.z);
      pState.camYaw = pState.yaw;
      pState.camDist = 4.2;
      const horiz = Math.cos(pState.camPitch) * pState.camDist;
      camera.position.set(
        pState.x - Math.sin(pState.camYaw) * horiz,
        1.45 + Math.sin(pState.camPitch) * pState.camDist,
        pState.z - Math.cos(pState.camYaw) * horiz
      );
      camera.lookAt(pState.x, 1.1, pState.z);
      setChecklistOpen(false);
      showToast(`🧭 Đã dịch chuyển tới ${target.landmark}!`);
    };

    recenterRef.current = () => {
      pState.camYaw = pState.yaw;
      pState.camDist = 5.2;
      pState.camPitch = 0.42;
    };

    // Controls (supports WASD, Arrow keys, Vietnamese IME/Unikey, & on-screen D-pad!)
    const codes: Record<string, boolean> = {};
    const btnCodes: Record<string, boolean> = {};
    let jumpQueued = false;
    virtualKeyRef.current = (code: string, down: boolean) => {
      btnCodes[code] = down;
      if (code === 'Space' && down) jumpQueued = true;
    };
    const clearBtnKeys = () => {
      for (const k in btnCodes) btnCodes[k] = false;
    };
    const normalizeMoveCode = (e: KeyboardEvent): string => {
      if (e.code) return e.code;
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'ư') return 'KeyW';
      if (k === 's') return 'KeyS';
      if (k === 'a') return 'KeyA';
      if (k === 'd') return 'KeyD';
      if (k === ' ') return 'Space';
      return e.key;
    };
    const MOVE_KEY_SET = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
    ]);
    const onKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const tag = (e.target as HTMLElement)?.tagName || activeEl?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const code = normalizeMoveCode(e);
      if (MOVE_KEY_SET.has(code) || e.key === ' ') {
        e.preventDefault();
        // Blur any focused UI button so Space/Enter never accidentally re-clicks it!
        if (activeEl && activeEl.tagName === 'BUTTON') activeEl.blur();
      }
      codes[code] = true;
      if (code === 'Space' && !e.repeat && !liveDialogOpenRef.current) {
        jumpQueued = true;
      }
      if (code === 'KeyE' && !liveDialogOpenRef.current) interactRef.current?.();
      if (code === 'Escape') {
        setActiveDialog(null);
        setChecklistOpen(false);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const code = normalizeMoveCode(e);
      codes[code] = false;
      // If Vietnamese IME (Unikey/Telex) swallowed a keyup as 'Process'/'Unidentified', release stuck move keys!
      if (e.key === 'Process' || e.key === 'Unidentified') {
        MOVE_KEY_SET.forEach((k) => {
          codes[k] = false;
        });
      }
    };
    const clearKeys = () => {
      for (const k in codes) codes[k] = false;
      clearBtnKeys();
      jumpQueued = false;
      pState.dragging = false;
    };
    const onVisChange = () => {
      if (document.hidden) clearKeys();
    };
    // Blur any previously focused map-switcher button when entering this map
    if (document.activeElement instanceof HTMLElement && document.activeElement.tagName === 'BUTTON') {
      document.activeElement.blur();
    }
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', clearKeys);
    window.addEventListener('contextmenu', clearKeys);
    window.addEventListener('pointerup', clearBtnKeys);
    window.addEventListener('pointercancel', clearBtnKeys);
    document.addEventListener('visibilitychange', onVisChange);

    const dom = renderer.domElement;
    const onPtrDown = (e: PointerEvent) => {
      // Release focus from chat input or UI buttons so WASD works immediately on click!
      if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      if (liveDialogOpenRef.current) return;
      pState.dragging = true;
      pState.lastX = e.clientX;
      pState.lastY = e.clientY;
    };
    const onPtrMove = (e: PointerEvent) => {
      if (!pState.dragging) return;
      const dx = e.clientX - pState.lastX;
      const dy = e.clientY - pState.lastY;
      pState.camYaw -= dx * 0.007;
      pState.camPitch = Math.max(0.18, Math.min(1.05, pState.camPitch + dy * 0.006));
      pState.lastX = e.clientX;
      pState.lastY = e.clientY;
    };
    const onPtrUp = () => {
      pState.dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      pState.camDist = Math.max(2.8, Math.min(10.5, pState.camDist + e.deltaY * 0.004));
    };
    dom.addEventListener('pointerdown', onPtrDown);
    dom.addEventListener('pointermove', onPtrMove);
    dom.addEventListener('pointerup', onPtrUp);
    dom.addEventListener('pointercancel', onPtrUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Patch all built-in scene materials for sRGB parity inside AnimeInkPass!
    scene.traverse((obj) => {
      const mat = (obj as Mesh).material as Material | Material[] | undefined;
      if (!mat) return;
      if (Array.isArray(mat)) mat.forEach(patchMaterialForInk);
      else patchMaterialForInk(mat);
    });

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      const dpr = renderer.getPixelRatio();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      animeInk.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let frameId = 0;
    let lastT = performance.now();
    const startT = lastT;
    let fpsFrames = 0;
    let lastFpsT = lastT;
    let lowFpsStreak = 0;
    let appliedGfx: GraphicsQuality | null = null;
    let lastNetSend = 0;
    let frameCount = 0;
    const lookTarget = new Vector3();
    const camGoal = new Vector3();

    const applyQuality = (q: GraphicsQuality) => {
      appliedGfx = q;
      const m = GFX_META[q];
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, m.maxDpr));
      renderer.shadowMap.enabled = m.shadows;
      if (m.shadows) renderer.shadowMap.needsUpdate = true;
      if (m.inkScale > 0) animeInk.setResolutionScale(m.inkScale);
      resize();
    };
    applyQuality(liveGfxRef.current);

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      if (document.hidden) return;
      const now = performance.now();
      const delta = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const elapsed = (now - startT) / 1000;
      frameCount++;
      fpsFrames++;

      if (appliedGfx !== liveGfxRef.current) {
        applyQuality(liveGfxRef.current);
      }

      if (now - lastFpsT >= 750) {
        const curFps = Math.round((fpsFrames * 1000) / (now - lastFpsT));
        setFps(curFps);
        fpsFrames = 0;
        lastFpsT = now;

        // Only auto-downgrade on genuinely struggling weak GPUs (< 18 FPS for ~4.5s)
        if (!userLockedGfxRef.current && elapsed > 3.0) {
          if (curFps < 18) {
            lowFpsStreak++;
            if (lowFpsStreak >= 6) {
              lowFpsStreak = 0;
              if (liveGfxRef.current === 'high') {
                liveGfxRef.current = 'medium';
                setGfxQuality('medium');
                showToast('⚖️ Tự động chuyển sang Ink Nhẹ để mượt hơn cho máy bạn');
              } else if (liveGfxRef.current === 'medium') {
                liveGfxRef.current = 'eco';
                setGfxQuality('eco');
                showToast('⚡ Tự động chuyển sang Siêu mượt (Eco) để giữ FPS cao');
              }
            }
          } else {
            lowFpsStreak = 0;
          }
        }
      }

      updateMapProps(elapsed);

      // Movement (merges physical keyboard + on-screen D-pad cleanly without overwriting!)
      let inFwd = 0;
      let inRight = 0;
      if (liveDialogOpenRef.current) {
        clearKeys();
      } else {
        if (codes['KeyW'] || codes['ArrowUp'] || btnCodes['KeyW']) inFwd += 1;
        if (codes['KeyS'] || codes['ArrowDown'] || btnCodes['KeyS']) inFwd -= 1;
        if (codes['KeyD'] || codes['ArrowRight'] || btnCodes['KeyD']) inRight += 1;
        if (codes['KeyA'] || codes['ArrowLeft'] || btnCodes['KeyA']) inRight -= 1;
      }
      const moving = inFwd !== 0 || inRight !== 0;
      const sprinting = Boolean(codes['ShiftLeft'] || codes['ShiftRight']);

      if (moving) {
        const fwdX = Math.sin(pState.camYaw);
        const fwdZ = Math.cos(pState.camYaw);
        const rightX = -Math.cos(pState.camYaw);
        const rightZ = Math.sin(pState.camYaw);
        let mx = fwdX * inFwd + rightX * inRight;
        let mz = fwdZ * inFwd + rightZ * inRight;
        const len = Math.hypot(mx, mz) || 1;
        mx /= len;
        mz /= len;
        const speed = sprinting ? 6.2 : 3.8;
        const nx = pState.x + mx * speed * delta;
        const nz = pState.z + mz * speed * delta;
        if (!hitsCollider(nx, pState.z)) pState.x = nx;
        if (!hitsCollider(pState.x, nz)) pState.z = nz;
        const targetYaw = Math.atan2(mx, mz);
        let diff = targetYaw - pState.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        pState.yaw += diff * Math.min(1, 12 * delta);
      }

      if (jumpQueued && !liveDialogOpenRef.current && pState.y <= 0.01) {
        pState.vy = 5.4;
      }
      jumpQueued = false;
      if (pState.y > 0 || pState.vy > 0) {
        pState.vy -= 16 * delta;
        pState.y = Math.max(0, pState.y + pState.vy * delta);
        if (pState.y <= 0) pState.vy = 0;
      }

      player.position.set(pState.x, pState.y, pState.z);
      player.rotation.y = pState.yaw;
      animateChibi(player, {
        t: elapsed,
        moving,
        sprinting,
        jumpH: pState.y * 0.2,
      });

      // Animate Quest NPCs & check proximity
      if (frameCount % 5 === 0) {
        let closest: RoleplayNpcSpec | null = null;
        let minD = 999;
        for (const n of npcNodes) {
          const d = Math.hypot(pState.x - n.spec.x, pState.z - n.spec.z);
          if (d < 2.6 && d < minD) {
            minD = d;
            closest = n.spec;
          }
        }
        if (closest?.id !== currentNearby?.id) {
          currentNearby = closest;
          setNearbyNpc(closest);
        }
      }

      npcNodes.forEach((n, idx) => {
        const isDone = liveCompletedRef.current.includes(n.spec.id);
        if (n.badgeDone !== isDone) {
          n.badgeDone = isDone;
          (n.badge.material as SpriteMaterial).map = isDone ? badgeDone : badgeTodo;
          n.badge.material.needsUpdate = true;
        }
        (n.ring.material as MeshBasicMaterial).color.setHex(isDone ? 0x4ade80 : 0xf5bd33);
        n.badge.position.y = 2.05 + Math.sin(elapsed * 3.2 + idx) * 0.09;
        const isClose = currentNearby?.id === n.spec.id;
        if (isClose) {
          const targetYaw = Math.atan2(pState.x - n.spec.x, pState.z - n.spec.z);
          let diff = targetYaw - n.group.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          n.group.rotation.y += diff * 0.12;
        }
        animateChibi(n.group, {
          t: elapsed,
          phase: idx * 1.4,
          moving: false,
          emoteAction: isClose ? 'wave' : null,
        });
      });

      // Animate Strolling Background NPCs
      for (let i = 0; i < strollers.length; i++) {
        const s = strollers[i];
        const wp = s.waypoints[s.wpIdx];
        let walking = false;
        if (elapsed >= s.pauseUntil) {
          const dx = wp[0] - s.x;
          const dz = wp[1] - s.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.22) {
            s.wpIdx = (s.wpIdx + 1) % s.waypoints.length;
            s.pauseUntil = elapsed + 1.6 + i * 0.5;
          } else {
            walking = true;
            const step = Math.min(dist, s.speed * delta);
            s.x += (dx / dist) * step;
            s.z += (dz / dist) * step;
            const targetYaw = Math.atan2(dx, dz);
            let diff = targetYaw - s.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            s.yaw += diff * 0.14;
          }
        }
        s.group.position.set(s.x, 0, s.z);
        s.group.rotation.y = s.yaw;
        animateChibi(s.group, { t: elapsed, phase: s.phase, moving: walking });
      }

      // Online Sync (~15 Hz)
      if (now - lastNetSend > 66) {
        lastNetSend = now;
        onlineClient.sendState({
          name: liveUserNameRef.current || 'Traveler',
          pos: [pState.x, pState.y, pState.z],
          fwd: [Math.sin(pState.yaw), 0, Math.cos(pState.yaw)],
          r: 0,
          jumpH: pState.y,
          moving,
          sprinting,
        });
      }
      remotePlayers.forEach((rp) => {
        rp.cx += (rp.tx - rp.cx) * 0.22;
        rp.cy += (rp.ty - rp.cy) * 0.25;
        rp.cz += (rp.tz - rp.cz) * 0.22;
        rp.cyaw += (rp.tyaw - rp.cyaw) * 0.22;
        rp.group.position.set(rp.cx, rp.cy, rp.cz);
        rp.group.rotation.y = rp.cyaw;
        rp.nameSprite.position.set(rp.cx, rp.cy + 1.95, rp.cz);
        animateChibi(rp.group, { t: elapsed, moving: rp.moving, sprinting: rp.sprinting });
      });

      // Smooth Over-the-Shoulder Camera
      const horiz = Math.cos(pState.camPitch) * pState.camDist;
      const camX = pState.x - Math.sin(pState.camYaw) * horiz;
      const camZ = pState.z - Math.cos(pState.camYaw) * horiz;
      const camY = 1.45 + Math.sin(pState.camPitch) * pState.camDist + pState.y * 0.4;
      camGoal.set(camX, camY, camZ);
      camera.position.lerp(camGoal, 0.16);
      lookTarget.set(pState.x, 1.1 + pState.y * 0.3, pState.z);
      camera.lookAt(lookTarget);

      if (liveGfxRef.current !== 'eco') {
        inkDisplayOutput.value = 1;
        animeInk.render(renderer, scene, camera, elapsed);
      } else {
        inkDisplayOutput.value = 0;
        renderer.render(scene, camera);
      }
    };
    tick();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', clearKeys);
      window.removeEventListener('contextmenu', clearKeys);
      window.removeEventListener('pointerup', clearBtnKeys);
      window.removeEventListener('pointercancel', clearBtnKeys);
      document.removeEventListener('visibilitychange', onVisChange);
      dom.removeEventListener('pointerdown', onPtrDown);
      dom.removeEventListener('pointermove', onPtrMove);
      dom.removeEventListener('pointerup', onPtrUp);
      dom.removeEventListener('pointercancel', onPtrUp);
      dom.removeEventListener('wheel', onWheel);
      ro.disconnect();
      onlineClient.dispose();
      animeInk.dispose();
      toonGradient.dispose();
      badgeTodo.dispose();
      badgeDone.dispose();
      disposeObject3D(scene);
      renderer.dispose();
      scene.clear();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, [mapId]);

  const handleReplyChoice = (choice: RoleplayReplyChoice) => {
    if (!activeDialog) return;
    speakEnglish(choice.npcFeedback);
    if (choice.quality === 'retry') {
      setActiveDialog({ ...activeDialog, feedback: choice.npcFeedback });
      return;
    }
    const npcId = activeDialog.npc.id;
    setCompletedIds((prev) => (prev.includes(npcId) ? prev : [...prev, npcId]));
    onEarnXpRef.current(choice.xp, `Hội thoại tại ${activeDialog.npc.landmark}`);
    showToast(`✨ Hội thoại tuyệt vời tại ${activeDialog.npc.landmark}! +${choice.xp} XP`);
    setActiveDialog({ ...activeDialog, feedback: choice.npcFeedback, completedNow: true });
  };

  const handleVoiceReply = () => {
    if (!activeDialog) return;
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('⚠️ Trình duyệt chưa hỗ trợ Web Speech (hãy dùng Chrome/Edge)!');
      return;
    }
    try {
      const rec = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onstart: () => void;
        onend: () => void;
        onerror: () => void;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        start: () => void;
      };
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.onstart = () => {
        setListeningMic(true);
        setVoiceTranscript('');
      };
      rec.onend = () => setListeningMic(false);
      rec.onerror = () => {
        setListeningMic(false);
        showToast('🎙️ Không nghe rõ giọng nói — thử lại hoặc chọn câu trả lời bên dưới nhé!');
      };
      rec.onresult = (ev) => {
        const spoken = ev.results?.[0]?.[0]?.transcript?.trim() ?? '';
        setVoiceTranscript(spoken);
        if (spoken.split(/\s+/).length >= 2) {
          const praise = `Fantastic real-life English! "${spoken}" — thank you so much!`;
          speakEnglish(praise);
          const npcId = activeDialog.npc.id;
          setCompletedIds((prev) => (prev.includes(npcId) ? prev : [...prev, npcId]));
          onEarnXpRef.current(40, `Nói tiếng Anh tại ${activeDialog.npc.landmark}`);
          setActiveDialog((d) => (d ? { ...d, feedback: praise, completedNow: true } : null));
        } else {
          showToast('🎙️ Hãy nói 1 câu tiếng Anh đầy đủ (ít nhất 2 từ) nhé!');
        }
      };
      rec.start();
    } catch {
      setListeningMic(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none' }}>
      <div ref={hostRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Top-Left Status Pill */}
      <div
        onClick={() => setChecklistOpen((v) => !v)}
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255, 253, 247, 0.94)',
          border: '2.5px solid #1d2a33',
          boxShadow: '3px 3px 0 #1d2a33',
          borderRadius: 12,
          padding: '5px 11px',
          fontSize: 12,
          fontWeight: 900,
          color: '#1d2a33',
          cursor: 'pointer',
        }}
      >
        <span>{cfg.title}</span>
        <span style={{ color: '#64748b' }}>·</span>
        <span>
          ✅ {completedIds.length}/{cfg.npcs.length}
        </span>
        <span style={{ color: '#64748b' }}>·</span>
        <span style={{ color: onlineConnected ? '#0f766e' : '#b45309' }}>
          ● {onlineConnected ? `Online (${onlineCount})` : 'Đang kết nối...'}
        </span>
        <span style={{ color: '#64748b' }}>·</span>
        <span style={{ color: fps >= 40 ? '#15803d' : '#b45309' }}>{fps} FPS</span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            userLockedGfxRef.current = true;
            setGfxQuality((v) => {
              const next = cycleGraphicsQuality(v);
              saveGraphicsQuality(next);
              showToast(GFX_META[next].toast);
              return next;
            });
          }}
          title="Nhấn để đổi 3 mức đồ họa: Cao / Ink Nhẹ / Siêu mượt"
          style={{
            padding: '1px 6px',
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 900,
            background: GFX_META[gfxQuality].bg,
            color: GFX_META[gfxQuality].fg,
            border: '1.5px solid #243038',
            cursor: 'pointer',
          }}
        >
          {GFX_META[gfxQuality].label}
        </span>
      </div>

      {/* Top-Right Checklist Button */}
      <button
        className="abeto-btn"
        onClick={() => setChecklistOpen((v) => !v)}
        title="Danh sách nhiệm vụ giao tiếp tiếng Anh"
        style={{
          ...PAPER_BTN_STYLE,
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 18,
          background: checklistOpen ? '#ffd859' : PAPER_BTN_STYLE.background,
        }}
      >
        <ClipboardList size={21} strokeWidth={2.3} />
      </button>

      {/* Checklist Drawer with Fast-Travel */}
      {checklistOpen && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 70,
            zIndex: 25,
            width: 300,
            background: 'rgba(255, 253, 247, 0.97)',
            border: '2.5px solid #1d2a33',
            boxShadow: '5px 6px 0 rgba(29,42,51,0.28)',
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13.5, color: '#1d2a33' }}>{cfg.title}</strong>
            <button onClick={() => setChecklistOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gap: 7 }}>
            {cfg.npcs.map((n) => {
              const done = completedIds.includes(n.id);
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 9px',
                    borderRadius: 10,
                    background: done ? '#dcfce7' : '#fff',
                    border: '1.5px solid #cbd5e1',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span>{done ? '✅' : '⬜'}</span>
                  <span style={{ flex: 1, color: '#1d2a33' }}>{n.quest.checklistTitle}</span>
                  <button
                    onClick={() => teleportRef.current?.(n.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      border: '1.5px solid #1d2a33',
                      background: '#fffdf7',
                      color: '#1d2a33',
                      fontSize: 10.5,
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <MapPin size={11} /> Đi tới
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom-Right On-Screen Movement Pad + Recenter Button */}
      {!activeDialog && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 14,
            zIndex: 20,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 36px 36px',
              gridTemplateRows: '36px 36px',
              gap: 4,
              touchAction: 'none',
            }}
          >
            <div />
            <button
              type="button"
              aria-label="Đi tới"
              onPointerDown={(e) => {
                e.preventDefault();
                virtualKeyRef.current?.('KeyW', true);
              }}
              onPointerUp={() => virtualKeyRef.current?.('KeyW', false)}
              onPointerLeave={() => virtualKeyRef.current?.('KeyW', false)}
              onPointerCancel={() => virtualKeyRef.current?.('KeyW', false)}
              style={{ ...PAPER_BTN_STYLE, width: 36, height: 36, borderRadius: 9, fontSize: 15, fontWeight: 900 }}
            >
              ↑
            </button>
            <div />
            <button
              type="button"
              aria-label="Sang trái"
              onPointerDown={(e) => {
                e.preventDefault();
                virtualKeyRef.current?.('KeyA', true);
              }}
              onPointerUp={() => virtualKeyRef.current?.('KeyA', false)}
              onPointerLeave={() => virtualKeyRef.current?.('KeyA', false)}
              onPointerCancel={() => virtualKeyRef.current?.('KeyA', false)}
              style={{ ...PAPER_BTN_STYLE, width: 36, height: 36, borderRadius: 9, fontSize: 15, fontWeight: 900 }}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Lùi lại"
              onPointerDown={(e) => {
                e.preventDefault();
                virtualKeyRef.current?.('KeyS', true);
              }}
              onPointerUp={() => virtualKeyRef.current?.('KeyS', false)}
              onPointerLeave={() => virtualKeyRef.current?.('KeyS', false)}
              onPointerCancel={() => virtualKeyRef.current?.('KeyS', false)}
              style={{ ...PAPER_BTN_STYLE, width: 36, height: 36, borderRadius: 9, fontSize: 15, fontWeight: 900 }}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Sang phải"
              onPointerDown={(e) => {
                e.preventDefault();
                virtualKeyRef.current?.('KeyD', true);
              }}
              onPointerUp={() => virtualKeyRef.current?.('KeyD', false)}
              onPointerLeave={() => virtualKeyRef.current?.('KeyD', false)}
              onPointerCancel={() => virtualKeyRef.current?.('KeyD', false)}
              style={{ ...PAPER_BTN_STYLE, width: 36, height: 36, borderRadius: 9, fontSize: 15, fontWeight: 900 }}
            >
              →
            </button>
          </div>
          <button
            className="abeto-btn"
            title="Đặt lại góc camera"
            onClick={() => recenterRef.current?.()}
            style={{ ...PAPER_BTN_STYLE }}
          >
            <Compass size={20} strokeWidth={2.3} />
          </button>
        </div>
      )}

      {/* Global Server Chat (Bottom-Left) */}
      {!activeDialog && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 146,
            zIndex: 31,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 6,
          }}
        >
          {chatOpen && (
            <div
              style={{
                width: 'min(290px, calc(100vw - 170px))',
                background: 'rgba(255, 253, 247, 0.96)',
                border: '2px solid #243038',
                boxShadow: '4px 5px 0 rgba(36, 48, 56, 0.28)',
                borderRadius: 14,
                padding: '9px 10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11.5, fontWeight: 900 }}>
                <span>🌐 Chat {cfg.title} ({onlineCount})</span>
                <button onClick={() => setChatOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ maxHeight: 110, overflowY: 'auto', display: 'grid', gap: 4, marginBottom: 7, fontSize: 11.5 }}>
                {chatMessages.length === 0 ? (
                  <div style={{ color: '#64748b', fontStyle: 'italic' }}>Nhắn tiếng Anh giao lưu với bạn bè trong map!</div>
                ) : (
                  chatMessages.map((m, idx) => (
                    <div key={`${m.ts}-${idx}`}>
                      <strong style={{ color: m.id === 'me' ? '#0f766e' : '#b45309' }}>{m.name}: </strong>
                      <span>{m.text}</span>
                    </div>
                  ))
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  sendChatRef.current?.(chatInput);
                  setChatInput('');
                }}
                style={{ display: 'flex', gap: 5 }}
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhắn tin..."
                  style={{ flex: 1, border: '1.5px solid #94a3b8', borderRadius: 8, padding: '4px 8px', fontSize: 11.5 }}
                />
                <button
                  type="submit"
                  style={{ border: '2px solid #243038', background: '#ffd859', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          )}
          <button
            onClick={() => setChatOpen((v) => !v)}
            style={{
              border: '2px solid #243038',
              background: chatOpen ? '#ffd859' : 'linear-gradient(180deg, #ffffff 0%, #f6f2e8 100%)',
              color: '#243038',
              padding: '7px 12px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '3px 4px 0 rgba(36, 48, 56, 0.28)',
            }}
          >
            <MessageCircle size={14} /> Chat ({onlineCount})
          </button>
        </div>
      )}

      {/* Interact Prompt */}
      {nearbyNpc && !activeDialog && (
        <button
          onClick={() => interactRef.current?.()}
          style={{
            position: 'absolute',
            bottom: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 22,
            background: '#1d2a33',
            color: '#fffdf7',
            border: '2.5px solid #fffdf7',
            boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
            borderRadius: 999,
            padding: '9px 18px',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ background: '#f5bd33', color: '#1d2a33', padding: '1px 7px', borderRadius: 6, fontSize: 12 }}>E</span>
          Trò chuyện cùng {nearbyNpc.name} ({nearbyNpc.landmark})
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: 62,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            background: '#1d2a33',
            color: '#f5bd33',
            border: '2px solid #f5bd33',
            borderRadius: 999,
            padding: '7px 16px',
            fontSize: 12.5,
            fontWeight: 800,
          }}
        >
          {toast}
        </div>
      )}

      {/* Interactive English Dialogue Modal */}
      {activeDialog && (
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 32,
            width: 'min(540px, calc(100% - 28px))',
            background: 'rgba(255, 253, 247, 0.98)',
            border: '2.5px solid #1d2a33',
            boxShadow: '5px 6px 0 #1d2a33',
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <strong style={{ fontSize: 14.5, color: '#c93b3b' }}>{activeDialog.quest.npcName}</strong>
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{activeDialog.npc.landmark}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => speakEnglish(activeDialog.quest.promptEn)}
                style={{ border: '1.5px solid #1d2a33', background: '#fff', borderRadius: 8, padding: '3px 7px', cursor: 'pointer' }}
                title="Nghe lại"
              >
                <Volume2 size={14} />
              </button>
              <button
                onClick={() => setActiveDialog((d) => (d ? { ...d, showVi: !d.showVi } : null))}
                style={{ border: '1.5px solid #1d2a33', background: '#fef3c7', borderRadius: 8, padding: '3px 8px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
              >
                {activeDialog.showVi ? 'Ẩn dịch' : 'Dịch VI'}
              </button>
              <button onClick={() => setActiveDialog(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <p style={{ fontSize: 14, fontWeight: 700, color: '#1d2a33', marginBottom: activeDialog.showVi ? 4 : 10 }}>
            “{activeDialog.quest.promptEn}”
          </p>
          {activeDialog.showVi && (
            <p style={{ fontSize: 12.5, color: '#475569', fontStyle: 'italic', marginBottom: 10 }}>
              {activeDialog.quest.promptVi}
            </p>
          )}

          {activeDialog.feedback && (
            <div
              style={{
                background: activeDialog.completedNow ? '#dcfce7' : '#fef3c7',
                border: '1.5px solid #1d2a33',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              💬 {activeDialog.feedback}
            </div>
          )}

          <div style={{ display: 'grid', gap: 7, marginBottom: 10 }}>
            {activeDialog.quest.choices.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => handleReplyChoice(ch)}
                style={{
                  textAlign: 'left',
                  padding: '8px 11px',
                  borderRadius: 10,
                  border: '2px solid #1d2a33',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1d2a33' }}>{ch.en}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{ch.vi}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleVoiceReply}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: '2px solid #1d2a33',
                background: listeningMic ? '#ef4444' : '#f5bd33',
                color: listeningMic ? '#fff' : '#1d2a33',
                borderRadius: 10,
                padding: '7px 13px',
                fontSize: 12.5,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              <Mic size={14} />
              {listeningMic ? 'Đang nghe giọng bạn...' : 'Nói tiếng Anh trực tiếp (+40 XP)'}
            </button>
            {voiceTranscript && (
              <span style={{ fontSize: 11.5, color: '#0f766e', fontWeight: 700 }}>Bạn vừa nói: “{voiceTranscript}”</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
