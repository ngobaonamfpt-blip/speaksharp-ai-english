import * as THREE from 'three';
import type { EmoteAction, HairStyle, TopStyle } from './playerController';

interface LoftSection {
	y: number;
	rx: number;
	rz: number;
	cx?: number;
	cz?: number;
	/** >0 flattens front (+Z), <0 flattens back (-Z) */
	flatZ?: number;
	/** Subtle cloth drape wave amplitude */
	foldAmp?: number;
	foldFreq?: number;
	/** Front center V-split opening width (radians around +Z) */
	frontSplit?: number;
}

/**
 * Generates a continuous, organically shaped low-poly anime mesh by lofting
 * anatomical cross-sections — eliminating primitive spheres/cylinders/boxes.
 */
function createLoftedMeshGeometry(
	sections: LoftSection[],
	radialSegs = 12,
	capTop = true,
	capBottom = true
): THREE.BufferGeometry {
	const rings = sections.length;
	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];

	for (let r = 0; r < rings; r++) {
		const s = sections[r];
		const v = r / Math.max(1, rings - 1);
		const cx = s.cx ?? 0;
		const cz = s.cz ?? 0;
		const foldAmp = s.foldAmp ?? 0;
		const foldFreq = s.foldFreq ?? 4;

		for (let i = 0; i <= radialSegs; i++) {
			const u = i / radialSegs;
			// Start at +Z (front) or wrap cleanly
			const theta = u * Math.PI * 2;
			const sinT = Math.sin(theta);
			const cosT = Math.cos(theta);

			const fold = 1 + Math.sin(theta * foldFreq + 0.6) * foldAmp;
			let x = sinT * s.rx * fold;
			let z = cosT * s.rz * fold;

			// Optional subtle flattening (e.g. chest / back / forehead)
			if (s.flatZ && z > 0 && s.flatZ > 0) {
				z *= 1 - s.flatZ * Math.pow(Math.max(0, cosT), 2);
			} else if (s.flatZ && z < 0 && s.flatZ < 0) {
				z *= 1 + s.flatZ * Math.pow(Math.max(0, -cosT), 2);
			}

			// Optional front V-split opening (recesses center-front hem inward)
			if (s.frontSplit && cosT > 0.72) {
				const splitFactor = (cosT - 0.72) / 0.28;
				z -= s.frontSplit * splitFactor * s.rz;
			}

			positions.push(cx + x, s.y, cz + z);
			uvs.push(u, v);
		}
	}

	const stride = radialSegs + 1;
	for (let r = 0; r < rings - 1; r++) {
		for (let i = 0; i < radialSegs; i++) {
			const a = r * stride + i;
			const b = (r + 1) * stride + i;
			const c = (r + 1) * stride + i + 1;
			const d = r * stride + i + 1;
			indices.push(a, d, b);
			indices.push(b, d, c);
		}
	}

	if (capBottom && rings > 0) {
		const s0 = sections[0];
		const centerIdx = positions.length / 3;
		positions.push(s0.cx ?? 0, s0.y, s0.cz ?? 0);
		uvs.push(0.5, 0);
		for (let i = 0; i < radialSegs; i++) {
			indices.push(centerIdx, i, i + 1);
		}
	}

	if (capTop && rings > 0) {
		const sLast = sections[rings - 1];
		const baseRow = (rings - 1) * stride;
		const centerIdx = positions.length / 3;
		positions.push(sLast.cx ?? 0, sLast.y, sLast.cz ?? 0);
		uvs.push(0.5, 1);
		for (let i = 0; i < radialSegs; i++) {
			indices.push(centerIdx, baseRow + i + 1, baseRow + i);
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	geo.setIndex(indices);
	geo.computeVertexNormals();
	return geo;
}

/**
 * Generates a swept, tapered 3D anime hair strand ribbon along a CatmullRomCurve3.
 * Produces sharp diamond/triangular anime lock cross-sections instead of cones.
 */
function createHairStrandGeometry(
	points: THREE.Vector3[],
	baseWidth: number,
	baseDepth: number,
	segments = 7
): THREE.BufferGeometry {
	const curve = new THREE.CatmullRomCurve3(points);
	const positions: number[] = [];
	const indices: number[] = [];
	const frames = curve.computeFrenetFrames(segments, false);
	const radial = 4; // Crisp 4-sided diamond anime hair lock!

	for (let s = 0; s <= segments; s++) {
		const t = s / segments;
		const p = curve.getPointAt(t);
		// Full near root/mid, tapers crisply to a sharp anime point at tip
		const taper = t < 0.2 ? 0.78 + (t / 0.2) * 0.22 : Math.pow(1 - (t - 0.2) / 0.8, 0.78);
		const w = Math.max(0.002, baseWidth * taper);
		const d = Math.max(0.002, baseDepth * taper);

		const N = frames.normals[s];
		const B = frames.binormals[s];

		const offsets = [
			[w, 0],
			[0, d],
			[-w, 0],
			[0, -d * 0.65]
		];
		for (let k = 0; k < radial; k++) {
			const [ox, oy] = offsets[k];
			positions.push(
				p.x + B.x * ox + N.x * oy,
				p.y + B.y * ox + N.y * oy,
				p.z + B.z * ox + N.z * oy
			);
		}
	}

	for (let s = 0; s < segments; s++) {
		for (let k = 0; k < radial; k++) {
			const kn = (k + 1) % radial;
			const a = s * radial + k;
			const b = (s + 1) * radial + k;
			const c = (s + 1) * radial + kn;
			const d = s * radial + kn;
			indices.push(a, b, d);
			indices.push(b, c, d);
		}
	}

	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geo.setIndex(indices);
	geo.computeVertexNormals();
	return geo;
}

/**
 * Sculpted single-piece anime head geometry:
 * - Organic cranium, flat cheek planes, tapered anime jawline & pointed chin
 * - Subtle integrated nose bridge/tip sculpted directly into front vertices
 */
function createSculptedAnimeHeadGeometry(): THREE.BufferGeometry {
	const geo = new THREE.SphereGeometry(0.255, 22, 18);
	const pos = geo.attributes.position as THREE.BufferAttribute;
	const uv = geo.attributes.uv as THREE.BufferAttribute;
	const v = new THREE.Vector3();

	for (let i = 0; i < pos.count; i++) {
		v.fromBufferAttribute(pos, i);
		const x = v.x;
		const y = v.y;
		const z = v.z;

		// Normalize height roughly [-1, 1]
		const yn = y / 0.255;
		const zn = z / 0.255;
		const xn = x / 0.255;

		let nx = x * 0.94;
		let ny = y * 1.02;
		let nz = z * 0.94;

		// Sculpt soft, natural anime jawline & gentle chin (like media_1795542472014_12cfbc12.png!)
		if (yn < 0.0) {
			const jawT = Math.min(1, -yn);
			// Gentle natural taper (NOT a sharp triangle!)
			nx *= 1 - jawT * 0.24;
			if (zn > 0) {
				nz += jawT * 0.014 * Math.max(0, 1 - Math.abs(xn) * 1.5);
			} else {
				nz *= 1 - jawT * 0.22;
			}
		}

		// Slightly flatten front face plane so anime cel-shadow cuts cleanly
		if (zn > 0.35 && yn > -0.55 && yn < 0.55) {
			const faceMask = Math.max(0, 1 - Math.abs(xn) * 1.15);
			nz -= faceMask * 0.018;
		}

		// Integrated subtle sculpted anime nose bridge & tip
		if (zn > 0.65 && Math.abs(xn) < 0.19 && yn > -0.34 && yn < 0.06) {
			const noseX = Math.max(0, 1 - Math.abs(xn) / 0.19);
			const noseY = 1 - Math.abs((yn + 0.16) / 0.2);
			const nosePeak = Math.pow(Math.max(0, noseX * noseY), 1.4);
			nz += nosePeak * 0.036;
			ny -= nosePeak * 0.008;
		}

		// Subtle brow ridge overhang above eyes
		if (zn > 0.55 && yn > 0.12 && yn < 0.32 && Math.abs(xn) < 0.55) {
			const browMask = Math.sin(((yn - 0.12) / 0.2) * Math.PI);
			nz += browMask * 0.008;
		}

		pos.setXYZ(i, nx, ny, nz);

		// Planar front-projected UV for crisp, distortion-free anime face painting!
		const u = 0.5 + nx / 0.52;
		const vCoord = 0.5 + ny / 0.58;
		uv.setXY(i, THREE.MathUtils.clamp(u, 0.01, 0.99), THREE.MathUtils.clamp(vCoord, 0.01, 0.99));
	}

	geo.computeVertexNormals();
	return geo;
}

/**
 * High-res procedural anime face texture (512x512) matching Abeto Messenger:
 * - Warm peachy skin base with subtle cheek tint
 * - Crisp hand-inked almond eyes, bold angled brows, delicate nose shadow, calm smile
 * - Separate `blink` variant for smooth natural blinking!
 */
function createAnimeFaceTexture(blink: boolean): THREE.CanvasTexture {
	const size = 512;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;

	// Warm anime skin tone matching reference
	ctx.fillStyle = '#e7c6be';
	ctx.fillRect(0, 0, size, size);

	// Soft subtle blush on cheekbones
	for (const side of [-1, 1]) {
		const gx = size * (0.5 + side * 0.185);
		const gy = size * 0.545;
		const grad = ctx.createRadialGradient(gx, gy, 4, gx, gy, 34);
		grad.addColorStop(0, 'rgba(218, 138, 134, 0.28)');
		grad.addColorStop(1, 'rgba(218, 138, 134, 0.0)');
		ctx.fillStyle = grad;
		ctx.beginPath();
		ctx.arc(gx, gy, 34, 0, Math.PI * 2);
		ctx.fill();
	}

	// Draw bold, expressive anime eyes & angled eyebrows (readable even at gameplay camera distance!)
	for (const side of [-1, 1]) {
		const ex = size * (0.5 + side * 0.16);
		const ey = size * 0.505;

		// Bold tapered anime eyebrow
		ctx.save();
		ctx.translate(ex, ey - 42);
		ctx.rotate(side * -0.1);
		ctx.fillStyle = '#182028';
		ctx.beginPath();
		ctx.moveTo(-side * 30, -6);
		ctx.quadraticCurveTo(0, -13, side * 32, -2);
		ctx.quadraticCurveTo(0, 3, -side * 30, 7);
		ctx.closePath();
		ctx.fill();
		ctx.restore();

		// Subtle upper eyelid crease
		ctx.strokeStyle = 'rgba(130, 92, 92, 0.5)';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(ex - 26, ey - 20);
		ctx.quadraticCurveTo(ex, ey - 28, ex + 26, ey - 19);
		ctx.stroke();

		if (blink) {
			// Crisp closed-eye anime curve
			ctx.strokeStyle = '#141a20';
			ctx.lineWidth = 8;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(ex - 26, ey + 2);
			ctx.quadraticCurveTo(ex, ey + 13, ex + 26, ey + 1);
			ctx.stroke();
		} else {
			// Clean off-white sclera
			ctx.fillStyle = '#faf7f2';
			ctx.beginPath();
			ctx.ellipse(ex, ey + 2, 27, 16, side * -0.04, 0, Math.PI * 2);
			ctx.fill();

			// Crisp bold dark anime iris/pupil
			ctx.fillStyle = '#141a20';
			ctx.beginPath();
			ctx.ellipse(ex - side * 2, ey + 2, 15.5, 15.5, 0, 0, Math.PI * 2);
			ctx.fill();

			// Tiny crisp anime eye glint
			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.arc(ex - side * 6 - 2, ey - 3, 3.6, 0, Math.PI * 2);
			ctx.fill();

			// Bold tapered upper lash line (iconic Abeto Messenger look!)
			ctx.strokeStyle = '#12181e';
			ctx.lineWidth = 10;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(ex - 30, ey - 4);
			ctx.quadraticCurveTo(ex, ey - 18, ex + 30, ey - 3);
			ctx.stroke();
		}
	}

	// Subtle nose tip shadow accent
	ctx.fillStyle = 'rgba(155, 116, 112, 0.42)';
	ctx.beginPath();
	ctx.moveTo(size * 0.5 - 6, size * 0.59);
	ctx.lineTo(size * 0.5 + 10, size * 0.602);
	ctx.lineTo(size * 0.5 - 2, size * 0.615);
	ctx.closePath();
	ctx.fill();

	// Calm, gentle anime mouth line (matches media_1795542472014_12cfbc12.png!)
	ctx.strokeStyle = '#1e262e';
	ctx.lineWidth = 6;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(size * 0.452, size * 0.685);
	ctx.quadraticCurveTo(size * 0.5, size * 0.698, size * 0.548, size * 0.683);
	ctx.stroke();

	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.needsUpdate = true;
	return tex;
}

/**
 * Adds a true Inverted-Hull (BackSide) anime charcoal ink outline mesh as a child.
 * Creates crisp, uniform anime mesh contours at every angle without primitive seams!
 */
function addAnimeOutline(
	mesh: THREE.Mesh,
	thickness = 0.014,
	outlineMat?: THREE.Material
): THREE.Mesh {
	const mat =
		outlineMat ??
		new THREE.MeshBasicMaterial({
			color: 0x1c2329,
			side: THREE.BackSide
		});
	const outlineGeo = mesh.geometry.clone();
	const pos = outlineGeo.attributes.position as THREE.BufferAttribute;
	let norm = outlineGeo.attributes.normal as THREE.BufferAttribute | undefined;
	if (!norm) {
		outlineGeo.computeVertexNormals();
		norm = outlineGeo.attributes.normal as THREE.BufferAttribute;
	}
	const p = new THREE.Vector3();
	const n = new THREE.Vector3();
	for (let i = 0; i < pos.count; i++) {
		p.fromBufferAttribute(pos, i);
		n.fromBufferAttribute(norm, i);
		p.addScaledVector(n, thickness);
		pos.setXYZ(i, p.x, p.y, p.z);
	}
	pos.needsUpdate = true;

	const outlineMesh = new THREE.Mesh(outlineGeo, mat);
	outlineMesh.name = `${mesh.name || 'part'}_outline`;
	outlineMesh.castShadow = false;
	outlineMesh.receiveShadow = false;
	mesh.add(outlineMesh);
	return outlineMesh;
}

/**
 * Crisp 2-tone Studio Anime cel-shading gradient map (sharp light/shadow split
 * matching media_1795542472014_12cfbc12.png!).
 */
function createSharpAnimeGradient(): THREE.DataTexture {
	// 4 texels: 1 airy cool-lavender shadow step + 3 bright sunlit steps -> soft Abeto cel split
	const data = new Uint8Array([
		202, 206, 222, 255,
		248, 248, 250, 255,
		255, 255, 255, 255,
		255, 255, 255, 255
	]);
	const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
	tex.minFilter = THREE.NearestFilter;
	tex.magFilter = THREE.NearestFilter;
	tex.needsUpdate = true;
	return tex;
}

/**
 * Sculpted Anime Hand (tapered palm + curved finger silhouette + angled thumb)
 */
function createSculptedHand(side: -1 | 1, skinM: THREE.Material, outlineM: THREE.Material): THREE.Group {
	const hand = new THREE.Group();

	// Sculpted slightly curved anime hand profile
	const shape = new THREE.Shape();
	shape.moveTo(-0.036, 0.02);
	shape.lineTo(0.036, 0.02);
	shape.lineTo(0.044, -0.045);
	shape.lineTo(0.032, -0.115);
	shape.lineTo(0.008, -0.132);
	shape.lineTo(-0.028, -0.12);
	shape.lineTo(-0.042, -0.055);
	shape.closePath();

	const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
		depth: 0.032,
		bevelEnabled: true,
		bevelSegments: 2,
		steps: 1,
		bevelSize: 0.009,
		bevelThickness: 0.009
	});
	extrudeGeo.translate(0, 0, -0.016);
	const palmMesh = new THREE.Mesh(extrudeGeo, skinM);
	palmMesh.rotation.y = side * -0.35;
	addAnimeOutline(palmMesh, 0.01, outlineM);
	hand.add(palmMesh);

	// Sculpted thumb curve
	const thumbGeo = createHairStrandGeometry(
		[
			new THREE.Vector3(-side * 0.03, -0.015, 0.01),
			new THREE.Vector3(-side * 0.052, -0.052, 0.026),
			new THREE.Vector3(-side * 0.038, -0.088, 0.03)
		],
		0.017,
		0.015,
		4
	);
	const thumbMesh = new THREE.Mesh(thumbGeo, skinM);
	addAnimeOutline(thumbMesh, 0.008, outlineM);
	hand.add(thumbMesh);

	return hand;
}

