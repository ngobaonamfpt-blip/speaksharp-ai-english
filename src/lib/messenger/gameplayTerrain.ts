import { Group, Mesh, type ShaderMaterial } from 'three';
import { ensureTerrainAttributes } from './geometryAttributes';
import { gameplayGeometryPaths } from './introAssets';
import { loadDracoGeometry } from './loadGeometry';

const terrainChunkCount = 10;

export async function createGameplayTerrainGroup(material: ShaderMaterial): Promise<Group> {
	const chunkPaths = Array.from({ length: terrainChunkCount }, (_, index) =>
		gameplayGeometryPaths.terrainChunk(index)
	);

	// Load each Draco chunk as 1 single Mesh (10 draw calls total instead of 400+, zero JS split freeze!)
	const geometries = await Promise.all(chunkPaths.map((path) => loadDracoGeometry(path)));

	const terrain = new Group();
	terrain.name = 'GameplayTerrain';

	for (const [index, geometry] of geometries.entries()) {
		ensureTerrainAttributes(geometry);
		if (!geometry.attributes.normal) geometry.computeVertexNormals();
		const mesh = new Mesh(geometry, material);
		mesh.name = `TerrainChunk${index}`;
		mesh.castShadow = false;
		mesh.receiveShadow = false;
		terrain.add(mesh);
	}

	return terrain;
}

export async function createTreeLeavesGroup(material: ShaderMaterial): Promise<Group> {
	const leafPaths = Array.from({ length: 5 }, (_, index) => gameplayGeometryPaths.treeLeavesChunk(index));
	const geometries = await Promise.all(leafPaths.map((path) => loadDracoGeometry(path)));

	const leaves = new Group();
	leaves.name = 'TreeLeaves';

	for (const [index, geometry] of geometries.entries()) {
		if (!geometry.attributes.normal) geometry.computeVertexNormals();
		const mesh = new Mesh(geometry, material);
		mesh.name = `TreeLeavesChunk${index}`;
		mesh.castShadow = false;
		mesh.receiveShadow = false;
		leaves.add(mesh);
	}

	return leaves;
}
