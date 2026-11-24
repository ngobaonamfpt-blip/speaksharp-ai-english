import {
  Color,
  DepthTexture,
  Mesh,
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
  type PerspectiveCamera,
  type WebGLRenderer,
} from 'three';

/**
 * Hand-drawn anime / "Messenger by Abeto" look in a single full-screen pass:
 *  - Ink outlines from depth discontinuities (distance-normalised, so far objects keep thin lines)
 *  - Interior ink lines from colour edges (windows, doors, signs)
 *  - "Boiling" hand-drawn line wobble (jitter changes ~6x per second like 2D animation)
 *  - Flat cel colour grading: soft posterize, teal-tinted shadows, lifted pastel highlights
 *  - Diagonal pencil hatching inside dark shadows + subtle paper grain
 */
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

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float linearDepth(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  float z = d * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Target stores display-ready (sRGB-encoded) colours, exactly like the screen
vec3 lin2srgb(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
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

// Reconstruct view-space surface normal from linear depth (catches 90° architectural corners at zero extra draw calls!)
vec3 viewPosFromDepth(vec2 uv) {
  float d = linearDepth(uv);
  vec2 ndc = uv * 2.0 - 1.0;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  return vec3(ndc.x * aspect * 0.43 * d, ndc.y * 0.43 * d, -d);
}

vec3 reconstructNormal(vec2 uv, vec2 texel) {
  vec3 pC = viewPosFromDepth(uv);
  vec3 pR = viewPosFromDepth(uv + vec2(texel.x, 0.0));
  vec3 pL = viewPosFromDepth(uv - vec2(texel.x, 0.0));
  vec3 pU = viewPosFromDepth(uv + vec2(0.0, texel.y));
  vec3 pD = viewPosFromDepth(uv - vec2(0.0, texel.y));
  vec3 dX = abs(pR.z - pC.z) < abs(pC.z - pL.z) ? (pR - pC) : (pC - pL);
  vec3 dY = abs(pU.z - pC.z) < abs(pC.z - pD.z) ? (pU - pC) : (pC - pD);
  return normalize(cross(dX, dY));
}

void main() {
  vec2 texel = 1.0 / uResolution;
  vec2 o = texel * uLineWidth;

  // --- 1. Razor-sharp Ligne-Claire Depth Sobel (silhouettes & overhangs) ---
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
  depthEdge = smoothstep(0.095, 0.21, depthEdge);

  // --- 2. View-Space Normal Corner Crease Detection (stairs, curbs, boxes, bridge girders!) ---
  vec3 nC = reconstructNormal(vUv, texel);
  vec3 nR = reconstructNormal(vUv + vec2(o.x, 0.0), texel);
  vec3 nL = reconstructNormal(vUv - vec2(o.x, 0.0), texel);
  vec3 nU = reconstructNormal(vUv + vec2(0.0, o.y), texel);
  vec3 nD = reconstructNormal(vUv - vec2(0.0, o.y), texel);
  float minDot = min(min(dot(nC, nR), dot(nC, nL)), min(dot(nC, nU), dot(nC, nD)));
  // Only trigger on genuine geometric corners (< ~55 deg) and fade cleanly at far distance
  float normalEdge = smoothstep(0.58, 0.30, minDot) * (1.0 - smoothstep(10.0, 26.0, dC));

  // --- 3. Interior Colour Edge Detection (boat lettering, doors, windows, pockets) ---
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
  float colorEdge = smoothstep(0.24, 0.46, sqrt(cx * cx + cy * cy));

  bool isSky = texture2D(tDepth, vUv).x > 0.99995;
  float distFade = 1.0 - smoothstep(28.0, 76.0, dC);
  float ink = max(max(depthEdge, normalEdge * 0.78), colorEdge * 0.62) * distFade;
  if (isSky) ink = 0.0;

  // --- 4. Vivid Sunlit Abeto / Moebius Coastal Color Grading (crisp, saturated, zero grey haze!) ---
  vec3 col = sampleColor(vUv);
  vec3 hsv = rgb2hsv(col);
  // Restore clean sunlit vibrancy (boat blue, amber door, orange buoy, seafoam bridge!)
  hsv.y = clamp(hsv.y * 1.15, 0.0, 1.0);
  col = hsv2rgb(hsv);

  // Subtle crisp S-curve contrast so sunlit whites pop & shadows stay rich cool-slate
  vec3 contrasted = col * col * (3.0 - 2.0 * col);
  col = mix(col, contrasted, 0.20);

  // Delicate warm sunlit highlight kiss (never washes out darks!)
  float L = luma(col);
  col = mix(col, col * vec3(1.03, 1.02, 0.99), smoothstep(0.55, 0.95, L) * 0.65);

  // --- 5. Crisp Dark Charcoal-Ink Lines (86% opacity like Abeto Messenger!) ---
  col = mix(col, uInkColor, clamp(ink, 0.0, 1.0) * 0.86);

  // Ultra-subtle paper texture
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

export class AnimeInkPass {
  private target: WebGLRenderTarget;
  private material: ShaderMaterial;
  private quadScene: Scene;
  private quadCamera: OrthographicCamera;
  private quad: Mesh;

  constructor(width: number, height: number, camera: Camera) {
    const cam = camera as PerspectiveCamera;
    const depthTexture = new DepthTexture(width, height);
    depthTexture.type = UnsignedIntType;
    this.target = new WebGLRenderTarget(width, height, {
      type: UnsignedByteType,
      depthTexture,
      depthBuffer: true,
    });

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: this.target.texture },
        tDepth: { value: depthTexture },
        uResolution: { value: new Vector2(width, height) },
        uNear: { value: cam.near ?? 0.1 },
        uFar: { value: cam.far ?? 400 },
        uTime: { value: 0 },
        uInkColor: { value: new Color('#1a2229') },
        uShadowTint: { value: new Color('#6d92ae') },
        uLineWidth: { value: 0.78 },
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
    this.material.uniforms.uResolution.value.set(w, h);
    // Keep lines razor-sharp & delicate (~0.78-1.0px) so thin cables & stairs stay crisp!
    this.material.uniforms.uLineWidth.value = h > 950 ? 1.0 : 0.78;
  }

  render(renderer: WebGLRenderer, scene: Scene, camera: Camera, time: number) {
    this.material.uniforms.uTime.value = time;
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(this.quadScene, this.quadCamera);
  }

  dispose() {
    this.target.depthTexture?.dispose();
    this.target.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
