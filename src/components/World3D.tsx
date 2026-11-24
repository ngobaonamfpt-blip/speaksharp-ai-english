import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Footprints,
  Mic,
  MicOff,
  Move,
  Plus,
  RotateCcw,
  Send,
  Shuffle,
  Sparkles,
  User,
  Volume2,
  X,
} from 'lucide-react';
import { BoothId } from '../world/cityBuilder';
import {
  buildCustomVoxelCharacter,
  buildGeminislandScene,
  CITY_BOOTHS,
  CityBoothDef,
  DEFAULT_VOXEL_CONFIG,
  generateVoxelStructureFromPrompt,
  LandmarkMetadata,
  VoxelCustomConfig,
  VoxelIslandHandles,
} from '../world/voxelIslandBuilder';

type NavControlMode = 'pan' | 'orbit' | 'walk';
type CustomTab = 'Head' | 'Hat' | 'Face' | 'Outfit' | 'Gear';

interface PeerState {
  id: string;
  name: string;
  cfg: VoxelCustomConfig;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
}

interface ChatLog {
  id: string;
  sender: string;
  text: string;
  isSelf?: boolean;
  time: string;
}

interface World3DProps {
  userName: string;
  totalXp: number;
  onEarnXp: (xp: number) => void;
  onSpendXp: (cost: number) => void;
  onEnterDebateArena: () => void;
}

const SKIN_COLORS = ['#fde2c8', '#f5d0b5', '#e5b895', '#c68b59', '#8d5524', '#5c3818', '#60a5fa', '#4ade80'];
const HAIR_COLORS = ['#18181b', '#3b2314', '#78350f', '#b45309', '#f5bd33', '#dc2626', '#cbd5e1', '#ec4899', '#06b6d4'];
const OUTFIT_COLORS = ['#2563eb', '#141517', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#0d9488'];
const HAIR_STYLES: VoxelCustomConfig['hairStyle'][] = [
  'Short', 'Spiky', 'Parted', 'Long', 'Ponytail', 'Buns', 'Curly', 'Mohawk', 'Bob', 'None',
];

const PEER_REPLIES = [
  'Whoa! The Grand Lattice Tower looks incredible from here!',
  'Your English is super natural! Want to practice at Dome Academy?',
  'Great phrasing! Let us walk over to Harbor Street Café.',
  'I just customized my voxel character—try clicking Character at top right!',
];

// Live 3D Character Customizer Preview Canvas (Left pane of Character Modal — Frame 00:23!)
const CharacterPreview3D: React.FC<{ config: VoxelCustomConfig; waving: boolean }> = ({
  config,
  waving,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const charGroupRef = useRef<THREE.Group | null>(null);
  const wavingRef = useRef(waving);
  useEffect(() => {
    wavingRef.current = waving;
  }, [waving]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe);

    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 50);
    camera.position.set(0, 2.1, 5.2);
    camera.lookAt(0, 1.35, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.innerHTML = '';
    el.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbae6fd, 1.05));
    const dir = new THREE.DirectionalLight(0xfffbeb, 1.25);
    dir.position.set(4, 8, 6);
    scene.add(dir);

    // Green circular pedestal (Exact match to Frame 00:23!)
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.45, 0.25, 32),
      new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.7 })
    );
    pedestal.position.y = -0.12;
    scene.add(pedestal);

    const holder = new THREE.Group();
    scene.add(holder);
    charGroupRef.current = holder;

    let raf = 0;
    let t = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      t += 0.03;
      holder.rotation.y = Math.sin(t * 0.45) * 0.35;
      const rArm = holder.getObjectByName('rightArm');
      const lLeg = holder.getObjectByName('leftLeg');
      const rLeg = holder.getObjectByName('rightLeg');
      if (rArm) {
        rArm.rotation.z = wavingRef.current ? 2.4 + Math.sin(t * 6) * 0.35 : 0;
      }
      if (lLeg && rLeg) {
        lLeg.rotation.x = Math.sin(t * 2) * 0.22;
        rLeg.rotation.x = -Math.sin(t * 2) * 0.22;
      }
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const holder = charGroupRef.current;
    if (!holder) return;
    while (holder.children.length > 0) holder.remove(holder.children[0]);
    holder.add(buildCustomVoxelCharacter(config));
  }, [config]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: 360,
        borderRadius: 16,
        overflow: 'hidden',
        background: '#dbeafe',
      }}
    />
  );
};

