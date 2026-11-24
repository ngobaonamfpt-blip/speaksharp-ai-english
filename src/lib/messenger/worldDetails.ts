import * as THREE from 'three';

export interface SurfaceSample {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  radius: number;
}

export interface WorldDetailsBundle {
  group: THREE.Group;
  update: (elapsed: number) => void;
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

/** Inject gentle GPU wind sway into grass & wildflower toon materials (0 CPU cost!) */
function applyWindSway(mat: THREE.MeshToonMaterial, timeUniform: { value: number }, amp = 0.045) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = timeUniform;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uWindTime;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float swayH = max(0.0, position.y);
        float phase = uWindTime * 2.4 + position.x * 14.0 + position.z * 11.0;
        transformed.x += sin(phase) * swayH * ${amp.toFixed(3)};
        transformed.z += cos(phase * 0.85) * swayH * ${(amp * 0.7).toFixed(3)};`
      );
  };
}

/** Build a detailed anime-proportioned Japanese street lamp with flanged base, collar & shade rim */
function makeStreetLamp(poleMat: THREE.Material, glowMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.06, 6), poleMat);
  base.position.y = 0.03;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.016, 0.54, 6), poleMat);
  pole.position.y = 0.30;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.025, 6), poleMat);
  collar.position.y = 0.52;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.016, 0.016), poleMat);
  arm.position.set(0.065, 0.55, 0);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.01, 0.01), poleMat);
  brace.position.set(0.035, 0.525, 0);
  brace.rotation.z = 0.48;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.042, 8), poleMat);
  cap.position.set(0.13, 0.535, 0);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), glowMat);
  bulb.position.set(0.13, 0.498, 0);
  g.add(base, pole, collar, arm, brace, cap, bulb);
  return g;
}

/** Build a swaying Japanese nobori shop banner flag on a wooden pole */
function makeSwayingBanner(
  poleMat: THREE.Material,
  clothMat: THREE.Material,
  stripeMat: THREE.Material
): { group: THREE.Group; flagPivot: THREE.Group } {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.52, 6), poleMat);
  pole.position.y = 0.26;
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 5), poleMat);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.set(0.075, 0.49, 0);

  const flagPivot = new THREE.Group();
  flagPivot.position.set(0.075, 0.48, 0);
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.009), clothMat);
  cloth.position.y = -0.14;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.144, 0.045, 0.012), stripeMat);
  band.position.y = -0.22;
  flagPivot.add(cloth, band);

  g.add(pole, crossbar, flagPivot);
  return { group: g, flagPivot };
}

/** Build a cozy hanging paper lantern post that sways gently in the breeze */
function makeHangingLantern(
  poleMat: THREE.Material,
  lanternMat: THREE.Material,
  capMat: THREE.Material
): { group: THREE.Group; lanternPivot: THREE.Group } {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.46, 6), poleMat);
  pole.position.y = 0.23;
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.014, 0.014), poleMat);
  hook.position.set(0.055, 0.45, 0);

  const lanternPivot = new THREE.Group();
  lanternPivot.position.set(0.11, 0.44, 0);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 4), capMat);
  cord.position.y = -0.03;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), lanternMat);
  body.scale.set(0.92, 1.25, 0.92);
  body.position.y = -0.105;
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.016, 8), capMat);
  topCap.position.y = -0.055;
  const botCap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.016, 8), capMat);
  botCap.position.y = -0.155;
  lanternPivot.add(cord, body, topCap, botCap);

  g.add(pole, hook, lanternPivot);
  return { group: g, lanternPivot };
}

/** Build a detailed Japanese street postbox with pedestal leg, rain hood & mail slot */
function makePostbox(boxMat: THREE.Material, slotMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.11, 6), slotMat);
  stand.position.y = 0.055;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.19, 0.095), boxMat);
  body.position.y = 0.19;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.136, 0.024, 0.11), boxMat);
  roof.position.y = 0.292;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.102), slotMat);
  slot.position.set(0, 0.245, 0);
  const label = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.062, 0.10), slotMat);
  label.position.set(0, 0.165, 0);
  g.add(stand, body, roof, slot, label);
  return g;
}

/** Build a detailed retro Japanese drink vending machine with drink rows, buttons & pickup chute */
function makeVendingMachine(
  bodyMat: THREE.Material,
  screenMat: THREE.Material,
  darkMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const feet = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.025, 0.12), darkMat);
  feet.position.y = 0.012;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.36, 0.135), bodyMat);
  body.position.y = 0.20;
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.022, 0.145), darkMat);
  topTrim.position.y = 0.385;
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.145, 0.016), screenMat);
  win.position.set(0, 0.275, 0.066);
  const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.012, 0.02), darkMat);
  shelf1.position.set(0, 0.275, 0.07);
  const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.012, 0.02), darkMat);
  shelf2.position.set(0, 0.225, 0.07);
  const coinPanel = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.018), darkMat);
  coinPanel.position.set(0.065, 0.155, 0.066);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.055, 0.022), darkMat);
  tray.position.set(0, 0.075, 0.066);
  g.add(feet, body, topTrim, win, shelf1, shelf2, coinPanel, tray);
  return g;
}

/** Build a detailed wooden park bench with individual slats, iron armrests & crossbars */
function makeBench(woodMat: THREE.Material, legMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const seat1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.018, 0.046), woodMat);
  seat1.position.set(0, 0.095, 0.028);
  const seat2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.018, 0.046), woodMat);
  seat2.position.set(0, 0.095, -0.026);
  const back1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.036, 0.016), woodMat);
  back1.position.set(0, 0.145, -0.05);
  back1.rotation.x = -0.16;
  const back2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.036, 0.016), woodMat);
  back2.position.set(0, 0.188, -0.058);
  back2.rotation.x = -0.16;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.095, 0.105), legMat);
  legL.position.set(-0.135, 0.047, 0);
  const legR = legL.clone();
  legR.position.x = 0.135;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.016, 0.115), legMat);
  armL.position.set(-0.145, 0.142, 0);
  const armR = armL.clone();
  armR.position.x = 0.145;
  g.add(seat1, seat2, back1, back2, legL, legR, armL, armR);
  return g;
}

/** Build a detailed wooden planter box with rim frame & lush layered anime foliage */
function makePlanter(
  woodMat: THREE.Material,
  leafMat: THREE.Material,
  flowerMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.085, 0.14), woodMat);
  pot.position.y = 0.042;
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.158, 0.02, 0.158), woodMat);
  rim.position.y = 0.088;
  const bush1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 0), leafMat);
  bush1.position.set(0, 0.125, 0);
  const bush2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.055, 0), leafMat);
  bush2.position.set(0.045, 0.115, 0.02);
  const bush3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05, 0), leafMat);
  bush3.position.set(-0.04, 0.11, -0.02);
  const fl1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.022, 0), flowerMat);
  fl1.position.set(-0.02, 0.18, 0.03);
  const fl2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.018, 0), flowerMat);
  fl2.position.set(0.04, 0.165, -0.01);
  g.add(pot, rim, bush1, bush2, bush3, fl1, fl2);
  return g;
}

/**
 * Generates living animated world details snapped cleanly onto the real BVH planet surface:
 * - Wind-swaying anime grass tufts (240) & wildflowers (72)
 * - Swaying Japanese shop banners, hanging glowing paper lanterns, lamps, benches, postboxes & vending machines
 * - Flapping 3D anime butterflies orbiting meadow & town spots
 * - Sweeping translucent Studio Ghibli / Abeto wind breeze ribbons
 * - Drifting sunlit blossom petals & rising cel-shaded chimney smoke puffs
 */
export function createWorldDetails(
  toonGradient: THREE.DataTexture,
  sampleSurface: (dir: THREE.Vector3) => SurfaceSample | null
): WorldDetailsBundle {
  const root = new THREE.Group();
  root.name = 'AnimeWorldDetails';
  const rand = mulberry32(20261124);
  const windTime = { value: 0 };

  const toon = (hex: number) => new THREE.MeshToonMaterial({ color: hex, gradientMap: toonGradient });

  // 1. Wind-Swaying Instanced Anime Grass Tufts (~240 tufts = 1 draw call!)
  const bladeGeo = new THREE.ConeGeometry(0.028, 0.14, 4);
  bladeGeo.translate(0, 0.07, 0);
  const grassMat = toon(0x4ba364);
  applyWindSway(grassMat, windTime, 0.18);
  const MAX_GRASS = 240;
  const grassInst = new THREE.InstancedMesh(bladeGeo, grassMat, MAX_GRASS);
  grassInst.frustumCulled = false;

  // 2. Wind-Swaying Instanced Wildflowers (~72 blossoms = 1 draw call!)
  const flowerGeo = new THREE.DodecahedronGeometry(0.024, 0);
  const flowerMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGradient });
  applyWindSway(flowerMat, windTime, 0.09);
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
  const meadowSpots: Array<{ point: THREE.Vector3; up: THREE.Vector3 }> = [];

  for (let i = 0; i < 420 && gIdx < MAX_GRASS - 3; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    dir.set(s * Math.cos(theta), u, s * Math.sin(theta)).normalize();

    const hit = sampleSurface(dir);
    if (!hit) continue;
    if (hit.radius < 7.25 || hit.normal.dot(dir) < 0.78) continue;

    if (meadowSpots.length < 24) {
      meadowSpots.push({ point: hit.point.clone(), up: dir.clone() });
    }

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

  // 3. Cozy Japanese Town Props + Swaying Shop Banners & Hanging Paper Lanterns
  const poleMat = toon(0x3a464e);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
  const lanternWarmMat = new THREE.MeshBasicMaterial({ color: 0xffe4a0 });
  const lanternCoralMat = new THREE.MeshBasicMaterial({ color: 0xffb38a });
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
  const bannerMats = [toon(0xe05d4f), toon(0x4fa39c), toon(0xf0b849), toon(0x5b7fa6)];

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

  const swayingItems: Array<{ pivot: THREE.Group; phase: number; amp: number; speed: number }> = [];
  const smokeOrigins: Array<{ pos: THREE.Vector3; up: THREE.Vector3 }> = [];

  const placeProp = (prop: THREE.Group, targetDir: THREE.Vector3, yawRad: number) => {
    const upDir = targetDir.clone().normalize();
    const hit = sampleSurface(upDir);
    if (!hit || hit.radius < 6.8 || hit.normal.dot(upDir) < 0.72) return null;
    prop.position.copy(hit.point);
    quat.setFromUnitVectors(UP, upDir);
    spinQ.setFromAxisAngle(UP, yawRad);
    prop.quaternion.copy(quat).multiply(spinQ);
    root.add(prop);
    return { point: hit.point.clone(), up: upDir };
  };

  townAnchors.forEach((anchor, idx) => {
    const baseDir = anchor.clone().normalize();
    const t1 = new THREE.Vector3(1, 0, 0).cross(baseDir);
    if (t1.lengthSq() < 0.01) t1.set(0, 0, 1).cross(baseDir);
    t1.normalize();
    const t2 = baseDir.clone().cross(t1).normalize();

    // Street lamp
    placeProp(
      makeStreetLamp(poleMat, glowMat),
      baseDir.clone().addScaledVector(t1, 0.045),
      idx * 1.1
    );

    // Swaying Japanese cloth shop banner!
    const banner = makeSwayingBanner(woodMat, bannerMats[idx % bannerMats.length], whiteSlotMat);
    const placedB = placeProp(
      banner.group,
      baseDir.clone().addScaledVector(t1, 0.075).addScaledVector(t2, -0.025),
      idx * 1.4
    );
    if (placedB) {
      swayingItems.push({ pivot: banner.flagPivot, phase: idx * 0.9, amp: 0.19, speed: 2.3 });
    }

    // Swaying warm glowing paper lantern!
    const lantern = makeHangingLantern(
      darkIronMat,
      idx % 2 === 0 ? lanternWarmMat : lanternCoralMat,
      darkIronMat
    );
    const placedL = placeProp(
      lantern.group,
      baseDir.clone().addScaledVector(t2, 0.085),
      idx * 0.8 + 1.2
    );
    if (placedL) {
      swayingItems.push({ pivot: lantern.lanternPivot, phase: idx * 1.3 + 0.5, amp: 0.14, speed: 1.9 });
      if (smokeOrigins.length < 4) {
        smokeOrigins.push({
          pos: placedL.point.clone().addScaledVector(placedL.up, 1.05),
          up: placedL.up.clone(),
        });
      }
    }

    if (idx % 2 === 0) {
      placeProp(
        makePostbox(idx % 4 === 0 ? yellowBoxMat : redBoxMat, whiteSlotMat),
        baseDir.clone().addScaledVector(t2, 0.048),
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
      baseDir.clone().addScaledVector(t1, -0.03).addScaledVector(t2, -0.04),
      idx * 1.7
    );
  });

  // 4. Animated Flapping 3D Anime Butterflies (14 colorful butterflies fluttering over town & meadows!)
  const butterflyGroup = new THREE.Group();
  butterflyGroup.name = 'AnimeButterflies';
  const wingGeo = new THREE.PlaneGeometry(0.032, 0.024);
  wingGeo.translate(0.016, 0, 0);
  const bfColors = [0xffe45e, 0xfffdf5, 0x93e5f5, 0xffb3c6];
  const bfMats = bfColors.map(
    (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })
  );

  const butterflies: Array<{
    root: THREE.Group;
    lw: THREE.Mesh;
    rw: THREE.Mesh;
    center: THREE.Vector3;
    up: THREE.Vector3;
    t1: THREE.Vector3;
    t2: THREE.Vector3;
    radius: number;
    speed: number;
    phase: number;
  }> = [];

  const bfAnchors = [
    ...townAnchors.slice(0, 6).map((a) => {
      const u = a.clone().normalize();
      const h = sampleSurface(u);
      return { point: h ? h.point.clone() : u.clone().multiplyScalar(7.6), up: u };
    }),
    ...meadowSpots.slice(0, 8),
  ];

  bfAnchors.forEach((spot, idx) => {
    const bRoot = new THREE.Group();
    const mat = bfMats[idx % bfMats.length];
    const lw = new THREE.Mesh(wingGeo, mat);
    const rw = new THREE.Mesh(wingGeo, mat);
    rw.rotation.y = Math.PI;
    bRoot.add(lw, rw);
    butterflyGroup.add(bRoot);

    const t1 = new THREE.Vector3(1, 0, 0).cross(spot.up);
    if (t1.lengthSq() < 0.01) t1.set(0, 0, 1).cross(spot.up);
    t1.normalize();
    const t2 = spot.up.clone().cross(t1).normalize();

    butterflies.push({
      root: bRoot,
      lw,
      rw,
      center: spot.point.clone().addScaledVector(spot.up, 0.28 + (idx % 3) * 0.14),
      up: spot.up.clone(),
      t1,
      t2,
      radius: 0.24 + (idx % 4) * 0.09,
      speed: 0.9 + (idx % 3) * 0.35,
      phase: idx * 1.37,
    });
  });
  root.add(butterflyGroup);

  // 5. Sweeping Anime Wind Breeze Ribbons gliding across the planet's sky & streets!
  const windGroup = new THREE.Group();
  windGroup.name = 'AnimeWindStreaks';
  const windRibbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.75, 0, 0),
    new THREE.Vector3(-0.25, 0.07, 0.05),
    new THREE.Vector3(0.25, -0.05, -0.04),
    new THREE.Vector3(0.75, 0.03, 0),
  ]);
  const windRibbonGeo = new THREE.TubeGeometry(windRibbonCurve, 14, 0.012, 4, false);
  const windStreaks: Array<{
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    orbitR: number;
    lat: number;
    speed: number;
    phase: number;
  }> = [];

  for (let i = 0; i < 8; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf7fffd,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    const m = new THREE.Mesh(windRibbonGeo, mat);
    m.scale.set(1.15 + (i % 3) * 0.35, 1, 1);
    windGroup.add(m);
    windStreaks.push({
      mesh: m,
      mat,
      orbitR: 8.8 + (i % 4) * 0.55,
      lat: ((i % 5) - 2) * 0.38,
      speed: 0.22 + (i % 3) * 0.06,
      phase: (i / 8) * Math.PI * 2,
    });
  }
  root.add(windGroup);

  // 6. Drifting Sunlit Blossom Petals / Pollen Motes (48 instanced motes = 1 draw call!)
  const petalGeo = new THREE.PlaneGeometry(0.036, 0.022);
  const petalMat = new THREE.MeshBasicMaterial({
    color: 0xfff8e7,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
  });
  const PETAL_COUNT = 48;
  const petalInst = new THREE.InstancedMesh(petalGeo, petalMat, PETAL_COUNT);
  petalInst.frustumCulled = false;
  const petalSeeds = Array.from({ length: PETAL_COUNT }, (_, i) => ({
    r: 8.15 + rand() * 1.45,
    lon: rand() * Math.PI * 2,
    lat: (rand() - 0.5) * Math.PI * 0.85,
    speed: 0.06 + rand() * 0.08,
    bobAmp: 0.08 + rand() * 0.14,
    phase: i * 0.73,
  }));
  const petalPalette = [new THREE.Color(0xfffcf2), new THREE.Color(0xffd6e0), new THREE.Color(0xfff1a8)];
  for (let i = 0; i < PETAL_COUNT; i++) {
    petalInst.setColorAt(i, petalPalette[i % petalPalette.length]);
  }
  if (petalInst.instanceColor) petalInst.instanceColor.needsUpdate = true;
  root.add(petalInst);

  // 7. Rising Cel-Shaded Chimney Smoke Puffs above harbor rooftops
  const smokeGroup = new THREE.Group();
  smokeGroup.name = 'ChimneySmoke';
  const smokeGeo = new THREE.DodecahedronGeometry(0.042, 0);
  const smokePuffs: Array<{
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    origin: THREE.Vector3;
    up: THREE.Vector3;
    offset: number;
  }> = [];

  smokeOrigins.forEach((so, sIdx) => {
    for (let k = 0; k < 4; k++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xf4f7f5,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const m = new THREE.Mesh(smokeGeo, mat);
      smokeGroup.add(m);
      smokePuffs.push({
        mesh: m,
        mat,
        origin: so.pos,
        up: so.up,
        offset: k / 4 + sIdx * 0.17,
      });
    }
  });
  root.add(smokeGroup);

  // Zero-GC scratch vectors for per-frame living world update
  const tmpPos = new THREE.Vector3();
  const tmpNext = new THREE.Vector3();
  const tmpAxis = new THREE.Vector3();

  const update = (elapsed: number) => {
    windTime.value = elapsed;

    // 1. Sway street banners & hanging lanterns
    for (let i = 0; i < swayingItems.length; i++) {
      const item = swayingItems[i];
      item.pivot.rotation.z = Math.sin(elapsed * item.speed + item.phase) * item.amp;
      item.pivot.rotation.x = Math.cos(elapsed * (item.speed * 0.75) + item.phase) * (item.amp * 0.5);
    }

    // 2. Fluttering butterflies in figure-8 loops
    for (let i = 0; i < butterflies.length; i++) {
      const b = butterflies[i];
      const a = elapsed * b.speed + b.phase;
      const dx = Math.cos(a) * b.radius;
      const dy = Math.sin(a * 2) * (b.radius * 0.55);
      const lift = Math.sin(a * 1.7) * 0.08;
      tmpPos
        .copy(b.center)
        .addScaledVector(b.t1, dx)
        .addScaledVector(b.t2, dy)
        .addScaledVector(b.up, lift);
      b.root.position.copy(tmpPos);

      const na = a + 0.08;
      tmpNext
        .copy(b.center)
        .addScaledVector(b.t1, Math.cos(na) * b.radius)
        .addScaledVector(b.t2, Math.sin(na * 2) * (b.radius * 0.55))
        .addScaledVector(b.up, Math.sin(na * 1.7) * 0.08);
      b.root.lookAt(tmpNext);

      const flap = 0.25 + Math.abs(Math.sin(elapsed * 16 + b.phase)) * 0.95;
      b.lw.rotation.z = flap;
      b.rw.rotation.z = -flap;
    }

    // 3. Sweeping anime wind breeze ribbons
    for (let i = 0; i < windStreaks.length; i++) {
      const ws = windStreaks[i];
      const a = elapsed * ws.speed + ws.phase;
      const na = a + 0.06;
      const cosLat = Math.cos(ws.lat);
      const sinLat = Math.sin(ws.lat);
      ws.mesh.position.set(
        Math.cos(a) * ws.orbitR * cosLat,
        sinLat * ws.orbitR,
        Math.sin(a) * ws.orbitR * cosLat
      );
      tmpNext.set(
        Math.cos(na) * ws.orbitR * cosLat,
        sinLat * ws.orbitR,
        Math.sin(na) * ws.orbitR * cosLat
      );
      ws.mesh.lookAt(tmpNext);
      // Smoothly fade in and out along wind gust cycle
      const gust = Math.max(0, Math.sin(elapsed * 0.85 + ws.phase * 1.7));
      ws.mat.opacity = gust * 0.36;
    }

    // 4. Drifting sunlit blossom petals
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = petalSeeds[i];
      const lon = p.lon + elapsed * p.speed;
      const r = p.r + Math.sin(elapsed * 1.3 + p.phase) * p.bobAmp;
      const cosLat = Math.cos(p.lat);
      dummy.position.set(
        Math.cos(lon) * r * cosLat,
        Math.sin(p.lat) * r,
        Math.sin(lon) * r * cosLat
      );
      dummy.rotation.set(elapsed * 1.2 + p.phase, elapsed * 0.9 + p.phase, elapsed * 0.7);
      dummy.scale.setScalar(0.85 + Math.sin(elapsed * 2 + p.phase) * 0.2);
      dummy.updateMatrix();
      petalInst.setMatrixAt(i, dummy.matrix);
    }
    petalInst.instanceMatrix.needsUpdate = true;

    // 5. Rising cel-shaded chimney smoke puffs
    for (let i = 0; i < smokePuffs.length; i++) {
      const sp = smokePuffs[i];
      const cycle = (elapsed * 0.22 + sp.offset) % 1;
      tmpAxis.set(1, 0, 0).cross(sp.up);
      if (tmpAxis.lengthSq() < 0.01) tmpAxis.set(0, 0, 1).cross(sp.up);
      tmpAxis.normalize();
      sp.mesh.position
        .copy(sp.origin)
        .addScaledVector(sp.up, cycle * 0.95)
        .addScaledVector(tmpAxis, Math.sin(cycle * Math.PI * 2 + i) * 0.12);
      const sc = 0.45 + cycle * 0.95;
      sp.mesh.scale.setScalar(sc);
      sp.mat.opacity = Math.sin(cycle * Math.PI) * 0.38;
    }
  };

  return { group: root, update };
}
