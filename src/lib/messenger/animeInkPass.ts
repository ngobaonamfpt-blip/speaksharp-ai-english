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

float linearDepth(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  float z = d * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 sampleColor(vec2 uv) { return texture2D(tColor, uv).rgb; }

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 texel = 1.0 / uResolution;
  vec2 o = texel * uLineWidth;

  // --- 1. Depth Sobel (outer silhouettes of buildings, boats, characters, cliffs) ---
  float dC = linearDepth(vUv);
  float d00 = linearDepth(vUv + vec2(-o.x, -o.y));
  float d10 = linearDepth(vUv + vec2(0.0, -o.y));
  float d20 = linearDepth(vUv + vec2(o.x, -o.y));
  float d01 = linearDepth(vUv + vec2(-o.x, 0.0));
  float d21 = linearDepth(vUv + vec2(o.x, 0.0));
  float d02 = linearDepth(vUv + vec2(-o.x, o.y));
  float d12 = linearDepth(vUv + vec2(0.0, o.y));
  float d22 = linearDepth(vUv + vec2(o.x, o.y));
  float gx = (d20 + 2.0 * d21 + d22) - (d00 + 2.0 * d01 + d02);
  float gy = (d02 + 2.0 * d12 + d22) - (d00 + 2.0 * d10 + d20);
  float depthEdge = sqrt(gx * gx + gy * gy) / max(dC, 0.001);
  depthEdge = smoothstep(0.062, 0.165, depthEdge);

  // --- 2. View-Space Normal + SurfaceId/ElementId Crease Detection (Abeto tInfo style!) ---
  vec4 iC = texture2D(tInfo, vUv);
  vec4 iL = texture2D(tInfo, vUv + vec2(-texel.x, 0.0));
  vec4 iR = texture2D(tInfo, vUv + vec2(texel.x, 0.0));
  vec4 iU = texture2D(tInfo, vUv + vec2(0.0, texel.y));
  vec4 iD = texture2D(tInfo, vUv + vec2(0.0, -texel.y));

  vec3 nC = iC.rgb * 2.0 - 1.0;
  vec3 nL = iL.rgb * 2.0 - 1.0;
  vec3 nR = iR.rgb * 2.0 - 1.0;
  vec3 nU = iU.rgb * 2.0 - 1.0;
  vec3 nD = iD.rgb * 2.0 - 1.0;

  // Guard against sky/empty info pixels (cleared to black -> length(iC.rgb) == 0)
  float hasInfo = step(0.05, dot(iC.rgb, vec3(1.0)));
  float nDiffH = length(nR - nL);
  float nDiffV = length(nU - nD);
  float normalGrad = sqrt(nDiffH * nDiffH + nDiffV * nDiffV);
  float normalEdge = smoothstep(0.42, 0.86, normalGrad) * hasInfo;

  // Flat panel seam detection via surfaceId/elementId hash (wooden deck planks, crates, boat panels!)
  float idDiff = max(
    max(abs(iC.a - iL.a), abs(iC.a - iR.a)),
    max(abs(iC.a - iU.a), abs(iC.a - iD.a))
  );
  float idEdge = step(0.032, idDiff) * hasInfo;

  // --- 3. Colour Sobel for painted decals, boat lettering, cone stripes & window frames ---
  float l00 = luma(sampleColor(vUv + vec2(-o.x, -o.y)));
  float l10 = luma(sampleColor(vUv + vec2(0.0, -o.y)));
  float l20 = luma(sampleColor(vUv + vec2(o.x, -o.y)));
  float l01 = luma(sampleColor(vUv + vec2(-o.x, 0.0)));
  float l21 = luma(sampleColor(vUv + vec2(o.x, 0.0)));
  float l02 = luma(sampleColor(vUv + vec2(-o.x, o.y)));
  float l12 = luma(sampleColor(vUv + vec2(0.0, o.y)));
  float l22 = luma(sampleColor(vUv + vec2(o.x, o.y)));
  float cx = (l20 + 2.0 * l21 + l22) - (l00 + 2.0 * l01 + l02);
  float cy = (l02 + 2.0 * l12 + l22) - (l00 + 2.0 * l10 + l20);
  float colorEdge = smoothstep(0.28, 0.54, sqrt(cx * cx + cy * cy));

  bool isSky = texture2D(tDepth, vUv).x > 0.99995;
  float nearDetailFade = 1.0 - smoothstep(12.0, 32.0, dC);
  float distFade = 1.0 - smoothstep(32.0, 82.0, dC);

  float interiorCrease = max(normalEdge * 0.72, idEdge * 0.58) * nearDetailFade;
  float ink = max(max(depthEdge, colorEdge * 0.44), interiorCrease) * distFade;
  if (isSky) ink = 0.0;

  // --- Dreamy, luminous, soothing Abeto / Studio Ghibli coastal pastel grading ---
  vec3 col = sampleColor(vUv);
  vec3 hsv = rgb2hsv(col);
  // Gentle pastel saturation & lifted bright sunlit values (never dark or muddy!)
  hsv.y = clamp(hsv.y * 0.90, 0.0, 1.0);
  hsv.z = mix(hsv.z, pow(max(hsv.z, 0.0), 0.78), 0.32);
  col = hsv2rgb(hsv);

  float L = luma(col);
  // Soft aqua-sky bounce in shadows + warm sunlit cream glow on highlights
  col = mix(col, col + vec3(0.045, 0.068, 0.072), (1.0 - smoothstep(0.10, 0.62, L)) * 0.62);
  col = mix(col, col + vec3(0.035, 0.032, 0.018), smoothstep(0.55, 0.95, L) * 0.58);

  // --- Delicate, soothing slate-teal charcoal ink (56% opacity, airy like Abeto!) ---
  col = mix(col, uInkColor, clamp(ink, 0.0, 1.0) * 0.56);

  // Whisper-light paper warmth (no dark vignette!)
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
]);

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

  constructor(width: number, height: number, camera: Camera) {
    const cam = camera as PerspectiveCamera;
    const depthTexture = new DepthTexture(width, height);
    depthTexture.type = UnsignedIntType;
    this.target = new WebGLRenderTarget(width, height, {
      type: UnsignedByteType,
      depthTexture,
      depthBuffer: true,
    });

    this.infoTarget = new WebGLRenderTarget(width, height, {
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
    this.target.setSize(w, h);
    this.infoTarget.setSize(w, h);
    this.material.uniforms.uResolution.value.set(w, h);
    this.material.uniforms.uLineWidth.value = h > 950 ? 1.15 : 0.95;
  }

  render(renderer: WebGLRenderer, scene: Scene, camera: Camera, time: number) {
    this.material.uniforms.uTime.value = time;

    // 1. Render full colour + depth pass
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. Render lightweight View-Space Normal + SurfaceId/ElementId pass for crisp interior object creases!
    const hiddenForInfo: Object3D[] = [];
    const playerRoot = scene.getObjectByName('bodyRoot');
    const savedPlayerVis = playerRoot ? playerRoot.visible : false;
    if (playerRoot) playerRoot.visible = false;

    scene.traverse((obj) => {
      if (!obj.visible) return;
      if (SKIP_INFO_NAMES.has(obj.name)) {
        obj.visible = false;
        hiddenForInfo.push(obj);
        return;
      }
      if ((obj as SkinnedMesh).isSkinnedMesh) {
        obj.visible = false;
        hiddenForInfo.push(obj);
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
          obj.visible = false;
          hiddenForInfo.push(obj);
        }
      }
    });

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
      scene.children.forEach((ch) => {
        if (ch.visible && ch !== playerRoot && !ch.getObjectByName('bodyRoot')) {
          ch.visible = false;
          worldHidden.push(ch);
        }
      });
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
    if (playerRoot) playerRoot.visible = savedPlayerVis;
    for (let i = 0; i < hiddenForInfo.length; i++) {
      hiddenForInfo[i].visible = true;
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
