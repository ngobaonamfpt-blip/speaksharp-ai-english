import * as THREE from 'three';
import { BoothId } from './cityBuilder';

export const PLANET_RADIUS = 26;

export interface PlanetNpcDef {
  id: string;
  name: string;
  role: string;
  landmarkTitle: string;
  boothId: BoothId;
  /** Unit normal vector on the sphere */
  dir: THREE.Vector3;
  shirtColor: number;
  hatColor: number;
  greetingEn: string;
  deliveryTaskVi: string;
  deliveryPromptEn: string;
}

export interface PlanetLandmark {
  id: string;
  title: string;
  npc: PlanetNpcDef;
  worldPos: THREE.Vector3;
  normal: THREE.Vector3;
  npcGroup: THREE.Group;
  markerRing: THREE.Mesh;
}

export interface RoamingPeer {
  id: string;
  name: string;
  group: THREE.Group;
  posDir: THREE.Vector3;
  velTangent: THREE.Vector3;
  hopPhase: number;
  emojiCooldown: number;
}

export interface MessengerWorldHandles {
  planetGroup: THREE.Group;
  landmarks: PlanetLandmark[];
  swayTrees: Array<{ group: THREE.Group; baseQuat: THREE.Quaternion; phase: number }>;
  windmillBlades: THREE.Group | null;
  ufoGroup: THREE.Group;
  cloudRing: THREE.Group;
  roamingPeers: RoamingPeer[];
  toonGradient: THREE.DataTexture;
}

