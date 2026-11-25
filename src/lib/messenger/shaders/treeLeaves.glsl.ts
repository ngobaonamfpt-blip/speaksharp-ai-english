export const treeLeavesVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform float uTime;
uniform float uScale;

void main() {
	vUv = uv;
	vNormal = normalize(normalMatrix * normal);

	// Soft organic scalloped canopy puffiness + gentle breeze sway (fluffy anime silhouette, zero holes!)
	vec3 pos = position;
	float puff = (sin(pos.x * 8.5 + pos.y * 6.5) + cos(pos.z * 8.0 - pos.y * 5.5)) * 0.022;
	pos += normalize(normal) * puff;

	float sway = sin(uTime * 1.1 + pos.x * 2.2 + pos.z * 1.8) * 0.026;
	pos.x += sway;
	pos.z += sway * 0.55;

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

// Sparse, crisp hand-drawn 2-leaf anime cluster ink doodle inside the canopy (like Abeto!)
float leafDoodle(vec2 p) {
	vec2 cell = floor(p);
	vec2 f = fract(p) - 0.5;
	float h = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
	if (h < 0.84) return 0.0;
	float ang = h * 6.2831;
	float c = cos(ang), s = sin(ang);
	vec2 r = vec2(c * f.x - s * f.y, s * f.x + c * f.y);
	// Two delicate teardrop/oval leaf loops side-by-side
	float d1 = length((r - vec2(-0.11, 0.03)) * vec2(1.15, 1.7));
	float d2 = length((r - vec2(0.11, -0.02)) * vec2(1.15, 1.7));
	float ring1 = 1.0 - smoothstep(0.022, 0.055, abs(d1 - 0.13));
	float ring2 = 1.0 - smoothstep(0.022, 0.055, abs(d2 - 0.12));
	return max(ring1, ring2);
}

void main() {
	// Plush, solid, airy Abeto emerald-green foliage (matches media_1795599985391_a5c642d7.jpg!)
	vec3 radialUp = normalize(vWorldPosition);
	vec3 lightDir = normalize(uLightPosition - vWorldPosition);
	float shade = dot(normalize(vNormal), lightDir);
	float crownLift = smoothstep(-0.2, 0.75, dot(normalize(vNormal), radialUp));

	// Subtle organic sunlit color variation across canopy crown
	float patchNoise = sin(vWorldPosition.x * 2.8 + vWorldPosition.z * 2.4) * 0.5 + 0.5;
	vec3 litCol = mix(uColor1, uColor2, patchNoise * 0.45);
	litCol = mix(litCol, litCol * 1.07 + vec3(0.015, 0.025, 0.0), crownLift * 0.55);
	vec3 shadowCol = uColor3 * vec3(0.76, 0.88, 0.88);

	// Clean, soft 2-tone cel shading (no harsh black undersides, no polygon holes!)
	vec3 color = mix(shadowCol, litCol, smoothstep(-0.08, 0.14, shade));

	// Sparse hand-inked 2-leaf cluster doodles scattered delicately across the canopy
	vec3 inkCol = vec3(0.19, 0.30, 0.27);
	float doodle = leafDoodle(vWorldPosition.xy * 4.2 + vec2(vWorldPosition.z * 3.1, -vWorldPosition.z * 2.4));
	color = mix(color, inkCol, doodle * 0.58);

	gl_FragColor = vec4(color, 1.0);
}
`;
