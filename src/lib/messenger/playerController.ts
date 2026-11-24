import * as THREE from 'three';
import { inkDisplayOutput } from './animeInkPass';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface QuestStop {
	id: string;
	name: string;
	landmark: string;
	dir: THREE.Vector3;
	pickupLine: string;
	deliverLine: string;
}

export const PLANET_QUEST_STOPS: QuestStop[] = [
	{
		id: 'town-post',
		name: 'Postmaster Ben',
		landmark: 'Town Post Office',
		dir: new THREE.Vector3(0.18, 0.92, 0.34).normalize(),
		pickupLine: 'Morning, courier! Here is a fresh parcel—follow the golden arrow around the planet!',
		deliverLine: 'All parcels delivered! Ready for another relaxing loop around the world?'
	},
	{
		id: 'cliff-lookout',
		name: 'Gardener Hana',
		landmark: 'Cliffside Garden',
		dir: new THREE.Vector3(-0.62, 0.68, 0.39).normalize(),
		pickupLine: '',
		deliverLine: 'My rare moon-tulip seeds arrived! Thank you so much, little messenger! 🌱✨'
	},
	{
		id: 'waterfall-cove',
		name: 'Poet Sora',
		landmark: 'Waterfall Overlook',
		dir: new THREE.Vector3(0.78, 0.12, -0.61).normalize(),
		pickupLine: '',
		deliverLine: 'Fresh ink by the waterfall! Listen to the breeze and lo-fi chords... 🎵💧'
	},
	{
		id: 'harbor-town',
		name: 'Baker Mochi',
		landmark: 'Harbor Street Café',
		dir: new THREE.Vector3(-0.48, -0.66, 0.58).normalize(),
		pickupLine: '',
		deliverLine: 'Right on time for the afternoon pastries! Have a warm wave! 🥐❤️'
	},
	{
		id: 'south-observatory',
		name: 'Engineer Tesla',
		landmark: 'Southern Hilltop',
		dir: new THREE.Vector3(0.32, -0.84, -0.44).normalize(),
		pickupLine: '',
		deliverLine: 'Brilliant delivery all the way to the southern hemisphere! ⚡🎉'
	}
];

/** Official Messenger OST (Kevin Colombin - Messenger Soundtrack) & Cozy SFX */
export class CozyLoFiAudio {
	private ctx: AudioContext | null = null;
	private master: GainNode | null = null;
	private bgMusic: HTMLAudioElement | null = null;
	public muted = false;

	init() {
		// Initialize Web Audio context for SFX
		if (!this.ctx) {
			const AC =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (AC) {
				this.ctx = new AC();
				this.master = this.ctx.createGain();
				this.master.gain.value = this.muted ? 0 : 0.65;
				this.master.connect(this.ctx.destination);
			}
		} else if (this.ctx.state === 'suspended') {
			void this.ctx.resume();
		}

		// Initialize & play official Messenger OST (Kevin Colombin - 9HMrI83HoHU)
		if (!this.bgMusic) {
			const audio = new Audio('/messenger/audio/music/bgmusic-highq.ogg');
			audio.loop = true;
			audio.volume = this.muted ? 0 : 0.48;
			this.bgMusic = audio;
			if (!this.muted) {
				audio.play().catch(() => {});
			}
		} else if (!this.muted && this.bgMusic.paused) {
			this.bgMusic.volume = 0.48;
			this.bgMusic.play().catch(() => {});
		}
	}

	setMuted(m: boolean) {
		this.muted = m;
		if (this.bgMusic) {
			this.bgMusic.muted = m;
			if (m) {
				this.bgMusic.pause();
			} else {
				this.bgMusic.volume = 0.48;
				this.bgMusic.play().catch(() => {});
			}
		}
		if (this.master && this.ctx) {
			this.master.gain.setTargetAtTime(m ? 0 : 0.65, this.ctx.currentTime, 0.08);
		}
	}

	dispose() {
		if (this.bgMusic) {
			this.bgMusic.pause();
			this.bgMusic.src = '';
			this.bgMusic = null;
		}
		if (this.ctx) {
			void this.ctx.close();
			this.ctx = null;
		}
	}

	playJump() {
		if (!this.ctx || !this.master || this.muted) return;
		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const g = this.ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(270, now);
		osc.frequency.exponentialRampToValueAtTime(530, now + 0.13);
		g.gain.setValueAtTime(0.12, now);
		g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
		osc.connect(g).connect(this.master);
		osc.start(now);
		osc.stop(now + 0.16);
	}

