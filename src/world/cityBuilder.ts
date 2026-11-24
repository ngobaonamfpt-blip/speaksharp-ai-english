import * as THREE from 'three';

export type BoothId = 'cafe' | 'debate' | 'ielts' | 'shop';
export type HatType = 'none' | 'crown' | 'grad' | 'headphones';
export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface CityBoothDef {
  id: BoothId;
  name: string;
  signText: string;
  subtitle: string;
  x: number;
  z: number;
  color: number;
  accentHex: string;
  npcName: string;
  greetingEn: string;
  greetingVi: string;
  quickReplies: string[];
}

export const CITY_BOOTHS: CityBoothDef[] = [
  {
    id: 'cafe',
    name: 'London Street Café',
    signText: 'LONDON CAFÉ',
    subtitle: 'Khu Châu Âu · Luyện giao tiếp đời sống',
    x: -13,
    z: -11,
    color: 0xf97316,
    accentHex: '#ea580c',
    npcName: 'Barista Emma (UK)',
    greetingEn: 'Cheerio! Welcome to London Street Café! Would you like an English breakfast tea or a casual conversation warm-up?',
    greetingVi: 'Luyện giao tiếp tự nhiên khi gọi món và trò chuyện cùng bạn bè.',
    quickReplies: [
      'Hi Emma! Could I get an iced latte with less sugar, please?',
      'Hey! What is your favorite English idiom to use in daily life?',
      'I love this little island café! How is your day going?',
    ],
  },
  {
    id: 'debate',
    name: 'Oxford Debate Stage',
    signText: 'OXFORD DEBATE',
    subtitle: 'Quảng trường Hùng biện WSDC',
    x: 13,
    z: -11,
    color: 0xf5bd33,
    accentHex: '#d97706',
    npcName: 'Giám khảo Alex',
    greetingEn: 'Welcome to Oxford Debate Hill! Motion: "Every high school should teach AI ethics." State your opening stance!',
    greetingVi: 'Thử phản biện 1 câu ngắn (+15 XP) hoặc vào Phòng Luyện Nói chuyên sâu.',
    quickReplies: [
      'I strongly agree because students need critical thinking to use AI responsibly.',
      'From my perspective, teaching AI ethics is just as important as math or literature.',
      'However, schools must first train teachers before adding new mandatory subjects.',
    ],
  },
  {
    id: 'ielts',
    name: 'New York IELTS Hub',
    signText: 'NY IELTS HUB',
    subtitle: 'Học viện IELTS & Học bổng Du học',
    x: -13,
    z: 11,
    color: 0x2563eb,
    accentHex: '#2563eb',
    npcName: 'Mentor Sarah (US)',
    greetingEn: 'Welcome to New York IELTS Hub! Ask me about Band 8.0 speaking strategies or how to ace scholarship interviews.',
    greetingVi: 'Luyện trả lời phỏng vấn học bổng và xin gợi ý từ vựng Band 8.0.',
    quickReplies: [
      'How can I avoid repeating "I think" in IELTS Speaking Part 3?',
      'What makes a strong leadership story in a scholarship interview?',
      'Can you give me a Band 8.0 phrase about overcoming challenges?',
    ],
  },
  {
    id: 'shop',
    name: 'Sakura XP Boutique',
    signText: 'SAKURA SHOP',
    subtitle: 'Gian hàng Lễ hội · Đổi phụ kiện 3D',
    x: 13,
    z: 11,
    color: 0xec4899,
    accentHex: '#db2777',
    npcName: 'Chủ tiệm Leo',
    greetingEn: 'Welcome to Sakura Boutique! Spend your earned XP to equip cute 3D accessories right onto your character.',
    greetingVi: 'Đổi điểm XP để gắn mũ/phụ kiện 3D trực tiếp lên nhân vật của bạn!',
    quickReplies: [],
  },
];

// ============================================================================
// SKY DOME & EXPRESSIVE FACE TEXTURES
// ============================================================================