/** 3-step storybook cel-shading gradient map (Abeto Messenger aesthetic!) */
export function createToonGradient(): THREE.DataTexture {
  const colors = new Uint8Array([
    135, 135, 150, 255, // soft cool shadow
    205, 205, 212, 255, // midtone
    255, 255, 255, 255, // crisp sunlit highlight
  ]);
  const tex = new THREE.DataTexture(colors, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

/** Aligns any Object3D so its local +Y points along `normal` and sits on the planet surface */
export function placeOnSphere(
  obj: THREE.Object3D,
  dir: THREE.Vector3,
  radiusOffset = 0,
  spinAngle = 0
): void {
  const n = dir.clone().normalize();
  obj.position.copy(n).multiplyScalar(PLANET_RADIUS + radiusOffset);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  if (spinAngle !== 0) {
    const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spinAngle);
    q.multiply(spin);
  }
  obj.quaternion.copy(q);
}

/** Builds an adorable, smooth rounded stylized 3D Messenger character (Abeto-style!) */
export function buildMessengerCharacter(
  toonGradient: THREE.DataTexture,
  opts: {
    shirtColor: number;
    hatColor: number;
    skinColor?: number;
    hasMailbag?: boolean;
    scarfColor?: number;
  }
): THREE.Group {
  const root = new THREE.Group();
  const toon = (color: number) =>
    new THREE.MeshToonMaterial({ color, gradientMap: toonGradient });

  const skinMat = toon(opts.skinColor ?? 0xfde2c8);
  const shirtMat = toon(opts.shirtColor);
  const pantsMat = toon(0x2d3a4b);
  const shoeMat = toon(0x5c3d2e);
  const hatMat = toon(opts.hatColor);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b24 });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xfda4af });

  // Soft contact shadow disc right beneath feet
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 18),
    new THREE.MeshBasicMaterial({ color: 0x163020, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  root.add(shadow);

  // Inner body holder for bouncy squash-and-stretch
  const bodyRoot = new THREE.Group();
  bodyRoot.name = 'bodyRoot';
  root.add(bodyRoot);

  // Cute stubby legs
  const legGeo = new THREE.CapsuleGeometry(0.14, 0.26, 6, 10);
  const leftLeg = new THREE.Group();
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.2, 0.42, 0);
  const llMesh = new THREE.Mesh(legGeo, pantsMat);
  llMesh.position.y = -0.14;
  const lShoe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), shoeMat);
  lShoe.scale.set(1, 0.7, 1.35);
  lShoe.position.set(0, -0.34, 0.06);
  leftLeg.add(llMesh, lShoe);
  bodyRoot.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.2, 0.42, 0);
  const rlMesh = new THREE.Mesh(legGeo, pantsMat);
  rlMesh.position.y = -0.14;
  const rShoe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), shoeMat);
  rShoe.scale.set(1, 0.7, 1.35);
  rShoe.position.set(0, -0.34, 0.06);
  rightLeg.add(rlMesh, rShoe);
  bodyRoot.add(rightLeg);

  // Plump stylized tunic torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.44, 8, 14), shirtMat);
  torso.position.y = 0.86;
  bodyRoot.add(torso);

  // Cozy fluttering scarf
  const scarfMat = toon(opts.scarfColor ?? 0xf5bd33);
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.1, 8, 16), scarfMat);
  scarfRing.rotation.x = Math.PI / 2;
  scarfRing.position.y = 1.18;
  bodyRoot.add(scarfRing);

  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.46), scarfMat);
  scarfTail.name = 'scarfTail';
  scarfTail.position.set(0.12, 1.14, -0.34);
  scarfTail.rotation.x = -0.25;
  bodyRoot.add(scarfTail);

  // Oversized leather mail satchel + glowing letter sticking out!
  if (opts.hasMailbag) {
    const bagMat = toon(0x9a5b32);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.18), bagMat);
    bag.position.set(-0.42, 0.78, -0.02);
    bag.rotation.z = 0.15;
    bodyRoot.add(bag);

    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.2), toon(0x7c4522));
    flap.position.set(-0.42, 0.91, -0.02);
    flap.rotation.z = 0.15;
    bodyRoot.add(flap);

    // Crisp white envelope with red wax seal sticking out of bag
    const letter = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    letter.name = 'carriedLetter';
    letter.position.set(-0.44, 1.03, 0.02);
    letter.rotation.z = 0.28;
    bodyRoot.add(letter);
  }

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.11, 0.32, 6, 10);
  const leftArm = new THREE.Group();
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.44, 1.06, 0);
  const laMesh = new THREE.Mesh(armGeo, shirtMat);
  laMesh.position.y = -0.18;
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), skinMat);
  lHand.position.y = -0.38;
  leftArm.add(laMesh, lHand);
  bodyRoot.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.name = 'rightArm';
  rightArm.position.set(0.44, 1.06, 0);
  const raMesh = new THREE.Mesh(armGeo, shirtMat);
  raMesh.position.y = -0.18;
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), skinMat);
  rHand.position.y = -0.38;
  rightArm.add(raMesh, rHand);
  bodyRoot.add(rightArm);

  // Cute big storybook head
  const headGroup = new THREE.Group();
  headGroup.name = 'headGroup';
  headGroup.position.y = 1.54;
  bodyRoot.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), skinMat);
  headGroup.add(head);

  // Expressive eyes + rosy cheeks
  const eyeGeo = new THREE.SphereGeometry(0.055, 8, 8);
  const lEye = new THREE.Mesh(eyeGeo, eyeMat);
  lEye.position.set(-0.15, 0.04, 0.37);
  const rEye = new THREE.Mesh(eyeGeo, eyeMat);
  rEye.position.set(0.15, 0.04, 0.37);
  headGroup.add(lEye, rEye);

  const cheekGeo = new THREE.SphereGeometry(0.055, 8, 8);
  const lCheek = new THREE.Mesh(cheekGeo, blushMat);
  lCheek.scale.set(1.2, 0.7, 0.4);
  lCheek.position.set(-0.25, -0.05, 0.34);
  const rCheek = new THREE.Mesh(cheekGeo, blushMat);
  rCheek.scale.set(1.2, 0.7, 0.4);
  rCheek.position.set(0.25, -0.05, 0.34);
  headGroup.add(lCheek, rCheek);

  // Cozy Messenger Cap + Visor
  const capDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hatMat
  );
  capDome.position.y = 0.06;
  capDome.rotation.x = -0.12;
  headGroup.add(capDome);

  const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.07, 14), hatMat);
  visor.scale.set(1, 1, 0.85);
  visor.position.set(0, 0.14, 0.28);
  visor.rotation.x = 0.12;
  headGroup.add(visor);

  // Cute gold badge on front of cap
  const badge = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), toon(0xf5bd33));
  badge.position.set(0, 0.28, 0.41);
  headGroup.add(badge);

  return root;
}

