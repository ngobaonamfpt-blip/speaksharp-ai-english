import {
	AnimationMixer,
	Box3,
	CircleGeometry,
	Color,
	Group,
	Mesh,
	MeshStandardMaterial,
	TextureLoader,
	Vector3,
	type BufferGeometry,
	type ShaderMaterial,
	type SkinnedMesh,
	type WebGLRenderer
} from 'three';
import { loadDracoGeometry } from './loadGeometry';
import { introTexturePaths, npcGalleryEntries } from './introAssets';
import { initKtx2Loader } from './loadTextures';
import { createMessengerMaterials } from './materials';
import { createSkin, createSkinAnimation } from './skinMesh';

export type NpcGalleryBundle = {
	group: Group;
	npcMaterial: ShaderMaterial;
	npcMeshes: Array<Mesh | SkinnedMesh>;
	mixers: AnimationMixer[];
};

const galleryRadius = 5.5;
const npcTargetHeight = 1.35;

function placeNpcMesh(
	mesh: Mesh | SkinnedMesh,
	geometry: BufferGeometry,
	index: number,
	total: number
) {
	geometry.computeBoundingBox();
	const bounds = geometry.boundingBox ?? new Box3();
	const size = bounds.getSize(new Vector3());
	const scale = npcTargetHeight / Math.max(size.y, 0.001);
	mesh.scale.setScalar(scale);

	const angle = (index / total) * Math.PI * 2;
	mesh.position.set(
		Math.cos(angle) * galleryRadius,
		-size.y * scale * 0.5 + 0.02,
		Math.sin(angle) * galleryRadius
	);
	mesh.rotation.y = -angle + Math.PI;
}

export async function createNpcGalleryGroup(renderer: WebGLRenderer): Promise<NpcGalleryBundle> {
	initKtx2Loader(renderer);
	const textureLoader = new TextureLoader();
	const atlas = await textureLoader.loadAsync(introTexturePaths.atlas);
	const materials = createMessengerMaterials(atlas, atlas);
	const npcMaterial = materials.atlas;

	const stage = new Group();
	stage.name = 'NpcStage';

	const platform = new Mesh(
		new CircleGeometry(galleryRadius + 1.8, 64),
		new MeshStandardMaterial({
			color: new Color('#2a3340'),
			roughness: 0.85,
			metalness: 0.05
		})
	);
	platform.rotation.x = -Math.PI / 2;
	platform.position.y = -0.01;
	platform.receiveShadow = true;
	stage.add(platform);

	const npcMeshes: Array<Mesh | SkinnedMesh> = [];
	const mixers: AnimationMixer[] = [];
	const gallery = new Group();
	gallery.name = 'NpcGallery';

	for (const [index, entry] of npcGalleryEntries.entries()) {
		const model = await loadDracoGeometry(entry.model);

		try {
			const [bones, idle] = await Promise.all([
				loadDracoGeometry(entry.bones),
				loadDracoGeometry(entry.idle)
			]);

			const mesh = createSkin(model, bones, npcMaterial);
			mesh.name = entry.name;
			placeNpcMesh(mesh, model, index, npcGalleryEntries.length);

			const clip = createSkinAnimation(`${entry.name}-idle`, idle);
			const mixer = new AnimationMixer(mesh);
			if (clip.duration > 0) {
				mixer.clipAction(clip).play();
				mixers.push(mixer);
			}

			npcMeshes.push(mesh);
			gallery.add(mesh);
		} catch (error) {
			console.warn(`NPC "${entry.name}" skin rig unavailable, using static mesh.`, error);
			const mesh = new Mesh(model, npcMaterial);
			mesh.name = entry.name;
			model.computeVertexNormals();
			placeNpcMesh(mesh, model, index, npcGalleryEntries.length);
			npcMeshes.push(mesh);
			gallery.add(mesh);
		}
	}

	stage.add(gallery);

	return { group: stage, npcMaterial, npcMeshes, mixers };
}

/**
 * Load a single real rigged & animated Abeto NPC scaled to street height (feet grounded at y = 0).
 * Used to populate the Gameplay planet with authentic animated townsfolk!
 */
export async function loadRealPlanetNpc(
	npcName: string,
	targetHeight = 0.29,
	material: ShaderMaterial,
	preferWalk = false
): Promise<{ group: Group; mixer: AnimationMixer | null }> {
	const entry = npcGalleryEntries.find((e) => e.name === npcName) ?? npcGalleryEntries[0];
	const wrapper = new Group();
	wrapper.name = `PlanetNpc-${entry.name}`;
	const model = await loadDracoGeometry(entry.model);
	model.computeBoundingBox();
	const bounds = model.boundingBox ?? new Box3();
	const size = bounds.getSize(new Vector3());
	const scale = targetHeight / Math.max(size.y, 0.001);

	let mixer: AnimationMixer | null = null;
	try {
		const animPath = preferWalk && entry.walk ? entry.walk : entry.idle;
		const [bones, animGeo] = await Promise.all([
			loadDracoGeometry(entry.bones),
			loadDracoGeometry(animPath)
		]);
		const mesh = createSkin(model, bones, material);
		mesh.scale.setScalar(scale);
		mesh.position.y = -bounds.min.y * scale;
		mesh.castShadow = true;
		wrapper.add(mesh);

		const clip = createSkinAnimation(`${entry.name}-${preferWalk ? 'walk' : 'idle'}`, animGeo);
		if (clip.duration > 0) {
			mixer = new AnimationMixer(mesh);
			mixer.clipAction(clip).play();
		}
	} catch {
		model.computeVertexNormals();
		const mesh = new Mesh(model, material);
		mesh.scale.setScalar(scale);
		mesh.position.y = -bounds.min.y * scale;
		mesh.castShadow = true;
		wrapper.add(mesh);
	}

	return { group: wrapper, mixer };
}
