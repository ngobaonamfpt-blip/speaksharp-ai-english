import * as THREE from 'three';
import { CityBoothDef, CITY_BOOTHS } from './cityBuilder';

export { CITY_BOOTHS };
export type { CityBoothDef };

export interface VoxelCustomConfig {
  name: string;
  skinColor: string;
  hairStyle: 'Short' | 'Spiky' | 'Parted' | 'Long' | 'Ponytail' | 'Buns' | 'Curly' | 'Mohawk' | 'Bob' | 'None';
  hairColor: string;
  hatStyle: 'None' | 'Crown' | 'Cap' | 'Grad' | 'Headphones';
  hatColor: string;
  faceStyle: 'Smile' | 'Glasses' | 'Cool' | 'Wink';
  outfitColor: string;
  overallColor: string;
  gearStyle: 'Backpack' | 'Cape' | 'None';
}

export const DEFAULT_VOXEL_CONFIG: VoxelCustomConfig = {
  name: 'SpeakSharp Student',
  skinColor: '#f5d0b5',
  hairStyle: 'Spiky',
  hairColor: '#3b2314',
  hatStyle: 'None',
  hatColor: '#f5bd33',
  faceStyle: 'Glasses',
  outfitColor: '#2563eb',
  overallColor: '#374151',
  gearStyle: 'Backpack',
};

export interface LandmarkMetadata {
  id: string;
  title: string;
  description: string;
  x: number;
  z: number;
  radius: number;
  boothId?: 'cafe' | 'debate' | 'ielts' | 'shop';
}

// ============================================================================
// CRISP VOXEL GRID TEXTURE (Gives every block authentic Geminisland voxel seams!)
// ============================================================================
let cachedVoxelGridTex: THREE.CanvasTexture | null = null;
function getVoxelGridTexture(): THREE.CanvasTexture {
  if (cachedVoxelGridTex) return cachedVoxelGridTex;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(0,0,0,0.13)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 61, 61);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedVoxelGridTex = tex;
  return tex;
}

const BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
const matCache = new Map<string, THREE.MeshStandardMaterial>();

function getVoxelMat(colorHex: number | string, tiled = true): THREE.MeshStandardMaterial {
  const key = `${colorHex}-${tiled}`;
  if (matCache.has(key)) return matCache.get(key)!;
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    map: tiled ? getVoxelGridTexture() : null,
    roughness: 0.72,
    metalness: 0.04,
  });
  matCache.set(key, m);
  return m;
}

