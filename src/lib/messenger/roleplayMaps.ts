import * as THREE from 'three';
import type { HairStyle, TopStyle } from './playerController';

export type RoleplayMapId = 'airport' | 'supermarket';

export interface RoleplayReplyChoice {
  en: string;
  vi: string;
  quality: 'best' | 'good' | 'retry';
  xp: number;
  npcFeedback: string;
}

export interface RoleplayQuest {
  stopId: string;
  npcName: string;
  landmark: string;
  checklistTitle: string;
  promptEn: string;
  promptVi: string;
  choices: RoleplayReplyChoice[];
}

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface RoleplayNpcSpec {
  id: string;
  name: string;
  landmark: string;
  x: number;
  z: number;
  facingYaw: number;
  style: {
    hatColor: number;
    shirtColor: number;
    pantsColor: number;
    shoeColor: number;
    bagColor: number;
    hairStyle: HairStyle;
    topStyle: TopStyle;
  };
  quest: RoleplayQuest;
}

export interface StrollerSpec {
  style: RoleplayNpcSpec['style'];
  waypoints: Array<[number, number]>;
  speed: number;
  phase: number;
}

export interface RoleplayMapConfig {
  id: RoleplayMapId;
  title: string;
  subtitle: string;
  skyColor: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  spawn: { x: number; z: number; yaw: number };
  colliders: ColliderBox[];
  npcs: RoleplayNpcSpec[];
  strollers: StrollerSpec[];
  buildScene: (
    scene: THREE.Scene,
    toonGradient: THREE.DataTexture
  ) => (elapsed: number) => void;
}

function makeSignTexture(
  title: string,
  subtitle: string,
  bg: string,
  fg: string,
  accent: string
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.fillStyle = fg;
  ctx.font = '900 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 66);
  ctx.fillStyle = accent;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText(subtitle, 256, 118);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeDepartureBoardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#182433';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#f5bd33';
  ctx.fillRect(0, 0, 512, 46);
  ctx.fillStyle = '#182433';
  ctx.font = '900 24px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('✈  DEPARTURES · CHUYẾN BAY ĐI', 20, 31);

  const rows = [
    ['VN 204', 'HUE → SGN', 'B08', 'ON TIME', '#4ade80'],
    ['JL 752', 'HUE → TOKYO', 'B12', 'BOARDING', '#facc15'],
    ['SQ 183', 'HUE → SINGAPORE', 'A04', 'CHECK-IN', '#38bdf8'],
    ['KE 462', 'HUE → SEOUL', 'B15', 'ON TIME', '#4ade80'],
  ];
  rows.forEach((r, idx) => {
    const y = 84 + idx * 42;
    ctx.fillStyle = idx % 2 === 0 ? '#1f2f42' : '#182433';
    ctx.fillRect(10, y - 24, 492, 36);
    ctx.font = '800 18px monospace';
    ctx.fillStyle = '#fffdf7';
    ctx.fillText(r[0], 20, y);
    ctx.fillText(r[1], 115, y);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(r[2], 315, y);
    ctx.fillStyle = r[4];
    ctx.fillText(r[3], 385, y);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeFloorTexture(c1: string, c2: string, stripe?: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = c2;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillRect(128, 128, 128, 128);
  if (stripe) {
    ctx.strokeStyle = stripe;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 128, 128);
    ctx.strokeRect(128, 128, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 10);
  tex.needsUpdate = true;
  return tex;
}

function addPottedPlant(
  parent: THREE.Group,
  x: number,
  z: number,
  toon: (hex: number) => THREE.MeshToonMaterial
) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.45, 8), toon(0xd68c5e));
  pot.position.y = 0.225;
  const bush1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), toon(0x4ea86d));
  bush1.position.y = 0.68;
  const bush2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), toon(0x63bf7f));
  bush2.position.set(0.18, 0.9, 0.1);
  g.add(pot, bush1, bush2);
  g.position.set(x, 0, z);
  parent.add(g);
}