/** Builds a cute stylized storybook cottage with pastel walls, terracotta roof & glowing windows */
function buildCozyCottage(
  toonGradient: THREE.DataTexture,
  wallColor: number,
  roofColor: number,
  width = 3.2,
  height = 2.4,
  depth = 2.8,
  hasChimney = true
): THREE.Group {
  const g = new THREE.Group();
  const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient });

  // Stone foundation
  const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.6, depth + 0.3), toon(0xcbd5e1));
  base.position.y = 0.1;
  g.add(base);

  // Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), toon(wallColor));
  walls.position.y = height * 0.5 + 0.2;
  g.add(walls);

  // Pitched cozy roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.84, 2.0, 4),
    toon(roofColor)
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = height + 1.15;
  g.add(roof);

  // Warm wooden door
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.35, 0.15), toon(0x854d27));
  door.position.set(0, 0.9, depth * 0.5 + 0.03);
  g.add(door);

  // Glowing warm windows
  const winMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });
  const frameMat = toon(0xffffff);
  [-width * 0.28, width * 0.28].forEach((wx) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.14), frameMat);
    frame.position.set(wx, height * 0.62 + 0.2, depth * 0.5 + 0.02);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.17), winMat);
    pane.position.set(wx, height * 0.62 + 0.2, depth * 0.5 + 0.03);
    g.add(frame, pane);
  });

  // Cute red mailbox outside!
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 6), toon(0x78350f));
  post.position.set(width * 0.5 + 0.65, 0.55, depth * 0.35);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.52), toon(0xef4444));
  box.position.set(width * 0.5 + 0.65, 1.15, depth * 0.35);
  g.add(post, box);

  if (hasChimney) {
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.4, 0.55), toon(0xd6d3d1));
    chim.position.set(width * 0.25, height + 1.45, -depth * 0.15);
    g.add(chim);
  }

  return g;
}

/** Builds a spinning storybook Windmill */
function buildWindmill(toonGradient: THREE.DataTexture): { group: THREE.Group; blades: THREE.Group } {
  const g = new THREE.Group();
  const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient });

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.9, 5.4, 10), toon(0xfef9c3));
  tower.position.y = 2.5;
  g.add(tower);

  const dome = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.6, 10), toon(0xe11d48));
  dome.position.y = 5.95;
  g.add(dome);

  const blades = new THREE.Group();
  blades.position.set(0, 4.4, 1.35);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.4, 10), toon(0x78350f));
  hub.rotation.x = Math.PI / 2;
  blades.add(hub);

  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.1, 0.1), toon(0x78350f));
    spar.position.y = 1.55;
    const sail = new THREE.Mesh(new THREE.BoxGeometry(0.72, 2.3, 0.06), toon(0xffffff));
    sail.position.set(0.32, 1.85, 0.04);
    arm.add(spar, sail);
    blades.add(arm);
  }
  g.add(blades);

  return { group: g, blades };
}

/** Builds a striped coastal Lighthouse */
function buildLighthouse(toonGradient: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient });
  const colors = [0xffffff, 0xef4444, 0xffffff, 0xef4444, 0xffffff];
  colors.forEach((c, i) => {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15 - i * 0.11, 1.26 - i * 0.11, 1.15, 12),
      toon(c)
    );
    seg.position.y = 0.45 + i * 1.12;
    g.add(seg);
  });
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.9, 12),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  lantern.position.y = 6.1;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.9, 12), toon(0x1e293b));
  cap.position.y = 6.95;
  g.add(lantern, cap);
  return g;
}

