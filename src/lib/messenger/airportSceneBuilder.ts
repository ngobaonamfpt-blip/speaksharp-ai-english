import * as THREE from 'three';
import { addAirportRichDetails } from './airportDetailsBuilder';
import { createToonMaterialCache } from './perfOptimizer';

/** Rounded-rectangle 2D shape centered at (0,0) for sleek beveled architectural furniture */
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

const airportBevelCache = new Map<string, THREE.BufferGeometry>();

/** Extruded rounded architectural block standing upright along Y (eliminates raw sharp boxes!) */
function createBeveledBlock(
  w: number,
  h: number,
  d: number,
  radius = 0.14,
  bevel = 0.03
): THREE.BufferGeometry {
  const isSmall = Math.max(w, h, d) <= 0.7;
  const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}_${radius.toFixed(2)}_${bevel.toFixed(3)}_${isSmall ? 1 : 2}`;
  const cached = airportBevelCache.get(key);
  if (cached) return cached;
  const shape = roundedRectShape(w, d, radius);
  const geo = new THREE.ExtrudeGeometry(shape, {
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
  airportBevelCache.set(key, geo);
  return geo;
}

function makeTerrazzoFloorTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f6f3ea';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle warm limestone & cream alternating large-format slabs
  ctx.fillStyle = '#efeadd';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillRect(256, 256, 256, 256);

  // Soft terrazzo mineral flecks
  const flecks = ['#d8d0c0', '#c4d2dc', '#e5d5b7', '#b6c5cf', '#e8dfd1'];
  let seed = 77;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 520; i++) {
    ctx.fillStyle = flecks[i % flecks.length];
    const x = rand() * 512;
    const y = rand() * 512;
    const sz = 1.2 + rand() * 2.8;
    ctx.beginPath();
    ctx.arc(x, y, sz * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crisp subtle architectural grout seams
  ctx.strokeStyle = 'rgba(120, 134, 146, 0.22)';
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

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 8);
  tex.needsUpdate = true;
  return tex;
}

function makeWoodSlatTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#cda276';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? '#dab287' : '#c29669';
    ctx.fillRect(x, 0, 13, 256);
    ctx.fillStyle = '#7a583b';
    ctx.fillRect(x + 13, 0, 3, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  tex.needsUpdate = true;
  return tex;
}

function makeAwningStripeTexture(c1: string, c2: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = (x / 32) % 2 === 0 ? c1 : c2;
    ctx.fillRect(x, 0, 32, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(2.5, 1);
  tex.needsUpdate = true;
  return tex;
}

function makeAirportSignTexture(
  title: string,
  subtitle: string,
  bg: string,
  fg: string,
  accent: string,
  icon = ''
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 180;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 640, 180);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 20, 180);
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 620, 160);

  ctx.fillStyle = fg;
  ctx.font = '900 46px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon ? `${icon}  ${title}` : title, 328, 72);

  ctx.fillStyle = accent;
  ctx.font = '700 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, 328, 130);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeDepartureBoardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 768, 384);

  ctx.fillStyle = '#f5bd33';
  ctx.fillRect(0, 0, 768, 66);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 30px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('✈  DEPARTURES · CHUYẾN BAY QUỐC TẾ', 24, 34);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 18px monospace';
  ctx.fillText('FLIGHT', 24, 92);
  ctx.fillText('DESTINATION', 148, 92);
  ctx.fillText('GATE', 435, 92);
  ctx.fillText('STATUS', 550, 92);

  const rows = [
    ['VN 204', 'HUE → HO CHI MINH', 'B08', 'ON TIME', '#4ade80'],
    ['JL 752', 'HUE → TOKYO', 'B12', 'BOARDING', '#facc15'],
    ['SQ 183', 'HUE → SINGAPORE', 'A04', 'CHECK-IN', '#38bdf8'],
    ['KE 462', 'HUE → SEOUL', 'B15', 'ON TIME', '#4ade80'],
    ['BA 016', 'HUE → LONDON', 'B10', 'ON TIME', '#4ade80'],
  ];
  rows.forEach((r, idx) => {
    const y = 136 + idx * 48;
    ctx.fillStyle = idx % 2 === 0 ? '#1e293b' : '#131d31';
    ctx.fillRect(14, y - 22, 740, 42);
    ctx.font = '800 22px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(r[0], 24, y);
    ctx.fillText(r[1], 148, y);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(r[2], 442, y);
    ctx.fillStyle = r[4];
    ctx.fillText(r[3], 550, y);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeXrayScreenTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0c192c';
  ctx.fillRect(0, 0, 256, 192);
  // X-ray suitcase outline
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 34, 200, 124);
  // Orange organic items + cyan electronics silhouette
  ctx.fillStyle = 'rgba(251, 146, 60, 0.72)';
  ctx.fillRect(46, 52, 74, 86);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.fillRect(134, 56, 78, 52);
  ctx.fillStyle = '#4ade80';
  ctx.font = '900 16px monospace';
  ctx.fillText('SCAN OK · CLEAR', 54, 178);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeCafeMenuTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#232f38';
  ctx.fillRect(0, 0, 384, 256);
  ctx.strokeStyle = '#d4a24c';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 368, 240);
  ctx.fillStyle = '#fde68a';
  ctx.font = '900 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('☕ SKY CAFÉ MENU', 192, 48);
  ctx.textAlign = 'left';
  ctx.font = '700 20px system-ui, sans-serif';
  const items = [
    ['Iced Latte', '$4.50'],
    ['Matcha Cream', '$4.80'],
    ['Butter Croissant', '$3.20'],
    ['Fresh Juice', '$3.90'],
  ];
  items.forEach(([name, price], i) => {
    const y = 96 + i * 38;
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(name, 34, y);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(price, 286, y);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeTravelPosterTexture(
  city: string,
  sub: string,
  skyTop: string,
  skyBot: string,
  accent: string
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 384);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 384);

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(128, 165, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 280);
  ctx.quadraticCurveTo(80, 220, 160, 265);
  ctx.quadraticCurveTo(210, 290, 256, 250);
  ctx.lineTo(256, 384);
  ctx.lineTo(0, 384);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(city, 128, 72);
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText(sub, 128, 340);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeAirplaneWindowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 74, 512, 16);
  ctx.fillStyle = '#f5bd33';
  ctx.fillRect(0, 90, 512, 6);
  ctx.fillStyle = '#1e293b';
  for (let x = 44; x < 460; x += 28) {
    ctx.beginPath();
    ctx.roundRect(x, 42, 14, 20, 6);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Build a smooth, aerodynamic LatheGeometry + swept-wing anime passenger jetliner! */
function buildSleekAirliner(
  toon: (hex: number) => THREE.MeshToonMaterial,
  windowTex: THREE.CanvasTexture
): { group: THREE.Group; navLights: THREE.Mesh[] } {
  const plane = new THREE.Group();
  const bodyMat = new THREE.MeshToonMaterial({ map: windowTex, color: 0xffffff });
  const whiteMat = toon(0xfffdf8);
  const wingMat = toon(0xe6ecf2);
  const blueMat = toon(0x2563eb);
  const goldMat = toon(0xf5bd33);
  const darkMat = toon(0x1e293b);

  // Smooth aerodynamic fuselage via LatheGeometry (seamless nose -> cabin -> tapered tail!)
  const fusePts = [
    new THREE.Vector2(0.0, -9.2),
    new THREE.Vector2(0.32, -8.2),
    new THREE.Vector2(0.75, -6.4),
    new THREE.Vector2(1.06, -4.6),
    new THREE.Vector2(1.08, 4.4),
    new THREE.Vector2(0.92, 5.7),
    new THREE.Vector2(0.56, 6.7),
    new THREE.Vector2(0.18, 7.35),
    new THREE.Vector2(0.0, 7.5),
  ];
  const fuseGeo = new THREE.LatheGeometry(fusePts, 24);
  fuseGeo.rotateZ(-Math.PI / 2);
  const fuselage = new THREE.Mesh(fuseGeo, whiteMat);
  fuselage.castShadow = true;

  // Cabin window wrap band cleanly hugging the cylindrical mid-section
  const cabinBand = new THREE.Mesh(
    new THREE.CylinderGeometry(1.09, 1.09, 8.8, 24, 1, true),
    bodyMat
  );
  cabinBand.rotation.z = Math.PI / 2;

  // Sleek wrap-around dark cockpit windshield
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 16, 12, -0.75, 1.5, 0.62, 0.48),
    darkMat
  );
  cockpit.scale.set(1.55, 0.94, 1.02);
  cockpit.position.set(5.4, 0.24, 0);

  // Tapered swept wings via ExtrudeGeometry!
  const navLights: THREE.Mesh[] = [];
  ([-1, 1] as const).forEach((side) => {
    const wShape = new THREE.Shape();
    wShape.moveTo(2.0, 0);
    wShape.lineTo(-1.4, 0);
    wShape.lineTo(-3.4, 6.8);
    wShape.lineTo(-2.1, 6.8);
    wShape.closePath();
    const wGeo = new THREE.ExtrudeGeometry(wShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    wGeo.rotateX(side === 1 ? Math.PI / 2 : -Math.PI / 2);
    const wing = new THREE.Mesh(wGeo, wingMat);
    wing.position.set(0.5, -0.32, side * 0.85);
    wing.castShadow = true;

    // Upturned curved winglet
    const winglet = new THREE.Mesh(createBeveledBlock(0.95, 1.15, 0.14, 0.06, 0.02), blueMat);
    winglet.position.set(-2.25, -0.28, side * 7.6);
    winglet.rotation.x = side * -0.28;

    // Blinking wingtip navigation light (red port / green starboard!)
    const navLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: side === -1 ? 0xef4444 : 0x22c55e })
    );
    navLight.position.set(-2.3, 0.85, side * 7.75);
    navLights.push(navLight);

    // Sculpted under-wing turbofan engine nacelle
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.39, 1.85, 16), whiteMat);
    engine.rotation.z = Math.PI / 2;
    engine.position.set(0.85, -0.82, side * 3.1);
    const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.14, 16), darkMat);
    intake.rotation.z = Math.PI / 2;
    intake.position.set(1.74, -0.82, side * 3.1);
    const engRing = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.24, 16), blueMat);
    engRing.rotation.z = Math.PI / 2;
    engRing.position.set(1.4, -0.82, side * 3.1);

    // Tapered horizontal tailplane
    const hTail = new THREE.Mesh(createBeveledBlock(1.25, 0.14, 2.6, 0.08, 0.02), wingMat);
    hTail.position.set(-7.3, 0.2, side * 1.45);
    hTail.rotation.y = side * -0.35;

    plane.add(wing, winglet, navLight, engine, intake, engRing, hTail);
  });

  // Swept vertical tail fin with beveled edges + gold emblem
  const vTailShape = new THREE.Shape();
  vTailShape.moveTo(0, 0);
  vTailShape.lineTo(2.7, 0);
  vTailShape.lineTo(0.85, 3.25);
  vTailShape.lineTo(-0.45, 3.25);
  vTailShape.closePath();
  const vTailGeo = new THREE.ExtrudeGeometry(vTailShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  vTailGeo.translate(0, 0, -0.09);
  const vTail = new THREE.Mesh(vTailGeo, blueMat);
  vTail.position.set(-8.4, 0.42, 0);
  const tailBadge = new THREE.Mesh(createBeveledBlock(0.72, 0.72, 0.28, 0.08, 0.02), goldMat);
  tailBadge.position.set(-7.35, 1.85, 0);
  tailBadge.rotation.z = Math.PI / 4;

  // Landing gear struts + rubber tires
  const frontGear = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.24, 12), darkMat);
  frontGear.rotation.x = Math.PI / 2;
  frontGear.position.set(4.5, -1.42, 0);
  const rearGearL = frontGear.clone();
  rearGearL.position.set(-0.4, -1.42, 1.25);
  const rearGearR = frontGear.clone();
  rearGearR.position.set(-0.4, -1.42, -1.25);

  plane.add(fuselage, cabinBand, cockpit, vTail, tailBadge, frontGear, rearGearL, rearGearR);
  return { group: plane, navLights };
}

/** Sculpted rounded hard-shell rolling suitcase with corner trim, handle & wheels */
function makeSuitcase(colorHex: number, toon: (h: number) => THREE.MeshToonMaterial): THREE.Group {
  const g = new THREE.Group();
  const dark = toon(0x1e293b);
  const body = new THREE.Mesh(createBeveledBlock(0.46, 0.62, 0.28, 0.08, 0.025), toon(colorHex));
  body.position.y = 0.06;
  body.castShadow = true;
  const strap = new THREE.Mesh(createBeveledBlock(0.48, 0.09, 0.3, 0.06, 0.01), toon(0xfef3c7));
  strap.position.y = 0.32;
  const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 6), dark);
  handleL.position.set(-0.11, 0.82, 0);
  const handleR = handleL.clone();
  handleR.position.x = 0.11;
  const grip = new THREE.Mesh(createBeveledBlock(0.26, 0.05, 0.05, 0.02, 0.008), dark);
  grip.position.set(0, 0.94, 0);
  g.add(body, strap, handleL, handleR, grip);
  return g;
}

/** Sculpted ergonomic curved airport lounge seat (replaces boxy cubes!) */
function makeErgonomicAirportChair(
  seatMat: THREE.Material,
  backMat: THREE.Material,
  frameMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const cushion = new THREE.Mesh(createBeveledBlock(0.84, 0.14, 0.68, 0.12, 0.03), seatMat);
  cushion.position.y = 0.42;
  cushion.castShadow = true;

  const backrest = new THREE.Mesh(createBeveledBlock(0.82, 0.66, 0.13, 0.1, 0.03), backMat);
  backrest.position.set(0, 0.48, -0.32);
  backrest.rotation.x = -0.15;
  backrest.castShadow = true;

  // Brushed steel armrests
  ([-0.44, 0.44] as const).forEach((ax) => {
    const arm = new THREE.Mesh(createBeveledBlock(0.06, 0.06, 0.52, 0.02, 0.01), frameMat);
    arm.position.set(ax, 0.66, -0.02);
    const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.24, 6), frameMat);
    armPost.position.set(ax, 0.54, 0.16);
    g.add(arm, armPost);
  });

  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.42, 8), frameMat);
  leg.position.set(0, 0.21, 0);
  g.add(cushion, backrest, leg);
  return g;
}

/** Lush indoor airport tree in a circular timber bench planter with river pebbles */
function makeIndoorZenTree(toon: (h: number) => THREE.MeshToonMaterial): THREE.Group {
  const g = new THREE.Group();
  const woodMat = toon(0xcda070);
  const stoneMat = toon(0xeae5d9);
  const trunkMat = toon(0x7c583c);

  const bench = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.48, 0.44, 24), woodMat);
  bench.position.y = 0.22;
  bench.castShadow = true;
  bench.receiveShadow = true;
  const benchRim = new THREE.Mesh(new THREE.TorusGeometry(1.54, 0.045, 8, 24), toon(0xb58657));
  benchRim.rotation.x = Math.PI / 2;
  benchRim.position.y = 0.44;
  const planter = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 0.56, 20), stoneMat);
  planter.position.y = 0.28;
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.06, 18), toon(0x6b5a4a));
  soil.position.y = 0.56;

  // Decorative white river pebbles around tree base
  const pebbleMat = toon(0xf1efe9);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const peb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), pebbleMat);
    peb.scale.set(1.3, 0.55, 1.0);
    peb.position.set(Math.cos(a) * 0.56, 0.6, Math.sin(a) * 0.56);
    g.add(peb);
  }

  // Organic curved trunk + 4 layered soft anime foliage puffs
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.55, 0),
    new THREE.Vector3(0.08, 1.35, 0.04),
    new THREE.Vector3(-0.04, 2.25, -0.02),
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 8, 0.16, 8, false), trunkMat);
  trunk.castShadow = true;

  const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.92, 1), toon(0x4ca66b));
  canopy1.position.set(0, 2.6, 0);
  canopy1.scale.set(1.18, 0.78, 1.18);
  canopy1.castShadow = true;
  const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), toon(0x63bf81));
  canopy2.position.set(0.58, 2.38, 0.32);
  const canopy3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), toon(0x3f8f5c));
  canopy3.position.set(-0.54, 2.28, -0.32);
  const canopy4 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 1), toon(0x75cf91));
  canopy4.position.set(0.05, 3.05, 0.12);

  g.add(bench, benchRim, planter, soil, trunk, canopy1, canopy2, canopy3, canopy4);
  return g;
}

/**
 * Upgraded Studio-Ghibli / Abeto International Airport Terminal!
 * Zero raw sharp boxes: beveled architectural counters, LatheGeometry jetliners,
 * volumetric sunlit window shafts, curved lounge seating, X-ray scan monitor,
 * café chalkboard & glowing pendant lamps, Zen trees & rotating baggage carousel!
 */
export function buildStudioAirportScene(
  scene: THREE.Scene,
  toonGradient: THREE.DataTexture
): (elapsed: number) => void {
  const root = new THREE.Group();
  const toon = createToonMaterialCache(toonGradient);
  const woodTex = makeWoodSlatTexture();
  const woodMat = new THREE.MeshToonMaterial({ map: woodTex, gradientMap: toonGradient });
  const steelMat = toon(0x334155);
  const chromeMat = toon(0xcbd5e1);

  // =========================================================================
  // 1. STUDIO GHIBLI SKY DOME + DRIFTING 3D CLOUDS + DISTANT HILLS
  // =========================================================================
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(95, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x2892d7) },
        midColor: { value: new THREE.Color(0x7ad7e8) },
        horizonColor: { value: new THREE.Color(0xffe6c7) },
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
          vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.24, h));
          col = mix(col, topColor, smoothstep(0.22, 0.72, h));
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `,
    })
  );
  skyDome.name = 'SkyDome';
  root.add(skyDome);

  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'CloudRing';
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xfffdf9, transparent: true, opacity: 0.92 });
  const clouds: Array<{ g: THREE.Group; baseX: number; speed: number }> = [];
  for (let i = 0; i < 10; i++) {
    const cg = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6 + (i % 3) * 0.7, 1), cloudMat);
    p1.scale.set(1.7, 0.62, 0.9);
    const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.9, 1), cloudMat);
    p2.position.set(2.3, -0.25, 0.4);
    p2.scale.set(1.4, 0.55, 0.85);
    const p3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 1), cloudMat);
    p3.position.set(-2.1, -0.3, -0.2);
    p3.scale.set(1.3, 0.52, 0.85);
    cg.add(p1, p2, p3);
    const bx = -45 + i * 10;
    cg.position.set(bx, 13 + (i % 4) * 3.2, -46 - (i % 3) * 10);
    cloudGroup.add(cg);
    clouds.push({ g: cg, baseX: bx, speed: 0.35 + (i % 3) * 0.15 });
  }
  root.add(cloudGroup);

  const hillMat = new THREE.MeshBasicMaterial({ color: 0x8ec5cf });
  for (let i = 0; i < 7; i++) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(16 + (i % 3) * 5, 9 + (i % 4) * 3.5, 7), hillMat);
    hill.position.set(-54 + i * 18, 3.2, -62 - (i % 2) * 8);
    root.add(hill);
  }

  // =========================================================================
  // 2. TERRAZZO FLOOR, ROUNDED CARPET PROMENADE & VOLUMETRIC SUNLIGHT SHAFTS!
  // =========================================================================
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22),
    new THREE.MeshToonMaterial({ map: makeTerrazzoFloorTexture(), gradientMap: toonGradient })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Sleek rounded promenade carpet (using roundedRectShape instead of harsh rectangle!)
  const runnerGeo = new THREE.ShapeGeometry(roundedRectShape(2.5, 17.6, 0.85), 10);
  runnerGeo.rotateX(-Math.PI / 2);
  const runnerMain = new THREE.Mesh(runnerGeo, new THREE.MeshBasicMaterial({ color: 0xdbeafe }));
  runnerMain.position.set(0, 0.012, 0.4);
  const runnerCrossGeo = new THREE.ShapeGeometry(roundedRectShape(21.2, 2.2, 0.8), 10);
  runnerCrossGeo.rotateX(-Math.PI / 2);
  const runnerCross = new THREE.Mesh(runnerCrossGeo, new THREE.MeshBasicMaterial({ color: 0xdbeafe }));
  runnerCross.position.set(0, 0.011, 0.2);
  root.add(runnerMain, runnerCross);

  // Golden Makoto-Shinkai / Studio Ghibli diagonal sunlight patches on the terrazzo floor!
  const sunPatchMat = new THREE.MeshBasicMaterial({
    color: 0xfff8dc,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  ([-9, -3, 3, 9] as const).forEach((sx) => {
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6.2), sunPatchMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(sx + 0.8, 0.02, -6.5);
    root.add(patch);
  });

  // Vaulted curved timber roof arches + warm LED bars + glass skylight canopy
  const lightBarMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  for (let z = -9.5; z <= 9.5; z += 3.8) {
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-13.4, 5.4, z),
      new THREE.Vector3(-6.8, 7.2, z),
      new THREE.Vector3(0, 7.8, z),
      new THREE.Vector3(6.8, 7.2, z),
      new THREE.Vector3(13.4, 5.4, z),
    ]);
    const archMesh = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 22, 0.22, 8, false), woodMat);
    root.add(archMesh);

    const ledBar = new THREE.Mesh(createBeveledBlock(10.5, 0.12, 0.22, 0.04, 0.01), lightBarMat);
    ledBar.position.set(0, 6.82, z);
    root.add(ledBar);
  }
  ([-8.5, 0, 8.5] as const).forEach((px) => {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 20.5), steelMat);
    purlin.position.set(px, px === 0 ? 7.65 : 6.7, 0);
    root.add(purlin);
  });
  const roofCanopy = new THREE.Mesh(
    new THREE.PlaneGeometry(27, 21),
    new THREE.MeshBasicMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  roofCanopy.rotation.x = Math.PI / 2;
  roofCanopy.position.set(0, 7.75, 0);
  root.add(roofCanopy);

  // South Entrance Wall (z = +10.4)
  const southWallL = new THREE.Mesh(new THREE.BoxGeometry(9.6, 5.6, 0.45), toon(0xf7f4eb));
  southWallL.position.set(-8.6, 2.8, 10.4);
  const southWallR = southWallL.clone();
  southWallR.position.x = 8.6;
  const southHeader = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.2, 0.5), toon(0x1e293b));
  southHeader.position.set(0, 4.5, 10.4);
  const entranceDoorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 3.4),
    new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
  );
  entranceDoorGlass.position.set(0, 1.7, 10.35);
  const entranceSign = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 1.5),
    new THREE.MeshBasicMaterial({
      map: makeAirportSignTexture('TERMINAL 1', 'WELCOME TO SPEAKSHARP AIRPORT', '#0f172a', '#ffffff', '#facc15', '✈'),
    })
  );
  entranceSign.position.set(0, 4.5, 10.12);
  entranceSign.rotation.y = Math.PI;
  root.add(southWallL, southWallR, southHeader, entranceDoorGlass, entranceSign);

  // Side Walls with Wood-Slat Wainscoting + Backlit Travel Posters
  const ivoryWall = toon(0xf7f4eb);
  ([-13.4, 13.4] as const).forEach((wx, sideIdx) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.8, 21.5), ivoryWall);
    wall.position.set(wx, 2.9, 0);
    const wainscot = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.5, 21.2), woodMat);
    wainscot.position.set(wx, 0.75, 0);
    root.add(wall, wainscot);

    for (let cz = -9.5; cz <= 9.5; cz += 3.8) {
      const col = new THREE.Mesh(createBeveledBlock(0.65, 5.8, 0.55, 0.1, 0.02), steelMat);
      col.position.set(wx, 0, cz);
      root.add(col);
    }

    const posters =
      sideIdx === 0
        ? [
            { z: -2.0, city: 'TOKYO', sub: 'DIRECT · JL 752', c1: '#38bdf8', c2: '#fbcfe8', ac: '#ef4444' },
            { z: 2.2, city: 'HUE', sub: 'IMPERIAL HERITAGE', c1: '#818cf8', c2: '#fde68a', ac: '#f59e0b' },
          ]
        : [
            { z: -2.0, city: 'PARIS', sub: 'BON VOYAGE', c1: '#60a5fa', c2: '#fed7aa', ac: '#fb7185' },
            { z: 2.2, city: 'SEOUL', sub: 'DIRECT · KE 462', c1: '#34d399', c2: '#bae6fd', ac: '#facc15' },
          ];
    posters.forEach((p) => {
      const frame = new THREE.Mesh(createBeveledBlock(0.14, 2.35, 1.58, 0.05, 0.02), steelMat);
      frame.position.set(wx + (sideIdx === 0 ? 0.25 : -0.25), 1.92, p.z);
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(1.38, 2.12),
        new THREE.MeshBasicMaterial({ map: makeTravelPosterTexture(p.city, p.sub, p.c1, p.c2, p.ac) })
      );
      art.position.set(wx + (sideIdx === 0 ? 0.36 : -0.36), 3.1, p.z);
      art.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
      root.add(frame, art);
    });
  });

  // =========================================================================
  // 3. PANORAMIC CURTAIN WALL + TARMAC + ATC TOWER + 2 SLEEK LATHE AIRLINERS!
  // =========================================================================
  const glassPane = new THREE.Mesh(
    new THREE.PlaneGeometry(26.4, 5.4),
    new THREE.MeshBasicMaterial({ color: 0xcffafe, transparent: true, opacity: 0.13 })
  );
  glassPane.position.set(0, 2.8, -10.4);
  root.add(glassPane);
  for (let gx = -12; gx <= 12; gx += 3) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.6, 0.24), steelMat);
    mullion.position.set(gx, 2.8, -10.4);
    root.add(mullion);
  }
  const transom1 = new THREE.Mesh(new THREE.BoxGeometry(26.8, 0.12, 0.22), steelMat);
  transom1.position.set(0, 2.6, -10.4);
  const transom2 = new THREE.Mesh(new THREE.BoxGeometry(26.8, 0.32, 0.36), steelMat);
  transom2.position.set(0, 5.5, -10.4);
  root.add(transom1, transom2);

  const grassField = new THREE.Mesh(new THREE.PlaneGeometry(160, 80), toon(0x6dbb7a));
  grassField.rotation.x = -Math.PI / 2;
  grassField.position.set(0, -0.14, -46);
  const tarmac = new THREE.Mesh(new THREE.PlaneGeometry(90, 32), toon(0x64748b));
  tarmac.rotation.x = -Math.PI / 2;
  tarmac.position.set(0, -0.06, -26);
  const yellowLine = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 0.24),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  yellowLine.rotation.x = -Math.PI / 2;
  yellowLine.position.set(0, -0.03, -23.5);
  root.add(grassField, tarmac, yellowLine);
  for (let dx = -34; dx <= 34; dx += 5) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.38),
      new THREE.MeshBasicMaterial({ color: 0xfefce8 })
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(dx, -0.03, -34);
    root.add(dash);
  }

  // Air Traffic Control Tower
  const atcGroup = new THREE.Group();
  const atcShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 11.5, 12), toon(0xe2e8f0));
  atcShaft.position.y = 5.75;
  const atcDeck = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.4, 1.2, 12), toon(0x334155));
  atcDeck.position.y = 11.8;
  const atcGlass = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.25, 1.7, 12), toon(0x38bdf8));
  atcGlass.position.y = 13.1;
  const atcRoof = new THREE.Mesh(new THREE.ConeGeometry(2.75, 0.9, 12), toon(0x1e293b));
  atcRoof.position.y = 14.35;
  const radarDish = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.32, 0.22), toon(0xf5bd33));
  radarDish.position.y = 15.1;
  atcGroup.add(atcShaft, atcDeck, atcGlass, atcRoof, radarDish);
  atcGroup.position.set(-18, 0, -28);
  root.add(atcGroup);

  // Hero Parked Airliner + Accordion Jetway Bridge
  const windowTex = makeAirplaneWindowTexture();
  const heroAirliner = buildSleekAirliner(toon, windowTex);
  heroAirliner.group.position.set(8.5, 1.72, -18.2);
  heroAirliner.group.rotation.y = 0.22;
  root.add(heroAirliner.group);

  const jetway = new THREE.Mesh(createBeveledBlock(1.9, 2.1, 7.6, 0.16, 0.04), toon(0xe2e8f0));
  jetway.position.set(10.2, 1.25, -13.6);
  jetway.rotation.y = 0.14;
  const jetwayStripe = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.32, 7.5), toon(0x2563eb));
  jetwayStripe.position.set(10.2, 2.3, -13.6);
  jetwayStripe.rotation.y = 0.14;
  const jetwayLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.2, 10), steelMat);
  jetwayLeg.position.set(10.0, 1.1, -14.8);
  root.add(jetway, jetwayStripe, jetwayLeg);

  const taxiAirliner = buildSleekAirliner(toon, windowTex);
  taxiAirliner.group.scale.setScalar(0.88);
  taxiAirliner.group.position.set(-28, 1.55, -34);
  root.add(taxiAirliner.group);

  // =========================================================================
  // 4. ZONE 1: BEVELED CHECK-IN ISLAND + LED TOE-KICK + QUEUE ROPES
  // =========================================================================
  const checkinBase = new THREE.Mesh(createBeveledBlock(6.4, 0.96, 1.42, 0.28, 0.04), woodMat);
  checkinBase.position.set(-7.2, 0.06, -4.8);
  checkinBase.castShadow = true;
  checkinBase.receiveShadow = true;
  const checkinGlow = new THREE.Mesh(
    createBeveledBlock(6.2, 0.08, 1.32, 0.22, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  checkinGlow.position.set(-7.2, 0.0, -4.8);
  const checkinTop = new THREE.Mesh(createBeveledBlock(6.65, 0.14, 1.62, 0.28, 0.03), toon(0x1e3a8a));
  checkinTop.position.set(-7.2, 0.98, -4.8);
  root.add(checkinBase, checkinGlow, checkinTop);

  // Dual angled workstations (monitor + keyboard + passport scanner!)
  ([-8.7, -5.7] as const).forEach((mx) => {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.22, 8), steelMat);
    stand.position.set(mx, 1.22, -4.72);
    const mon = new THREE.Mesh(createBeveledBlock(0.64, 0.42, 0.07, 0.03, 0.01), steelMat);
    mon.position.set(mx, 1.22, -4.72);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    scr.position.set(mx, 1.43, -4.66);
    const scanner = new THREE.Mesh(createBeveledBlock(0.24, 0.08, 0.22, 0.04, 0.01), toon(0x0f172a));
    scanner.position.set(mx + 0.55, 1.12, -4.35);
    root.add(stand, mon, scr, scanner);
  });

  // Luggage Scale & Conveyor Belt + Rounded Suitcases
  const beltBase = new THREE.Mesh(createBeveledBlock(2.8, 0.34, 1.18, 0.12, 0.03), toon(0x334155));
  beltBase.position.set(-3.2, 0, -4.8);
  const beltTop = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.05, 0.96), toon(0x0f172a));
  beltTop.position.set(-3.2, 0.35, -4.8);
  root.add(beltBase, beltTop);
  const beltSuitcase1 = makeSuitcase(0xef4444, toon);
  beltSuitcase1.position.set(-3.8, 0.36, -4.8);
  const beltSuitcase2 = makeSuitcase(0xf5bd33, toon);
  beltSuitcase2.position.set(-2.6, 0.36, -4.8);
  root.add(beltSuitcase1, beltSuitcase2);

  // Brass Stanchion Queue Posts + Velvet Ropes (wide open center gap for Agent Maya!)
  const brassMat = toon(0xd4a24c);
  const ropeMat = toon(0x1d4ed8);
  const stanchionPairs: Array<[number, number]> = [
    [-10.2, -8.3],
    [-6.1, -4.2],
  ];
  stanchionPairs.forEach(([x1, x2]) => {
    ([x1, x2] as const).forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.92, 10), brassMat);
      post.position.set(px, 0.46, -2.1);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), brassMat);
      finial.position.set(px, 0.94, -2.1);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 12), brassMat);
      base.position.set(px, 0.03, -2.1);
      root.add(post, finial, base);
    });
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x1, 0.82, -2.1),
      new THREE.Vector3((x1 + x2) * 0.5, 0.66, -2.1),
      new THREE.Vector3(x2, 0.82, -2.1),
    ]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 12, 0.026, 6, false), ropeMat));
  });

  // Suspended LED Flight Departures Board
  const depFrame = new THREE.Mesh(createBeveledBlock(5.25, 2.58, 0.22, 0.1, 0.03), steelMat);
  depFrame.position.set(-7.2, 2.56, -5.2);
  const depFace = new THREE.Mesh(
    new THREE.PlaneGeometry(4.95, 2.38),
    new THREE.MeshBasicMaterial({ map: makeDepartureBoardTexture() })
  );
  depFace.position.set(-7.2, 3.85, -5.04);
  const rodL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), chromeMat);
  rodL.position.set(-9.2, 5.8, -5.2);
  const rodR = rodL.clone();
  rodR.position.x = -5.2;
  root.add(depFrame, depFace, rodL, rodR);

  // =========================================================================
  // 5. ZONE 2: SCULPTED SECURITY CHECKPOINT + X-RAY SCANNER & MONITOR
  // =========================================================================
  const archMat = toon(0xf1f5f9);
  const archL = new THREE.Mesh(createBeveledBlock(0.28, 2.6, 0.7, 0.08, 0.025), archMat);
  archL.position.set(-0.95, 0, -3.5);
  archL.castShadow = true;
  const archR = archL.clone();
  archR.position.x = 0.95;
  const archTop = new THREE.Mesh(createBeveledBlock(2.26, 0.34, 0.74, 0.1, 0.025), toon(0x1e293b));
  archTop.position.set(0, 2.52, -3.5);
  const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.78), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
  ledStrip.position.set(0, 2.69, -3.5);
  root.add(archL, archR, archTop, ledStrip);

  // Rounded X-Ray Tunnel + Lead Curtain + Live X-Ray Scan Monitor + Sliding Tray!
  const xrayBody = new THREE.Mesh(createBeveledBlock(1.58, 1.24, 2.25, 0.22, 0.04), toon(0x334155));
  xrayBody.position.set(2.35, 0, -3.5);
  xrayBody.castShadow = true;
  const xrayHood = new THREE.Mesh(createBeveledBlock(1.66, 0.22, 2.32, 0.18, 0.03), toon(0x0284c7));
  xrayHood.position.set(2.35, 1.16, -3.5);
  const xrayRoller = new THREE.Mesh(createBeveledBlock(1.12, 0.68, 4.2, 0.1, 0.02), chromeMat);
  xrayRoller.position.set(2.35, 0, -3.5);

  // X-Ray Monitor displaying scanned suitcase!
  const xrayMonStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.45, 8), steelMat);
  xrayMonStand.position.set(2.35, 1.56, -3.2);
  const xrayMon = new THREE.Mesh(createBeveledBlock(0.86, 0.64, 0.09, 0.04, 0.015), steelMat);
  xrayMon.position.set(2.35, 1.58, -3.2);
  const xrayScr = new THREE.Mesh(
    new THREE.PlaneGeometry(0.76, 0.54),
    new THREE.MeshBasicMaterial({ map: makeXrayScreenTexture() })
  );
  xrayScr.position.set(2.35, 1.9, -3.12);

  const secTray = new THREE.Group();
  const trayBox = new THREE.Mesh(createBeveledBlock(0.62, 0.1, 0.46, 0.06, 0.015), toon(0x2563eb));
  const miniLaptop = new THREE.Mesh(createBeveledBlock(0.36, 0.04, 0.26, 0.02, 0.006), chromeMat);
  miniLaptop.position.y = 0.09;
  secTray.add(trayBox, miniLaptop);
  secTray.position.set(2.35, 0.69, -2.0);
  root.add(xrayBody, xrayHood, xrayRoller, xrayMonStand, xrayMon, xrayScr, secTray);

  const secSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 1.05, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeAirportSignTexture('SECURITY', 'KIỂM TRA AN NINH', '#0f172a', '#ffffff', '#38bdf8', '🛡'),
    })
  );
  secSign.position.set(0.6, 3.85, -3.5);
  root.add(secSign);

  // =========================================================================
  // 6. ZONE 3: CURVED GATE B12 PODIUM + ERGONOMIC LOUNGE SEATING
  // =========================================================================
  const podiumBase = new THREE.Mesh(createBeveledBlock(2.7, 1.04, 1.15, 0.28, 0.04), toon(0x1e3a8a));
  podiumBase.position.set(8.2, 0, -4.7);
  podiumBase.castShadow = true;
  const podiumTrim = new THREE.Mesh(createBeveledBlock(2.85, 0.12, 1.28, 0.28, 0.03), woodMat);
  podiumTrim.position.set(8.2, 1.02, -4.7);
  const gateSign = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 1.1, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeAirportSignTexture('GATE B12', 'TOKYO · JL 752 · BOARDING', '#1d4ed8', '#ffffff', '#facc15', '✈'),
    })
  );
  gateSign.position.set(8.2, 3.8, -4.9);
  root.add(podiumBase, podiumTrim, gateSign);

  // 2 Rows of Sculpted Ergonomic Airport Lounge Chairs with Armrests!
  const chairMat = toon(0x3b82f6);
  const chairBackMat = toon(0x1d4ed8);
  ([1.8, 3.6] as const).forEach((rz) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 0.14), chromeMat);
    beam.position.set(7.4, 0.34, rz);
    root.add(beam);
    for (let i = 0; i < 4; i++) {
      const chair = makeErgonomicAirportChair(chairMat, chairBackMat, chromeMat);
      chair.position.set(5.6 + i * 1.2, 0, rz);
      root.add(chair);
    }
  });

  // =========================================================================
  // 7. ZONE 4: ARTISAN SKY LOUNGE CAFÉ (LEFT FRONT CORNER)
  // =========================================================================
  const cafeBody = new THREE.Mesh(createBeveledBlock(5.0, 1.02, 1.5, 0.24, 0.04), woodMat);
  cafeBody.position.set(-7.6, 0, 8.2);
  cafeBody.castShadow = true;
  const cafeCounterTop = new THREE.Mesh(createBeveledBlock(5.25, 0.12, 1.68, 0.24, 0.03), toon(0xfffbeb));
  cafeCounterTop.position.set(-7.6, 1.0, 8.2);
  const pastryCase = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.62, 0.9),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.34 })
  );
  pastryCase.position.set(-8.7, 1.44, 8.2);
  // Golden croissants inside pastry showcase!
  for (let p = 0; p < 3; p++) {
    const croissant = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 6, 10, Math.PI * 1.35), toon(0xd98a3c));
    croissant.rotation.x = Math.PI / 2;
    croissant.position.set(-9.2 + p * 0.45, 1.22, 8.2);
    root.add(croissant);
  }
  // Chrome Espresso Machine
  const espresso = new THREE.Mesh(createBeveledBlock(0.86, 0.64, 0.65, 0.08, 0.025), toon(0x475569));
  espresso.position.set(-6.2, 1.12, 8.2);
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 0.16, 2.0),
    new THREE.MeshToonMaterial({ map: makeAwningStripeTexture('#ea580c', '#fff7ed'), gradientMap: toonGradient })
  );
  awning.position.set(-7.6, 2.75, 7.95);
  awning.rotation.x = 0.22;
  // Illuminated Chalkboard Menu + Warm Hanging Pendant Bulbs!
  const menuBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.4, 0.1),
    new THREE.MeshBasicMaterial({ map: makeCafeMenuTexture() })
  );
  menuBoard.position.set(-7.6, 3.65, 8.55);
  menuBoard.rotation.y = Math.PI;
  root.add(cafeBody, cafeCounterTop, pastryCase, espresso, awning, menuBoard);

  // 3 Warm Glowing Pendant Lights hanging under Café awning
  ([-9.2, -7.6, -6.0] as const).forEach((lx) => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.48, 6), steelMat);
    cord.position.set(lx, 2.48, 7.65);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
    );
    bulb.position.set(lx, 2.22, 7.65);
    root.add(cord, bulb);
  });

  // 2 Cozy Round Bistro Tables + Stools
  ([-11.0, -3.8] as const).forEach((tx) => {
    const tTop = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.08, 18), toon(0xfffbeb));
    tTop.position.set(tx, 0.78, 7.2);
    const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.24, 0.78, 10), steelMat);
    tLeg.position.set(tx, 0.39, 7.2);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.14, 8), toon(0xf59e0b));
    cup.position.set(tx + 0.15, 0.89, 7.15);
    root.add(tTop, tLeg, cup);
  });

  // =========================================================================
  // 8. ZONE 5: INDOOR ZEN GARDEN TREES + ROTATING BAGGAGE CLAIM CAROUSEL!
  // =========================================================================
  const zenTree = makeIndoorZenTree(toon);
  zenTree.position.set(-10.8, 0, -0.2);
  root.add(zenTree);

  const zenTree2 = makeIndoorZenTree(toon);
  zenTree2.position.set(10.8, 0, -0.2);
  root.add(zenTree2);

  // Rotating Baggage Claim Carousel (Right Front)
  const carouselGroup = new THREE.Group();
  carouselGroup.position.set(7.4, 0, 6.6);
  const carTrack = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.28, 0.36, 24), toon(0x334155));
  carTrack.position.y = 0.18;
  const carCenter = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.75, 20), woodMat);
  carCenter.position.y = 0.38;
  const carSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.9, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeAirportSignTexture('BAGGAGE', 'NHẬN HÀNH LÝ · BELT 1', '#0f766e', '#ffffff', '#5eead4', '🧳'),
    })
  );
  carSign.position.set(0, 2.9, 0);
  const carPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), chromeMat);
  carPole.position.y = 1.65;
  carouselGroup.add(carTrack, carCenter, carSign, carPole);

  const carouselBags: Array<{ mesh: THREE.Group; angleOffset: number }> = [];
  const bagColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
  for (let i = 0; i < 4; i++) {
    const bag = makeSuitcase(bagColors[i], toon);
    carouselGroup.add(bag);
    carouselBags.push({ mesh: bag, angleOffset: (i / 4) * Math.PI * 2 });
  }
  root.add(carouselGroup);

  const updateRichDetails = addAirportRichDetails(root, toon, woodMat, steelMat, chromeMat);

  scene.add(root);

  return (elapsed: number) => {
    updateRichDetails(elapsed);
    radarDish.rotation.y = elapsed * 1.4;
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.g.position.x = ((c.baseX + elapsed * c.speed + 55) % 110) - 55;
    }

    // Blinking wingtip navigation beacons on parked & taxiing jetliners!
    const blinkOn = Math.sin(elapsed * 4.5) > 0.25;
    for (const nl of heroAirliner.navLights) nl.visible = blinkOn;
    for (const nl of taxiAirliner.navLights) nl.visible = !blinkOn;

    const cycle = (elapsed * 0.055) % 1;
    taxiAirliner.group.position.x = -46 + cycle * 92;
    const liftT = Math.max(0, (cycle - 0.62) / 0.38);
    taxiAirliner.group.position.y = 1.55 + liftT * liftT * 9.5;
    taxiAirliner.group.rotation.z = liftT * 0.22;

    beltSuitcase1.position.x = -4.2 + ((elapsed * 0.38) % 2.1);
    beltSuitcase2.position.x = -4.2 + ((elapsed * 0.38 + 1.05) % 2.1);
    secTray.position.z = -1.7 - ((elapsed * 0.65) % 3.5);

    for (let i = 0; i < carouselBags.length; i++) {
      const b = carouselBags[i];
      const a = elapsed * 0.55 + b.angleOffset;
      b.mesh.position.set(Math.cos(a) * 1.65, 0.36, Math.sin(a) * 1.65);
      b.mesh.rotation.y = -a;
    }
  };
}