// ============================================================================
// MAP 3: SPEAKSHARP INTERNATIONAL AIRPORT (SÂN BAY QUỐC TẾ)
// ============================================================================
const AIRPORT_NPCS: RoleplayNpcSpec[] = [
  {
    id: 'airport-checkin',
    name: 'Agent Maya',
    landmark: 'Check-in Counter',
    x: -7.2,
    z: -3.2,
    facingYaw: 0,
    style: {
      hatColor: 0x26354d,
      shirtColor: 0x2f5f9e,
      pantsColor: 0x1f2d42,
      shoeColor: 0x1c2128,
      bagColor: 0xd4a24c,
      hairStyle: 'buns',
      topStyle: 'coat',
    },
    quest: {
      stopId: 'airport-checkin',
      npcName: 'Agent Maya (Check-in)',
      landmark: 'Check-in Counter',
      checklistTitle: 'Làm thủ tục Check-in & chọn ghế ngồi',
      promptEn:
        'Good morning! Welcome to SpeakSharp Airlines. May I see your passport, and would you prefer a window or an aisle seat?',
      promptVi:
        'Chào buổi sáng! Chào mừng đến SpeakSharp Airlines. Cho tôi xem hộ chiếu nhé, bạn thích ghế cạnh cửa sổ hay lối đi?',
      choices: [
        {
          en: 'Good morning! Here is my passport. I would love a window seat, please.',
          vi: 'Chào buổi sáng! Đây là hộ chiếu của tôi. Cho tôi xin ghế cạnh cửa sổ nhé.',
          quality: 'best',
          xp: 35,
          npcFeedback:
            'Wonderful polite English! Here is your boarding pass for Gate B12. Have a great flight!',
        },
        {
          en: 'Here is my passport. An aisle seat is fine, thank you.',
          vi: 'Đây là hộ chiếu của tôi. Ghế cạnh lối đi cũng được, cảm ơn bạn.',
          quality: 'good',
          xp: 25,
          npcFeedback: 'Clear and friendly! You are all checked in for Gate B12!',
        },
        {
          en: 'Give me window.',
          vi: 'Đưa tôi cửa sổ. (Hơi ngắn & thiếu lịch sự)',
          quality: 'retry',
          xp: 0,
          npcFeedback: 'Tip: Try saying "I would like a window seat, please!" to sound polite at an airport!',
        },
      ],
    },
  },
  {
    id: 'airport-security',
    name: 'Officer Liam',
    landmark: 'Security Checkpoint',
    x: 0.4,
    z: -2.0,
    facingYaw: 0,
    style: {
      hatColor: 0x1e293b,
      shirtColor: 0x3b4d63,
      pantsColor: 0x1e293b,
      shoeColor: 0x141920,
      bagColor: 0x334155,
      hairStyle: 'cap',
      topStyle: 'coat',
    },
    quest: {
      stopId: 'airport-security',
      npcName: 'Officer Liam (An ninh)',
      landmark: 'Security Checkpoint',
      checklistTitle: 'Qua cửa kiểm tra an ninh sân bay',
      promptEn:
        'Hello traveler! Before going through the scanner, do you have any liquids or a laptop inside your backpack?',
      promptVi:
        'Chào hành khách! Trước khi qua máy soi, trong ba lô của bạn có chất lỏng hay máy tính xách tay không?',
      choices: [
        {
          en: 'Yes, I have a laptop in my bag. Should I place it in a separate tray?',
          vi: 'Vâng, tôi có laptop trong túi. Tôi có cần để riêng ra khay không?',
          quality: 'best',
          xp: 35,
          npcFeedback:
            'Spot on! Yes, please put your laptop in a separate tray. Smooth security check!',
        },
        {
          en: 'No liquids, only my jacket and notebook. Everything is ready!',
          vi: 'Không có chất lỏng, chỉ có áo khoác và sổ tay. Mọi thứ đã sẵn sàng!',
          quality: 'good',
          xp: 25,
          npcFeedback: 'Great answer! You may walk right through the gate.',
        },
        {
          en: 'I don’t know.',
          vi: 'Tôi không biết. (Hãy trả lời cụ thể hơn nhé)',
          quality: 'retry',
          xp: 0,
          npcFeedback: 'Tip: Tell the officer clearly whether you have a laptop or liquids in your bag!',
        },
      ],
    },
  },
  {
    id: 'airport-gate',
    name: 'Chloe (Gate B12)',
    landmark: 'Boarding Gate B12',
    x: 8.0,
    z: -3.2,
    facingYaw: -0.35,
    style: {
      hatColor: 0x4b3832,
      shirtColor: 0xc95252,
      pantsColor: 0x26313d,
      shoeColor: 0x242a32,
      bagColor: 0x8c6d46,
      hairStyle: 'bob',
      topStyle: 'coat',
    },
    quest: {
      stopId: 'airport-gate',
      npcName: 'Chloe (Cổng lên máy bay)',
      landmark: 'Boarding Gate B12',
      checklistTitle: 'Hỏi giờ lên máy bay tại Cổng B12',
      promptEn:
        'Welcome to Gate B12 for Flight JL 752 to Tokyo! May I help you with your boarding time or seat number?',
      promptVi:
        'Chào mừng đến Cổng B12 chuyến bay JL 752 đi Tokyo! Tôi có thể giúp bạn xem giờ lên máy bay hay số ghế không?',
      choices: [
        {
          en: 'Excuse me, what time does boarding start, and is the flight on time?',
          vi: 'Xin lỗi, mấy giờ bắt đầu lên máy bay và chuyến bay có đúng giờ không?',
          quality: 'best',
          xp: 35,
          npcFeedback:
            'Natural airport English! Boarding starts in 15 minutes and we are right on schedule!',
        },
        {
          en: 'Could you check my boarding pass? Is this the right gate for Tokyo?',
          vi: 'Bạn xem giúp thẻ lên máy bay nhé? Đây có phải đúng cổng đi Tokyo không?',
          quality: 'good',
          xp: 25,
          npcFeedback: 'Yes, you are at the exact right gate! Enjoy your trip to Tokyo!',
        },
        {
          en: 'Plane when?',
          vi: 'Máy bay khi nào? (Nên dùng câu hỏi đầy đủ)',
          quality: 'retry',
          xp: 0,
          npcFeedback: 'Tip: Try asking "What time does boarding start?" for clear English!',
        },
      ],
    },
  },
  {
    id: 'airport-cafe',
    name: 'Barista Leo',
    landmark: 'Airport Café & Duty-Free',
    x: -6.2,
    z: 4.5,
    facingYaw: 2.8,
    style: {
      hatColor: 0x3f2e26,
      shirtColor: 0x458b67,
      pantsColor: 0x383e46,
      shoeColor: 0x2e2622,
      bagColor: 0xb58a5e,
      hairStyle: 'headphones',
      topStyle: 'tee',
    },
    quest: {
      stopId: 'airport-cafe',
      npcName: 'Barista Leo (Quầy Café)',
      landmark: 'Airport Café & Duty-Free',
      checklistTitle: 'Gọi đồ uống trước khi lên máy bay',
      promptEn:
        'Hey there! Welcome to Sky Lounge Café. Would you like a warm drink or a quick snack before your flight?',
      promptVi:
        'Chào bạn! Chào mừng đến Sky Lounge Café. Bạn có muốn gọi đồ uống nóng hay đồ ăn nhẹ trước chuyến bay không?',
      choices: [
        {
          en: 'Could I have an iced latte and a croissant to go, please? Can I pay by card?',
          vi: 'Cho tôi 1 ly latte đá và 1 bánh sừng bò mang đi nhé? Tôi trả thẻ được không?',
          quality: 'best',
          xp: 35,
          npcFeedback:
            'Awesome! "To go" and "pay by card" sound super natural. Coming right up!',
        },
        {
          en: 'I would like a bottle of water and a sandwich, please.',
          vi: 'Tôi muốn gọi 1 chai nước và 1 bánh mì kẹp, làm ơn.',
          quality: 'good',
          xp: 25,
          npcFeedback: 'Great polite order! That will be 5 dollars. Safe travels!',
        },
        {
          en: 'Water now.',
          vi: 'Nước ngay. (Hãy thêm "please" cho lịch sự nhé)',
          quality: 'retry',
          xp: 0,
          npcFeedback: 'Tip: Use "Could I have..." or "I would like..., please!" when ordering!',
        },
      ],
    },
  },
];

