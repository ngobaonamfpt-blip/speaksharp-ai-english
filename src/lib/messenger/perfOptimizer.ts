import * as THREE from 'three';

export type GraphicsQuality = 'high' | 'medium' | 'eco';

export const GFX_STORAGE_KEY = 'speaksharp_3d_gfx_v2';
const LEGACY_GFX_KEY = 'speaksharp_3d_gfx_v1';

export const GFX_META: Record<
  GraphicsQuality,
  {
    label: string;
    toast: string;
    bg: string;
    fg: string;
    inkScale: number;
    maxDpr: number;
    shadows: boolean;
  }
> = {
  high: {
    label: '🎨 Cao',
    toast: '🎨 Đồ họa Cao: Anime Ink sắc nét HiDPI + Bóng 3D',
    bg: '#e0f2fe',
    fg: '#0369a1',
    inkScale: 1.0,
    maxDpr: 2.0,
    shadows: true,
  },
  medium: {
    label: '⚖️ Ink Nhẹ',
    toast: '⚖️ Đồ họa Trung bình (Ink Nhẹ): Giữ viền Anime, giảm ~35% tải GPU',
    bg: '#dcfce7',
    fg: '#15803d',
    inkScale: 0.85,
    maxDpr: 1.15,
    shadows: true,
  },
  eco: {
    label: '⚡ Siêu mượt',
    toast: '⚡ Đồ họa Siêu mượt (Eco): Tắt hậu kỳ & bóng đổ, tối ưu tối đa cho máy yếu',
    bg: '#fef3c7',
    fg: '#b45309',
    inkScale: 0,
    maxDpr: 0.9,
    shadows: false,
  },
};

export function cycleGraphicsQuality(q: GraphicsQuality): GraphicsQuality {
  if (q === 'high') return 'medium';
  if (q === 'medium') return 'eco';
  return 'high';
}

export function loadSavedGraphicsQuality(): GraphicsQuality | null {
  try {
    const v2 = localStorage.getItem(GFX_STORAGE_KEY);
    if (v2 === 'high' || v2 === 'medium' || v2 === 'eco') return v2;
    const v1 = localStorage.getItem(LEGACY_GFX_KEY);
    if (v1 === 'eco') return 'eco';
    if (v1 === 'high') return 'high';
  } catch {
    // ignore
  }
  return null;
}

export function saveGraphicsQuality(q: GraphicsQuality): void {
  try {
    localStorage.setItem(GFX_STORAGE_KEY, q);
    localStorage.setItem(LEGACY_GFX_KEY, q === 'eco' ? 'eco' : 'high');
  } catch {
    // ignore
  }
}

/** Detect pure mobile / software renderers; keep desktops & Optimus laptops (e.g. RTX 4050) at full High quality! */
export function detectInitialGraphicsQuality(): GraphicsQuality {
  const saved = loadSavedGraphicsQuality();
  if (saved) return saved;

  const isMobile =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  if (isMobile) return 'eco';

  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;
  if (cores <= 2) return 'medium';

  // Only downgrade software renderers (never downgrade Intel UHD because RTX Optimus laptops report Intel UHD!)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const rendererStr = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
        if (
          rendererStr.includes('swiftshader') ||
          rendererStr.includes('llvmpipe') ||
          rendererStr.includes('microsoft basic render')
        ) {
          return 'eco';
        }
      }
    }
  } catch {
    // ignore
  }

  return 'high';
}

/**
 * Shared MeshToonMaterial cache per hex color so scenes reuse materials across hundreds of props
 * instead of allocating duplicate shader programs & uniform blocks.
 */
export function createToonMaterialCache(
  toonGradient: THREE.DataTexture
): (hex: number) => THREE.MeshToonMaterial {
  const cache = new Map<number, THREE.MeshToonMaterial>();
  return (hex: number) => {
    let mat = cache.get(hex);
    if (!mat) {
      mat = new THREE.MeshToonMaterial({ color: hex, gradientMap: toonGradient });
      cache.set(hex, mat);
    }
    return mat;
  };
}

/**
 * Safely disposes all unique BufferGeometries, Materials, and Textures inside a Scene/Group
 * when unmounting or switching maps — prevents VRAM leaks on 4–8GB laptops.
 */
export function disposeObject3D(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (
      mesh.geometry &&
      typeof mesh.geometry.dispose === 'function' &&
      !mesh.geometry.userData?.__sharedCache
    ) {
      geometries.add(mesh.geometry);
    }
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (mat) {
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        materials.add(m);
        const rec = m as unknown as Record<string, unknown>;
        for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap']) {
          const tex = rec[key];
          if (tex && typeof (tex as THREE.Texture).dispose === 'function') {
            textures.add(tex as THREE.Texture);
          }
        }
      }
    }
  });

  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
