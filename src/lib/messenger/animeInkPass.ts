import {
  Color,
  DepthTexture,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  UnsignedIntType,
  Vector2,
  WebGLRenderTarget,
  type Camera,
  type Material,
  type Object3D,
  type PerspectiveCamera,
  type SkinnedMesh,
  type WebGLRenderer,
} from 'three';

/**
 * Hand-drawn anime / "Messenger by Abeto" ligne-claire ink pass:
 *  - Depth Sobel for crisp outer object silhouettes
 *  - View-Space Normal Sobel for every 3D crease/corner (boats, crates, stairs, railings, cliffs, props)
 *  - SurfaceId / ElementId seam detector for flat panel creases (wooden deck planks, doors, boat stripes)
 *  - Subtle Colour Sobel for painted signage, lettering & window mullions
 *  - Airy sun-washed Studio Ghibli / Abeto pastel colour grading
 */
const infoVertexShader = /* glsl */ `
attribute float surfaceId;
attribute float elementId;

varying vec3 vViewNormal;
flat varying float vSurfaceHash;

void main() {
  vViewNormal = normalize(normalMatrix * normal);
  vSurfaceHash = fract(surfaceId * 0.1731 + elementId * 0.4193);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const infoFragmentShader = /* glsl */ `
precision highp float;

varying vec3 vViewNormal;
flat varying float vSurfaceHash;

