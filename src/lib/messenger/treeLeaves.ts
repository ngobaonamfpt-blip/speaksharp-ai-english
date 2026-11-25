import { Color, DoubleSide, RepeatWrapping, ShaderMaterial, type Texture, Vector3 } from 'three';
import { treeLeavesFragmentShader, treeLeavesVertexShader } from './shaders/treeLeaves.glsl';

export function createTreeLeavesMaterial(
	leavesTexture: Texture,
	lightPosition = new Vector3(10, 16, 6)
): ShaderMaterial {
	leavesTexture.wrapS = RepeatWrapping;
	leavesTexture.wrapT = RepeatWrapping;

	return new ShaderMaterial({
		name: 'TreeLeaves',
		transparent: false,
		side: DoubleSide,
		depthWrite: true,
		uniforms: {
			tTrees: { value: leavesTexture },
			uColor1: { value: new Color('#54b070') },
			uColor2: { value: new Color('#48a166') },
			uColor3: { value: new Color('#3c8f5e') },
			uTime: { value: 0 },
			uScale: { value: 0.28 },
			uLightPosition: { value: lightPosition.clone() }
		},
		vertexShader: treeLeavesVertexShader,
		fragmentShader: treeLeavesFragmentShader
	});
}

export function updateTreeLeavesMaterial(material: ShaderMaterial, elapsed: number): void {
	material.uniforms.uTime.value = elapsed;
}

export function setTreeLeavesLight(material: ShaderMaterial, lightPosition: Vector3): void {
	material.uniforms.uLightPosition.value.copy(lightPosition);
}
