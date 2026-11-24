import * as THREE from 'three';

export interface SurfaceSample {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  radius: number;
}

const UP = new THREE.Vector3(0, 1, 0);

/** Deterministic seeded PRNG so city props always land in clean, consistent spots */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a cute anime-proportioned Japanese street lamp (matches chibi 0.135 scale) */
function makeStreetLamp(poleMat: THREE.Material, glowMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.56, 6), poleMat);
  pole.position.y = 0.28;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.018), poleMat);
  arm.position.set(0.06, 0.54, 0);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.04, 6), poleMat);
  cap.position.set(0.12, 0.53, 0);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), glowMat);
  bulb.position.set(0.12, 0.495, 0);
  g.add(pole, arm, cap, bulb);
  return g;
}

/** Build a yellow/red street postbox like in Messenger anime key art */
function makePostbox(boxMat: THREE.Material, slotMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.09), boxMat);
  body.position.y = 0.11;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.022, 0.095), slotMat);
  slot.position.set(0, 0.17, 0);
  const label = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.094), slotMat);
  label.position.set(0, 0.1, 0);
  g.add(body, slot, label);
  return g;
}

/** Build a retro Japanese drink vending machine */
function makeVendingMachine(bodyMat: THREE.Material, screenMat: THREE.Material, darkMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.36, 0.13), bodyMat);
  body.position.y = 0.18;
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.14, 0.015), screenMat);
  win.position.set(0, 0.25, 0.064);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.02), darkMat);
  tray.position.set(0, 0.065, 0.064);
  g.add(body, win, tray);
  return g;
}

/** Build a wooden park bench like in the Messenger street scene */
function makeBench(woodMat: THREE.Material, legMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.11), woodMat);
  seat.position.y = 0.095;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.02), woodMat);
  back.position.set(0, 0.16, -0.048);
  back.rotation.x = -0.15;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.095, 0.095), legMat);
  legL.position.set(-0.12, 0.047, 0);
  const legR = legL.clone();
  legR.position.x = 0.12;
  g.add(seat, back, legL, legR);
  return g;
}

/** Build a cute wooden planter box with lush anime bush */
function makePlanter(woodMat: THREE.Material, leafMat: THREE.Material, flowerMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.14), woodMat);
  pot.position.y = 0.04;
  const bush1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 0), leafMat);
  bush1.position.set(0, 0.11, 0);
  const bush2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.055, 0), leafMat);
  bush2.position.set(0.045, 0.1, 0.02);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), flowerMat);
  fl.position.set(-0.02, 0.16, 0.03);
  g.add(pot, bush1, bush2, fl);
  return g;
}

/**
 * Generates instanced anime grass tufts, wildflowers, and cozy Japanese city props
 * snapped cleanly onto the real BVH planet surface.
 */
