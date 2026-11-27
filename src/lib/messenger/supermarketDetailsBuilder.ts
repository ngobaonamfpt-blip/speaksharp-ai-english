import * as THREE from 'three';
import { createMarketBeveledBox, makeMarketCanvasTex, makeMarketSignTex } from './supermarketSceneBuilder';

/** Detailed chrome wire shopping cart with 4 swivel wheels, red push-handle & optional groceries! */
function makeShoppingCart(
  toon: (h: number) => THREE.MeshToonMaterial,
  chromeMat: THREE.Material,
  withGroceries: boolean
): THREE.Group {
  const g = new THREE.Group();
  const darkMat = toon(0x1e293b);
  const redMat = toon(0xef4444);

  // Lower chassis frame + 4 wheels
  const frame = new THREE.Mesh(createMarketBeveledBox(0.62, 0.06, 0.92, 0.06, 0.012), chromeMat);
  frame.position.y = 0.14;
  [
    [-0.26, -0.36],
    [0.26, -0.36],
    [-0.26, 0.36],
    [0.26, 0.36],
  ].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.045, 8), darkMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.065, wz);
    g.add(wheel);
  });

  // Basket support legs
  ([-0.24, 0.24] as const).forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 6), chromeMat);
    leg.position.set(lx, 0.4, 0.28);
    leg.rotation.x = 0.18;
    g.add(leg);
  });

  // Translucent chrome basket body + rim + red handle
  const basket = new THREE.Mesh(
    createMarketBeveledBox(0.68, 0.44, 0.88, 0.08, 0.018),
    new THREE.MeshToonMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.72 })
  );
  basket.position.set(0, 0.44, -0.02);
  basket.castShadow = true;

  const rim = new THREE.Mesh(createMarketBeveledBox(0.72, 0.06, 0.92, 0.08, 0.012), redMat);
  rim.position.set(0, 0.86, -0.02);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 10), redMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.96, 0.45);

  g.add(frame, basket, rim, handle);

  if (withGroceries) {
    const milk = new THREE.Mesh(createMarketBeveledBox(0.2, 0.34, 0.2, 0.02, 0.008), toon(0x38bdf8));
    milk.position.set(-0.14, 0.56, -0.15);
    const cereal = new THREE.Mesh(createMarketBeveledBox(0.24, 0.36, 0.12, 0.02, 0.008), toon(0xf59e0b));
    cereal.position.set(0.14, 0.56, -0.12);
    const baguette = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 4, 8), toon(0xd98a3c));
    baguette.rotation.z = -0.35;
    baguette.position.set(0.05, 0.84, 0.12);
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), toon(0xef4444));
    apple.position.set(-0.14, 0.72, 0.14);
    g.add(milk, cereal, baguette, apple);
  }
  return g;
}

/** Cute wooden A-frame weekly deals chalkboard near entrance */
function makeDealsAFrame(oakMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const tex = makeMarketCanvasTex(256, 340, (ctx, w, h) => {
    ctx.fillStyle = '#1e2b24';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#fde047';
    ctx.font = '900 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌟 TODAY’S DEALS', w / 2, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillText('🍊 Orange Juice', w / 2, 110);
    ctx.fillStyle = '#4ade80';
    ctx.font = '900 26px system-ui, sans-serif';
    ctx.fillText('20% OFF!', w / 2, 146);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillText('🥐 Warm Croissants', w / 2, 206);
    ctx.fillStyle = '#fb923c';
    ctx.fillText('Fresh Every Hour', w / 2, 240);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 17px system-ui, sans-serif';
    ctx.fillText('♻ Bring Reusable Bag!', w / 2, 300);
  });

  const boardF = new THREE.Mesh(createMarketBeveledBox(0.92, 1.24, 0.08, 0.04, 0.015), oakMat);
  boardF.position.set(0, 0, 0.16);
  boardF.rotation.x = -0.18;
  boardF.castShadow = true;
  const faceF = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshBasicMaterial({ map: tex }));
  faceF.position.set(0, 0.62, 0.22);
  faceF.rotation.x = -0.18;

  const boardB = new THREE.Mesh(createMarketBeveledBox(0.92, 1.24, 0.08, 0.04, 0.015), oakMat);
  boardB.position.set(0, 0, -0.16);
  boardB.rotation.x = 0.18;
  g.add(boardF, faceF, boardB);
  return g;
}