function buildAirportScene(scene: THREE.Scene, toonGradient: THREE.DataTexture) {
  const root = new THREE.Group();
  const toon = (hex: number) => new THREE.MeshToonMaterial({ color: hex, gradientMap: toonGradient });

  // 1. Terrazzo terminal floor + sky-blue guide path
  const floorTex = makeFloorTexture('#f6f3ea', '#ede8da', '#ded8c8');
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 24),
    new THREE.MeshToonMaterial({ map: floorTex, gradientMap: toonGradient })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const guidePath = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 1.8),
    new THREE.MeshBasicMaterial({ color: 0xbae6fd })
  );
  guidePath.rotation.x = -Math.PI / 2;
  guidePath.position.set(0, 0.015, 0.5);
  root.add(guidePath);

  // 2. Back panoramic glass wall overlooking tarmac & runway!
  const wallMat = toon(0xf1ece1);
  const frameMat = toon(0x3a4a5c);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 22), wallMat);
  leftWall.position.set(-13.2, 3.1, 0);
  const rightWall = leftWall.clone();
  rightWall.position.x = 13.2;
  root.add(leftWall, rightWall);

  // Panoramic window columns + tinted glass panes
  const glassMat = new THREE.MeshBasicMaterial({
    color: 0xa5e6f5,
    transparent: true,
    opacity: 0.24,
  });
  const glassWall = new THREE.Mesh(new THREE.PlaneGeometry(26, 5.6), glassMat);
  glassWall.position.set(0, 3.0, -10.5);
  root.add(glassWall);
  for (let px = -12; px <= 12; px += 4) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.24, 6.0, 0.26), frameMat);
    mullion.position.set(px, 3.0, -10.5);
    root.add(mullion);
  }
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.45, 0.45), frameMat);
  topBeam.position.set(0, 5.9, -10.5);
  root.add(topBeam);

  // Outside runway tarmac + dashed center line + Animated Pastel Airplane!
  const tarmac = new THREE.Mesh(new THREE.PlaneGeometry(60, 26), toon(0x64748b));
  tarmac.rotation.x = -Math.PI / 2;
  tarmac.position.set(0, -0.05, -24);
  root.add(tarmac);
  for (let dx = -22; dx <= 22; dx += 4.5) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.35),
      new THREE.MeshBasicMaterial({ color: 0xfefce8 })
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(dx, -0.02, -21);
    root.add(dash);
  }

  // Stylized Anime Passenger Airplane outside the window!
  const planeGroup = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 8.2, 12), toon(0xfffdf7));
  fuselage.rotation.z = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), toon(0xfffdf7));
  nose.scale.set(1.5, 1, 1);
  nose.position.x = 4.1;
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.22), toon(0x38bdf8));
  tailFin.position.set(-3.8, 1.3, 0);
  tailFin.rotation.z = 0.28;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 8.8), toon(0xe2e8f0));
  wing.position.set(0.3, -0.2, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.26, 1.84), toon(0x2563eb));
  stripe.position.y = 0.1;
  planeGroup.add(fuselage, nose, tailFin, wing, stripe);
  planeGroup.position.set(-6, 1.6, -18.5);
  root.add(planeGroup);

  // 3. Check-in Counter Zone (Left Back)
  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.05, 1.35), toon(0xf8fafc));
  counterBase.position.set(-7.2, 0.525, -4.6);
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.12, 1.5), toon(0x2563eb));
  counterTop.position.set(-7.2, 1.08, -4.6);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.1), toon(0x334155));
  belt.position.set(-3.6, 0.15, -4.6);
  const suitcase1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.78, 0.36), toon(0xef4444));
  suitcase1.position.set(-3.7, 0.68, -4.6);
  const suitcase2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 0.34), toon(0xf5bd33));
  suitcase2.position.set(-9.6, 0.31, -3.4);
  root.add(counterBase, counterTop, belt, suitcase1, suitcase2);

  // Overhead Departures Board + Check-in Sign
  const depBoard = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 2.1, 0.18),
    new THREE.MeshBasicMaterial({ map: makeDepartureBoardTexture() })
  );
  depBoard.position.set(-7.2, 3.6, -5.2);
  root.add(depBoard);

  // 4. Security Checkpoint Zone (Center)
  const archL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.5, 0.6), toon(0xcbd5e1));
  archL.position.set(-0.9, 1.25, -3.5);
  const archR = archL.clone();
  archR.position.x = 0.9;
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.32, 0.62), toon(0x1e293b));
  archTop.position.set(0, 2.55, -3.5);
  const greenLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.12, 0.65),
    new THREE.MeshBasicMaterial({ color: 0x4ade80 })
  );
  greenLight.position.set(0, 2.55, -3.5);
  const xrayTunnel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.15, 2.2), toon(0x475569));
  xrayTunnel.position.set(2.3, 0.58, -3.5);
  const secSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.95, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture('SECURITY', 'KIỂM TRA AN NINH', '#1e293b', '#ffffff', '#38bdf8'),
    })
  );
  secSign.position.set(0.5, 3.65, -3.5);
  root.add(archL, archR, archTop, greenLight, xrayTunnel, secSign);

  // 5. Boarding Gate B12 + Lounge Chairs (Right Back)
  const podium = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.0), toon(0x1e3a8a));
  podium.position.set(8.2, 0.55, -4.6);
  const gateSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.0, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture('GATE B12', 'TOKYO · BOARDING', '#1d4ed8', '#ffffff', '#facc15'),
    })
  );
  gateSign.position.set(8.2, 3.6, -4.8);
  root.add(podium, gateSign);

  // Waiting lounge chairs row
  for (let i = 0; i < 4; i++) {
    const chair = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.72), toon(0x3b82f6));
    seat.position.y = 0.45;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.14), toon(0x2563eb));
    back.position.set(0, 0.78, -0.32);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.55), toon(0x475569));
    leg.position.y = 0.22;
    chair.add(seat, back, leg);
    chair.position.set(5.4 + i * 1.15, 0, 3.6);
    root.add(chair);
  }

  // 6. Airport Café & Duty-Free Kiosk (Left Front)
  const cafeCounter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.05, 1.4), toon(0xfef3c7));
  cafeCounter.position.set(-6.5, 0.525, 6.2);
  const cafeTop = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 1.55), toon(0xb45309));
  cafeTop.position.set(-6.5, 1.08, 6.2);
  const awning = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.22, 1.8), toon(0xea580c));
  awning.position.set(-6.5, 2.7, 6.0);
  awning.rotation.x = 0.18;
  const cafeSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.95, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture('SKY CAFÉ', 'COFFEE & DUTY-FREE', '#7c2d12', '#fffbeb', '#fbbf24'),
    })
  );
  cafeSign.position.set(-6.5, 3.55, 6.2);
  root.add(cafeCounter, cafeTop, awning, cafeSign);

  addPottedPlant(root, -11.4, -7.8, toon);
  addPottedPlant(root, 11.4, -7.8, toon);
  addPottedPlant(root, -11.4, 7.6, toon);
  addPottedPlant(root, 11.4, 7.6, toon);

  scene.add(root);

  return (elapsed: number) => {
    // Gently taxi the pastel airplane across the runway outside the glass wall!
    planeGroup.position.x = ((elapsed * 1.2 + 22) % 44) - 22;
    planeGroup.position.y = 1.6 + Math.sin(elapsed * 2.2) * 0.04;
  };
}

