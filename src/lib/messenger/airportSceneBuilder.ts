import * as THREE from 'three';

function makeTerrazzoFloorTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f5f2e9';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle checkerboard marble sheen
  ctx.fillStyle = '#ede9dc';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillRect(256, 256, 256, 256);

  // Delicate terrazzo speckles
  const flecks = ['#d6cfc0', '#c7d3db', '#e2d2b5', '#b8c4cc'];
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = flecks[i % flecks.length];
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 1.2 + rand() * 2.4;
    ctx.fillRect(x, y, r, r);
  }

  // Crisp architectural tile grout lines
  ctx.strokeStyle = 'rgba(130, 142, 152, 0.25)';
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
  ctx.fillStyle = '#c89b6e';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? '#d4a97d' : '#bc8e61';
    ctx.fillRect(x, 0, 13, 256);
    ctx.fillStyle = '#78563a';
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
  tex.repeat.set(2, 1);
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

  // Sleek left accent bar + rounded inner border
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 18, 180);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 620, 160);

  ctx.fillStyle = fg;
  ctx.font = '900 48px system-ui, -apple-system, sans-serif';
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

  // Header strip
  ctx.fillStyle = '#f5bd33';
  ctx.fillRect(0, 0, 768, 66);
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 32px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('✈  DEPARTURES · CHUYẾN BAY QUỐC TẾ', 24, 34);

  // Column labels
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

function makeTravelPosterTexture(city: string, sub: string, skyTop: string, skyBot: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 384);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 384);

  // Stylized sun/moon disc
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(128, 165, 58, 0, Math.PI * 2);
  ctx.fill();

  // Silhouette hill/waves
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
  // Crisp airline livery stripe
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 74, 512, 16);
  ctx.fillStyle = '#f5bd33';
  ctx.fillRect(0, 90, 512, 6);
  // Row of rounded passenger windows
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

/** Build a sleek, sculpted Studio-Ghibli/Anime passenger airliner! */
function buildSleekAirliner(toon: (hex: number) => THREE.MeshToonMaterial, windowTex: THREE.CanvasTexture): THREE.Group {
  const plane = new THREE.Group();
  const bodyMat = new THREE.MeshToonMaterial({ map: windowTex, color: 0xffffff });
  const whiteMat = toon(0xfffdf8);
  const wingMat = toon(0xe2e8f0);
  const blueMat = toon(0x2563eb);
  const goldMat = toon(0xf5bd33);
  const darkMat = toon(0x1e293b);

  // Main fuselage tube
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 10.5, 18), bodyMat);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.castShadow = true;

  // Aerodynamic nose cone + cockpit glass
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 12), whiteMat);
  nose.scale.set(2.1, 0.96, 0.98);
  nose.position.set(5.25, -0.04, 0);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.92, 14, 10, -0.7, 1.4, 0.65, 0.55), darkMat);
  cockpit.scale.set(1.5, 0.95, 1.02);
  cockpit.position.set(5.45, 0.25, 0);

  // Tapered tail cone
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(1.05, 3.6, 16), whiteMat);
  tailCone.rotation.z = Math.PI / 2;
  tailCone.position.set(-7.05, 0.16, 0);

  // Swept main wings + upturned winglets
  ([-1, 1] as const).forEach((side) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 6.4), wingMat);
    wing.position.set(0.4, -0.35, side * 3.5);
    wing.rotation.y = side * -0.26;
    wing.rotation.x = side * 0.05;
    wing.castShadow = true;

    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.05, 0.14), blueMat);
    winglet.position.set(-0.4, 0.15, side * 6.55);
    winglet.rotation.x = side * -0.25;

    // Under-wing turbofan engine nacelle
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.38, 1.7, 14), whiteMat);
    engine.rotation.z = Math.PI / 2;
    engine.position.set(1.0, -0.82, side * 2.8);
    const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 14), darkMat);
    intake.rotation.z = Math.PI / 2;
    intake.position.set(1.82, -0.82, side * 2.8);
    const engRing = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.22, 14), blueMat);
    engRing.rotation.z = Math.PI / 2;
    engRing.position.set(1.45, -0.82, side * 2.8);

    // Horizontal tailplane
    const hTail = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 2.5), wingMat);
    hTail.position.set(-6.5, 0.25, side * 1.35);
    hTail.rotation.y = side * -0.32;

    plane.add(wing, winglet, engine, intake, engRing, hTail);
  });

  // Tall vertical tail fin with gold accent stripe
  const vTailShape = new THREE.Shape();
  vTailShape.moveTo(0, 0);
  vTailShape.lineTo(2.4, 0);
  vTailShape.lineTo(0.8, 3.1);
  vTailShape.lineTo(-0.5, 3.1);
  vTailShape.closePath();
  const vTailGeo = new THREE.ExtrudeGeometry(vTailShape, { depth: 0.22, bevelEnabled: false });
  vTailGeo.translate(0, 0, -0.11);
  const vTail = new THREE.Mesh(vTailGeo, blueMat);
  vTail.position.set(-7.5, 0.45, 0);
  const tailBadge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.26), goldMat);
  tailBadge.position.set(-6.6, 2.0, 0);
  tailBadge.rotation.z = Math.PI / 4;

  // Landing gear wheels
  const wheelMat = darkMat;
  const frontGear = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.24, 10), wheelMat);
  frontGear.rotation.x = Math.PI / 2;
  frontGear.position.set(4.5, -1.42, 0);
  const rearGearL = frontGear.clone();
  rearGearL.position.set(-0.4, -1.42, 1.2);
  const rearGearR = frontGear.clone();
  rearGearR.position.set(-0.4, -1.42, -1.2);

  plane.add(fuselage, nose, cockpit, tailCone, vTail, tailBadge, frontGear, rearGearL, rearGearR);
  return plane;
}

