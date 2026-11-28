import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { patchMaterialForInk } from './animeInkPass';

/**
 * Loads the real 3D Supermarket GLB model (`/models/supermarket.glb`) into
 * Map 4 ("Siêu thị Fresh Mart"), auto-normalizing its Sketchfab scale/center
 * to fit the playable [-11.2..11.2] x [-9.0..9.0] arena and patching all
 * materials for Abeto AnimeInkPass compatibility.
 */
export function buildStudioSupermarketScene(
  scene: THREE.Scene,
  _toonGradient: THREE.DataTexture
): (elapsed: number) => void {
  const root = new THREE.Group();
  root.name = 'SupermarketGlbRoot';

  // Soft sunlit Studio-Ghibli sky dome surrounding the supermarket
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(90, 20, 14),
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

  // Bright warm supermarket ceiling fill lighting so every stocked shelf pops!
  const storeFill = new THREE.PointLight(0xfffbeb, 1.4, 34, 1.1);
  storeFill.position.set(0, 5.5, 0);
  root.add(storeFill);

  // Subtle safety ground plane beneath the GLB so player never floats over void while loading
  const safetyFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshToonMaterial({ color: 0xf4f1e6 })
  );
  safetyFloor.rotation.x = -Math.PI / 2;
  safetyFloor.position.y = -0.02;
  safetyFloor.receiveShadow = true;
  root.add(safetyFloor);

  // Load `/models/supermarket.glb` asynchronously via GLTFLoader (+ Draco support)
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  loader.setDRACOLoader(draco);

  let disposed = false;
  loader.load(
    '/models/supermarket.glb',
    (gltf) => {
      if (disposed || !root.parent) {
        draco.dispose();
        return;
      }
      const model = gltf.scene;
      model.updateMatrixWorld(true);

      // Compute raw bounding box and normalize to a ~24m x 20m playable supermarket interior
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const rawCenter = rawBox.getCenter(new THREE.Vector3());
      const maxHoriz = Math.max(rawSize.x, rawSize.z, 0.001);
      const targetSpan = 24.5;
      const scale = targetSpan / maxHoriz;

      model.scale.setScalar(scale);
      model.position.set(
        -rawCenter.x * scale,
        -rawBox.min.y * scale,
        -rawCenter.z * scale
      );
      model.updateMatrixWorld(true);

      // Patch all materials for sRGB parity inside AnimeInkPass & optimize shadow flags
      model.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (!mat) return;
        const list = Array.isArray(mat) ? mat : [mat];
        for (const m of list) {
          patchMaterialForInk(m);
        }
      });

      root.add(model);
      draco.dispose();

      const normBox = new THREE.Box3().setFromObject(model);
      const normSize = normBox.getSize(new THREE.Vector3());
      // Auto-fit walkable interior bounds right up to the real 3D walls (0.65m wall thickness margin)
      const wallMargin = 0.65;
      scene.userData.autoBounds = {
        minX: normBox.min.x + wallMargin,
        maxX: normBox.max.x - wallMargin,
        minZ: normBox.min.z + wallMargin,
        maxZ: normBox.max.z - wallMargin,
      };
      console.info(
        `[FreshMart GLB] Loaded! raw=(${rawSize.x.toFixed(1)}, ${rawSize.y.toFixed(1)}, ${rawSize.z.toFixed(1)}) -> norm=(${normSize.x.toFixed(1)}, ${normSize.y.toFixed(1)}, ${normSize.z.toFixed(1)})`
      );
    },
    undefined,
    (err) => {
      console.error('[FreshMart GLB] Failed to load /models/supermarket.glb:', err);
      draco.dispose();
    }
  );

  scene.add(root);

  return (_elapsed: number) => {
    if (!root.parent) disposed = true;
  };
}
