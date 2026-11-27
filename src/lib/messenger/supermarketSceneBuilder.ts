import * as THREE from 'three';
import { addSupermarketRichDetails } from './supermarketDetailsBuilder';
import { createToonMaterialCache } from './perfOptimizer';

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const cr = Math.min(r, hw, hh);
  s.moveTo(-hw + cr, -hh);
  s.lineTo(hw - cr, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  s.lineTo(hw, hh - cr);
  s.quadraticCurveTo(hw, hh, hw - cr, hh);
  s.lineTo(-hw + cr, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  s.lineTo(-hw, -hh + cr);
  s.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  return s;
}

const marketBevelCache = new Map<string, THREE.BufferGeometry>();

export function createMarketBeveledBox(
  w: number,
  h: number,
  d: number,
  radius = 0.12,
  bevel = 0.028
): THREE.BufferGeometry {
  const isSmall = Math.max(w, h, d) <= 0.65;
  const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}_${radius.toFixed(2)}_${bevel.toFixed(3)}_${isSmall ? 1 : 2}`;
  const cached = marketBevelCache.get(key);
  if (cached) return cached;
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, d, radius), {
    depth: Math.max(0.02, h - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: isSmall ? 1 : 2,
    curveSegments: isSmall ? 4 : 6,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  geo.computeVertexNormals();
  geo.userData.__sharedCache = true;
  marketBevelCache.set(key, geo);
  return geo;
}

export function makeMarketCanvasTex(
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

function makeWarmTileFloorTex(): THREE.CanvasTexture {
  const tex = makeMarketCanvasTex(512, 512, (ctx) => {
    ctx.fillStyle = '#fbf8ef';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#f2f7f1';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillRect(256, 256, 256, 256);

    // Subtle terrazzo speckles
    const flecks = ['#dbe8de', '#e8dfd0', '#cde0d4', '#efe2c8'];
    let seed = 41;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 380; i++) {
      ctx.fillStyle = flecks[i % flecks.length];
      ctx.beginPath();
      ctx.arc(rand() * 512, rand() * 512, 1.2 + rand() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(130, 152, 138, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 8);
  return tex;
}

function makeWarmOakTex(): THREE.CanvasTexture {
  const tex = makeMarketCanvasTex(256, 256, (ctx) => {
    ctx.fillStyle = '#d1a472';
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 16) {
      ctx.fillStyle = x % 32 === 0 ? '#ddb384' : '#c69866';
      ctx.fillRect(x, 0, 13, 256);
      ctx.fillStyle = '#8b6340';
      ctx.fillRect(x + 13, 0, 3, 256);
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

function makeStripeAwningTex(c1: string, c2: string): THREE.CanvasTexture {
  return makeMarketCanvasTex(256, 128, (ctx) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? c1 : c2;
      ctx.fillRect(i * 32, 0, 32, 128);
    }
  });
}

export function makeMarketSignTex(
  title: string,
  subtitle: string,
  bg: string,
  fg: string,
  accent: string,
  badge?: string
): THREE.CanvasTexture {
  return makeMarketCanvasTex(512, 144, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 20);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(7, 7, w - 14, h - 14, 14);
    ctx.stroke();

    if (badge) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(22, 26, 84, 92, 16);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.font = '900 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge, 64, 74);
    }

    const tx = badge ? 124 : w / 2;
    ctx.textAlign = badge ? 'left' : 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fg;
    ctx.font = '900 40px system-ui, sans-serif';
    ctx.fillText(title, tx, 56);
    ctx.fillStyle = accent;
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(subtitle, tx, 102);
  });
}

function makeDairyCoolerTex(): THREE.CanvasTexture {
  return makeMarketCanvasTex(512, 320, (ctx, w, h) => {
    // Bright backlit dairy cooler interior
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, w, 46);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🥛 FRESH DAIRY · MILK · COLD JUICES', w / 2, 30);

    const rowColors = [
      ['#ffffff', '#38bdf8', '#ffffff', '#60a5fa', '#ffffff', '#38bdf8', '#ffffff', '#93c5fd'],
      ['#fb923c', '#facc15', '#4ade80', '#fb923c', '#facc15', '#ef4444', '#4ade80', '#fb923c'],
      ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#34d399'],
      ['#22c55e', '#38bdf8', '#f59e0b', '#ec4899', '#38bdf8', '#22c55e', '#f59e0b', '#60a5fa'],
    ];
    for (let r = 0; r < 4; r++) {
      const sy = 104 + r * 54;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(10, sy, w - 20, 6);
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = rowColors[r][c];
        ctx.beginPath();
        ctx.roundRect(22 + c * 60, sy - 38, 42, 38, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(15,23,42,0.22)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Subtle vertical glass door mullions
    ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
    for (let x = 128; x < w; x += 128) {
      ctx.fillRect(x - 3, 46, 6, h - 46);
    }
  });
}

function makeChalkboardTex(title: string, lines: Array<[string, string]>): THREE.CanvasTexture {
  return makeMarketCanvasTex(320, 220, (ctx, w, h) => {
    ctx.fillStyle = '#1f2d27';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4a24c';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#fde047';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 42);
    ctx.font = '700 17px system-ui, sans-serif';
    lines.forEach(([item, price], idx) => {
      const y = 84 + idx * 36;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(item, 24, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#86efac';
      ctx.fillText(price, w - 24, y);
    });
  });
}

function makePosScreenTex(): THREE.CanvasTexture {
  return makeMarketCanvasTex(256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FRESH MART POS', w / 2, 22);

    ctx.textAlign = 'left';
    ctx.font = '700 14px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Apples 1kg    $3.00', 14, 62);
    ctx.fillText('Croissant x2  $4.50', 14, 88);
    ctx.fillText('Fresh Milk    $2.80', 14, 114);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 134, w - 20, 44);
    ctx.fillStyle = '#4ade80';
    ctx.font = '900 22px monospace';
    ctx.fillText('TOTAL   $10.30', 18, 164);
  });
}

function makePromoEndcapTex(topText: string, subText: string): THREE.CanvasTexture {
  return makeMarketCanvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#fde047';
    ctx.font = '900 38px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(topText, w / 2, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText(subText, w / 2, 98);
  });
}

function makePendantLamp(
  shadeHex: number,
  toon: (h: number) => THREE.MeshToonMaterial,
  steelMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.8, 6), steelMat);
  cord.position.y = 0.9;
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.32, 14, 1, false),
    toon(shadeHex)
  );
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
  );
  bulb.position.y = -0.14;
  g.add(cord, shade, bulb);
  return g;
}

/**
 * Upgraded Studio-Ghibli / Abeto International Supermarket ("SpeakSharp Fresh Mart")!
 * Sculpted beveled counters, exposed oak ceiling beams & skylights, enamel pendant lamps,
 * wall-mounted illuminated dairy coolers, overflowing organic produce crates, artisan bakery
 * showcase & warm oven, stocked 4-tier grocery aisles with promo endcaps, animated checkout
 * conveyor + POS screen, flower boutique, deli/sushi bar, ice-cream freezer & shopping carts!
 */
export function buildStudioSupermarketScene(
  scene: THREE.Scene,
  toonGradient: THREE.DataTexture
): (elapsed: number) => void {
  const root = new THREE.Group();
  const toon = createToonMaterialCache(toonGradient);
  const oakTex = makeWarmOakTex();
  const oakMat = new THREE.MeshToonMaterial({ map: oakTex, gradientMap: toonGradient });
  const steelMat = toon(0x334155);
  const chromeMat = toon(0xcbd5e1);
  const darkGreenMat = toon(0x166534);
  const creamMat = toon(0xfef9ec);

  // =========================================================================
  // 1. SUNLIT SKY DOME + FLOOR + PROMENADE RUNNER + EXPOSED TIMBER ROOF
  // =========================================================================
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(85, 22, 14),
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

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 22),
    new THREE.MeshToonMaterial({ map: makeWarmTileFloorTex(), gradientMap: toonGradient })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Soft mint rounded central promenade carpet + warm wood mats under Produce & Bakery!
  const runnerGeo = new THREE.ShapeGeometry(roundedRectShape(2.4, 16.5, 0.8), 10);
  runnerGeo.rotateX(-Math.PI / 2);
  const runner = new THREE.Mesh(runnerGeo, new THREE.MeshBasicMaterial({ color: 0xdcfce7 }));
  runner.position.set(0, 0.012, 0.4);
  const crossGeo = new THREE.ShapeGeometry(roundedRectShape(19.5, 2.0, 0.75), 10);
  crossGeo.rotateX(-Math.PI / 2);
  const crossRunner = new THREE.Mesh(crossGeo, new THREE.MeshBasicMaterial({ color: 0xdcfce7 }));
  crossRunner.position.set(0, 0.011, -2.5);
  root.add(runner, crossRunner);

  // Exposed warm oak roof beams + frosted skylight canopy + glowing pendant lamps!
  for (let z = -8.5; z <= 8.5; z += 4.25) {
    const beam = new THREE.Mesh(createMarketBeveledBox(24.8, 0.28, 0.26, 0.05, 0.015), oakMat);
    beam.position.set(0, 5.75, z);
    root.add(beam);
  }
  const skylight = new THREE.Mesh(
    new THREE.PlaneGeometry(24.8, 20.4),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb, transparent: true, opacity: 0.26, side: THREE.DoubleSide })
  );
  skylight.rotation.x = Math.PI / 2;
  skylight.position.set(0, 6.08, 0);
  root.add(skylight);

  // Hanging enamel pendant lamps over hero zones
  [
    [-6.8, -4.4, 0x15803d],
    [7.2, -4.8, 0xd97706],
    [0, -0.5, 0x15803d],
    [0, 3.2, 0x15803d],
    [-5.4, 6.8, 0x0f766e],
  ].forEach(([lx, lz, col]) => {
    const lamp = makePendantLamp(col, toon, steelMat);
    lamp.position.set(lx, 4.15, lz);
    root.add(lamp);
  });

  // =========================================================================
  // 2. WAINSCOTED WALLS + DAIRY COOLERS + BAKERY OVEN + GLASS STOREFRONT
  // =========================================================================
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(25.4, 6.0, 0.48), creamMat);
  backWall.position.set(0, 3.0, -10.2);
  const backWainscot = new THREE.Mesh(new THREE.BoxGeometry(25.2, 1.4, 0.54), oakMat);
  backWainscot.position.set(0, 0.7, -10.2);
  const backTrim = new THREE.Mesh(new THREE.BoxGeometry(25.2, 0.16, 0.58), darkGreenMat);
  backTrim.position.set(0, 5.65, -10.2);
  root.add(backWall, backWainscot, backTrim);

  ([-12.4, 12.4] as const).forEach((wx) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.48, 6.0, 20.8), creamMat);
    wall.position.set(wx, 3.0, 0);
    const wainscot = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.4, 20.6), oakMat);
    wainscot.position.set(wx, 0.7, 0);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 20.6), darkGreenMat);
    trim.position.set(wx, 5.65, 0);
    root.add(wall, wainscot, trim);
  });

  // South Entrance Glass Storefront (z = +10.2)
  const southL = new THREE.Mesh(new THREE.BoxGeometry(8.8, 5.8, 0.45), creamMat);
  southL.position.set(-8.0, 2.9, 10.2);
  const southR = southL.clone();
  southR.position.x = 8.0;
  const southHeader = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.2, 0.5), darkGreenMat);
  southHeader.position.set(0, 4.7, 10.2);
  const doorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(7.0, 3.5),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
  );
  doorGlass.position.set(0, 1.75, 10.15);
  const exitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 1.35),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('FRESH MART', 'THANK YOU · SEE YOU AGAIN!', '#14532d', '#ffffff', '#facc15', '🛒'),
    })
  );
  exitSign.position.set(0, 4.65, 9.9);
  exitSign.rotation.y = Math.PI;
  root.add(southL, southR, southHeader, doorGlass, exitSign);

  // Giant Back-Wall Illuminated Banner + Wall-Mounted Refrigerated Dairy & Drink Coolers!
  const mainBannerFrame = new THREE.Mesh(createMarketBeveledBox(7.2, 1.48, 0.22, 0.1, 0.03), darkGreenMat);
  mainBannerFrame.position.set(0, 3.85, -9.85);
  const mainBannerFace = new THREE.Mesh(
    new THREE.PlaneGeometry(6.95, 1.35),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('FRESH MART', 'SPEAKSHARP ORGANIC SUPERMARKET', '#15803d', '#ffffff', '#facc15', '🌿'),
    })
  );
  mainBannerFace.position.set(0, 4.59, -9.7);
  root.add(mainBannerFrame, mainBannerFace);

  // Illuminated Glass-Door Dairy & Juice Cooler Cases along Back Wall!
  const coolerBody = new THREE.Mesh(createMarketBeveledBox(8.2, 2.95, 0.95, 0.1, 0.03), toon(0x1e293b));
  coolerBody.position.set(0, 0, -9.45);
  const coolerFront = new THREE.Mesh(
    new THREE.PlaneGeometry(7.9, 2.7),
    new THREE.MeshBasicMaterial({ map: makeDairyCoolerTex() })
  );
  coolerFront.position.set(0, 1.48, -8.92); // cleanly in front of beveled cooler housing!
  root.add(coolerBody, coolerFront);

  // Left-Back Chalkboard Produce Harvest Board
  const prodBoardFrame = new THREE.Mesh(createMarketBeveledBox(3.5, 2.15, 0.16, 0.06, 0.02), oakMat);
  prodBoardFrame.position.set(-7.6, 2.15, -9.88);
  const prodBoardFace = new THREE.Mesh(
    new THREE.PlaneGeometry(3.25, 1.95),
    new THREE.MeshBasicMaterial({
      map: makeChalkboardTex('🍎 TODAY’S HARVEST', [
        ['Organic Apples', '$3.00/kg'],
        ['Sweet Mangoes', '$2.50/kg'],
        ['Fresh Avocados', '$4.00/kg'],
        ['Baby Spinach', '$1.80/bag'],
      ]),
    })
  );
  prodBoardFace.position.set(-7.6, 3.22, -9.76);
  root.add(prodBoardFrame, prodBoardFace);

  // Right-Back Artisan Brick Bakery Oven & Warm Glowing Window
  const ovenBody = new THREE.Mesh(createMarketBeveledBox(3.6, 2.9, 1.1, 0.12, 0.03), toon(0xb45309));
  ovenBody.position.set(7.6, 0, -9.4);
  const ovenArch = new THREE.Mesh(createMarketBeveledBox(2.0, 1.05, 0.18, 0.14, 0.02), steelMat);
  ovenArch.position.set(7.6, 1.15, -8.84);
  const ovenGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.85),
    new THREE.MeshBasicMaterial({ color: 0xfdba74 })
  );
  ovenGlow.position.set(7.6, 1.68, -8.72);
  const bakeryBoardFace = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.6),
    new THREE.MeshBasicMaterial({
      map: makeChalkboardTex('🥐 BAKERY MENU', [
        ['Butter Croissant', '$2.25'],
        ['French Baguette', '$2.50'],
        ['Choco Muffin', '$2.00'],
        ['Berry Tart', '$3.50'],
      ]),
    })
  );
  bakeryBoardFace.position.set(7.6, 4.15, -9.82);
  root.add(ovenBody, ovenArch, ovenGlow, bakeryBoardFace);

  // =========================================================================
  // 3. ZONE 1: ORGANIC FRESH PRODUCE ISLAND (LEFT BACK — Clerk Emma)
  // =========================================================================
  const produceBase = new THREE.Mesh(createMarketBeveledBox(4.9, 0.88, 2.25, 0.24, 0.04), oakMat);
  produceBase.position.set(-6.8, 0, -4.4);
  produceBase.castShadow = true;
  produceBase.receiveShadow = true;
  const produceTrim = new THREE.Mesh(createMarketBeveledBox(5.06, 0.12, 2.4, 0.24, 0.025), darkGreenMat);
  produceTrim.position.set(-6.8, 0.84, -4.4);
  root.add(produceBase, produceTrim);

  // 4 Angled Slatted Wooden Crates overflowing with distinct 3D fruits & veggies!
  const produceConfigs = [
    { x: -8.55, col: 0xef4444, leaf: true, scale: [1, 1, 1] as const }, // Red apples
    { x: -7.4, col: 0xf97316, leaf: true, scale: [1, 0.95, 1] as const }, // Sweet oranges
    { x: -6.2, col: 0xfacc15, leaf: false, scale: [1.35, 0.72, 0.8] as const }, // Sweet mangoes
    { x: -5.05, col: 0x65a30d, leaf: false, scale: [1.15, 0.95, 1.15] as const }, // Fresh greens/avocados
  ];
  const leafMat = toon(0x22c55e);
  produceConfigs.forEach((cfg) => {
    const crate = new THREE.Mesh(createMarketBeveledBox(1.02, 0.26, 1.56, 0.06, 0.015), toon(0x8c6239));
    crate.position.set(cfg.x, 0.92, -4.4);
    crate.rotation.x = 0.08;
    root.add(crate);
    const fMat = toon(cfg.col);
    for (let f = 0; f < 6; f++) {
      const fx = cfg.x - 0.26 + (f % 2) * 0.52;
      const fz = -4.85 + Math.floor(f / 2) * 0.45;
      const fruit = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), fMat);
      fruit.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      fruit.position.set(fx, 1.24, fz);
      root.add(fruit);
      if (cfg.leaf) {
        const lf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.14), leafMat);
        lf.position.set(fx + 0.04, 1.4, fz);
        lf.rotation.z = 0.4;
        root.add(lf);
      }
    }
  });

  // Striped green-and-cream produce market canopy + hanging produce sign + eco scale!
  const prodCanopy = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.16, 2.55),
    new THREE.MeshToonMaterial({ map: makeStripeAwningTex('#15803d', '#fefce8'), gradientMap: toonGradient })
  );
  prodCanopy.position.set(-6.8, 2.78, -4.4);
  ([-9.0, -4.6] as const).forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.9, 8), darkGreenMat);
    post.position.set(px, 1.85, -4.4);
    root.add(post);
  });
  const produceSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.96, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('FRESH PRODUCE', 'RAU CỦ & TRÁI CÂY HỮU CƠ', '#14532d', '#ffffff', '#86efac', '🍎'),
    })
  );
  produceSign.position.set(-6.8, 3.55, -4.4);
  root.add(prodCanopy, produceSign);

  // =========================================================================
  // 4. ZONE 2: ARTISAN FRESH BAKERY COUNTER (RIGHT BACK — Baker Ken)
  // =========================================================================
  const bakeryBase = new THREE.Mesh(createMarketBeveledBox(4.9, 1.0, 1.55, 0.22, 0.04), oakMat);
  bakeryBase.position.set(7.2, 0, -4.8);
  bakeryBase.castShadow = true;
  const bakeryTop = new THREE.Mesh(createMarketBeveledBox(5.1, 0.12, 1.7, 0.22, 0.03), creamMat);
  bakeryTop.position.set(7.2, 0.98, -4.8);
  const glassCase = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.78, 1.05),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.3 })
  );
  glassCase.position.set(7.2, 1.48, -4.8);
  const bakeryAwning = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 0.18, 2.0),
    new THREE.MeshToonMaterial({ map: makeStripeAwningTex('#d97706', '#fffbeb'), gradientMap: toonGradient })
  );
  bakeryAwning.position.set(7.2, 2.82, -4.55);
  bakeryAwning.rotation.x = 0.2;
  const bakerySign = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.96, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('FRESH BAKERY', 'BÁNH NƯỚNG MỚI RA LÒ', '#7c2d12', '#fffbeb', '#fbbf24', '🥐'),
    })
  );
  bakerySign.position.set(7.2, 3.6, -4.8);
  root.add(bakeryBase, bakeryTop, glassCase, bakeryAwning, bakerySign);

  // Detailed Croissants, Baguettes & Strawberry Cake inside the Bakery Glass Showcase!
  for (let i = 0; i < 4; i++) {
    const croissant = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.055, 6, 10, Math.PI * 1.35), toon(0xd98a3c));
    croissant.rotation.x = Math.PI / 2;
    croissant.position.set(5.45 + i * 0.52, 1.2, -4.65);
    root.add(croissant);
  }
  for (let i = 0; i < 3; i++) {
    const baguette = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.44, 4, 8), toon(0xc27832));
    baguette.rotation.z = Math.PI / 2;
    baguette.rotation.y = 0.28;
    baguette.position.set(7.65 + i * 0.48, 1.2, -4.85);
    root.add(baguette);
  }
  // Frosted cake on pedestal stand
  const cakeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 0.18, 12), chromeMat);
  cakeStand.position.set(8.9, 1.18, -4.65);
  const cakeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 14), toon(0xfbcfe8));
  cakeBody.position.set(8.9, 1.38, -4.65);
  const cakeBerry = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), toon(0xef4444));
  cakeBerry.position.set(8.9, 1.52, -4.65);
  root.add(cakeStand, cakeBody, cakeBerry);

  // =========================================================================
  // 5. ZONE 3: STOCKED 4-TIER GROCERY GONDOLA AISLES + PROMO ENDCAPS!
  // =========================================================================
  const shelfBaseMat = toon(0xf1f5f9);
  const shelfDividerMat = toon(0x334155);
  const prodPalette = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981, 0xec4899, 0x8b5cf6, 0x06b6d4, 0xf97316];
  const endcapTex1 = makePromoEndcapTex('20% OFF!', 'ORANGE JUICE');
  const endcapTex2 = makePromoEndcapTex('NEW!', 'ORGANIC SNACKS');

  // Shared InstancedMesh batches for all 168 shelf products (cuts ~200 draw calls -> 3 draw calls!)
  const instBoxGeo = createMarketBeveledBox(0.28, 0.36, 0.44, 0.03, 0.008);
  const instBottleGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.36, 8);
  const instCapGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 6);
  const instMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGradient });
  const boxTransforms: Array<{ pos: [number, number, number]; col: number }> = [];
  const bottleTransforms: Array<{ pos: [number, number, number]; col: number }> = [];

  ([-3.0, 3.0] as const).forEach((sx, sIdx) => {
    const gondola = new THREE.Group();
    const base = new THREE.Mesh(createMarketBeveledBox(1.16, 0.26, 5.15, 0.1, 0.02), steelMat);
    base.castShadow = true;
    const spine = new THREE.Mesh(createMarketBeveledBox(0.14, 2.22, 5.0, 0.04, 0.015), shelfDividerMat);
    spine.position.y = 0.1;
    const topCap = new THREE.Mesh(createMarketBeveledBox(1.12, 0.1, 5.1, 0.08, 0.015), darkGreenMat);
    topCap.position.y = 2.22;
    gondola.add(base, spine, topCap);

    // 3 shelves per side with price rails + varied 3D boxes & bottles (batched via InstancedMesh!)
    const shelfGeo = new THREE.BoxGeometry(1.12, 0.05, 5.0);
    for (let row = 0; row < 3; row++) {
      const sy = 0.68 + row * 0.56;
      const shelf = new THREE.Mesh(shelfGeo, shelfBaseMat);
      shelf.position.y = sy;
      gondola.add(shelf);

      ([-0.34, 0.34] as const).forEach((sideX, sideI) => {
        for (let col = 0; col < 7; col++) {
          const pz = -2.1 + col * 0.7;
          const colHex = prodPalette[(row * 7 + col + sIdx * 3 + sideI * 2) % prodPalette.length];
          const isBottle = (row + col + sIdx) % 3 === 0;
          if (isBottle) {
            bottleTransforms.push({ pos: [sx + sideX, sy + 0.21, 0.8 + pz], col: colHex });
          } else {
            boxTransforms.push({ pos: [sx + sideX, sy + 0.03, 0.8 + pz], col: colHex });
          }
        }
      });
    }

    // Promotional Endcap Header facing South (right in view at spawn!)
    const endcapHeader = new THREE.Mesh(
      new THREE.PlaneGeometry(1.06, 0.54),
      new THREE.MeshBasicMaterial({ map: sIdx === 0 ? endcapTex1 : endcapTex2 })
    );
    endcapHeader.position.set(0, 2.02, 2.58);
    gondola.add(endcapHeader);

    gondola.position.set(sx, 0, 0.8);
    root.add(gondola);
  });

  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();
  if (boxTransforms.length > 0) {
    const boxesInst = new THREE.InstancedMesh(instBoxGeo, instMat, boxTransforms.length);
    boxTransforms.forEach((t, i) => {
      dummy.position.set(t.pos[0], t.pos[1], t.pos[2]);
      dummy.updateMatrix();
      boxesInst.setMatrixAt(i, dummy.matrix);
      boxesInst.setColorAt(i, tmpColor.setHex(t.col));
    });
    boxesInst.instanceMatrix.needsUpdate = true;
    if (boxesInst.instanceColor) boxesInst.instanceColor.needsUpdate = true;
    root.add(boxesInst);
  }
  if (bottleTransforms.length > 0) {
    const bottlesInst = new THREE.InstancedMesh(instBottleGeo, instMat, bottleTransforms.length);
    const capsInst = new THREE.InstancedMesh(instCapGeo, creamMat, bottleTransforms.length);
    bottleTransforms.forEach((t, i) => {
      dummy.position.set(t.pos[0], t.pos[1], t.pos[2]);
      dummy.updateMatrix();
      bottlesInst.setMatrixAt(i, dummy.matrix);
      bottlesInst.setColorAt(i, tmpColor.setHex(t.col));
      dummy.position.set(t.pos[0], t.pos[1] + 0.2, t.pos[2]);
      dummy.updateMatrix();
      capsInst.setMatrixAt(i, dummy.matrix);
    });
    bottlesInst.instanceMatrix.needsUpdate = true;
    if (bottlesInst.instanceColor) bottlesInst.instanceColor.needsUpdate = true;
    capsInst.instanceMatrix.needsUpdate = true;
    root.add(bottlesInst, capsInst);
  }

  // Hanging Aisle Overhead Sign
  const aisleSign = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.96, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('AISLE 1–2 · DRINKS', 'SỮA, NGŨ CỐC & ĐỒ ĂN VẶT', '#1d4ed8', '#ffffff', '#93c5fd', '🧃'),
    })
  );
  aisleSign.position.set(0, 3.65, 0.8);
  root.add(aisleSign);

  // =========================================================================
  // 6. ZONE 4: MODERN CHECKOUT LANE + ANIMATED CONVEYOR + POS SCREEN (Cashier Sophia)
  // =========================================================================
  const checkBase = new THREE.Mesh(createMarketBeveledBox(4.55, 0.98, 1.38, 0.2, 0.035), toon(0x0f766e));
  checkBase.position.set(-5.4, 0, 6.8);
  checkBase.castShadow = true;
  const checkTrim = new THREE.Mesh(createMarketBeveledBox(4.68, 0.1, 1.48, 0.2, 0.02), oakMat);
  checkTrim.position.set(-5.4, 0.95, 6.8);
  const checkBelt = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.06, 0.82), steelMat);
  checkBelt.position.set(-6.05, 1.06, 6.8);

  // Glowing barcode scanner + Swivel POS touchscreen + Card tap terminal!
  const scannerPad = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  scannerPad.rotation.x = -Math.PI / 2;
  scannerPad.position.set(-4.3, 1.07, 6.8);

  const posStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.34, 8), steelMat);
  posStand.position.set(-3.75, 1.22, 6.85);
  const posBody = new THREE.Mesh(createMarketBeveledBox(0.62, 0.44, 0.08, 0.03, 0.01), steelMat);
  posBody.position.set(-3.75, 1.24, 6.85);
  const posScr = new THREE.Mesh(
    new THREE.PlaneGeometry(0.54, 0.36),
    new THREE.MeshBasicMaterial({ map: makePosScreenTex() })
  );
  posScr.position.set(-3.75, 1.46, 6.8);
  posScr.rotation.y = Math.PI; // facing Cashier Sophia / North!

  // Illuminated Lane 1 OPEN beacon pole
  const lanePole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.2, 8), chromeMat);
  lanePole.position.set(-3.4, 2.1, 6.8);
  const laneBeacon = new THREE.Mesh(createMarketBeveledBox(0.46, 0.46, 0.46, 0.08, 0.02), toon(0x22c55e));
  laneBeacon.position.set(-3.4, 3.05, 6.8);

  const checkSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.92, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('CHECKOUT · LANE 1', 'QUẦY THANH TOÁN', '#0f766e', '#ffffff', '#5eead4', '💳'),
    })
  );
  checkSign.position.set(-5.4, 3.45, 6.8);
  root.add(checkBase, checkTrim, checkBelt, scannerPad, posStand, posBody, posScr, lanePole, laneBeacon, checkSign);

  // Animated grocery items sliding along the Checkout conveyor belt!
  const beltItem1 = new THREE.Mesh(createMarketBeveledBox(0.24, 0.32, 0.24, 0.03, 0.008), toon(0x38bdf8));
  beltItem1.position.set(-6.9, 1.09, 6.8);
  const beltItem2 = new THREE.Mesh(createMarketBeveledBox(0.3, 0.24, 0.22, 0.03, 0.008), toon(0xf59e0b));
  beltItem2.position.set(-5.9, 1.09, 6.8);
  const beltItem3 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), toon(0xef4444));
  beltItem3.position.set(-5.1, 1.2, 6.8);
  root.add(beltItem1, beltItem2, beltItem3);

  // =========================================================================
  // 7. RICH SUPERMARKET DETAILS (Carts, Flowers, Deli, Freezer, Sample Stand!)
  // =========================================================================
  const updateDetails = addSupermarketRichDetails(root, toon, oakMat, steelMat, chromeMat);

  scene.add(root);

  return (elapsed: number) => {
    updateDetails(elapsed);
    aisleSign.position.y = 3.65 + Math.sin(elapsed * 1.5) * 0.03;
    // Slide groceries smoothly along checkout conveyor belt!
    beltItem1.position.x = -7.2 + ((elapsed * 0.42) % 2.4);
    beltItem2.position.x = -7.2 + ((elapsed * 0.42 + 0.85) % 2.4);
    beltItem3.position.x = -7.2 + ((elapsed * 0.42 + 1.65) % 2.4);
  };
}