export function createSkyDomeTexture(mode: TimeOfDay): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 512);

  if (mode === 'day') {
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.45, '#7dd3fc');
    grad.addColorStop(0.75, '#e0f2fe');
    grad.addColorStop(1, '#fef9c3');
  } else if (mode === 'sunset') {
    grad.addColorStop(0, '#312e81');
    grad.addColorStop(0.38, '#a855f7');
    grad.addColorStop(0.68, '#fb923c');
    grad.addColorStop(1, '#fde68a');
  } else {
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(0.85, '#1e293b');
    grad.addColorStop(1, '#334155');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  if (mode === 'night') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 160; i++) {
      ctx.beginPath();
      ctx.arc((i * 97) % 512, (i * 53) % 240, (i % 3) * 0.6 + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFaceTexture(skinHex = '#ffdfc4'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = skinHex;
  ctx.fillRect(0, 0, 512, 256);

  const cx = 256;
  const cy = 134;

  // Rosy cheeks
  ctx.fillStyle = 'rgba(244, 114, 182, 0.36)';
  ctx.beginPath();
  ctx.ellipse(cx - 42, cy + 16, 15, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 42, cy + 16, 15, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute glossy eyes
  [-26, 26].forEach((ox) => {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(cx + ox, cy - 4, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + ox - 3.5, cy - 8.5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + ox + 3, cy + 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Eyebrows & happy smile
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - 26, cy - 20, 12, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 26, cy - 20, 12, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, cy + 12, 15, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSignboardTexture(text: string, accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#141517';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 46px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================================
// SMOOTH CHIBI AVATARS
// ============================================================================

export function createDetailedAvatar(bodyColor: number, isPlayer: boolean, hairColor?: number): THREE.Group {
  const root = new THREE.Group();

  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  if (isPlayer) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.76, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5bd33, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    root.add(ring);
  }

  const bodyRig = new THREE.Group();
  bodyRig.name = 'bodyRig';
  root.add(bodyRig);

  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const sneakerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });

  [-0.17, 0.17].forEach((lx, idx) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(lx, 0.68, 0);
    legPivot.name = idx === 0 ? 'leftLeg' : 'rightLeg';
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.38, 8, 14), pantsMat);
    leg.position.y = -0.26;
    leg.castShadow = true;
    const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.14, 6, 12), sneakerMat);
    shoe.rotation.x = Math.PI / 2;
    shoe.position.set(0, -0.56, 0.06);
    legPivot.add(leg, shoe);
    bodyRig.add(legPivot);
  });

  const hoodieMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.42 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.42, 10, 18), hoodieMat);
  torso.position.y = 1.08;
  torso.scale.set(1.02, 1, 0.84);
  torso.castShadow = true;
  bodyRig.add(torso);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.075, 10, 20),
    new THREE.MeshStandardMaterial({ color: isPlayer ? 0xf5bd33 : 0xffffff, roughness: 0.45 })
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.44;
  bodyRig.add(collar);

  const pack = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.24, 8, 12),
    new THREE.MeshStandardMaterial({ color: isPlayer ? 0xf5bd33 : 0x334155, roughness: 0.48 })
  );
  pack.position.set(0, 1.1, -0.32);
  pack.scale.set(1.1, 1, 0.7);
  pack.castShadow = true;
  bodyRig.add(pack);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.45 });
  [-0.44, 0.44].forEach((ax, idx) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(ax, 1.32, 0);
    armPivot.name = idx === 0 ? 'leftArm' : 'rightArm';
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.34, 8, 12), hoodieMat);
    arm.position.y = -0.22;
    arm.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), skinMat);
    hand.position.y = -0.44;
    armPivot.add(arm, hand);
    bodyRig.add(armPivot);
  });

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.41, 24, 24),
    new THREE.MeshStandardMaterial({ map: createFaceTexture('#ffdfc4'), roughness: 0.45 })
  );
  head.position.y = 1.84;
  head.rotation.y = -Math.PI / 2;
  head.castShadow = true;
  bodyRig.add(head);

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor ?? (isPlayer ? 0x1c1917 : 0x451a03),
    roughness: 0.6,
  });
  const hairDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.435, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hairDome.position.set(0, 1.88, -0.02);
  hairDome.rotation.x = -0.14;
  hairDome.castShadow = true;
  bodyRig.add(hairDome);

  [-0.16, 0, 0.16].forEach((fx, i) => {
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), hairMat);
    tuft.position.set(fx, 2.12 - Math.abs(i - 1) * 0.04, 0.28);
    tuft.scale.set(1.1, 0.72, 0.85);
    bodyRig.add(tuft);
  });

  const hatSlot = new THREE.Group();
  hatSlot.position.set(0, 2.28, 0);
  hatSlot.name = 'hatSlot';
  bodyRig.add(hatSlot);

  return root;
}

