import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { patchMaterialForInk } from './animeInkPass';
import { createToonMaterialCache } from './perfOptimizer';

// Enable ultra-fast BVH raycasting for solid 3D shelf & wall collisions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const smoothBoxCache = new Map<string, THREE.BufferGeometry>();
function smoothBox(w: number, h: number, d: number, r = 0.06): THREE.BufferGeometry {
  const cr = Math.min(r, w * 0.45, h * 0.45, d * 0.45);
  const segs = 2;
  const key = `wm_${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}_${cr.toFixed(3)}`;
  let geo = smoothBoxCache.get(key);
  if (!geo) {
    geo = new RoundedBoxGeometry(w, h, d, segs, cr);
    geo.translate(0, h / 2, 0);
    geo.userData.__sharedCache = true;
    smoothBoxCache.set(key, geo);
  }
  return geo;
}

function makeTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeWallCoolerFrontTex(headerTitle: string, headerBg: string, palette: string[][]): THREE.CanvasTexture {
  return makeTex(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = headerBg;
    ctx.fillRect(0, 0, w, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(headerTitle, w / 2, 30);

    for (let r = 0; r < 4; r++) {
      const sy = 104 + r * 54;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(10, sy, w - 20, 6);
      const row = palette[r % palette.length];
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = row[c % row.length];
        ctx.beginPath();
        ctx.roundRect(20 + c * 60, sy - 38, 44, 38, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(15,23,42,0.22)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    // Crisp glass door frames
    ctx.fillStyle = 'rgba(15,23,42,0.34)';
    for (let x = 128; x < w; x += 128) {
      ctx.fillRect(x - 3, 46, 6, h - 46);
    }
  });
}

function makeWallBakeryTex(): THREE.CanvasTexture {
  return makeTex(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, w, 48);
    ctx.fillStyle = '#fde68a';
    ctx.font = '900 23px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🥐 FRESH BAKERY · DELI & BENTO', w / 2, 32);

    const itemCols = ['#d97706', '#b45309', '#f59e0b', '#fb923c', '#ec4899', '#22c55e'];
    for (let r = 0; r < 3; r++) {
      const sy = 120 + r * 66;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(12, sy, w - 24, 8);
      for (let c = 0; c < 6; c++) {
        ctx.fillStyle = itemCols[(r * 2 + c) % itemCols.length];
        ctx.beginPath();
        ctx.roundRect(24 + c * 78, sy - 42, 60, 40, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(69,26,3,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  });
}

/**
 * Adds ONLY flush wall-mounted supermarket units (dairy/drink coolers & bakery/produce wall racks)
 * snapped tightly against the bare side walls of `supermarket.glb`, plus a complete
 * suspended ceiling LED lighting system casting warm supermarket light across the store!
 */
function addWallCountersAndLighting(
  root: THREE.Group,
  normBox: THREE.Box3,
  toonGradient: THREE.DataTexture,
  solidMeshes: THREE.Mesh[]
): void {
  const g = new THREE.Group();
  const toon = createToonMaterialCache(toonGradient);
  const frameMat = toon(0x1e293b);
  const oakMat = toon(0xcda070);
  const steelMat = toon(0x475569);
  const glowTubeMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

  const registerSolid = (mesh: THREE.Mesh) => {
    const geo = mesh.geometry as THREE.BufferGeometry & {
      computeBoundsTree?: () => void;
      boundsTree?: unknown;
    };
    if (geo.computeBoundsTree && !geo.boundsTree) geo.computeBoundsTree();
    solidMeshes.push(mesh);
    return mesh;
  };

  const dairyTex = makeWallCoolerFrontTex('🥛 FRESH DAIRY · COLD DRINKS', '#0369a1', [
    ['#ffffff', '#38bdf8', '#ffffff', '#60a5fa', '#ffffff', '#38bdf8', '#ffffff', '#93c5fd'],
    ['#fb923c', '#facc15', '#4ade80', '#fb923c', '#facc15', '#ef4444', '#4ade80', '#fb923c'],
    ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#34d399'],
  ]);
  const produceTex = makeWallCoolerFrontTex('🍎 FRESH PRODUCE · ORGANIC', '#15803d', [
    ['#ef4444', '#ef4444', '#f97316', '#f97316', '#facc15', '#facc15', '#84cc16', '#84cc16'],
    ['#22c55e', '#4ade80', '#ef4444', '#fb923c', '#facc15', '#22c55e', '#a855f7', '#4ade80'],
    ['#f97316', '#ef4444', '#84cc16', '#22c55e', '#facc15', '#f97316', '#ef4444', '#84cc16'],
  ]);
  const bakeryTex = makeWallBakeryTex();

  const makeWallUnit = (
    depthX: number,
    heightY: number,
    lengthZ: number,
    frontTex: THREE.CanvasTexture,
    bodyMat: THREE.Material,
    facingRight: boolean
  ) => {
    const unit = new THREE.Group();
    const body = registerSolid(new THREE.Mesh(smoothBox(depthX, heightY, lengthZ, 0.05), bodyMat));
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(lengthZ - 0.16, heightY - 0.22),
      new THREE.MeshBasicMaterial({ map: frontTex })
    );
    face.position.set(facingRight ? depthX / 2 + 0.015 : -(depthX / 2 + 0.015), heightY / 2, 0);
    face.rotation.y = facingRight ? Math.PI / 2 : -Math.PI / 2;

    // Warm LED under-valance light bar at top of each wall cooler!
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, lengthZ - 0.12), glowTubeMat);
    ledStrip.position.set(facingRight ? depthX / 2 + 0.04 : -(depthX / 2 + 0.04), heightY - 0.08, 0);
    unit.add(body, face, ledStrip);
    return unit;
  };

  // Flush wall-mounted counters along the bare LEFT wall (x = normBox.min.x)
  const leftWallX = normBox.min.x + 0.42;
  const wallUnitSpecs: Array<{ z: number; len: number; tex: THREE.CanvasTexture; mat: THREE.Material }> = [
    { z: -4.2, len: 3.6, tex: dairyTex, mat: frameMat },
    { z: -0.2, len: 3.6, tex: bakeryTex, mat: oakMat },
    { z: 3.8, len: 3.6, tex: produceTex, mat: frameMat },
  ];
  wallUnitSpecs.forEach((u) => {
    if (u.z - u.len / 2 > normBox.min.z + 0.4 && u.z + u.len / 2 < normBox.max.z - 0.4) {
      const unit = makeWallUnit(0.76, 2.35, u.len, u.tex, u.mat, true);
      unit.position.set(leftWallX, 0, u.z);
      g.add(unit);
    }
  });

  // =========================================================================
  // REAL SUPERMARKET CEILING LED LIGHTING SYSTEM (Fixtures + PointLights!)
  // =========================================================================
  const ceilingY = Math.max(3.1, normBox.max.y - 0.22);
  const lightPositions: Array<[number, number]> = [
    [-4.6, -3.5],
    [0.0, -3.5],
    [4.6, -3.5],
    [-4.6, 1.8],
    [0.0, 1.8],
    [4.6, 1.8],
  ];

  // Sleek linear ceiling LED light panels with suspension rods & glowing diffusers
  lightPositions.forEach(([lx, lz]) => {
    const fixture = new THREE.Group();
    const housing = new THREE.Mesh(smoothBox(0.42, 0.08, 2.4, 0.02), steelMat);
    housing.position.y = ceilingY;
    const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 2.28), glowTubeMat);
    diffuser.rotation.x = Math.PI / 2;
    diffuser.position.y = ceilingY - 0.005;
    ([-0.85, 0.85] as const).forEach((rz) => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), steelMat);
      rod.position.set(0, ceilingY + 0.16, rz);
      fixture.add(rod);
    });
    fixture.add(housing, diffuser);
    fixture.position.set(lx, 0, lz);
    g.add(fixture);
  });

  // 4 balanced warm-white PointLights casting inviting illumination from the ceiling fixtures!
  const lampLightCoords: Array<[number, number]> = [
    [-4.2, -3.2],
    [4.2, -3.2],
    [-4.2, 2.0],
    [4.2, 2.0],
  ];
  lampLightCoords.forEach(([lx, lz]) => {
    const pt = new THREE.PointLight(0xfff6e5, 1.35, 16, 1.4);
    pt.position.set(lx, ceilingY - 0.35, lz);
    g.add(pt);
  });

  // Patch materials for AnimeInkPass parity
  g.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    if (Array.isArray(m)) m.forEach(patchMaterialForInk);
    else patchMaterialForInk(m);
  });

  root.add(g);
}