	playStep() {
		if (!this.ctx || !this.master || this.muted) return;
		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const g = this.ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(130 + Math.random() * 25, now);
		osc.frequency.exponentialRampToValueAtTime(65, now + 0.05);
		g.gain.setValueAtTime(0.05, now);
		g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
		osc.connect(g).connect(this.master);
		osc.start(now);
		osc.stop(now + 0.06);
	}

	playEmote() {
		if (!this.ctx || !this.master || this.muted) return;
		const now = this.ctx.currentTime;
		[587.33, 880].forEach((f, i) => {
			if (!this.ctx || !this.master) return;
			const osc = this.ctx.createOscillator();
			const g = this.ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(f, now + i * 0.055);
			g.gain.setValueAtTime(0.09, now + i * 0.055);
			g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.14);
			osc.connect(g).connect(this.master);
			osc.start(now + i * 0.055);
			osc.stop(now + i * 0.055 + 0.15);
		});
	}

	playDeliver() {
		if (!this.ctx || !this.master || this.muted) return;
		const now = this.ctx.currentTime;
		[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
			if (!this.ctx || !this.master) return;
			const osc = this.ctx.createOscillator();
			const g = this.ctx.createGain();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(f, now + i * 0.075);
			g.gain.setValueAtTime(0.12, now + i * 0.075);
			g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.075 + 0.34);
			osc.connect(g).connect(this.master);
			osc.start(now + i * 0.075);
			osc.stop(now + i * 0.075 + 0.36);
		});
	}
}

/** 3-Step Cel-Shading Gradient Map */
export function createToonGradient(): THREE.DataTexture {
	const data = new Uint8Array([125, 135, 152, 255, 204, 210, 214, 255, 255, 255, 255, 255]);
	const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
	tex.minFilter = THREE.NearestFilter;
	tex.magFilter = THREE.NearestFilter;
	tex.needsUpdate = true;
	return tex;
}

/** Soft Radial Drop-Shadow Disc */
export function createSoftDropShadow(radius = 0.35): THREE.Mesh {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
		grad.addColorStop(0, 'rgba(20, 32, 38, 0.56)');
		grad.addColorStop(0.55, 'rgba(20, 32, 38, 0.24)');
		grad.addColorStop(1, 'rgba(20, 32, 38, 0.0)');
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, 64, 64);
	}
	const tex = new THREE.CanvasTexture(canvas);
	const disc = new THREE.Mesh(
		new THREE.CircleGeometry(radius, 20),
		new THREE.MeshBasicMaterial({
			map: tex,
			transparent: true,
			opacity: 0.9,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -2
		})
	);
	disc.rotation.x = -Math.PI / 2;
	disc.position.y = 0.02;
	return disc;
}