/**
 * Sculpted Chunky Anime High-Top Sneaker (lofted silhouette + raised tongue + beveled sole)
 */
function createSculptedSneaker(
	side: -1 | 1,
	shoeM: THREE.Material,
	creamM: THREE.Material,
	inkM: THREE.Material,
	outlineM: THREE.Material
): THREE.Group {
	const group = new THREE.Group();

	// 1. Sculpted high-top boot upper (ankle collar -> instep -> chunky toe box)
	const bootGeo = createLoftedMeshGeometry(
		[
			{ y: -0.465, rx: 0.088, rz: 0.145, cz: 0.048, flatZ: 0.18 },
			{ y: -0.43, rx: 0.086, rz: 0.15, cz: 0.052, flatZ: 0.12 },
			{ y: -0.39, rx: 0.08, rz: 0.115, cz: 0.022 },
			{ y: -0.34, rx: 0.078, rz: 0.09, cz: 0.005 },
			{ y: -0.30, rx: 0.082, rz: 0.088, cz: 0.004 }
		],
		12,
		true,
		true
	);
	const bootMesh = new THREE.Mesh(bootGeo, shoeM);
	bootMesh.name = 'shoeMesh';
	addAnimeOutline(bootMesh, 0.012, outlineM);
	group.add(bootMesh);

	// 2. Raised high-top anime sneaker tongue (matches media_1795542472014_12cfbc12.png!)
	const tongueShape = new THREE.Shape();
	tongueShape.moveTo(-0.046, 0);
	tongueShape.lineTo(0.046, 0);
	tongueShape.lineTo(0.038, 0.095);
	tongueShape.quadraticCurveTo(0, 0.115, -0.038, 0.095);
	tongueShape.closePath();
	const tongueGeo = new THREE.ExtrudeGeometry(tongueShape, {
		depth: 0.022,
		bevelEnabled: true,
		bevelSize: 0.006,
		bevelThickness: 0.006,
		bevelSegments: 1
	});
	const tongueMesh = new THREE.Mesh(tongueGeo, shoeM);
	tongueMesh.name = 'shoeMesh';
	tongueMesh.position.set(0, -0.365, 0.074);
	tongueMesh.rotation.x = 0.28;
	addAnimeOutline(tongueMesh, 0.01, outlineM);
	group.add(tongueMesh);

	// 3. Thick beveled rubber sole + stepped toe bumper ridge
	const soleGeo = createLoftedMeshGeometry(
		[
			{ y: -0.495, rx: 0.092, rz: 0.156, cz: 0.05, flatZ: 0.18 },
			{ y: -0.46, rx: 0.094, rz: 0.158, cz: 0.05, flatZ: 0.18 }
		],
		12,
		true,
		true
	);
	const soleMesh = new THREE.Mesh(soleGeo, inkM);
	const heelStep = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.07), inkM);
	heelStep.position.set(0, -0.458, -0.068);
	group.add(soleMesh, heelStep);

	// 4. Crisp white diagonal sneaker accents (front laces + outer side + vertical back heel tab!)
	const lace1 = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.017, 0.022), creamM);
	lace1.position.set(0, -0.405, 0.148);
	lace1.rotation.x = 0.45;
	const lace2 = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.017, 0.022), creamM);
	lace2.position.set(0, -0.435, 0.175);
	lace2.rotation.x = 0.45;

	const sideStripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.055, 0.022), creamM);
	sideStripe1.position.set(side * 0.086, -0.435, 0.075);
	sideStripe1.rotation.x = 0.42;
	const sideStripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.052, 0.022), creamM);
	sideStripe2.position.set(side * 0.086, -0.435, 0.028);
	sideStripe2.rotation.x = 0.42;

	// Vertical cream heel-tab stripe on the back of each sneaker (matches Abeto back view!)
	const heelTab = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.088, 0.018), creamM);
	heelTab.position.set(0, -0.395, -0.085);

	group.add(lace1, lace2, sideStripe1, sideStripe2, heelTab);
	return group;
}

