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

/** Soft Sun-Washed 3-Step Anime Cel-Shading Gradient Map (airy shadows like Abeto Messenger!) */
export function createToonGradient(): THREE.DataTexture {
	const data = new Uint8Array([186, 192, 206, 255, 224, 228, 234, 255, 255, 255, 255, 255]);
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

export type HairStyle = 'bob' | 'buns' | 'cap' | 'headphones';

/**
 * High-Detail Sculpted Anime Courier Character modeled closely on Messenger by Abeto:
 *  - Layered shaggy anime hair (5 jagged bangs + flipped nape tufts) & sculpted anime jawline/nose/eyes
 *  - Flared A-line red button-up coat with cream-white folded lapel collar (+ red stripe),
 *    2 pointed cream chest pocket flaps w/ buttons, 4 front buttons, white cuff & hem stripes
 *  - Matte charcoal crossbody strap & hip pouch with white accent stripe
 *  - Wide-leg dark cropped shorts, cream crew socks, and chunky black high-top sneakers w/ white stripes
 */
export function buildChibiCourier(
	toonGradient: THREE.DataTexture,
	opts: { hatColor: number; shirtColor: number; bagColor: number; scarfColor?: number; hairStyle?: HairStyle }
): THREE.Group {
	const root = new THREE.Group();
	const bodyRoot = new THREE.Group();
	bodyRoot.name = 'bodyRoot';
	bodyRoot.scale.setScalar(0.132); // True street-level anime teen height matching Abeto NPCs
	root.add(bodyRoot);

	const toon = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient });
	const skinM = toon(0xeccac0);
	const shirtM = toon(opts.shirtColor);
	const hairM = toon(opts.hatColor);
	const bagM = toon(opts.bagColor);
	const strapM = toon(0x1f252c);
	const pantsM = toon(0x1e242b);
	const sockM = toon(0xf2eee4);
	const shoeM = toon(0x1c2128);
	const creamM = toon(0xf5f1e6);
	const goldM = toon(0xf5bd33);
	const darkInkM = new THREE.MeshBasicMaterial({ color: 0x161c22 });

	// 1. Wide-Leg Cropped Shorts + Slim Calves + Cream Crew Socks + Chunky High-Top Sneakers w/ White Stripes
	([-0.138, 0.138] as const).forEach((lx, i) => {
		const leg = new THREE.Group();
		leg.name = i === 0 ? 'leftLeg' : 'rightLeg';
		leg.position.set(lx, 1.06, 0);

		// Wide flared culotte pant leg
		const pant = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.165, 0.60, 12), pantsM);
		pant.scale.set(1.0, 1.0, 0.92);
		pant.position.y = -0.28;
		leg.add(pant);

		const shin = new THREE.Group();
		shin.name = i === 0 ? 'leftShin' : 'rightShin';
		shin.position.y = -0.55;
		leg.add(shin);

		const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.21, 6, 10), skinM);
		calf.position.y = -0.12;
		shin.add(calf);

		// Cream crew sock
		const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.062, 0.13, 10), sockM);
		sock.position.y = -0.26;
		shin.add(sock);

		// Chunky high-top black anime sneaker
		const collarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.088, 0.13, 10), shoeM);
		collarTop.position.set(0, -0.35, 0.01);
		const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.13, 6, 10), shoeM);
		foot.rotation.x = Math.PI / 2;
		foot.scale.set(0.96, 1.15, 0.82);
		foot.position.set(0, -0.42, 0.055);
		const sole = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.038, 0.27), darkInkM);
		sole.position.set(0, -0.475, 0.055);

		// Two crisp white diagonal sneaker stripes (front laces + outer side)
		const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 0.02), creamM);
		stripe1.position.set(0, -0.39, 0.15);
		const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 0.02), creamM);
		stripe2.position.set(0, -0.425, 0.162);
		const sideX = i === 0 ? -0.082 : 0.082;
		const sideStripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.065, 0.022), creamM);
		sideStripe1.position.set(sideX, -0.415, 0.05);
		sideStripe1.rotation.x = 0.35;
		const sideStripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.065, 0.022), creamM);
		sideStripe2.position.set(sideX, -0.415, 0.005);
		sideStripe2.rotation.x = 0.35;

		shin.add(collarTop, foot, sole, stripe1, stripe2, sideStripe1, sideStripe2);
		bodyRoot.add(leg);
	});

	// 2. Iconic Flared A-Line Red Messenger Coat + Cream Folded Collar + Pocket Flaps + Buttons
	const torsoGroup = new THREE.Group();
	torsoGroup.name = 'torsoGroup';
	torsoGroup.position.y = 1.48;
	bodyRoot.add(torsoGroup);

	// Flared A-line coat body (narrower at shoulders, gently flared at bottom hem)
	const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.335, 0.82, 16), shirtM);
	coat.name = 'shirtMesh';
	coat.scale.set(1.06, 1.0, 0.72);
	torsoGroup.add(coat);

	// Bottom hem cream stripe (slightly inset above very bottom edge like reference!)
	const hemStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.326, 0.333, 0.036, 16), creamM);
	hemStripe.scale.set(1.07, 1.0, 0.73);
	hemStripe.position.y = -0.36;
	torsoGroup.add(hemStripe);

	// Small V-split wedge at bottom front showing dark pants underneath
	const vSplit = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 3), pantsM);
	vSplit.position.set(0, -0.31, 0.215);
	vSplit.rotation.y = Math.PI;
	torsoGroup.add(vSplit);

	// Oversized Cream-White Folded Shirt Collar (Left & Right lapels + back fold + thin red trim!)
	const backCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.215, 0.13, 12, 1, false, Math.PI * 0.55, Math.PI * 0.9), creamM);
	backCollar.position.set(0, 0.395, -0.02);
	torsoGroup.add(backCollar);

	([-1, 1] as const).forEach((side) => {
		const lapel = new THREE.Group();
		lapel.position.set(side * 0.105, 0.37, 0.135);
		lapel.rotation.set(0.35, side * -0.32, side * 0.28);
		const flap = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.032), creamM);
		const redTrim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.036), shirtM);
		redTrim.name = 'shirtMesh';
		redTrim.position.y = -0.042;
		lapel.add(flap, redTrim);
		torsoGroup.add(lapel);
	});

	// Two Pointed Cream Chest Pocket Flaps with tiny red buttons (iconic Messenger jacket!)
	([-0.145, 0.145] as const).forEach((px) => {
		const pocket = new THREE.Group();
		pocket.position.set(px, 0.13, 0.195);
		pocket.rotation.y = px < 0 ? -0.22 : 0.22;
		const pTop = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.055, 0.024), creamM);
		const pTip = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.055, 4), creamM);
		pTip.rotation.z = Math.PI;
		pTip.rotation.y = Math.PI / 4;
		pTip.scale.set(1.0, 1.0, 0.3);
		pTip.position.y = -0.05;
		const pBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.028, 8), shirtM);
		pBtn.name = 'shirtMesh';
		pBtn.rotation.x = Math.PI / 2;
		pBtn.position.set(0, -0.015, 0.008);
		pocket.add(pTop, pTip, pBtn);
		torsoGroup.add(pocket);
	});

	// 4 Cream Coat Buttons neatly down the front placket
	([0.23, 0.06, -0.09, -0.22] as const).forEach((by, bi) => {
		const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.022, 8), creamM);
		btn.rotation.x = Math.PI / 2;
		btn.position.set(bi === 3 ? -0.04 : 0.0, by, 0.205 + (0.23 - by) * 0.06);
		torsoGroup.add(btn);
	});

	// Rounded shoulder caps for natural anime silhouette
	([-0.23, 0.23] as const).forEach((sx) => {
		const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.108, 10, 8), shirtM);
		shoulder.name = sx < 0 ? 'shirtMeshArmL' : 'shirtMeshArmR';
		shoulder.position.set(sx, 0.34, 0);
		torsoGroup.add(shoulder);
	});

	// Slender Neck
	const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.082, 0.17, 10), skinM);
	neck.position.y = 0.46;
	torsoGroup.add(neck);

	// Diagonal Matte Charcoal Crossbody Strap (drapes over right shoulder to left hip!)
	const strapFront = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.84, 0.028), strapM);
	strapFront.name = 'bagStrap';
	strapFront.position.set(0.01, 0.06, 0.215);
	strapFront.rotation.z = -0.56;
	const strapBack = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.84, 0.028), strapM);
	strapBack.name = 'bagStrap';
	strapBack.position.set(0.01, 0.06, -0.215);
	strapBack.rotation.z = -0.56;
	const strapShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.44), strapM);
	strapShoulder.position.set(0.20, 0.39, 0);
	strapShoulder.rotation.z = -0.25;
	torsoGroup.add(strapFront, strapBack, strapShoulder);

	// Compact Matte Charcoal Messenger Pouch on left hip with crisp white accent stripe
	const bagGroup = new THREE.Group();
	bagGroup.position.set(-0.27, -0.14, 0.06);
	bagGroup.rotation.set(0.08, 0.28, 0.18);
	torsoGroup.add(bagGroup);

	const bagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.24, 0.24), bagM);
	bagMesh.name = 'bagMesh';
	const bagTop = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.24, 10), bagM);
	bagTop.name = 'bagMesh';
	bagTop.rotation.x = Math.PI / 2;
	bagTop.position.y = 0.12;
	const bagAccent = new THREE.Mesh(new THREE.BoxGeometry(0.158, 0.022, 0.246), creamM);
	bagAccent.position.y = -0.075;
	bagGroup.add(bagMesh, bagTop, bagAccent);

	const letter = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.14, 0.20), creamM);
	letter.name = 'carriedLetter';
	letter.position.set(0.02, 0.21, 0.0);
	letter.rotation.x = 0.18;
	letter.visible = false;
	bagGroup.add(letter);

	// 3. Flared 3/4 Anime Jacket Sleeves + Cream Cuff Stripes + Sculpted Hands w/ Thumbs
	([-0.275, 0.275] as const).forEach((ax, i) => {
		const arm = new THREE.Group();
		arm.name = i === 0 ? 'leftArm' : 'rightArm';
		arm.position.set(ax, 0.33, 0);
		arm.rotation.z = i === 0 ? 0.19 : -0.19;

		const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.115, 0.50, 10), shirtM);
		sleeve.name = i === 0 ? 'shirtMeshArmL' : 'shirtMeshArmR';
		sleeve.position.y = -0.24;
		const cuffStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.116, 0.034, 10), creamM);
		cuffStripe.position.y = -0.43;
		const wrist = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.11, 6, 8), skinM);
		wrist.position.y = -0.54;
		const palm = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.11, 0.055), skinM);
		palm.position.y = -0.63;
		const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.045, 4, 6), skinM);
		thumb.position.set(i === 0 ? 0.04 : -0.04, -0.62, 0.028);
		thumb.rotation.z = i === 0 ? -0.45 : 0.45;

		arm.add(sleeve, cuffStripe, wrist, palm, thumb);
		torsoGroup.add(arm);
	});

	// 4. Sculpted Anime Head (Tapered Jawline + 3D Nose + Cool Almond Eyes + Shaggy Layered Hair!)
	const headGroup = new THREE.Group();
	headGroup.name = 'headGroup';
	headGroup.position.y = 0.79;
	torsoGroup.add(headGroup);

	// Upper cranium + tapered anime jawline/chin
	const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.265, 18, 14), skinM);
	cranium.scale.set(0.96, 1.0, 0.94);
	cranium.position.y = 0.03;
	const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.225, 0.24, 14), skinM);
	jaw.rotation.x = Math.PI;
	jaw.scale.set(0.96, 1.0, 0.88);
	jaw.position.set(0, -0.145, 0.015);
	headGroup.add(cranium, jaw);

	// Subtle sculpted 3D anime nose
	const nose = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.075, 4), skinM);
	nose.rotation.x = Math.PI / 2 - 0.35;
	nose.position.set(0, -0.035, 0.258);
	headGroup.add(nose);

	// Cute Anime Ears
	([-0.255, 0.255] as const).forEach((ex) => {
		const ear = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinM);
		ear.scale.set(0.5, 1.15, 0.75);
		ear.position.set(ex, -0.03, -0.01);
		headGroup.add(ear);
	});

	// Cool, Crisp Anime Eyes (almond-shaped dark eyes + angled upper lash + strong anime eyebrows + calm mouth!)
	const whiteEyeM = new THREE.MeshBasicMaterial({ color: 0xffffff });
	([-0.092, 0.092] as const).forEach((ex) => {
		const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), whiteEyeM);
		sclera.scale.set(1.15, 0.72, 0.32);
		sclera.position.set(ex, -0.005, 0.238);

		const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), darkInkM);
		pupil.scale.set(1.05, 0.88, 0.42);
		pupil.position.set(ex, -0.006, 0.252);

		// Sharp upper anime eyelash line
		const lash = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.018, 0.022), darkInkM);
		lash.position.set(ex, 0.022, 0.256);
		lash.rotation.z = ex < 0 ? -0.1 : 0.1;

		// Bold anime eyebrow
		const brow = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.026, 0.022), darkInkM);
		brow.position.set(ex, 0.068, 0.252);
		brow.rotation.z = ex < 0 ? -0.14 : 0.14;

		headGroup.add(sclera, pupil, lash, brow);
	});

	// Calm neat anime mouth line (matches reference e4dca0c6!)
	const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.013, 0.018), darkInkM);
	mouth.position.set(0, -0.125, 0.232);
	headGroup.add(mouth);

	// Shaggy Layered Anime Hair (5 jagged bangs + rounded crown + flipped nape tufts!)
	const hairCrown = new THREE.Mesh(
		new THREE.SphereGeometry(0.298, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
		hairM
	);
	hairCrown.name = 'hatMeshDome';
	hairCrown.scale.set(1.03, 1.04, 1.04);
	hairCrown.position.set(0, 0.065, -0.025);
	hairCrown.rotation.x = -0.32;
	headGroup.add(hairCrown);

	// Full back hair strictly behind skull (z <= 0)
	const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.295, 16, 12), hairM);
	backHair.name = 'hatMeshBtn';
	backHair.scale.set(1.03, 1.05, 0.72);
	backHair.position.set(0, -0.01, -0.11);
	headGroup.add(backHair);

	// 5 Jagged Layered Anime Front Bangs resting cleanly ABOVE eyebrows
	([-0.17, -0.09, 0.0, 0.09, 0.17] as const).forEach((fx, idx) => {
		const bang = new THREE.Mesh(new THREE.ConeGeometry(0.064, 0.155 + (idx % 2) * 0.03, 5), hairM);
		bang.name = 'hatMeshDome';
		bang.rotation.x = Math.PI - 0.16;
		bang.rotation.z = (idx - 2) * -0.16;
		bang.position.set(fx, 0.175, 0.215 - Math.abs(fx) * 0.35);
		headGroup.add(bang);
	});

	// Flipped-out Shaggy Nape Hair Tufts (gives that iconic Messenger silhouette from behind!)
	([-0.22, -0.12, 0.0, 0.12, 0.22] as const).forEach((tx, idx) => {
		const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.18, 5), hairM);
		tuft.name = 'hatMeshBtn';
		tuft.rotation.x = Math.PI + 0.55;
		tuft.rotation.z = (idx - 2) * 0.25;
		tuft.position.set(tx, -0.15, -0.22 + Math.abs(tx) * 0.28);
		headGroup.add(tuft);
	});

	// Style A: Shaggy Messenger Bob (side locks framing ears)
	const styleBob = new THREE.Group();
	styleBob.name = 'style-bob';
	([-0.245, 0.245] as const).forEach((sx) => {
		const lock = new THREE.Mesh(new THREE.ConeGeometry(0.072, 0.24, 5), hairM);
		lock.rotation.x = Math.PI;
		lock.rotation.z = sx < 0 ? -0.22 : 0.22;
		lock.position.set(sx, -0.08, -0.04);
		styleBob.add(lock);
	});
	headGroup.add(styleBob);

	// Style B: Twin Anime Hair Buns with Yellow Ties
	const styleBuns = new THREE.Group();
	styleBuns.name = 'style-buns';
	([-0.25, 0.25] as const).forEach((bx) => {
		const bun = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), hairM);
		bun.position.set(bx, 0.24, -0.06);
		const tie = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.024, 6, 12), goldM);
		tie.position.set(bx * 0.88, 0.20, -0.05);
		tie.rotation.y = bx < 0 ? 0.7 : -0.7;
		styleBuns.add(bun, tie);
	});
	styleBuns.visible = false;
	headGroup.add(styleBuns);

	// Style C: Stylish Mailman Cap
	const styleCap = new THREE.Group();
	styleCap.name = 'style-cap';
	const capTop = new THREE.Mesh(
		new THREE.SphereGeometry(0.32, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
		shirtM
	);
	capTop.position.set(0, 0.11, -0.01);
	const brim = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), shirtM);
	brim.name = 'hatMeshVisor';
	brim.scale.set(1.06, 0.12, 0.86);
	brim.position.set(0, 0.18, 0.23);
	brim.rotation.x = 0.08;
	const badge = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), goldM);
	badge.position.set(0, 0.25, 0.31);
	styleCap.add(capTop, brim, badge);
	styleCap.visible = false;
	headGroup.add(styleCap);

	// Style D: Cozy Retro Headphones
	const styleHeadphones = new THREE.Group();
	styleHeadphones.name = 'style-headphones';
	const band = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.03, 8, 20, Math.PI), creamM);
	band.position.y = 0.08;
	([-0.315, 0.315] as const).forEach((hx) => {
		const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.07, 12), goldM);
		cup.rotation.z = Math.PI / 2;
		cup.position.set(hx, 0.01, 0);
		styleHeadphones.add(cup);
	});
	styleHeadphones.add(band);
	styleHeadphones.visible = false;
	headGroup.add(styleHeadphones);

	setCourierHairStyle(root, opts.hairStyle ?? 'bob');
	return root;
}