/** Builds a cute fluffy storybook tree (oak or pink cherry blossom) */
function buildStylizedTree(
  toonGradient: THREE.DataTexture,
  foliageColor: number,
  scale = 1
): THREE.Group {
  const g = new THREE.Group();
  const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.6, 8), toon(0x8b5a2b));
  trunk.position.y = 0.7;
  g.add(trunk);

  const mainPuff = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 1), toon(foliageColor));
  mainPuff.position.set(0, 2.15, 0);
  const puff2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.82, 1), toon(foliageColor));
  puff2.position.set(0.65, 1.85, 0.35);
  const puff3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 1), toon(foliageColor));
  puff3.position.set(-0.58, 1.95, -0.3);
  g.add(mainPuff, puff2, puff3);

  g.scale.setScalar(scale);
  return g;
}

/** Builds the playful orbiting UFO Easter Egg from Abeto's Messenger! */
function buildOrbitingUFO(toonGradient: THREE.DataTexture): THREE.Group {
  const g = new THREE.Group();
  const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient });

  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.1, 0.55, 18), toon(0xcbd5e1));
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.85 })
  );
  dome.position.y = 0.2;
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(1.9, 5.2, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xa7f3d0,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  beam.position.y = -2.7;
  g.add(saucer, dome, beam);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xf5bd33 : 0xf472b6 })
    );
    bulb.position.set(Math.cos(a) * 1.7, -0.05, Math.sin(a) * 1.7);
    g.add(bulb);
  }
  return g;
}

export const PLANET_NPCS: PlanetNpcDef[] = [
  {
    id: 'post-office',
    name: 'Bác Bưu tá Ben',
    role: 'Central Post Office',
    landmarkTitle: 'Bưu điện Trung tâm (Post Office)',
    boothId: 'debate',
    dir: new THREE.Vector3(0, 1, 0.08).normalize(),
    shirtColor: 0x2563eb,
    hatColor: 0x1d4ed8,
    greetingEn: 'Welcome back, young messenger! Ready to practice English while delivering letters around our planet?',
    deliveryTaskVi: 'Nhận thư & luyện giao tiếp phản xạ',
    deliveryPromptEn: 'Hi Ben! I have a new parcel ready to deliver across the planet!',
  },
  {
    id: 'sunset-cafe',
    name: 'Barista Leo',
    role: 'Cozy Planet Café',
    landmarkTitle: 'Quán Cà phê Đồi Gió (Sunset Café)',
    boothId: 'cafe',
    dir: new THREE.Vector3(0.76, 0.58, 0.28).normalize(),
    shirtColor: 0xd97706,
    hatColor: 0x78350f,
    greetingEn: 'Hey there! Thanks for bringing my coffee beans parcel! Would you like to order a drink in English?',
    deliveryTaskVi: 'Giao gói hạt cà phê & gọi đồ bằng Tiếng Anh',
    deliveryPromptEn: 'Special delivery for Sunset Café! Could I also get an iced oat latte, please?',
  },
  {
    id: 'ielts-observatory',
    name: 'Cô Clara',
    role: 'Starlight IELTS Observatory',
    landmarkTitle: 'Đài Thiên Văn IELTS (Observatory)',
    boothId: 'ielts',
    dir: new THREE.Vector3(-0.72, 0.56, 0.4).normalize(),
    shirtColor: 0x7c3aed,
    hatColor: 0x4c1d95,
    greetingEn: 'Wonderful timing! My star-chart letter arrived! Let us practice an IELTS Band 8.0 Speaking topic together.',
    deliveryTaskVi: 'Giao thư bản đồ sao & luyện IELTS Speaking',
    deliveryPromptEn: 'Here is your star-chart letter, Professor Clara! What topic are we exploring today?',
  },
  {
    id: 'windmill-bakery',
    name: 'Bếp trưởng Maya',
    role: 'Windmill Bakery',
    landmarkTitle: 'Cối Xay Gió Bánh Mì (Windmill Bakery)',
    boothId: 'cafe',
    dir: new THREE.Vector3(0.18, 0.48, -0.86).normalize(),
    shirtColor: 0xe11d48,
    hatColor: 0xffffff,
    greetingEn: 'Fresh croissants are out of the oven! Thank you for the recipe postcard—tell me about your favorite food in English!',
    deliveryTaskVi: 'Giao bưu thiếp công thức & kể về món yêu thích',
    deliveryPromptEn: 'I brought your recipe postcard from the Post Office! The bakery smells amazing!',
  },
  {
    id: 'harbor-lighthouse',
    name: 'Thuyền trưởng Finn',
    role: 'Starlight Lighthouse',
    landmarkTitle: 'Ngọn Hải Đăng (Coastal Lighthouse)',
    boothId: 'shop',
    dir: new THREE.Vector3(-0.55, -0.62, -0.56).normalize(),
    shirtColor: 0x0d9488,
    hatColor: 0x0f172a,
    greetingEn: 'Ahoy, messenger! You walked all the way to the southern hemisphere! Let us chat about travel and adventure!',
    deliveryTaskVi: 'Giao nhật ký hàng hải ở Nam bán cầu',
    deliveryPromptEn: 'Ahoy Captain Finn! Here is your ocean logbook—what an incredible view from the lighthouse!',
  },
  {
    id: 'debate-plaza',
    name: 'Coach Kai',
    role: 'Southern Debate Garden',
    landmarkTitle: 'Vườn Tranh Biện (Debate Garden)',
    boothId: 'debate',
    dir: new THREE.Vector3(0.62, -0.65, 0.44).normalize(),
    shirtColor: 0x16a34a,
    hatColor: 0x14532d,
    greetingEn: 'Awesome delivery! Ready for a quick 1-minute English debate round on AI and the future of learning?',
    deliveryTaskVi: 'Giao thư mời tranh biện & phản biện nhanh',
    deliveryPromptEn: 'Here is the debate invitation, Coach Kai! I am ready to share my perspective!',
  },
];

