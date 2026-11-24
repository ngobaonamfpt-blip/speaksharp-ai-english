import React, { useEffect, useRef, useState } from 'react';
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
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  RingGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
  type AnimationMixer,
  type BatchedMesh,
  type ShaderMaterial,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

// Patch Three.js once with BVH accelerated raycasting (~500-1000x faster walking & wall-slide!)
(BufferGeometry.prototype as unknown as Record<string, unknown>).computeBoundsTree = computeBoundsTree;
(BufferGeometry.prototype as unknown as Record<string, unknown>).disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;
import type { SceneMode } from '../lib/messenger/introAssets';
import {
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
  createSoftDropShadow,
  createToonGradient,
  PLANET_QUEST_STOPS,
  type QuestStop,
  type TimeOfDay,
} from '../lib/messenger/playerController';

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
    background: '#78cbf8',
    camera: [0, 6, 20],
    minDist: 8,
    maxDist: 40,
    autoRotate: true,
  },
  gameplay: {
    background: '#78cbf8',
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

const HAT_SWATCHES = ['#232a2f', '#2563eb', '#16a34a', '#b91c1c', '#7c3aed', '#f59e0b'];
const SHIRT_SWATCHES = ['#c93b3b', '#2563eb', '#0d9488', '#ea580c', '#ec4899', '#1e293b'];
const BAG_SWATCHES = ['#8a5430', '#451a03', '#15803d', '#1d4ed8', '#be123c', '#334155'];
const EMOTES = ['👋', '❤️', '✨', '😊', '📦'];
const STOP_COLORS = [0x2563eb, 0x16a34a, 0x7c3aed, 0xe11d48, 0x0d9488];

const ENGLISH_TIPS: Record<string, string> = {
  'town-post': '💡 Phrase: "Could you deliver this parcel?" (Bạn giao giúp bưu kiện này nhé?)',
  'cliff-lookout': '💡 Phrase: "Right on schedule!" (Đúng lịch trình rồi!)',
  'waterfall-cove': '💡 Phrase: "What a refreshing breeze!" (Cơn gió thật mát mẻ!)',
  'harbor-town': '💡 Phrase: "Fresh out of the oven!" (Vừa mới ra lò nóng hổi!)',
  'south-observatory': '💡 Phrase: "Mission accomplished!" (Nhiệm vụ hoàn thành xuất sắc!)',
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
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [outlineFx, setOutlineFx] = useState(false);

  const [hatColor, setHatColor] = useState('#232a2f');
  const [shirtColor, setShirtColor] = useState('#c93b3b');
  const [bagColor, setBagColor] = useState('#8a5430');

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [floatingEmotes, setFloatingEmotes] = useState<
    Array<{ id: string; emoji: string; x: number; y: number }>
  >([]);

  const [questInfo, setQuestInfo] = useState({
    phase: 'pickup' as 'pickup' | 'deliver',
    stopName: 'Postmaster Ben',
    landmark: 'Town Post Office',
    distM: 12,
    delivered: 0,
    fps: 60,
  });
  const [nearbyStop, setNearbyStop] = useState<QuestStop | null>(null);
  const [nearbyIsTarget, setNearbyIsTarget] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; text: string; tip?: string } | null>(null);
  const [toast, setToast] = useState('');

  // Live non-reactive refs so WebGL scene never tears down on UI state toggles
  const livePlayModeRef = useRef(playMode);
  const liveTimeRef = useRef(timeOfDay);
  const liveMutedRef = useRef(soundMuted);
  const liveOutlineFxRef = useRef(outlineFx);
  const liveOutfitRef = useRef({ hat: hatColor, shirt: shirtColor, bag: bagColor });
  const onEarnXpRef = useRef(onEarnXp);

  const applyTimeRef = useRef<((t: TimeOfDay) => void) | null>(null);
  const applyOutfitRef = useRef<((h: string, s: string, b: string) => void) | null>(null);
  const triggerEmoteRef = useRef<((e: string) => void) | null>(null);
  const triggerInteractRef = useRef<(() => void) | null>(null);
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
    liveOutfitRef.current = { hat: hatColor, shirt: shirtColor, bag: bagColor };
    applyOutfitRef.current?.(hatColor, shirtColor, bagColor);
  }, [hatColor, shirtColor, bagColor]);

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

    const camera = new PerspectiveCamera(44, 1, 0.1, 400);
    camera.position.set(...preset.camera);

    const renderer = new WebGLRenderer({
      antialias: mode !== 'gameplay',
      alpha: false,
      powerPreference: 'high-performance',
    });
    // Native 1.0 pixel ratio in Fast mode for silky 60-144 FPS with zero GPU lag
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = mode === 'npcs';
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = preset.minDist;
    controls.maxDistance = preset.maxDist;
    controls.target.set(0, mode === 'npcs' ? 1.2 : 0, 0);

    const ambient = new AmbientLight(0xffffff, mode === 'npcs' ? 0.45 : 0.82);
    scene.add(ambient);
    const sun = new DirectionalLight(0xfff1dc, mode === 'npcs' ? 1.8 : 1.55);
    sun.position.set(14, 20, 10);
    if (mode === 'npcs') {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
    }
    scene.add(sun);

    const toonGradient = createToonGradient();
    const atmosphere = mode !== 'npcs' ? createAtmosphereRig(scene, toonGradient) : null;
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

    // Fast 5-point street finder (5 raycasts instead of 49 -> zero loading screen freeze!)
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
      wallOrigin.copy(posDir).multiplyScalar(curR + 0.14);
      raycaster.set(wallOrigin, moveDir);
      raycaster.far = 0.17;
      const meshes = runtime.terrainChunks.map((c) => c.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length === 0) return moveDir;
      const hit = hits[0];
      if (!hit.face) return null;
      wallNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
      if (Math.abs(wallNormal.dot(posDir)) > 0.62) return moveDir;
      const slide = moveDir.clone().addScaledVector(wallNormal, -moveDir.dot(wallNormal));
      slide.addScaledVector(posDir, -slide.dot(posDir));
      if (slide.lengthSq() < 0.04) return null;
      return slide.normalize();
    };

    const player = buildChibiCourier(toonGradient, {
      hatColor: new Color(liveOutfitRef.current.hat).getHex(),
      shirtColor: new Color(liveOutfitRef.current.shirt).getHex(),
      bagColor: new Color(liveOutfitRef.current.bag).getHex(),
      scarfColor: 0xf5bd33,
    });
    const playerShadowHolder = new Group();
    const playerShadowDisc = createSoftDropShadow(0.14);
    playerShadowHolder.add(playerShadowDisc);

    const compassGroup = new Group();
    const arrowCone = new Mesh(
      new ConeGeometry(0.038, 0.11, 8),
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
    const confGeo = new BoxGeometry(0.11, 0.11, 0.03);
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
      const origin = dir.clone().multiplyScalar(r + 0.5);
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

    const startDir = new Vector3(0.22, 0.86, 0.46).normalize();
    const startFwd = new Vector3(-0.35, -0.32, 0.88).normalize();
    const pState = {
      posDir: startDir.clone(),
      groundR: 8.6,
      jumpH: 0,
      jumpVel: 0,
      squash: 1,
      forward: startFwd.clone(),
      camForward: startFwd.clone(),
      camDist: 1.95,
      camElev: 0.82,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    const activeEmotes: Array<{ id: string; emoji: string; expires: number }> = [];

    triggerEmoteRef.current = (emoji: string) => {
      audio.init();
      audio.playEmote();
      activeEmotes.push({
        id: `${Date.now()}-${Math.random()}`,
        emoji,
        expires: performance.now() + 2100,
      });
    };

    applyOutfitRef.current = (hat: string, shirt: string, bag: string) => {
      const cHat = new Color(hat);
      const cShirt = new Color(shirt);
      const cBag = new Color(bag);
      player.traverse((o) => {
        if (!(o as Mesh).isMesh) return;
        const mat = (o as Mesh).material as { color?: Color };
        if (!mat?.color) return;
        if (o.name === 'hatMeshDome' || o.name === 'hatMeshVisor' || o.name === 'hatMeshBtn')
          mat.color.copy(cHat);
        if (
          o.name === 'shirtMesh' ||
          o.name === 'shirtMeshHem' ||
          o.name === 'shirtMeshArmL' ||
          o.name === 'shirtMeshArmR'
        )
          mat.color.copy(cShirt);
        if (o.name === 'bagMesh' || o.name === 'bagStrap') mat.color.copy(cBag);
      });
    };

    recenterRef.current = () => {
      if (mode === 'gameplay' && livePlayModeRef.current) {
        pState.camForward.copy(pState.forward);
        pState.camDist = 1.95;
        pState.camElev = 0.82;
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

    triggerInteractRef.current = () => {
      if (!currentNearby) return;
      audio.init();
      const activeTarget = localStops[targetIdx];
      if (questPhase === 'pickup' && currentNearby.id === 'town-post') {
        audio.playDeliver();
        questPhase = 'deliver';
        targetIdx = nextDeliverIdx;
        const letter = player.getObjectByName('carriedLetter');
        if (letter) letter.visible = true;
        setDialog({
          title: `${currentNearby.name} · ${currentNearby.landmark}`,
          text: currentNearby.pickupLine,
          tip: ENGLISH_TIPS[currentNearby.id],
        });
        showToast(`📦 Đã nhận thư cho ${localStops[targetIdx].name}!`);
        triggerEmoteRef.current?.('📦');
      } else if (questPhase === 'deliver' && currentNearby.id === activeTarget.id) {
        audio.playDeliver();
        const node = stopNodes.find((s) => s.stop.id === currentNearby!.id);
        if (node) spawnConfetti(node.stop.dir, node.surfR);
        deliveredCount++;
        nextDeliverIdx = nextDeliverIdx >= localStops.length - 1 ? 1 : nextDeliverIdx + 1;
        questPhase = 'pickup';
        targetIdx = 0;
        const letter = player.getObjectByName('carriedLetter');
        if (letter) letter.visible = false;
        setDialog({
          title: `${currentNearby.name} · ${currentNearby.landmark}`,
          text: currentNearby.deliverLine,
          tip: ENGLISH_TIPS[currentNearby.id],
        });
        showToast(`🎉 Giao thư thành công cho ${currentNearby.name}! +25 XP`);
        onEarnXpRef.current(25, `Giao thư cho ${currentNearby.name}`);
        triggerEmoteRef.current?.('✨');
      } else {
        audio.playEmote();
        setDialog({
          title: `${currentNearby.name} · ${currentNearby.landmark}`,
          text: currentNearby.deliverLine || currentNearby.pickupLine,
          tip: ENGLISH_TIPS[currentNearby.id],
        });
      }
    };

    const codes: Record<string, boolean> = {};
    const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (PREVENT.has(e.code)) e.preventDefault();
      codes[e.code] = true;
      if (e.code === 'KeyE') triggerInteractRef.current?.();
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
      if (mode === 'gameplay' && livePlayModeRef.current) {
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
      pState.camElev = Math.max(0.45, Math.min(3.4, pState.camElev + dy * 0.009));
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
      if (mode === 'gameplay' && livePlayModeRef.current) {
        e.preventDefault();
        pState.camDist = Math.max(1.05, Math.min(7.5, pState.camDist + e.deltaY * 0.003));
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
          const [{ createGameplaySceneGroup }, { createMessengerComposer }] = await Promise.all([
            import('../lib/messenger/createGameplayScene'),
            import('../lib/messenger/postProcessing'),
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
          terrainObj.traverse((obj) => {
            if ((obj as Mesh).isMesh) {
              const m = obj as Mesh;
              m.castShadow = false;
              m.receiveShadow = false;
              // Build BVH tree on each chunk (0.02ms per raycast instead of 30ms!)
              const geo = m.geometry as BufferGeometry & { computeBoundsTree?: () => void };
              if (geo.computeBoundsTree && !(geo as unknown as { boundsTree?: unknown }).boundsTree) {
                geo.computeBoundsTree();
              }
              const b = new Box3().setFromObject(m);
              chunks.push({ mesh: m, box: b });
            }
          });
          runtime.terrainChunks = chunks;

          const spawnSpot = findStreetSpot(pState.posDir, 0.24);
          pState.posDir.copy(spawnSpot.dir);
          pState.groundR = spawnSpot.r;
          scene.add(player, playerShadowHolder, compassGroup);

          localStops.forEach((stop, idx) => {
            const streetSpot = findStreetSpot(stop.dir, 0.22);
            stop.dir.copy(streetSpot.dir);
            const surfR = streetSpot.r;
            const npc = buildChibiCourier(toonGradient, {
              hatColor: STOP_COLORS[idx % STOP_COLORS.length],
              shirtColor: STOP_COLORS[(idx + 2) % STOP_COLORS.length],
              bagColor: 0x7c4522,
            });
            npc.position.copy(stop.dir).multiplyScalar(surfR);
            npc.quaternion.setFromUnitVectors(UP, stop.dir);
            npc.add(createSoftDropShadow(0.14));
            scene.add(npc);

            const ring = new Mesh(
              new RingGeometry(0.18, 0.25, 22),
              new MeshBasicMaterial({
                color: 0xf5bd33,
                transparent: true,
                opacity: 0.7,
                side: DoubleSide,
                depthWrite: false,
              })
            );
            ring.rotation.x = -Math.PI / 2;
            const rh = new Group();
            rh.add(ring);
            rh.position.copy(stop.dir).multiplyScalar(surfR + 0.08);
            rh.quaternion.setFromUnitVectors(UP, stop.dir);
            scene.add(rh);

            stopNodes.push({ stop, npc, ring, surfR });
          });

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
        if (codes['KeyW'] || codes['ArrowUp']) inFwd += 1;
        if (codes['KeyS'] || codes['ArrowDown']) inFwd -= 1;
        if (codes['KeyD'] || codes['ArrowRight']) inRight += 1;
        if (codes['KeyA'] || codes['ArrowLeft']) inRight -= 1;

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
            // Walked off a cliff/rooftop/ledge -> convert drop into smooth gravity fall!
            pState.jumpH += pState.groundR - sampled;
            pState.groundR = sampled;
          } else if (diff <= 0.24 || pState.jumpH + pState.groundR >= sampled - 0.08) {
            pState.groundR += diff * 0.45;
          }
          if (frameCount % (sprinting ? 11 : 16) === 0 && pState.jumpH < 0.03) {
            audio.playStep();
          }
        } else {
          pState.forward.addScaledVector(pState.posDir, -pState.forward.dot(pState.posDir)).normalize();
        }

        const jumpHeld = Boolean(codes['Space']);
        if (jumpHeld && pState.jumpH <= 0.008 && pState.jumpVel <= 0) {
          pState.jumpVel = 0.068;
          pState.squash = 1.26;
          audio.playJump();
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
          }
        }
        pState.squash += (1 - pState.squash) * 0.18;

        player.position.copy(pState.posDir).multiplyScalar(pState.groundR + pState.jumpH);
        tmpRight.crossVectors(pState.posDir, pState.forward).normalize();
        tmpMat.makeBasis(tmpRight, pState.posDir, pState.forward);
        tmpQ.setFromRotationMatrix(tmpMat);
        player.quaternion.slerp(tmpQ, 0.35);

        playerShadowHolder.position.copy(pState.posDir).multiplyScalar(pState.groundR + 0.03);
        playerShadowHolder.quaternion.setFromUnitVectors(UP, pState.posDir);
        playerShadowDisc.scale.setScalar(Math.max(0.45, 1 - pState.jumpH * 0.35));

        animateChibi(player, {
          t: elapsed,
          moving,
          sprinting,
          jumpH: pState.jumpH,
          jumpHeld,
          squash: pState.squash,
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
          animateChibi(node.npc, { t: elapsed, phase: idx * 1.5, moving: false });
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
        if (toTarget.lengthSq() > 0.001 && arcDist > 3.5) {
          toTarget.normalize();
          compassGroup.visible = true;
          compassGroup.position
            .copy(pState.posDir)
            .multiplyScalar(pState.groundR + pState.jumpH + 0.37 + Math.sin(elapsed * 5) * 0.025);
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
            if (d < 4.5 && d < minD) {
              minD = d;
              closest = n.stop;
            }
          }
          if (closest?.id !== currentNearby?.id) {
            currentNearby = closest;
            setNearbyStop(closest);
            setNearbyIsTarget(closest?.id === activeTarget.id);
          }
        }

        camDesired
          .copy(pState.posDir)
          .multiplyScalar(pState.groundR + pState.camElev + pState.jumpH * 0.3)
          .addScaledVector(pState.camForward, -pState.camDist);
        camera.position.lerp(camDesired, 0.12);
        camera.up.lerp(pState.posDir, 0.12).normalize();
        camLook
          .copy(pState.posDir)
          .multiplyScalar(pState.groundR + 0.24 + pState.jumpH * 0.2)
          .addScaledVector(pState.camForward, 0.35);
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
        // In Fast mode: single 1-pass render (only capture depth once on frame 1 or when Ultra FX is enabled)
        if (frameCount === 1 || (liveOutlineFxRef.current && frameCount % 4 === 1)) {
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
        if (liveOutlineFxRef.current && runtime.composer) {
          runtime.composer.render();
        } else {
          renderer.render(scene, camera);
        }
      } else if (liveOutlineFxRef.current && runtime.composer) {
        runtime.composer.render();
      } else {
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
        ? '☀️ Ban ngày nắng ấm'
        : next === 'sunset'
        ? '🌅 Hoàng hôn pastel'
        : '🌙 Đêm sao dịu nhẹ'
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none' }}>
      {/* WebGL Canvas Host */}
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
            borderRadius: 999,
            border: '2.5px solid #232a2f',
            boxShadow: '0 4px 0 #232a2f',
            background: 'rgba(255, 253, 247, 0.96)',
            color: status === 'error' ? '#b91c1c' : '#232a2f',
            fontWeight: 800,
            fontSize: 14,
            zIndex: 20,
          }}
        >
          {status === 'loading' ? `Đang tải thế giới 3D (${mode})…` : 'Không tải được tài nguyên 3D.'}
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
            border: '2.5px solid #232a2f',
            boxShadow: '0 4px 0 #232a2f',
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

      {/* TOP-LEFT QUEST & MODE CARD */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 16,
          width: 'min(308px, calc(100vw - 90px))',
          background: 'rgba(255, 253, 247, 0.95)',
          border: '2.5px solid #232a2f',
          boxShadow: '0 4px 0 #232a2f',
          borderRadius: 18,
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.07em', color: '#c93b3b' }}>
            📮 SPEAKSHARP 3D
          </span>
          <span
            style={{
              background: '#fef3c7',
              border: '1.8px solid #232a2f',
              borderRadius: 999,
              padding: '2px 9px',
              fontSize: 11,
              fontWeight: 900,
              color: '#232a2f',
            }}
          >
            📦 {questInfo.delivered}/4 · {questInfo.fps} FPS
          </span>
        </div>

        <div style={{ fontSize: 14.5, fontWeight: 900, color: '#232a2f', marginTop: 4, lineHeight: 1.25 }}>
          {mode === 'gameplay' && playMode
            ? questInfo.phase === 'pickup'
              ? 'Nhận thư tại Town Post Office'
              : `Giao thư cho ${questInfo.stopName}`
            : mode === 'intro'
            ? 'Toàn cảnh hành tinh Intro'
            : mode === 'npcs'
            ? 'Phòng trưng bày NPCs'
            : 'Chế độ xoay tự do (Free Orbit)'}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#5b6770', marginTop: 2 }}>
          {mode === 'gameplay' && playMode
            ? `${questInfo.landmark} · cách ${questInfo.distM}m`
            : 'Kéo chuột để xoay · Cuộn để phóng to/nhỏ'}
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
          {(['intro', 'gameplay', 'npcs'] as SceneMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setDialog(null);
              }}
              style={{
                flex: 1,
                border: '2px solid #232a2f',
                background: mode === m ? '#f5bd33' : '#fff',
                color: '#232a2f',
                fontWeight: 800,
                fontSize: 12,
                padding: '5px 8px',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              {m === 'intro' ? 'Intro' : m === 'gameplay' ? 'Gameplay' : 'NPCs'}
            </button>
          ))}
        </div>

        {mode === 'gameplay' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button
              onClick={() => setPlayMode(true)}
              style={{
                flex: 1,
                border: '2px solid #232a2f',
                background: playMode ? '#f5bd33' : '#fff',
                color: '#232a2f',
                fontWeight: 800,
                fontSize: 12,
                padding: '5px 8px',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              🚶 Đi dạo (Play)
            </button>
            <button
              onClick={() => setPlayMode(false)}
              style={{
                flex: 1,
                border: '2px solid #232a2f',
                background: !playMode ? '#f5bd33' : '#fff',
                color: '#232a2f',
                fontWeight: 800,
                fontSize: 12,
                padding: '5px 8px',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              🌐 Xoay tự do
            </button>
          </div>
        )}
      </div>

      {/* TOP-RIGHT ACTION BUTTONS */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {[
          {
            label: soundMuted ? '🔇' : '🎵',
            title: soundMuted ? 'Bật nhạc nền (Kevin Colombin - Messenger OST)' : 'Tắt nhạc nền',
            onClick: () => {
              setSoundMuted((v) => {
                const next = !v;
                if (!next) {
                  audioRef.current?.init();
                }
                return next;
              });
            },
          },
          {
            label: '👕',
            title: 'Đổi trang phục Chibi',
            onClick: () => setWardrobeOpen((v) => !v),
          },
          {
            label: timeOfDay === 'day' ? '☀️' : timeOfDay === 'sunset' ? '🌅' : '🌙',
            title: 'Đổi thời gian (Ngày/Hoàng hôn/Đêm)',
            onClick: cycleTime,
          },
          {
            label: outlineFx ? '✨' : '⚡',
            title: outlineFx ? 'Viền mực Ultra (nhấn để chuyển Mượt)' : 'Chế độ Mượt 60+ FPS (nhấn để bật Viền mực)',
            onClick: () => {
              setOutlineFx((v) => {
                const next = !v;
                showToast(next ? '✨ Đã bật hiệu ứng viền mực Ultra' : '⚡ Đã bật chế độ Mượt (FPS tối đa)');
                return next;
              });
            },
          },
          {
            label: '🧭',
            title: 'Đặt lại góc camera',
            onClick: () => recenterRef.current?.(),
          },
        ].map((btn) => (
          <button
            key={btn.title}
            title={btn.title}
            onClick={btn.onClick}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: 'rgba(255, 253, 247, 0.96)',
              border: '2.5px solid #232a2f',
              boxShadow: '0 4px 0 #232a2f',
              fontSize: 18,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* WARDROBE POPOVER */}
      {wardrobeOpen && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            right: 66,
            zIndex: 18,
            width: 220,
            background: 'rgba(255, 253, 247, 0.97)',
            border: '2.5px solid #232a2f',
            boxShadow: '0 4px 0 #232a2f',
            borderRadius: 16,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8, color: '#232a2f' }}>
            👕 Trang phục Chibi
          </div>
          {[
            { label: 'Màu mũ', list: HAT_SWATCHES, val: hatColor, set: setHatColor },
            { label: 'Màu áo', list: SHIRT_SWATCHES, val: shirtColor, set: setShirtColor },
            { label: 'Màu túi', list: BAG_SWATCHES, val: bagColor, set: setBagColor },
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
                      border: '2px solid #232a2f',
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
            background: '#232a2f',
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

      {/* INTERACT [E] PILL */}
      {mode === 'gameplay' && playMode && nearbyStop && !dialog && (
        <button
          onClick={() => triggerInteractRef.current?.()}
          style={{
            position: 'absolute',
            bottom: 102,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 18,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#232a2f',
            color: '#fffdf7',
            border: '2.5px solid #fffdf7',
            borderRadius: 999,
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
          }}
        >
          <span
            style={{
              background: '#f5bd33',
              color: '#232a2f',
              borderRadius: 6,
              padding: '1px 7px',
              fontWeight: 900,
            }}
          >
            E
          </span>
          <span>
            {nearbyIsTarget
              ? questInfo.phase === 'pickup'
                ? `Nhận thư từ ${nearbyStop.name}`
                : `Giao thư cho ${nearbyStop.name}`
              : `Trò chuyện tiếng Anh với ${nearbyStop.name}`}
          </span>
        </button>
      )}

      {/* COZY ENGLISH DIALOG CARD */}
      {dialog && (
        <div
          style={{
            position: 'absolute',
            bottom: 102,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 22,
            width: 'min(440px, calc(100vw - 32px))',
            background: 'rgba(255, 253, 247, 0.98)',
            border: '2.5px solid #232a2f',
            boxShadow: '0 5px 0 #232a2f',
            borderRadius: 18,
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: '#c93b3b', marginBottom: 4 }}>
            {dialog.title}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#232a2f', lineHeight: 1.45 }}>
            “{dialog.text}”
          </div>
          {dialog.tip && (
            <div
              style={{
                marginTop: 8,
                padding: '6px 10px',
                borderRadius: 10,
                background: '#fef3c7',
                border: '1.5px solid #f5bd33',
                fontSize: 12,
                fontWeight: 700,
                color: '#78350f',
              }}
            >
              {dialog.tip}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            {onEnterDebateArena && (
              <button
                onClick={onEnterDebateArena}
                style={{
                  border: '2px solid #232a2f',
                  background: '#fff',
                  color: '#232a2f',
                  borderRadius: 10,
                  padding: '5px 12px',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                🎤 Vào Phòng Luyện Nói
              </button>
            )}
            <button
              onClick={() => setDialog(null)}
              style={{
                border: '2px solid #232a2f',
                background: '#f5bd33',
                color: '#232a2f',
                borderRadius: 10,
                padding: '5px 14px',
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Tiếp tục đi dạo →
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM EMOTE BAR + CONTROLS HINT */}
      {mode === 'gameplay' && playMode && (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 16,
              display: 'inline-flex',
              gap: 6,
              background: 'rgba(255, 253, 247, 0.95)',
              border: '2.5px solid #232a2f',
              boxShadow: '0 4px 0 #232a2f',
              borderRadius: 999,
              padding: '5px 10px',
            }}
          >
            {EMOTES.map((e, i) => (
              <button
                key={e}
                title={`Biểu cảm ${e} (Phím ${i + 1})`}
                onClick={() => triggerEmoteRef.current?.(e)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 19,
                  cursor: 'pointer',
                  padding: '2px 5px',
                }}
              >
                {e}
              </button>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              zIndex: 15,
              background: 'rgba(35, 42, 47, 0.85)',
              color: '#fffdf7',
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            WASD: Đi · Space: Nhảy/Lướt · Shift: Chạy · E: Giao thư (+25 XP)
          </div>
        </>
      )}
    </div>
  );
};