function vox(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  color: number | string
): THREE.Mesh {
  const mesh = new THREE.Mesh(BOX_GEO, getVoxelMat(color, true));
  mesh.position.set(x, y + sy / 2, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// ============================================================================
// CUSTOMIZABLE VOXEL CHARACTER (Matches Frame 00:23 Character Customizer!)
// ============================================================================
export function buildCustomVoxelCharacter(cfg: VoxelCustomConfig): THREE.Group {
  const root = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.65, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  root.add(shadow);

  const rig = new THREE.Group();
  rig.name = 'bodyRig';
  root.add(rig);

  // Shoes & Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22, 0.75, 0);
  leftLeg.name = 'leftLeg';
  vox(leftLeg, 0, -0.55, 0, 0.36, 0.55, 0.36, cfg.overallColor);
  vox(leftLeg, 0, -0.75, 0.05, 0.38, 0.2, 0.46, '#18181b');

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22, 0.75, 0);
  rightLeg.name = 'rightLeg';
  vox(rightLeg, 0, -0.55, 0, 0.36, 0.55, 0.36, cfg.overallColor);
  vox(rightLeg, 0, -0.75, 0.05, 0.38, 0.2, 0.46, '#18181b');
  rig.add(leftLeg, rightLeg);

  // Torso + Overalls detail (like Frame 00:23!)
  vox(rig, 0, 0.75, 0, 0.84, 0.88, 0.48, cfg.outfitColor);
  vox(rig, 0, 0.75, 0.02, 0.62, 0.52, 0.48, cfg.overallColor);
  vox(rig, -0.2, 1.25, 0.02, 0.14, 0.38, 0.48, cfg.overallColor);
  vox(rig, 0.2, 1.25, 0.02, 0.14, 0.38, 0.48, cfg.overallColor);

  // Gear
  if (cfg.gearStyle === 'Backpack') {
    vox(rig, 0, 0.85, -0.32, 0.58, 0.62, 0.24, '#d97706');
  } else if (cfg.gearStyle === 'Cape') {
    vox(rig, 0, 0.45, -0.28, 0.78, 1.1, 0.08, '#dc2626');
  }

  // Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.56, 1.52, 0);
  leftArm.name = 'leftArm';
  vox(leftArm, 0, -0.45, 0, 0.26, 0.48, 0.28, cfg.outfitColor);
  vox(leftArm, 0, -0.68, 0, 0.24, 0.24, 0.24, cfg.skinColor);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.56, 1.52, 0);
  rightArm.name = 'rightArm';
  vox(rightArm, 0, -0.45, 0, 0.26, 0.48, 0.28, cfg.outfitColor);
  vox(rightArm, 0, -0.68, 0, 0.24, 0.24, 0.24, cfg.skinColor);
  rig.add(leftArm, rightArm);

  // Voxel Head
  vox(rig, 0, 1.63, 0, 0.88, 0.84, 0.84, cfg.skinColor);

  // Face / Glasses (like Frame 00:23!)
  vox(rig, -0.2, 1.98, 0.43, 0.12, 0.14, 0.04, '#141517');
  vox(rig, 0.2, 1.98, 0.43, 0.12, 0.14, 0.04, '#141517');
  vox(rig, 0, 1.8, 0.43, 0.22, 0.07, 0.04, '#9a3412');

  if (cfg.faceStyle === 'Glasses' || cfg.faceStyle === 'Cool') {
    const gColor = cfg.faceStyle === 'Cool' ? '#111827' : '#374151';
    vox(rig, -0.22, 1.94, 0.45, 0.28, 0.22, 0.05, gColor);
    vox(rig, 0.22, 1.94, 0.45, 0.28, 0.22, 0.05, gColor);
    vox(rig, 0, 2.02, 0.45, 0.16, 0.06, 0.05, gColor);
  }

  // Hair Styles
  if (cfg.hairStyle !== 'None') {
    vox(rig, 0, 2.42, -0.02, 0.94, 0.22, 0.9, cfg.hairColor);
    vox(rig, 0, 1.85, -0.42, 0.92, 0.65, 0.14, cfg.hairColor);
    if (cfg.hairStyle === 'Spiky' || cfg.hairStyle === 'Mohawk') {
      vox(rig, 0, 2.62, 0.1, 0.32, 0.24, 0.65, cfg.hairColor);
    } else if (cfg.hairStyle === 'Long' || cfg.hairStyle === 'Bob') {
      vox(rig, -0.46, 1.75, 0, 0.12, 0.72, 0.76, cfg.hairColor);
      vox(rig, 0.46, 1.75, 0, 0.12, 0.72, 0.76, cfg.hairColor);
    } else if (cfg.hairStyle === 'Buns' || cfg.hairStyle === 'Ponytail') {
      vox(rig, -0.35, 2.58, -0.2, 0.28, 0.28, 0.28, cfg.hairColor);
      vox(rig, 0.35, 2.58, -0.2, 0.28, 0.28, 0.28, cfg.hairColor);
    }
  }

  // Hats
  if (cfg.hatStyle === 'Crown') {
    vox(rig, 0, 2.6, 0, 0.66, 0.26, 0.66, '#f5bd33');
  } else if (cfg.hatStyle === 'Cap') {
    vox(rig, 0, 2.55, 0, 0.92, 0.22, 0.92, cfg.hatColor);
    vox(rig, 0, 2.55, 0.55, 0.76, 0.1, 0.35, cfg.hatColor);
  } else if (cfg.hatStyle === 'Grad') {
    vox(rig, 0, 2.62, 0, 1.15, 0.1, 1.15, '#141517');
  } else if (cfg.hatStyle === 'Headphones') {
    vox(rig, -0.5, 1.95, 0, 0.14, 0.32, 0.32, cfg.hatColor);
    vox(rig, 0.5, 1.95, 0, 0.14, 0.32, 0.32, cfg.hatColor);
  }

  return root;
}