/**
 * Builds the upgraded Sculpted Anime Mesh Courier Character!
 * Preserves all node names for animations, emotes, hairstyles, tops, and wardrobe color customization.
 */
export function buildSculptedAnimeCourier(
	_toonGradient: THREE.DataTexture,
	opts: {
		hatColor: number;
		shirtColor: number;
		bagColor: number;
		pantsColor?: number;
		shoeColor?: number;
		scarfColor?: number;
		hairStyle?: HairStyle;
		topStyle?: TopStyle;
	}
): THREE.Group {
	const root = new THREE.Group();
	const bodyRoot = new THREE.Group();
	bodyRoot.name = 'bodyRoot';
	bodyRoot.scale.setScalar(0.132);
	root.add(bodyRoot);

	const sharpGradient = createSharpAnimeGradient();
	const toon = (c: number) =>
		new THREE.MeshToonMaterial({ color: c, gradientMap: sharpGradient });

	const skinM = toon(0xe7c6be);
	const shirtM = toon(opts.shirtColor);
	const hairM = toon(opts.hatColor);
	const bagM = toon(opts.bagColor);
	const strapM = toon(0x1f262d);
	const pantsM = toon(opts.pantsColor ?? 0x202933);
	const sockM = toon(0xf2efe6);
	const shoeM = toon(opts.shoeColor ?? 0x1b2128);
	const creamM = toon(0xf5f1e6);
	const goldM = toon(0xf5bd33);
	const strawM = toon(0xe0cfa2);
	const ribbonM = toon(0x74b589);
	const darkInkM = new THREE.MeshBasicMaterial({ color: 0x26313a });
	const outlineM = new THREE.MeshBasicMaterial({
		color: 0x2f3d47,
		side: THREE.BackSide
	});

	// 1. Tailored Wide-Leg Culotte Shorts + Sculpted Calves + Socks + Chunky High-Top Sneakers
	([-1, 1] as const).forEach((side, i) => {
		const leg = new THREE.Group();
		leg.name = i === 0 ? 'leftLeg' : 'rightLeg';
		leg.position.set(side * 0.135, 1.07, 0);

		// Sculpted wide A-line culotte pant-leg with natural cloth drape
		const pantGeo = createLoftedMeshGeometry(
			[
				{ y: -0.58, rx: 0.168, rz: 0.162, foldAmp: 0.045, foldFreq: 5 },
				{ y: -0.40, rx: 0.155, rz: 0.15, foldAmp: 0.03, foldFreq: 5 },
				{ y: -0.18, rx: 0.14, rz: 0.136, foldAmp: 0.02, foldFreq: 4 },
				{ y: 0.04, rx: 0.128, rz: 0.125 }
			],
			12,
			true,
			true
		);
		const pant = new THREE.Mesh(pantGeo, pantsM);
		pant.name = 'pantsMesh';
		addAnimeOutline(pant, 0.013, outlineM);
		leg.add(pant);

		const shin = new THREE.Group();
		shin.name = i === 0 ? 'leftShin' : 'rightShin';
		shin.position.y = -0.55;
		leg.add(shin);

		// Anatomically tapered anime calf (wider near upper calf, slender at ankle)
		const calfGeo = createLoftedMeshGeometry(
			[
				{ y: -0.27, rx: 0.045, rz: 0.048 },
				{ y: -0.18, rx: 0.056, rz: 0.062, cz: -0.008 },
				{ y: -0.08, rx: 0.062, rz: 0.066, cz: -0.005 },
				{ y: 0.02, rx: 0.058, rz: 0.06 }
			],
			10,
			true,
			true
		);
		const calf = new THREE.Mesh(calfGeo, skinM);
		addAnimeOutline(calf, 0.009, outlineM);
		shin.add(calf);

		// Ribbed cream crew sock
		const sockGeo = createLoftedMeshGeometry(
			[
				{ y: -0.33, rx: 0.052, rz: 0.054 },
				{ y: -0.25, rx: 0.056, rz: 0.058 },
				{ y: -0.21, rx: 0.06, rz: 0.062 }
			],
			10,
			true,
			true
		);
		const sock = new THREE.Mesh(sockGeo, sockM);
		addAnimeOutline(sock, 0.009, outlineM);
		shin.add(sock);

		// Chunky Sculpted High-Top Anime Sneaker
		const sneaker = createSculptedSneaker(side, shoeM, creamM, darkInkM, outlineM);
		shin.add(sneaker);

		bodyRoot.add(leg);
	});

	// 2. Sculpted Tailored A-Line Anime Coat + Folded Collar + Pocket Flaps + Buttons
	const torsoGroup = new THREE.Group();
	torsoGroup.name = 'torsoGroup';
	torsoGroup.position.y = 1.48;
	bodyRoot.add(torsoGroup);

	// Continuous sculpted A-line coat body with natural cloth drape & front V-split
	const coatGeo = createLoftedMeshGeometry(
		[
			{ y: -0.42, rx: 0.345, rz: 0.24, foldAmp: 0.035, foldFreq: 6, frontSplit: 0.36 },
			{ y: -0.26, rx: 0.315, rz: 0.222, foldAmp: 0.025, foldFreq: 6, frontSplit: 0.16 },
			{ y: -0.05, rx: 0.285, rz: 0.205, flatZ: 0.12 },
			{ y: 0.18, rx: 0.265, rz: 0.19, flatZ: 0.14 },
			{ y: 0.35, rx: 0.245, rz: 0.165, flatZ: 0.1 },
			{ y: 0.41, rx: 0.14, rz: 0.12 }
		],
		14,
		true,
		true
	);
	const coat = new THREE.Mesh(coatGeo, shirtM);
	coat.name = 'shirtMesh';
	addAnimeOutline(coat, 0.015, outlineM);
	torsoGroup.add(coat);

	// Crisp cream hem stripe hugging the coat flare
	const hemGeo = createLoftedMeshGeometry(
		[
			{ y: -0.395, rx: 0.348, rz: 0.244, foldAmp: 0.034, foldFreq: 6, frontSplit: 0.34 },
			{ y: -0.362, rx: 0.342, rz: 0.24, foldAmp: 0.032, foldFreq: 6, frontSplit: 0.30 }
		],
		14,
		false,
		false
	);
	const hemStripe = new THREE.Mesh(hemGeo, creamM);
	torsoGroup.add(hemStripe);

	// Coat detail group (hidden when TopStyle === 'tee')
	const coatDetails = new THREE.Group();
	coatDetails.name = 'top-coat-details';
	torsoGroup.add(coatDetails);

	// Sculpted Folded Sailor/Workwear Collar (back wrap + crisp extruded pointed lapels!)
	const backCollarGeo = createLoftedMeshGeometry(
		[
			{ y: 0.34, rx: 0.22, rz: 0.17, cz: -0.025 },
			{ y: 0.43, rx: 0.155, rz: 0.135, cz: -0.012 }
		],
		12,
		false,
		false
	);
	const backCollar = new THREE.Mesh(backCollarGeo, creamM);
	addAnimeOutline(backCollar, 0.01, outlineM);
	coatDetails.add(backCollar);

	([-1, 1] as const).forEach((side) => {
		const lapelShape = new THREE.Shape();
		lapelShape.moveTo(0, 0.065);
		lapelShape.lineTo(side * 0.145, 0.045);
		lapelShape.lineTo(side * 0.175, -0.085);
		lapelShape.lineTo(side * 0.035, -0.105);
		lapelShape.closePath();

		const lapelGeo = new THREE.ExtrudeGeometry(lapelShape, {
			depth: 0.024,
			bevelEnabled: true,
			bevelSize: 0.005,
			bevelThickness: 0.005,
			bevelSegments: 1
		});
		const lapel = new THREE.Group();
		lapel.position.set(side * 0.025, 0.39, 0.125);
		lapel.rotation.set(0.32, side * -0.38, side * 0.12);

		const flapMesh = new THREE.Mesh(lapelGeo, creamM);
		addAnimeOutline(flapMesh, 0.009, outlineM);

		// Thin red trim stripe along collar edge
		const trimMesh = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.015, 0.03), shirtM);
		trimMesh.name = 'shirtMesh';
		trimMesh.position.set(side * 0.095, -0.065, 0.012);
		trimMesh.rotation.z = side * 0.12;

		lapel.add(flapMesh, trimMesh);
		coatDetails.add(lapel);
	});

	// Crisp Pointed Cream Chest Pocket Flaps w/ tiny red buttons
	([-1, 1] as const).forEach((side) => {
		const pShape = new THREE.Shape();
		pShape.moveTo(-0.072, 0.03);
		pShape.lineTo(0.072, 0.03);
		pShape.lineTo(0.068, -0.015);
		pShape.lineTo(0, -0.055);
		pShape.lineTo(-0.068, -0.015);
		pShape.closePath();

		const pGeo = new THREE.ExtrudeGeometry(pShape, {
			depth: 0.016,
			bevelEnabled: false
		});
		const pocket = new THREE.Group();
		pocket.position.set(side * 0.145, 0.135, 0.182);
		pocket.rotation.y = side * 0.26;
		pocket.rotation.x = -0.06;

		const pMesh = new THREE.Mesh(pGeo, creamM);
		addAnimeOutline(pMesh, 0.007, outlineM);

		const pBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 6), shirtM);
		pBtn.name = 'shirtMesh';
		pBtn.rotation.x = Math.PI / 2;
		pBtn.position.set(0, -0.012, 0.012);

		pocket.add(pMesh, pBtn);
		coatDetails.add(pocket);
	});

	// 4 Crisp Hexagonal Anime Coat Buttons + subtle diagonal bottom tack stitch
	([0.23, 0.07, -0.08, -0.21] as const).forEach((by, bi) => {
		const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.018, 6), creamM);
		btn.rotation.x = Math.PI / 2;
		btn.position.set(bi === 3 ? -0.038 : 0.0, by, 0.188 + (0.23 - by) * 0.065);
		coatDetails.add(btn);
	});
	const tackStitch = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.014, 0.016), creamM);
	tackStitch.position.set(-0.042, -0.255, 0.218);
	tackStitch.rotation.z = 0.48;
	coatDetails.add(tackStitch);

	// Crisp red-white-red inner accent pinstripe just above the cream hem band
	const hemAccentGeo = createLoftedMeshGeometry(
		[
			{ y: -0.352, rx: 0.34, rz: 0.238, foldAmp: 0.031, foldFreq: 6, frontSplit: 0.28 },
			{ y: -0.338, rx: 0.337, rz: 0.236, foldAmp: 0.03, foldFreq: 6, frontSplit: 0.26 }
		],
		14,
		false,
		false
	);
	const hemAccent = new THREE.Mesh(hemAccentGeo, creamM);
	coatDetails.add(hemAccent);

	// Sporty Tee trim group (gold neckline + athletic chest stripe)
	const teeDetails = new THREE.Group();
	teeDetails.name = 'top-tee-details';
	const teeRing = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.028, 6, 14), goldM);
	teeRing.rotation.x = Math.PI / 2;
	teeRing.position.y = 0.39;
	const teeStripe = new THREE.Mesh(
		createLoftedMeshGeometry(
			[
				{ y: 0.03, rx: 0.282, rz: 0.205, flatZ: 0.12 },
				{ y: 0.09, rx: 0.278, rz: 0.202, flatZ: 0.12 }
			],
			14,
			false,
			false
		),
		goldM
	);
	teeDetails.add(teeRing, teeStripe);
	teeDetails.visible = false;
	torsoGroup.add(teeDetails);

	// Sculpted Tapered Neck
	const neckGeo = createLoftedMeshGeometry(
		[
			{ y: 0.38, rx: 0.082, rz: 0.082 },
			{ y: 0.48, rx: 0.07, rz: 0.072 },
			{ y: 0.56, rx: 0.068, rz: 0.07 }
		],
		10,
		true,
		true
	);
	const neck = new THREE.Mesh(neckGeo, skinM);
	addAnimeOutline(neck, 0.008, outlineM);
	torsoGroup.add(neck);

	// Smooth Body-Hugging Crossbody Messenger Strap (Curved Tube wrapping shoulder to hip!)
	const strapCurve = new THREE.CatmullRomCurve3(
		[
			new THREE.Vector3(-0.26, -0.14, 0.06),
			new THREE.Vector3(-0.14, -0.02, 0.215),
			new THREE.Vector3(0.05, 0.18, 0.205),
			new THREE.Vector3(0.20, 0.38, 0.07),
			new THREE.Vector3(0.20, 0.38, -0.08),
			new THREE.Vector3(0.05, 0.16, -0.205),
			new THREE.Vector3(-0.15, -0.02, -0.21),
			new THREE.Vector3(-0.26, -0.14, -0.04)
		],
		true
	);
	const strapGeo = new THREE.TubeGeometry(strapCurve, 28, 0.028, 6, true);
	const strapMesh = new THREE.Mesh(strapGeo, strapM);
	strapMesh.name = 'bagStrap';
	addAnimeOutline(strapMesh, 0.008, outlineM);
	// Crisp silver/cream strap adjuster buckle on chest strap
	const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.036, 0.036), creamM);
	buckle.position.set(0.04, 0.17, 0.212);
	buckle.rotation.z = -0.62;
	torsoGroup.add(strapMesh, buckle);

	// Sculpted Soft-Sided Messenger Pouch on left hip with iconic white clasp bar
	const bagGroup = new THREE.Group();
	bagGroup.position.set(-0.285, -0.16, 0.05);
	bagGroup.rotation.set(0.06, 0.26, 0.16);
	torsoGroup.add(bagGroup);

	const pouchGeo = createLoftedMeshGeometry(
		[
			{ y: -0.13, rx: 0.07, rz: 0.115 },
			{ y: -0.04, rx: 0.082, rz: 0.132 },
			{ y: 0.08, rx: 0.078, rz: 0.125 },
			{ y: 0.14, rx: 0.052, rz: 0.105 }
		],
		10,
		true,
		true
	);
	const bagMesh = new THREE.Mesh(pouchGeo, bagM);
	bagMesh.name = 'bagMesh';
	addAnimeOutline(bagMesh, 0.011, outlineM);

	const bagAccent = new THREE.Mesh(new THREE.BoxGeometry(0.164, 0.018, 0.24), creamM);
	bagAccent.position.y = -0.065;
	const bagClasp = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.022, 0.068), creamM);
	bagClasp.position.set(-0.076, -0.085, 0.055);
	bagGroup.add(bagMesh, bagAccent, bagClasp);

	const letter = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.14, 0.20), creamM);
	letter.name = 'carriedLetter';
	letter.position.set(0.015, 0.21, 0.0);
	letter.rotation.x = 0.18;
	letter.visible = false;
	bagGroup.add(letter);

	// 3. Sculpted Tapered 3/4 Jacket Sleeves + Forearms + Sculpted Anime Hands
	([-1, 1] as const).forEach((side, i) => {
		const arm = new THREE.Group();
		arm.name = i === 0 ? 'leftArm' : 'rightArm';
		// Positioned cleanly at outer shoulder edge and angled OUTWARD (side * +0.20!)
		arm.position.set(side * 0.285, 0.32, 0);
		arm.rotation.z = side * 0.20;

		// Continuous sloped shoulder -> elbow -> flared 3/4 cuff sleeve (no ball shoulder!)
		const sleeveGeo = createLoftedMeshGeometry(
			[
				{ y: -0.50, rx: 0.118, rz: 0.114, foldAmp: 0.04, foldFreq: 5 },
				{ y: -0.32, rx: 0.106, rz: 0.102 },
				{ y: -0.12, rx: 0.098, rz: 0.094 },
				{ y: 0.02, rx: 0.092, rz: 0.09 },
				{ y: 0.075, rx: 0.062, rz: 0.064 }
			],
			10,
			true,
			true
		);
		const sleeve = new THREE.Mesh(sleeveGeo, shirtM);
		sleeve.name = i === 0 ? 'shirtMeshArmL' : 'shirtMeshArmR';
		addAnimeOutline(sleeve, 0.012, outlineM);

		// Crisp cream cuff stripe hugging the sleeve flare
		const cuffGeo = createLoftedMeshGeometry(
			[
				{ y: -0.465, rx: 0.12, rz: 0.116 },
				{ y: -0.432, rx: 0.117, rz: 0.113 }
			],
			10,
			false,
			false
		);
		const cuffStripe = new THREE.Mesh(cuffGeo, creamM);

		// Tapered anatomical forearm/wrist
		const forearmGeo = createLoftedMeshGeometry(
			[
				{ y: -0.62, rx: 0.042, rz: 0.044 },
				{ y: -0.53, rx: 0.052, rz: 0.054 },
				{ y: -0.45, rx: 0.058, rz: 0.058 }
			],
			8,
			true,
			true
		);
		const forearm = new THREE.Mesh(forearmGeo, skinM);
		addAnimeOutline(forearm, 0.008, outlineM);

		// Sculpted anime hand with curved palm & thumb
		const hand = createSculptedHand(side, skinM, outlineM);
		hand.position.y = -0.615;

		arm.add(sleeve, cuffStripe, forearm, hand);
		torsoGroup.add(arm);
	});

	// 4. Sculpted Single-Piece Anime Head + Painted Anime Face + Swept Strand Hair
	const headGroup = new THREE.Group();
	headGroup.name = 'headGroup';
	headGroup.position.y = 0.72;
	torsoGroup.add(headGroup);

	const faceTexOpen = createAnimeFaceTexture(false);
	const faceTexBlink = createAnimeFaceTexture(true);
	const headMat = new THREE.MeshToonMaterial({
		color: 0xffffff,
		map: faceTexOpen,
		gradientMap: sharpGradient
	});

	const headGeo = createSculptedAnimeHeadGeometry();
	const headMesh = new THREE.Mesh(headGeo, headMat);
	headMesh.name = 'animeHeadMesh';
	headMesh.userData.faceTexOpen = faceTexOpen;
	headMesh.userData.faceTexBlink = faceTexBlink;
	addAnimeOutline(headMesh, 0.013, outlineM);
	headGroup.add(headMesh);

	// Lightweight blink tracker group (kept for animateChibi compatibility)
	const eyeBlinkGroup = new THREE.Group();
	eyeBlinkGroup.name = 'eyeBlinkGroup';
	headGroup.add(eyeBlinkGroup);

	// Sculpted Anime Ears tucked neatly behind jaw plane
	([-1, 1] as const).forEach((side) => {
		const earGeo = createLoftedMeshGeometry(
			[
				{ y: -0.05, rx: 0.022, rz: 0.03 },
				{ y: 0.0, rx: 0.032, rz: 0.045 },
				{ y: 0.05, rx: 0.026, rz: 0.038 }
			],
			8,
			true,
			true
		);
		const ear = new THREE.Mesh(earGeo, skinM);
		ear.position.set(side * 0.232, -0.025, -0.015);
		ear.rotation.z = side * -0.15;
		addAnimeOutline(ear, 0.008, outlineM);
		headGroup.add(ear);
	});

	// 5. Sculpted Layered Anime Hair (Snug Organic Cap + Swept Curved Fringe + Flared Nape Strands!)
	const hairCapGeo = new THREE.SphereGeometry(0.272, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56);
	const hcPos = hairCapGeo.attributes.position as THREE.BufferAttribute;
	for (let i = 0; i < hcPos.count; i++) {
		let x = hcPos.getX(i);
		let y = hcPos.getY(i);
		let z = hcPos.getZ(i);
		// Slight organic anime crown volume & subtle angular faceting
		const wave = 1 + Math.sin(Math.atan2(x, z) * 5) * 0.03;
		x *= 0.99 * wave;
		y *= 1.02;
		z *= 1.02 * wave;
		hcPos.setXYZ(i, x, y, z);
	}
	hairCapGeo.computeVertexNormals();

	const hairCrown = new THREE.Mesh(hairCapGeo, hairM);
	hairCrown.name = 'hatMeshDome';
	hairCrown.position.set(0, 0.055, -0.02);
	hairCrown.rotation.x = -0.34;
	addAnimeOutline(hairCrown, 0.012, outlineM);
	headGroup.add(hairCrown);

	// Sculpted back hair volume hugging behind skull
	const backHairGeo = createLoftedMeshGeometry(
		[
			{ y: -0.18, rx: 0.225, rz: 0.15, cz: -0.105, foldAmp: 0.06, foldFreq: 5 },
			{ y: -0.05, rx: 0.268, rz: 0.185, cz: -0.095, foldAmp: 0.04, foldFreq: 5 },
			{ y: 0.10, rx: 0.268, rz: 0.19, cz: -0.075 },
			{ y: 0.21, rx: 0.21, rz: 0.16, cz: -0.045 }
		],
		12,
		true,
		true
	);
	const backHair = new THREE.Mesh(backHairGeo, hairM);
	backHair.name = 'hatMeshBtn';
	addAnimeOutline(backHair, 0.012, outlineM);
	headGroup.add(backHair);

	// 7 Swept, Tapered Anime Forehead Bangs curving cleanly ABOVE the brows!
	const bangSpecs: Array<{ x0: number; x1: number; tipY: number; w: number; zOut: number }> = [
		{ x0: -0.19, x1: -0.21, tipY: 0.085, w: 0.052, zOut: 0.145 },
		{ x0: -0.125, x1: -0.135, tipY: 0.135, w: 0.058, zOut: 0.21 },
		{ x0: -0.055, x1: -0.062, tipY: 0.148, w: 0.06, zOut: 0.24 },
		{ x0: 0.01, x1: 0.018, tipY: 0.13, w: 0.062, zOut: 0.246 },
		{ x0: 0.078, x1: 0.09, tipY: 0.145, w: 0.058, zOut: 0.23 },
		{ x0: 0.14, x1: 0.158, tipY: 0.125, w: 0.054, zOut: 0.195 },
		{ x0: 0.195, x1: 0.215, tipY: 0.08, w: 0.05, zOut: 0.135 }
	];
	for (const b of bangSpecs) {
		const strandGeo = createHairStrandGeometry(
			[
				new THREE.Vector3(b.x0 * 0.72, 0.28, b.zOut * 0.45),
				new THREE.Vector3(b.x0, 0.21, b.zOut * 0.92),
				new THREE.Vector3(b.x1, b.tipY, b.zOut + 0.012)
			],
			b.w,
			0.036,
			6
		);
		const strand = new THREE.Mesh(strandGeo, hairM);
		strand.name = 'hatMeshDome';
		addAnimeOutline(strand, 0.011, outlineM);
		headGroup.add(strand);
	}

	// 6 Flared Spiky Anime Nape Tufts curving outward at the back/sides (iconic Messenger profile!)
	const napeSpecs: Array<{ x0: number; x1: number; z0: number; z1: number; y1: number; w: number }> = [
		{ x0: -0.23, x1: -0.31, z0: -0.09, z1: -0.15, y1: -0.17, w: 0.062 },
		{ x0: -0.15, x1: -0.22, z0: -0.18, z1: -0.29, y1: -0.21, w: 0.068 },
		{ x0: -0.05, x1: -0.08, z0: -0.22, z1: -0.33, y1: -0.22, w: 0.07 },
		{ x0: 0.05, x1: 0.08, z0: -0.22, z1: -0.33, y1: -0.22, w: 0.07 },
		{ x0: 0.15, x1: 0.22, z0: -0.18, z1: -0.29, y1: -0.21, w: 0.068 },
		{ x0: 0.23, x1: 0.31, z0: -0.09, z1: -0.15, y1: -0.17, w: 0.062 }
	];
	for (const n of napeSpecs) {
		const tuftGeo = createHairStrandGeometry(
			[
				new THREE.Vector3(n.x0 * 0.9, 0.05, n.z0 * 0.85),
				new THREE.Vector3(n.x0, -0.09, n.z0 * 1.05),
				new THREE.Vector3(n.x1, n.y1, n.z1)
			],
			n.w,
			0.042,
			6
		);
		const tuft = new THREE.Mesh(tuftGeo, hairM);
		tuft.name = 'hatMeshBtn';
		addAnimeOutline(tuft, 0.011, outlineM);
		headGroup.add(tuft);
	}

	// Style A: Shaggy Messenger Bob (swept curved side-locks framing ears)
	const styleBob = new THREE.Group();
	styleBob.name = 'style-bob';
	([-1, 1] as const).forEach((side) => {
		const lockGeo = createHairStrandGeometry(
			[
				new THREE.Vector3(side * 0.235, 0.12, 0.04),
				new THREE.Vector3(side * 0.275, -0.02, 0.025),
				new THREE.Vector3(side * 0.245, -0.16, 0.065)
			],
			0.058,
			0.036,
			6
		);
		const lock = new THREE.Mesh(lockGeo, hairM);
		lock.name = 'hatMeshDome';
		addAnimeOutline(lock, 0.01, outlineM);
		styleBob.add(lock);
	});
	headGroup.add(styleBob);

	// Style B: Twin Anime Hair Buns with Gold Ribbons
	const styleBuns = new THREE.Group();
	styleBuns.name = 'style-buns';
	([-1, 1] as const).forEach((side) => {
		const bunGeo = createLoftedMeshGeometry(
			[
				{ y: -0.11, rx: 0.09, rz: 0.09 },
				{ y: 0.0, rx: 0.135, rz: 0.135, foldAmp: 0.06, foldFreq: 5 },
				{ y: 0.11, rx: 0.08, rz: 0.08 }
			],
			10,
			true,
			true
		);
		const bun = new THREE.Mesh(bunGeo, hairM);
		bun.name = 'hatMeshBtn';
		bun.position.set(side * 0.255, 0.23, -0.06);
		addAnimeOutline(bun, 0.011, outlineM);
		const tie = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.022, 6, 12), goldM);
		tie.position.set(side * 0.22, 0.195, -0.05);
		tie.rotation.y = side * -0.7;
		styleBuns.add(bun, tie);
	});
	styleBuns.visible = false;
	headGroup.add(styleBuns);

	// Style C: Stylish Sculpted Mailman Cap
	const styleCap = new THREE.Group();
	styleCap.name = 'style-cap';
	const capTop = new THREE.Mesh(
		new THREE.SphereGeometry(0.315, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
		shirtM
	);
	capTop.position.set(0, 0.115, -0.01);
	addAnimeOutline(capTop, 0.012, outlineM);
	const brim = new THREE.Mesh(new THREE.SphereGeometry(0.245, 12, 8), shirtM);
	brim.name = 'hatMeshVisor';
	brim.scale.set(1.06, 0.11, 0.88);
	brim.position.set(0, 0.185, 0.235);
	brim.rotation.x = 0.08;
	addAnimeOutline(brim, 0.01, outlineM);
	const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 6), goldM);
	badge.rotation.x = Math.PI / 2;
	badge.position.set(0, 0.255, 0.305);
	styleCap.add(capTop, brim, badge);
	styleCap.visible = false;
	headGroup.add(styleCap);

	// Style D: Iconic Abeto Cream-White Over-Ear Headphones (matches final_step_356.png!)
	const styleHeadphones = new THREE.Group();
	styleHeadphones.name = 'style-headphones';
	const band = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.032, 6, 18, Math.PI), creamM);
	band.position.y = 0.07;
	addAnimeOutline(band, 0.01, outlineM);
	([-1, 1] as const).forEach((side) => {
		const cupOuter = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), creamM);
		cupOuter.scale.set(0.55, 1.18, 0.92);
		cupOuter.position.set(side * 0.295, -0.01, -0.01);
		addAnimeOutline(cupOuter, 0.01, outlineM);
		const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.035, 10), strapM);
		pad.rotation.z = Math.PI / 2;
		pad.position.set(side * 0.262, -0.01, -0.01);
		styleHeadphones.add(cupOuter, pad);
	});
	styleHeadphones.add(band);
	styleHeadphones.visible = false;
	headGroup.add(styleHeadphones);

	// Style E: Sculpted Explorer Straw Hat w/ Sage Ribbon
	const styleStraw = new THREE.Group();
	styleStraw.name = 'style-strawhat';
	const strawBrimGeo = createLoftedMeshGeometry(
		[
			{ y: 0.20, rx: 0.50, rz: 0.52, foldAmp: 0.025, foldFreq: 4 },
			{ y: 0.235, rx: 0.31, rz: 0.32 }
		],
		16,
		false,
		true
	);
	const strawBrim = new THREE.Mesh(strawBrimGeo, strawM);
	addAnimeOutline(strawBrim, 0.011, outlineM);
	const strawCrownGeo = createLoftedMeshGeometry(
		[
			{ y: 0.23, rx: 0.305, rz: 0.315 },
			{ y: 0.39, rx: 0.235, rz: 0.245 },
			{ y: 0.44, rx: 0.16, rz: 0.17 }
		],
		14,
		true,
		false
	);
	const strawCrown = new THREE.Mesh(strawCrownGeo, strawM);
	addAnimeOutline(strawCrown, 0.011, outlineM);
	const strawBand = new THREE.Mesh(new THREE.CylinderGeometry(0.298, 0.312, 0.058, 14), ribbonM);
	strawBand.position.set(0, 0.26, 0);
	styleStraw.add(strawBrim, strawCrown, strawBand);
	styleStraw.visible = false;
	headGroup.add(styleStraw);

	// Apply initial style visibility
	(['bob', 'buns', 'cap', 'headphones', 'strawhat'] as HairStyle[]).forEach((s) => {
		const node = root.getObjectByName(`style-${s}`);
		if (node) node.visible = s === (opts.hairStyle ?? 'bob');
	});
	const topStyle = opts.topStyle ?? 'coat';
	coatDetails.visible = topStyle === 'coat';
	teeDetails.visible = topStyle === 'tee';

	return root;
}

/**
 * Syncs natural blinking on the painted anime face texture (zero GC, instant swap).
 */
export function updateAnimeFaceBlink(grp: THREE.Group, isBlinking: boolean): void {
	const headMesh = grp.getObjectByName('animeHeadMesh') as THREE.Mesh | undefined;
	if (!headMesh) return;
	const mat = headMesh.material as THREE.MeshToonMaterial;
	const targetTex = isBlinking
		? (headMesh.userData.faceTexBlink as THREE.Texture | undefined)
		: (headMesh.userData.faceTexOpen as THREE.Texture | undefined);
	if (targetTex && mat.map !== targetTex) {
		mat.map = targetTex;
		mat.needsUpdate = true;
	}
}

export type { EmoteAction };