void main() {
  vec3 n = normalize(vViewNormal) * 0.5 + 0.5;
  gl_FragColor = vec4(n, vSurfaceHash);
}
`;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tInfo;
uniform vec2 uResolution;
uniform vec2 uInfoResolution;
uniform float uNear;
uniform float uFar;
uniform float uTime;
uniform vec3 uInkColor;
uniform vec3 uShadowTint;
uniform float uLineWidth;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float linearizeRawDepth(float d) {
  float z = d * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec3 col = texture2D(tColor, vUv).rgb;
  float rawDepth = texture2D(tDepth, vUv).x;

  // Fast early-out for sky pixels (~35-45% of screen): only 2 texture reads total!
  float ink = 0.0;
  if (rawDepth <= 0.99995) {
    vec2 texel = 1.0 / uResolution;
    vec2 o = texel * uLineWidth;

    // --- 1. 4-tap Roberts Cross Depth Edge (crisp 1px silhouettes, 4 reads instead of 9!) ---
    float dC = linearizeRawDepth(rawDepth);
    float dR = linearizeRawDepth(texture2D(tDepth, vUv + vec2(o.x, 0.0)).x);
    float dU = linearizeRawDepth(texture2D(tDepth, vUv + vec2(0.0, o.y)).x);
    float dRU = linearizeRawDepth(texture2D(tDepth, vUv + o).x);
    float gx = dC - dRU;
    float gy = dR - dU;
    float depthEdge = sqrt(gx * gx + gy * gy) / max(dC, 0.001);
    depthEdge = smoothstep(0.014, 0.040, depthEdge);

    // --- 2. 3-tap Normal + SurfaceId/ElementId Crease Detection (1:1 crisp, 3 reads instead of 5!) ---
    vec2 infoTexel = 1.0 / uInfoResolution;
    vec4 iC = texture2D(tInfo, vUv);
    vec4 iR = texture2D(tInfo, vUv + vec2(infoTexel.x, 0.0));
    vec4 iU = texture2D(tInfo, vUv + vec2(0.0, infoTexel.y));

    float hasInfo = step(0.05, iC.r + iC.g + iC.b);
    vec3 nC = iC.rgb * 2.0 - 1.0;
    vec3 nR = iR.rgb * 2.0 - 1.0;
    vec3 nU = iU.rgb * 2.0 - 1.0;
    float nDiffH = length(nR - nC);
    float nDiffV = length(nU - nC);
    float normalEdge = smoothstep(0.20, 0.44, max(nDiffH, nDiffV)) * hasInfo;

    float idDiff = max(abs(iC.a - iR.a), abs(iC.a - iU.a));
    float idEdge = step(0.032, idDiff) * hasInfo;

    // --- 3. 3-tap Colour Edge (reuses center col -> only 2 extra reads instead of 8!) ---
    float lC = luma(col);
    float lR = luma(texture2D(tColor, vUv + vec2(o.x, 0.0)).rgb);
    float lU = luma(texture2D(tColor, vUv + vec2(0.0, o.y)).rgb);
    float colorGrad = abs(lC - lR) + abs(lC - lU);
    float colorEdge = smoothstep(0.065, 0.145, colorGrad);

    float nearDetailFade = 1.0 - smoothstep(12.0, 32.0, dC);
    float distFade = 1.0 - smoothstep(32.0, 82.0, dC);

    float interiorCrease = max(normalEdge * 0.72, idEdge * 0.58) * nearDetailFade;
    ink = max(max(depthEdge, colorEdge * 0.44), interiorCrease) * distFade;
  }

  // --- Exact Abeto pastel grading without rgb2hsv/hsv2rgb (preserves crisp contrast, zero haze!) ---
  float maxC = max(col.r, max(col.g, col.b));
  if (maxC > 0.0001) {
    // 10% pastel saturation soften around maxC (exact HSV S*0.90 equivalent)
    col = mix(vec3(maxC), col, 0.90);
    // Exact HSV V -> mix(V, V^0.78, 0.32) lift via single scalar scale (zero color washout!)
    float liftedV = mix(maxC, pow(maxC, 0.78), 0.32);
    col *= (liftedV / maxC);
  }

  float L = luma(col);
  col = mix(col, col + vec3(0.045, 0.068, 0.072), (1.0 - smoothstep(0.10, 0.62, L)) * 0.62);
  col = mix(col, col + vec3(0.035, 0.032, 0.018), smoothstep(0.55, 0.95, L) * 0.58);

  // --- Delicate, soothing slate-teal charcoal ink (56% opacity, airy like Abeto!) ---
  col = mix(col, uInkColor, clamp(ink, 0.0, 1.0) * 0.56);

  // Whisper-light paper warmth
  float grain = hash(vUv * uResolution) - 0.5;
  col += grain * 0.008;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

/**
 * Three.js writes LINEAR colour for built-in materials when rendering into a render target,
 * while the Messenger custom shaders write display-ready colour. This shared uniform lets
 * built-in materials (chibi toon, clouds, rings) encode to sRGB only while the ink pass is active,
 * so colours stay identical between Fast mode and Anime Ink mode.
 */
export const inkDisplayOutput = { value: 0 };

export function patchMaterialForInk(material: Material) {
  const m = material as Material & { userData: Record<string, unknown> };
  if (m.userData.inkPatched || (material as ShaderMaterial).isShaderMaterial || material.type === 'ShadowMaterial') return;
  m.userData.inkPatched = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uInkDisplayOutput = inkDisplayOutput;
    shader.fragmentShader = 'uniform float uInkDisplayOutput;\n' + shader.fragmentShader.replace(
      '#include <colorspace_fragment>',
      '#include <colorspace_fragment>\n\tif (uInkDisplayOutput > 0.5) gl_FragColor = sRGBTransferOETF(gl_FragColor);'
    );
  };
  material.needsUpdate = true;
}

const SKIP_INFO_NAMES = new Set([
  'SkyDome',
  'CloudRing',
  'TreeLeaves',
  'AnimeWindStreaks',
  'ChimneySmoke',
  'AnimeButterflies',
  'SoaringBirds',
  'AnimatedNpc',
  'AnimeWorldDetails',
]);

const INFO_SCALE = 1.0;

export class AnimeInkPass {
  private target: WebGLRenderTarget;
  private infoTarget: WebGLRenderTarget;
  private infoMaterial: ShaderMaterial;
  private flatOcclusionMaterial: ShaderMaterial;
  private material: ShaderMaterial;
  private quadScene: Scene;
  private quadCamera: OrthographicCamera;
  private quad: Mesh;
  private savedClearColor = new Color();
  private cachedInfoHidden: Object3D[] = [];
  private cachedWorldChildren: Object3D[] = [];
  private cachedPlayerRoot: Object3D | null = null;
  private cachedSceneChildCount = -1;
  private cacheRefreshTick = 0;

  constructor(width: number, height: number, camera: Camera) {
    const cam = camera as PerspectiveCamera;
    const iw = Math.max(1, Math.floor(width * INFO_SCALE));
    const ih = Math.max(1, Math.floor(height * INFO_SCALE));
    const depthTexture = new DepthTexture(width, height);
    depthTexture.type = UnsignedIntType;
    this.target = new WebGLRenderTarget(width, height, {
      type: UnsignedByteType,
      depthTexture,
      depthBuffer: true,
    });

    this.infoTarget = new WebGLRenderTarget(iw, ih, {
      type: UnsignedByteType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: true,
    });

    this.infoMaterial = new ShaderMaterial({
      vertexShader: infoVertexShader,
      fragmentShader: infoFragmentShader,
    });

    // Flat constant normal+id occluder for the player character:
    // Blocks background wall/curb lines from bleeding through, without adding harsh low-poly seams inside the character!
    this.flatOcclusionMaterial = new ShaderMaterial({
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        void main() {
          gl_FragColor = vec4(0.5, 0.5, 1.0, 0.99);
        }
      `,
    });

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: this.target.texture },
        tDepth: { value: depthTexture },
        tInfo: { value: this.infoTarget.texture },
        uResolution: { value: new Vector2(width, height) },
        uInfoResolution: { value: new Vector2(iw, ih) },
        uNear: { value: cam.near ?? 0.1 },
        uFar: { value: cam.far ?? 400 },
        uTime: { value: 0 },
        uInkColor: { value: new Color('#34444e') },
        uShadowTint: { value: new Color('#8ab4c9') },
        uLineWidth: { value: 0.85 },
      },
    });

    this.quadScene = new Scene();
    this.quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  setSize(width: number, height: number) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const iw = Math.max(1, Math.floor(w * INFO_SCALE));
    const ih = Math.max(1, Math.floor(h * INFO_SCALE));
    this.target.setSize(w, h);
    this.infoTarget.setSize(iw, ih);
    this.material.uniforms.uResolution.value.set(w, h);
    this.material.uniforms.uInfoResolution.value.set(iw, ih);
    this.material.uniforms.uLineWidth.value = h > 950 ? 1.15 : 0.95;
  }

  render(renderer: WebGLRenderer, scene: Scene, camera: Camera, time: number) {
    this.material.uniforms.uTime.value = time;

    // 1. Render full colour + depth pass (shadow map updates ONCE here if autoUpdate is on)
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. Render lightweight 0.75x View-Space Normal + SurfaceId/ElementId pass
    // CRITICAL: Disable shadowMap.autoUpdate during Info + Occlusion passes so the Shadow Map
    // is NOT redundantly re-rendered 3 times per frame!
    const prevShadowAuto = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;

    if (
      scene.children.length !== this.cachedSceneChildCount ||
      ++this.cacheRefreshTick % 90 === 1
    ) {
      this.cachedSceneChildCount = scene.children.length;
      this.cachedInfoHidden.length = 0;
      this.cachedWorldChildren.length = 0;
      this.cachedPlayerRoot = scene.getObjectByName('bodyRoot') ?? null;

      scene.traverse((obj) => {
        if (obj === this.cachedPlayerRoot) return;
        if (SKIP_INFO_NAMES.has(obj.name) || (obj as SkinnedMesh).isSkinnedMesh) {
          this.cachedInfoHidden.push(obj);
          return;
        }
        const m = obj as Mesh;
        if (m.isMesh) {
          const mat = m.material;
          const singleMat = Array.isArray(mat) ? mat[0] : mat;
          if (
            singleMat &&
            (singleMat.type === 'ShadowMaterial' ||
              singleMat.transparent ||
              singleMat.depthWrite === false)
          ) {
            this.cachedInfoHidden.push(obj);
          }
        }
      });

      for (let i = 0; i < scene.children.length; i++) {
        const ch = scene.children[i];
        if (ch !== this.cachedPlayerRoot && !ch.getObjectByName('bodyRoot')) {
          this.cachedWorldChildren.push(ch);
        }
      }
    }

    const playerRoot = this.cachedPlayerRoot;
    const savedPlayerVis = playerRoot ? playerRoot.visible : false;
    if (playerRoot) playerRoot.visible = false;

    const restoredMask: Object3D[] = [];
    for (let i = 0; i < this.cachedInfoHidden.length; i++) {
      const obj = this.cachedInfoHidden[i];
      if (obj.visible) {
        obj.visible = false;
        restoredMask.push(obj);
      }
    }

    const prevOverride = scene.overrideMaterial;
    const prevBg = scene.background;
    renderer.getClearColor(this.savedClearColor);
    const prevClearAlpha = renderer.getClearAlpha();

    scene.overrideMaterial = this.infoMaterial;
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(this.infoTarget);
    renderer.clear();
    renderer.render(scene, camera);

    // Stamp player silhouette cleanly into infoTarget with flat constant normal (occludes walls, zero interior seams!)
    if (playerRoot && savedPlayerVis) {
      const savedAutoClear = renderer.autoClear;
      const worldHidden: Object3D[] = [];
      for (let i = 0; i < this.cachedWorldChildren.length; i++) {
        const ch = this.cachedWorldChildren[i];
        if (ch.visible) {
          ch.visible = false;
          worldHidden.push(ch);
        }
      }
      playerRoot.visible = true;
      scene.overrideMaterial = this.flatOcclusionMaterial;
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = savedAutoClear;
      for (let i = 0; i < worldHidden.length; i++) worldHidden[i].visible = true;
    }

    // Restore scene & renderer state cleanly
    scene.overrideMaterial = prevOverride;
    scene.background = prevBg;
    renderer.setClearColor(this.savedClearColor, prevClearAlpha);
    renderer.shadowMap.autoUpdate = prevShadowAuto;
    if (playerRoot) playerRoot.visible = savedPlayerVis;
    for (let i = 0; i < restoredMask.length; i++) {
      restoredMask[i].visible = true;
    }

    // 3. Composite full-screen ligne-claire ink pass
    renderer.setRenderTarget(null);
    renderer.render(this.quadScene, this.quadCamera);
  }

  dispose() {
    this.target.depthTexture?.dispose();
    this.target.dispose();
    this.infoTarget.dispose();
    this.infoMaterial.dispose();
    this.flatOcclusionMaterial.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