// ============================================================================
// ICONIC GEMINISLAND VOXEL LANDMARK BUILDERS (Directly matching video frames!)
// ============================================================================

// 1. Dome Masjid / Academy (Frames 00:03, 00:08, 00:13)
function buildDomeAcademy(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  vox(g, 0, 0, 0, 8, 4.5, 7, '#d6ceb8');
  vox(g, 0, 0, 3.55, 2.6, 3.4, 0.3, '#0f766e');
  vox(g, -2.5, 1.5, 3.55, 1.2, 1.8, 0.2, '#d97706');
  vox(g, 2.5, 1.5, 3.55, 1.2, 1.8, 0.2, '#d97706');
  // Teal stepped voxel dome
  vox(g, 0, 4.5, 0, 5.6, 1.2, 5.6, '#0d9488');
  vox(g, 0, 5.7, 0, 4.2, 1.1, 4.2, '#14b8a6');
  vox(g, 0, 6.8, 0, 2.6, 0.9, 2.6, '#2dd4bf');
  vox(g, 0, 7.7, 0, 0.5, 1.4, 0.5, '#f5bd33');
  // Tall Minaret Tower
  vox(g, -4.4, 0, 3.2, 1.5, 9.5, 1.5, '#e5dec9');
  vox(g, -4.4, 6.2, 3.2, 1.7, 0.8, 1.7, '#0f766e');
  vox(g, -4.4, 9.5, 3.2, 1.1, 2.0, 1.1, '#0d9488');
  return g;
}

// 2. Grand Lattice Eiffel Tower (Frames 00:05, 00:14, 00:18, 00:20)
function buildLatticeTower(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  // 4 Stepped legs with arch gap you can walk under!
  [
    [-2.4, -2.4],
    [2.4, -2.4],
    [-2.4, 2.4],
    [2.4, 2.4],
  ].forEach(([lx, lz]) => {
    vox(g, lx, 0, lz, 1.6, 1.4, 1.6, '#57534e');
    vox(g, lx * 0.82, 1.4, lz * 0.82, 1.3, 2.2, 1.3, '#443311');
    vox(g, lx * 0.62, 3.6, lz * 0.62, 1.1, 2.2, 1.1, '#5c4018');
  });
  // First observation deck
  vox(g, 0, 5.6, 0, 5.2, 0.7, 5.2, '#d97706');
  vox(g, 0, 6.3, 0, 3.2, 3.5, 3.2, '#443311');
  // Second gold deck
  vox(g, 0, 9.8, 0, 3.8, 0.6, 3.8, '#f5bd33');
  vox(g, 0, 10.4, 0, 2.0, 4.2, 2.0, '#5c4018');
  vox(g, 0, 14.6, 0, 1.1, 3.2, 1.1, '#f5bd33');
  vox(g, 0, 17.8, 0, 0.4, 2.4, 0.4, '#fef08a');
  return g;
}

// 3. Snowy Voxel Mountain Pyramid (Frames 00:05, 00:06)
function buildVoxelMountain(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  for (let i = 0; i < 8; i++) {
    const s = 10.5 - i * 1.2;
    const col = i < 2 ? '#57534e' : i < 4 ? '#a8a29e' : '#f8fafc';
    vox(g, 0, i * 1.15, 0, s, 1.15, s, col);
  }
  return g;
}

// 4. Giant Voxel Heart Fountain (Frame 00:10)
function buildHeartFountain(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  vox(g, 0, 0, 0, 6.4, 0.6, 6.4, '#38bdf8');
  vox(g, 0, 0.6, 0, 4.2, 1.2, 2.2, '#18181b');
  // Stepped Red Voxel Heart
  vox(g, 0, 1.8, 0, 1.4, 0.9, 1.0, '#dc2626');
  vox(g, 0, 2.7, 0, 2.8, 0.9, 1.0, '#dc2626');
  vox(g, 0, 3.6, 0, 4.2, 1.4, 1.0, '#ef4444');
  vox(g, -1.1, 5.0, 0, 1.6, 0.9, 1.0, '#ef4444');
  vox(g, 1.1, 5.0, 0, 1.6, 0.9, 1.0, '#ef4444');
  return g;
}