/**
 * Adds rich international supermarket storytelling details:
 * - Fresh Flowers Boutique Corner (right front)
 * - Deli & Sushi Grab-and-Go Cooler (right wall)
 * - Ice Cream & Frozen Gelato Island Freezer (left wall)
 * - Express Self-Checkout Kiosks (left front wall)
 * - Detailed Shopping Carts (one loaded with groceries in foreground!) + Handheld Basket Stack
 * - Weekly Deals A-Frame Chalkboard + Free Juice Tasting Sample Stand
 * - Floor Wayfinding Decals & Potted Citrus Trees
 */
export function addSupermarketRichDetails(
  root: THREE.Group,
  toon: (hex: number) => THREE.MeshToonMaterial,
  oakMat: THREE.Material,
  steelMat: THREE.Material,
  chromeMat: THREE.Material
): (elapsed: number) => void {
  // 1. WEEKLY DEALS A-FRAME CHALKBOARD (Foreground Left — fills spawn nicely!)
  const aFrame = makeDealsAFrame(oakMat);
  aFrame.position.set(-2.1, 0, 5.2);
  aFrame.rotation.y = 0.32;
  root.add(aFrame);

  // 2. FOREGROUND LOADED SHOPPING CART + CART CORRAL + HANDHELD BASKET STACK!
  const heroCart = makeShoppingCart(toon, chromeMat, true);
  heroCart.position.set(2.45, 0, 5.55);
  heroCart.rotation.y = -0.45;
  root.add(heroCart);

  for (let c = 0; c < 3; c++) {
    const cart = makeShoppingCart(toon, chromeMat, c === 0);
    cart.position.set(5.4 + c * 1.05, 0, 7.6);
    cart.rotation.y = Math.PI;
    root.add(cart);
  }

  // Stack of green handheld shopping baskets near entrance
  const basketStack = new THREE.Group();
  const bBase = new THREE.Mesh(createMarketBeveledBox(0.6, 0.08, 0.44, 0.05, 0.012), chromeMat);
  basketStack.add(bBase);
  for (let b = 0; b < 5; b++) {
    const bk = new THREE.Mesh(
      createMarketBeveledBox(0.54, 0.18, 0.38, 0.06, 0.012),
      toon(b % 2 === 0 ? 0x16a34a : 0x22c55e)
    );
    bk.position.y = 0.08 + b * 0.14;
    basketStack.add(bk);
  }
  basketStack.position.set(-2.2, 0, 7.4);
  root.add(basketStack);

  // 3. FRESH FLOWERS BOUTIQUE CORNER (Right Front Wall!)
  const flowerGroup = new THREE.Group();
  const fTier1 = new THREE.Mesh(createMarketBeveledBox(1.1, 0.55, 3.2, 0.08, 0.02), oakMat);
  const fTier2 = new THREE.Mesh(createMarketBeveledBox(0.65, 1.05, 3.1, 0.08, 0.02), oakMat);
  fTier2.position.set(0.24, 0, 0);
  const fSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 0.65),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('FRESH FLOWERS', 'HOA TƯƠI MỖI NGÀY', '#be185d', '#ffffff', '#fbcfe8', '💐'),
    })
  );
  fSign.position.set(-0.32, 2.35, 0);
  fSign.rotation.y = -Math.PI / 2;

  const bloomCols = [0xf43f5e, 0xfacc15, 0xec4899, 0xa855f7, 0xfb923c];
  const stemMat = toon(0x16a34a);
  const potMat = toon(0xc26d3a);
  for (let i = 0; i < 6; i++) {
    const fz = -1.25 + i * 0.5;
    const isTop = i % 2 === 1;
    const fx = isTop ? 0.2 : -0.22;
    const fy = isTop ? 1.06 : 0.56;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.24, 8), potMat);
    pot.position.set(fx, fy + 0.12, fz);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 1), stemMat);
    bush.position.set(fx, fy + 0.34, fz);
    const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), toon(bloomCols[i % bloomCols.length]));
    bloom.position.set(fx - 0.04, fy + 0.48, fz);
    flowerGroup.add(pot, bush, bloom);
  }
  flowerGroup.add(fTier1, fTier2, fSign);
  flowerGroup.position.set(11.4, 0, 5.2);
  root.add(flowerGroup);

  // 4. DELI & SUSHI GRAB-AND-GO COOLER (Right Wall!)
  const deliGroup = new THREE.Group();
  const deliBase = new THREE.Mesh(createMarketBeveledBox(0.95, 2.35, 4.4, 0.08, 0.025), toon(0x1e293b));
  const deliTex = makeMarketCanvasTex(512, 260, (ctx, w, h) => {
    ctx.fillStyle = '#fefce8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, 48);
    ctx.fillStyle = '#fde047';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍣 FRESH SUSHI · BENTO · SALADS', w / 2, 32);
    const trayCols = ['#ef4444', '#22c55e', '#f97316', '#facc15', '#ec4899', '#38bdf8'];
    for (let r = 0; r < 3; r++) {
      const sy = 108 + r * 62;
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, sy, w - 20, 6);
      for (let c = 0; c < 6; c++) {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(22 + c * 80, sy - 38, 66, 36, 6);
        ctx.fill();
        ctx.fillStyle = trayCols[(r + c) % trayCols.length];
        ctx.beginPath();
        ctx.roundRect(28 + c * 80, sy - 32, 54, 24, 4);
        ctx.fill();
      }
    }
  });
  const deliFace = new THREE.Mesh(
    new THREE.PlaneGeometry(4.1, 2.05),
    new THREE.MeshBasicMaterial({ map: deliTex })
  );
  deliFace.position.set(-0.52, 1.24, 0);
  deliFace.rotation.y = -Math.PI / 2;
  deliGroup.add(deliBase, deliFace);
  deliGroup.position.set(11.6, 0, 0.5);
  root.add(deliGroup);

  // 5. ICE CREAM & GELATO FREEZER CHEST (Left Wall!)
  const freezerGroup = new THREE.Group();
  const frBody = new THREE.Mesh(createMarketBeveledBox(1.15, 0.96, 3.8, 0.1, 0.025), toon(0x0284c7));
  const frGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 3.5),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45 })
  );
  frGlass.rotation.x = -Math.PI / 2;
  frGlass.position.y = 0.98;
  // Ice cream tubs visible through glass!
  const iceCols = [0xfbcfe8, 0xfef08a, 0x86efac, 0x93c5fd, 0xfdba74];
  for (let i = 0; i < 6; i++) {
    const tub = new THREE.Mesh(
      createMarketBeveledBox(0.54, 0.24, 0.42, 0.05, 0.01),
      toon(iceCols[i % iceCols.length])
    );
    tub.position.set(0, 0.68, -1.35 + i * 0.54);
    freezerGroup.add(tub);
  }
  const frSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.72),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('ICE CREAM', 'KEM TƯƠI & ĐỒ ĐÔNG LẠNH', '#0369a1', '#ffffff', '#7dd3fc', '🍦'),
    })
  );
  frSign.position.set(-0.4, 2.45, 0);
  frSign.rotation.y = Math.PI / 2;
  freezerGroup.add(frBody, frGlass, frSign);
  freezerGroup.position.set(-11.4, 0, 0.6);
  root.add(freezerGroup);

  // 6. EXPRESS SELF-CHECKOUT KIOSKS (Left Front Wall)
  ([-11.4] as const).forEach((kx) => {
    ([4.8, 6.2] as const).forEach((kz) => {
      const sco = new THREE.Group();
      const body = new THREE.Mesh(createMarketBeveledBox(0.62, 1.02, 0.72, 0.08, 0.02), toon(0xf8fafc));
      const top = new THREE.Mesh(createMarketBeveledBox(0.42, 0.75, 0.52, 0.06, 0.015), toon(0x0f766e));
      top.position.set(-0.08, 0.98, 0);
      const scr = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.48),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      scr.position.set(0.16, 1.38, 0);
      scr.rotation.y = Math.PI / 2;
      sco.add(body, top, scr);
      sco.position.set(kx, 0, kz);
      root.add(sco);
    });
  });

  // 7. FREE FRUIT JUICE TASTING SAMPLE STAND (Right Mid-Aisle!)
  const sampleGroup = new THREE.Group();
  const sPed = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.52, 0.92, 16), oakMat);
  sPed.position.y = 0.46;
  const sTop = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.08, 16), toon(0xfffbeb));
  sTop.position.y = 0.94;
  const dispenser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 12), toon(0xf97316));
  dispenser.position.set(0, 1.2, 0);
  const dLid = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 12), steelMat);
  dLid.position.set(0, 1.44, 0);
  for (let c = 0; c < 3; c++) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.1, 8), toon(0xfacc15));
    cup.position.set(-0.34 + c * 0.14, 1.03, 0.26);
    sampleGroup.add(cup);
  }
  const sSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.32),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('FREE TASTING', 'THỬ NƯỚC ÉP', '#ea580c', '#ffffff', '#fde047'),
    })
  );
  sSign.position.set(0, 1.82, 0);
  const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.85, 6), chromeMat);
  sPole.position.set(0, 1.35, -0.32);
  sampleGroup.add(sPed, sTop, dispenser, dLid, sPole, sSign);
  sampleGroup.position.set(9.7, 0, 1.8);
  sampleGroup.rotation.y = -0.35;
  root.add(sampleGroup);

  // 7B. CHECKOUT SOUTH-WALL ECO POSTER & IMPULSE SNACK RACK
  const ecoPoster = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.15),
    new THREE.MeshBasicMaterial({
      map: makeMarketSignTex('ECO REUSABLE BAG', 'MANG TÚI VẢI · GIẢM $0.50', '#15803d', '#ffffff', '#86efac', '♻'),
    })
  );
  ecoPoster.position.set(-6.4, 2.35, 9.9);
  ecoPoster.rotation.y = Math.PI;
  root.add(ecoPoster);

  // 8. FLOOR WAYFINDING DECALS
  const makeFloorLabel = (text: string) =>
    makeMarketCanvasTex(512, 140, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#15803d';
      ctx.globalAlpha = 0.85;
      ctx.font = '900 50px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);
    });

  const decalMain = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.6),
    new THREE.MeshBasicMaterial({ map: makeFloorLabel('🌿 FRESH MARKET ↑'), transparent: true, depthWrite: false })
  );
  decalMain.rotation.x = -Math.PI / 2;
  decalMain.position.set(0, 0.022, 4.6);

  const decalLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.56),
    new THREE.MeshBasicMaterial({ map: makeFloorLabel('← PRODUCE'), transparent: true, depthWrite: false })
  );
  decalLeft.rotation.x = -Math.PI / 2;
  decalLeft.position.set(-4.2, 0.022, -2.5);

  const decalRight = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.56),
    new THREE.MeshBasicMaterial({ map: makeFloorLabel('BAKERY →'), transparent: true, depthWrite: false })
  );
  decalRight.rotation.x = -Math.PI / 2;
  decalRight.position.set(4.2, 0.022, -2.5);
  root.add(decalMain, decalLeft, decalRight);

  // 9. POTTED CITRUS TREES IN CORNERS
  [
    [-10.8, -8.4],
    [10.8, -8.4],
    [-10.6, 8.6],
    [10.6, 8.6],
  ].forEach(([px, pz]) => {
    const tg = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.65, 12), toon(0xc26d3a));
    pot.position.y = 0.32;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8), toon(0x7c583c));
    trunk.position.y = 1.0;
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), toon(0x3f915e));
    foliage.position.y = 1.75;
    foliage.castShadow = true;
    // Tiny bright oranges on the citrus tree!
    const orangeMat = toon(0xf97316);
    [
      [0.45, 1.85, 0.3],
      [-0.4, 1.65, 0.38],
      [0.15, 2.15, -0.35],
    ].forEach(([ox, oy, oz]) => {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), orangeMat);
      o.position.set(ox, oy, oz);
      tg.add(o);
    });
    tg.add(pot, trunk, foliage);
    tg.position.set(px, 0, pz);
    root.add(tg);
  });

  return (elapsed: number) => {
    // Gently bob the free tasting sign
    sSign.position.y = 1.82 + Math.sin(elapsed * 2.0) * 0.025;
  };
}