/** Builds the entire Abeto Messenger-inspired Spherical 3D World! */
export function buildMessengerPlanetScene(scene: THREE.Scene): MessengerWorldHandles {
  const toonGradient = createToonGradient();
  const planetGroup = new THREE.Group();
  scene.add(planetGroup);

  const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient });

  // 1. Lush Stylized Miniature Planet Sphere (with subtle vertex-color biome patches!)
  const sphereGeo = new THREE.IcosahedronGeometry(PLANET_RADIUS, 5);
  const posAttr = sphereGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const cGrass1 = new THREE.Color(0x6ec962);
  const cGrass2 = new THREE.Color(0x84d96c);
  const cSand = new THREE.Color(0xf6df9b);
  const cLake = new THREE.Color(0x38bdf8);
  const cBlossom = new THREE.Color(0x9ae67e);
  const tmpC = new THREE.Color();
  const v = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i).normalize();
    // Create a cozy turquoise lake in the southern-east cove
    const lakeDist = v.distanceTo(new THREE.Vector3(0.25, -0.82, -0.5).normalize());
    // Create warm sandy winding road ring along equator-ish paths
    const roadBand = Math.abs(v.y - 0.32 * Math.sin(v.x * 2.4 + v.z * 1.8));
    if (lakeDist < 0.34) {
      tmpC.copy(cLake);
    } else if (lakeDist < 0.41) {
      tmpC.copy(cSand);
    } else if (roadBand < 0.085) {
      tmpC.copy(cSand);
    } else if (Math.sin(v.x * 4.2) * Math.cos(v.z * 4.2) > 0.25) {
      tmpC.copy(cGrass2);
    } else if (v.y > 0.65) {
      tmpC.copy(cBlossom);
    } else {
      tmpC.copy(cGrass1);
    }
    colors[i * 3] = tmpC.r;
    colors[i * 3 + 1] = tmpC.g;
    colors[i * 3 + 2] = tmpC.b;
  }
  sphereGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const planetMesh = new THREE.Mesh(
    sphereGeo,
    new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient })
  );
  planetMesh.receiveShadow = true;
  planetGroup.add(planetMesh);

  // 2. Place Iconic Storybook Buildings & Friendly NPCs around the entire 360° planet!
  const landmarks: PlanetLandmark[] = [];
  let windmillBlades: THREE.Group | null = null;

  PLANET_NPCS.forEach((npc, idx) => {
    let building: THREE.Group;
    if (npc.id === 'windmill-bakery') {
      const wm = buildWindmill(toonGradient);
      building = wm.group;
      windmillBlades = wm.blades;
    } else if (npc.id === 'harbor-lighthouse') {
      building = buildLighthouse(toonGradient);
    } else if (npc.id === 'post-office') {
      building = buildCozyCottage(toonGradient, 0xfff7ed, 0x2563eb, 3.8, 2.6, 3.0);
    } else if (npc.id === 'sunset-cafe') {
      building = buildCozyCottage(toonGradient, 0xfef3c7, 0xd97706, 3.3, 2.3, 2.7);
    } else if (npc.id === 'ielts-observatory') {
      building = buildCozyCottage(toonGradient, 0xf3e8ff, 0x7c3aed, 3.4, 2.8, 2.8);
    } else {
      building = buildCozyCottage(toonGradient, 0xecfdf5, 0x16a34a, 3.4, 2.4, 2.8);
    }

    // Place building slightly offset from NPC so NPC stands warmly out front
    const tangent = new THREE.Vector3(0, 1, 0).cross(npc.dir);
    if (tangent.lengthSq() < 0.01) tangent.set(1, 0, 0);
    tangent.normalize();
    const buildDir = npc.dir.clone().addScaledVector(tangent, -0.14).normalize();
    placeOnSphere(building, buildDir, -0.25, idx * 0.9);
    planetGroup.add(building);

    // Place cute NPC character standing right beside the cottage
    const npcGroup = buildMessengerCharacter(toonGradient, {
      shirtColor: npc.shirtColor,
      hatColor: npc.hatColor,
      scarfColor: 0xf5bd33,
      hasMailbag: npc.id === 'post-office',
    });
    placeOnSphere(npcGroup, npc.dir, 0, idx * 1.1);
    planetGroup.add(npcGroup);

    // Subtle soft glowing halo ring at NPC's feet (lights up bright gold when active quest target!)
    const markerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.48, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf5bd33,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    markerRing.rotation.x = -Math.PI / 2;
    const ringHolder = new THREE.Group();
    ringHolder.add(markerRing);
    placeOnSphere(ringHolder, npc.dir, 0.14);
    planetGroup.add(ringHolder);

    landmarks.push({
      id: npc.id,
      title: npc.landmarkTitle,
      npc,
      worldPos: npc.dir.clone().multiplyScalar(PLANET_RADIUS),
      normal: npc.dir.clone().normalize(),
      npcGroup,
      markerRing,
    });
  });

  // 3. Populate 64 Lush Swaying Stylized Trees (Oak + Cherry Blossom!) + Rocks + Flowers
  const swayTrees: Array<{ group: THREE.Group; baseQuat: THREE.Quaternion; phase: number }> = [];
  const treePalette = [0x4ade80, 0x22c55e, 0x34d399, 0xf9a8d4, 0xfbcfe8, 0x84cc16];
  const rockMat = toon(0x94a3b8);
  const flowerColors = [0xfef08a, 0xf472b6, 0x60a5fa, 0xffffff];

  for (let i = 0; i < 64; i++) {
    // Golden-angle Fibonacci sphere distribution for balanced, natural forest groves
    const y = 1 - (i / 63) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 2.3999632;
    const dir = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize();

    // Keep clear of buildings & lake
    const nearBuilding = landmarks.some((lm) => lm.normal.distanceTo(dir) < 0.27);
    const inLake = dir.distanceTo(new THREE.Vector3(0.25, -0.82, -0.5).normalize()) < 0.37;
    if (nearBuilding || inLake) continue;

    const tree = buildStylizedTree(
      toonGradient,
      treePalette[i % treePalette.length],
      0.85 + (i % 4) * 0.2
    );
    placeOnSphere(tree, dir, -0.18, i * 0.7);
    planetGroup.add(tree);
    swayTrees.push({ group: tree, baseQuat: tree.quaternion.clone(), phase: i * 0.65 });
  }

  // Decorative smooth stones & flower tufts
  for (let i = 0; i < 70; i++) {
    const y = 1 - ((i + 0.5) / 70) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * 3.17 + 1.2;
    const dir = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize();
    if (dir.distanceTo(new THREE.Vector3(0.25, -0.82, -0.5).normalize()) < 0.36) continue;

    if (i % 3 === 0) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 + (i % 3) * 0.16, 0), rockMat);
      placeOnSphere(rock, dir, -0.1, i);
      planetGroup.add(rock);
    } else {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 6),
        new THREE.MeshBasicMaterial({ color: flowerColors[i % flowerColors.length] })
      );
      placeOnSphere(flower, dir, 0.12);
      planetGroup.add(flower);
    }
  }

  // 4. Orbiting Fluffy Clouds & Playful UFO Easter Egg!
  const cloudRing = new THREE.Group();
  const cloudMat = new THREE.MeshToonMaterial({
    color: 0xffffff,
    gradientMap: toonGradient,
    transparent: true,
    opacity: 0.92,
  });
  for (let i = 0; i < 14; i++) {
    const cGroup = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 8), cloudMat);
    const p2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), cloudMat);
    p2.position.set(1.25, -0.2, 0.2);
    const p3 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), cloudMat);
    p3.position.set(-1.15, -0.15, -0.15);
    cGroup.add(p1, p2, p3);
    cGroup.scale.set(1.2, 0.72, 0.9);

    const a = (i / 14) * Math.PI * 2;
    const lat = (i % 3 - 1) * 0.55;
    const dir = new THREE.Vector3(Math.cos(a) * Math.cos(lat), Math.sin(lat), Math.sin(a) * Math.cos(lat));
    placeOnSphere(cGroup, dir, 9.5 + (i % 3) * 2.2, a);
    cloudRing.add(cGroup);
  }
  scene.add(cloudRing);

  const ufoGroup = buildOrbitingUFO(toonGradient);
  scene.add(ufoGroup);

  // 5. 6 Fellow Student Messengers roaming & hopping around the planet!
  const peerNames = ['Minh Anh', 'Gia Huy', 'Khánh Linh', 'Tuấn Kiệt', 'Bảo Ngọc', 'Đức Anh'];
  const peerShirts = [0xf43f5e, 0x0ea5e9, 0x8b5cf6, 0x10b981, 0xf59e0b, 0xec4899];
  const roamingPeers: RoamingPeer[] = [];

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const posDir = new THREE.Vector3(Math.cos(a) * 0.8, (i % 2 === 0 ? 0.5 : -0.4), Math.sin(a) * 0.8).normalize();
    const velTangent = new THREE.Vector3(-Math.sin(a), 0.15, Math.cos(a)).normalize();
    const group = buildMessengerCharacter(toonGradient, {
      shirtColor: peerShirts[i],
      hatColor: 0x141517,
      scarfColor: 0xf5bd33,
      hasMailbag: true,
    });
    placeOnSphere(group, posDir, 0);
    planetGroup.add(group);
    roamingPeers.push({
      id: `peer-${i}`,
      name: peerNames[i],
      group,
      posDir,
      velTangent,
      hopPhase: i * 1.3,
      emojiCooldown: 4 + i * 2,
    });
  }

  return {
    planetGroup,
    landmarks,
    swayTrees,
    windmillBlades,
    ufoGroup,
    cloudRing,
    roamingPeers,
    toonGradient,
  };
}
