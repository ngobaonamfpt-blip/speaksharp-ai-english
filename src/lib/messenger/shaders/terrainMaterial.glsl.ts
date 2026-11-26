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
	float maxC = max(baseAtlas.r, max(baseAtlas.g, baseAtlas.b));
	float minC = min(baseAtlas.r, min(baseAtlas.g, baseAtlas.b));
	float baseSat = (maxC - minC) / max(maxC, 0.0001);

	// Detect natural hillside ground (elementId==1 OR warm beige/tan upward-facing terrain)
	bool isTanHill = (baseAtlas.r > 0.56 && baseAtlas.g > 0.52 && baseAtlas.b > 0.36
		&& (baseAtlas.r - baseAtlas.b) > 0.03 && baseSat < 0.32 && upness > 0.52);
	bool isTerrain = (vElementId == 1) || isTanHill;

	vec3 color = baseAtlas;
	if (isTerrain) {
		float edgeNoise = (triplanarNoise.r - 0.5) * 0.55 + (triplanarNoise.g - 0.5) * 0.25;
		// Lush flat anime meadow green on hilltops & stepped cliff ledges (like final_step_356.png!)
		float grassSignal = upness + edgeNoise * 0.42;
		float grassMask = step(0.41, grassSignal);
		// Delicate hand-inked dark olive transition rim right at the jagged grass-to-cliff border!
		float grassRim = (1.0 - smoothstep(0.0, 0.026, abs(grassSignal - 0.41))) * step(6.66, worldR);

		// Painterly scalloped golden-cream beach + glistening wet-sand tide zone right along the shore!
		float shoreSignal = worldR + edgeNoise * 0.34;
		float shoreBank = 1.0 - step(6.68, shoreSignal);
		float wetSand = 1.0 - step(6.52, shoreSignal);
		float dirtSpeck = step(0.74, triplanarNoise.r) * (1.0 - step(7.02, worldR));

		vec3 grassLit   = vec3(0.36, 0.72, 0.47);  // #5cb878 fresh luminous meadow green
		vec3 grassVar   = vec3(0.32, 0.66, 0.43);  // soft sunlit turf patch
		vec3 drySand    = vec3(0.93, 0.88, 0.73);  // #ede0ba warm sunlit golden-cream beach sand
		vec3 sandRipple = vec3(0.86, 0.80, 0.65);  // delicate wind-swept sand ripple accent
		vec3 wetSandCol = vec3(0.77, 0.70, 0.55);  // glistening damp shoreline tide band
		vec3 cliffEarth = vec3(0.89, 0.86, 0.74);  // #e3dbbd bright sun-kissed Abeto cream cliff

		// Delicate hand-drawn wind ripples + tiny shell flecks on dry beach sand
		float rippleBand = sin(worldR * 28.0 + triplanarNoise.r * 5.0) * 0.5 + 0.5;
		vec3 beachCol = mix(drySand, sandRipple, step(0.72, rippleBand) * 0.42);
		float shellFleck = step(0.86, triplanarNoise.b) * shoreBank;
		beachCol = mix(beachCol, vec3(0.98, 0.96, 0.91), shellFleck * 0.75);

		vec3 meadow = mix(grassLit, grassVar, step(0.55, triplanarNoise.g));
		color = mix(cliffEarth, meadow, grassMask);
		color = mix(color, vec3(0.24, 0.36, 0.30), grassRim * 0.42);
		color = mix(color, beachCol, clamp(shoreBank + dirtSpeck, 0.0, 1.0));
		color = mix(color, wetSandCol, wetSand * 0.68);

		// Sparse delicate hand-drawn horizontal cliff strata lines + subtle rock flecks (airy like Abeto!)
		float cliffMask = 1.0 - grassMask;
		float strataWave = fract(worldR * 2.2 + triplanarNoise.r * 0.45);
		float strataLine = (1.0 - smoothstep(0.0, 0.028, abs(strataWave - 0.5))) * step(0.58, triplanarNoise.g) * cliffMask;
		float rockFleck = smoothstep(0.78, 0.86, triplanarNoise.b) * cliffMask;
		color = mix(color, color * 0.82, strataLine * 0.42);
		color = mix(color, color * 0.92, rockFleck * 0.42);
	} else {
		// Reuse triplanarNoise (saves 3 texture reads/pixel on buildings, docks & boats!)
		bool isWoodDeck = (upness > 0.65 && baseAtlas.r > 0.46 && baseAtlas.g > 0.42 && baseAtlas.b < 0.68 && (baseAtlas.r - baseAtlas.b) > 0.035);
		if (isWoodDeck) {
			float plankCoord = fract(dot(wPos.xz, vec2(4.2, 1.4)));
			float plankLine = 1.0 - smoothstep(0.0, 0.044, min(plankCoord, 1.0 - plankCoord));
			float plankTone = step(0.5, fract(dot(floor(wPos.xz * 4.2), vec2(0.37, 0.71)))) * 0.025;
			color = mix(color, color * 0.80, plankLine * 0.48);
			color *= (1.0 - plankTone);
		}
		float speck = smoothstep(0.80, 0.88, triplanarNoise.b);
		color = mix(color, color * 0.94, speck * 0.28);
	}

	// Luminous sunlit 2-step anime cel shading with super airy sky-tinted shadows (zero HSV math!)
	vec3 colorShadow = color * vec3(0.85, 0.88, 0.92);

	vec3 lightDir = normalize(uLightPosition - vWorldPosition);
	float shade = max(dot(worldNormal, lightDir), 0.0);
	float shadowCut = smoothstep(0.18, 0.30, shade);
	color = mix(colorShadow, color, shadowCut);

	gl_FragColor = vec4(color, 1.0);
}
`;