/** Vibrant Peach-to-Cerulean Pastel Sky Dome + Fluffy Drifting 3D Clouds + Stars */
export function createAtmosphereRig(scene: THREE.Scene, toonGradient: THREE.DataTexture) {
	const skyMat = new THREE.ShaderMaterial({
		side: THREE.BackSide,
		depthWrite: false,
		fog: false,
		uniforms: {
			uLocalUp: { value: new THREE.Vector3(0, 1, 0) },
			uTime: { value: 0 },
			uInkDisplayOutput: inkDisplayOutput,
			topColor: { value: new THREE.Color(0x2fa7a6) },
			midColor: { value: new THREE.Color(0x5cc7bd) },
			horizonColor: { value: new THREE.Color(0xa9e4d6) },
			cloudLight: { value: new THREE.Color(0xc6f0e4) },
			cloudShade: { value: new THREE.Color(0x86d6c8) }
		},
		vertexShader: `
			varying vec3 vDir;
			void main() {
				vDir = normalize(position);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: `
			uniform vec3 uLocalUp;
			uniform float uTime;
			uniform float uInkDisplayOutput;
			uniform vec3 topColor;
			uniform vec3 midColor;
			uniform vec3 horizonColor;
			uniform vec3 cloudLight;
			uniform vec3 cloudShade;
			varying vec3 vDir;

			float hash3(vec3 p) {
				p = fract(p * 0.3183099 + 0.1);
				p *= 17.0;
				return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
			}
			float noise3(vec3 x) {
				vec3 i = floor(x);
				vec3 f = fract(x);
				f = f * f * (3.0 - 2.0 * f);
				return mix(mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
				               mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
				           mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
				               mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
			}
			float fbm(vec3 p) {
				float v = 0.0;
				float a = 0.5;
				for (int i = 0; i < 5; i++) {
					v += a * noise3(p);
					p = p * 2.03 + vec3(1.7, 9.2, 3.1);
					a *= 0.5;
				}
				return v;
			}

			void main() {
				vec3 d = normalize(vDir);
				float elev = dot(d, normalize(uLocalUp));
				vec3 col = mix(horizonColor, midColor, smoothstep(-0.25, 0.15, elev));
				col = mix(col, topColor, smoothstep(0.12, 0.6, elev));

				// Painterly anime clouds: stretched brush-stroke fbm, cut into flat cel tones
				vec3 p = d * vec3(2.2, 3.4, 2.2) + vec3(uTime * 0.012, 0.0, uTime * 0.006);
				float n = fbm(p + fbm(p * 1.7) * 0.6);
				float cloud = smoothstep(0.50, 0.53, n);
				float cloudCore = smoothstep(0.60, 0.63, n);
				// Lit rim on the upper side of each cloud (sun from above)
				float rim = smoothstep(0.50, 0.53, fbm(p + vec3(0.0, -0.06, 0.0) + fbm(p * 1.7) * 0.6));
				vec3 cc = mix(cloudShade, cloudLight, cloudCore);
				cc = mix(cc, cloudLight * 1.06, (1.0 - rim) * cloud * 0.6);
				col = mix(col, cc, cloud);

				gl_FragColor = vec4(col, 1.0);
				#include <colorspace_fragment>
				if (uInkDisplayOutput > 0.5) gl_FragColor = sRGBTransferOETF(gl_FragColor);
			}
		`
	});
	const skyDome = new THREE.Mesh(new THREE.SphereGeometry(180, 28, 18), skyMat);
	scene.add(skyDome);

	// Twinkling stars (bright at night)
	const starPts = new Float32Array(260 * 3);
	for (let i = 0; i < 260; i++) {
		const th = Math.random() * Math.PI * 2;
		const ph = Math.acos(2 * Math.random() - 1);
		starPts[i * 3] = 150 * Math.sin(ph) * Math.cos(th);
		starPts[i * 3 + 1] = 150 * Math.cos(ph);
		starPts[i * 3 + 2] = 150 * Math.sin(ph) * Math.sin(th);
	}
	const starGeo = new THREE.BufferGeometry();
	starGeo.setAttribute('position', new THREE.BufferAttribute(starPts, 3));
	const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, transparent: true, opacity: 0.1 });
	const stars = new THREE.Points(starGeo, starMat);
	scene.add(stars);

	// 14 Fluffy 3D Clouds orbiting the Gameplay planet (fitted radius ~9 -> clouds at ~14)
	const cloudRing = new THREE.Group();
	const cloudMat = new THREE.MeshToonMaterial({ color: 0xfffdf8, gradientMap: toonGradient });
	const up = new THREE.Vector3(0, 1, 0);
	for (let i = 0; i < 14; i++) {
		const cg = new THREE.Group();
		const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), cloudMat);
		const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 8), cloudMat);
		s2.position.set(0.7, -0.1, 0.08);
		const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), cloudMat);
		s3.position.set(-0.65, -0.1, -0.06);
		cg.add(s1, s2, s3);
		cg.scale.set(1.25, 0.65, 0.9);
		const a = (i / 14) * Math.PI * 2;
		const lat = ((i % 3) - 1) * 0.55;
		const dir = new THREE.Vector3(Math.cos(a) * Math.cos(lat), Math.sin(lat), Math.sin(a) * Math.cos(lat)).normalize();
		cg.position.copy(dir).multiplyScalar(13.8 + (i % 3) * 1.4);
		cg.quaternion.setFromUnitVectors(up, dir);
		cloudRing.add(cg);
	}
	scene.add(cloudRing);

	const applyTime = (mode: TimeOfDay, sun: THREE.DirectionalLight, ambient: THREE.AmbientLight) => {
		if (mode === 'day') {
			skyMat.uniforms.topColor.value.setHex(0x2fa7a6);
			skyMat.uniforms.midColor.value.setHex(0x5cc7bd);
			skyMat.uniforms.horizonColor.value.setHex(0xa9e4d6);
			skyMat.uniforms.cloudLight.value.setHex(0xc6f0e4);
			skyMat.uniforms.cloudShade.value.setHex(0x86d6c8);
			sun.color.setHex(0xfff1dc);
			sun.intensity = 1.55;
			ambient.intensity = 0.82;
			starMat.opacity = 0.08;
			cloudMat.color.setHex(0xf2fbf7);
		} else if (mode === 'sunset') {
			skyMat.uniforms.topColor.value.setHex(0x3b2d68);
			skyMat.uniforms.midColor.value.setHex(0xf08556);
			skyMat.uniforms.horizonColor.value.setHex(0xffe4a0);
			skyMat.uniforms.cloudLight.value.setHex(0xffd6b0);
			skyMat.uniforms.cloudShade.value.setHex(0xd9806a);
			sun.color.setHex(0xffa45b);
			sun.intensity = 1.8;
			ambient.intensity = 0.68;
			starMat.opacity = 0.45;
			cloudMat.color.setHex(0xffe7d1);
		} else {
			skyMat.uniforms.topColor.value.setHex(0x0b1026);
			skyMat.uniforms.midColor.value.setHex(0x1e254d);
			skyMat.uniforms.horizonColor.value.setHex(0x3b4880);
			skyMat.uniforms.cloudLight.value.setHex(0x4a5690);
			skyMat.uniforms.cloudShade.value.setHex(0x2b3463);
			sun.color.setHex(0xa5c8ff);
			sun.intensity = 0.9;
			ambient.intensity = 0.48;
			starMat.opacity = 0.95;
			cloudMat.color.setHex(0x475569);
		}
	};

	return { skyMat, cloudRing, stars, applyTime };
}

/** Smooth Organic Chibi Courier Character (scaled for Gameplay planet radius ~9 -> height ~0.72 units) */
export function buildChibiCourier(
	toonGradient: THREE.DataTexture,
	opts: { hatColor: number; shirtColor: number; bagColor: number; scarfColor?: number }
): THREE.Group {
	const root = new THREE.Group();
	const bodyRoot = new THREE.Group();
	bodyRoot.name = 'bodyRoot';
	bodyRoot.scale.setScalar(0.135); // True alley-walkable human proportion on Gameplay planet!
	root.add(bodyRoot);

	const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient });
	const skinM = toon(0xfde2c8);
	const shirtM = toon(opts.shirtColor);
	const hatM = toon(opts.hatColor);
	const bagM = toon(opts.bagColor);
	const bagFlapM = toon(new THREE.Color(opts.bagColor).multiplyScalar(0.84).getHex());
	const pantsM = toon(0x2d3748);
	const shoeM = toon(0x5c3d2e);
	const scarfM = toon(opts.scarfColor ?? 0xf5bd33);
	const brassM = toon(0xf5bd33);
	const whiteM = toon(0xfffdf7);

	// Rounded Legs & Shoes
	const legGeo = new THREE.CapsuleGeometry(0.115, 0.16, 8, 12);
	const shoeGeo = new THREE.SphereGeometry(0.145, 12, 10);
	([-0.18, 0.18] as const).forEach((lx, i) => {
		const leg = new THREE.Group();
		leg.name = i === 0 ? 'leftLeg' : 'rightLeg';
		leg.position.set(lx, 0.44, 0);
		const lm = new THREE.Mesh(legGeo, pantsM);
		lm.position.y = -0.14;
		const sm = new THREE.Mesh(shoeGeo, shoeM);
		sm.scale.set(1.02, 0.7, 1.38);
		sm.position.set(0, -0.34, 0.06);
		leg.add(lm, sm);
		bodyRoot.add(leg);
	});

	// Chubby Pear Torso
	const torsoGroup = new THREE.Group();
	torsoGroup.name = 'torsoGroup';
	torsoGroup.position.y = 0.82;
	bodyRoot.add(torsoGroup);

	const torso = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), shirtM);
	torso.name = 'shirtMesh';
	torso.scale.set(1.04, 1.2, 0.96);
	torsoGroup.add(torso);

	const hem = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.065, 8, 16), shirtM);
	hem.name = 'shirtMeshHem';
	hem.rotation.x = Math.PI / 2;
	hem.position.y = -0.26;
	torsoGroup.add(hem);

	// Cross-body strap + Brass buckle + Rounded leather satchel
	const strap = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.042, 8, 20), bagFlapM);
	strap.name = 'bagStrap';
	strap.scale.set(1.02, 1.15, 0.98);
	strap.rotation.y = Math.PI * 0.45;
	strap.rotation.x = 0.52;
	strap.position.y = 0.04;
	torsoGroup.add(strap);

	const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.022, 8, 12), brassM);
	buckle.position.set(0.04, 0.08, 0.35);
	buckle.rotation.z = 0.55;
	torsoGroup.add(buckle);

	const bagGroup = new THREE.Group();
	bagGroup.position.set(-0.39, -0.04, -0.04);
	bagGroup.rotation.z = 0.16;
	torsoGroup.add(bagGroup);

	const bagMesh = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), bagM);
	bagMesh.name = 'bagMesh';
	bagMesh.scale.set(0.62, 0.96, 1.22);
	bagGroup.add(bagMesh);

	const letter = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.12, 6, 10), whiteM);
	letter.name = 'carriedLetter';
	letter.scale.set(0.32, 1.0, 1.25);
	letter.position.set(-0.02, 0.24, 0.02);
	letter.rotation.z = 0.22;
	letter.visible = false;
	bagGroup.add(letter);

	// 3-Segment Flowing Scarf
	const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.105, 8, 16), scarfM);
	scarfRing.rotation.x = Math.PI / 2;
	scarfRing.position.y = 0.38;
	torsoGroup.add(scarfRing);

	const s1 = new THREE.Group();
	s1.name = 'scarfSeg1';
	s1.position.set(0.08, 0.36, -0.26);
	const m1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.22, 6, 10), scarfM);
	m1.rotation.x = Math.PI / 2;
	m1.scale.set(1.25, 1, 0.65);
	m1.position.z = -0.14;
	s1.add(m1);
	torsoGroup.add(s1);

	const s2 = new THREE.Group();
	s2.name = 'scarfSeg2';
	s2.position.set(0, 0, -0.28);
	const m2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.2, 6, 10), scarfM);
	m2.rotation.x = Math.PI / 2;
	m2.scale.set(1.2, 1, 0.62);
	m2.position.z = -0.13;
	s2.add(m2);
	s1.add(s2);

	const s3 = new THREE.Group();
	s3.name = 'scarfSeg3';
	s3.position.set(0, 0, -0.25);
	const m3 = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.16, 6, 10), scarfM);
	m3.rotation.x = Math.PI / 2;
	m3.scale.set(1.15, 1, 0.58);
	m3.position.z = -0.11;
	s3.add(m3);
	s2.add(s3);

	// Rounded Arms
	const armGeo = new THREE.CapsuleGeometry(0.095, 0.24, 6, 10);
	const handGeo = new THREE.SphereGeometry(0.095, 8, 8);
	([-0.4, 0.4] as const).forEach((ax, i) => {
		const arm = new THREE.Group();
		arm.name = i === 0 ? 'leftArm' : 'rightArm';
		arm.position.set(ax, 0.24, 0);
		const am = new THREE.Mesh(armGeo, shirtM);
		am.name = i === 0 ? 'shirtMeshArmL' : 'shirtMeshArmR';
		am.position.y = -0.15;
		const hm = new THREE.Mesh(handGeo, skinM);
		hm.position.y = -0.33;
		arm.add(am, hm);
		torsoGroup.add(arm);
	});

	// Oversized Chibi Head + Oval Eyes + Rosy Cheeks + Curved-Brim Cap
	const headGroup = new THREE.Group();
	headGroup.name = 'headGroup';
	headGroup.position.y = 0.72;
	torsoGroup.add(headGroup);

	const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 14), skinM);
	head.scale.set(1.06, 0.96, 1.02);
	headGroup.add(head);

	const eyeM = new THREE.MeshBasicMaterial({ color: 0x1a2026 });
	const catchM = new THREE.MeshBasicMaterial({ color: 0xffffff });
	const blushM = new THREE.MeshBasicMaterial({ color: 0xfda4af, transparent: true, opacity: 0.75 });
	([-0.145, 0.145] as const).forEach((ex) => {
		const eye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), eyeM);
		eye.scale.set(0.85, 1.28, 0.55);
		eye.position.set(ex, 0.03, 0.385);
		const gl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), catchM);
		gl.position.set(ex + 0.016, 0.058, 0.412);
		headGroup.add(eye, gl);
	});
	([-0.245, 0.245] as const).forEach((bx) => {
		const b = new THREE.Mesh(new THREE.CircleGeometry(0.068, 12), blushM);
		b.scale.set(1.25, 0.75, 1);
		b.position.set(bx, -0.06, 0.365);
		b.rotation.y = bx < 0 ? -0.45 : 0.45;
		headGroup.add(b);
	});

	const capDome = new THREE.Mesh(
		new THREE.SphereGeometry(0.455, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
		hatM
	);
	capDome.name = 'hatMeshDome';
	capDome.scale.set(1.06, 0.96, 1.08);
	capDome.position.set(0, 0.07, -0.02);
	capDome.rotation.x = -0.18;

	const capBtn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), hatM);
	capBtn.name = 'hatMeshBtn';
	capBtn.position.set(0, 0.5, -0.09);

	const brim = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 8), hatM);
	brim.name = 'hatMeshVisor';
	brim.scale.set(1.12, 0.14, 0.92);
	brim.position.set(0, 0.17, 0.31);
	brim.rotation.x = 0.16;

	const capBadge = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), brassM);
	capBadge.scale.set(1.25, 0.9, 0.5);
	capBadge.position.set(0, 0.29, 0.43);

	headGroup.add(capDome, capBtn, brim, capBadge);
	return root;
}

/** Lively Bouncy Walk Cycle + Idle Breathing + 3-Segment Flowing Scarf Animation */
export function animateChibi(
	grp: THREE.Group,
	opts: { t: number; phase?: number; moving: boolean; sprinting?: boolean; jumpH?: number; jumpHeld?: boolean; squash?: number }
) {
	const { t, phase = 0, moving, sprinting = false, jumpH = 0, jumpHeld = false, squash = 1 } = opts;
	const body = grp.getObjectByName('bodyRoot');
	const torso = grp.getObjectByName('torsoGroup');
	const head = grp.getObjectByName('headGroup');
	const ll = grp.getObjectByName('leftLeg');
	const rl = grp.getObjectByName('rightLeg');
	const la = grp.getObjectByName('leftArm');
	const ra = grp.getObjectByName('rightArm');
	const s1 = grp.getObjectByName('scarfSeg1');
	const s2 = grp.getObjectByName('scarfSeg2');
	const s3 = grp.getObjectByName('scarfSeg3');

	const freq = sprinting ? 13.5 : 9.5;
	const breath = Math.sin(t * 2.6 + phase);
	const invSq = 1 / Math.sqrt(squash);

	if (body) {
		body.scale.set(0.135 * invSq, 0.135 * squash, 0.135 * invSq);
		if (moving && jumpH < 0.02) {
			body.position.y = Math.abs(Math.sin(t * freq + phase)) * 0.024;
			body.rotation.z = Math.sin(t * freq + phase) * 0.085;
		} else {
			body.position.y *= 0.85;
			body.rotation.z *= 0.85;
		}
	}
	if (torso) {
		const bs = 1 + breath * 0.026;
		torso.scale.set(bs, 1 - breath * 0.018, bs);
	}
	if (head) {
		head.rotation.z = moving ? -Math.sin(t * freq + phase) * 0.09 : Math.sin(t * 1.4 + phase) * 0.07;
		head.rotation.x = moving ? 0.06 : Math.sin(t * 2.1 + phase) * 0.04;
	}
	const swing = moving ? Math.sin(t * freq + phase) * (sprinting ? 0.82 : 0.58) : 0;
	if (ll && rl) {
		ll.rotation.x += (swing - ll.rotation.x) * 0.3;
		rl.rotation.x += (-swing - rl.rotation.x) * 0.3;
	}
	if (la && ra) {
		const glideRaise = jumpH > 0.15 && jumpHeld ? 2.15 : 0;
		la.rotation.z += (-glideRaise - 0.12 - la.rotation.z) * 0.22;
		ra.rotation.z += (glideRaise + 0.12 - ra.rotation.z) * 0.22;
		la.rotation.x += (-swing * 0.9 - la.rotation.x) * 0.3;
		ra.rotation.x += (swing * 0.9 - ra.rotation.x) * 0.3;
	}
	const scSpeed = moving ? (sprinting ? 14 : 10) : 3.2;
	const scAmp = moving ? (sprinting ? 0.28 : 0.2) : 0.09;
	const lift = moving ? (sprinting ? 0.35 : 0.2) : -0.18;
	if (s1) {
		s1.rotation.x = lift + Math.sin(t * scSpeed + phase) * scAmp;
		s1.rotation.y = Math.cos(t * scSpeed * 0.7 + phase) * scAmp * 0.7;
	}
	if (s2) {
		s2.rotation.x = Math.sin(t * scSpeed - 0.9 + phase) * scAmp * 1.25;
	}
	if (s3) {
		s3.rotation.x = Math.sin(t * scSpeed - 1.8 + phase) * scAmp * 1.5;
	}
}