// 5. Giant Dancing Voxel Robot & Giant Scholar Statue (Frames 00:07, 00:11, 00:15)
function buildGiantRobot(x: number, z: number, primary: string, secondary: string): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  vox(g, -1.1, 0, 0, 1.4, 3.2, 1.4, '#1e293b');
  vox(g, 1.1, 0, 0, 1.4, 3.2, 1.4, '#1e293b');
  vox(g, 0, 3.2, 0, 4.0, 4.2, 2.4, primary);
  vox(g, 0, 4.2, 1.25, 2.4, 2.2, 0.2, secondary);
  vox(g, -2.8, 3.8, 0, 1.2, 3.4, 1.2, secondary);
  vox(g, 2.8, 4.6, 0.8, 1.2, 3.4, 1.2, secondary);
  vox(g, 0, 7.4, 0, 2.6, 2.4, 2.4, '#f8fafc');
  vox(g, -0.6, 8.3, 1.25, 0.5, 0.5, 0.15, '#38bdf8');
  vox(g, 0.6, 8.3, 1.25, 0.5, 0.5, 0.15, '#38bdf8');
  vox(g, 0, 9.8, 0, 0.3, 1.4, 0.3, '#f5bd33');
  return g;
}

// 6. Golden Tiered Pagoda / Registan Square Ensemble (Frames 00:06, 00:22)
function buildGoldenPagoda(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const tiers = [
    { w: 6.2, h: 1.6, c: '#d97706' },
    { w: 5.0, h: 1.5, c: '#f59e0b' },
    { w: 3.8, h: 1.4, c: '#fbbf24' },
    { w: 2.4, h: 1.4, c: '#f5bd33' },
  ];
  let curY = 0;
  tiers.forEach((t) => {
    vox(g, 0, curY, 0, t.w, t.h, t.w, t.c);
    vox(g, 0, curY + t.h, 0, t.w + 0.8, 0.35, t.w + 0.8, '#92400e');
    curY += t.h + 0.35;
  });
  vox(g, 0, curY, 0, 0.5, 2.2, 0.5, '#fef08a');
  return g;
}

// 7. S.S. Meadow Ferry Steamboat (Frame 00:04)
function buildMeadowFerry(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  vox(g, 0, 0, 0, 7.2, 1.2, 3.2, '#78350f');
  vox(g, 0, 1.2, 0, 5.4, 1.4, 2.6, '#fef3c7');
  vox(g, 0, 2.6, 0, 3.6, 1.1, 2.2, '#ffffff');
  vox(g, -0.8, 3.7, 0, 0.65, 1.8, 0.65, '#d97706');
  vox(g, 0.8, 3.7, 0, 0.65, 1.8, 0.65, '#d97706');
  vox(g, 3.2, 0.5, 0, 1.6, 1.6, 3.5, '#dc2626');
  return g;
}

// 8. Tennis / Sports Court (Frames 00:05, 00:06)
function buildSportsCourt(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  vox(g, 0, 0, 0, 10.5, 0.18, 6.4, '#0284c7');
  vox(g, 0, 0.18, 0, 0.18, 0.7, 6.2, '#ffffff');
  vox(g, 0, 0, -3.2, 10.5, 1.1, 0.25, '#1e3a8a');
  vox(g, 0, 0, 3.2, 10.5, 1.1, 0.25, '#1e3a8a');
  return g;
}

// 9. Colorful Voxel Townhouse / Pavilion
function buildTownhouse(x: number, z: number, wallColor: string, roofColor: string, h = 4.2): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  vox(g, 0, 0, 0, 5.0, h, 4.4, wallColor);
  vox(g, 0, h, 0, 5.6, 0.9, 5.0, roofColor);
  vox(g, 0, h + 0.9, 0, 4.0, 0.8, 3.6, roofColor);
  vox(g, 0, 0, 2.25, 1.3, 2.2, 0.15, '#78350f');
  vox(g, -1.4, 1.8, 2.25, 1.0, 1.1, 0.15, '#fef08a');
  vox(g, 1.4, 1.8, 2.25, 1.0, 1.1, 0.15, '#fef08a');
  return g;
}

