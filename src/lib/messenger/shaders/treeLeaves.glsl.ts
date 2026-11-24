export const treeLeavesVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vRand;

uniform float uTime;
uniform float uScale;

void main() {
	vUv = uv;
	vRand = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
	vNormal = normalize(normalMatrix * normal);

	vec3 pos = position;
	float sway = sin(uTime * 0.75 + pos.x * 3.0 + pos.z * 2.0) * 0.04 * vRand;
	pos.x += sway;
	pos.z += sway * 0.5;

	vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
	vWorldPosition = worldPosition.xyz;
	gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const treeLeavesFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tTrees;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uLightPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vRand;

void main() {
	// Solid fluffy anime canopy (no checker pattern): flat 3-tone cel shading
	vec3 tint = mix(uColor1, uColor2, vRand);
	tint = mix(tint, uColor3, step(0.6, vRand));

	vec3 lightDir = normalize(uLightPosition - vWorldPosition);
	float shade = dot(normalize(vNormal), lightDir);
	vec3 lit = tint * 1.12 + vec3(0.03, 0.05, 0.0);
	vec3 mid = tint * 0.86;
	vec3 dark = tint * vec3(0.52, 0.62, 0.70);
	vec3 color = mix(dark, mid, smoothstep(-0.05, 0.02, shade));
	color = mix(color, lit, smoothstep(0.42, 0.48, shade));

	gl_FragColor = vec4(color, 1.0);
}
`;