export const World3D: React.FC<World3DProps> = ({
  userName,
  totalXp,
  onEarnXp,
  onEnterDebateArena,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<VoxelIslandHandles | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const spawnedAnimsRef = useRef<Array<{ mesh: THREE.Group; targetY: number }>>([]);
  const keysRef = useRef<Record<string, boolean>>({});

  // Control mode: 'pan' | 'orbit' | 'walk' (Exact Geminisland top-right bar!)
  const [navMode, setNavMode] = useState<NavControlMode>('orbit');
  const navModeRef = useRef<NavControlMode>('orbit');
  useEffect(() => {
    navModeRef.current = navMode;
    if (playerMeshRef.current) {
      playerMeshRef.current.visible = navMode !== 'walk';
    }
  }, [navMode]);

  // Camera state for Bird's-Eye Pan/Orbit vs Ground-Level Walk
  const camStateRef = useRef({
    targetX: 0,
    targetZ: 0,
    yaw: 0.42,
    pitch: 0.64,
    distance: 112,
    walkX: 0,
    walkZ: 18,
    walkYaw: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    dragMoved: false,
  });

  // Hover Tooltip in Pan/Orbit Mode (Frames 00:00, 00:04, 00:07, 00:22!)
  const [hoveredLandmark, setHoveredLandmark] = useState<{
    meta: LandmarkMetadata;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Nearby Landmark in Walk Mode (Frames 00:09, 00:20, 00:21!)
  const [walkNearbyLandmark, setWalkNearbyLandmark] = useState<LandmarkMetadata | null>(null);

  // Active Interactive English Booth Modal
  const [activeBooth, setActiveBooth] = useState<CityBoothDef | null>(null);
  const [activeLandmarkTitle, setActiveLandmarkTitle] = useState('');
  const [boothMessages, setBoothMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [boothInput, setBoothInput] = useState('');

  // "+ Add" AI Voxel Structure Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPrompt, setAddPrompt] = useState('');
  const [buildToast, setBuildToast] = useState('');

  // "Character" Customizer Modal (Frames 00:23–00:24!)
  const [showCharModal, setShowCharModal] = useState(false);
  const [charTab, setCharTab] = useState<CustomTab>('Head');
  const [charConfig, setCharConfig] = useState<VoxelCustomConfig>({
    ...DEFAULT_VOXEL_CONFIG,
    name: userName,
  });
  const [waving, setWaving] = useState(false);

  // Online Counter & Chat Drawer
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [plazaChat, setPlazaChat] = useState<ChatLog[]>([
    {
      id: 'c1',
      sender: 'Minh Anh · B2',
      text: 'Welcome to Geminisland 3D! Hover over any building or click Walk to explore in first-person!',
      time: 'Vừa xong',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recRef = useRef<any>(null);

  // Update main player mesh when charConfig is saved
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !playerMeshRef.current) return;
    const old = playerMeshRef.current;
    const pos = old.position.clone();
    scene.remove(old);
    const fresh = buildCustomVoxelCharacter(charConfig);
    fresh.position.copy(pos);
    fresh.visible = navModeRef.current !== 'walk';
    scene.add(fresh);
    playerMeshRef.current = fresh;
  }, [charConfig]);

  const openLandmarkBooth = (lm: LandmarkMetadata) => {
    const bId = lm.boothId ?? 'cafe';
    const booth = CITY_BOOTHS.find((b) => b.id === bId) ?? CITY_BOOTHS[0];
    setActiveBooth(booth);
    setActiveLandmarkTitle(lm.title);
    setBoothMessages([
      {
        sender: booth.npcName,
        text: `[${lm.title}] ${booth.greetingEn}`,
      },
    ]);
    setBoothInput('');
  };

  // Keyboard shortcuts: WASD, [Esc] to exit Walk view, [E] to enter building
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      if (e.key === 'Escape' && navModeRef.current === 'walk') {
        setNavMode('orbit');
      }
      if (k === 'e' && walkNearbyLandmark && !activeBooth) {
        openLandmarkBooth(walkNearbyLandmark);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [walkNearbyLandmark, activeBooth]);

  // === THREE.JS GEMINISLAND SETUP ===
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 1080;
    const height = container.clientHeight || 650;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 420);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handles = buildGeminislandScene(scene);
    handlesRef.current = handles;

    // Player Voxel Avatar
    const player = buildCustomVoxelCharacter(charConfig);
    player.position.set(0, 0, 18);
    scene.add(player);
    playerMeshRef.current = player;

    // 18 Walking Voxel Citizens populating the island avenues & paths!
    const citizens: Array<{ mesh: THREE.Group; x: number; z: number; tx: number; tz: number }> = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 12 + (i % 4) * 14;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      const npcCfg: VoxelCustomConfig = {
        ...DEFAULT_VOXEL_CONFIG,
        skinColor: SKIN_COLORS[i % 5],
        hairStyle: HAIR_STYLES[i % HAIR_STYLES.length],
        hairColor: HAIR_COLORS[i % HAIR_COLORS.length],
        outfitColor: OUTFIT_COLORS[i % OUTFIT_COLORS.length],
      };
      const m = buildCustomVoxelCharacter(npcCfg);
      m.position.set(cx, 0, cz);
      scene.add(m);
      citizens.push({ mesh: m, x: cx, z: cz, tx: cx + 6, tz: cz - 6 });
    }

    // Mouse Pan / Orbit / Walk Look + Hover Landmark Tooltip Detection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (ev: MouseEvent) => {
      camStateRef.current.dragging = true;
      camStateRef.current.lastX = ev.clientX;
      camStateRef.current.lastY = ev.clientY;
      camStateRef.current.dragMoved = false;
    };

    const onPointerMove = (ev: MouseEvent) => {
      const cs = camStateRef.current;
      const rect = renderer.domElement.getBoundingClientRect();

      if (cs.dragging) {
        const dx = ev.clientX - cs.lastX;
        const dy = ev.clientY - cs.lastY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) cs.dragMoved = true;

        if (navModeRef.current === 'pan') {
          const factor = cs.distance * 0.0014;
          const cos = Math.cos(cs.yaw);
          const sin = Math.sin(cs.yaw);
          cs.targetX = Math.max(-65, Math.min(65, cs.targetX - (dx * cos + dy * sin) * factor));
          cs.targetZ = Math.max(-65, Math.min(65, cs.targetZ - (-dx * sin + dy * cos) * factor));
        } else if (navModeRef.current === 'orbit') {
          cs.yaw -= dx * 0.007;
          cs.pitch = Math.max(0.22, Math.min(1.28, cs.pitch + dy * 0.006));
        } else {
          // Walk mode look around
          cs.walkYaw -= dx * 0.006;
        }
        cs.lastX = ev.clientX;
        cs.lastY = ev.clientY;
        setHoveredLandmark(null);
        return;
      }

      // Hover Tooltip detection in Pan / Orbit mode!
      if (navModeRef.current !== 'walk') {
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(handles.groundTargets);
        if (hits.length > 0) {
          const pt = hits[0].point;
          let found: LandmarkMetadata | null = null;
          let minD = 999;
          for (const lm of handles.landmarks) {
            const d = Math.hypot(pt.x - lm.x, pt.z - lm.z);
            if (d < lm.radius && d < minD) {
              minD = d;
              found = lm;
            }
          }
          if (found) {
            setHoveredLandmark({
              meta: found,
              screenX: ev.clientX - rect.left,
              screenY: ev.clientY - rect.top,
            });
          } else {
            setHoveredLandmark(null);
          }
        } else {
          setHoveredLandmark(null);
        }
      }
    };

    const onPointerUp = () => {
      const wasDrag = camStateRef.current.dragMoved;
      camStateRef.current.dragging = false;
      if (!wasDrag && hoveredLandmark && navModeRef.current !== 'walk') {
        openLandmarkBooth(hoveredLandmark.meta);
      }
    };

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      if (navModeRef.current === 'walk') return;
      camStateRef.current.distance = Math.max(
        22,
        Math.min(155, camStateRef.current.distance + ev.deltaY * 0.05)
      );
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let rafId = 0;
    let t = 0;
    let frame = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;
      frame++;

      // Animate racing Porsche GT3 RS & sports cars along the circuit roads!
      handles.cars.forEach((car) => {
        car.angle += car.speed;
        const cx = Math.cos(car.angle) * car.radiusX;
        const cz = Math.sin(car.angle) * car.radiusZ;
        car.mesh.position.set(cx, 0.05, cz);
        car.mesh.rotation.y = -car.angle + (car.speed > 0 ? 0 : Math.PI);
      });

      // Animate walking voxel citizens
      citizens.forEach((c, i) => {
        const dx = c.tx - c.x;
        const dz = c.tz - c.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.3) {
          c.x += (dx / dist) * 0.055;
          c.z += (dz / dist) * 0.055;
          c.mesh.rotation.y = Math.atan2(dx, dz);
          const lLeg = c.mesh.getObjectByName('leftLeg');
          const rLeg = c.mesh.getObjectByName('rightLeg');
          if (lLeg && rLeg) {
            lLeg.rotation.x = Math.sin(t * 10 + i) * 0.5;
            rLeg.rotation.x = -Math.sin(t * 10 + i) * 0.5;
          }
        } else if (frame % 180 === (i * 23) % 180) {
          c.tx = Math.max(-62, Math.min(62, c.x + Math.sin(t + i) * 14));
          c.tz = Math.max(-62, Math.min(62, c.z + Math.cos(t + i) * 14));
        }
        c.mesh.position.set(c.x, 0, c.z);
      });

      // Animate newly spawned AI Voxel Structures dropping smoothly into place
      spawnedAnimsRef.current = spawnedAnimsRef.current.filter((item) => {
        item.mesh.position.y += (item.targetY - item.mesh.position.y) * 0.14;
        const s = item.mesh.scale.x + (1 - item.mesh.scale.x) * 0.14;
        item.mesh.scale.setScalar(s);
        if (Math.abs(item.mesh.position.y - item.targetY) < 0.02) {
          item.mesh.position.y = item.targetY;
          item.mesh.scale.setScalar(1);
          return false;
        }
        return true;
      });

      const cs = camStateRef.current;
      const k = keysRef.current;

      if (navModeRef.current === 'walk') {
        // First-Person Ground-Level Walk Mode (Frames 00:08–00:21!)
        let moveZ = 0;
        let moveX = 0;
        if (k['w'] || k['arrowup']) moveZ -= 1;
        if (k['s'] || k['arrowdown']) moveZ += 1;
        if (k['a'] || k['arrowleft']) moveX -= 1;
        if (k['d'] || k['arrowright']) moveX += 1;

        const walkSpeed = 0.24;
        const moving = moveX !== 0 || moveZ !== 0;
        if (moving) {
          const cos = Math.cos(cs.walkYaw);
          const sin = Math.sin(cs.walkYaw);
          const wx = moveX * cos + moveZ * sin;
          const wz = -moveX * sin + moveZ * cos;
          const len = Math.hypot(wx, wz);
          cs.walkX = Math.max(-72, Math.min(72, cs.walkX + (wx / len) * walkSpeed));
          cs.walkZ = Math.max(-72, Math.min(72, cs.walkZ + (wz / len) * walkSpeed));
        }

        if (playerMeshRef.current) {
          playerMeshRef.current.position.set(cs.walkX, 0, cs.walkZ);
        }

        const eyeY = 2.45 + (moving ? Math.abs(Math.sin(t * 11)) * 0.08 : 0);
        camera.position.set(cs.walkX, eyeY, cs.walkZ);
        camera.lookAt(
          cs.walkX - Math.sin(cs.walkYaw) * 12,
          2.35,
          cs.walkZ - Math.cos(cs.walkYaw) * 12
        );

        if (frame % 6 === 0) {
          let near: LandmarkMetadata | null = null;
          let minD = 999;
          for (const lm of handles.landmarks) {
            const d = Math.hypot(cs.walkX - lm.x, cs.walkZ - lm.z);
            if (d < lm.radius + 4.5 && d < minD) {
              minD = d;
              near = lm;
            }
          }
          setWalkNearbyLandmark((prev) => (prev?.id === near?.id ? prev : near));
        }
      } else {
        // Pan / Orbit Bird's-Eye Island View (Frames 00:00–00:07, 00:22–00:29!)
        const panSpeed = 0.45;
        if (k['w'] || k['arrowup']) cs.targetZ -= panSpeed;
        if (k['s'] || k['arrowdown']) cs.targetZ += panSpeed;
        if (k['a'] || k['arrowleft']) cs.targetX -= panSpeed;
        if (k['d'] || k['arrowright']) cs.targetX += panSpeed;

        const horiz = Math.cos(cs.pitch) * cs.distance;
        const vert = Math.sin(cs.pitch) * cs.distance;
        const desiredX = cs.targetX + Math.sin(cs.yaw) * horiz;
        const desiredZ = cs.targetZ + Math.cos(cs.yaw) * horiz;

        camera.position.x += (desiredX - camera.position.x) * 0.12;
        camera.position.z += (desiredZ - camera.position.z) * 0.12;
        camera.position.y += (vert - camera.position.y) * 0.12;
        camera.lookAt(cs.targetX, 0, cs.targetZ);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  const handleRecenter = () => {
    setNavMode('orbit');
    camStateRef.current.targetX = 0;
    camStateRef.current.targetZ = 0;
    camStateRef.current.yaw = 0.42;
    camStateRef.current.pitch = 0.64;
    camStateRef.current.distance = 112;
  };

  const handleEnterWalkMode = () => {
    setHoveredLandmark(null);
    camStateRef.current.walkX = camStateRef.current.targetX;
    camStateRef.current.walkZ = camStateRef.current.targetZ + 14;
    setNavMode('walk');
  };

  const handleAddStructure = (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? addPrompt).trim();
    const scene = sceneRef.current;
    const handles = handlesRef.current;
    if (!prompt || !scene || !handles) return;

    const cs = camStateRef.current;
    const sx = navMode === 'walk' ? cs.walkX - Math.sin(cs.walkYaw) * 8 : cs.targetX + (Math.random() - 0.5) * 14;
    const sz = navMode === 'walk' ? cs.walkZ - Math.cos(cs.walkYaw) * 8 : cs.targetZ + (Math.random() - 0.5) * 14;

    const { labelVi, description, mesh, targetY } = generateVoxelStructureFromPrompt(prompt, sx, sz);
    mesh.position.y = targetY + 12;
    mesh.scale.setScalar(0.15);
    scene.add(mesh);
    spawnedAnimsRef.current.push({ mesh, targetY });
    handles.landmarks.push({
      id: `custom-${Date.now()}`,
      title: labelVi,
      description,
      x: sx,
      z: sz,
      radius: 6.5,
      boothId: 'debate',
    });

    setAddPrompt('');
    setShowAddModal(false);
    onEarnXp(25);
    setBuildToast(`✨ Added "${labelVi}" to the island! (+25 XP)`);
    setTimeout(() => setBuildToast(''), 4000);
  };

  const handleRandomizeCharacter = () => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    setCharConfig((prev) => ({
      ...prev,
      skinColor: pick(SKIN_COLORS),
      hairStyle: pick(HAIR_STYLES),
      hairColor: pick(HAIR_COLORS),
      hatStyle: pick(['None', 'Crown', 'Cap', 'Grad', 'Headphones']),
      hatColor: pick(OUTFIT_COLORS),
      faceStyle: pick(['Smile', 'Glasses', 'Cool', 'Wink']),
      outfitColor: pick(OUTFIT_COLORS),
      overallColor: pick(OUTFIT_COLORS),
      gearStyle: pick(['Backpack', 'Cape', 'None']),
    }));
  };

  const handleSendPlazaChat = (override?: string) => {
    const text = (override ?? chatInput).trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setPlazaChat((prev) => [...prev, { id: `u-${Date.now()}`, sender: charConfig.name, text, isSelf: true, time }]);
    setChatInput('');
    onEarnXp(10);

    const reply = PEER_REPLIES[Math.floor(Math.random() * PEER_REPLIES.length)];
    setTimeout(() => {
      setPlazaChat((prev) => [
        ...prev,
        { id: `p-${Date.now()}`, sender: 'Minh Anh · B2', text: reply, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) },
      ]);
    }, 800);
  };

  const toggleVoiceChat = () => {
    if (isRecording) {
      recRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Trình duyệt chưa hỗ trợ Web Speech API.');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript;
      if (spoken) handleSendPlazaChat(spoken);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const handleBoothSend = (override?: string) => {
    if (!activeBooth) return;
    const text = (override ?? boothInput).trim();
    if (!text) return;
    setBoothMessages((prev) => [...prev, { sender: charConfig.name, text }]);
    setBoothInput('');
    onEarnXp(15);
    setTimeout(() => {
      const replies: Record<BoothId, string> = {
        cafe: `Awesome English! One fresh order coming right up at ${activeLandmarkTitle}. (+15 XP)`,
        debate: `Sharp argument! Ready to enter the full Debate Arena for IPA & Grammar scoring? (+15 XP)`,
        ielts: `Great question! For Band 8.0, use "From my perspective" and back claims with clear examples. (+15 XP)`,
        shop: `Awesome! You can customize your 3D Voxel look anytime by clicking "Character" at top right! (+15 XP)`,
      };
      setBoothMessages((prev) => [...prev, { sender: activeBooth.npcName, text: replies[activeBooth.id] }]);
    }, 500);
  };

  const speakEnglish = (txt: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'en-US';
    u.rate = 0.94;
    window.speechSynthesis.speak(u);
  };

  return (
    <div
      style={{
        position: 'relative',
        height: 'calc(100vh - 48px)',
        minHeight: 620,
        borderRadius: 20,
        overflow: 'hidden',
        background: '#0284c7',
        userSelect: 'none',
      }}
    >
      {/* Full-Bleed Geminisland 3D Voxel Canvas */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: navMode === 'pan' ? 'move' : 'grab',
        }}
      />

      {/* TOP-LEFT WALK EXIT PILL (Frame 00:08–00:21: "[Esc] to exit view") */}
      {navMode === 'walk' && (
        <button
          onClick={() => setNavMode('orbit')}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            border: 'none',
            background: 'rgba(20, 21, 23, 0.72)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '8px 14px',
            borderRadius: 999,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 7px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            Esc
          </span>
          <span>to exit view</span>
        </button>
      )}

      {/* TOP-CENTER LANDMARK BANNER IN WALK MODE (Frame 00:20–00:21) */}
      {navMode === 'walk' && walkNearbyLandmark && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(10px)',
            color: '#141517',
            padding: '10px 20px',
            borderRadius: 14,
            maxWidth: 460,
            fontSize: 13,
            boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
            pointerEvents: 'none',
          }}
        >
          <strong>{walkNearbyLandmark.title}</strong> — {walkNearbyLandmark.description}
        </div>
      )}

      {/* TOP-RIGHT EXACT GEMINISLAND WHITE PILL TOOLBAR (Frames 00:00–00:29!) */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {/* Pan | Orbit | Walk segmented white pill */}
        <div
          style={{
            background: '#ffffff',
            padding: 4,
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          }}
        >
          {(
            [
              ['pan', 'Pan', <Move size={14} key="p" />],
              ['orbit', 'Orbit', <Compass size={14} key="o" />],
              ['walk', 'Walk', <Footprints size={14} key="w" />],
            ] as Array<[NavControlMode, string, React.ReactNode]>
          ).map(([id, label, icon]) => {
            const active = navMode === id;
            return (
              <button
                key={id}
                onClick={() => (id === 'walk' ? handleEnterWalkMode() : setNavMode(id))}
                style={{
                  border: 'none',
                  background: active ? '#141517' : 'transparent',
                  color: active ? '#ffffff' : '#141517',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '7px 14px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Recenter pill */}
        <button
          onClick={handleRecenter}
          style={{
            border: 'none',
            background: '#ffffff',
            color: '#141517',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            padding: '11px 16px',
            borderRadius: 999,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          }}
        >
          <RotateCcw size={14} />
          <span>Recenter</span>
        </button>

        {/* Character pill */}
        <button
          onClick={() => setShowCharModal(true)}
          style={{
            border: 'none',
            background: '#ffffff',
            color: '#141517',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            padding: '11px 16px',
            borderRadius: 999,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          }}
        >
          <User size={14} />
          <span>Character</span>
        </button>

        {/* Green dot 49 Online / Chat toggle pill */}
        <button
          onClick={() => setShowChatDrawer((v) => !v)}
          title="Mở Chat Học sinh trên đảo"
          style={{
            border: 'none',
            background: '#ffffff',
            color: '#141517',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 800,
            padding: '11px 15px',
            borderRadius: 999,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block',
            }}
          />
          <span>49</span>
        </button>
      </div>

      {/* HOVER WHITE TOOLTIP CARD IN PAN/ORBIT MODE (Frames 00:00, 00:04, 00:07, 00:22!) */}
      {hoveredLandmark && navMode !== 'walk' && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hoveredLandmark.screenX + 16, 720),
            top: Math.max(hoveredLandmark.screenY - 76, 70),
            background: '#ffffff',
            color: '#141517',
            padding: '14px 18px',
            borderRadius: 16,
            maxWidth: 295,
            boxShadow: '0 14px 36px rgba(0,0,0,0.22)',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div className="display-font" style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
            {hoveredLandmark.meta.title}
          </div>
          <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.48 }}>
            {hoveredLandmark.meta.description}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#d97706', marginTop: 6 }}>
            Click để vào giao tiếp Tiếng Anh →
          </div>
        </div>
      )}

      {/* WALK MODE "[E] Enter <Building>" PILL (Frames 00:09, 00:21!) */}
      {navMode === 'walk' && walkNearbyLandmark && !activeBooth && (
        <button
          onClick={() => openLandmarkBooth(walkNearbyLandmark)}
          style={{
            position: 'absolute',
            bottom: 78,
            left: '50%',
            transform: 'translateX(-50%)',
            border: 'none',
            background: 'rgba(20, 21, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '9px 18px',
            borderRadius: 999,
            fontFamily: 'inherit',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
          }}
        >
          <span
            style={{
              background: 'rgba(255,255,255,0.22)',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            E
          </span>
          <span>Enter {walkNearbyLandmark.title}</span>
        </button>
      )}

      {/* BOTTOM-CENTER "+ Add" WHITE PILL BUTTON (Exact match to every frame of Geminisland!) */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          border: 'none',
          background: '#ffffff',
          color: '#141517',
          fontFamily: 'inherit',
          fontSize: 14.5,
          fontWeight: 800,
          padding: '12px 26px',
          borderRadius: 999,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
        }}
      >
        <Plus size={16} strokeWidth={2.6} />
        <span>Add</span>
      </button>

      {/* Build Toast */}
      {buildToast && (
        <div
          className="banner-pop"
          style={{
            position: 'absolute',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#141517',
            color: '#f5bd33',
            padding: '9px 20px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 800,
            boxShadow: '0 10px 26px rgba(0,0,0,0.3)',
          }}
        >
          {buildToast}
        </div>
      )}

      {/* CHARACTER CUSTOMIZER MODAL (Exact match to Frames 00:23–00:24!) */}
      {showCharModal && (
        <div className="modal-backdrop" onClick={() => setShowCharModal(false)}>
          <div
            className="modal-box"
            style={{ maxWidth: 820, padding: 26, borderRadius: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 26, alignItems: 'start' }}>
              {/* Left: Live 3D Voxel Character on Green Circular Pedestal */}
              <CharacterPreview3D config={charConfig} waving={waving} />

              {/* Right: Name, Tabs, Color Swatches, Style Pills, Randomize / Wave / Save */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    className="composer-input"
                    style={{ flex: 1, fontSize: 14.5, fontWeight: 600, borderRadius: 12 }}
                    placeholder="Name"
                    value={charConfig.name}
                    onChange={(e) => setCharConfig((c) => ({ ...c, name: e.target.value }))}
                  />
                  <button className="icon-btn" onClick={() => setShowCharModal(false)}>
                    <X size={16} />
                  </button>
                </div>

                {/* 5 Tabs: Head | Hat | Face | Outfit | Gear */}
                <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', padding: 5, borderRadius: 12 }}>
                  {(['Head', 'Hat', 'Face', 'Outfit', 'Gear'] as CustomTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCharTab(t)}
                      style={{
                        flex: 1,
                        border: 'none',
                        borderRadius: 9,
                        padding: '8px 0',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: charTab === t ? '#141517' : 'transparent',
                        color: charTab === t ? '#ffffff' : '#4b5563',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {charTab === 'Head' && (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {/* Skin color circles */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {SKIN_COLORS.map((sc) => (
                        <button
                          key={sc}
                          onClick={() => setCharConfig((c) => ({ ...c, skinColor: sc }))}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: sc,
                            border: charConfig.skinColor === sc ? '3px solid #141517' : '2px solid #e5e7eb',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>

                    {/* Hair style pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {HAIR_STYLES.map((hs) => (
                        <button
                          key={hs}
                          onClick={() => setCharConfig((c) => ({ ...c, hairStyle: hs }))}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            padding: '7px 14px',
                            fontFamily: 'inherit',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: charConfig.hairStyle === hs ? '#141517' : '#f9fafb',
                            color: charConfig.hairStyle === hs ? 'white' : '#374151',
                          }}
                        >
                          {hs}
                        </button>
                      ))}
                    </div>

                    {/* Hair color circles */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {HAIR_COLORS.map((hc) => (
                        <button
                          key={hc}
                          onClick={() => setCharConfig((c) => ({ ...c, hairColor: hc }))}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: hc,
                            border: charConfig.hairColor === hc ? '3px solid #141517' : '2px solid #e5e7eb',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {charTab === 'Hat' && (
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(['None', 'Crown', 'Cap', 'Grad', 'Headphones'] as VoxelCustomConfig['hatStyle'][]).map((ht) => (
                        <button
                          key={ht}
                          onClick={() => setCharConfig((c) => ({ ...c, hatStyle: ht }))}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            padding: '8px 16px',
                            fontFamily: 'inherit',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: charConfig.hatStyle === ht ? '#141517' : '#f9fafb',
                            color: charConfig.hatStyle === ht ? 'white' : '#374151',
                          }}
                        >
                          {ht}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {OUTFIT_COLORS.map((oc) => (
                        <button
                          key={oc}
                          onClick={() => setCharConfig((c) => ({ ...c, hatColor: oc }))}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: oc,
                            border: charConfig.hatColor === oc ? '3px solid #141517' : '2px solid #e5e7eb',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {charTab === 'Face' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(['Smile', 'Glasses', 'Cool', 'Wink'] as VoxelCustomConfig['faceStyle'][]).map((fs) => (
                      <button
                        key={fs}
                        onClick={() => setCharConfig((c) => ({ ...c, faceStyle: fs }))}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 10,
                          padding: '8px 16px',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: charConfig.faceStyle === fs ? '#141517' : '#f9fafb',
                          color: charConfig.faceStyle === fs ? 'white' : '#374151',
                        }}
                      >
                        {fs}
                      </button>
                    ))}
                  </div>
                )}

                {charTab === 'Outfit' && (
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6b7280' }}>Shirt Color</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {OUTFIT_COLORS.map((oc) => (
                        <button
                          key={oc}
                          onClick={() => setCharConfig((c) => ({ ...c, outfitColor: oc }))}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: oc,
                            border: charConfig.outfitColor === oc ? '3px solid #141517' : '2px solid #e5e7eb',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6b7280' }}>Overalls Color</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {OUTFIT_COLORS.map((oc) => (
                        <button
                          key={oc}
                          onClick={() => setCharConfig((c) => ({ ...c, overallColor: oc }))}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: oc,
                            border: charConfig.overallColor === oc ? '3px solid #141517' : '2px solid #e5e7eb',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {charTab === 'Gear' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['Backpack', 'Cape', 'None'] as VoxelCustomConfig['gearStyle'][]).map((gs) => (
                      <button
                        key={gs}
                        onClick={() => setCharConfig((c) => ({ ...c, gearStyle: gs }))}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 10,
                          padding: '8px 16px',
                          fontFamily: 'inherit',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: charConfig.gearStyle === gs ? '#141517' : '#f9fafb',
                          color: charConfig.gearStyle === gs ? 'white' : '#374151',
                        }}
                      >
                        {gs}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Action Row: Randomize | Wave | Save */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 14 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" onClick={handleRandomizeCharacter}>
                      <Shuffle size={14} /> Randomize
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setWaving(true);
                        setTimeout(() => setWaving(false), 1800);
                      }}
                    >
                      Wave
                    </button>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ padding: '10px 28px', borderRadius: 12 }}
                    onClick={() => setShowCharModal(false)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "+ Add" AI VOXEL STRUCTURE MODAL */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" style={{ maxWidth: 480, borderRadius: 22 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="display-font" style={{ fontSize: 19, fontWeight: 800 }}>
                + Add to Geminisland
              </h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}>
                <X size={15} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Mô tả công trình 3D Voxel bạn muốn thêm lên hòn đảo (tiếng Việt hoặc tiếng Anh):
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[
                'Grand Lattice Tower',
                'Giant Dancing Robot',
                'Crimson Heart Fountain',
                'Golden Tiered Pagoda',
                'S.S. Meadow Ferry',
              ].map((preset) => (
                <button
                  key={preset}
                  className="duo-tile"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                  onClick={() => handleAddStructure(preset)}
                >
                  + {preset}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="composer-input"
                placeholder="VD: Build a golden pagoda, Xây người máy khổng lồ..."
                value={addPrompt}
                onChange={(e) => setAddPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStructure();
                }}
              />
              <button className="duo-btn-3d gold" disabled={!addPrompt.trim()} onClick={() => handleAddStructure()}>
                <Sparkles size={15} /> Build
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING RIGHT STUDENT CHAT DRAWER */}
      {showChatDrawer && (
        <div
          className="banner-pop"
          style={{
            position: 'absolute',
            top: 68,
            right: 16,
            bottom: 84,
            width: 310,
            background: 'white',
            border: '2px solid #e7e2d9',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
          }}
        >
          <div style={{ background: '#141517', color: 'white', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>49 Students Online · Island Chat</div>
            <button className="ghost-link" style={{ color: 'white' }} onClick={() => setShowChatDrawer(false)}>
              <X size={15} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {plazaChat.map((c) => (
              <div key={c.id} className={`msg-row ${c.isSelf ? 'user' : 'ai'}`} style={{ maxWidth: '94%' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>
                  {c.sender} · {c.time}
                </div>
                <div className={c.isSelf ? 'duo-bubble-user' : 'duo-bubble-ai'} style={{ padding: '8px 11px', fontSize: 12.5 }}>
                  {c.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: 10, display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`duo-btn-3d ${isRecording ? 'recording' : 'gold'}`}
              style={{ width: 38, height: 38, padding: 0 }}
              onClick={toggleVoiceChat}
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <input
              className="composer-input"
              style={{ minHeight: 38, padding: '7px 10px', fontSize: 12.5 }}
              placeholder="Say something in English..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendPlazaChat();
              }}
            />
            <button
              type="button"
              className="duo-btn-3d dark"
              style={{ height: 38, padding: '0 11px' }}
              disabled={!chatInput.trim()}
              onClick={() => handleSendPlazaChat()}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* LANDMARK ENGLISH BOOTH INTERACTION MODAL */}
      {activeBooth && (
        <div className="modal-backdrop" onClick={() => setActiveBooth(null)}>
          <div className="modal-box" style={{ maxWidth: 520, borderRadius: 20 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span className="badge badge-indigo" style={{ marginBottom: 4 }}>{activeBooth.npcName}</span>
                <h3 className="display-font" style={{ fontSize: 19, fontWeight: 800 }}>
                  {activeLandmarkTitle || activeBooth.name}
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{activeBooth.greetingVi}</p>
              </div>
              <button className="icon-btn" onClick={() => setActiveBooth(null)}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  background: '#fcfbf8',
                  border: '1.5px solid #e7e2d9',
                  borderRadius: 14,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {boothMessages.map((m, i) => (
                  <div key={i} style={{ fontSize: 13.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <strong>{m.sender}</strong>
                      <button className="ghost-link" onClick={() => speakEnglish(m.text)}>
                        <Volume2 size={12} />
                      </button>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{m.text}</div>
                  </div>
                ))}
              </div>

              {activeBooth.quickReplies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeBooth.quickReplies.map((r) => (
                    <button
                      key={r}
                      className="duo-tile"
                      style={{ maxWidth: '100%', whiteSpace: 'normal', textAlign: 'left', fontSize: 12 }}
                      onClick={() => handleBoothSend(r)}
                    >
                      “{r}”
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="composer-input"
                  placeholder="Speak or type in English (+15 XP)..."
                  value={boothInput}
                  onChange={(e) => setBoothInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBoothSend();
                  }}
                />
                <button className="duo-btn-3d dark" onClick={() => handleBoothSend()}>
                  <Send size={14} />
                </button>
              </div>

              <button
                className="duo-btn-3d gold"
                style={{ width: '100%' }}
                onClick={() => {
                  setActiveBooth(null);
                  onEnterDebateArena();
                }}
              >
                Luyện bài tập Duolingo & Chấm IPA cho chủ đề này →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
