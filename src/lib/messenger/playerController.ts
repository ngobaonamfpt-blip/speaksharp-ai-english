import * as THREE from 'three';
import { inkDisplayOutput } from './animeInkPass';
import { buildSculptedAnimeCourier, updateAnimeFaceBlink } from './animeCourierMesh';

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

export type HairStyle = 'bob' | 'buns' | 'cap' | 'headphones' | 'strawhat';
export type TopStyle = 'coat' | 'tee';
export type EmoteAction = 'wave' | 'spin' | 'cheer' | null;

/**
 * High-Detail Sculpted Anime Mesh Courier Character modeled closely on Messenger by Abeto:
 *  - Continuous lofted anatomical anime meshes (head, coat, sleeves, hands, culottes, chunky sneakers)
 *  - Swept tapered 3D anime hair strands & high-res hand-inked blinking anime face texture
 *  - True Inverted-Hull (BackSide) charcoal ink outlines + crisp 2-tone Studio Anime cel-shading
 *  - 2 Swappable Tops, 5 Swappable Hairstyles/Headgear, 5-slot color customization & 3D emotes
 */
export function buildChibiCourier(
	toonGradient: THREE.DataTexture,
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
	return buildSculptedAnimeCourier(toonGradient, opts);
}

export function setCourierHairStyle(grp: THREE.Group, style: HairStyle): void {
	(['bob', 'buns', 'cap', 'headphones', 'strawhat'] as HairStyle[]).forEach((s) => {
		const node = grp.getObjectByName(`style-${s}`);
		if (node) node.visible = s === style;
	});
}

export function setCourierTopStyle(grp: THREE.Group, style: TopStyle): void {
	const coat = grp.getObjectByName('top-coat-details');
	const tee = grp.getObjectByName('top-tee-details');
	if (coat) coat.visible = style === 'coat';
	if (tee) tee.visible = style === 'tee';
}

/** Fluid Anime Walk / Sprint / Idle / Jump-Glide + Natural Eye Blink + 3D Emote Action Animations */
export function animateChibi(
	grp: THREE.Group,
	opts: {
		t: number;
		phase?: number;
		moving: boolean;
		sprinting?: boolean;
		jumpH?: number;
		jumpHeld?: boolean;
		squash?: number;
		emoteAction?: EmoteAction;
		emoteProgress?: number;
	}
) {
	const {
		t,
		phase = 0,
		moving,
		sprinting = false,
		jumpH = 0,
		jumpHeld = false,
		squash = 1,
		emoteAction = null,
		emoteProgress = 0
	} = opts;
	const body = grp.getObjectByName('bodyRoot');
	const torso = grp.getObjectByName('torsoGroup');
	const head = grp.getObjectByName('headGroup');
	const eyes = grp.getObjectByName('eyeBlinkGroup');
	const ll = grp.getObjectByName('leftLeg');
	const rl = grp.getObjectByName('rightLeg');
	const ls = grp.getObjectByName('leftShin');
	const rs = grp.getObjectByName('rightShin');
	const la = grp.getObjectByName('leftArm');
	const ra = grp.getObjectByName('rightArm');

	const freq = sprinting ? 13.5 : 9.2;
	const breath = Math.sin(t * 2.5 + phase);
	const invSq = 1 / Math.sqrt(squash);

	// Natural periodic eye blink (~0.14s blink every 3.8s)
	const blinkCycle = (t + phase * 0.7) % 3.8;
	const isBlinking = blinkCycle > 3.66;
	updateAnimeFaceBlink(grp, isBlinking);
	if (eyes) {
		const blinkScale = isBlinking ? Math.max(0.08, Math.abs(Math.cos((blinkCycle - 3.66) * Math.PI / 0.14))) : 1;
		eyes.scale.y = blinkScale;
	}

	if (body) {
		body.scale.set(0.132 * invSq, 0.132 * squash, 0.132 * invSq);
		if (emoteAction === 'spin') {
			body.rotation.y = emoteProgress * Math.PI * 2;
			body.position.y = Math.sin(emoteProgress * Math.PI) * 0.08;
		} else {
			body.rotation.y *= 0.78;
			if (moving && jumpH < 0.02) {
				body.position.y = Math.abs(Math.sin(t * freq + phase)) * 0.022;
				body.rotation.z = Math.sin(t * freq + phase) * 0.045;
			} else if (emoteAction === 'cheer') {
				body.position.y = Math.abs(Math.sin(emoteProgress * Math.PI * 3)) * 0.045;
				body.rotation.z = Math.sin(emoteProgress * Math.PI * 4) * 0.08;
			} else {
				body.position.y *= 0.84;
				body.rotation.z *= 0.84;
			}
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
		head.rotation.z = emoteAction === 'cheer' ? Math.sin(emoteProgress * Math.PI * 4) * 0.18 : moving ? Math.sin(t * freq * 0.5 + phase) * 0.05 : breath * 0.03;
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
			la.rotation.z = gliding ? -1.15 : -0.55;
		}
		if (ra) {
			ra.rotation.x = -0.3;
			ra.rotation.z = gliding ? 1.15 : 0.55;
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
			la.rotation.z = -0.2;
		}
		if (ra) {
			ra.rotation.x = sw * amp * 0.85;
			ra.rotation.z = 0.2;
		}
	} else {
		if (ll) ll.rotation.x *= 0.8;
		if (rl) rl.rotation.x *= 0.8;
		if (ls) ls.rotation.x *= 0.8;
		if (rs) rs.rotation.x *= 0.8;
		if (emoteAction === 'wave' && ra) {
			// Raise right arm & wave cheerfully!
			ra.rotation.x = -0.35;
			ra.rotation.z = 2.45 + Math.sin(t * 16) * 0.38;
			if (la) {
				la.rotation.x *= 0.8;
				la.rotation.z = -0.2;
			}
		} else if (emoteAction === 'cheer' && la && ra) {
			la.rotation.x = -0.25;
			ra.rotation.x = -0.25;
			la.rotation.z = -2.35 - Math.sin(t * 14) * 0.25;
			ra.rotation.z = 2.35 + Math.sin(t * 14) * 0.25;
		} else {
			if (la) {
				la.rotation.x *= 0.8;
				la.rotation.z = -0.2 - breath * 0.025;
			}
			if (ra) {
				ra.rotation.x *= 0.8;
				ra.rotation.z = 0.2 + breath * 0.025;
			}
		}
	}
}

