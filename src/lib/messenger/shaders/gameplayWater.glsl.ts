export const gameplayWaterVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vHighPrecisionZW;

void main() {
	vUv = uv;
	vNormal = normalize(normalMatrix * normal);
	vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
	vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
	gl_Position = projectionMatrix * viewPosition;
	vHighPrecisionZW = gl_Position.zw;
}
`;

export const gameplayWaterFragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColorWaves1;
uniform vec3 uColorWaves2;
uniform sampler2D tNoise;
uniform sampler2D tSceneDepth;
uniform vec2 uResolution;
uniform float uTime;
uniform float uUseSceneDepth;
uniform float uCameraNear;
uniform float uCameraFar;
uniform vec3 uLightPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vHighPrecisionZW;

float linearizeDepth(float depth) {
	float z = depth * 2.0 - 1.0;
	return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uCameraNear - z * (uCameraFar - uCameraNear));
}

void main() {
	// Flat cel-shaded anime water matching reference: teal base + flat caustic blobs + crisp white streaks
	vec2 p1 = vWorldPosition.xz * 0.16 + vec2(uTime * 0.022, -uTime * 0.015);
	vec2 p2 = vWorldPosition.xy * 0.14 + vec2(-uTime * 0.018, uTime * 0.024);
	float n1 = texture2D(tNoise, p1).r;
	float n2 = texture2D(tNoise, p2 * 1.35 + n1 * 0.25).g;
	float n3 = texture2D(tNoise, p1 * 2.1 - vec2(uTime * 0.03, uTime * 0.02)).b;

	vec3 deepTeal = vec3(0.16, 0.40, 0.46);    // #296675 deep shadow patch
	vec3 midTeal = vec3(0.21, 0.49, 0.54);     // #367d8a main anime water
	vec3 lightTeal = vec3(0.29, 0.60, 0.64);   // #4a99a3 flat reflection patch
	vec3 foamWhite = vec3(0.95, 0.99, 0.97);   // #f2fcf7 crisp white anime highlight

	vec3 color = midTeal;
	// Organic flat-edged darker currents
	color = mix(color, deepTeal, step(0.58, n1));
	// Organic flat-edged lighter reflection pools
	color = mix(color, lightTeal, step(0.62, n2));
	// Crisp small white anime shimmer streaks
	float shimmer = step(0.84, n1 * 0.55 + n3 * 0.65);
	color = mix(color, foamWhite, shimmer * 0.92);

	// Crisp white shoreline foam band where water meets sandy banks
	if (uUseSceneDepth > 0.5) {
		vec2 screenUv = gl_FragCoord.xy / uResolution;
		float sceneDepth = linearizeDepth(texture2D(tSceneDepth, screenUv).x);
		float waterDepth = linearizeDepth(0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5);
		float diff = sceneDepth - waterDepth;
		float shoreEdge = 1.0 - step(0.055 + n2 * 0.03, diff);
		color = mix(color, foamWhite, shoreEdge * 0.85);
	}

	float shade = max(dot(normalize(vNormal), normalize(uLightPosition - vWorldPosition)), 0.0);
	color *= mix(0.82, 1.04, smoothstep(0.15, 0.35, shade));

	gl_FragColor = vec4(color, 0.96);
}
`;