export function buildHatAccessory(hat: HatType): THREE.Object3D | null {
  if (hat === 'none') return null;
  if (hat === 'crown') {
    const g = new THREE.Group();
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.23, 0.22, 6),
        new THREE.MeshStandardMaterial({ color: 0xf5bd33, metalness: 0.6, roughness: 0.2 })
      )
    );
    return g;
  }
  if (hat === 'grad') {
    const g = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.07, 0.78), new THREE.MeshStandardMaterial({ color: 0x141517 }));
    cap.position.y = 0.1;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.16, 14), new THREE.MeshStandardMaterial({ color: 0x141517 }));
    const tassel = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf5bd33 }));
    tassel.position.set(0.34, 0.05, 0.34);
    g.add(base, cap, tassel);
    return g;
  }
  if (hat === 'headphones') {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.058, 10, 22, Math.PI), new THREE.MeshStandardMaterial({ color: 0x141517 }));
    band.position.y = -0.38;
    const earGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xf5bd33, metalness: 0.3, roughness: 0.3 });
    const lEar = new THREE.Mesh(earGeo, earMat);
    lEar.rotation.z = Math.PI / 2;
    lEar.position.set(-0.45, -0.4, 0);
    const rEar = new THREE.Mesh(earGeo, earMat);
    rEar.rotation.z = Math.PI / 2;
    rEar.position.set(0.45, -0.4, 0);
    g.add(band, lEar, rEar);
    return g;
  }
  return null;
}

// ============================================================================
// CARTOON LOW-POLY WORLD MAP ASSETS (Anton Moek Style!)
// ============================================================================

function createLowPolyPineTree(x: number, z: number, scale = 1, leafHex = 0x22c55e): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.26, 1.3, 6),
    new THREE.MeshStandardMaterial({ color: 0x854d0e, flatShading: true })
  );
  trunk.position.y = 0.65;
  trunk.castShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: leafHex, flatShading: true, roughness: 0.75 });
  [
    { y: 1.9, r: 1.25, h: 1.8 },
    { y: 2.9, r: 0.92, h: 1.5 },
    { y: 3.7, r: 0.56, h: 1.2 },
  ].forEach((t) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 6), leafMat);
    cone.position.y = t.y;
    cone.castShadow = true;
    g.add(cone);
  });

  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  return g;
}

function createSnowMountain(x: number, z: number, r: number, h: number): THREE.Group {
  const g = new THREE.Group();
  const rock = new THREE.Mesh(
    new THREE.ConeGeometry(r, h, 7),
    new THREE.MeshStandardMaterial({ color: 0x64748b, flatShading: true, roughness: 0.85 })
  );
  rock.position.y = h / 2;
  rock.castShadow = true;
  rock.receiveShadow = true;
  g.add(rock);

  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(r * 0.42, h * 0.42, 7),
    new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.5 })
  );
  snow.position.y = h - (h * 0.42) / 2 + 0.05;
  g.add(snow);

  g.position.set(x, 0, z);
  return g;
}

function createWindmill(x: number, z: number): { group: THREE.Group; blades: THREE.Group } {
  const g = new THREE.Group();
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1.35, 4.8, 7),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, flatShading: true })
  );
  tower.position.y = 2.4;
  tower.castShadow = true;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 1.4, 7),
    new THREE.MeshStandardMaterial({ color: 0xea580c, flatShading: true })
  );
  roof.position.y = 5.5;
  g.add(tower, roof);

  const blades = new THREE.Group();
  blades.position.set(0, 4.3, 0.9);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.3, 0.08), bladeMat);
    b.position.y = 1.15;
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    arm.add(b);
    blades.add(arm);
  }
  g.add(blades);
  g.position.set(x, 0, z);
  return { group: g, blades };
}