// ============================================================================
// MAP 4: SPEAKSHARP SUPERMARKET FRESH MART (SIÊU THỊ QUỐC TẾ)
// ============================================================================
const SUPERMARKET_NPCS: RoleplayNpcSpec[] = [
  {
    id: 'mart-produce',
    name: 'Clerk Emma',
    landmark: 'Fresh Produce Island',
    x: -6.8,
    z: -2.4,
    facingYaw: 0.2,
    style: {
      hatColor: 0x3b2f2a,
      shirtColor: 0x3f915e,
      pantsColor: 0x2f3c46,
      shoeColor: 0x262c34,
      bagColor: 0xd4a24c,
      hairStyle: 'strawhat',
      topStyle: 'tee',
    },
    quest: {
      stopId: 'mart-produce',
      npcName: 'Clerk Emma (Quầy Rau Củ)',
      landmark: 'Fresh Produce Island',
      checklistTitle: 'Hỏi giá & mua trái cây tươi bằng tiếng Anh',
      promptEn:
        'Hi there! Welcome to Fresh Mart! Our organic apples and sweet mangoes just arrived today. How much would you like?',
      promptVi:
        'Chào bạn! Chào mừng đến Fresh Mart! Táo hữu cơ và xoài ngọt vừa về hôm nay. Bạn muốn mua bao nhiêu?',
      choices: [
        {
          en: 'Excuse me, how much are these apples per kilogram? I would like one kilo, please.',
          vi: 'Xin lỗi, táo này bao nhiêu một ký ạ? Cho tôi mua 1 ký nhé.',
          quality: 'best',
          xp: 35,
          npcFeedback:
            'Perfect shopping English! They are 3 dollars per kilo. Let me weigh a fresh bag for you!',
        },
        {
          en: 'Could I have two mangoes and some bananas, please?',
          vi: 'Cho tôi 2 quả xoài và một ít chuối nhé.',
          quality: 'good',
          xp: 25,
          npcFeedback: 'Great polite choice! Here are the sweetest mangoes we have today!',
        },
        {
          en: 'Apple price?',
          vi: 'Giá táo? (Nên hỏi thành câu hoàn chỉnh nhé)',
          quality: 'retry',
          xp: 0,
          npcFeedback: 'Tip: Ask "How much are these apples, please?" to sound natural!',
        },
      ],
    },
  },
  {
    id: 'mart-bakery',
    name: 'Baker Ken',
    landmark: 'Fresh Bakery Counter',
    x: 7.2,
    z: -3.2,
    facingYaw: -0.3,
    style: {
      hatColor: 0xf5f1e6,
      shirtColor: 0xd97745,
      pantsColor: 0x3b444e,
      shoeColor: 0x3c312b,
      bagColor: 0xa67c52,
      hairStyle: 'cap',
      topStyle: 'coat',
    },
    quest: {
      stopId: 'mart-bakery',
      npcName: 'Baker Ken (Quầy Bánh Nướng)',
      landmark: 'Fresh Bakery Counter',
      checklistTitle: 'Đặt bánh nướng & hỏi thành phần',
      promptEn:
        'Smell that? Fresh butter croissants and baguettes just came out of the oven! Which pastry would you like to try?',
      promptVi:
        'Thơm quá phải không? Bánh sừng bò bơ và bánh mì baguette vừa ra lò! Bạn muốn thử loại bánh nào?',
      choices: [
        {
          en: 'They smell delicious! Do these croissants contain any nuts? I would like two, please.',
          vi: 'Thơm quá! Bánh sừng bò này có hạt không ạ? Cho tôi 2 cái nhé.',
          quality: 'best',
          xp: 35,
          npcFeedback:
            'Super smart question about allergies! No nuts at all—here are two warm croissants!',
        },
        {
          en: 'I would love one fresh baguette and a chocolate muffin, please.',
          vi: 'Tôi muốn 1 ổ baguette mới ra lò và 1 bánh muffin sô-cô-la nhé.',
          quality: 'good',
          xp: 25,
          npcFeedback: 'Wonderful order! Let me pack them in a warm paper bag for you.',
        },
        {
          en: 'Want bread.',
          vi: 'Muốn bánh mì. (Thử dùng "I would like..." nhé)',
          quality: 'retry',
          xp: 0,
          npcFeedback: 'Tip: Say "I would like one baguette, please!" to order politely!',
        },
      ],
    },
  },
  {
    id: 'mart-aisle',
    name: 'Helper Noah',
    landmark: 'Grocery Aisles',
    x: 0.2,
    z: 2.2,
    facingYaw: 0,
    style: {
      hatColor: 0x2e3c4c,
      shirtColor: 0x2563eb,
      pantsColor: 0x1e293b,
      shoeColor: 0x1c2128,
      bagColor: 0x475569,
      hairStyle: 'bob',
      topStyle: 'tee',
    },
    quest: {
      stopId: 'mart-aisle',
      npcName: 'Helper Noah (Nhân viên kệ hàng)',
      landmark: 'Grocery Aisles',
      checklistTitle: 'Hỏi tìm vị trí món đồ trong siêu thị',
      promptEn:
        'Hello! Looking for something specific? I can help you find any snacks, drinks, or milk in our aisles!',
      promptVi:
        'Xin chào! Bạn đang tìm món gì đặc biệt không? Tôi có thể chỉ giúp kệ đồ ăn vặt, nước uống hay sữa!',
      choices: [
        {
          en: 'Excuse me, where can I find fresh milk and orange juice? Are there any discounts today?',
          vi: 'Xin lỗi, tôi có thể tìm sữa tươi và nước cam ở đâu? Hôm nay có giảm giá không?',
          quality: 'best',
          xp: 35,
          npcFeedback:
            'Awesome real-life question! Right behind you on Aisle 2—and orange juice is 20% off today!',
        },
        {
          en: 'Could you show me where the cereal and healthy snacks are?',
          vi: 'Bạn chỉ giúp tôi kệ ngũ cốc và đồ ăn vặt lành mạnh ở đâu nhé?',
          quality: 'good',
          xp: 25,
          npcFeedback: 'Of course! Second shelf on your left—enjoy shopping!',
        },
        {
          en: 'Where milk?',
          vi: 'Sữa đâu? (Thử nói "Excuse me, where can I find...?" nhé)',
          quality: 'retry',
          xp: 0,
          npcFeedback: 'Tip: Start with "Excuse me, where can I find...?" for polite English!',
        },
      ],
    },
  },
  {
    id: 'mart-checkout',
    name: 'Cashier Sophia',
    landmark: 'Checkout Lane',
    x: -5.4,
    z: 5.2,
    facingYaw: 3.14,
    style: {
      hatColor: 0x4d3430,
      shirtColor: 0xe05d4f,
      pantsColor: 0x26313d,
      shoeColor: 0x242a32,
      bagColor: 0xf5bd33,
      hairStyle: 'headphones',
      topStyle: 'coat',
    },
    quest: {
      stopId: 'mart-checkout',
      npcName: 'Cashier Sophia (Thu ngân)',
      landmark: 'Checkout Lane',
      checklistTitle: 'Thanh toán & xin hóa đơn tại quầy thu ngân',
      promptEn:
        'Hi! Did you find everything you needed today? Would you like a reusable shopping bag, and how will you be paying?',
      promptVi:
        'Chào bạn! Hôm nay bạn tìm đủ đồ chưa? Bạn có cần túi tái sử dụng không và muốn thanh toán bằng cách nào?',
      choices: [
        {
          en: 'Yes, thank you! I brought my own reusable bag. I will pay by card—may I have a receipt, please?',
          vi: 'Rồi cảm ơn bạn! Tôi có mang túi tái sử dụng. Tôi trả bằng thẻ — cho tôi xin hóa đơn nhé!',
          quality: 'best',
          xp: 35,
          npcFeedback:
            'Eco-friendly AND fluent English! Here is your receipt—have a wonderful day!',
        },
        {
          en: 'Everything was great! I will pay in cash, and yes, one bag please.',
          vi: 'Mọi thứ rất tốt! Tôi trả tiền mặt và cho tôi xin 1 túi nhé.',
          quality: 'good',
          xp: 25,
          npcFeedback: 'Thank you so much! Here is your change and receipt!',
        },
        {
          en: 'Pay card.',
          vi: 'Trả thẻ. (Hãy nói đầy đủ cả câu nhé)',
          quality: 'retry',
          xp: 0,
          npcFeedback: 'Tip: Try saying "I will pay by card, please!"',
        },
      ],
    },
  },
];