/**
 * Loads the real 3D Supermarket GLB model (`/models/supermarket.glb`) into
 * Map 4 ("Siêu thị Fresh Mart"), adds flush wall-mounted coolers/counters along
 * the bare side wall, and installs a warm overhead ceiling LED lighting system.
 */
export function buildStudioSupermarketScene(
  scene: THREE.Scene,
  toonGradient: THREE.DataTexture
): (elapsed: number) => void {
  const root = new THREE.Group();
  root.name = 'SupermarketGlbRoot';

  // Soft sunlit Studio-Ghibli sky dome surrounding the supermarket
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(90, 20, 14),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x38bdf8) },
        midColor: { value: new THREE.Color(0xbae6fd) },
        horizonColor: { value: new THREE.Color(0xfef3c7) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        varying vec3 vPos;
        void main() {
          float h = clamp(vPos.y, 0.0, 1.0);
          vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.25, h));
          col = mix(col, topColor, smoothstep(0.24, 0.72, h));
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `,
    })
  );
  skyDome.name = 'SkyDome';
  root.add(skyDome);

  // Subtle safety ground plane beneath the GLB so player never floats over void while loading
  const safetyFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshToonMaterial({ color: 0xf4f1e6 })
  );
  safetyFloor.rotation.x = -Math.PI / 2;
  safetyFloor.position.y = -0.02;
  safetyFloor.receiveShadow = true;
  root.add(safetyFloor);

  // Load `/models/supermarket.glb` asynchronously via GLTFLoader (+ Draco support)
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  loader.setDRACOLoader(draco);

  let disposed = false;
  loader.load(
    '/models/supermarket.glb',
    (gltf) => {
      if (disposed || !root.parent) {
        draco.dispose();
        return;
      }
      const model = gltf.scene;
      model.updateMatrixWorld(true);

      // Compute raw bounding box and normalize to realistic human-scale supermarket (~19.5m x 15.2m)
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const rawCenter = rawBox.getCenter(new THREE.Vector3());
      const maxHoriz = Math.max(rawSize.x, rawSize.z, 0.001);
      const targetSpan = 19.5;
      const scale = targetSpan / maxHoriz;

      model.scale.setScalar(scale);
      model.position.set(
        -rawCenter.x * scale,
        -rawBox.min.y * scale,
        -rawCenter.z * scale
      );
      model.updateMatrixWorld(true);

      // Patch all materials for sRGB parity inside AnimeInkPass & collect solid collision meshes!
      const solidMeshes: THREE.Mesh[] = [];
      const tmpBox = new THREE.Box3();
      model.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (mat) {
          const list = Array.isArray(mat) ? mat : [mat];
          for (const m of list) {
            patchMaterialForInk(m);
          }
        }
        // Build BVH for any mesh spanning player body height (0.25m..1.85m) -> real shelf/wall collision!
        tmpBox.setFromObject(mesh);
        if (tmpBox.max.y > 0.25 && tmpBox.min.y < 1.85) {
          const geo = mesh.geometry as THREE.BufferGeometry & {
            computeBoundsTree?: () => void;
            boundsTree?: unknown;
          };
          if (geo.computeBoundsTree && !geo.boundsTree) {
            geo.computeBoundsTree();
          }
          solidMeshes.push(mesh);
        }
      });

      root.add(model);
      draco.dispose();

      const normBox = new THREE.Box3().setFromObject(model);
      const normSize = normBox.getSize(new THREE.Vector3());

      // Add ONLY flush wall-mounted counters along the bare side wall + ceiling LED lighting!
      addWallCountersAndLighting(root, normBox, toonGradient, solidMeshes);

      // Auto-fit walkable interior bounds right up to the real 3D walls (0.65m wall thickness margin)
      const wallMargin = 0.65;
      scene.userData.autoBounds = {
        minX: normBox.min.x + wallMargin,
        maxX: normBox.max.x - wallMargin,
        minZ: normBox.min.z + wallMargin,
        maxZ: normBox.max.z - wallMargin,
      };
      scene.userData.solidMeshes = solidMeshes;
      console.info(
        `[FreshMart GLB] Loaded! solidMeshes=${solidMeshes.length} raw=(${rawSize.x.toFixed(1)}, ${rawSize.y.toFixed(1)}, ${rawSize.z.toFixed(1)}) -> norm=(${normSize.x.toFixed(1)}, ${normSize.y.toFixed(1)}, ${normSize.z.toFixed(1)})`
      );
    },
    undefined,
    (err) => {
      console.error('[FreshMart GLB] Failed to load /models/supermarket.glb:', err);
      draco.dispose();
    }
  );

  scene.add(root);

  return (_elapsed: number) => {
    if (!root.parent) disposed = true;
  };
}