export function setCourierHairStyle(grp: THREE.Group, style: HairStyle): void {
	(['bob', 'buns', 'cap', 'headphones'] as HairStyle[]).forEach((s) => {
		const node = grp.getObjectByName(`style-${s}`);
		if (node) node.visible = s === style;
	});
}

/** Fluid Anime Walk / Sprint / Idle / Jump-Glide Animation */
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
	const ls = grp.getObjectByName('leftShin');
	const rs = grp.getObjectByName('rightShin');
	const la = grp.getObjectByName('leftArm');
	const ra = grp.getObjectByName('rightArm');

	const freq = sprinting ? 13.5 : 9.2;
	const breath = Math.sin(t * 2.5 + phase);
	const invSq = 1 / Math.sqrt(squash);

	if (body) {
		body.scale.set(0.132 * invSq, 0.132 * squash, 0.132 * invSq);
		if (moving && jumpH < 0.02) {
			body.position.y = Math.abs(Math.sin(t * freq + phase)) * 0.022;
			body.rotation.z = Math.sin(t * freq + phase) * 0.045;
		} else {
			body.position.y *= 0.84;
			body.rotation.z *= 0.84;
		}
	}
	if (torso) {
		const bs = 1 + breath * 0.018;
		torso.scale.set(bs, 1 - breath * 0.012, bs);
		const targetLean = moving ? (sprinting ? 0.24 : 0.1) : 0;
		torso.rotation.x += (targetLean - torso.rotation.x) * 0.18;
		torso.rotation.y = moving ? Math.sin(t * freq + phase) * 0.12 : Math.sin(t * 1.4 + phase) * 0.03;
	}
	if (head) {
		head.rotation.z = moving ? Math.sin(t * freq * 0.5 + phase) * 0.05 : breath * 0.03;
		head.rotation.y = moving ? 0 : Math.sin(t * 1.1 + phase) * 0.08;
	}

	if (jumpH > 0.025) {
		const gliding = jumpHeld;
		if (ll) ll.rotation.x = gliding ? -0.35 : -0.55;
		if (rl) rl.rotation.x = gliding ? 0.25 : 0.45;
		if (ls) ls.rotation.x = 0.55;
		if (rs) rs.rotation.x = 0.65;
		if (la) {
			la.rotation.x = -0.3;
			la.rotation.z = gliding ? 1.15 : 0.55;
		}
		if (ra) {
			ra.rotation.x = -0.3;
			ra.rotation.z = gliding ? -1.15 : -0.55;
		}
	} else if (moving) {
		const sw = Math.sin(t * freq + phase);
		const amp = sprinting ? 0.82 : 0.56;
		if (ll) ll.rotation.x = sw * amp;
		if (rl) rl.rotation.x = -sw * amp;
		if (ls) ls.rotation.x = Math.max(0, -sw) * (sprinting ? 0.95 : 0.55);
		if (rs) rs.rotation.x = Math.max(0, sw) * (sprinting ? 0.95 : 0.55);
		if (la) {
			la.rotation.x = -sw * amp * 0.85;
			la.rotation.z = 0.16;
		}
		if (ra) {
			ra.rotation.x = sw * amp * 0.85;
			ra.rotation.z = -0.16;
		}
	} else {
		if (ll) ll.rotation.x *= 0.8;
		if (rl) rl.rotation.x *= 0.8;
		if (ls) ls.rotation.x *= 0.8;
		if (rs) rs.rotation.x *= 0.8;
		if (la) {
			la.rotation.x *= 0.8;
			la.rotation.z = 0.14 + breath * 0.03;
		}
		if (ra) {
			ra.rotation.x *= 0.8;
			ra.rotation.z = -0.14 - breath * 0.03;
		}
	}
}
