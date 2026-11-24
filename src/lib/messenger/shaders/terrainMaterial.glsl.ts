export const terrainVertexShader = /* glsl */ `
attribute float surfaceId;
attribute float elementId;

varying vec2 vUv;
varying vec3 wNormal;
varying vec3 wPos;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vSurfaceId;
flat varying int vElementId;

void main() {
	vUv = uv;
	vElementId = int(elementId + 0.5);
	vSurfaceId = surfaceId;

	vec4 worldPosition = modelMatrix * vec4(position, 1.0);
	wNormal = normal;
	wPos = position.xyz;
	vNormal = normalize(normalMatrix * normal);
	vWorldPosition = worldPosition.xyz;

	gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const terrainFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tColors;
uniform sampler2D tNoiseTerrain;
uniform sampler2D tNoise;
uniform vec3 uLightPosition;

varying vec2 vUv;
varying vec3 wNormal;
varying vec3 wPos;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vSurfaceId;
flat varying int vElementId;

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

vec4 triplanar(sampler2D tex, vec3 normal, vec3 pos, float scale) {
	vec3 blend = abs(normal);
	blend = normalize(max(blend, 0.00001));
	float b = blend.x + blend.y + blend.z;
	blend /= vec3(b);
	vec4 x = texture2D(tex, pos.yz * scale);
	vec4 y = texture2D(tex, pos.xz * scale);
	vec4 z = texture2D(tex, pos.xy * scale);
	return x * blend.x + y * blend.y + z * blend.z;
}

void main() {
	vec3 worldNormal = normalize(vNormal);
	vec3 radialUp = normalize(wPos);
	float upness = dot(normalize(wNormal), radialUp);
	vec4 triplanarNoise = triplanar(tNoise, wNormal, wPos * 0.08, 1.0);
	float worldR = length(vWorldPosition);

	vec3 baseAtlas = texture2D(tColors, vUv).rgb;
	vec3 baseHsv = rgb2hsv(baseAtlas);

	// Detect natural hillside ground (elementId==1 OR warm beige/tan upward-facing terrain)
	bool isTanHill = (baseAtlas.r > 0.56 && baseAtlas.g > 0.52 && baseAtlas.b > 0.36
		&& (baseAtlas.r - baseAtlas.b) > 0.03 && baseHsv.y < 0.32 && upness > 0.52);
	bool isTerrain = (vElementId == 1) || isTanHill;

	vec3 color = baseAtlas;
	if (isTerrain) {
		float edgeNoise = (triplanarNoise.r - 0.5) * 0.55 + (triplanarNoise.g - 0.5) * 0.25;
		// Lush flat anime meadow green on hilltops & gentle slopes
		float grassMask = step(0.42, upness + edgeNoise * 0.35);
		// Painterly scalloped sandy dirt bank right along the water shoreline (worldR ~ 6.4-6.7)
		float shoreBank = 1.0 - step(6.62, worldR + edgeNoise * 0.32);
		// Small sandy dirt specks right beside the water bank
		float dirtSpeck = step(0.76, triplanarNoise.r) * (1.0 - step(6.95, worldR));

		vec3 grassLit = vec3(0.35, 0.67, 0.44);   // #59ab70 airy coastal meadow green
		vec3 grassVar = vec3(0.32, 0.62, 0.41);   // subtle sunlit patch
		vec3 sandBank = vec3(0.82, 0.77, 0.62);   // #d1c49e warm sunlit sand bank
		vec3 cliffEarth = vec3(0.76, 0.73, 0.63); // airy warm cream-stone cliff

		vec3 meadow = mix(grassLit, grassVar, step(0.55, triplanarNoise.g));
		color = mix(cliffEarth, meadow, grassMask);
		color = mix(color, sandBank, clamp(shoreBank + dirtSpeck, 0.0, 1.0));

		// Hand-drawn rock/cliff contour flecks on vertical cliff faces (like Abeto!)
		float cliffMask = 1.0 - grassMask;
		float rockFleck = smoothstep(0.76, 0.84, triplanarNoise.b) * cliffMask;
		color = mix(color, color * 0.88, rockFleck * 0.55);
	} else {
		// Subtle hand-illustrated surface details for wooden docks, crates, boat hull & walls!
		vec4 fineNoise = triplanar(tNoise, wNormal, wPos * 0.28, 1.0);
		// Warm wooden deck / dock platform surfaces get crisp subtle plank seams & wood tone variation
		bool isWoodDeck = (upness > 0.65 && baseAtlas.r > 0.46 && baseAtlas.g > 0.42 && baseAtlas.b < 0.68 && (baseAtlas.r - baseAtlas.b) > 0.035);
		if (isWoodDeck) {
			float plankCoord = fract(dot(wPos.xz, vec2(4.2, 1.4)));
			float plankLine = 1.0 - smoothstep(0.0, 0.048, min(plankCoord, 1.0 - plankCoord));
			float plankTone = step(0.5, fract(dot(floor(wPos.xz * 4.2), vec2(0.37, 0.71)))) * 0.035;
			color = mix(color, color * 0.72, plankLine * 0.65);
			color *= (1.0 - plankTone);
		}
		// Subtle concrete/plaster weathering speckles on buildings, boxes & boat hull
		float speck = smoothstep(0.78, 0.86, fineNoise.r);
		color = mix(color, color * 0.91, speck * 0.35);
	}

	// Soft sunlit 2-step anime cel shading with airy cool sky-tinted shadows (never dark!)
	vec3 colorShadow = rgb2hsv(color);
	colorShadow.r += 0.025;
	colorShadow.y = min(1.0, colorShadow.y * 1.05);
	colorShadow.z *= 0.80;
	colorShadow = hsv2rgb(colorShadow);

	vec3 lightDir = normalize(uLightPosition - vWorldPosition);
	float shade = max(dot(worldNormal, lightDir), 0.0);
	float shadowCut = smoothstep(0.18, 0.30, shade);
	color = mix(colorShadow, color, shadowCut);

	gl_FragColor = vec4(color, 1.0);
}
`;