/** Build a cute stylized rolling suitcase with telescopic handle & wheels */
function makeSuitcase(colorHex: number, toon: (h: number) => THREE.MeshToonMaterial): THREE.Group {
  const g = new THREE.Group();
  const dark = toon(0x1e293b);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 0.28), toon(colorHex));
  body.position.y = 0.36;
  body.castShadow = true;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.3), toon(0xfef3c7));
  band.position.y = 0.36;
  const handleL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 6), dark);
  handleL.position.set(-0.11, 0.78, 0);
  const handleR = handleL.clone();
  handleR.position.x = 0.11;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.045), dark);
  grip.position.set(0, 0.93, 0);
  g.add(body, band, handleL, handleR, grip);
  return g;
}

/** Build a lush indoor airport tree in a circular timber bench planter (Jewel Changi / Haneda vibe!) */
function makeIndoorZenTree(toon: (h: number) => THREE.MeshToonMaterial): THREE.Group {
  const g = new THREE.Group();
  const woodMat = toon(0xc99c6d);
  const stoneMat = toon(0xe5e0d4);
  const trunkMat = toon(0x7c583c);

  // Circular timber bench + stone inner planter
  const bench = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.48, 0.44, 18), woodMat);
  bench.position.y = 0.22;
  bench.castShadow = true;
  bench.receiveShadow = true;
  const planter = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.56, 16), stoneMat);
  planter.position.y = 0.28;
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 16), toon(0x6b5a4a));
  soil.position.y = 0.56;

  // Sculpted organic trunk + 3 lush anime foliage puffs
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.9, 8), trunkMat);
  trunk.position.y = 1.45;
  trunk.castShadow = true;
  const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.92, 1), toon(0x4ca66b));
  canopy1.position.set(0, 2.55, 0);
  canopy1.scale.set(1.15, 0.82, 1.15);
  canopy1.castShadow = true;
  const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), toon(0x62bd7f));
  canopy2.position.set(0.55, 2.35, 0.35);
  const canopy3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), toon(0x3f8f5c));
  canopy3.position.set(-0.52, 2.25, -0.32);

  g.add(bench, planter, soil, trunk, canopy1, canopy2, canopy3);
  return g;
}

/**
 * Studio-Ghibli / Abeto-quality International Airport Terminal Builder!
 * Features vaulted timber-and-steel roof arches, panoramic glass runway wall,
 * sculpted hero airliner + jetway bridge + ATC tower + animated taxiing jet,
 * Check-in hall with moving luggage belt & stanchion ropes, Security X-ray with trays,
 * Gate B12 lounge, Sky Lounge Café & Duty-Free, Zen Garden Tree, and Rotating Baggage Carousel!
 */