/** Anime Footstep & Landing Dust Puff Pool (ultra-lightweight, zero GC allocation!) */
export function createDustPuffRig(scene: THREE.Scene) {
	const geo = new THREE.DodecahedronGeometry(0.045, 0);
	const mat = new THREE.MeshBasicMaterial({ color: 0xf4f0e4, transparent: true, opacity: 0.75 });
	const pool: Array<{ mesh: THREE.Mesh; life: number; vel: THREE.Vector3 }> = [];
	for (let i = 0; i < 18; i++) {
		const m = new THREE.Mesh(geo, mat.clone());
		m.visible = false;
		scene.add(m);
		pool.push({ mesh: m, life: 0, vel: new THREE.Vector3() });
	}
	let cursor = 0;

	const spawn = (origin: THREE.Vector3, upDir: THREE.Vector3, count = 1, spread = 0.015) => {
		const t1 = new THREE.Vector3(1, 0, 0).cross(upDir);
		if (t1.lengthSq() < 0.01) t1.set(0, 0, 1).cross(upDir);
		t1.normalize();
		const t2 = upDir.clone().cross(t1).normalize();
		for (let i = 0; i < count; i++) {
			const p = pool[cursor++ % pool.length];
			const a = Math.random() * Math.PI * 2;
			p.mesh.position.copy(origin).addScaledVector(upDir, 0.03);
			p.mesh.scale.setScalar(0.75 + Math.random() * 0.5);
			p.mesh.visible = true;
			p.life = 1;
			p.vel
				.copy(upDir)
				.multiplyScalar(0.008 + Math.random() * 0.008)
				.addScaledVector(t1, Math.cos(a) * spread)
				.addScaledVector(t2, Math.sin(a) * spread);
		}
	};

	const update = () => {
		for (const p of pool) {
			if (p.life <= 0) continue;
			p.life -= 0.045;
			p.mesh.position.add(p.vel);
			p.mesh.scale.multiplyScalar(1.035);
			(p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life * 0.72);
			if (p.life <= 0) p.mesh.visible = false;
		}
	};

	return { spawn, update };
}