export function createWorldDetails(
  toonGradient: THREE.DataTexture,
  sampleSurface: (dir: THREE.Vector3) => SurfaceSample | null
): THREE.Group {
  const root = new THREE.Group();
  root.name = 'AnimeWorldDetails';
  const rand = mulberry32(20261124);

  const toon = (hex: number) => new THREE.MeshToonMaterial({ color: hex, gradientMap: toonGradient });

  // 1. Instanced Anime Grass Tufts (~220 tufts = only 1 draw call!)
  const bladeGeo = new THREE.ConeGeometry(0.028, 0.14, 4);
  bladeGeo.translate(0, 0.07, 0);
  const grassMat = toon(0x4ba364);
  const MAX_GRASS = 240;
  const grassInst = new THREE.InstancedMesh(bladeGeo, grassMat, MAX_GRASS);
  grassInst.frustumCulled = false;

  // 2. Instanced Wildflowers (~70 blossoms = 1 draw call!)
  const flowerGeo = new THREE.DodecahedronGeometry(0.024, 0);
  const flowerMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGradient });
  const MAX_FLOWERS = 72;
  const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, MAX_FLOWERS);
  flowerInst.frustumCulled = false;
  const flowerPalette = [new THREE.Color(0xffe066), new THREE.Color(0xff9eb5), new THREE.Color(0xfffdf5)];

  const dummy = new THREE.Object3D();
  const dir = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const spinQ = new THREE.Quaternion();
  let gIdx = 0;
  let fIdx = 0;

  // Scatter anime grass clusters & wildflowers on gentle grassy hills across the planet
  for (let i = 0; i < 420 && gIdx < MAX_GRASS - 3; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    dir.set(s * Math.cos(theta), u, s * Math.sin(theta)).normalize();

    const hit = sampleSurface(dir);
    if (!hit) continue;
    // Only place on gentle upward-facing land above shoreline
    if (hit.radius < 7.25 || hit.normal.dot(dir) < 0.78) continue;

    // Place a 3-blade anime grass tuft cluster
    const clusterCount = 2 + Math.floor(rand() * 2);
    for (let b = 0; b < clusterCount && gIdx < MAX_GRASS; b++) {
      const jitterX = (rand() - 0.5) * 0.09;
      const jitterZ = (rand() - 0.5) * 0.09;
      quat.setFromUnitVectors(UP, dir);
      spinQ.setFromAxisAngle(UP, rand() * Math.PI * 2);
      dummy.position.copy(hit.point);
      dummy.quaternion.copy(quat).multiply(spinQ);
      dummy.translateX(jitterX);
      dummy.translateZ(jitterZ);
      dummy.rotateZ((rand() - 0.5) * 0.45);
      const sc = 0.75 + rand() * 0.75;
      dummy.scale.set(sc, sc * (0.85 + rand() * 0.5), sc);
      dummy.updateMatrix();
      grassInst.setMatrixAt(gIdx++, dummy.matrix);
    }

    if (fIdx < MAX_FLOWERS && rand() > 0.62) {
      quat.setFromUnitVectors(UP, dir);
      dummy.position.copy(hit.point).addScaledVector(dir, 0.055);
      dummy.quaternion.copy(quat);
      dummy.scale.setScalar(0.8 + rand() * 0.6);
      dummy.updateMatrix();
      flowerInst.setMatrixAt(fIdx, dummy.matrix);
      flowerInst.setColorAt(fIdx, flowerPalette[fIdx % flowerPalette.length]);
      fIdx++;
    }
  }
  grassInst.count = gIdx;
  grassInst.instanceMatrix.needsUpdate = true;
  flowerInst.count = fIdx;
  flowerInst.instanceMatrix.needsUpdate = true;
  if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
  root.add(grassInst, flowerInst);

  // 3. Cozy Japanese Town Props around the main town & quest landmarks
  const poleMat = toon(0x3a464e);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
  const yellowBoxMat = toon(0xf4b942);
  const redBoxMat = toon(0xd94848);
  const whiteSlotMat = toon(0xf5f5f0);
  const mintVendMat = toon(0x7cc9b8);
  const coralVendMat = toon(0xe67365);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0xe6f9ff });
  const woodMat = toon(0xa67c52);
  const darkIronMat = toon(0x2d3740);
  const bushLeafMat = toon(0x459960);
  const blossomMat = toon(0xffdf6b);

  // Hand-picked neighborhood anchor regions (Northern Town, Cliffside, Waterfall, Harbor, South)
  const townAnchors = [
    new THREE.Vector3(0.22, 0.86, 0.46),
    new THREE.Vector3(0.12, 0.91, 0.39),
    new THREE.Vector3(0.32, 0.84, 0.43),
    new THREE.Vector3(0.05, 0.88, 0.47),
    new THREE.Vector3(-0.18, 0.85, 0.49),
    new THREE.Vector3(-0.56, 0.71, 0.42),
    new THREE.Vector3(0.74, 0.18, -0.64),
    new THREE.Vector3(-0.45, -0.68, 0.57),
    new THREE.Vector3(0.30, -0.82, -0.48),
  ];

  const placeProp = (prop: THREE.Group, targetDir: THREE.Vector3, yawRad: number) => {
    const hit = sampleSurface(targetDir.clone().normalize());
    if (!hit || hit.radius < 6.8 || hit.normal.dot(targetDir.clone().normalize()) < 0.72) return;
    const upDir = targetDir.clone().normalize();
    prop.position.copy(hit.point);
    quat.setFromUnitVectors(UP, upDir);
    spinQ.setFromAxisAngle(UP, yawRad);
    prop.quaternion.copy(quat).multiply(spinQ);
    root.add(prop);
  };

  townAnchors.forEach((anchor, idx) => {
    const baseDir = anchor.clone().normalize();
    const t1 = new THREE.Vector3(1, 0, 0).cross(baseDir);
    if (t1.lengthSq() < 0.01) t1.set(0, 0, 1).cross(baseDir);
    t1.normalize();
    const t2 = baseDir.clone().cross(t1).normalize();

    // Street lamp at each neighborhood anchor
    placeProp(
      makeStreetLamp(poleMat, glowMat),
      baseDir.clone().addScaledVector(t1, 0.045),
      idx * 1.1
    );

    // Alternating yellow/red postbox, vending machine, wooden bench, and potted plants
    if (idx % 2 === 0) {
      placeProp(
        makePostbox(idx % 4 === 0 ? yellowBoxMat : redBoxMat, whiteSlotMat),
        baseDir.clone().addScaledVector(t2, 0.055),
        idx * 0.9
      );
    } else {
      placeProp(
        makeVendingMachine(idx % 3 === 0 ? mintVendMat : coralVendMat, screenMat, darkIronMat),
        baseDir.clone().addScaledVector(t2, -0.055),
        idx * 1.3
      );
    }

    placeProp(
      makeBench(woodMat, darkIronMat),
      baseDir.clone().addScaledVector(t1, -0.06).addScaledVector(t2, 0.03),
      idx * 0.7 + 0.5
    );

    placeProp(
      makePlanter(woodMat, bushLeafMat, blossomMat),
      baseDir.clone().addScaledVector(t1, 0.025).addScaledVector(t2, -0.045),
      idx * 1.7
    );
  });

  return root;
}