export function buildStudioAirportScene(
  scene: THREE.Scene,
  toonGradient: THREE.DataTexture
): (elapsed: number) => void {
  const root = new THREE.Group();
  const toon = (hex: number) => new THREE.MeshToonMaterial({ color: hex, gradientMap: toonGradient });
  const woodTex = makeWoodSlatTexture();
  const woodMat = new THREE.MeshToonMaterial({ map: woodTex, gradientMap: toonGradient });

  // =========================================================================
  // 1. STUDIO GHIBLI LUMINOUS SKY DOME + DRIFTING 3D CLOUDS + DISTANT HILLS
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
  root.add(skyDome);

  // Drifting fluffy pastel clouds outside
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
    root.add(cg);
    clouds.push({ g: cg, baseX: bx, speed: 0.35 + (i % 3) * 0.15 });
  }

  // Soft distant coastal mountains behind the runway
  const hillMat = new THREE.MeshBasicMaterial({ color: 0x8ec5cf });
  for (let i = 0; i < 7; i++) {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(16 + (i % 3) * 5, 9 + (i % 4) * 3.5, 7), hillMat);
    hill.position.set(-54 + i * 18, 3.2, -62 - (i % 2) * 8);
    root.add(hill);
  }

  // =========================================================================
  // 2. ARCHITECTURAL TERRAZZO FLOOR, WAYFINDING CARPETS & VAULTED ROOF ARCHES
  // =========================================================================
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22),
    new THREE.MeshToonMaterial({ map: makeTerrazzoFloorTexture(), gradientMap: toonGradient })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Inlaid navy & gold architectural promenade runner leading straight from entrance to security/gate
  const runnerMain = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 17.5),
    new THREE.MeshBasicMaterial({ color: 0xdbeafe })
  );
  runnerMain.rotation.x = -Math.PI / 2;
  runnerMain.position.set(0, 0.012, 0.4);
  const runnerCross = new THREE.Mesh(
    new THREE.PlaneGeometry(21.5, 2.2),
    new THREE.MeshBasicMaterial({ color: 0xdbeafe })
  );
  runnerCross.rotation.x = -Math.PI / 2;
  runnerCross.position.set(0, 0.012, 0.2);
  const goldTrimL = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 17.5),
    new THREE.MeshBasicMaterial({ color: 0xeab308 })
  );
  goldTrimL.rotation.x = -Math.PI / 2;
  goldTrimL.position.set(-1.32, 0.015, 0.4);
  const goldTrimR = goldTrimL.clone();
  goldTrimR.position.x = 1.32;
  root.add(runnerMain, runnerCross, goldTrimL, goldTrimR);

  // Vaulted curved timber-and-steel terminal roof arches overhead!
  const steelMat = toon(0x334155);
  const lightBarMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  for (let z = -9.5; z <= 9.5; z += 3.8) {
    // Sweeping parabolic arch across X = -13.5 to +13.5
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-13.4, 5.4, z),
      new THREE.Vector3(-6.8, 7.2, z),
      new THREE.Vector3(0, 7.8, z),
      new THREE.Vector3(6.8, 7.2, z),
      new THREE.Vector3(13.4, 5.4, z),
    ]);
    const archMesh = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 20, 0.22, 6, false), woodMat);
    root.add(archMesh);

    // Sleek warm LED light bar suspended beneath each arch
    const ledBar = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.1, 0.2), lightBarMat);
    ledBar.position.set(0, 6.85, z);
    root.add(ledBar);
  }
  // Longitudinal steel purlin beams + airy sunlit skylight roof canopy connecting the arches
  ([-8.5, 0, 8.5] as const).forEach((px) => {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 20.5), steelMat);
    purlin.position.set(px, px === 0 ? 7.65 : 6.7, 0);
    root.add(purlin);
  });
  const roofCanopy = new THREE.Mesh(
    new THREE.PlaneGeometry(27, 21),
    new THREE.MeshBasicMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
  );
  roofCanopy.rotation.x = Math.PI / 2;
  roofCanopy.position.set(0, 7.75, 0);
  root.add(roofCanopy);

  // South Entrance Wall (z = +10.4) with sleek automatic glass doors & Terminal 1 archway (no empty void behind player!)
  const southWallL = new THREE.Mesh(new THREE.BoxGeometry(9.6, 5.6, 0.45), toon(0xf7f4eb));
  southWallL.position.set(-8.6, 2.8, 10.4);
  const southWallR = southWallL.clone();
  southWallR.position.x = 8.6;
  const southHeader = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.2, 0.5), toon(0x1e293b));
  southHeader.position.set(0, 4.5, 10.4);
  const entranceDoorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 3.4),
    new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.26, side: THREE.DoubleSide })
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

  // Side architectural walls with warm cedar wood-slat wainscoting + backlit travel posters!
  const ivoryWall = toon(0xf7f4eb);
  ([-13.4, 13.4] as const).forEach((wx, sideIdx) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 5.8, 21.5), ivoryWall);
    wall.position.set(wx, 2.9, 0);
    const wainscot = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.5, 21.2), woodMat);
    wainscot.position.set(wx, 0.75, 0);
    root.add(wall, wainscot);

    // Structural columns along the wall
    for (let cz = -9.5; cz <= 9.5; cz += 3.8) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.65, 5.8, 0.55), steelMat);
      col.position.set(wx, 2.9, cz);
      root.add(col);
    }

    // Backlit Travel Posters
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
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 1.55), steelMat);
      frame.position.set(wx + (sideIdx === 0 ? 0.25 : -0.25), 3.1, p.z);
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(1.38, 2.12),
        new THREE.MeshBasicMaterial({ map: makeTravelPosterTexture(p.city, p.sub, p.c1, p.c2, p.ac) })
      );
      art.position.set(wx + (sideIdx === 0 ? 0.32 : -0.32), 3.1, p.z);
      art.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
      root.add(frame, art);
    });
  });

  // =========================================================================
  // 3. PANORAMIC CURTAIN WALL + TARMAC + ATC TOWER + 2 SLEEK AIRLINERS!
  // =========================================================================
  const glassPane = new THREE.Mesh(
    new THREE.PlaneGeometry(26.4, 5.4),
    new THREE.MeshBasicMaterial({ color: 0xcffafe, transparent: true, opacity: 0.14 })
  );
  glassPane.position.set(0, 2.8, -10.4);
  root.add(glassPane);
  for (let gx = -12; gx <= 12; gx += 3) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.6, 0.24), steelMat);
    mullion.position.set(gx, 2.8, -10.4);
    root.add(mullion);
  }
  const transom1 = new THREE.Mesh(new THREE.BoxGeometry(26.8, 0.14, 0.22), steelMat);
  transom1.position.set(0, 2.6, -10.4);
  const transom2 = new THREE.Mesh(new THREE.BoxGeometry(26.8, 0.32, 0.36), steelMat);
  transom2.position.set(0, 5.5, -10.4);
  root.add(transom1, transom2);

  // Exterior Apron & Runway Tarmac + Yellow Taxiway Guidelines
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

  // Air Traffic Control (ATC) Tower outside on left-back tarmac!
  const atcGroup = new THREE.Group();
  const atcShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 11.5, 8), toon(0xe2e8f0));
  atcShaft.position.y = 5.75;
  const atcDeck = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.4, 1.2, 8), toon(0x334155));
  atcDeck.position.y = 11.8;
  const atcGlass = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.25, 1.7, 8), toon(0x38bdf8));
  atcGlass.position.y = 13.1;
  const atcRoof = new THREE.Mesh(new THREE.ConeGeometry(2.75, 0.9, 8), toon(0x1e293b));
  atcRoof.position.y = 14.35;
  const radarDish = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.32, 0.22), toon(0xf5bd33));
  radarDish.position.y = 15.1;
  atcGroup.add(atcShaft, atcDeck, atcGlass, atcRoof, radarDish);
  atcGroup.position.set(-18, 0, -28);
  root.add(atcGroup);

  // Hero Parked Airliner at Gate B12 + Corrugated Jetway Boarding Bridge!
  const windowTex = makeAirplaneWindowTexture();
  const heroPlane = buildSleekAirliner(toon, windowTex);
  heroPlane.position.set(8.5, 1.72, -18.2);
  heroPlane.rotation.y = 0.22;
  root.add(heroPlane);

  const jetway = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.2, 7.6), toon(0xe2e8f0));
  jetway.position.set(10.2, 2.3, -13.6);
  jetway.rotation.y = 0.14;
  const jetwayStripe = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.35, 7.62), toon(0x2563eb));
  jetwayStripe.position.set(10.2, 2.3, -13.6);
  jetwayStripe.rotation.y = 0.14;
  const jetwayLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.2, 8), steelMat);
  jetwayLeg.position.set(10.0, 1.1, -14.8);
  root.add(jetway, jetwayStripe, jetwayLeg);

  // Second Animated Airliner taxiing & gently lifting off on the far runway!
  const taxiPlane = buildSleekAirliner(toon, windowTex);
  taxiPlane.scale.setScalar(0.88);
  taxiPlane.position.set(-28, 1.55, -34);
  root.add(taxiPlane);

  // =========================================================================
  // 4. ZONE 1: CHECK-IN HALL (LEFT BACK) + MOVING LUGGAGE BELT + QUEUE ROPES
  // =========================================================================
  const checkinBase = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.02, 1.4), toon(0xf8fafc));
  checkinBase.position.set(-7.2, 0.51, -4.8);
  checkinBase.castShadow = true;
  checkinBase.receiveShadow = true;
  const checkinWood = new THREE.Mesh(new THREE.BoxGeometry(6.46, 0.72, 1.44), woodMat);
  checkinWood.position.set(-7.2, 0.42, -4.8);
  const checkinTop = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 1.6), toon(0x1e3a8a));
  checkinTop.position.set(-7.2, 1.06, -4.8);
  root.add(checkinBase, checkinWood, checkinTop);

  // 2 Staff Computer Monitors on Check-in desk
  ([-8.6, -5.8] as const).forEach((mx) => {
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.08), steelMat);
    mon.position.set(mx, 1.38, -4.7);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    scr.position.set(mx, 1.38, -4.65);
    root.add(mon, scr);
  });

  // Luggage Conveyor Belt + Animated Suitcases
  const beltBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.34, 1.15), toon(0x334155));
  beltBase.position.set(-3.2, 0.17, -4.8);
  const beltTop = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.05, 0.96), toon(0x0f172a));
  beltTop.position.set(-3.2, 0.36, -4.8);
  root.add(beltBase, beltTop);
  const beltSuitcase1 = makeSuitcase(0xef4444, toon);
  beltSuitcase1.position.set(-3.8, 0.36, -4.8);
  const beltSuitcase2 = makeSuitcase(0xf5bd33, toon);
  beltSuitcase2.position.set(-2.6, 0.36, -4.8);
  root.add(beltSuitcase1, beltSuitcase2);

  // Brass Stanchion Queue Posts + Velvet Ropes (clean central opening in front of Agent Maya!)
  const brassMat = toon(0xd4a24c);
  const ropeMat = toon(0x1d4ed8);
  const stanchionPairs: Array<[number, number]> = [
    [-10.2, -8.3],
    [-6.1, -4.2],
  ];
  stanchionPairs.forEach(([x1, x2]) => {
    ([x1, x2] as const).forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.92, 8), brassMat);
      post.position.set(px, 0.46, -2.1);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 10), brassMat);
      base.position.set(px, 0.03, -2.1);
      root.add(post, base);
    });
    const ropeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x1, 0.82, -2.1),
      new THREE.Vector3((x1 + x2) * 0.5, 0.66, -2.1),
      new THREE.Vector3(x2, 0.82, -2.1),
    ]);
    const rope = new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 10, 0.025, 5, false), ropeMat);
    root.add(rope);
  });

  // Suspended High-Res LED Flight Departures Board!
  const depFrame = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.55, 0.2), steelMat);
  depFrame.position.set(-7.2, 3.85, -5.2);
  const depFace = new THREE.Mesh(
    new THREE.PlaneGeometry(4.95, 2.38),
    new THREE.MeshBasicMaterial({ map: makeDepartureBoardTexture() })
  );
  depFace.position.set(-7.2, 3.85, -5.09);
  const rodL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), steelMat);
  rodL.position.set(-9.2, 5.8, -5.2);
  const rodR = rodL.clone();
  rodR.position.x = -5.2;
  root.add(depFrame, depFace, rodL, rodR);

  // =========================================================================
  // 5. ZONE 2: SECURITY CHECKPOINT (CENTER) + X-RAY TUNNEL + ANIMATED TRAYS
  // =========================================================================
  const archMat = toon(0xf1f5f9);
  const archL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 2.6, 0.68), archMat);
  archL.position.set(-0.95, 1.3, -3.5);
  archL.castShadow = true;
  const archR = archL.clone();
  archR.position.x = 0.95;
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.34, 0.72), toon(0x1e293b));
  archTop.position.set(0, 2.68, -3.5);
  const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.75), new THREE.MeshBasicMaterial({ color: 0x4ade80 }));
  ledStrip.position.set(0, 2.68, -3.5);
  root.add(archL, archR, archTop, ledStrip);

  // Sleek X-Ray Baggage Scanner + Roller Conveyor + Animated Blue Trays
  const xrayBody = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.28, 2.2), toon(0x334155));
  xrayBody.position.set(2.35, 0.64, -3.5);
  xrayBody.castShadow = true;
  const xrayHood = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.24, 2.26), toon(0x0284c7));
  xrayHood.position.set(2.35, 1.22, -3.5);
  const xrayRoller = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.68, 4.2), toon(0x94a3b8));
  xrayRoller.position.set(2.35, 0.34, -3.5);
  const secTray = new THREE.Group();
  const trayBox = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.46), toon(0x2563eb));
  const miniLaptop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.26), toon(0xe2e8f0));
  miniLaptop.position.y = 0.07;
  secTray.add(trayBox, miniLaptop);
  secTray.position.set(2.35, 0.74, -2.0);
  root.add(xrayBody, xrayHood, xrayRoller, secTray);

  const secSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 1.05, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeAirportSignTexture('SECURITY', 'KIỂM TRA AN NINH', '#0f172a', '#ffffff', '#38bdf8', '🛡'),
    })
  );
  secSign.position.set(0.6, 3.85, -3.5);
  root.add(secSign);

  // =========================================================================
  // 6. ZONE 3: BOARDING GATE B12 + ERGONOMIC LOUNGE SEATING (RIGHT BACK)
  // =========================================================================
  const podiumBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.06, 1.1), toon(0x1e3a8a));
  podiumBase.position.set(8.2, 0.53, -4.7);
  podiumBase.castShadow = true;
  const podiumTrim = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 1.22), woodMat);
  podiumTrim.position.set(8.2, 1.1, -4.7);
  const gateSign = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 1.1, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeAirportSignTexture('GATE B12', 'TOKYO · JL 752 · BOARDING', '#1d4ed8', '#ffffff', '#facc15', '✈'),
    })
  );
  gateSign.position.set(8.2, 3.8, -4.9);
  root.add(podiumBase, podiumTrim, gateSign);

  // 2 Sleek Rows of Airport Lounge Chairs with Armrests & Charging Table
  const chairMat = toon(0x3b82f6);
  const chairBackMat = toon(0x1d4ed8);
  ([1.8, 3.6] as const).forEach((rz) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.1, 0.16), steelMat);
    beam.position.set(7.4, 0.36, rz);
    root.add(beam);
    for (let i = 0; i < 4; i++) {
      const cx = 5.6 + i * 1.2;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.12, 0.72), chairMat);
      seat.position.set(cx, 0.46, rz);
      seat.castShadow = true;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.64, 0.12), chairBackMat);
      back.position.set(cx, 0.8, rz - 0.3);
      back.rotation.x = -0.12;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.54), steelMat);
      leg.position.set(cx, 0.19, rz);
      root.add(seat, back, leg);
    }
  });

  // =========================================================================
  // 7. ZONE 4: SKY LOUNGE CAFÉ & DUTY-FREE PAVILION (LEFT FRONT CORNER)
  // =========================================================================
  const cafeBody = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.04, 1.5), woodMat);
  cafeBody.position.set(-7.6, 0.52, 8.2);
  cafeBody.castShadow = true;
  const cafeCounterTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 1.66), toon(0xfffbeb));
  cafeCounterTop.position.set(-7.6, 1.08, 8.2);
  const pastryCase = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.62, 0.9),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.36 })
  );
  pastryCase.position.set(-8.7, 1.44, 8.2);
  const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.65), toon(0x475569));
  espresso.position.set(-6.2, 1.46, 8.2);
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 0.18, 2.0),
    new THREE.MeshToonMaterial({ map: makeAwningStripeTexture('#ea580c', '#fff7ed'), gradientMap: toonGradient })
  );
  awning.position.set(-7.6, 2.75, 7.95);
  awning.rotation.x = 0.22;
  const cafeSign = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 1.05, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeAirportSignTexture('SKY CAFÉ', 'ESPRESSO · DUTY-FREE', '#7c2d12', '#fffbeb', '#fbbf24', '☕'),
    })
  );
  cafeSign.position.set(-7.6, 3.65, 8.2);
  root.add(cafeBody, cafeCounterTop, pastryCase, espresso, awning, cafeSign);

  // 2 Cozy Round Bistro Tables beside the Café
  ([-11.0, -3.8] as const).forEach((tx) => {
    const tTop = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 14), toon(0xfffbeb));
    tTop.position.set(tx, 0.78, 7.2);
    const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 0.78, 8), steelMat);
    tLeg.position.set(tx, 0.39, 7.2);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.14, 8), toon(0xf59e0b));
    cup.position.set(tx + 0.15, 0.89, 7.15);
    root.add(tTop, tLeg, cup);
  });

  // =========================================================================
  // 8. ZONE 5: INDOOR ZEN GARDEN TREE + ROTATING BAGGAGE CLAIM CAROUSEL!
  // =========================================================================
  const zenTree = makeIndoorZenTree(toon);
  zenTree.position.set(-10.8, 0, -0.2);
  root.add(zenTree);

  const zenTree2 = makeIndoorZenTree(toon);
  zenTree2.position.set(10.8, 0, -0.2);
  root.add(zenTree2);

  // Rotating Oval Baggage Claim Carousel (Right Front)
  const carouselGroup = new THREE.Group();
  carouselGroup.position.set(7.4, 0, 6.6);
  const carTrack = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.25, 0.36, 20), toon(0x334155));
  carTrack.position.y = 0.18;
  const carCenter = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.75, 16), woodMat);
  carCenter.position.y = 0.38;
  const carSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.9, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeAirportSignTexture('BAGGAGE', 'NHẬN HÀNH LÝ · BELT 1', '#0f766e', '#ffffff', '#5eead4', '🧳'),
    })
  );
  carSign.position.set(0, 2.9, 0);
  const carPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), steelMat);
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

  scene.add(root);

  // Per-frame living airport animations!
  return (elapsed: number) => {
    // 1. Rotating ATC radar dish
    radarDish.rotation.y = elapsed * 1.4;

    // 2. Drifting fluffy clouds
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.g.position.x = ((c.baseX + elapsed * c.speed + 55) % 110) - 55;
    }

    // 3. Second airliner smoothly taxiing & gently climbing across the far runway!
    const cycle = (elapsed * 0.055) % 1;
    taxiPlane.position.x = -46 + cycle * 92;
    const liftT = Math.max(0, (cycle - 0.62) / 0.38);
    taxiPlane.position.y = 1.55 + liftT * liftT * 9.5;
    taxiPlane.rotation.z = liftT * 0.22;

    // 4. Sliding Check-in luggage & Security X-ray tray
    beltSuitcase1.position.x = -4.2 + ((elapsed * 0.38) % 2.1);
    beltSuitcase2.position.x = -4.2 + ((elapsed * 0.38 + 1.05) % 2.1);
    secTray.position.z = -1.7 - ((elapsed * 0.65) % 3.5);

    // 5. Rotating Baggage Claim Carousel suitcases!
    for (let i = 0; i < carouselBags.length; i++) {
      const b = carouselBags[i];
      const a = elapsed * 0.55 + b.angleOffset;
      b.mesh.position.set(Math.cos(a) * 1.65, 0.36, Math.sin(a) * 1.65);
      b.mesh.rotation.y = -a;
    }
  };
}