/** Graceful Flapping 3D Anime Seabirds Soaring Above the Planet */
export function createSoaringBirdsRig(scene: THREE.Scene) {
	const group = new THREE.Group();
	group.name = 'SoaringBirds';
	const mat = new THREE.MeshBasicMaterial({ color: 0xf7f7f2, side: THREE.DoubleSide });
	const wingGeo = new THREE.BoxGeometry(0.24, 0.012, 0.09);
	wingGeo.translate(0.12, 0, 0);

	const birds: Array<{
		root: THREE.Group;
		leftW: THREE.Mesh;
		rightW: THREE.Mesh;
		orbitR: number;
		speed: number;
		phase: number;
		tilt: number;
	}> = [];

	for (let i = 0; i < 6; i++) {
		const b = new THREE.Group();
		const body = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.16, 5), mat);
		body.rotation.x = Math.PI / 2;
		const leftW = new THREE.Mesh(wingGeo, mat);
		const rightW = new THREE.Mesh(wingGeo, mat);
		rightW.rotation.y = Math.PI;
		b.add(body, leftW, rightW);
		group.add(b);
		birds.push({
			root: b,
			leftW,
			rightW,
			orbitR: 11.4 + (i % 3) * 1.1,
			speed: 0.16 + (i % 2) * 0.05,
			phase: (i / 6) * Math.PI * 2,
			tilt: ((i % 3) - 1) * 0.45
		});
	}
	scene.add(group);

	const tmpNext = new THREE.Vector3();
	const update = (elapsed: number) => {
		for (const b of birds) {
			const a = elapsed * b.speed + b.phase;
			const nextA = a + 0.05;
			const x = Math.cos(a) * b.orbitR * Math.cos(b.tilt);
			const y = Math.sin(b.tilt) * b.orbitR + Math.sin(a * 2) * 0.4;
			const z = Math.sin(a) * b.orbitR * Math.cos(b.tilt);
			b.root.position.set(x, y, z);
			tmpNext.set(
				Math.cos(nextA) * b.orbitR * Math.cos(b.tilt),
				Math.sin(b.tilt) * b.orbitR + Math.sin(nextA * 2) * 0.4,
				Math.sin(nextA) * b.orbitR * Math.cos(b.tilt)
			);
			b.root.lookAt(tmpNext);
			const flap = Math.sin(elapsed * 7.5 + b.phase * 3) * 0.55;
			b.leftW.rotation.z = flap;
			b.rightW.rotation.z = -flap;
		}
	};

	return { group, update };
}

/** Crisp Expanding White Water-Ripple Rings when stepping into coastal shallows (like Abeto!) */
export function createWaterRippleRig(scene: THREE.Scene) {
	const up = new THREE.Vector3(0, 1, 0);
	const geo = new THREE.RingGeometry(0.06, 0.088, 22);
	geo.rotateX(-Math.PI / 2);
	const pool: Array<{ mesh: THREE.Mesh; life: number }> = [];
	for (let i = 0; i < 10; i++) {
		const m = new THREE.Mesh(
			geo,
			new THREE.MeshBasicMaterial({
				color: 0xf6fcf9,
				transparent: true,
				opacity: 0.85,
				side: THREE.DoubleSide,
				depthWrite: false
			})
		);
		m.visible = false;
		scene.add(m);
		pool.push({ mesh: m, life: 0 });
	}
	let cursor = 0;

	const spawn = (origin: THREE.Vector3, upDir: THREE.Vector3) => {
		const r = pool[cursor++ % pool.length];
		r.mesh.position.copy(origin).addScaledVector(upDir, 0.025);
		r.mesh.quaternion.setFromUnitVectors(up, upDir);
		r.mesh.scale.setScalar(0.65);
		r.mesh.visible = true;
		r.life = 1;
	};

	const update = () => {
		for (const r of pool) {
			if (r.life <= 0) continue;
			r.life -= 0.028;
			r.mesh.scale.multiplyScalar(1.045);
			(r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, r.life * 0.82);
			if (r.life <= 0) r.mesh.visible = false;
		}
	};

	return { spawn, update };
}