function createHotAirBalloon(): THREE.Group {
  const g = new THREE.Group();
  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf97316, flatShading: true, roughness: 0.45 })
  );
  balloon.scale.set(1, 1.2, 1);
  balloon.position.y = 3.2;
  balloon.castShadow = true;

  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(1.98, 0.28, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xf5bd33, flatShading: true })
  );
  stripe.rotation.x = Math.PI / 2;
  stripe.position.y = 3.2;

  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.75, 0.95),
    new THREE.MeshStandardMaterial({ color: 0x92400e, flatShading: true })
  );
  basket.position.y = 0;
  g.add(balloon, stripe, basket);
  return g;
}

function createCartoonPlane(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 1.6, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
  );
  body.rotation.x = Math.PI / 2;
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.1, 0.65),
    new THREE.MeshStandardMaterial({ color: 0xf5bd33, flatShading: true })
  );
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.75, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xef4444, flatShading: true })
  );
  tail.position.set(0, 0.35, -0.95);
  g.add(body, wing, tail);
  return g;
}

function createSailboat(sailColor: number): THREE.Group {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.55, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x92400e, flatShading: true })
  );
  hull.position.y = 0.25;
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 2.8, 6),
    new THREE.MeshStandardMaterial({ color: 0x78350f })
  );
  mast.position.y = 1.6;
  const sail = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 2.2, 3),
    new THREE.MeshStandardMaterial({ color: sailColor, flatShading: true })
  );
  sail.position.set(0, 1.75, 0.25);
  sail.scale.set(0.25, 1, 1);
  g.add(hull, mast, sail);
  return g;
}

function createCartoonLandmarkBooth(booth: CityBoothDef): { group: THREE.Group; floatingProp: THREE.Object3D } {
  const g = new THREE.Group();
  g.position.set(booth.x, 0, booth.z);

  // Warm stone round base plaza for each zone
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(4.8, 5.2, 0.32, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, flatShading: true })
  );
  base.position.y = 0.16;
  base.receiveShadow = true;
  g.add(base);

  // Cute pastel cartoon house/pavilion body
  const wallColor =
    booth.id === 'cafe' ? 0xfff7ed : booth.id === 'debate' ? 0xf8fafc : booth.id === 'ielts' ? 0xeff6ff : 0xfdf2f8;
  const house = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 3.4, 4.0),
    new THREE.MeshStandardMaterial({ color: wallColor, flatShading: true, roughness: 0.6 })
  );
  house.position.set(0, 2.0, -0.8);
  house.castShadow = true;
  house.receiveShadow = true;
  g.add(house);

  // Pitched cartoon pyramid/gable roof!
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.4, 2.3, 4),
    new THREE.MeshStandardMaterial({ color: booth.color, flatShading: true, roughness: 0.45 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 4.85, -0.8);
  roof.castShadow = true;
  g.add(roof);

  // 3D Signboard
  const signTex = createSignboardTexture(booth.signText, booth.accentHex);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.95, 0.22),
    new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: 0xffffff,
      emissiveMap: signTex,
      emissiveIntensity: 0.25,
    })
  );
  sign.position.set(0, 3.4, 1.32);
  g.add(sign);

  // Cozy counter
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.95, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
  );
  counter.position.set(0, 0.78, 1.75);
  counter.castShadow = true;
  g.add(counter);

  // Unique World Landmark beside each booth!
  if (booth.id === 'cafe') {
    // Mini London Clock Tower
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 6.2, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xd97706, flatShading: true })
    );
    tower.position.set(-3.6, 3.2, -1.6);
    tower.castShadow = true;
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 2.2, 4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, flatShading: true })
    );
    spire.rotation.y = Math.PI / 4;
    spire.position.set(-3.6, 7.3, -1.6);
    g.add(tower, spire);
  } else if (booth.id === 'ielts') {
    // Mini New York Twin Towers
    const t1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 6.5, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, flatShading: true })
    );
    t1.position.set(-3.6, 3.3, -1.5);
    t1.castShadow = true;
    g.add(t1);
  } else if (booth.id === 'shop') {
    // Cherry blossom pink low-poly trees!
    g.add(createLowPolyPineTree(3.8, -0.5, 0.95, 0xf472b6));
    g.add(createLowPolyPineTree(-3.8, -0.5, 0.82, 0xf9a8d4));
  }

  // Floating rotating icon above roof
  const prop = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.65),
    new THREE.MeshStandardMaterial({
      color: booth.color,
      flatShading: true,
      emissive: booth.color,
      emissiveIntensity: 0.25,
    })
  );
  prop.position.set(0, 6.6, -0.8);
  g.add(prop);

  // Glowing ground interaction ring
  const zone = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.35, 28),
    new THREE.MeshBasicMaterial({ color: booth.color, side: THREE.DoubleSide })
  );
  zone.rotation.x = -Math.PI / 2;
  zone.position.set(0, 0.35, 3.9);
  g.add(zone);

  // NPC
  const npc = createDetailedAvatar(booth.color, false, 0x27272a);
  npc.position.set(0, 0.32, 1.0);
  g.add(npc);

  return { group: g, floatingProp: prop };
}

