export const gameplayWaterVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vHighPrecisionZW;

uniform float uTime;

void main() {
	vUv = uv;
	vNormal = normalize(normalMatrix * normal);

	// Subtle gentle ocean swell along radial normal
	vec3 radial = normalize(position);
	float swell = sin(position.x * 1.4 + uTime * 1.2) * cos(position.z * 1.3 - uTime * 0.9) * 0.014;
	vec3 pos = position + radial * swell;

	vec4 viewPosition = modelViewMatrix * vec4(pos, 1.0);
	vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
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

float uNearFix(float n) { return max(n, 0.001); }

float linearizeDepth(float depth) {
	float z = depth * 2.0 - 1.0;
	return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uNearFix(uCameraNear) - z * (uCameraFar - uCameraNear));
}

void main() {
	// Multi-layered Studio Ghibli / Abeto coastal turquoise water (2 texture reads instead of 3!)
	vec2 p1 = vWorldPosition.xz * 0.16 + vec2(uTime * 0.024, -uTime * 0.016);
	vec2 p2 = vWorldPosition.xy * 0.15 + vec2(-uTime * 0.018, uTime * 0.026);
	vec4 s1 = texture2D(tNoise, p1);
	vec4 s2 = texture2D(tNoise, p2 * 1.35 + s1.r * 0.28);
	float n1 = s1.r;
	float n2 = s2.g;
	float n3 = s2.b;

	vec3 deepOcean   = vec3(0.15, 0.42, 0.49);  // #266b7d deep ocean current
	vec3 midTeal     = vec3(0.22, 0.56, 0.62);  // #388f9e main vibrant coastal teal
	vec3 shallowAqua = vec3(0.36, 0.76, 0.76);  // #5cc2c2 luminous lagoon shallows
	vec3 causticGlow = vec3(0.54, 0.86, 0.85);  // #8adbd9 sunlit caustic highlight
	vec3 foamWhite   = vec3(0.96, 0.99, 0.98);  // #f5fcf9 crisp anime sea foam

	vec3 color = midTeal;
	// Organic flat-edged deeper ocean currents
	color = mix(color, deepOcean, step(0.57, n1));
	// Organic flat-edged sunlit reflection pools
	color = mix(color, shallowAqua, step(0.61, n2));

	// Elongated hand-drawn anime water reflection ribbons & dancing sparkles
	float ribbonSignal = n1 * 0.5 + n3 * 0.5 + sin(vWorldPosition.x * 2.6 + vWorldPosition.z * 2.0 + uTime * 1.2) * 0.09;
	float ribbon = step(0.77, ribbonSignal) * (1.0 - step(0.84, ribbonSignal));
	float sparkle = step(0.87, n2 * 0.45 + n3 * 0.72);
	color = mix(color, causticGlow, ribbon * 0.65);
	color = mix(color, foamWhite, sparkle * 0.94);

	// === LAGOON SHALLOWS + ROLLING SHORE WAVES + FOAM BANDS ===
	if (uUseSceneDepth > 0.5) {
		vec2 screenUv = gl_FragCoord.xy / uResolution;
		float sceneDepth = linearizeDepth(texture2D(tSceneDepth, screenUv).x);
		float waterDepth = linearizeDepth(0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5);
		float diff = max(0.0, sceneDepth - waterDepth);

		// Bright turquoise lagoon tint in shallow coastal water
		float shallowMask = 1.0 - smoothstep(0.06, 0.52, diff);
		color = mix(color, shallowAqua, shallowMask * 0.78);

		// Subtle sunlit caustic lattice dancing in the shallows
		float causticNet = step(0.68, abs(n1 - n2) * 2.2 + n3 * 0.35) * shallowMask;
		color = mix(color, causticGlow, causticNet * 0.48);

		// Rhythmic animated rolling shore wave bands lapping onto the sand!
		float wavePhase = sin(diff * 24.0 - uTime * 2.3 + n1 * 3.8);
		float rollingWave = step(0.76, wavePhase) * (1.0 - smoothstep(0.10, 0.42, diff));
		color = mix(color, foamWhite, rollingWave * 0.78);

		// Primary crisp white shoreline foam band with soft sea-teal rim
		float shoreThresh = 0.072 + n2 * 0.036 + sin(uTime * 1.9 + n1 * 4.0) * 0.012;
		float shoreEdge = 1.0 - step(shoreThresh, diff);
		float shoreInk = step(shoreThresh, diff) * (1.0 - step(shoreThresh + 0.018, diff));
		color = mix(color, deepOcean * 0.78, shoreInk * 0.52);
		color = mix(color, foamWhite, shoreEdge * 0.92);
	}

	float shade = max(dot(normalize(vNormal), normalize(uLightPosition - vWorldPosition)), 0.0);
	color *= mix(0.88, 1.06, smoothstep(0.12, 0.35, shade));

	gl_FragColor = vec4(color, 0.95);
}
`;
