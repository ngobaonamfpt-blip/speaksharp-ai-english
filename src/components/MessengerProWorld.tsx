import React, { useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  Compass,
  Mic,
  Moon,
  Music,
  Palette,
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
import { createWorldDetails } from '../lib/messenger/worldDetails';
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
import type { MessengerComposer } from '../lib/messenger/postProcessing';
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
  onEarnXp,
  onEnterDebateArena,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<SceneMode>('gameplay');
  const [playMode, setPlayMode] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [soundMuted, setSoundMuted] = useState(false);
  const [outlineFx, setOutlineFx] = useState(true);

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
  const liveOutlineFxRef = useRef(outlineFx);
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
  const recenterRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<CozyLoFiAudio | null>(null);
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
    liveOutlineFxRef.current = outlineFx;
  }, [outlineFx]);
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
    // Soft-edged 3D directional shadows (cool sky-tinted like messenger.abeto.co!)
    renderer.shadowMap.enabled = true;
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
    // High-res 2048px soft shadow map + normalBias eliminates all self-shadow acne on curved terrain!
    sun.shadow.mapSize.set(2048, 2048);
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
      composer: null as MessengerComposer | null,
      sceneGroup: null as Group | null,
      terrainChunks: [] as Array<{ mesh: Mesh; box: Box3 }>,
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
      if (runtime.terrainChunks.length === 0) return fallback;
      const origin = dir.clone().multiplyScalar(16);
      const inward = dir.clone().negate();
      raycaster.set(origin, inward);
      raycaster.far = 16;
      const meshes = runtime.terrainChunks.map((c) => c.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) return Math.max(MIN_SURFACE_R, hits[0].point.length());
      return fallback;
    };

    const sampleLocalGround = (dir: Vector3, refR: number, headroom = 0.28): number | null => {
      if (runtime.terrainChunks.length === 0) return null;
      const origin = dir.clone().multiplyScalar(refR + headroom);
      const inward = dir.clone().negate();
      raycaster.set(origin, inward);
      raycaster.far = 8.0;
      const meshes = runtime.terrainChunks.map((c) => c.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
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
      if (runtime.terrainChunks.length === 0) return moveDir;
      // Cast at chest height (+0.22) so low curbs, steps & sidewalks NEVER block walking!
      wallOrigin.copy(posDir).multiplyScalar(curR + 0.22);
      raycaster.set(wallOrigin, moveDir);
      raycaster.far = 0.13;
      const meshes = runtime.terrainChunks.map((c) => c.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
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

    const stopNodes: Array<{ stop: QuestStop; npc: Group; ring: Mesh; surfR: number }> = [];
    const localStops: QuestStop[] = PLANET_QUEST_STOPS.map((s) => ({
      ...s,
      dir: s.dir.clone(),
    }));

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
      camDist: 1.48,
      camElev: 0.58,
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
      runtime.composer?.resize(clientWidth, clientHeight);
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
          const [{ createGameplaySceneGroup }, { createMessengerComposer }, { loadRealPlanetNpc }] =
            await Promise.all([
              import('../lib/messenger/createGameplayScene'),
              import('../lib/messenger/postProcessing'),
              import('../lib/messenger/createNpcGallery'),
            ]);
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
          // Cool sky-tinted translucent ShadowMaterial overlay so custom ShaderMaterial terrain
          // receives REAL 3D silhouette shadows from player, buildings, cliffs & trees!
          const groundShadowMat = new ShadowMaterial({
            color: 0x204456,
            opacity: 0.28,
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
              sr.renderOrder = 2;
              shadowReceivers.push(sr);
            }
          });
          shadowReceivers.forEach((sr) => terrainObj.add(sr));

          // Let trees cast leafy shadows onto grassy hills & boulders too!
          const leavesObj = bundle.group.getObjectByName('TreeLeaves');
          leavesObj?.traverse((o) => {
            if ((o as Mesh).isMesh) o.castShadow = true;
          });
          runtime.terrainChunks = chunks;

          // Scatter anime grass tufts, wildflowers, benches, postboxes, street lamps & vending machines
          const chunkMeshes = chunks.map((c) => c.mesh);
          const worldDetails = createWorldDetails(toonGradient, (dir) => {
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
          worldDetails.traverse((o) => {
            if ((o as Mesh).isMesh) o.castShadow = true;
          });
          scene.add(worldDetails);

          const spawnSpot = findStreetSpot(pState.posDir, 0.24);
          pState.posDir.copy(spawnSpot.dir);
          pState.groundR = spawnSpot.r;
          scene.add(player, playerShadowHolder, compassGroup);

          // Spawn REAL rigged & animated Abeto NPC models at all 5 Quest Stops!
          const atlasTex = await new TextureLoader().loadAsync(introTexturePaths.atlas);
          const npcAtlasMat = createMessengerMaterials(atlasTex, atlasTex, sun.position).atlas;

          await Promise.all(
            localStops.map(async (stop) => {
              const streetSpot = findStreetSpot(stop.dir, 0.22);
              stop.dir.copy(streetSpot.dir);
              const surfR = streetSpot.r;
              const quest = ENGLISH_NPC_QUESTS[stop.id];
              const { group: npc, mixer } = await loadRealPlanetNpc(
                quest?.npcModel ?? 'office-worker',
                0.31,
                npcAtlasMat
              );
              if (cancelled) return;
              npc.position.copy(stop.dir).multiplyScalar(surfR);
              npc.quaternion.setFromUnitVectors(UP, stop.dir);
              npc.add(createSoftDropShadow(0.15));
              scene.add(npc);
              if (mixer) runtime.npcMixers.push(mixer);

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

              stopNodes.push({ stop, npc, ring, surfR });
            })
          );

          if (cancelled) return;
          runtime.composer = createMessengerComposer(renderer, scene, camera, bundle.lut);
          runtime.composer.resize(host.clientWidth, host.clientHeight);
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
      if (dustRig) dustRig.update();
      if (rippleRig) rippleRig.update();

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
          const angSpeed = sprinting ? 0.0044 : 0.0025;
          const allowedMove = checkWallSlide(pState.posDir, tmpMove, pState.groundR + pState.jumpH);
          if (allowedMove) {
            pState.posDir.addScaledVector(allowedMove, angSpeed).normalize();
            pState.forward.lerp(allowedMove, 0.24);
          } else {
            pState.forward.lerp(tmpMove, 0.14);
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

        // World-locked directional sun ~55 deg above player's local horizon (NEVER rotates with camera!)
        if (frameCount % 2 === 0) {
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
          if (runtime.materials) setMessengerLight(runtime.materials, sun.position);
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
          const isTarget = idx === targetIdx;
          (node.ring.material as MeshBasicMaterial).color.setHex(isTarget ? 0xf5bd33 : 0xffffff);
          (node.ring.material as MeshBasicMaterial).opacity = isTarget
            ? 0.55 + Math.sin(elapsed * 5) * 0.3
            : 0.2;
          node.ring.scale.setScalar(isTarget ? 1 + Math.sin(elapsed * 4) * 0.15 : 0.85);
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

      if (liveOutlineFxRef.current && mode !== 'npcs') {
        inkDisplayOutput.value = 1;
        animeInk.render(renderer, scene, camera, elapsed);
      } else {
        inkDisplayOutput.value = 0;
        renderer.render(scene, camera);
      }
    };

    tick();

    return () => {
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
      audio.dispose();
      toonGradient.dispose();
      animeInk.dispose();
      runtime.composer?.dispose();
      sceneDepthTarget.dispose();
      controls.dispose();
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
        <span style={{ color: '#15803d' }}>{questInfo.fps} FPS</span>
      </div>

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
          title={outlineFx ? 'Phong cách Anime Ink (nhấn để chuyển Mượt)' : 'Chế độ Mượt 165 FPS'}
          onClick={() => {
            setOutlineFx((v) => {
              const next = !v;
              showToast(next ? '🎨 Đã bật Anime Ink vẽ tay' : '⚡ Đã bật chế độ Mượt 165 FPS');
              return next;
            });
          }}
          style={{
            ...PAPER_BTN_STYLE,
            color: outlineFx ? '#357482' : '#d97706',
            transform: 'rotate(1.4deg)',
          }}
        >
          {outlineFx ? <Palette size={20} strokeWidth={2.3} /> : <Zap size={20} strokeWidth={2.3} />}
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