export interface CityHandles {
  groundTargets: THREE.Object3D[];
  floatingProps: THREE.Object3D[];
  windmillBlades: THREE.Group[];
  hotAirBalloon: THREE.Group;
  airplane: THREE.Group;
  sailboats: Array<{ mesh: THREE.Group; radius: number; speed: number; angle: number }>;
  clouds: THREE.Group[];
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
  skyDome: THREE.Mesh;
}

export function buildSpeakSharpCity(scene: THREE.Scene): CityHandles {
  const groundTargets: THREE.Object3D[] = [];
  const floatingProps: THREE.Object3D[] = [];
  const windmillBlades: THREE.Group[] = [];
  const sailboats: Array<{ mesh: THREE.Group; radius: number; speed: number; angle: number }> = [];
  const clouds: THREE.Group[] = [];

  // 1. Vibrant Gradient Sky Dome
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(140, 32, 24),
    new THREE.MeshBasicMaterial({ map: createSkyDomeTexture('day'), side: THREE.BackSide, fog: false })
  );
  scene.add(skyDome);

  // Warm Cartoon Sunlight
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x7dd3fc, 1.0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
  sunLight.position.set(32, 46, 28);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 135;
  sunLight.shadow.camera.left = -46;
  sunLight.shadow.camera.right = 46;
  sunLight.shadow.camera.top = 46;
  sunLight.shadow.camera.bottom = -46;
  scene.add(sunLight);

  // 2. Shimmering Turquoise Cartoon Ocean
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.22,
      metalness: 0.12,
    })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.55;
  ocean.receiveShadow = true;
  scene.add(ocean);

  // 3. Layered Low-Poly Floating World Island (Sandy Beach + Lush Emerald Grass)
  const sandyBeach = new THREE.Mesh(
    new THREE.CylinderGeometry(31, 33.5, 1.1, 18),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, flatShading: true, roughness: 0.9 })
  );
  sandyBeach.position.y = -0.52;
  sandyBeach.receiveShadow = true;
  scene.add(sandyBeach);

  const greenIsland = new THREE.Mesh(
    new THREE.CylinderGeometry(27.5, 29.2, 0.42, 18),
    new THREE.MeshStandardMaterial({ color: 0x4ade80, flatShading: true, roughness: 0.85 })
  );
  greenIsland.position.y = -0.08;
  greenIsland.receiveShadow = true;
  scene.add(greenIsland);
  groundTargets.push(greenIsland);

  // Warm Cobblestone Central World Crossroads
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, flatShading: true, roughness: 0.85 });
  const road1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 44), pathMat);
  road1.position.y = 0.14;
  road1.receiveShadow = true;
  const road2 = new THREE.Mesh(new THREE.BoxGeometry(44, 0.08, 5.2), pathMat);
  road2.position.y = 0.14;
  road2.receiveShadow = true;
  const centerCircle = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.8, 0.12, 16), pathMat);
  centerCircle.position.y = 0.15;
  centerCircle.receiveShadow = true;
  scene.add(road1, road2, centerCircle);
  groundTargets.push(road1, road2, centerCircle);

  // 4. Central Globe & SpeakSharp Golden Compass Monument
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.9, 1.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x141517, flatShading: true })
  );
  pedestal.position.y = 0.7;
  pedestal.castShadow = true;
  scene.add(pedestal);

  const worldGlobe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, 1),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, flatShading: true, roughness: 0.35 })
  );
  worldGlobe.position.y = 2.65;
  worldGlobe.castShadow = true;
  scene.add(worldGlobe);
  floatingProps.push(worldGlobe);

  const goldRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.72, 0.14, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0xf5bd33, flatShading: true, metalness: 0.45, roughness: 0.25 })
  );
  goldRing.position.y = 2.65;
  goldRing.rotation.x = 0.5;
  scene.add(goldRing);
  floatingProps.push(goldRing);

  // 5. 4 World-Themed Landmark Booths
  CITY_BOOTHS.forEach((b) => {
    const { group, floatingProp } = createCartoonLandmarkBooth(b);
    scene.add(group);
    floatingProps.push(floatingProp);
  });

  // 6. Snow-Capped Low-Poly Mountains (North Rim)
  [
    [-21, -21, 5.8, 12],
    [-12, -24, 4.6, 9.5],
    [12, -24, 5.2, 11],
    [21, -21, 6.2, 13],
    [-24, 0, 4.4, 8.2],
  ].forEach(([mx, mz, r, h]) => {
    scene.add(createSnowMountain(mx, mz, r, h));
  });

  // 7. Spinning Cartoon Windmills
  [
    [21, 0],
    [-22, 18],
  ].forEach(([wx, wz]) => {
    const wm = createWindmill(wx, wz);
    scene.add(wm.group);
    windmillBlades.push(wm.blades);
  });

  // 8. Lush Low-Poly Pine Forest Clusters
  [
    [-19, -5], [-21, 5], [19, -5], [21, 7],
    [-6, -21], [6, -21], [-7, 21], [7, 21],
    [-6, -6], [6, -6], [-6, 6], [6, 6],
    [22, 17], [-19, 17],
  ].forEach(([tx, tz], i) => {
    const color = i % 3 === 0 ? 0x16a34a : i % 3 === 1 ? 0x22c55e : 0x15803d;
    scene.add(createLowPolyPineTree(tx, tz, 0.8 + (i % 3) * 0.18, color));
  });

  // 9. Hot Air Balloon & Circling Cartoon Airplane!
  const hotAirBalloon = createHotAirBalloon();
  hotAirBalloon.position.set(17, 13, -15);
  scene.add(hotAirBalloon);

  const airplane = createCartoonPlane();
  airplane.position.set(0, 17, 0);
  scene.add(airplane);

  // 10. Sailboats gently circling the turquoise ocean!
  [
    { r: 38, s: 0.0032, a: 0, c: 0xffffff },
    { r: 44, s: -0.0024, a: 2.1, c: 0xf5bd33 },
    { r: 41, s: 0.0028, a: 4.3, c: 0xf97316 },
  ].forEach((sb) => {
    const mesh = createSailboat(sb.c);
    scene.add(mesh);
    sailboats.push({ mesh, radius: sb.r, speed: sb.s, angle: sb.a });
  });

  // 11. Fluffy Low-Poly Clouds
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 });
  [
    [-24, 21, -16], [18, 24, -20], [24, 20, 14], [-18, 23, 18],
  ].forEach(([cx, cy, cz]) => {
    const cg = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), cloudMat);
    const p2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), cloudMat);
    p2.position.set(1.8, -0.3, 0);
    const p3 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), cloudMat);
    p3.position.set(-1.7, -0.35, 0.3);
    cg.add(p1, p2, p3);
    cg.position.set(cx, cy, cz);
    scene.add(cg);
    clouds.push(cg);
  });

  return {
    groundTargets,
    floatingProps,
    windmillBlades,
    hotAirBalloon,
    airplane,
    sailboats,
    clouds,
    hemiLight,
    sunLight,
    skyDome,
  };
}
