import React, { useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  Compass,
  MapPin,
  MessageCircle,
  Mic,
  Moon,
  Music,
  Palette,
  Send,
  Shirt,
  Smile,
  Sun,
  Sunrise,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  AmbientLight,
  Box3,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  RingGeometry,
  Scene,
  ShadowMaterial,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  type AnimationMixer,
  type BatchedMesh,
  type Material,
  type ShaderMaterial,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { AnimeInkPass, inkDisplayOutput, patchMaterialForInk } from '../lib/messenger/animeInkPass';
import {
  cycleGraphicsQuality,
  detectInitialGraphicsQuality,
  disposeObject3D,
  GFX_META,
  type GraphicsQuality,
  saveGraphicsQuality,
} from '../lib/messenger/perfOptimizer';
import { createWorldDetails } from '../lib/messenger/worldDetails';
import {
  GlobalOnlineClient,
  type OnlineChatMessage,
  type RemotePlayerState,
} from '../lib/messenger/onlineClient';
import {
  ENGLISH_NPC_QUESTS,
  speakEnglish,
  type EnglishNpcQuest,
  type EnglishReplyChoice,
} from '../lib/messenger/englishQuests';
import { introTexturePaths, type SceneMode } from '../lib/messenger/introAssets';
import {
  createMessengerMaterials,
  setMessengerLight,
  updateMessengerMaterials,
  type MessengerMaterialSet,
} from '../lib/messenger/materials';
import {
  createSceneDepthTarget,
  resizeSceneDepthTarget,
} from '../lib/messenger/sceneDepthPass';
import {
  setGameplayWaterDepth,
  setGameplayWaterLight,
  updateGameplayWaterMaterial,
} from '../lib/messenger/gameplayWater';
import { setTerrainLight } from '../lib/messenger/terrainMaterial';
import {
  setTreeLeavesLight,
  updateTreeLeavesMaterial,
} from '../lib/messenger/treeLeaves';
import {
  animateChibi,
  buildChibiCourier,
  CozyLoFiAudio,
  createAtmosphereRig,
  createDustPuffRig,
  createSoaringBirdsRig,
  createSoftDropShadow,
  createToonGradient,
  createWaterRippleRig,
  PLANET_QUEST_STOPS,
  setCourierHairStyle,
  setCourierTopStyle,
  type EmoteAction,
  type HairStyle,
  type QuestStop,
  type TimeOfDay,
  type TopStyle,
} from '../lib/messenger/playerController';

// Patch Three.js once with BVH accelerated raycasting (~1000x faster walking & wall-slide!)
(BufferGeometry.prototype as unknown as Record<string, unknown>).computeBoundsTree = computeBoundsTree;
(BufferGeometry.prototype as unknown as Record<string, unknown>).disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

interface MessengerProWorldProps {
  userName?: string;
  onEarnXp: (xp: number, reason: string) => void;
  onEnterDebateArena?: () => void;
}

const SCENE_PRESETS: Record<
  SceneMode,
  {
    background: string;
    camera: [number, number, number];
    minDist: number;
    maxDist: number;
    autoRotate: boolean;
  }
> = {
  intro: {
    background: '#5cc7bd',
    camera: [0, 6, 20],
    minDist: 8,
    maxDist: 40,
    autoRotate: true,
  },
  gameplay: {
    background: '#5cc7bd',
    camera: [0, 7, 20],
    minDist: 4,
    maxDist: 38,
    autoRotate: false,
  },
  npcs: {
    background: '#151a22',
    camera: [0, 4.5, 11],
    minDist: 5,
    maxDist: 22,
    autoRotate: false,
  },
};

const HAT_SWATCHES = ['#34424d', '#2b4c7e', '#2f6e52', '#8c3b3b', '#5d4777', '#b57b3c'];
const SHIRT_SWATCHES = ['#c6514d', '#3b6ea5', '#3d8b7d', '#d47a44', '#c96b8c', '#333f4b'];
const PANTS_SWATCHES = ['#26313d', '#3e4c59', '#6e5c4a', '#2d4a3e', '#4c3f5c', '#c8bfa8'];
const SHOE_SWATCHES = ['#1c2128', '#8c3b3b', '#2b4c7e', '#5c4b3b', '#f2eee4', '#3d6b56'];
const BAG_SWATCHES = ['#36404a', '#6e4a32', '#2f5e46', '#2b4c7e', '#993d4b', '#d4a24c'];
const EMOTES = ['👋', '❤️', '✨', '😊', '📦', '☕', '🎵', '🔥'];
const OUTFIT_STORAGE_KEY = 'speaksharp_courier_outfit_v1';
const QUEST_STORAGE_KEY = 'speaksharp_courier_quests_v1';

function loadSavedOutfit() {
  try {
    const raw = localStorage.getItem(OUTFIT_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Partial<{
      hat: string;
      shirt: string;
      pants: string;
      shoe: string;
      bag: string;
      hair: HairStyle;
      top: TopStyle;
    }>;
  } catch {
    // ignore
  }
  return {};
}

function loadSavedQuests(): string[] {
  try {
    const raw = localStorage.getItem(QUEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

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
  transition: 'transform 0.14s cubic-bezier(.22,1,.36,1), box-shadow 0.14s ease, background 0.14s ease',
};

export const MessengerProWorld: React.FC<MessengerProWorldProps> = ({
  userName,
  onEarnXp,
  onEnterDebateArena,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<SceneMode>('gameplay');
  const [playMode, setPlayMode] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [soundMuted, setSoundMuted] = useState(false);
  const [gfxQuality, setGfxQuality] = useState<GraphicsQuality>(() => detectInitialGraphicsQuality());

  // Minimalist Abeto-style drawers (all closed by default -> >90% pure 3D viewport!)
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistBadge, setChecklistBadge] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [emoteDrawerOpen, setEmoteDrawerOpen] = useState(false);
  const [lastEmote, setLastEmote] = useState('👋');
  const [zoneBanner, setZoneBanner] = useState('');

  const savedOutfit = useRef(loadSavedOutfit()).current;
  const [hatColor, setHatColor] = useState(savedOutfit.hat ?? '#34424d');
  const [shirtColor, setShirtColor] = useState(savedOutfit.shirt ?? '#c6514d');
  const [pantsColor, setPantsColor] = useState(savedOutfit.pants ?? '#26313d');
  const [shoeColor, setShoeColor] = useState(savedOutfit.shoe ?? '#1c2128');
  const [bagColor, setBagColor] = useState(savedOutfit.bag ?? '#36404a');
  const [hairStyle, setHairStyle] = useState<HairStyle>(savedOutfit.hair ?? 'bob');
  const [topStyle, setTopStyle] = useState<TopStyle>(savedOutfit.top ?? 'coat');
  const [listeningMic, setListeningMic] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [onlineConnected, setOnlineConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<OnlineChatMessage[]>([]);
  const [floatingEmotes, setFloatingEmotes] = useState<
    Array<{ id: string; emoji: string; x: number; y: number }>
  >([]);

  const [questInfo, setQuestInfo] = useState({
    phase: 'pickup' as 'pickup' | 'deliver',
    stopName: 'Postmaster Ben',
    landmark: 'Town Post Office',
    distM: 4,
    delivered: 0,
    fps: 60,
  });
  const [completedStops, setCompletedStops] = useState<string[]>(() => loadSavedQuests());
  const [nearbyStop, setNearbyStop] = useState<QuestStop | null>(null);
  const [nearbyIsTarget, setNearbyIsTarget] = useState(false);

  // Interactive English Dialogue State
  const [activeDialog, setActiveDialog] = useState<{
    stop: QuestStop;
    quest: EnglishNpcQuest;
    showVi: boolean;
    feedback: string | null;
    completedNow: boolean;
  } | null>(null);
  const [toast, setToast] = useState('');

  // Live non-reactive refs so WebGL scene NEVER tears down on UI state toggles
  const livePlayModeRef = useRef(playMode);
  const liveTimeRef = useRef(timeOfDay);
  const liveMutedRef = useRef(soundMuted);
  const liveGfxRef = useRef<GraphicsQuality>(gfxQuality);
  const applyGfxRef = useRef<((q: GraphicsQuality) => void) | null>(null);
  const liveWardrobeRef = useRef(wardrobeOpen);
  const liveDialogOpenRef = useRef(Boolean(activeDialog));
  const liveOutfitRef = useRef({
    hat: hatColor,
    shirt: shirtColor,
    pants: pantsColor,
    shoe: shoeColor,
    bag: bagColor,
    hair: hairStyle,
    top: topStyle,
  });
  const onEarnXpRef = useRef(onEarnXp);

  const applyTimeRef = useRef<((t: TimeOfDay) => void) | null>(null);
  const applyOutfitRef = useRef<
    ((o: typeof liveOutfitRef.current) => void) | null
  >(null);
  const triggerEmoteRef = useRef<((e: string) => void) | null>(null);
  const triggerInteractRef = useRef<(() => void) | null>(null);
  const completeQuestRef = useRef<((stopId: string, xp: number, label: string) => void) | null>(null);
  const teleportToStopRef = useRef<((stopId: string) => void) | null>(null);
  const sendChatRef = useRef<((text: string) => void) | null>(null);
  const recenterRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<CozyLoFiAudio | null>(null);
  const liveUserNameRef = useRef(userName);
  liveUserNameRef.current = userName;
  const liveCompletedStopsRef = useRef<string[]>(completedStops);
  liveCompletedStopsRef.current = completedStops;
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onEarnXpRef.current = onEarnXp;
  }, [onEarnXp]);
  useEffect(() => {
    livePlayModeRef.current = playMode;
  }, [playMode]);
  useEffect(() => {
    liveTimeRef.current = timeOfDay;
    applyTimeRef.current?.(timeOfDay);
  }, [timeOfDay]);
  useEffect(() => {
    liveMutedRef.current = soundMuted;
    audioRef.current?.setMuted(soundMuted);
  }, [soundMuted]);
  useEffect(() => {
    liveGfxRef.current = gfxQuality;
    applyGfxRef.current?.(gfxQuality);
  }, [gfxQuality]);
  useEffect(() => {
    liveWardrobeRef.current = wardrobeOpen;
  }, [wardrobeOpen]);
  useEffect(() => {
    liveDialogOpenRef.current = Boolean(activeDialog);
  }, [activeDialog]);
  useEffect(() => {
    const next = {
      hat: hatColor,
      shirt: shirtColor,
      pants: pantsColor,
      shoe: shoeColor,
      bag: bagColor,
      hair: hairStyle,
      top: topStyle,
    };
    liveOutfitRef.current = next;
    applyOutfitRef.current?.(next);
    try {
      localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [hatColor, shirtColor, pantsColor, shoeColor, bagColor, hairStyle, topStyle]);

  useEffect(() => {
    try {
      localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify(completedStops));
    } catch {
      // ignore
    }
  }, [completedStops]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 3200);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const preset = SCENE_PRESETS[mode];
    const scene = new Scene();
    scene.background = new Color(preset.background);

    const camera = new PerspectiveCamera(46, 1, 0.08, 400);
    camera.position.set(...preset.camera);

    const renderer = new WebGLRenderer({
      antialias: mode !== 'gameplay',
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    renderer.setSize(host.clientWidth, host.clientHeight);
    // Soft-edged 3D directional shadows (throttled & auto-disabled in Eco mode for weak GPUs!)
    const initShadows = GFX_META[liveGfxRef.current].shadows;
    renderer.shadowMap.enabled = initShadows;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = initShadows;
    renderer.shadowMap.type = PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = preset.minDist;
    controls.maxDistance = preset.maxDist;
    controls.target.set(0, mode === 'npcs' ? 1.2 : 0, 0);

    const ambient = new AmbientLight(0xffffff, mode === 'npcs' ? 0.45 : 0.85);
    scene.add(ambient);

    const sun = new DirectionalLight(0xfff4e2, mode === 'npcs' ? 1.8 : 1.55);
    sun.position.set(14, 20, 10);
    sun.castShadow = true;
    // Balanced 1024px soft shadow map (4x faster fill-rate than 2048px on integrated GPUs!)
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 38;
    const frustum = mode === 'npcs' ? 10 : 4.2;
    sun.shadow.camera.left = -frustum;
    sun.shadow.camera.right = frustum;
    sun.shadow.camera.top = frustum;
    sun.shadow.camera.bottom = -frustum;
    sun.shadow.bias = -0.00015;
    sun.shadow.normalBias = 0.042;
    sun.shadow.radius = 2.6;
    scene.add(sun);
    scene.add(sun.target);

    const toonGradient = createToonGradient();
    const atmosphere = mode !== 'npcs' ? createAtmosphereRig(scene, toonGradient) : null;
    const dustRig = mode === 'gameplay' ? createDustPuffRig(scene) : null;
    const rippleRig = mode === 'gameplay' ? createWaterRippleRig(scene) : null;
    const birdsRig = mode !== 'npcs' ? createSoaringBirdsRig(scene) : null;
    const audio = new CozyLoFiAudio();
    audio.setMuted(liveMutedRef.current);
    audioRef.current = audio;

    const runtime = {
      sceneGroup: null as Group | null,
      terrainChunks: [] as Array<{ mesh: Mesh; box: Box3 }>,
      terrainMeshes: [] as Mesh[],
      shadowReceivers: [] as Mesh[],
      materials: null as MessengerMaterialSet | null,
      terrainMaterial: null as ShaderMaterial | null,
      treeLeavesMaterial: null as ShaderMaterial | null,
      propMaterials: [] as ShaderMaterial[],
      gameplayWaterMaterial: null as ShaderMaterial | null,
      gameplayWater: null as BatchedMesh | null,
      npcMixers: [] as AnimationMixer[],
      autoRotate: preset.autoRotate,
      frame: 0,
      lastFrame: performance.now(),
      ready: false,
    };

    const UP = new Vector3(0, 1, 0);
    const raycaster = new Raycaster();
    (raycaster as unknown as { firstHitOnly: boolean }).firstHitOnly = true;
    const MIN_SURFACE_R = 4.5;

    const sampleTerrainRadius = (dir: Vector3, fallback = 6.8): number => {
      if (runtime.terrainMeshes.length === 0) return fallback;
      const origin = dir.clone().multiplyScalar(16);
      const inward = dir.clone().negate();
      raycaster.set(origin, inward);
      raycaster.far = 16;
      const hits = raycaster.intersectObjects(runtime.terrainMeshes, false);
      if (hits.length > 0) return Math.max(MIN_SURFACE_R, hits[0].point.length());
      return fallback;
    };

    const sampleLocalGround = (dir: Vector3, refR: number, headroom = 0.28): number | null => {
      if (runtime.terrainMeshes.length === 0) return null;
      const origin = dir.clone().multiplyScalar(refR + headroom);
      const inward = dir.clone().negate();
      raycaster.set(origin, inward);
      raycaster.far = 8.0;
      const hits = raycaster.intersectObjects(runtime.terrainMeshes, false);
      if (hits.length > 0) return Math.max(MIN_SURFACE_R, hits[0].point.length());
      return null;
    };

    const findStreetSpot = (centerDir: Vector3, searchRad = 0.2): { dir: Vector3; r: number } => {
      const t1 = new Vector3(1, 0, 0).cross(centerDir);
      if (t1.lengthSq() < 0.01) t1.set(0, 0, 1).cross(centerDir);
      t1.normalize();
      const t2 = centerDir.clone().cross(t1).normalize();
      let bestDir = centerDir.clone();
      let bestR = sampleTerrainRadius(centerDir, 8.5);
      const offsets: Array<[number, number]> = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const [ox, oy] of offsets) {
        const cand = centerDir
          .clone()
          .addScaledVector(t1, ox * searchRad)
          .addScaledVector(t2, oy * searchRad)
          .normalize();
        const r = sampleTerrainRadius(cand, 9.9);
        if (r > 5.0 && r < bestR) {
          bestR = r;
          bestDir = cand;
        }
      }
      return { dir: bestDir, r: bestR };
    };

    const wallOrigin = new Vector3();
    const wallNormal = new Vector3();
    const checkWallSlide = (posDir: Vector3, moveDir: Vector3, curR: number): Vector3 | null => {
      if (runtime.terrainMeshes.length === 0) return moveDir;
      // Cast at chest height (+0.22) so low curbs, steps & sidewalks NEVER block walking!
      wallOrigin.copy(posDir).multiplyScalar(curR + 0.22);
      raycaster.set(wallOrigin, moveDir);
      raycaster.far = 0.13;
      const hits = raycaster.intersectObjects(runtime.terrainMeshes, false);
      if (hits.length === 0) return moveDir;
      const hit = hits[0];
      if (!hit.face) return moveDir;
      wallNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
      // Ignore backfaces (so you can never get trapped inside a mesh) & ignore gentle slopes/stairs
      if (wallNormal.dot(moveDir) > -0.18 || Math.abs(wallNormal.dot(posDir)) > 0.45) return moveDir;
      const slide = moveDir.clone().addScaledVector(wallNormal, -moveDir.dot(wallNormal));
      slide.addScaledVector(posDir, -slide.dot(posDir));
      if (slide.lengthSq() < 0.04) return null;
      return slide.normalize();
    };

    const player = buildChibiCourier(toonGradient, {
      hatColor: new Color(liveOutfitRef.current.hat).getHex(),
      shirtColor: new Color(liveOutfitRef.current.shirt).getHex(),
      pantsColor: new Color(liveOutfitRef.current.pants).getHex(),
      shoeColor: new Color(liveOutfitRef.current.shoe).getHex(),
      bagColor: new Color(liveOutfitRef.current.bag).getHex(),
      hairStyle: liveOutfitRef.current.hair,
      topStyle: liveOutfitRef.current.top,
    });
    player.traverse((o) => {
      if ((o as Mesh).isMesh && !o.name.endsWith('_outline')) o.castShadow = true;
    });

    const playerShadowHolder = new Group();
    const playerShadowDisc = createSoftDropShadow(0.14);
    playerShadowHolder.add(playerShadowDisc);

    const compassGroup = new Group();
    const arrowCone = new Mesh(
      new ConeGeometry(0.022, 0.062, 8),
      new MeshBasicMaterial({ color: 0xf5bd33 })
    );
    arrowCone.rotation.x = Math.PI / 2;
    compassGroup.add(arrowCone);

    const stopNodes: Array<{
      stop: QuestStop;
      npc: Group;
      ring: Mesh;
      badge: Sprite;
      badgeDone: boolean;
      surfR: number;
    }> = [];
    const strollingNpcs: Array<{
      group: Group;
      waypoints: Vector3[];
      wpIdx: number;
      pauseUntil: number;
      posDir: Vector3;
      forward: Vector3;
      groundR: number;
      speed: number;
      phase: number;
    }> = [];

    // === SINGLE GLOBAL ONLINE SERVER (Zero room codes! Auto-joins everyone into 1 world) ===
    const makeNameplateTex = (label: string) => {
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
    };

    const remotePlayers = new Map<
      string,
      {
        group: Group;
        nameSprite: Sprite;
        targetPosDir: Vector3;
        curPosDir: Vector3;
        targetFwd: Vector3;
        curFwd: Vector3;
        targetR: number;
        curR: number;
        jumpH: number;
        moving: boolean;
        sprinting: boolean;
        outfitKey: string;
        emoteUntil: number;
        emoteAction: EmoteAction;
      }
    >();

    let lastNetSend = 0;
    const onlineClient =
      mode === 'gameplay'
        ? new GlobalOnlineClient({
            onStatusChange: (connected, count) => {
              setOnlineConnected(connected);
              setOnlineCount(count);
            },
            onPlayerUpdate: (rp: RemotePlayerState) => {
              const oKey = JSON.stringify(rp.outfit ?? null);
              let entry = remotePlayers.get(rp.id);
              if (!entry || entry.outfitKey !== oKey) {
                if (entry) {
                  scene.remove(entry.group, entry.nameSprite);
                }
                const o = rp.outfit;
                const grp = buildChibiCourier(toonGradient, {
                  hatColor: new Color(o?.hat ?? '#2c3642').getHex(),
                  shirtColor: new Color(o?.shirt ?? '#3b82f6').getHex(),
                  pantsColor: new Color(o?.pants ?? '#26313d').getHex(),
                  shoeColor: new Color(o?.shoe ?? '#1c2128').getHex(),
                  bagColor: new Color(o?.bag ?? '#36404a').getHex(),
                  hairStyle: o?.hair ?? 'bob',
                  topStyle: o?.top ?? 'coat',
                });
                grp.name = 'AnimatedNpc';
                grp.traverse((obj) => {
                  if ((obj as Mesh).isMesh && !obj.name.endsWith('_outline')) obj.castShadow = true;
                  const mat = (obj as Mesh).material as Material | Material[] | undefined;
                  if (mat) {
                    if (Array.isArray(mat)) mat.forEach(patchMaterialForInk);
                    else patchMaterialForInk(mat);
                  }
                });
                grp.add(createSoftDropShadow(0.14));
                scene.add(grp);

                const nameSprite = new Sprite(
                  new SpriteMaterial({
                    map: makeNameplateTex(rp.name || 'Courier'),
                    transparent: true,
                    depthWrite: false,
                  })
                );
                nameSprite.scale.set(0.36, 0.09, 1);
                scene.add(nameSprite);

                const initPos = new Vector3(...rp.pos).normalize();
                const initFwd = new Vector3(...rp.fwd).normalize();
                entry = {
                  group: grp,
                  nameSprite,
                  targetPosDir: initPos.clone(),
                  curPosDir: initPos.clone(),
                  targetFwd: initFwd.clone(),
                  curFwd: initFwd.clone(),
                  targetR: rp.r,
                  curR: rp.r,
                  jumpH: rp.jumpH,
                  moving: rp.moving,
                  sprinting: rp.sprinting,
                  outfitKey: oKey,
                  emoteUntil: 0,
                  emoteAction: null,
                };
                remotePlayers.set(rp.id, entry);
              } else {
                entry.targetPosDir.set(...rp.pos).normalize();
                entry.targetFwd.set(...rp.fwd).normalize();
                entry.targetR = rp.r;
                entry.jumpH = rp.jumpH;
                entry.moving = rp.moving;
                entry.sprinting = rp.sprinting;
              }
            },
            onPlayerLeave: (id: string) => {
              const entry = remotePlayers.get(id);
              if (entry) {
                scene.remove(entry.group, entry.nameSprite);
                remotePlayers.delete(id);
              }
            },
            onPlayerEmote: (id: string, emoji: string) => {
              const entry = remotePlayers.get(id);
              if (!entry) return;
              entry.emoteAction = emoji === '👋' ? 'wave' : emoji === '✨' ? 'spin' : 'cheer';
              entry.emoteUntil = performance.now() + 1400;
            },
            onChat: (msg) => {
              setChatMessages((prev) => [...prev.slice(-14), msg]);
            },
          })
        : null;

    sendChatRef.current = (text: string) => {
      const clean = text.trim();
      if (!clean || !onlineClient) return;
      onlineClient.sendChat(clean);
      setChatMessages((prev) => [
        ...prev.slice(-14),
        { id: 'me', name: liveUserNameRef.current || 'Bạn', text: clean, ts: Date.now() },
      ]);
    };
    const localStops: QuestStop[] = PLANET_QUEST_STOPS.map((s) => ({
      ...s,
      dir: s.dir.clone(),
    }));

    /** Hand-drawn beveled Abeto 3D speech/quest badge hovering above each NPC (single seamless path!) */
    const makeBadgeTex = (done: boolean) => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, 128, 128);

      const traceBubble = (ox: number, oy: number) => {
        const x = 18 + ox, y = 16 + oy, w = 88, h = 72, r = 20;
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

      // Offset charcoal shadow
      ctx.fillStyle = '#2d3b45';
      traceBubble(4, 5);
      ctx.fill();

      // Main clean bubble with seamless pointer
      ctx.fillStyle = done ? '#74e8a4' : '#ffe074';
      ctx.strokeStyle = '#2d3b45';
      ctx.lineWidth = 7;
      ctx.lineJoin = 'round';
      traceBubble(0, 0);
      ctx.fill();
      ctx.stroke();

      // Crisp icon (! or checkmark)
      ctx.fillStyle = '#23303a';
      ctx.font = '900 46px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(done ? '✓' : '!', 62, 53);
      const tex = new CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    };
    const badgeTexTodo = makeBadgeTex(false);
    const badgeTexDone = makeBadgeTex(true);

    const confettiPool: Array<{ mesh: Mesh; life: number; vel: Vector3; normal: Vector3 }> = [];
    const confColors = [0xf5bd33, 0xef4444, 0x38bdf8, 0x4ade80, 0xf472b6, 0xa855f7];
    const confGeo = new BoxGeometry(0.1, 0.1, 0.025);
    for (let i = 0; i < 36; i++) {
      const m = new Mesh(
        confGeo,
        new MeshBasicMaterial({ color: confColors[i % confColors.length] })
      );
      m.visible = false;
      scene.add(m);
      confettiPool.push({ mesh: m, life: 0, vel: new Vector3(), normal: new Vector3() });
    }

    const spawnConfetti = (dir: Vector3, r: number) => {
      const origin = dir.clone().multiplyScalar(r + 0.45);
      const t1 = new Vector3(1, 0, 0).cross(dir);
      if (t1.lengthSq() < 0.01) t1.set(0, 0, 1).cross(dir);
      t1.normalize();
      const t2 = dir.clone().cross(t1).normalize();
      confettiPool.forEach((c) => {
        c.mesh.position.copy(origin);
        c.mesh.visible = true;
        c.life = 1 + Math.random() * 0.4;
        c.normal.copy(dir);
        const a = Math.random() * Math.PI * 2;
        const sp = 0.025 + Math.random() * 0.05;
        c.vel
          .copy(dir)
          .multiplyScalar(0.05 + Math.random() * 0.06)
          .addScaledVector(t1, Math.cos(a) * sp)
          .addScaledVector(t2, Math.sin(a) * sp);
      });
    };

    let questPhase: 'pickup' | 'deliver' = 'pickup';
    let targetIdx = 0;
    let nextDeliverIdx = 1;
    let deliveredCount = 0;
    let currentNearby: QuestStop | null = null;

    // Street-level over-the-shoulder camera tuning (closer & lower like messenger.abeto.co!)
    const startDir = new Vector3(0.22, 0.86, 0.46).normalize();
    const startFwd = new Vector3(-0.35, -0.32, 0.88).normalize();
    const pState = {
      posDir: startDir.clone(),
      groundR: 8.2,
      jumpH: 0,
      jumpVel: 0,
      squash: 1,
      forward: startFwd.clone(),
      camForward: startFwd.clone(),
      camDist: 1.42,
      camElev: 0.56,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    const activeEmotes: Array<{ id: string; emoji: string; expires: number }> = [];
    let activeEmoteAnim: { action: EmoteAction; start: number; dur: number } | null = null;

    triggerEmoteRef.current = (emoji: string) => {
      audio.init();
      audio.playEmote();
      const nowT = performance.now();
      activeEmotes.push({
        id: `${nowT}-${Math.random()}`,
        emoji,
        expires: nowT + 2100,
      });
      if (emoji === '👋') {
        activeEmoteAnim = { action: 'wave', start: nowT, dur: 1300 };
      } else if (emoji === '✨' || emoji === '🔥') {
        activeEmoteAnim = { action: 'spin', start: nowT, dur: 900 };
      } else if (emoji === '❤️' || emoji === '😊') {
        activeEmoteAnim = { action: 'cheer', start: nowT, dur: 1100 };
      }
    };

    applyOutfitRef.current = (o) => {
      setCourierHairStyle(player, o.hair);
      setCourierTopStyle(player, o.top);
      const cHat = new Color(o.hat);
      const cShirt = new Color(o.shirt);
      const cPants = new Color(o.pants);
      const cShoe = new Color(o.shoe);
      const cBag = new Color(o.bag);
      player.traverse((obj) => {
        if (!(obj as Mesh).isMesh) return;
        const mat = (obj as Mesh).material as { color?: Color };
        if (!mat?.color) return;
        if (obj.name === 'hatMeshDome' || obj.name === 'hatMeshBtn') mat.color.copy(cHat);
        if (
          obj.name === 'shirtMesh' ||
          obj.name === 'shirtMeshArmL' ||
          obj.name === 'shirtMeshArmR' ||
          obj.name === 'hatMeshVisor'
        )
          mat.color.copy(cShirt);
        if (obj.name === 'pantsMesh') mat.color.copy(cPants);
        if (obj.name === 'shoeMesh') mat.color.copy(cShoe);
        if (obj.name === 'bagMesh') mat.color.copy(cBag);
      });
    };

    recenterRef.current = () => {
      if (mode === 'gameplay' && livePlayModeRef.current) {
        pState.camForward.copy(pState.forward);
        pState.camDist = 1.42;
        pState.camElev = 0.56;
      } else {
        camera.position.set(...preset.camera);
        controls.target.set(0, mode === 'npcs' ? 1.2 : 0, 0);
        controls.update();
      }
    };

    applyTimeRef.current = (tod: TimeOfDay) => {
      if (!atmosphere) return;
      atmosphere.applyTime(tod, sun, ambient);
      if (runtime.terrainMaterial) setTerrainLight(runtime.terrainMaterial, sun.position);
      if (runtime.treeLeavesMaterial) setTreeLeavesLight(runtime.treeLeavesMaterial, sun.position);
      if (runtime.gameplayWaterMaterial)
        setGameplayWaterLight(runtime.gameplayWaterMaterial, sun.position);
    };
    if (atmosphere) atmosphere.applyTime(liveTimeRef.current, sun, ambient);

    completeQuestRef.current = (stopId: string, xp: number, label: string) => {
      audio.init();
      audio.playDeliver();
      const node = stopNodes.find((s) => s.stop.id === stopId);
      if (node) spawnConfetti(node.stop.dir, node.surfR);

      if (stopId === 'town-post' && questPhase === 'pickup') {
        questPhase = 'deliver';
        targetIdx = nextDeliverIdx;
        const letter = player.getObjectByName('carriedLetter');
        if (letter) letter.visible = true;
        showToast(`📦 Đã nhận thư! Hãy giao cho ${localStops[targetIdx].name} (+${xp} XP)`);
      } else if (questPhase === 'deliver' && localStops[targetIdx]?.id === stopId) {
        deliveredCount++;
        nextDeliverIdx = nextDeliverIdx >= localStops.length - 1 ? 1 : nextDeliverIdx + 1;
        questPhase = 'pickup';
        targetIdx = 0;
        const letter = player.getObjectByName('carriedLetter');
        if (letter) letter.visible = false;
        showToast(`🎉 Giao thư thành công! +${xp} XP`);
      } else {
        showToast(`✨ Hội thoại tiếng Anh tuyệt vời! +${xp} XP`);
      }

      setCompletedStops((prev) => (prev.includes(stopId) ? prev : [...prev, stopId]));
      setChecklistBadge(true);
      onEarnXpRef.current(xp, label);
      triggerEmoteRef.current?.('✨');
    };

    triggerInteractRef.current = () => {
      if (!currentNearby) return;
      audio.init();
      const quest = ENGLISH_NPC_QUESTS[currentNearby.id] ?? ENGLISH_NPC_QUESTS['town-post'];
      setWardrobeOpen(false);
      setChecklistOpen(false);
      setEmoteDrawerOpen(false);
      setActiveDialog({
        stop: currentNearby,
        quest,
        showVi: false,
        feedback: null,
        completedNow: false,
      });
      speakEnglish(quest.promptEn);
    };

    teleportToStopRef.current = (stopId: string) => {
      const node = stopNodes.find((n) => n.stop.id === stopId);
      if (!node) return;
      audio.init();
      // Place courier cleanly ~2.4m in front of the landmark NPC, facing them
      const tSide = new Vector3(1, 0, 0).cross(node.stop.dir);
      if (tSide.lengthSq() < 0.01) tSide.set(0, 0, 1).cross(node.stop.dir);
      tSide.normalize();
      const arrivalDir = node.stop.dir.clone().addScaledVector(tSide, 0.085).normalize();
      const arrivalSpot = findStreetSpot(arrivalDir, 0.14);
      pState.posDir.copy(arrivalSpot.dir);
      pState.groundR = arrivalSpot.r;
      pState.jumpH = 0;
      pState.jumpVel = 0;
      const toNpc = node.stop.dir.clone().sub(pState.posDir);
      toNpc.addScaledVector(pState.posDir, -toNpc.dot(pState.posDir));
      if (toNpc.lengthSq() > 0.0001) {
        toNpc.normalize();
        pState.forward.copy(toNpc);
        pState.camForward.copy(toNpc);
      }
      const idx = localStops.findIndex((s) => s.id === stopId);
      if (idx >= 0) targetIdx = idx;
      spawnConfetti(pState.posDir, pState.groundR);
      setChecklistOpen(false);
      setZoneBanner(node.stop.landmark.toUpperCase());
      setToast(`🧭 Đã dịch chuyển tới ${node.stop.landmark}!`);
      window.setTimeout(() => setZoneBanner(''), 2600);
      window.setTimeout(() => setToast(''), 2600);
    };

    const codes: Record<string, boolean> = {};
    const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      audio.init();
      if (PREVENT.has(e.code)) e.preventDefault();
      codes[e.code] = true;
      if (e.code === 'KeyE' && !liveDialogOpenRef.current) triggerInteractRef.current?.();
      if (e.code === 'Escape') {
        setActiveDialog(null);
        setWardrobeOpen(false);
        setChecklistOpen(false);
        setEmoteDrawerOpen(false);
      }
      if (e.code === 'Digit1') triggerEmoteRef.current?.('👋');
      if (e.code === 'Digit2') triggerEmoteRef.current?.('❤️');
      if (e.code === 'Digit3') triggerEmoteRef.current?.('✨');
      if (e.code === 'Digit4') triggerEmoteRef.current?.('😊');
      if (e.code === 'Digit5') triggerEmoteRef.current?.('📦');
    };
    const onKeyUp = (e: KeyboardEvent) => {
      codes[e.code] = false;
    };
    const clearKeys = () => {
      for (const c in codes) codes[c] = false;
      pState.dragging = false;
    };
    const onVisChange = () => {
      if (document.hidden) clearKeys();
    };
    const preventDefault = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', onVisChange);

    const dom = renderer.domElement;
    dom.addEventListener('dragstart', preventDefault);
    dom.addEventListener('contextmenu', preventDefault);

    const onPtrDown = (e: PointerEvent) => {
      audio.init();
      if (mode === 'gameplay' && livePlayModeRef.current && !liveWardrobeRef.current && !liveDialogOpenRef.current) {
        try {
          dom.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        pState.dragging = true;
        pState.lastX = e.clientX;
        pState.lastY = e.clientY;
      }
    };
    const onPtrMove = (e: PointerEvent) => {
      if (!pState.dragging || !(mode === 'gameplay' && livePlayModeRef.current)) return;
      if (e.buttons === 0) {
        pState.dragging = false;
        return;
      }
      const dx = e.clientX - pState.lastX;
      const dy = e.clientY - pState.lastY;
      pState.camForward.applyAxisAngle(pState.posDir, -dx * 0.007).normalize();
      pState.camElev = Math.max(0.32, Math.min(3.0, pState.camElev + dy * 0.009));
      pState.lastX = e.clientX;
      pState.lastY = e.clientY;
    };
    const onPtrUp = (e: PointerEvent) => {
      pState.dragging = false;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (mode === 'gameplay' && livePlayModeRef.current && !liveWardrobeRef.current) {
        e.preventDefault();
        pState.camDist = Math.max(0.85, Math.min(6.5, pState.camDist + e.deltaY * 0.0028));
      }
    };

    dom.addEventListener('pointerdown', onPtrDown);
    dom.addEventListener('pointermove', onPtrMove);
    dom.addEventListener('pointerup', onPtrUp);
    dom.addEventListener('pointercancel', onPtrUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const sceneDepthTarget = createSceneDepthTarget(
      Math.max(1, host.clientWidth >> 1),
      Math.max(1, host.clientHeight >> 1)
    );
    const animeInk = new AnimeInkPass(
      Math.max(1, host.clientWidth),
      Math.max(1, host.clientHeight),
      camera
    );
    let waterDepthCaptured = false;
    let updateWorldDetails: ((elapsed: number) => void) | null = null;
    const startedAt = performance.now();
    let cancelled = false;

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      const dw = Math.max(1, clientWidth >> 1);
      const dh = Math.max(1, clientHeight >> 1);
      resizeSceneDepthTarget(sceneDepthTarget, dw, dh);
      animeInk.setSize(clientWidth, clientHeight);
      waterDepthCaptured = false;
      if (runtime.gameplayWaterMaterial) {
        setGameplayWaterDepth(
          runtime.gameplayWaterMaterial,
          sceneDepthTarget.depthTexture,
          dw,
          dh
        );
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const loadScene = async () => {
      setStatus('loading');
      try {
        if (mode === 'gameplay') {
          const { createGameplaySceneGroup } = await import('../lib/messenger/createGameplayScene');
          const bundle = await createGameplaySceneGroup(renderer);
          if (cancelled) return;
          runtime.sceneGroup = bundle.group;
          runtime.terrainMaterial = bundle.terrainMaterial;
          runtime.treeLeavesMaterial = bundle.treeLeavesMaterial;
          runtime.propMaterials = bundle.propMaterials;
          runtime.gameplayWater = bundle.gameplayWater;
          runtime.gameplayWaterMaterial = bundle.gameplayWaterMaterial;
          setTerrainLight(bundle.terrainMaterial, sun.position);
          setTreeLeavesLight(bundle.treeLeavesMaterial, sun.position);
          setGameplayWaterDepth(
            runtime.gameplayWaterMaterial,
            sceneDepthTarget.depthTexture,
            sceneDepthTarget.width,
            sceneDepthTarget.height
          );
          scene.add(bundle.group);
          bundle.group.updateMatrixWorld(true);

          const terrainObj = bundle.group.getObjectByName('GameplayTerrain') ?? bundle.group;
          const chunks: Array<{ mesh: Mesh; box: Box3 }> = [];
          // Airy sky-tinted translucent ShadowMaterial overlay so custom ShaderMaterial terrain
          // receives soft, luminous 3D silhouette shadows (never heavy or dark!)
          const groundShadowMat = new ShadowMaterial({
            color: 0x3b6e80,
            opacity: 0.19,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1.5,
            polygonOffsetUnits: -2,
          });
          const shadowReceivers: Mesh[] = [];
          terrainObj.traverse((obj) => {
            if ((obj as Mesh).isMesh) {
              const m = obj as Mesh;
              m.castShadow = true;
              m.receiveShadow = false;
              const geo = m.geometry as BufferGeometry & { computeBoundsTree?: () => void };
              if (geo.computeBoundsTree && !(geo as unknown as { boundsTree?: unknown }).boundsTree) {
                geo.computeBoundsTree();
              }
              const b = new Box3().setFromObject(m);
              chunks.push({ mesh: m, box: b });

              const sr = new Mesh(m.geometry, groundShadowMat);
              sr.receiveShadow = true;
              sr.castShadow = false;
              sr.visible = GFX_META[liveGfxRef.current].shadows;
              sr.renderOrder = 2;
              shadowReceivers.push(sr);
            }
          });
          shadowReceivers.forEach((sr) => terrainObj.add(sr));
          runtime.shadowReceivers = shadowReceivers;

          // Let trees cast leafy shadows onto grassy hills & boulders too!
          const leavesObj = bundle.group.getObjectByName('TreeLeaves');
          leavesObj?.traverse((o) => {
            if ((o as Mesh).isMesh) o.castShadow = true;
          });
          runtime.terrainChunks = chunks;
          runtime.terrainMeshes = chunks.map((c) => c.mesh);

          // Scatter living animated world details: swaying grass/flowers, banners, lanterns, butterflies, wind streaks, petals & chimney smoke
          const chunkMeshes = runtime.terrainMeshes;
          const worldDetailsBundle = createWorldDetails(toonGradient, (dir) => {
            const origin = dir.clone().multiplyScalar(16);
            const inward = dir.clone().negate();
            raycaster.set(origin, inward);
            raycaster.far = 16;
            const hits = raycaster.intersectObjects(chunkMeshes, false);
            const hit = hits[0];
            if (!hit || !hit.face) return null;
            const normal = hit.face.normal
              .clone()
              .transformDirection(hit.object.matrixWorld)
              .normalize();
            return { point: hit.point.clone(), normal, radius: hit.point.length() };
          });
          updateWorldDetails = worldDetailsBundle.update;
          // Do NOT enable castShadow on 450+ tiny worldDetails props (saves ~450 shadow draw calls/frame!)
          scene.add(worldDetailsBundle.group);

          const spawnSpot = findStreetSpot(pState.posDir, 0.24);
          pState.posDir.copy(spawnSpot.dir);
          pState.groundR = spawnSpot.r;
          scene.add(player, playerShadowHolder, compassGroup);

          // Spawn 5 fully animated Quest NPCs (breathing, blinking & waving when player approaches — ZERO A-pose!)
          const questNpcStyles: Record<
            string,
            {
              hatColor: number;
              shirtColor: number;
              pantsColor: number;
              shoeColor: number;
              bagColor: number;
              hairStyle: HairStyle;
              topStyle: TopStyle;
            }
          > = {
            'town-post': {
              hatColor: 0x3b4956,
              shirtColor: 0x355c87,
              pantsColor: 0x283442,
              shoeColor: 0x262c34,
              bagColor: 0x6e4f38,
              hairStyle: 'cap',
              topStyle: 'coat',
            },
            'cliff-lookout': {
              hatColor: 0x4b3b34,
              shirtColor: 0x4f9468,
              pantsColor: 0x5c5346,
              shoeColor: 0x4a3b30,
              bagColor: 0x8c6d46,
              hairStyle: 'strawhat',
              topStyle: 'coat',
            },
            'waterfall-cove': {
              hatColor: 0x2e3c4c,
              shirtColor: 0x3e768c,
              pantsColor: 0x36424d,
              shoeColor: 0x232a32,
              bagColor: 0x3f4e5c,
              hairStyle: 'headphones',
              topStyle: 'tee',
            },
            'harbor-town': {
              hatColor: 0x4d3430,
              shirtColor: 0xd97a54,
              pantsColor: 0x3b444e,
              shoeColor: 0x4d352c,
              bagColor: 0xb88642,
              hairStyle: 'buns',
              topStyle: 'coat',
            },
            'south-observatory': {
              hatColor: 0x34414f,
              shirtColor: 0xc99638,
              pantsColor: 0x2e3945,
              shoeColor: 0x242a32,
              bagColor: 0x4a5b6b,
              hairStyle: 'bob',
              topStyle: 'coat',
            },
          };

          localStops.forEach((stop) => {
            const streetSpot = findStreetSpot(stop.dir, 0.22);
            stop.dir.copy(streetSpot.dir);
            const surfR = streetSpot.r;
            const style = questNpcStyles[stop.id] ?? questNpcStyles['town-post'];
            const npc = buildChibiCourier(toonGradient, style);
            npc.name = 'AnimatedNpc';
            npc.traverse((o) => {
              if ((o as Mesh).isMesh && !o.name.endsWith('_outline')) o.castShadow = true;
            });
            npc.position.copy(stop.dir).multiplyScalar(surfR);
            npc.quaternion.setFromUnitVectors(UP, stop.dir);
            npc.add(createSoftDropShadow(0.14));
            scene.add(npc);

            const ring = new Mesh(
              new RingGeometry(0.17, 0.23, 22),
              new MeshBasicMaterial({
                color: 0xf5bd33,
                transparent: true,
                opacity: 0.75,
                side: DoubleSide,
                depthWrite: false,
              })
            );
            ring.rotation.x = -Math.PI / 2;
            const rh = new Group();
            rh.add(ring);
            rh.position.copy(stop.dir).multiplyScalar(surfR + 0.04);
            rh.quaternion.setFromUnitVectors(UP, stop.dir);
            scene.add(rh);

            const isDoneInit = liveCompletedStopsRef.current.includes(stop.id);
            const badge = new Sprite(
              new SpriteMaterial({
                map: isDoneInit ? badgeTexDone : badgeTexTodo,
                transparent: true,
                depthWrite: false,
              })
            );
            badge.scale.set(0.16, 0.16, 1);
            badge.position.copy(stop.dir).multiplyScalar(surfR + 0.44);
            scene.add(badge);

            stopNodes.push({ stop, npc, ring, badge, badgeDone: isDoneInit, surfR });
          });

          // Spawn 5 fully animated strolling townsfolk following multi-waypoint street & coastal routes!
          const strollRouteSpecs: Array<{
            name: string;
            style: {
              hatColor: number;
              shirtColor: number;
              pantsColor: number;
              shoeColor: number;
              bagColor: number;
              hairStyle: HairStyle;
              topStyle: TopStyle;
            };
            rawWaypoints: Vector3[];
            speed: number;
            phase: number;
          }> = [
            {
              name: 'TownStreetWalker',
              style: {
                hatColor: 0x384654,
                shirtColor: 0x4b87a8,
                pantsColor: 0x2d3a46,
                shoeColor: 0x232930,
                bagColor: 0x7c5b42,
                hairStyle: 'bob',
                topStyle: 'coat',
              },
              rawWaypoints: [
                new Vector3(0.20, 0.90, 0.39),
                new Vector3(0.27, 0.87, 0.41),
                new Vector3(0.24, 0.85, 0.47),
                new Vector3(0.15, 0.89, 0.43),
              ],
              speed: 0.068,
              phase: 0.0,
            },
            {
              name: 'HarborDockWalker',
              style: {
                hatColor: 0x4f3d35,
                shirtColor: 0x5aa378,
                pantsColor: 0x3b444e,
                shoeColor: 0x3c312b,
                bagColor: 0x8f6b47,
                hairStyle: 'strawhat',
                topStyle: 'tee',
              },
              rawWaypoints: [
                new Vector3(0.10, 0.92, 0.38),
                new Vector3(0.03, 0.90, 0.43),
                new Vector3(0.08, 0.87, 0.48),
                new Vector3(0.16, 0.90, 0.41),
              ],
              speed: 0.062,
              phase: 1.5,
            },
            {
              name: 'CliffTrailWalker',
              style: {
                hatColor: 0x2e3b48,
                shirtColor: 0xd9895b,
                pantsColor: 0x303a45,
                shoeColor: 0x252c34,
                bagColor: 0x4d5d6e,
                hairStyle: 'headphones',
                topStyle: 'coat',
              },
              rawWaypoints: [
                new Vector3(-0.56, 0.72, 0.41),
                new Vector3(-0.48, 0.76, 0.44),
                new Vector3(-0.52, 0.69, 0.50),
                new Vector3(-0.61, 0.67, 0.42),
              ],
              speed: 0.065,
              phase: 2.9,
            },
            {
              name: 'WaterfallMeadowWalker',
              style: {
                hatColor: 0x47353c,
                shirtColor: 0xd46a84,
                pantsColor: 0x323d4a,
                shoeColor: 0x2a3038,
                bagColor: 0xc29248,
                hairStyle: 'buns',
                topStyle: 'tee',
              },
              rawWaypoints: [
                new Vector3(0.75, 0.16, -0.64),
                new Vector3(0.70, 0.24, -0.67),
                new Vector3(0.68, 0.12, -0.72),
                new Vector3(0.77, 0.08, -0.63),
              ],
              speed: 0.058,
              phase: 4.2,
            },
            {
              name: 'HarborCafeWalker',
              style: {
                hatColor: 0x303d4a,
                shirtColor: 0xd9a944,
                pantsColor: 0x2c3642,
                shoeColor: 0x232930,
                bagColor: 0x614b3c,
                hairStyle: 'cap',
                topStyle: 'coat',
              },
              rawWaypoints: [
                new Vector3(-0.46, -0.67, 0.58),
                new Vector3(-0.38, -0.71, 0.59),
                new Vector3(-0.42, -0.75, 0.51),
                new Vector3(-0.51, -0.69, 0.51),
              ],
              speed: 0.064,
              phase: 5.4,
            },
          ];

          strollRouteSpecs.forEach((spec) => {
            const snappedWps = spec.rawWaypoints.map(
              (wp) => findStreetSpot(wp.clone().normalize(), 0.18).dir
            );
            const startSpot = findStreetSpot(snappedWps[0], 0.12);
            const wNpc = buildChibiCourier(toonGradient, spec.style);
            wNpc.name = 'AnimatedNpc';
            wNpc.traverse((o) => {
              if ((o as Mesh).isMesh && !o.name.endsWith('_outline')) o.castShadow = true;
            });
            wNpc.position.copy(startSpot.dir).multiplyScalar(startSpot.r);
            wNpc.quaternion.setFromUnitVectors(UP, startSpot.dir);
            wNpc.add(createSoftDropShadow(0.13));
            scene.add(wNpc);

            const initFwd = snappedWps[1].clone().sub(startSpot.dir);
            initFwd.addScaledVector(startSpot.dir, -initFwd.dot(startSpot.dir));
            if (initFwd.lengthSq() < 0.0001) initFwd.set(0, 0, 1);
            initFwd.normalize();

            strollingNpcs.push({
              group: wNpc,
              waypoints: snappedWps,
              wpIdx: 1,
              pauseUntil: 0,
              posDir: startSpot.dir.clone(),
              forward: initFwd,
              groundR: startSpot.r,
              speed: spec.speed,
              phase: spec.phase,
            });
          });

          if (cancelled) return;
        } else if (mode === 'npcs') {
          const { createNpcGalleryGroup } = await import('../lib/messenger/createNpcGallery');
          const bundle = await createNpcGalleryGroup(renderer);
          if (cancelled) return;
          runtime.sceneGroup = bundle.group;
          runtime.npcMixers = bundle.mixers;
          bundle.npcMaterial.uniforms.uLightPosition.value.copy(sun.position);
          scene.add(bundle.group);
        } else {
          const { createIntroSceneGroup } = await import('../lib/messenger/createIntroScene');
          const bundle = await createIntroSceneGroup(renderer);
          if (cancelled) return;
          runtime.sceneGroup = bundle.group;
          runtime.materials = bundle.materials;
          setMessengerLight(runtime.materials, sun.position);
          scene.add(bundle.group);
        }

        scene.traverse((obj) => {
          const mat = (obj as Mesh).material as Material | Material[] | undefined;
          if (!mat) return;
          if (Array.isArray(mat)) mat.forEach(patchMaterialForInk);
          else patchMaterialForInk(mat);
        });
        runtime.ready = true;
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load Messenger 3D scene:', err);
        setStatus('error');
      }
    };

    void loadScene();

    const tmpRight = new Vector3();
    const tmpFwd = new Vector3();
    const tmpMove = new Vector3();
    const tmpMat = new Matrix4();
    const tmpQ = new Quaternion();
    const camDesired = new Vector3();
    const camLook = new Vector3();
    const sunDirOffset = new Vector3(10, 14, 7);

    let fpsFrames = 0;
    let lastFpsT = performance.now();
    let fpsVal = 60;
    let frameCount = 0;

    const tick = () => {
      runtime.frame = requestAnimationFrame(tick);
      const now = performance.now();
      const delta = Math.min(0.05, (now - runtime.lastFrame) / 1000);
      runtime.lastFrame = now;
      const elapsed = (now - startedAt) / 1000;
      frameCount++;
      fpsFrames++;
      if (now - lastFpsT >= 600) {
        fpsVal = Math.round((fpsFrames * 1000) / (now - lastFpsT));
        fpsFrames = 0;
        lastFpsT = now;
      }

      if (atmosphere) atmosphere.cloudRing.rotation.y += 0.001;
      if (birdsRig) birdsRig.update(elapsed);
      if (updateWorldDetails) updateWorldDetails(elapsed);
      if (dustRig) dustRig.update();
      if (rippleRig) rippleRig.update();

      // Update 5 strolling NPCs smoothly along their multi-waypoint street & coastal routes!
      if (strollingNpcs.length > 0 && runtime.ready) {
        const isPlay = mode === 'gameplay' && livePlayModeRef.current;
        for (let i = 0; i < strollingNpcs.length; i++) {
          const s = strollingNpcs[i];
          const nearPlayer = !isPlay || s.posDir.dot(pState.posDir) > -0.15;
          s.group.visible = nearPlayer;
          const targetWp = s.waypoints[s.wpIdx];
          let isWalking = false;

          if (elapsed >= s.pauseUntil) {
            const distToWp = s.posDir.angleTo(targetWp);
            if (distToWp < 0.012) {
              // Arrived at waypoint: pause naturally to look around, then head to next waypoint!
              s.wpIdx = (s.wpIdx + 1) % s.waypoints.length;
              s.pauseUntil = elapsed + 1.8 + (i % 3) * 0.55;
            } else {
              isWalking = true;
              tmpMove.copy(targetWp).sub(s.posDir);
              tmpMove.addScaledVector(s.posDir, -tmpMove.dot(s.posDir));
              if (tmpMove.lengthSq() > 0.00001) {
                tmpMove.normalize();
                const step = Math.min(distToWp, s.speed * delta);
                s.posDir.addScaledVector(tmpMove, step).normalize();
                s.forward.lerp(tmpMove, Math.min(1, 7 * delta));
                s.forward.addScaledVector(s.posDir, -s.forward.dot(s.posDir)).normalize();
              }

              // Resample BVH ground height only when on visible hemisphere (every 5 frames)
              if (nearPlayer && (frameCount + i) % 5 === 0) {
                const gHit = sampleLocalGround(s.posDir, s.groundR, 0.35);
                if (gHit && Math.abs(gHit - s.groundR) < 0.5) {
                  s.groundR += (gHit - s.groundR) * 0.45;
                }
              }
            }
          }

          if (!nearPlayer) continue;
          s.group.position.copy(s.posDir).multiplyScalar(s.groundR);
          tmpRight.crossVectors(s.posDir, s.forward).normalize();
          tmpMat.makeBasis(tmpRight, s.posDir, s.forward);
          tmpQ.setFromRotationMatrix(tmpMat);
          s.group.quaternion.slerp(tmpQ, 0.18);

          // Full anime walking / idle breathing / blinking animation!
          animateChibi(s.group, {
            t: elapsed,
            phase: s.phase,
            moving: isWalking,
            sprinting: false,
          });
        }
      }

      if (mode === 'gameplay' && livePlayModeRef.current && runtime.ready) {
        controls.enabled = false;
        player.visible = true;
        playerShadowHolder.visible = true;

        pState.camForward.addScaledVector(pState.posDir, -pState.camForward.dot(pState.posDir));
        if (pState.camForward.lengthSq() < 0.0001) {
          pState.camForward.set(0, 0, 1).addScaledVector(pState.posDir, -pState.posDir.z);
        }
        pState.camForward.normalize();
        tmpFwd.copy(pState.camForward);
        tmpRight.crossVectors(tmpFwd, pState.posDir).normalize();

        let inFwd = 0;
        let inRight = 0;
        if (!liveDialogOpenRef.current && !liveWardrobeRef.current) {
          if (codes['KeyW'] || codes['ArrowUp']) inFwd += 1;
          if (codes['KeyS'] || codes['ArrowDown']) inFwd -= 1;
          if (codes['KeyD'] || codes['ArrowRight']) inRight += 1;
          if (codes['KeyA'] || codes['ArrowLeft']) inRight -= 1;
        }

        const moving = inFwd !== 0 || inRight !== 0;
        const sprinting = Boolean(codes['ShiftLeft'] || codes['ShiftRight']);

        if (moving) {
          tmpMove
            .set(0, 0, 0)
            .addScaledVector(tmpFwd, inFwd)
            .addScaledVector(tmpRight, inRight)
            .normalize();
          // Frame-rate-independent crisp movement speed (identical snappy pace at 60/120/165 FPS!)
          const angSpeed = (sprinting ? 0.44 : 0.26) * delta;
          const allowedMove = checkWallSlide(pState.posDir, tmpMove, pState.groundR + pState.jumpH);
          if (allowedMove) {
            pState.posDir.addScaledVector(allowedMove, angSpeed).normalize();
            pState.forward.lerp(allowedMove, Math.min(1, 14 * delta));
          } else {
            pState.forward.lerp(tmpMove, Math.min(1, 9 * delta));
          }
          pState.forward.addScaledVector(pState.posDir, -pState.forward.dot(pState.posDir)).normalize();

          const headroom = pState.jumpH > 0.05 ? pState.jumpH + 0.14 : 0.26;
          const sampled =
            sampleLocalGround(pState.posDir, pState.groundR, headroom) ??
            sampleTerrainRadius(pState.posDir, 6.8);
          const diff = sampled - pState.groundR;
          if (diff < -0.12 && pState.jumpH <= 0.01) {
            pState.jumpH += pState.groundR - sampled;
            pState.groundR = sampled;
          } else if (diff <= 0.24 || pState.jumpH + pState.groundR >= sampled - 0.08) {
            pState.groundR += diff * 0.45;
          }
          if (frameCount % (sprinting ? 11 : 16) === 0 && pState.jumpH < 0.03) {
            audio.playStep();
            if (pState.groundR < 6.72) {
              rippleRig?.spawn(player.position, pState.posDir);
            } else if (sprinting) {
              dustRig?.spawn(player.position, pState.posDir, 1, 0.012);
            }
          }
        } else {
          pState.forward.addScaledVector(pState.posDir, -pState.forward.dot(pState.posDir)).normalize();
        }

        const jumpHeld = !liveDialogOpenRef.current && !liveWardrobeRef.current && Boolean(codes['Space']);
        if (jumpHeld && pState.jumpH <= 0.008 && pState.jumpVel <= 0) {
          pState.jumpVel = 0.068;
          pState.squash = 1.26;
          audio.playJump();
          dustRig?.spawn(player.position, pState.posDir, 4, 0.018);
        }
        if (pState.jumpH > 0 || pState.jumpVel > 0) {
          const gliding = jumpHeld && pState.jumpVel < 0;
          pState.jumpVel -= gliding ? 0.0014 : 0.0044;
          if (gliding && pState.jumpVel < -0.014) pState.jumpVel = -0.014;
          pState.jumpH += pState.jumpVel;
          if (pState.jumpH <= 0) {
            pState.jumpH = 0;
            pState.jumpVel = 0;
            pState.squash = 0.78;
            dustRig?.spawn(player.position, pState.posDir, 5, 0.022);
          }
        }
        pState.squash += (1 - pState.squash) * 0.18;

        player.position.copy(pState.posDir).multiplyScalar(pState.groundR + pState.jumpH);
        tmpRight.crossVectors(pState.posDir, pState.forward).normalize();
        tmpMat.makeBasis(tmpRight, pState.posDir, pState.forward);
        tmpQ.setFromRotationMatrix(tmpMat);
        player.quaternion.slerp(tmpQ, 0.35);

        // World-locked directional sun ~55 deg above player's local horizon (throttled to every 3 frames!)
        const wantShadows = GFX_META[liveGfxRef.current].shadows;
        if (renderer.shadowMap.enabled !== wantShadows) {
          renderer.shadowMap.enabled = wantShadows;
          for (let i = 0; i < runtime.shadowReceivers.length; i++) {
            runtime.shadowReceivers[i].visible = wantShadows;
          }
          if (wantShadows) renderer.shadowMap.needsUpdate = true;
        }
        if (wantShadows && frameCount % 3 === 0) {
          sun.target.position.copy(player.position);
          // Fixed world-space tangent axis so building & character shadows stay physically rock-solid!
          const fixedSide = new Vector3(0.75, 0.25, 0.61);
          fixedSide.addScaledVector(pState.posDir, -fixedSide.dot(pState.posDir));
          if (fixedSide.lengthSq() < 0.01) fixedSide.set(1, 0, 0).cross(pState.posDir);
          fixedSide.normalize();
          sunDirOffset
            .copy(pState.posDir)
            .multiplyScalar(10.5)
            .addScaledVector(fixedSide, 6.2);
          sun.position.copy(player.position).add(sunDirOffset);
          sun.target.updateMatrixWorld();
          renderer.shadowMap.needsUpdate = true;
        }

        // Subtle contact AO shadow under feet (real 3D shadow handles the full silhouette!)
        playerShadowHolder.position.copy(pState.posDir).multiplyScalar(pState.groundR + 0.022);
        playerShadowHolder.quaternion.setFromUnitVectors(UP, pState.posDir);
        (playerShadowDisc.material as MeshBasicMaterial).opacity = Math.max(0.08, 0.26 - pState.jumpH * 0.2);
        playerShadowDisc.scale.setScalar(Math.max(0.42, 0.88 - pState.jumpH * 0.35));

        let emoteAction: EmoteAction = null;
        let emoteProgress = 0;
        if (activeEmoteAnim) {
          const p = (now - activeEmoteAnim.start) / activeEmoteAnim.dur;
          if (p >= 1) {
            activeEmoteAnim = null;
          } else {
            emoteAction = activeEmoteAnim.action;
            emoteProgress = p;
          }
        }

        animateChibi(player, {
          t: elapsed,
          moving,
          sprinting,
          jumpH: pState.jumpH,
          jumpHeld,
          squash: pState.squash,
          emoteAction,
          emoteProgress,
        });

        if (atmosphere) atmosphere.skyMat.uniforms.uLocalUp.value.copy(pState.posDir);

        const activeTarget = localStops[targetIdx];
        stopNodes.forEach((node, idx) => {
          const onFrontHemisphere = node.stop.dir.dot(pState.posDir) > -0.15;
          node.npc.visible = onFrontHemisphere;
          node.badge.visible = onFrontHemisphere;
          if (!onFrontHemisphere) return;

          const isTarget = idx === targetIdx;
          const isDone = liveCompletedStopsRef.current.includes(node.stop.id);
          (node.ring.material as MeshBasicMaterial).color.setHex(
            isDone ? 0x4ade80 : isTarget ? 0xf5bd33 : 0xffffff
          );
          (node.ring.material as MeshBasicMaterial).opacity = isTarget
            ? 0.55 + Math.sin(elapsed * 5) * 0.3
            : 0.22;
          node.ring.scale.setScalar(isTarget ? 1 + Math.sin(elapsed * 4) * 0.15 : 0.85);

          // Animate floating 3D quest speech badge above NPC head
          if (node.badgeDone !== isDone) {
            node.badgeDone = isDone;
            (node.badge.material as SpriteMaterial).map = isDone ? badgeTexDone : badgeTexTodo;
            node.badge.material.needsUpdate = true;
          }
          const bob = Math.sin(elapsed * 3.4 + idx * 1.1) * 0.028;
          node.badge.position.copy(node.stop.dir).multiplyScalar(node.surfR + 0.44 + bob);
          const sc = isTarget ? 0.175 + Math.sin(elapsed * 5) * 0.014 : 0.145;
          node.badge.scale.set(sc, sc, 1);

          // Animate Quest NPC (relaxed breathing, eye-blinking & friendly waving when player is close!)
          const isPlayerClose = currentNearby?.id === node.stop.id;
          animateChibi(node.npc, {
            t: elapsed,
            phase: idx * 1.35,
            moving: false,
            emoteAction: isPlayerClose ? 'wave' : null,
          });
          if (isPlayerClose) {
            // Gently turn toward the player when they walk up!
            tmpFwd.copy(pState.posDir).sub(node.stop.dir);
            tmpFwd.addScaledVector(node.stop.dir, -tmpFwd.dot(node.stop.dir));
            if (tmpFwd.lengthSq() > 0.0001) {
              tmpFwd.normalize();
              tmpRight.crossVectors(node.stop.dir, tmpFwd).normalize();
              tmpMat.makeBasis(tmpRight, node.stop.dir, tmpFwd);
              tmpQ.setFromRotationMatrix(tmpMat);
              node.npc.quaternion.slerp(tmpQ, 0.12);
            }
          }
        });

        const arcDist = pState.posDir.angleTo(activeTarget.dir) * 28;
        if (frameCount % 30 === 0) {
          setQuestInfo({
            phase: questPhase,
            stopName: activeTarget.name,
            landmark: activeTarget.landmark,
            distM: Math.round(arcDist),
            delivered: deliveredCount,
            fps: fpsVal,
          });
        }

        const toTarget = activeTarget.dir.clone().sub(pState.posDir);
        toTarget.addScaledVector(pState.posDir, -toTarget.dot(pState.posDir));
        if (toTarget.lengthSq() > 0.001 && arcDist > 3.5 && !liveWardrobeRef.current && !liveDialogOpenRef.current) {
          toTarget.normalize();
          compassGroup.visible = true;
          compassGroup.position
            .copy(pState.posDir)
            .multiplyScalar(pState.groundR + pState.jumpH + 0.36 + Math.sin(elapsed * 5) * 0.025);
          tmpRight.crossVectors(pState.posDir, toTarget).normalize();
          tmpMat.makeBasis(tmpRight, pState.posDir, toTarget);
          compassGroup.quaternion.setFromRotationMatrix(tmpMat);
        } else {
          compassGroup.visible = false;
        }

        if (frameCount % 6 === 0) {
          let closest: QuestStop | null = null;
          let minD = 999;
          for (const n of stopNodes) {
            const d = pState.posDir.angleTo(n.stop.dir) * 28;
            if (d < 4.8 && d < minD) {
              minD = d;
              closest = n.stop;
            }
          }
          if (closest?.id !== currentNearby?.id) {
            currentNearby = closest;
            setNearbyStop(closest);
            setNearbyIsTarget(closest?.id === activeTarget.id);
            if (closest) {
              setZoneBanner(closest.landmark.toUpperCase());
              window.setTimeout(() => setZoneBanner(''), 2600);
            }
          }
        }

        // === CINEMATIC 3-MODE CAMERA (Wardrobe Front / Dialogue 3/4 / Over-the-Shoulder Walk) ===
        if (liveWardrobeRef.current) {
          // Swoop directly in front of the courier so user can inspect outfits live!
          camDesired
            .copy(pState.posDir)
            .multiplyScalar(pState.groundR + 0.28)
            .addScaledVector(pState.forward, 0.85);
          camLook.copy(pState.posDir).multiplyScalar(pState.groundR + 0.19);
        } else if (liveDialogOpenRef.current) {
          // Cinematic 3/4 close-up framing during English NPC conversations
          tmpRight.crossVectors(pState.forward, pState.posDir).normalize();
          camDesired
            .copy(pState.posDir)
            .multiplyScalar(pState.groundR + 0.42)
            .addScaledVector(pState.forward, 0.52)
            .addScaledVector(tmpRight, 0.62);
          camLook
            .copy(pState.posDir)
            .multiplyScalar(pState.groundR + 0.2)
            .addScaledVector(pState.forward, 0.12);
        } else {
          // Grounded over-the-shoulder street-level camera + dynamic sprint pull-back & FOV!
          const sprintExtra = moving && sprinting ? 0.24 : 0;
          const targetFov = moving && sprinting ? 50 : 46;
          if (Math.abs(camera.fov - targetFov) > 0.05) {
            camera.fov += (targetFov - camera.fov) * 0.1;
            camera.updateProjectionMatrix();
          }
          camDesired
            .copy(pState.posDir)
            .multiplyScalar(pState.groundR + pState.camElev + pState.jumpH * 0.3)
            .addScaledVector(pState.camForward, -(pState.camDist + sprintExtra));
          camLook
            .copy(pState.posDir)
            .multiplyScalar(pState.groundR + 0.23 + pState.jumpH * 0.2)
            .addScaledVector(pState.camForward, 0.42);
        }
        camera.position.lerp(camDesired, 0.12);
        camera.up.lerp(pState.posDir, 0.12).normalize();
        camera.lookAt(camLook);
      } else {
        controls.enabled = true;
        player.visible = false;
        playerShadowHolder.visible = false;
        compassGroup.visible = false;
        camera.up.lerp(UP, 0.1).normalize();
        controls.update();
        if (runtime.autoRotate && runtime.sceneGroup) runtime.sceneGroup.rotation.y += 0.0012;
        if (atmosphere) atmosphere.skyMat.uniforms.uLocalUp.value.set(0, 1, 0);
      }

      confettiPool.forEach((c) => {
        if (c.life <= 0) return;
        c.life -= 0.02;
        c.vel.addScaledVector(c.normal, -0.003);
        c.mesh.position.add(c.vel);
        c.mesh.rotation.x += 0.14;
        c.mesh.rotation.y += 0.16;
        c.mesh.scale.setScalar(Math.max(0.01, c.life));
        if (c.life <= 0) c.mesh.visible = false;
      });

      if (frameCount % 2 === 0 && activeEmotes.length > 0) {
        const alive = activeEmotes.filter((e) => e.expires > now);
        activeEmotes.length = 0;
        activeEmotes.push(...alive);
        const rect = dom.getBoundingClientRect();
        const proj: Array<{ id: string; emoji: string; x: number; y: number }> = [];
        for (const em of activeEmotes) {
          const pt = pState.posDir
            .clone()
            .multiplyScalar(pState.groundR + pState.jumpH + 0.48)
            .project(camera);
          if (pt.z < 1) {
            proj.push({
              id: em.id,
              emoji: em.emoji,
              x: (pt.x * 0.5 + 0.5) * rect.width,
              y: (-pt.y * 0.5 + 0.5) * rect.height,
            });
          }
        }
        setFloatingEmotes(proj);
      } else if (frameCount % 15 === 0 && activeEmotes.length === 0) {
        setFloatingEmotes((prev) => (prev.length > 0 ? [] : prev));
      }

      if (runtime.materials) updateMessengerMaterials(runtime.materials, elapsed);
      if (runtime.treeLeavesMaterial) updateTreeLeavesMaterial(runtime.treeLeavesMaterial, elapsed);

      // Sync local player state to Single Global Online Server (~15 Hz) & animate remote players!
      if (onlineClient && mode === 'gameplay' && runtime.ready) {
        if (now - lastNetSend > 66) {
          lastNetSend = now;
          const movingNow = Boolean(
            codes['KeyW'] ||
              codes['KeyS'] ||
              codes['KeyA'] ||
              codes['KeyD'] ||
              codes['ArrowUp'] ||
              codes['ArrowDown'] ||
              codes['ArrowLeft'] ||
              codes['ArrowRight']
          );
          onlineClient.sendState({
            name: liveUserNameRef.current || 'Courier',
            pos: [pState.posDir.x, pState.posDir.y, pState.posDir.z],
            fwd: [pState.forward.x, pState.forward.y, pState.forward.z],
            r: pState.groundR,
            jumpH: pState.jumpH,
            moving: movingNow,
            sprinting: Boolean(codes['ShiftLeft'] || codes['ShiftRight']),
            outfit: liveOutfitRef.current,
          });
        }

        remotePlayers.forEach((rp) => {
          rp.curPosDir.lerp(rp.targetPosDir, 0.22).normalize();
          rp.curFwd.lerp(rp.targetFwd, 0.22);
          rp.curFwd.addScaledVector(rp.curPosDir, -rp.curFwd.dot(rp.curPosDir));
          if (rp.curFwd.lengthSq() > 0.0001) rp.curFwd.normalize();
          rp.curR += (rp.targetR - rp.curR) * 0.25;

          rp.group.position.copy(rp.curPosDir).multiplyScalar(rp.curR + rp.jumpH);
          tmpRight.crossVectors(rp.curPosDir, rp.curFwd).normalize();
          tmpMat.makeBasis(tmpRight, rp.curPosDir, rp.curFwd);
          tmpQ.setFromRotationMatrix(tmpMat);
          rp.group.quaternion.slerp(tmpQ, 0.25);

          rp.nameSprite.position.copy(rp.curPosDir).multiplyScalar(rp.curR + rp.jumpH + 0.42);
          const emActive = now < rp.emoteUntil ? rp.emoteAction : null;
          animateChibi(rp.group, {
            t: elapsed,
            moving: rp.moving,
            sprinting: rp.sprinting,
            jumpH: rp.jumpH,
            emoteAction: emActive,
            emoteProgress: emActive ? 1 - (rp.emoteUntil - now) / 1400 : 0,
          });
        });
      }
      if (runtime.gameplayWaterMaterial) {
        updateGameplayWaterMaterial(runtime.gameplayWaterMaterial, elapsed);
      }
      for (const material of runtime.propMaterials) {
        material.uniforms.uTime.value = elapsed;
      }
      for (const mixer of runtime.npcMixers) {
        mixer.update(delta);
      }

      if (mode === 'gameplay' && runtime.gameplayWater && runtime.gameplayWaterMaterial) {
        if (runtime.ready && !waterDepthCaptured) {
          waterDepthCaptured = true;
          runtime.gameplayWater.visible = false;
          renderer.setRenderTarget(sceneDepthTarget);
          renderer.clear();
          renderer.render(scene, camera);
          renderer.setRenderTarget(null);
          runtime.gameplayWater.visible = true;
          setGameplayWaterDepth(
            runtime.gameplayWaterMaterial,
            sceneDepthTarget.depthTexture,
            sceneDepthTarget.width,
            sceneDepthTarget.height
          );
        }
      }

      if (atmosphere) atmosphere.skyMat.uniforms.uTime.value = elapsed;

      const curQ = liveGfxRef.current;
      if (curQ !== 'eco' && mode !== 'npcs') {
        inkDisplayOutput.value = 1;
        animeInk.render(renderer, scene, camera, elapsed);
      } else {
        inkDisplayOutput.value = 0;
        renderer.render(scene, camera);
      }
    };

    applyGfxRef.current = (q: GraphicsQuality) => {
      const m = GFX_META[q];
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, m.maxDpr));
      renderer.shadowMap.enabled = m.shadows;
      if (m.inkScale > 0) animeInk.setResolutionScale(m.inkScale);
    };
    applyGfxRef.current(liveGfxRef.current);

    tick();

    return () => {
      applyGfxRef.current = null;
      cancelled = true;
      cancelAnimationFrame(runtime.frame);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', clearKeys);
      document.removeEventListener('visibilitychange', onVisChange);
      dom.removeEventListener('dragstart', preventDefault);
      dom.removeEventListener('contextmenu', preventDefault);
      dom.removeEventListener('pointerdown', onPtrDown);
      dom.removeEventListener('pointermove', onPtrMove);
      dom.removeEventListener('pointerup', onPtrUp);
      dom.removeEventListener('pointercancel', onPtrUp);
      dom.removeEventListener('wheel', onWheel);
      resizeObserver.disconnect();
      onlineClient?.dispose();
      audio.dispose();
      toonGradient.dispose();
      animeInk.dispose();
      sceneDepthTarget.dispose();
      controls.dispose();
      disposeObject3D(scene);
      renderer.dispose();
      scene.clear();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, [mode]);

  const cycleTime = () => {
    const order: TimeOfDay[] = ['day', 'sunset', 'night'];
    const next = order[(order.indexOf(timeOfDay) + 1) % order.length];
    setTimeOfDay(next);
    showToast(
      next === 'day'
        ? '☀️ Ban ngày xanh ngọc'
        : next === 'sunset'
        ? '🌅 Hoàng hôn pastel'
        : '🌙 Đêm sao dịu nhẹ'
    );
  };

  const handleReplyChoice = (choice: EnglishReplyChoice) => {
    if (!activeDialog) return;
    speakEnglish(choice.npcFeedback);
    if (choice.quality === 'retry') {
      setActiveDialog({ ...activeDialog, feedback: choice.npcFeedback });
      return;
    }
    completeQuestRef.current?.(
      activeDialog.stop.id,
      choice.xp,
      `Hội thoại tiếng Anh cùng ${activeDialog.stop.name}`
    );
    setActiveDialog({
      ...activeDialog,
      feedback: choice.npcFeedback,
      completedNow: true,
    });
  };

  const handleVoiceReply = () => {
    if (!activeDialog) return;
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('⚠️ Trình duyệt chưa hỗ trợ Web Speech Recognition (hãy dùng Chrome/Edge)!');
      return;
    }
    try {
      const rec = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onstart: () => void;
        onend: () => void;
        onerror: () => void;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        start: () => void;
      };
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => {
        setListeningMic(true);
        setVoiceTranscript('');
      };
      rec.onend = () => setListeningMic(false);
      rec.onerror = () => {
        setListeningMic(false);
        showToast('🎙️ Không nghe rõ giọng nói — bạn thử nói lại hoặc chọn câu trả lời bên dưới nhé!');
      };
      rec.onresult = (ev) => {
        const spoken = ev.results?.[0]?.[0]?.transcript?.trim() ?? '';
        setVoiceTranscript(spoken);
        if (spoken.split(/\s+/).length >= 2) {
          const praise = `Awesome English pronunciation! "${spoken}" — thank you so much, courier!`;
          speakEnglish(praise);
          completeQuestRef.current?.(
            activeDialog.stop.id,
            40,
            `Nói tiếng Anh trực tiếp với ${activeDialog.stop.name}`
          );
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
      <style>{`
        .abeto-btn:hover { transform: translateY(-2px) scale(1.04) !important; box-shadow: 4px 6px 0 rgba(36, 48, 56, 0.32), 0 0 0 1px rgba(255,255,255,0.75) inset !important; background: #ffffff !important; }
        .abeto-btn:active { transform: translate(2px, 2px) scale(0.97) !important; box-shadow: 1px 1px 0 rgba(36, 48, 56, 0.25) !important; }
        .abeto-choice:hover { background: #fef9e7 !important; transform: translateX(3px); }
        @keyframes abetoPop { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .abeto-card { animation: abetoPop 0.18s cubic-bezier(.22,1,.36,1); }
      `}</style>
      {/* WebGL Canvas Host (>90% unobstructed viewport!) */}
      <div
        ref={hostRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'grab' }}
      />

      {/* Loading / Error Pill */}
      {status !== 'ready' && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '10px 18px',
            borderRadius: 14,
            border: '2.5px solid #1d2a33',
            boxShadow: '4px 4px 0 #1d2a33',
            background: '#fffdf7',
            color: status === 'error' ? '#b91c1c' : '#1d2a33',
            fontWeight: 800,
            fontSize: 14,
            zIndex: 20,
          }}
        >
          {status === 'loading' ? `✉️ Đang tải thế giới 3D (${mode})…` : 'Không tải được tài nguyên 3D.'}
        </div>
      )}

      {/* Floating 3D-Projected Emoji Bubbles */}
      {floatingEmotes.map((em) => (
        <div
          key={em.id}
          style={{
            position: 'absolute',
            left: em.x,
            top: em.y,
            transform: 'translate(-50%, -100%)',
            background: '#fffdf7',
            border: '2.5px solid #1d2a33',
            boxShadow: '3px 3px 0 #1d2a33',
            borderRadius: 999,
            padding: '4px 11px',
            fontSize: 20,
            pointerEvents: 'none',
            zIndex: 14,
          }}
        >
          {em.emoji}
        </div>
      ))}

      {/* ULTRA-MINIMAL TOP-LEFT STATUS PILL (leaves >90% screen open like Abeto!) */}
      <div
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
        onClick={() => setChecklistOpen((v) => !v)}
        title="Nhấn để mở danh sách nhiệm vụ tiếng Anh"
      >
        <span>📮 {completedStops.length}/5</span>
        <span style={{ color: '#64748b' }}>·</span>
        <span>{questInfo.landmark} ({questInfo.distM}m)</span>
        <span style={{ color: '#64748b' }}>·</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: onlineConnected ? '#0f766e' : '#b45309',
          }}
          title="1 Server Online duy nhất — tự động kết nối không cần mã phòng"
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: onlineConnected ? '#22c55e' : '#f59e0b',
              display: 'inline-block',
            }}
          />
          {onlineConnected ? `Online (${onlineCount})` : 'Đang kết nối...'}
        </span>
        <span style={{ color: '#64748b' }}>·</span>
        <span style={{ color: questInfo.fps >= 40 ? '#15803d' : '#b45309' }}>
          {questInfo.fps} FPS
        </span>
        <span
          onClick={(e) => {
            e.stopPropagation();
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

      {/* COMPACT GLOBAL SERVER CHAT (Bottom-Left next to Fullscreen — zero room codes!) */}
      {!activeDialog && mode === 'gameplay' && (
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
              className="abeto-card"
              style={{
                width: 'min(290px, calc(100vw - 170px))',
                background: 'rgba(255, 253, 247, 0.96)',
                border: '2px solid #243038',
                boxShadow: '4px 5px 0 rgba(36, 48, 56, 0.28)',
                borderRadius: 14,
                padding: '9px 10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                  fontSize: 11.5,
                  fontWeight: 900,
                  color: '#243038',
                }}
              >
                <span>🌐 Chat Server Chung ({onlineCount} Online)</span>
                <button
                  onClick={() => setChatOpen(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#465a67',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  <X size={14} strokeWidth={2.6} />
                </button>
              </div>
              <div
                style={{
                  maxHeight: 120,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginBottom: 7,
                  fontSize: 11.5,
                }}
              >
                {chatMessages.length === 0 ? (
                  <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                    Chào mọi người bằng tiếng Anh hoặc tiếng Việt nhé!
                  </div>
                ) : (
                  chatMessages.map((m, idx) => (
                    <div key={`${m.ts}-${idx}`} style={{ color: '#1d2a33', lineHeight: 1.35 }}>
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
                  placeholder="Nhắn tin lên server..."
                  style={{
                    flex: 1,
                    border: '1.5px solid #94a3b8',
                    borderRadius: 8,
                    padding: '4px 8px',
                    fontSize: 11.5,
                    fontFamily: 'inherit',
                    background: '#fff',
                    color: '#1d2a33',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    border: '2px solid #243038',
                    background: '#ffd859',
                    color: '#243038',
                    borderRadius: 8,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Send size={13} strokeWidth={2.5} />
                </button>
              </form>
            </div>
          )}

          <button
            className="abeto-btn"
            onClick={() => setChatOpen((v) => !v)}
            title="Chat với mọi người trên server chung"
            style={{
              border: '2px solid #243038',
              background: chatOpen
                ? '#ffd859'
                : 'linear-gradient(180deg, #ffffff 0%, #f6f2e8 100%)',
              color: '#243038',
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
            <MessageCircle size={14} strokeWidth={2.4} />
            <span>Chat ({onlineCount})</span>
          </button>
        </div>
      )}

      {/* ZONE ENTRY NAMEPLATE (Abeto-style minimal district banner) */}
      {zoneBanner && !activeDialog && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 17,
            background: 'rgba(255, 253, 247, 0.94)',
            border: '2.5px solid #1d2a33',
            boxShadow: '3px 3px 0 #1d2a33',
            borderRadius: 10,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: '#1d2a33',
            pointerEvents: 'none',
          }}
        >
          📍 {zoneBanner}
        </div>
      )}

      {/* TOP-RIGHT ABETO-STYLE CHECKLIST PAPER CARD BUTTON */}
      {!activeDialog && (
        <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 18 }}>
          <button
            className="abeto-btn"
            title="Danh sách nhiệm vụ giao tiếp tiếng Anh (Checklist)"
            onClick={() => {
              setChecklistOpen((v) => !v);
              setChecklistBadge(false);
              setWardrobeOpen(false);
              setEmoteDrawerOpen(false);
            }}
            style={{
              ...PAPER_BTN_STYLE,
              position: 'relative',
              background: checklistOpen
                ? 'linear-gradient(180deg, #fde08d 0%, #f5bd33 100%)'
                : PAPER_BTN_STYLE.background,
              color: checklistOpen ? '#1f2933' : '#465a67',
              transform: checklistOpen ? 'rotate(-2deg)' : 'rotate(2deg)',
            }}
          >
            <ClipboardList size={21} strokeWidth={2.3} />
            {checklistBadge && (
              <span
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid #fffdf7',
                }}
              />
            )}
          </button>
        </div>
      )}

      {/* TILTED HANDWRITTEN-STYLE CHECKLIST PAPER CARD */}
      {checklistOpen && (
        <div
          style={{
            position: 'absolute',
            top: 66,
            right: 16,
            zIndex: 20,
            width: 'min(300px, calc(100vw - 32px))',
            background: '#fffdf7',
            border: '2.5px solid #1d2a33',
            boxShadow: '5px 5px 0 #1d2a33',
            borderRadius: 14,
            padding: '13px 15px',
            transform: 'rotate(-1deg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#1d2a33', letterSpacing: '0.04em' }}>
              📝 ENGLISH CHECKLIST ({completedStops.length}/5)
            </span>
            <button
              onClick={() => setChecklistOpen(false)}
              style={{
                border: '2px solid #1d2a33',
                background: '#ef4444',
                color: '#fff',
                width: 24,
                height: 24,
                borderRadius: 7,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {Object.values(ENGLISH_NPC_QUESTS).map((q) => {
              const done = completedStops.includes(q.stopId);
              return (
                <div
                  key={q.stopId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    color: done ? '#15803d' : '#1d2a33',
                    textDecoration: done ? 'line-through' : 'none',
                    padding: '4px 7px',
                    borderRadius: 8,
                    background: done ? '#dcfce7' : '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                  }}
                >
                  <span>{done ? '✅' : '⬜'}</span>
                  <span style={{ flex: 1 }}>{q.checklistTitle}</span>
                  {mode === 'gameplay' && (
                    <button
                      onClick={() => teleportToStopRef.current?.(q.stopId)}
                      title="Dịch chuyển nhanh tới địa điểm 3D này"
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
                        textDecoration: 'none',
                      }}
                    >
                      <MapPin size={11} strokeWidth={2.5} />
                      Đi tới
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
            {(['intro', 'gameplay', 'npcs'] as SceneMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setActiveDialog(null);
                }}
                style={{
                  flex: 1,
                  border: '2px solid #1d2a33',
                  background: mode === m ? '#f5bd33' : '#fff',
                  color: '#1d2a33',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '4px 6px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {m === 'intro' ? 'Intro' : m === 'gameplay' ? 'Gameplay' : 'NPCs'}
              </button>
            ))}
          </div>

          {mode === 'gameplay' && (
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                onClick={() => setPlayMode(true)}
                style={{
                  flex: 1,
                  border: '2px solid #1d2a33',
                  background: playMode ? '#f5bd33' : '#fff',
                  color: '#1d2a33',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '4px 6px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                🚶 Đi dạo
              </button>
              <button
                onClick={() => setPlayMode(false)}
                style={{
                  flex: 1,
                  border: '2px solid #1d2a33',
                  background: !playMode ? '#f5bd33' : '#fff',
                  color: '#1d2a33',
                  fontWeight: 800,
                  fontSize: 11.5,
                  padding: '4px 6px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                🌐 Xoay tự do
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM-RIGHT ABETO-STYLE VERTICAL PAPER-CARD TOOLBAR (auto-hides during dialogue!) */}
      {!activeDialog && (
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 14,
          zIndex: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
        }}
      >
        <button
          className="abeto-btn"
          title={soundMuted ? 'Bật nhạc nền (Kevin Colombin OST)' : 'Tắt nhạc nền'}
          onClick={() => {
            setSoundMuted((v) => {
              const next = !v;
              if (!next) audioRef.current?.init();
              return next;
            });
          }}
          style={{
            ...PAPER_BTN_STYLE,
            color: soundMuted ? '#94a3b8' : '#465a67',
            transform: 'rotate(-1.8deg)',
          }}
        >
          {soundMuted ? <VolumeX size={20} strokeWidth={2.3} /> : <Music size={20} strokeWidth={2.3} />}
        </button>

        <button
          className="abeto-btn"
          title="Tủ đồ Courier (Camera tự xoay cận mặt)"
          onClick={() => {
            setWardrobeOpen((v) => !v);
            setChecklistOpen(false);
            setEmoteDrawerOpen(false);
            setActiveDialog(null);
          }}
          style={{
            ...PAPER_BTN_STYLE,
            background: wardrobeOpen
              ? 'linear-gradient(180deg, #fde08d 0%, #f5bd33 100%)'
              : PAPER_BTN_STYLE.background,
            color: wardrobeOpen ? '#1f2933' : '#465a67',
            transform: 'rotate(1.8deg)',
          }}
        >
          <Shirt size={20} strokeWidth={2.3} />
        </button>

        <button
          className="abeto-btn"
          title="Biểu cảm Emotes (Phím 1–5)"
          onClick={() => {
            setEmoteDrawerOpen((v) => !v);
            setWardrobeOpen(false);
          }}
          style={{
            ...PAPER_BTN_STYLE,
            background: emoteDrawerOpen
              ? 'linear-gradient(180deg, #fde08d 0%, #f5bd33 100%)'
              : PAPER_BTN_STYLE.background,
            color: emoteDrawerOpen ? '#1f2933' : '#465a67',
            transform: 'rotate(-1.2deg)',
          }}
        >
          {lastEmote === '👋' ? <Smile size={20} strokeWidth={2.3} /> : <span style={{ fontSize: 19 }}>{lastEmote}</span>}
        </button>

        <button
          className="abeto-btn"
          title={`${GFX_META[gfxQuality].label} — nhấn để đổi 3 mức đồ họa (Cao / Ink Nhẹ / Siêu mượt)`}
          onClick={() => {
            setGfxQuality((v) => {
              const next = cycleGraphicsQuality(v);
              saveGraphicsQuality(next);
              showToast(GFX_META[next].toast);
              return next;
            });
          }}
          style={{
            ...PAPER_BTN_STYLE,
            color: gfxQuality === 'eco' ? '#d97706' : gfxQuality === 'medium' ? '#15803d' : '#357482',
            transform: 'rotate(1.4deg)',
          }}
        >
          {gfxQuality === 'eco' ? <Zap size={20} strokeWidth={2.3} /> : <Palette size={20} strokeWidth={2.3} />}
        </button>

        <button
          className="abeto-btn"
          title="Đổi thời gian (Ngày/Hoàng hôn/Đêm)"
          onClick={cycleTime}
          style={{ ...PAPER_BTN_STYLE, transform: 'rotate(-1deg)' }}
        >
          {timeOfDay === 'day' ? (
            <Sun size={20} strokeWidth={2.3} />
          ) : timeOfDay === 'sunset' ? (
            <Sunrise size={20} strokeWidth={2.3} />
          ) : (
            <Moon size={20} strokeWidth={2.3} />
          )}
        </button>

        <button
          className="abeto-btn"
          title="Đặt lại góc camera"
          onClick={() => recenterRef.current?.()}
          style={{ ...PAPER_BTN_STYLE, transform: 'rotate(1.2deg)' }}
        >
          <Compass size={20} strokeWidth={2.3} />
        </button>
      </div>
      )}

      {/* ABETO-STYLE 2x4 EMOTE DRAWER */}
      {emoteDrawerOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            right: 68,
            zIndex: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 38px)',
            gap: 6,
            background: '#fffdf7',
            border: '2.5px solid #1d2a33',
            boxShadow: '4px 4px 0 #1d2a33',
            borderRadius: 14,
            padding: 8,
          }}
        >
          {EMOTES.map((e) => (
            <button
              key={e}
              onClick={() => {
                setLastEmote(e);
                triggerEmoteRef.current?.(e);
                setEmoteDrawerOpen(false);
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                border: '2px solid #1d2a33',
                background: '#fff',
                fontSize: 19,
                cursor: 'pointer',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* WARDROBE POPOVER (5-slot customization + localStorage persistence!) */}
      {wardrobeOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 72,
            right: 68,
            zIndex: 20,
            width: 244,
            maxHeight: 'calc(100vh - 160px)',
            overflowY: 'auto',
            background: '#fffdf7',
            border: '2.5px solid #1d2a33',
            boxShadow: '5px 5px 0 #1d2a33',
            borderRadius: 16,
            padding: 13,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#1d2a33' }}>👕 Tủ đồ Courier</span>
            <button
              onClick={() => setWardrobeOpen(false)}
              style={{
                border: '2px solid #1d2a33',
                background: '#ef4444',
                color: '#fff',
                width: 24,
                height: 24,
                borderRadius: 7,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
          <div style={{ marginBottom: 9 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#5b6770', marginBottom: 4 }}>
              Kiểu tóc / Mũ (5 mẫu)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {(
                [
                  { id: 'bob', label: '💇 Tóc Bob' },
                  { id: 'buns', label: '🎀 Búi đôi' },
                  { id: 'cap', label: '🧢 Mũ bưu tá' },
                  { id: 'headphones', label: '🎧 Tai nghe' },
                  { id: 'strawhat', label: '👒 Mũ rơm' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setHairStyle(st.id)}
                  style={{
                    border: '2px solid #1d2a33',
                    background: hairStyle === st.id ? '#f5bd33' : '#fff',
                    color: '#1d2a33',
                    borderRadius: 8,
                    padding: '4px 6px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 9 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#5b6770', marginBottom: 4 }}>
              Kiểu áo
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {(
                [
                  { id: 'coat', label: '🧥 Áo khoác' },
                  { id: 'tee', label: '👕 Áo phông' },
                ] as const
              ).map((tp) => (
                <button
                  key={tp.id}
                  onClick={() => setTopStyle(tp.id)}
                  style={{
                    border: '2px solid #1d2a33',
                    background: topStyle === tp.id ? '#f5bd33' : '#fff',
                    color: '#1d2a33',
                    borderRadius: 8,
                    padding: '4px 6px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: 'Màu tóc', list: HAT_SWATCHES, val: hatColor, set: setHatColor },
            { label: 'Màu áo', list: SHIRT_SWATCHES, val: shirtColor, set: setShirtColor },
            { label: 'Màu quần', list: PANTS_SWATCHES, val: pantsColor, set: setPantsColor },
            { label: 'Màu giày', list: SHOE_SWATCHES, val: shoeColor, set: setShoeColor },
            { label: 'Màu túi đeo', list: BAG_SWATCHES, val: bagColor, set: setBagColor },
          ].map((row) => (
            <div key={row.label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#5b6770', marginBottom: 4 }}>
                {row.label}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {row.list.map((c) => (
                  <button
                    key={c}
                    onClick={() => row.set(c)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: c,
                      border: '2px solid #1d2a33',
                      cursor: 'pointer',
                      outline: row.val === c ? '2.5px solid #f5bd33' : 'none',
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            background: '#1d2a33',
            color: '#fffdf7',
            borderRadius: 999,
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          {toast}
        </div>
      )}

      {/* SUBTLE INTERACT [E] PILL */}
      {mode === 'gameplay' && playMode && nearbyStop && !activeDialog && !wardrobeOpen && (
        <button
          onClick={() => triggerInteractRef.current?.()}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 18,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#1d2a33',
            color: '#fffdf7',
            border: '2.5px solid #fffdf7',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '4px 4px 0 rgba(29,42,51,0.45)',
          }}
        >
          <span
            style={{
              background: '#f5bd33',
              color: '#1d2a33',
              borderRadius: 6,
              padding: '1px 7px',
              fontWeight: 900,
            }}
          >
            E
          </span>
          <span>
            {nearbyIsTarget
              ? `Nói chuyện tiếng Anh với ${nearbyStop.name}`
              : `Gặp gỡ ${nearbyStop.name}`}
          </span>
        </button>
      )}

      {/* INTERACTIVE ABETO-STYLE ENGLISH CONVERSATION QUEST DIALOG */}
      {activeDialog && (
        <div
          style={{
            position: 'absolute',
            bottom: 58,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 24,
            width: 'min(520px, calc(100vw - 96px))',
            background: '#fffdf7',
            border: '3px solid #1d2a33',
            boxShadow: '6px 6px 0 #1d2a33',
            borderRadius: 16,
            padding: '14px 16px',
          }}
        >
          {/* Blue Abeto-style Nameplate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                background: '#2c7a8c',
                color: '#fffdf7',
                border: '2px solid #1d2a33',
                borderRadius: 8,
                padding: '2px 10px',
                fontSize: 11.5,
                fontWeight: 900,
                letterSpacing: '0.04em',
              }}
            >
              {activeDialog.quest.npcRole.toUpperCase()}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="abeto-btn"
                onClick={() => speakEnglish(activeDialog.feedback ?? activeDialog.quest.promptEn)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  border: '2px solid #243038',
                  background: '#e6f5f7',
                  color: '#243038',
                  borderRadius: 8,
                  padding: '3px 9px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Volume2 size={13} strokeWidth={2.5} /> Nghe lại
              </button>
              <button
                onClick={() => setActiveDialog((d) => (d ? { ...d, showVi: !d.showVi } : null))}
                style={{
                  border: '2px solid #1d2a33',
                  background: '#fef3c7',
                  color: '#1d2a33',
                  borderRadius: 8,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {activeDialog.showVi ? 'Ẩn dịch' : '🇻🇳 Gợi ý'}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1d2a33', lineHeight: 1.4 }}>
            “{activeDialog.feedback ?? activeDialog.quest.promptEn}”
          </div>

          {activeDialog.showVi && !activeDialog.feedback && (
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 4 }}>
              {activeDialog.quest.promptVi} · <strong style={{ color: '#b45309' }}>{activeDialog.quest.keyPhrase}</strong>
            </div>
          )}

          {!activeDialog.completedNow ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              <button
                className="abeto-choice"
                onClick={handleVoiceReply}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  border: '2px solid #243038',
                  background: listeningMic ? '#ef4444' : '#e4f6ea',
                  color: listeningMic ? '#fff' : '#1b4d32',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 12.5,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '2px 3px 0 rgba(36, 48, 56, 0.22)',
                  transition: 'all 0.12s ease',
                }}
              >
                <Mic size={15} strokeWidth={2.5} />
                <span>{listeningMic ? 'Đang nghe tiếng Anh của bạn...' : 'Nói tiếng Anh trả lời trực tiếp (+40 XP)'}</span>
              </button>
              {voiceTranscript && (
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb', textAlign: 'center' }}>
                  Bạn vừa nói: “{voiceTranscript}”
                </div>
              )}
              {activeDialog.quest.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleReplyChoice(choice)}
                  style={{
                    textAlign: 'left',
                    border: '2px solid #1d2a33',
                    background: '#fff',
                    color: '#1d2a33',
                    borderRadius: 10,
                    padding: '7px 11px',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 #1d2a33',
                  }}
                >
                  <div>
                    <span style={{ color: '#c93b3b', marginRight: 6 }}>{String.fromCharCode(65 + idx)}.</span>
                    {choice.text}
                  </div>
                  {activeDialog.showVi && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600 }}>
                      {choice.viHint}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              {onEnterDebateArena && (
                <button
                  onClick={onEnterDebateArena}
                  style={{
                    border: '2px solid #1d2a33',
                    background: '#fff',
                    color: '#1d2a33',
                    borderRadius: 10,
                    padding: '6px 12px',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  🎤 Luyện Nói AI
                </button>
              )}
              <button
                onClick={() => setActiveDialog(null)}
                style={{
                  border: '2px solid #1d2a33',
                  background: '#f5bd33',
                  color: '#1d2a33',
                  borderRadius: 10,
                  padding: '6px 15px',
                  fontWeight: 900,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0 #1d2a33',
                }}
              >
                Tiếp tục hành trình ▶
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
