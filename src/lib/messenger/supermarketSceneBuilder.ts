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
function smoothBox(w: number, h: number, d: number, r = 0.08): THREE.BufferGeometry {
  const cr = Math.min(r, w * 0.45, h * 0.45, d * 0.45);
  const segs = Math.max(w, h, d) <= 0.7 ? 2 : 3;
  const key = `sm_${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}_${cr.toFixed(3)}_${segs}`;
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

function makeSignTex(title: string, sub: string, bg: string, fg: string, accent: string): THREE.CanvasTexture {
  return makeTex(512, 144, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 12);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fg;
    ctx.font = '900 42px system-ui, sans-serif';
    ctx.fillText(title, w / 2, 54);
    ctx.fillStyle = accent;
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(sub, w / 2, 102);
  });
}

function makeStripeTex(c1: string, c2: string): THREE.CanvasTexture {
  return makeTex(256, 128, (ctx) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? c1 : c2;
      ctx.fillRect(i * 32, 0, 32, 128);
    }
  });
}

/**
 * Adds rich artisanal supermarket stalls, promo islands, bakery showcase, flower corner,
 * ice-cream freezer, shopping carts & hanging signs inside the open bare-tile zones of supermarket.glb!
 */
function buildExtraMarketStalls(
  toonGradient: THREE.DataTexture
): { group: THREE.Group; collidable: THREE.Mesh[] } {
  const g = new THREE.Group();
  const collidable: THREE.Mesh[] = [];
  const toon = createToonMaterialCache(toonGradient);
  const oakMat = toon(0xcda070);
  const darkGreenMat = toon(0x166534);
  const creamMat = toon(0xfef9ec);
  const steelMat = toon(0x334155);
  const chromeMat = toon(0xcbd5e1);

  const addSolid = (mesh: THREE.Mesh) => {
    const geo = mesh.geometry as THREE.BufferGeometry & {
      computeBoundsTree?: () => void;
      boundsTree?: unknown;
    };
    if (geo.computeBoundsTree && !geo.boundsTree) geo.computeBoundsTree();
    collidable.push(mesh);
    return mesh;
  };

  // 1. FRESH ORGANIC PRODUCE STALL (Front-Left Open Plaza)
  const produce = new THREE.Group();
  const pBase = addSolid(new THREE.Mesh(smoothBox(3.4, 0.86, 1.55, 0.14), oakMat));
  const pTrim = new THREE.Mesh(smoothBox(3.52, 0.1, 1.66, 0.12), darkGreenMat);
  pTrim.position.y = 0.82;
  produce.add(pBase, pTrim);

  const fruitCols = [0xef4444, 0xf97316, 0xfacc15, 0x65a30d];
  fruitCols.forEach((col, ci) => {
    const cx = -1.14 + ci * 0.76;
    const crate = new THREE.Mesh(smoothBox(0.66, 0.22, 1.12, 0.04), toon(0x8c6239));
    crate.position.set(cx, 0.88, 0);
    crate.rotation.x = 0.08;
    produce.add(crate);
    const fMat = toon(col);
    for (let f = 0; f < 6; f++) {
      const fruit = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), fMat);
      fruit.position.set(cx - 0.16 + (f % 2) * 0.32, 1.14, -0.34 + Math.floor(f / 2) * 0.34);
      produce.add(fruit);
    }
  });
  const pAwning = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.14, 1.85),
    new THREE.MeshToonMaterial({ map: makeStripeTex('#15803d', '#fefce8'), gradientMap: toonGradient })
  );
  pAwning.position.set(0, 2.48, 0);
  ([-1.55, 1.55] as const).forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.65, 8), darkGreenMat);
    post.position.set(px, 1.66, 0);
    produce.add(post);
  });
  const pSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.72, 0.1),
    new THREE.MeshBasicMaterial({
      map: makeSignTex('🍎 FRESH PRODUCE', 'RAU CỦ & TRÁI CÂY TƯƠI', '#14532d', '#ffffff', '#86efac'),
    })
  );
  pSign.position.set(0, 2.95, 0);
  produce.add(pAwning, pSign);
  produce.position.set(-6.4, 0, 5.2);
  g.add(produce);

  // 2. ARTISAN BAKERY & PASTRY SHOWCASE (Front-Right Open Plaza)
  const bakery = new THREE.Group();
  const bBase = addSolid(new THREE.Mesh(smoothBox(3.4, 0.94, 1.35, 0.14), oakMat));
  const bTop = new THREE.Mesh(smoothBox(3.52, 0.1, 1.46, 0.12), creamMat);
  bTop.position.y = 0.92;
  const bGlass = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.64, 0.9),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.32 })
  );
  bGlass.position.set(0, 1.34, 0);
  for (let i = 0; i < 4; i++) {
    const croissant = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 6, 10, Math.PI * 1.35), toon(0xd98a3c));
    croissant.rotation.x = Math.PI / 2;
    croissant.position.set(-1.15 + i * 0.42, 1.12, 0.1);
    bakery.add(croissant);
  }
  const cakeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.13, 0.14, 10), chromeMat);
  cakeStand.position.set(0.95, 1.1, 0);
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12), toon(0xfbcfe8));
  cake.position.set(0.95, 1.26, 0);
  const berry = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), toon(0xef4444));
  berry.position.set(0.95, 1.39, 0);
  const bAwning = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.14, 1.65),
    new THREE.MeshToonMaterial({ map: makeStripeTex('#d97706', '#fffbeb'), gradientMap: toonGradient })
  );
  bAwning.position.set(0, 2.52, 0.12);
  bAwning.rotation.x = 0.18;
  const bSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.72, 0.1),
    new THREE.MeshBasicMaterial({
      map: makeSignTex('🥐 FRESH BAKERY', 'BÁNH NƯỚNG MỚI RA LÒ', '#7c2d12', '#fffbeb', '#fbbf24'),
    })
  );
  bSign.position.set(0, 3.0, 0);
  bakery.add(bBase, bTop, bGlass, cakeStand, cake, berry, bAwning, bSign);
  bakery.position.set(6.2, 0, 5.2);
  g.add(bakery);

  // 3. DUAL PROMO DISPLAY ISLANDS (Flanking Entrance Walkway — 20% OFF & NEW!)
  const promoConfigs = [
    { x: -2.2, z: 5.5, title: '🔥 20% OFF!', sub: 'SNACKS & JUICE', bg: '#dc2626', ac: '#fde047', cols: [0xf97316, 0xfacc15, 0xef4444] },
    { x: 2.2, z: 5.5, title: '✨ NEW!', sub: 'ORGANIC DRINKS', bg: '#0284c7', ac: '#bae6fd', cols: [0x22c55e, 0x38bdf8, 0xa855f7] },
  ];
  promoConfigs.forEach((p) => {
    const pg = new THREE.Group();
    const ped = addSolid(new THREE.Mesh(smoothBox(1.25, 0.78, 1.05, 0.12), creamMat));
    const rim = new THREE.Mesh(smoothBox(1.32, 0.1, 1.12, 0.1), toon(p.cols[0]));
    rim.position.y = 0.72;
    pg.add(ped, rim);
    // Stacked colorful promo boxes & cans
    for (let i = 0; i < 6; i++) {
      const box = new THREE.Mesh(smoothBox(0.26, 0.32, 0.26, 0.03), toon(p.cols[i % 3]));
      box.position.set(-0.34 + (i % 3) * 0.34, 0.82, -0.2 + Math.floor(i / 3) * 0.4);
      pg.add(box);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), chromeMat);
    pole.position.set(0, 1.25, -0.25);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.48, 0.06),
      new THREE.MeshBasicMaterial({ map: makeSignTex(p.title, p.sub, p.bg, '#ffffff', p.ac) })
    );
    sign.position.set(0, 1.82, -0.25);
    pg.add(pole, sign);
    pg.position.set(p.x, 0, p.z);
    g.add(pg);
  });

  // 4. FRESH FLOWERS BOUTIQUE STAND (Left Wall)
  const flowers = new THREE.Group();
  const f1 = addSolid(new THREE.Mesh(smoothBox(0.95, 0.54, 2.6, 0.08), oakMat));
  const f2 = new THREE.Mesh(smoothBox(0.55, 0.96, 2.5, 0.08), oakMat);
  f2.position.set(-0.2, 0, 0);
  flowers.add(f1, f2);
  const bloomCols = [0xf43f5e, 0xfacc15, 0xec4899, 0xa855f7, 0xfb923c];
  for (let i = 0; i < 5; i++) {
    const fz = -1.0 + i * 0.5;
    const isTop = i % 2 === 1;
    const fx = isTop ? -0.18 : 0.2;
    const fy = isTop ? 0.96 : 0.54;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 8), toon(0xc26d3a));
    pot.position.set(fx, fy + 0.1, fz);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), toon(0x16a34a));
    bush.position.set(fx, fy + 0.3, fz);
    const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), toon(bloomCols[i]));
    bloom.position.set(fx + 0.04, fy + 0.44, fz);
    flowers.add(pot, bush, bloom);
  }
  const fSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.58, 0.08),
    new THREE.MeshBasicMaterial({
      map: makeSignTex('💐 FRESH FLOWERS', 'HOA TƯƠI MỖI NGÀY', '#be185d', '#ffffff', '#fbcfe8'),
    })
  );
  fSign.position.set(-0.2, 2.15, 0);
  fSign.rotation.y = Math.PI / 2;
  flowers.add(fSign);
  flowers.position.set(-8.6, 0, 2.2);
  g.add(flowers);

  // 5. CHILLED ICE-CREAM & GELATO CHEST FREEZER (Right Side)
  const freezer = new THREE.Group();
  const frBody = addSolid(new THREE.Mesh(smoothBox(1.05, 0.88, 2.8, 0.1), toon(0x0284c7)));
  const frGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.84, 2.55),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45 })
  );
  frGlass.rotation.x = -Math.PI / 2;
  frGlass.position.y = 0.89;
  const iceCols = [0xfbcfe8, 0xfef08a, 0x86efac, 0x93c5fd, 0xfdba74];
  for (let i = 0; i < 5; i++) {
    const tub = new THREE.Mesh(smoothBox(0.46, 0.2, 0.36, 0.04), toon(iceCols[i]));
    tub.position.set(0, 0.62, -0.96 + i * 0.48);
    freezer.add(tub);
  }
  const frSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.58, 0.08),
    new THREE.MeshBasicMaterial({
      map: makeSignTex('🍦 ICE CREAM', 'KEM TƯƠI & ĐỒ LẠNH', '#0369a1', '#ffffff', '#7dd3fc'),
    })
  );
  frSign.position.set(0.2, 2.1, 0);
  frSign.rotation.y = -Math.PI / 2;
  freezer.add(frBody, frGlass, frSign);
  freezer.position.set(8.4, 0, 1.8);
  g.add(freezer);

  // 6. LOADED SHOPPING CART & GREEN BASKET STACK (Near Entrance!)
  const cart = new THREE.Group();
  const cDeck = addSolid(new THREE.Mesh(smoothBox(0.62, 0.06, 0.88, 0.04), chromeMat));
  cDeck.position.y = 0.12;
  const cBasket = new THREE.Mesh(
    smoothBox(0.66, 0.42, 0.84, 0.06),
    new THREE.MeshToonMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.72, gradientMap: toonGradient })
  );
  cBasket.position.y = 0.42;
  const cRim = new THREE.Mesh(smoothBox(0.7, 0.06, 0.88, 0.05), toon(0xef4444));
  cRim.position.y = 0.82;
  const cHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.66, 8), toon(0xef4444));
  cHandle.rotation.z = Math.PI / 2;
  cHandle.position.set(0, 0.92, 0.44);
  const cMilk = new THREE.Mesh(smoothBox(0.18, 0.32, 0.18, 0.02), toon(0x38bdf8));
  cMilk.position.set(-0.12, 0.52, -0.1);
  const cBag = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.38, 4, 8), toon(0xd98a3c));
  cBag.rotation.z = -0.35;
  cBag.position.set(0.1, 0.78, 0.08);
  cart.add(cDeck, cBasket, cRim, cHandle, cMilk, cBag);
  cart.position.set(2.0, 0, 3.6);
  cart.rotation.y = -0.5;
  g.add(cart);

  // Stack of green shopping baskets
  const bStack = new THREE.Group();
  for (let b = 0; b < 5; b++) {
    const bk = new THREE.Mesh(smoothBox(0.5, 0.16, 0.36, 0.05), toon(b % 2 === 0 ? 0x16a34a : 0x22c55e));
    bk.position.y = 0.04 + b * 0.13;
    if (b === 0) addSolid(bk);
    bStack.add(bk);
  }
  bStack.position.set(-2.0, 0, 3.8);
  g.add(bStack);

  // 7. HANGING OVERHEAD AISLE SIGN
  const ohSign = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.82, 0.1),
    new THREE.MeshBasicMaterial({
      map: makeSignTex('🛒 FRESH MART · AISLES', '← PRODUCE  ·  DRINKS  ·  BAKERY →', '#15803d', '#ffffff', '#facc15'),
    })
  );
  ohSign.position.set(0, 3.45, 2.2);
  ([-1.8, 1.8] as const).forEach((rx) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), steelMat);
    rod.position.set(rx, 4.5, 2.2);
    g.add(rod);
  });
  g.add(ohSign);

  // Patch every extra stall material for AnimeInkPass
  g.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m) return;
    if (Array.isArray(m)) m.forEach(patchMaterialForInk);
    else patchMaterialForInk(m);
  });

  return { group: g, collidable };
}

/**
 * Loads the real 3D Supermarket GLB model (`/models/supermarket.glb`) into
 * Map 4 ("Siêu thị Fresh Mart") AND enriches its open plazas with artisanal
 * Produce, Bakery, Flowers, Ice Cream, Promo Islands & Shopping Carts!
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

  // Bright warm supermarket ceiling fill lighting so every stocked shelf pops!
  const storeFill = new THREE.PointLight(0xfffbeb, 1.4, 34, 1.1);
  storeFill.position.set(0, 5.5, 0);
  root.add(storeFill);

  // Subtle safety ground plane beneath the GLB so player never floats over void while loading
  const safetyFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshToonMaterial({ color: 0xf4f1e6 })
  );
  safetyFloor.rotation.x = -Math.PI / 2;
  safetyFloor.position.y = -0.02;
  safetyFloor.receiveShadow = true;
  root.add(safetyFloor);

  // Add rich artisanal counters & promo islands in the open plazas of the GLB!
  const extra = buildExtraMarketStalls(toonGradient);
  root.add(extra.group);
  scene.userData.solidMeshes = [...extra.collidable];

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
      const solidMeshes: THREE.Mesh[] = [...extra.collidable];
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