function buildSupermarketScene(scene: THREE.Scene, toonGradient: THREE.DataTexture) {
  const root = new THREE.Group();
  const toon = (hex: number) => new THREE.MeshToonMaterial({ color: hex, gradientMap: toonGradient });

  // 1. Bright cream-and-mint checkered floor
  const floorTex = makeFloorTexture('#fdfbf4', '#e8f5ee', '#d4e8dc');
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 24),
    new THREE.MeshToonMaterial({ map: floorTex, gradientMap: toonGradient })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Cozy pastel walls
  const wallMat = toon(0xfef9ec);
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(26, 5.8, 0.5), wallMat);
  backWall.position.set(0, 2.9, -10.2);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.8, 22), wallMat);
  leftWall.position.set(-12.2, 2.9, 0);
  const rightWall = leftWall.clone();
  rightWall.position.x = 12.2;
  root.add(backWall, leftWall, rightWall);

  // Overhead Fresh Mart Welcome Banner
  const mainBanner = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 1.35, 0.16),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture('FRESH MART 🛒', 'SPEAKSHARP SUPERMARKET', '#15803d', '#ffffff', '#facc15'),
    })
  );
  mainBanner.position.set(0, 4.4, -9.85);
  root.add(mainBanner);

  // 2. Fresh Produce Island (Left Back)
  const produceTable = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 2.2), toon(0xb58a5e));
  produceTable.position.set(-6.8, 0.45, -4.4);
  root.add(produceTable);
  const fruitColors = [0xef4444, 0xf97316, 0x84cc16, 0xfacc15];
  for (let i = 0; i < 4; i++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 1.4), toon(0x8c6239));
    crate.position.set(-8.5 + i * 1.15, 1.02, -4.4);
    root.add(crate);
    for (let f = 0; f < 4; f++) {
      const fruit = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), toon(fruitColors[i]));
      fruit.position.set(-8.7 + i * 1.15 + (f % 2) * 0.34, 1.22, -4.65 + Math.floor(f / 2) * 0.48);
      root.add(fruit);
    }
  }
  const produceSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.95, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture('FRESH PRODUCE', 'RAU CỦ & TRÁI CÂY', '#166534', '#ffffff', '#86efac'),
    })
  );
  produceSign.position.set(-6.8, 3.2, -4.4);
  root.add(produceSign);

  // 3. Cozy Bakery Counter (Right Back)
  const bakeryBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.05, 1.5), toon(0xfef3c7));
  bakeryBase.position.set(7.2, 0.525, -4.8);
  const glassCase = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.72, 1.1),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.35 })
  );
  glassCase.position.set(7.2, 1.4, -4.8);
  const bakeryAwning = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.24, 1.8), toon(0xd97706));
  bakeryAwning.position.set(7.2, 2.7, -4.6);
  bakeryAwning.rotation.x = 0.2;
  root.add(bakeryBase, glassCase, bakeryAwning);
  for (let b = 0; b < 5; b++) {
    const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), toon(0xd98a3c));
    loaf.scale.set(1.5, 0.75, 0.9);
    loaf.position.set(5.4 + b * 0.9, 1.18, -4.8);
    root.add(loaf);
  }
  const bakerySign = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.95, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture('FRESH BAKERY', 'BÁNH NƯỚNG MỚI RA LÒ', '#92400e', '#fffbeb', '#fbbf24'),
    })
  );
  bakerySign.position.set(7.2, 3.5, -4.8);
  root.add(bakerySign);

  // 4. Center Grocery Shelving Aisles (stocked with colorful boxes!)
  const shelfMat = toon(0xe2e8f0);
  const boxColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981, 0xec4899, 0x8b5cf6];
  ([-3.0, 3.0] as const).forEach((sx, sIdx) => {
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 5.2), shelfMat);
    rack.position.set(sx, 1.1, 0.8);
    root.add(rack);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1.18, 0.42, 0.65),
          toon(boxColors[(row * 5 + col + sIdx * 2) % boxColors.length])
        );
        box.position.set(sx, 0.48 + row * 0.68, -1.0 + col * 0.92);
        root.add(box);
      }
    }
  });
  const aisleSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.92, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture('AISLE 2 · DRINKS', 'SỮA & ĐỒ ĂN VẶT', '#1d4ed8', '#ffffff', '#93c5fd'),
    })
  );
  aisleSign.position.set(0, 3.4, 0.8);
  root.add(aisleSign);

  // 5. Checkout Lanes + Shopping Carts (Left Front)
  const checkCounter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.0, 1.3), toon(0x38bdf8));
  checkCounter.position.set(-5.4, 0.5, 6.8);
  const checkBelt = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.9), toon(0x1e293b));
  checkBelt.position.set(-6.0, 1.04, 6.8);
  const register = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.55), toon(0xf8fafc));
  register.position.set(-3.9, 1.28, 6.8);
  const checkSign = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.92, 0.14),
    new THREE.MeshBasicMaterial({
      map: makeSignTexture('CHECKOUT', 'QUẦY THANH TOÁN', '#0f766e', '#ffffff', '#5eead4'),
    })
  );
  checkSign.position.set(-5.4, 3.2, 6.8);
  root.add(checkCounter, checkBelt, register, checkSign);

  // Cute pastel shopping carts parked on the right front!
  for (let c = 0; c < 3; c++) {
    const cart = new THREE.Group();
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.48, 0.95), toon(0x94a3b8));
    basket.position.y = 0.55;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 0.08), toon(0xef4444));
    handle.position.set(0, 0.84, 0.48);
    cart.add(basket, handle);
    cart.position.set(5.4 + c * 1.15, 0, 7.2);
    root.add(cart);
  }

  addPottedPlant(root, -10.8, -8.5, toon);
  addPottedPlant(root, 10.8, -8.5, toon);
  addPottedPlant(root, 10.8, 7.6, toon);

  scene.add(root);

  // Subtle gentle bob on the hanging signs
  return (elapsed: number) => {
    aisleSign.position.y = 3.4 + Math.sin(elapsed * 1.6) * 0.03;
  };
}