// 10. Voxel Tree
function buildVoxelTree(x: number, z: number, foliageColor = '#15803d', scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  vox(g, 0, 0, 0, 0.7 * scale, 1.8 * scale, 0.7 * scale, '#78350f');
  vox(g, 0, 1.6 * scale, 0, 2.4 * scale, 1.2 * scale, 2.4 * scale, foliageColor);
  vox(g, 0, 2.7 * scale, 0, 1.6 * scale, 1.0 * scale, 1.6 * scale, foliageColor);
  return g;
}

// 11. Voxel Sports Car (Porsche GT3 RS — Frame 00:00!)
function buildVoxelSportsCar(color: string): THREE.Group {
  const g = new THREE.Group();
  vox(g, 0, 0.25, 0, 1.7, 0.55, 3.3, color);
  vox(g, 0, 0.8, -0.15, 1.4, 0.48, 1.6, '#1e293b');
  vox(g, 0, 0.85, -1.55, 1.65, 0.14, 0.45, '#111827'); // Rear GT wing!
  [
    [-0.85, 1.0],
    [0.85, 1.0],
    [-0.85, -1.0],
    [0.85, -1.0],
  ].forEach(([wx, wz]) => {
    vox(g, wx, 0, wz, 0.28, 0.55, 0.65, '#111827');
  });
  return g;
}

// ============================================================================
// DYNAMIC AI PROMPT VOXEL BUILDER
// ============================================================================
export function generateVoxelStructureFromPrompt(
  prompt: string,
  x: number,
  z: number
): { labelVi: string; description: string; mesh: THREE.Group; targetY: number } {
  const lower = prompt.toLowerCase();
  let mesh: THREE.Group;
  let labelVi = 'SpeakSharp Voxel Pavilion';
  let description = 'Custom AI-generated voxel structure built live on the island.';

  if (lower.includes('tháp') || lower.includes('eiffel') || lower.includes('tower')) {
    labelVi = 'Grand Lattice Tower';
    description = 'Monumental observation tower offering panoramic views across the island.';
    mesh = buildLatticeTower(x, z);
  } else if (lower.includes('robot') || lower.includes('người máy')) {
    labelVi = 'Giant Dancing Robot';
    description = 'Towering musical automaton grooving through the meadow.';
    mesh = buildGiantRobot(x, z, '#dc2626', '#f5bd33');
  } else if (lower.includes('tim') || lower.includes('heart') || lower.includes('đài phun')) {
    labelVi = 'Crimson Heart Fountain';
    description = 'Sculpted voxel heart monument surrounded by shimmering turquoise water.';
    mesh = buildHeartFountain(x, z);
  } else if (lower.includes('chùa') || lower.includes('pagoda') || lower.includes('lâu đài')) {
    labelVi = 'Golden Tiered Pagoda';
    description = 'Historic golden pavilion where scholars gather for debate and exchange.';
    mesh = buildGoldenPagoda(x, z);
  } else if (lower.includes('núi') || lower.includes('mountain')) {
    labelVi = 'Alpine Snow Peak';
    description = 'Stepped voxel mountain peak crowned with crisp white snow.';
    mesh = buildVoxelMountain(x, z);
  } else if (lower.includes('tàu') || lower.includes('thuyền') || lower.includes('ferry') || lower.includes('boat')) {
    labelVi = 'S.S. Meadow Ferry';
    description = 'Paddlewheel passenger steamship ferrying travelers across the lagoon.';
    mesh = buildMeadowFerry(x, z);
  } else {
    labelVi = prompt.slice(0, 28);
    description = `Custom voxel landmark created from prompt: "${prompt}"`;
    mesh = buildDomeAcademy(x, z);
  }

  return { labelVi, description, mesh, targetY: 0 };
}

// ============================================================================
// BUILD MASSIVE GEMINISLAND SCENE (45+ LANDMARKS, ROADS, CARS & OCEAN)
// ============================================================================
export interface VoxelIslandHandles {
  groundTargets: THREE.Object3D[];
  landmarks: LandmarkMetadata[];
  cars: Array<{ mesh: THREE.Group; radiusX: number; radiusZ: number; angle: number; speed: number }>;
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
}

