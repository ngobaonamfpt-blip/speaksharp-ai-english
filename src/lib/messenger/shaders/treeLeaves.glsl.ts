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
	// Fluffy anime canopy matching reference: 3-tone emerald cel shading + hand-inked leaf stipple dots
	vec3 tint = mix(uColor1, uColor2, vRand);
	tint = mix(tint, uColor3, step(0.6, vRand));

	vec3 lightDir = normalize(uLightPosition - vWorldPosition);
	float shade = dot(normalize(vNormal), lightDir);
	vec3 lit = tint * 1.14 + vec3(0.02, 0.05, 0.0);
	vec3 mid = tint * 0.85;
	vec3 dark = tint * vec3(0.48, 0.60, 0.66);
	vec3 color = mix(dark, mid, smoothstep(-0.08, 0.02, shade));
	color = mix(color, lit, smoothstep(0.38, 0.46, shade));

	// Hand-drawn organic dark-green leaf stipple clusters inside the foliage
	vec2 cell = floor(vWorldPosition.xy * 11.0 + vWorldPosition.z * 7.0);
	float dotRand = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
	float stipple = step(0.84, dotRand);
	color = mix(color, dark * 0.78, stipple * 0.7);

	gl_FragColor = vec4(color, 1.0);
}
`;