export const ROLEPLAY_MAPS: Record<RoleplayMapId, RoleplayMapConfig> = {
  airport: {
    id: 'airport',
    title: '✈️ Sân bay Quốc tế',
    subtitle: 'SpeakSharp International Airport',
    skyColor: '#7dd3fc',
    bounds: { minX: -12.2, maxX: 12.2, minZ: -9.2, maxZ: 9.2 },
    spawn: { x: 0, z: 6.2, yaw: Math.PI },
    colliders: [
      { minX: -10.3, maxX: -2.4, minZ: -5.5, maxZ: -3.7 }, // Check-in counter + belt
      { minX: 1.4, maxX: 3.2, minZ: -4.8, maxZ: -2.2 }, // Security X-ray
      { minX: 6.9, maxX: 9.5, minZ: -5.3, maxZ: -3.9 }, // Gate B12 podium
      { minX: -8.9, maxX: -4.1, minZ: 5.3, maxZ: 7.1 }, // Airport Café
      { minX: 4.8, maxX: 9.6, minZ: 3.1, maxZ: 4.1 }, // Lounge chairs
    ],
    npcs: AIRPORT_NPCS,
    strollers: [
      {
        style: {
          hatColor: 0x384654,
          shirtColor: 0x4b87a8,
          pantsColor: 0x2d3a46,
          shoeColor: 0x232930,
          bagColor: 0xc29248,
          hairStyle: 'bob',
          topStyle: 'coat',
        },
        waypoints: [
          [-9.5, 0.5],
          [3.5, 0.5],
          [4.5, -1.5],
          [-5.5, -1.5],
        ],
        speed: 1.55,
        phase: 0.4,
      },
      {
        style: {
          hatColor: 0x4f3d35,
          shirtColor: 0xd9895b,
          pantsColor: 0x303a45,
          shoeColor: 0x252c34,
          bagColor: 0x6e4a32,
          hairStyle: 'strawhat',
          topStyle: 'tee',
        },
        waypoints: [
          [9.8, 0.8],
          [9.8, 6.2],
          [1.8, 6.2],
          [1.8, 1.2],
        ],
        speed: 1.45,
        phase: 2.6,
      },
    ],
    buildScene: buildAirportScene,
  },
  supermarket: {
    id: 'supermarket',
    title: '🛒 Siêu thị Fresh Mart',
    subtitle: 'SpeakSharp International Supermarket',
    skyColor: '#d1fae5',
    bounds: { minX: -11.2, maxX: 11.2, minZ: -9.0, maxZ: 9.0 },
    spawn: { x: 0, z: 7.4, yaw: Math.PI },
    colliders: [
      { minX: -9.4, maxX: -4.2, minZ: -5.7, maxZ: -3.1 }, // Produce island
      { minX: 4.6, maxX: 9.8, minZ: -5.8, maxZ: -3.8 }, // Bakery counter
      { minX: -3.7, maxX: -2.3, minZ: -2.0, maxZ: 3.6 }, // Left grocery aisle
      { minX: 2.3, maxX: 3.7, minZ: -2.0, maxZ: 3.6 }, // Right grocery aisle
      { minX: -7.8, maxX: -3.0, minZ: 6.0, maxZ: 7.6 }, // Checkout counter
    ],
    npcs: SUPERMARKET_NPCS,
    strollers: [
      {
        style: {
          hatColor: 0x47353c,
          shirtColor: 0xd46a84,
          pantsColor: 0x323d4a,
          shoeColor: 0x2a3038,
          bagColor: 0x74b589,
          hairStyle: 'buns',
          topStyle: 'tee',
        },
        waypoints: [
          [-6.2, 0.2],
          [-6.2, 4.4],
          [-0.6, 4.4],
          [-0.6, -1.8],
        ],
        speed: 1.35,
        phase: 1.1,
      },
      {
        style: {
          hatColor: 0x303d4a,
          shirtColor: 0x5aa378,
          pantsColor: 0x2c3642,
          shoeColor: 0x232930,
          bagColor: 0xd9a944,
          hairStyle: 'headphones',
          topStyle: 'coat',
        },
        waypoints: [
          [6.5, -0.5],
          [6.5, 4.8],
          [0.8, 4.8],
          [0.8, -2.5],
        ],
        speed: 1.4,
        phase: 3.7,
      },
    ],
    buildScene: buildSupermarketScene,
  },
};
