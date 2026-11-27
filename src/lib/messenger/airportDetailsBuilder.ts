import * as THREE from 'three';

function roundedRect(w: number, h: number, r: number): THREE.Shape {
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

const airportDetailBevelCache = new Map<string, THREE.BufferGeometry>();

function beveledBox(
  w: number,
  h: number,
  d: number,
  radius = 0.1,
  bevel = 0.025
): THREE.BufferGeometry {
  const isSmall = Math.max(w, h, d) <= 0.7;
  const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}_${radius.toFixed(2)}_${bevel.toFixed(3)}_${isSmall ? 1 : 2}`;
  const cached = airportDetailBevelCache.get(key);
  if (cached) return cached;
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, d, radius), {
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
  airportDetailBevelCache.set(key, geo);
  return geo;
}

function makeCanvasTex(
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

function makeKioskScreenTex(): THREE.CanvasTexture {
  return makeCanvasTex(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#0c1b33';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, w, 54);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✈ SELF CHECK-IN', w / 2, 34);

    // Boarding pass graphic
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(22, 74, w - 44, 118, 12);
    ctx.fill();
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '800 18px monospace';
    ctx.fillText('HUE  ✈  TYO', w / 2, 108);
    ctx.fillStyle = '#475569';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText('FLIGHT JL 752 · GATE B12', w / 2, 134);
    // Mini barcode
    ctx.fillStyle = '#0f172a';
    for (let x = 44; x < w - 44; x += 6) {
      ctx.fillRect(x, 150, (x % 12 === 0 ? 4 : 2), 26);
    }

    // Touch button
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(32, 214, w - 64, 46, 12);
    ctx.fill();
    ctx.fillStyle = '#052e16';
    ctx.font = '900 16px system-ui, sans-serif';
    ctx.fillText('SCAN PASSPORT', w / 2, 243);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText('PRINT BOARDING PASS', w / 2, 290);
  });
}

function makeDirectoryTotemTex(): THREE.CanvasTexture {
  return makeCanvasTex(320, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, w, 68);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TERMINAL 1', w / 2, 32);
    ctx.font = '800 14px system-ui, sans-serif';
    ctx.fillText('INFORMATION & WAYFINDING', w / 2, 54);

    const items = [
      ['←', 'CHECK-IN A–B', 'Quầy làm thủ tục', '#38bdf8'],
      ['↑', 'SECURITY', 'Kiểm tra an ninh', '#4ade80'],
      ['→', 'GATE B12', 'Cổng lên máy bay', '#facc15'],
      ['→', 'DUTY FREE', 'Mua sắm miễn thuế', '#f472b6'],
      ['←', 'SKY CAFÉ', 'Cà phê & Bánh ngọt', '#fb923c'],
      ['←', 'EXCHANGE · ATM', 'Đổi ngoại tệ', '#34d399'],
    ];
    items.forEach(([arrow, en, vi, col], i) => {
      const y = 92 + i * 60;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(16, y, w - 32, 50, 10);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(arrow, 28, y + 33);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 16px system-ui, sans-serif';
      ctx.fillText(en, 62, y + 23);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(vi, 62, y + 41);
    });

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(20, 456, w - 40, 38, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '800 14px system-ui, sans-serif';
    ctx.fillText('📶 FREE WI-FI · SPEAKSHARP_5G', w / 2, 480);
  });
}

function makeOverheadWayfindingTex(): THREE.CanvasTexture {
  return makeCanvasTex(1024, 160, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, h - 10, w, 10);

    // 3 crisp international airport directional zones
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.fillText('← CHECK-IN · CAFÉ', 28, 72);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText('EXCHANGE · SELF CHECK-IN', 66, 114);

    ctx.fillStyle = '#334155';
    ctx.fillRect(365, 24, 3, 104);
    ctx.fillRect(665, 24, 3, 104);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ade80';
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.fillText('↑ SECURITY', 515, 72);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText('ALL GATES · A01–B20', 515, 114);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#facc15';
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.fillText('GATE B12 · DUTY FREE →', w - 28, 72);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText('LOUNGE · BAGGAGE CLAIM', w - 66, 114);
  });
}

function makeExchangeRateTex(): THREE.CanvasTexture {
  return makeCanvasTex(320, 220, (ctx, w, h) => {
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, w, 46);
    ctx.fillStyle = '#052e16';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💱 CURRENCY EXCHANGE', w / 2, 30);

    const rates = [
      ['USD', '25,400', '25,650'],
      ['EUR', '27,300', '27,800'],
      ['JPY', '165', '172'],
      ['SGD', '18,900', '19,350'],
    ];
    ctx.font = '800 17px monospace';
    rates.forEach(([cur, buy, sell], idx) => {
      const y = 82 + idx * 34;
      ctx.fillStyle = idx % 2 === 0 ? '#065f46' : '#047857';
      ctx.fillRect(12, y - 20, w - 24, 28);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fde047';
      ctx.fillText(cur, 22, y);
      ctx.fillStyle = '#ecfdf5';
      ctx.fillText(buy, 102, y);
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText(sell, 212, y);
    });
  });
}

function makeVendingTex(title: string, headerBg: string, isDrinks: boolean): THREE.CanvasTexture {
  return makeCanvasTex(256, 384, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = headerBg;
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 34);

    // Illuminated product window
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(18, 66, w - 36, 232);
    const colors = isDrinks
      ? ['#ef4444', '#38bdf8', '#22c55e', '#f59e0b', '#a855f7']
      : ['#fb923c', '#facc15', '#ec4899', '#60a5fa', '#4ade80'];
    for (let row = 0; row < 4; row++) {
      const sy = 112 + row * 54;
      ctx.fillStyle = '#475569';
      ctx.fillRect(18, sy, w - 36, 6);
      for (let col = 0; col < 5; col++) {
        ctx.fillStyle = colors[(row + col) % colors.length];
        if (isDrinks) {
          ctx.beginPath();
          ctx.roundRect(28 + col * 41, sy - 34, 28, 34, 6);
          ctx.fill();
        } else {
          ctx.fillRect(26 + col * 42, sy - 36, 32, 36);
        }
      }
    }

    // Dispense flap
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(26, 316, w - 52, 48, 8);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 14px system-ui, sans-serif';
    ctx.fillText('TAP CARD · QR PAY', w / 2, 345);
  });
}

function makeFloorDecalTex(label: string, color: string): THREE.CanvasTexture {
  return makeCanvasTex(512, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.font = '900 54px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, w / 2, h / 2);
  });
}

function makeSmallSuitcase(
  colorHex: number,
  toon: (h: number) => THREE.MeshToonMaterial
): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(beveledBox(0.42, 0.56, 0.24, 0.06, 0.02), toon(colorHex));
  body.castShadow = true;
  const band = new THREE.Mesh(beveledBox(0.44, 0.08, 0.26, 0.05, 0.01), toon(0xfef3c7));
  band.position.y = 0.26;
  const handle = new THREE.Mesh(beveledBox(0.22, 0.05, 0.05, 0.015, 0.008), toon(0x1e293b));
  handle.position.set(0, 0.62, 0);
  g.add(body, band, handle);
  return g;
}

/** Chrome airport luggage trolley loaded with stacked colorful suitcases! */
function makeLuggageTrolley(
  toon: (h: number) => THREE.MeshToonMaterial,
  chromeMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const darkMat = toon(0x1e293b);
  const redMat = toon(0xef4444);

  // Base platform
  const deck = new THREE.Mesh(beveledBox(0.66, 0.06, 1.05, 0.06, 0.015), chromeMat);
  deck.position.set(0, 0.14, 0);
  deck.castShadow = true;

  // 3 wheels
  [
    [-0.25, 0.07, -0.36],
    [0.25, 0.07, -0.36],
    [0, 0.07, 0.42],
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10), darkMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    g.add(wheel);
  });

  // Angled push upright poles + red handle bar
  ([-0.26, 0.26] as const).forEach((px) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.96, 8), chromeMat);
    pole.position.set(px, 0.6, 0.36);
    pole.rotation.x = 0.24;
    g.add(pole);
  });
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.62, 10), redMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 1.05, 0.47);

  // Upper wire basket for carry-on
  const basket = new THREE.Mesh(beveledBox(0.52, 0.2, 0.32, 0.04, 0.01), chromeMat);
  basket.position.set(0, 0.72, 0.26);

  // Stacked suitcases on trolley!
  const bag1 = makeSmallSuitcase(0x2563eb, toon);
  bag1.rotation.x = Math.PI / 2;
  bag1.position.set(0, 0.32, -0.05);
  const bag2 = makeSmallSuitcase(0xf59e0b, toon);
  bag2.scale.setScalar(0.84);
  bag2.rotation.x = Math.PI / 2;
  bag2.rotation.z = 0.12;
  bag2.position.set(0, 0.56, -0.08);

  g.add(deck, handleBar, basket, bag1, bag2);
  return g;
}

/** 3-color airport recycling & waste station */
function makeRecyclingStation(
  toon: (h: number) => THREE.MeshToonMaterial,
  steelMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(beveledBox(1.26, 0.86, 0.46, 0.08, 0.02), toon(0xe2e8f0));
  body.castShadow = true;
  const lids = [0x2563eb, 0x16a34a, 0xf59e0b];
  lids.forEach((col, i) => {
    const lid = new THREE.Mesh(beveledBox(0.36, 0.12, 0.42, 0.05, 0.015), toon(col));
    lid.position.set(-0.4 + i * 0.4, 0.84, 0);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.14), steelMat);
    slot.position.set(-0.4 + i * 0.4, 0.96, 0);
    g.add(lid, slot);
  });
  g.add(body);
  return g;
}

/** Cute stylized seated waiting traveler on a Gate B12 lounge chair */
function makeSeatedTraveler(
  shirtHex: number,
  pantsHex: number,
  hairHex: number,
  bagHex: number,
  toon: (h: number) => THREE.MeshToonMaterial
): THREE.Group {
  const g = new THREE.Group();
  const skinMat = toon(0xf6d5b8);
  const shirtMat = toon(shirtHex);
  const pantsMat = toon(pantsHex);
  const hairMat = toon(hairHex);

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.26, 6, 10), shirtMat);
  torso.position.set(0, 0.84, -0.05);
  torso.castShadow = true;

  // Head + hair cap
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), skinMat);
  head.position.set(0, 1.24, -0.02);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.205, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  hair.position.set(0, 1.27, -0.04);

  // Seated thighs + lower legs + shoes
  ([-0.1, 0.1] as const).forEach((lx) => {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.22, 4, 8), pantsMat);
    thigh.rotation.x = Math.PI / 2;
    thigh.position.set(lx, 0.58, 0.12);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.28, 4, 8), pantsMat);
    shin.position.set(lx, 0.34, 0.28);
    const shoe = new THREE.Mesh(beveledBox(0.12, 0.08, 0.18, 0.03, 0.01), toon(0x1e293b));
    shoe.position.set(lx, 0.06, 0.32);
    g.add(thigh, shin, shoe);
  });

  // Holding a glowing smartphone / boarding pass
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.02), new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
  phone.position.set(0.04, 0.86, 0.26);
  phone.rotation.x = -0.45;

  // Carry-on suitcase parked right beside their seat
  const carryOn = makeSmallSuitcase(bagHex, toon);
  carryOn.scale.setScalar(0.86);
  carryOn.position.set(0.48, 0, 0.38);
  carryOn.rotation.y = -0.25;

  g.add(torso, head, hair, phone, carryOn);
  return g;
}

/** Animated yellow tarmac baggage tractor + 2 covered luggage carts outside the glass! */
function makeBaggageTugTrain(toon: (h: number) => THREE.MeshToonMaterial): THREE.Group {
  const train = new THREE.Group();
  const yellowMat = toon(0xfacc15);
  const darkMat = toon(0x1e293b);
  const metalMat = toon(0xcbd5e1);

  // Tractor cab
  const tugBody = new THREE.Mesh(beveledBox(2.2, 0.85, 1.35, 0.16, 0.03), yellowMat);
  tugBody.position.set(0, 0.24, 0);
  const tugCab = new THREE.Mesh(beveledBox(1.15, 0.85, 1.2, 0.1, 0.025), toon(0x38bdf8));
  tugCab.position.set(-0.2, 1.0, 0);
  const tugRoof = new THREE.Mesh(beveledBox(1.25, 0.1, 1.28, 0.08, 0.02), yellowMat);
  tugRoof.position.set(-0.2, 1.82, 0);
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.16, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
  beacon.position.set(-0.2, 1.98, 0);
  train.add(tugBody, tugCab, tugRoof, beacon);

  // 2 towed luggage trailers
  const bagCols = [0xef4444, 0x2563eb, 0x10b981, 0xf97316];
  for (let c = 0; c < 2; c++) {
    const cx = -3.1 - c * 2.8;
    const hitch = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.1), darkMat);
    hitch.position.set(cx + 1.4, 0.32, 0);
    const bed = new THREE.Mesh(beveledBox(2.1, 0.18, 1.32, 0.08, 0.02), metalMat);
    bed.position.set(cx, 0.24, 0);
    const canopy = new THREE.Mesh(beveledBox(2.15, 0.12, 1.36, 0.08, 0.02), toon(0xe2e8f0));
    canopy.position.set(cx, 1.48, 0);
    // 4 corner posts
    ([-0.92, 0.92] as const).forEach((px) => {
      ([-0.56, 0.56] as const).forEach((pz) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.12, 6), darkMat);
        p.position.set(cx + px, 0.94, pz);
        train.add(p);
      });
    });
    // Stacked colorful luggage inside trailer
    for (let b = 0; b < 2; b++) {
      const bag = makeSmallSuitcase(bagCols[(c * 2 + b) % bagCols.length], toon);
      bag.scale.setScalar(1.15);
      bag.position.set(cx - 0.4 + b * 0.8, 0.42, 0);
      train.add(bag);
    }
    train.add(hitch, bed, canopy);
  }
  return train;
}

/**
 * Adds rich international airport terminal storytelling details:
 * - 3 Self-Check-In Kiosks with glowing boarding-pass screens
 * - Digital Wayfinding Directory Totem & Overhead Hanging Wayfinding Sign
 * - Chrome Luggage Trolleys with stacked suitcases
 * - Currency Exchange + Dual ATM Wall Booth & Vending Machines
 * - Duty-Free Boutique Display Showcase with perfume/gift shelves
 * - 3-Color Recycling Stations, Floor Directional Decals, Seated Travelers
 * - Animated Tarmac Baggage Tug Train, Mobile Boarding Stairs & Runway Cones
 */
export function addAirportRichDetails(
  root: THREE.Group,
  toon: (hex: number) => THREE.MeshToonMaterial,
  woodMat: THREE.Material,
  steelMat: THREE.Material,
  chromeMat: THREE.Material
): (elapsed: number) => void {
  // 1. THREE SELF-CHECK-IN BOARDING PASS KIOSKS (Left Mid-Foreground)
  const kioskTex = makeKioskScreenTex();
  const kioskMat = new THREE.MeshBasicMaterial({ map: kioskTex });
  const kioskBodyMat = toon(0x1d4ed8);
  const kioskWhiteMat = toon(0xf8fafc);

  ([-4.4, -3.35, -2.3] as const).forEach((kx) => {
    const kGroup = new THREE.Group();
    const base = new THREE.Mesh(beveledBox(0.68, 0.98, 0.52, 0.08, 0.02), kioskWhiteMat);
    base.castShadow = true;
    const upper = new THREE.Mesh(beveledBox(0.64, 0.82, 0.34, 0.08, 0.02), kioskBodyMat);
    upper.position.set(0, 0.94, -0.06);
    upper.castShadow = true;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), kioskMat);
    scr.position.set(0, 1.38, 0.145); // cleanly outside beveled upper front face!
    const readerPad = new THREE.Mesh(beveledBox(0.46, 0.05, 0.22, 0.03, 0.008), steelMat);
    readerPad.position.set(0, 0.98, 0.16);
    kGroup.add(base, upper, scr, readerPad);
    kGroup.position.set(kx, 0, 2.75);
    root.add(kGroup);
  });

  // 2. DIGITAL WAYFINDING & FLIGHT INFO TOTEM (Foreground Left of Carpet)
  const totemGroup = new THREE.Group();
  const totemBase = new THREE.Mesh(beveledBox(1.12, 0.16, 0.52, 0.12, 0.02), toon(0xd4a24c));
  const totemPillar = new THREE.Mesh(beveledBox(0.96, 2.15, 0.26, 0.1, 0.025), steelMat);
  totemPillar.position.y = 0.14;
  totemPillar.castShadow = true;
  const totemTex = makeDirectoryTotemTex();
  const totemScreenF = new THREE.Mesh(
    new THREE.PlaneGeometry(0.84, 1.62),
    new THREE.MeshBasicMaterial({ map: totemTex })
  );
  totemScreenF.position.set(0, 1.24, 0.165);
  const totemScreenB = totemScreenF.clone();
  totemScreenB.position.z = -0.165;
  totemScreenB.rotation.y = Math.PI;
  totemGroup.add(totemBase, totemPillar, totemScreenF, totemScreenB);
  totemGroup.position.set(-2.3, 0, 5.15);
  totemGroup.rotation.y = 0.22;
  root.add(totemGroup);

  // 3. HANGING OVERHEAD WAYFINDING SIGN (Across Main Concourse!)
  const ohSignGroup = new THREE.Group();
  const ohFrame = new THREE.Mesh(beveledBox(7.8, 1.18, 0.22, 0.08, 0.025), steelMat);
  ohFrame.position.y = 5.15;
  const ohTex = makeOverheadWayfindingTex();
  const ohFaceF = new THREE.Mesh(
    new THREE.PlaneGeometry(7.55, 1.05),
    new THREE.MeshBasicMaterial({ map: ohTex })
  );
  ohFaceF.position.set(0, 5.74, 0.145);
  const ohFaceB = ohFaceF.clone();
  ohFaceB.position.z = -0.145;
  ohFaceB.rotation.y = Math.PI;
  ([-3.1, 3.1] as const).forEach((rx) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6), chromeMat);
    rod.position.set(rx, 6.9, 0);
    ohSignGroup.add(rod);
  });
  ohSignGroup.add(ohFrame, ohFaceF, ohFaceB);
  ohSignGroup.position.set(0, 0, 0.2);
  root.add(ohSignGroup);

  // 4. CHROME LUGGAGE TROLLEYS WITH STACKED SUITCASES
  const trolley1 = makeLuggageTrolley(toon, chromeMat);
  trolley1.position.set(2.55, 0, 5.25);
  trolley1.rotation.y = -0.42;
  const trolley2 = makeLuggageTrolley(toon, chromeMat);
  trolley2.position.set(-10.4, 0, 3.0);
  trolley2.rotation.y = 0.55;
  root.add(trolley1, trolley2);

  // 5. 3-COLOR AIRPORT RECYCLING & WASTE STATIONS
  const bin1 = makeRecyclingStation(toon, steelMat);
  bin1.position.set(2.5, 0, 1.8);
  bin1.rotation.y = -0.18;
  const bin2 = makeRecyclingStation(toon, steelMat);
  bin2.position.set(-11.4, 0, 4.9);
  bin2.rotation.y = Math.PI / 2;
  root.add(bin1, bin2);

  // 6. CURRENCY EXCHANGE & DUAL ATM BOOTH (Left Wall)
  const exGroup = new THREE.Group();
  const exBack = new THREE.Mesh(beveledBox(0.55, 2.6, 3.4, 0.08, 0.025), toon(0x065f46));
  const exBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 1.15),
    new THREE.MeshBasicMaterial({ map: makeExchangeRateTex() })
  );
  exBoard.position.set(0.32, 1.82, -0.65);
  exBoard.rotation.y = Math.PI / 2;
  // 2 sleek ATM kiosks next to rate board
  ([0.55, 1.25] as const).forEach((az) => {
    const atm = new THREE.Mesh(beveledBox(0.52, 1.65, 0.56, 0.06, 0.02), toon(0x1e40af));
    atm.position.set(0.32, 0, az);
    const atmScr = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    atmScr.position.set(0.61, 1.22, az);
    atmScr.rotation.y = Math.PI / 2;
    exGroup.add(atm, atmScr);
  });
  exGroup.add(exBack, exBoard);
  exGroup.position.set(-12.8, 0, 2.9);
  root.add(exGroup);

  // 7. VENDING MACHINE DUO (Cold Drinks & Snacks near Sky Café)
  const vm1 = new THREE.Group();
  const vm1Body = new THREE.Mesh(beveledBox(0.85, 2.1, 1.05, 0.06, 0.02), toon(0xdc2626));
  const vm1Face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 1.85),
    new THREE.MeshBasicMaterial({ map: makeVendingTex('COLD DRINKS', '#b91c1c', true) })
  );
  vm1Face.position.set(0.46, 1.05, 0);
  vm1Face.rotation.y = Math.PI / 2;
  vm1.add(vm1Body, vm1Face);
  vm1.position.set(-12.6, 0, 5.7);

  const vm2 = new THREE.Group();
  const vm2Body = new THREE.Mesh(beveledBox(0.85, 2.1, 1.05, 0.06, 0.02), toon(0x1e3a8a));
  const vm2Face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 1.85),
    new THREE.MeshBasicMaterial({ map: makeVendingTex('SNACKS', '#1d4ed8', false) })
  );
  vm2Face.position.set(0.46, 1.05, 0);
  vm2Face.rotation.y = Math.PI / 2;
  vm2.add(vm2Body, vm2Face);
  vm2.position.set(-12.6, 0, 6.9);
  root.add(vm1, vm2);

  // 8. DUTY-FREE BOUTIQUE SHOWCASE (Right Wall near Gate B12 Lounge)
  const dfGroup = new THREE.Group();
  const dfCase = new THREE.Mesh(beveledBox(0.72, 2.55, 4.4, 0.08, 0.025), woodMat);
  dfCase.castShadow = true;
  const dfHeader = new THREE.Mesh(beveledBox(0.82, 0.56, 4.5, 0.06, 0.02), toon(0x1e293b));
  dfHeader.position.y = 2.48;
  const dfSignTex = makeCanvasTex(512, 96, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#fde047';
    ctx.font = '900 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ DUTY FREE · SOUVENIRS', w / 2, 60);
  });
  const dfSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 0.52),
    new THREE.MeshBasicMaterial({ map: dfSignTex })
  );
  dfSign.position.set(-0.44, 2.76, 0);
  dfSign.rotation.y = -Math.PI / 2;

  // Illuminated boutique shelves stocked with colorful perfume bottles & gift boxes!
  const itemColors = [0xf472b6, 0xfacc15, 0x38bdf8, 0xa78bfa, 0x34d399, 0xfb923c];
  for (let shelf = 0; shelf < 3; shelf++) {
    const sy = 0.65 + shelf * 0.62;
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 4.1), toon(0xfffbeb));
    board.position.set(-0.18, sy, 0);
    dfGroup.add(board);
    for (let item = 0; item < 7; item++) {
      const iz = -1.65 + item * 0.55;
      const col = itemColors[(shelf * 3 + item) % itemColors.length];
      const box =
        item % 2 === 0
          ? new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.26, 8), toon(col))
          : new THREE.Mesh(beveledBox(0.2, 0.24, 0.2, 0.03, 0.008), toon(col));
      box.position.set(-0.28, sy + (item % 2 === 0 ? 0.16 : 0.03), iz);
      dfGroup.add(box);
    }
  }
  dfGroup.add(dfCase, dfHeader, dfSign);
  dfGroup.position.set(12.6, 0, 2.6);
  root.add(dfGroup);

  // 9. FLOOR WAYFINDING DECALS (Crisp Airport Floor Signage!)
  const decalMain = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.66),
    new THREE.MeshBasicMaterial({
      map: makeFloorDecalTex('✈ DEPARTURES ↑', '#1d4ed8'),
      transparent: true,
      depthWrite: false,
    })
  );
  decalMain.rotation.x = -Math.PI / 2;
  decalMain.position.set(0, 0.022, 4.2);

  const decalLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.6),
    new THREE.MeshBasicMaterial({
      map: makeFloorDecalTex('← CHECK-IN', '#1d4ed8'),
      transparent: true,
      depthWrite: false,
    })
  );
  decalLeft.rotation.x = -Math.PI / 2;
  decalLeft.position.set(-4.2, 0.022, 0.2);

  const decalRight = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.6),
    new THREE.MeshBasicMaterial({
      map: makeFloorDecalTex('GATE B12 →', '#1d4ed8'),
      transparent: true,
      depthWrite: false,
    })
  );
  decalRight.rotation.x = -Math.PI / 2;
  decalRight.position.set(4.0, 0.022, 0.2);
  root.add(decalMain, decalLeft, decalRight);

  // 10. SEATED WAITING TRAVELERS ON GATE B12 LOUNGE CHAIRS!
  const seated1 = makeSeatedTraveler(0xe11d48, 0x1e293b, 0x3b2f2a, 0xf59e0b, toon);
  seated1.position.set(5.6, 0, 1.8);
  const seated2 = makeSeatedTraveler(0x0d9488, 0x334155, 0x7c4a2d, 0x38bdf8, toon);
  seated2.position.set(8.0, 0, 3.6);
  root.add(seated1, seated2);

  // 11. TARMAC GROUND SUPPORT LIFE OUTSIDE THE PANORAMIC GLASS!
  // Animated yellow baggage tug + 2 covered luggage carts
  const tugTrain = makeBaggageTugTrain(toon);
  tugTrain.position.set(-14, 0, -14.8);
  root.add(tugTrain);

  // Mobile passenger boarding stairs truck near parked airliner
  const stairsGroup = new THREE.Group();
  const sTruck = new THREE.Mesh(beveledBox(2.8, 0.68, 1.35, 0.1, 0.025), toon(0xf8fafc));
  sTruck.position.y = 0.24;
  const sStripe = new THREE.Mesh(new THREE.BoxGeometry(2.84, 0.18, 1.38), toon(0x2563eb));
  sStripe.position.y = 0.56;
  const sRamp = new THREE.Mesh(beveledBox(2.5, 0.16, 1.05, 0.05, 0.015), toon(0xcbd5e1));
  sRamp.position.set(0.2, 1.6, 0);
  sRamp.rotation.z = 0.62;
  stairsGroup.add(sTruck, sStripe, sRamp);
  stairsGroup.position.set(1.4, 0, -19.2);
  stairsGroup.rotation.y = 0.35;
  root.add(stairsGroup);

  // Orange safety cones & glowing blue taxiway edge lights on tarmac!
  const coneMat = toon(0xf97316);
  const taxiLightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  for (let cx = -18; cx <= 18; cx += 6) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 8), coneMat);
    cone.position.set(cx, 0.2, -13.2);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), taxiLightMat);
    light.position.set(cx + 2, 0.12, -23.5);
    root.add(cone, light);
  }

  return (elapsed: number) => {
    // Gently drive baggage tug train along the apron outside the glass!
    tugTrain.position.x = ((elapsed * 2.1 + 30) % 60) - 30;
  };
}