export function buildGeminislandScene(scene: THREE.Scene): VoxelIslandHandles {
  const groundTargets: THREE.Object3D[] = [];
  const landmarks: LandmarkMetadata[] = [];
  const cars: Array<{ mesh: THREE.Group; radiusX: number; radiusZ: number; angle: number; speed: number }> = [];

  // Bright Turquoise Sky & Ocean (Exact Geminisland look!)
  scene.background = new THREE.Color(0x0284c7);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbae6fd, 1.05);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffdf5, 1.35);
  sunLight.position.set(55, 85, 45);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 240;
  sunLight.shadow.camera.left = -95;
  sunLight.shadow.camera.right = 95;
  sunLight.shadow.camera.top = 95;
  sunLight.shadow.camera.bottom = -95;
  scene.add(sunLight);

  // 1. Deep Sparkling Ocean + White Foam Shoreline Rings
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(520, 520),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.08 })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -1.2;
  scene.add(ocean);

  // Shallow turquoise lagoon ring + white sea foam ring
  const foamLayer = new THREE.Mesh(
    new THREE.CylinderGeometry(96, 98, 0.4, 48),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
  );
  foamLayer.position.y = -1.05;
  scene.add(foamLayer);

  const lagoonLayer = new THREE.Mesh(
    new THREE.CylinderGeometry(93, 95, 0.5, 48),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
  );
  lagoonLayer.position.y = -0.95;
  scene.add(lagoonLayer);

  // Sandy Beach Rim
  const sandRim = new THREE.Mesh(
    new THREE.CylinderGeometry(86, 89, 1.0, 48),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.9 })
  );
  sandRim.position.y = -0.55;
  sandRim.receiveShadow = true;
  scene.add(sandRim);
  groundTargets.push(sandRim);

  // Massive Lush Green Island Plateau (Radius 82 => 164x164 units!)
  const greenPlateau = new THREE.Mesh(
    new THREE.CylinderGeometry(81, 83, 0.6, 48),
    new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.88 })
  );
  greenPlateau.position.y = -0.3;
  greenPlateau.receiveShadow = true;
  scene.add(greenPlateau);
  groundTargets.push(greenPlateau);

  // 2. Winding Asphalt Circuit Road + Inner Crossroads + Stepping Stone Paths!
  const roadRing = new THREE.Mesh(
    new THREE.RingGeometry(46, 52, 48),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, side: THREE.DoubleSide })
  );
  roadRing.rotation.x = -Math.PI / 2;
  roadRing.position.y = 0.03;
  roadRing.receiveShadow = true;
  scene.add(roadRing);
  groundTargets.push(roadRing);

  // White dashed road lines around circuit
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 2.2), dashMat);
    dash.position.set(Math.cos(a) * 49, 0.04, Math.sin(a) * 49);
    dash.rotation.y = -a;
    scene.add(dash);
  }

  // Inner Asphalt Avenue Loop (Radius 22)
  const innerRoad = new THREE.Mesh(
    new THREE.RingGeometry(20, 24.5, 40),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, side: THREE.DoubleSide })
  );
  innerRoad.rotation.x = -Math.PI / 2;
  innerRoad.position.y = 0.03;
  scene.add(innerRoad);
  groundTargets.push(innerRoad);

  // Cobblestone Stepping-Stone Footpaths (Exact match to Frame 00:12 & 00:14!)
  const pathGroup = new THREE.Group();
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.9 });
  const pNS = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.04, 145), dirtMat);
  pNS.position.y = 0.02;
  const pEW = new THREE.Mesh(new THREE.BoxGeometry(145, 0.04, 3.4), dirtMat);
  pEW.position.y = 0.02;
  pathGroup.add(pNS, pEW);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.8 });
  for (let d = -68; d <= 68; d += 2.2) {
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.9), stoneMat);
    s1.position.set(((d * 7) % 3) * 0.35, 0.05, d);
    s1.rotation.y = (d % 5) * 0.12;
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 1.1), stoneMat);
    s2.position.set(d, 0.05, ((d * 7) % 3) * 0.35);
    s2.rotation.y = (d % 5) * 0.12;
    pathGroup.add(s1, s2);
  }
  scene.add(pathGroup);
  groundTargets.push(pNS, pEW);

  // 3. POPULATE 30+ MAJOR NAMED LANDMARKS & ENGLISH BOOTHS ACROSS THE ISLAND!
  const register = (
    id: string,
    title: string,
    description: string,
    x: number,
    z: number,
    mesh: THREE.Group,
    boothId?: 'cafe' | 'debate' | 'ielts' | 'shop',
    radius = 6.5
  ) => {
    scene.add(mesh);
    landmarks.push({ id, title, description, x, z, radius, boothId });
  };

  // Centerpiece: Grand Lattice Eiffel Tower
  register(
    'lattice-tower',
    'Grand Lattice Tower',
    'Monumental observation tower offering panoramic island views and English speaking challenges.',
    0,
    -6,
    buildLatticeTower(0, -6),
    'debate',
    7
  );

  // 4 Core English Learning Booths (Mapped to impressive voxel architecture!)
  register(
    'dome-academy',
    'Dome Masjid & IELTS Academy',
    'Historic teal-domed scholarly sanctuary for IELTS Speaking Band 8.0 and study abroad mentoring.',
    -15,
    12,
    buildDomeAcademy(-15, 12),
    'ielts',
    7
  );

  register(
    'registan-pagoda',
    'Registan Square & WSDC Arena',
    'Golden tiered public square and debate amphitheater where scholars gather for WSDC rebuttals.',
    16,
    -14,
    buildGoldenPagoda(16, -14),
    'debate',
    7
  );

  register(
    'london-cafe',
    'Harbor Street Café & Bakery',
    'Cozy brick-and-gold corner café for practicing everyday English orders and casual conversation.',
    -16,
    -14,
    buildTownhouse(-16, -14, '#fef3c7', '#ea580c', 5.2),
    'cafe',
    6.5
  );

  register(
    'sakura-boutique',
    'Sakura XP Merch Boutique',
    'Festival pavilion where students exchange earned XP for 3D outfits, hats, and accessories.',
    16,
    14,
    buildTownhouse(16, 14, '#fdf2f8', '#db2777', 5.0),
    'shop',
    6.5
  );

  // Famous Geminisland Landmarks from the video!
  register(
    'snow-mountain',
    'Alpine Matterhorn Peak',
    'Stepped voxel mountain peak rising from the central meadow with snowy cliffs.',
    -9,
    -28,
    buildVoxelMountain(-9, -28),
    'debate'
  );

  register(
    'meadow-ferry',
    'S.S. Meadow Ferry',
    'Paddlewheel passenger steamship ferrying travelers and cargo across the southern harbor.',
    -28,
    -8,
    buildMeadowFerry(-28, -8),
    'cafe'
  );

  register(
    'heart-fountain',
    'Crimson Heart Fountain',
    'Iconic red voxel heart monument celebrating confidence and friendship in language learning.',
    27,
    2,
    buildHeartFountain(27, 2),
    'shop'
  );

  register(
    'dancing-robot',
    'Giant Dancing Robot',
    'Towering musical automaton grooving through the southern meadow to spread rhythm and joy.',
    -32,
    -32,
    buildGiantRobot(-32, -32, '#dc2626', '#f5bd33'),
    'cafe'
  );

  register(
    'scholar-statue',
    'Colossus Builder Statue',
    'Monumental voxel craftsman overlooking the eastern plaza.',
    34,
    -24,
    buildGiantRobot(34, -24, '#2563eb', '#f59e0b'),
    'ielts'
  );

  register(
    'mech-guardian',
    'Cyber Debate Mech',
    'Futuristic AI debate guardian stationed near the eastern coast.',
    38,
    16,
    buildGiantRobot(38, 16, '#141517', '#38bdf8'),
    'debate'
  );

  register(
    'tennis-court',
    'Island Championship Court',
    'Open-air blue sports arena where students discuss sports & health topics in English.',
    2,
    32,
    buildSportsCourt(2, 32),
    'cafe'
  );

  register(
    'west-pagoda',
    'Sunset Golden Temple',
    'Tiered golden sanctuary along the western coast road.',
    -38,
    28,
    buildGoldenPagoda(-38, 28),
    'ielts'
  );

  register(
    'east-fountain',
    'Azure Cascade Fountain',
    'Ornamental tiered water fountain on the southeastern lawn.',
    28,
    36,
    buildGoldenPagoda(28, 36),
    'shop'
  );

  register(
    'north-dome',
    'Northern Observatory Dome',
    'Astronomy & science discussion dome on the northern boulevard.',
    14,
    -36,
    buildDomeAcademy(14, -36),
    'ielts'
  );

  // Additional Neighborhood Townhouses & Pavilions around the outer ring road (±55..68)
  const outerBuildings: Array<[number, number, string, string, string, string]> = [
    [-56, -22, '#fef3c7', '#d97706', 'West Harbor Bakery', 'Freshly baked croissants and English small-talk practice.'],
    [-58, 4, '#e0f2fe', '#0284c7', 'Pacific Study Lounge', 'Quiet coastal pavilion for TOEFL & IELTS vocabulary review.'],
    [-54, 32, '#fce7f3', '#db2777', 'Coral Art Gallery', 'Creative arts & culture discussion studio.'],
    [-26, 56, '#dcfce7', '#15803d', 'Eco-Tech Innovation Lab', 'Debate floor for climate change and green technology motions.'],
    [12, 58, '#fef9c3', '#ca8a04', 'Southern Library Annex', 'Reading room stocked with Band 8.0 sample essays.'],
    [44, 48, '#ede9fe', '#7c3aed', 'Global Scholarship Center', 'Mock interview rooms for university admissions.'],
    [58, 18, '#ffedd5', '#ea580c', 'Sunrise Roastery', 'Artisan coffee stall overlooking the eastern beach.'],
    [56, -18, '#f1f5f9', '#334155', 'Oxford Press House', 'Publishing house for student debate transcripts.'],
    [36, -52, '#fef2f2', '#dc2626', 'Northern Red Barn', 'Countryside storytelling and pronunciation workshop.'],
    [-18, -56, '#ecfdf5', '#0d9488', 'Harbor Lighthouse Keep', 'Coastal beacon guiding ships around SpeakSharp Island.'],
    [-46, -44, '#fff7ed', '#f97316', 'Captain’s Dockhouse', 'Maritime history and travel English pavilion.'],
    [0, 14, '#f0fdf4', '#16a34a', 'Central Meadow Pavilion', 'Open-air green gazebo at the heart of the island.'],
  ];

  outerBuildings.forEach(([bx, bz, wall, roof, title, desc], idx) => {
    const bId: 'cafe' | 'debate' | 'ielts' | 'shop' =
      idx % 4 === 0 ? 'cafe' : idx % 4 === 1 ? 'ielts' : idx % 4 === 2 ? 'debate' : 'shop';
    register(`outer-${idx}`, title, desc, bx, bz, buildTownhouse(bx, bz, wall, roof, 4.2 + (idx % 3)), bId, 5.5);
  });

  // 4. 55+ Voxel Trees & Decorative Shrubs filling the island meadows!
  for (let i = 0; i < 56; i++) {
    const angle = (i / 56) * Math.PI * 2 + (i % 3) * 0.2;
    const rad = i % 2 === 0 ? 63 + (i % 5) * 3 : 33 + (i % 4) * 2.5;
    const tx = Math.cos(angle) * rad;
    const tz = Math.sin(angle) * rad;
    const col = i % 5 === 0 ? '#ec4899' : i % 3 === 0 ? '#16a34a' : i % 2 === 0 ? '#15803d' : '#65a30d';
    scene.add(buildVoxelTree(tx, tz, col, 0.85 + (i % 3) * 0.22));
  }

  // 5. 8 Sports Cars (Porsche GT3 RS!) racing along the outer & inner circuit roads!
  const carColors = ['#18181b', '#f5bd33', '#ef4444', '#2563eb', '#10b981', '#f97316', '#ffffff', '#a855f7'];
  carColors.forEach((c, idx) => {
    const car = buildVoxelSportsCar(c);
    scene.add(car);
    const isOuter = idx < 5;
    cars.push({
      mesh: car,
      radiusX: isOuter ? 49 : 22.2,
      radiusZ: isOuter ? 49 : 22.2,
      angle: (idx / carColors.length) * Math.PI * 2,
      speed: isOuter ? 0.0045 : -0.0055,
    });
  });

  return {
    groundTargets,
    landmarks,
    cars,
    hemiLight,
    sunLight,
  };
}
