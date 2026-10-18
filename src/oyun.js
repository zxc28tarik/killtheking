
        // ============================================================================
        // 1. PROCEDURAL WEB AUDIO SYNTHESIZER v3.0 (Rich 1600s Sound Effects)
        // ============================================================================
        class SoundFX {
            constructor() {
                this.ctx = null;
            }
            init() {
                if (!this.ctx) {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (AudioCtx) this.ctx = new AudioCtx();
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            }
            playMeleeSwing(pitchShift = 1.0) {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(750 * pitchShift, now);
                filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.38, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(now);
            }
            playMetalClang() {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [520, 780, 1190].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, now);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.22);
                    gain.gain.setValueAtTime(0.12 / (idx + 1), now);
                    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.22);
                });
            }
            playBowRelease(chargeRatio = 1.0) {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220 + chargeRatio * 140, now);
                osc.frequency.exponentialRampToValueAtTime(85, now + 0.18);
                gain.gain.setValueAtTime(0.38, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            }
            playMusketBoom() {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.3);
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1600, now);
                filter.frequency.exponentialRampToValueAtTime(120, now + 0.48);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.75, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(now);

                const osc = this.ctx.createOscillator();
                const oscGain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);
                oscGain.gain.setValueAtTime(0.55, now);
                oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                osc.connect(oscGain);
                oscGain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            }
            playExplosion() {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.85);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.1);
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(900, now);
                filter.frequency.exponentialRampToValueAtTime(65, now + 0.82);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.9, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.84);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(now);
            }
            playHitmarker(isHeadshot = false) {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = isHeadshot ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(isHeadshot ? 1400 : 840, now);
                osc.frequency.exponentialRampToValueAtTime(isHeadshot ? 2100 : 320, now + (isHeadshot ? 0.18 : 0.06));
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + (isHeadshot ? 0.19 : 0.06));
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + (isHeadshot ? 0.19 : 0.06));
            }
            // Impact Design v1: layered blade/wood/armor transients rather than a single generic beep.
            playWeaponImpact(weaponName = '', isHeadshot = false, lethal = false) {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const melee = /Kılıç|Kargı|Kalkan|Süngü|Hançer/.test(weaponName);
                const bow = /Yay/.test(weaponName);
                const duration = melee ? 0.13 : bow ? 0.105 : 0.19;
                // Sharp physical initial contact (band-limited noise)
                const count = Math.floor(this.ctx.sampleRate * duration);
                const buffer = this.ctx.createBuffer(1, count, this.ctx.sampleRate);
                const out = buffer.getChannelData(0);
                for (let i = 0; i < count; i++) {
                    const t = i / count;
                    out[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, melee ? 3.2 : 2.5);
                }
                const src = this.ctx.createBufferSource();
                src.buffer = buffer;
                const band = this.ctx.createBiquadFilter();
                band.type = 'bandpass';
                band.Q.value = melee ? 1.15 : 0.72;
                band.frequency.setValueAtTime(melee ? 1650 : bow ? 900 : 690, now);
                band.frequency.exponentialRampToValueAtTime(melee ? 580 : 240, now + duration);
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(isHeadshot ? 0.25 : 0.18, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + duration);
                src.connect(band); band.connect(g); g.connect(this.ctx.destination);
                src.start(now); src.stop(now + duration);

                // Lower 'body' of the hit, heavier for melee and finishing blows
                const tone = this.ctx.createOscillator();
                const body = this.ctx.createGain();
                tone.type = 'triangle';
                const base = melee ? 165 : bow ? 125 : 110;
                tone.frequency.setValueAtTime(base * (lethal ? 1.25 : 1), now);
                tone.frequency.exponentialRampToValueAtTime(58, now + 0.105);
                body.gain.setValueAtTime(lethal ? 0.14 : 0.095, now);
                body.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                tone.connect(body); body.connect(this.ctx.destination);
                tone.start(now); tone.stop(now + 0.125);
                if (lethal) {
                    const confirm = this.ctx.createOscillator();
                    const cg = this.ctx.createGain();
                    confirm.type = 'sine';
                    confirm.frequency.setValueAtTime(560, now + 0.035);
                    confirm.frequency.exponentialRampToValueAtTime(860, now + 0.15);
                    cg.gain.setValueAtTime(0.001, now);
                    cg.gain.setValueAtTime(0.075, now + 0.035);
                    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                    confirm.connect(cg); cg.connect(this.ctx.destination);
                    confirm.start(now + 0.035); confirm.stop(now + 0.165);
                }
            }
            playPlayerHit() {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(110, now);
                osc.frequency.exponentialRampToValueAtTime(48, now + 0.13);
                gain.gain.setValueAtTime(0.10, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(now); osc.stop(now + 0.145);
            }
            playArrowThud() {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(62, now + 0.085);
                gain.gain.setValueAtTime(0.095, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(now); osc.stop(now + 0.095);
            }
            playJumpPad() {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(620, now + 0.26);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            }
            playReloadStep(step = 1) {
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(360 + step * 140, now);
                osc.frequency.setValueAtTime(520 + step * 160, now + 0.04);
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);
            }
        }
        const sfx = new SoundFX();

        // ============================================================================
        // 2. WEAPON & CLASS DEFINITIONS v2.0 (1600s ERA)
        // ============================================================================
        const CLASSES = [
            {
                id: 0,
                key: '1',
                name: 'ŞÖVALYE (KILIÇ & KALKAN)',
                weaponName: 'Çelik Kılıç',
                ammoText: 'SINIRSIZ (KILIÇ)',
                tipText: 'Sağ Tık (Basılı): Kalkan Blok | [F] veya Kalkan+Sol Tık: Kalkan Çarpması',
                speed: 112,
                maxHp: 130,
                type: 'melee',
                range: 5.5,
                damage: 20,
                headshotDamage: 30,
                cooldown: 0.34,
                svgIcon: `<svg width="95" height="26" viewBox="0 0 100 30" fill="none"><path d="M10 15H75L88 15L75 11H10V15Z" fill="#E5E7EB"/><path d="M22 6V24H27V6H22Z" fill="#F59E0B"/><rect x="6" y="12" width="16" height="6" fill="#78350F"/><circle cx="5" cy="15" r="4" fill="#F59E0B"/></svg>`
            },
            {
                id: 1,
                key: '2',
                name: 'PİYADE (MOMENTUM KARGI)',
                weaponName: 'Kargı',
                ammoText: 'HIZ HASARLI (KARGI)',
                tipText: 'Pasif: Hızlandıkça Hasar Katlanır! | Sağ Tık / [F]: Kargı Hücumu',
                speed: 104,
                maxHp: 110,
                type: 'melee',
                range: 8.2,
                damage: 35,
                headshotDamage: 52.5,
                cooldown: 0.44,
                svgIcon: `<svg width="110" height="24" viewBox="0 0 110 26" fill="none"><rect x="4" y="11" width="80" height="4" fill="#92400E"/><polygon points="84,7 106,13 84,19" fill="#E5E7EB"/><rect x="78" y="9" width="6" height="8" fill="#DC2626"/></svg>`
            },
            {
                id: 2,
                key: '3',
                name: 'OKÇU (GERİLEBİLİR YAY)',
                weaponName: 'Uzun Yay',
                ammoText: 'SINIRSIZ (OK)',
                tipText: 'Sol Tık Basılı Tut: Yayı Ger | Sağ Tık: Nişan | [F]: Hançer',
                speed: 108,
                maxHp: 100,
                type: 'bow',
                range: 110,
                damage: 23,
                headshotDamage: 34.5,
                cooldown: 4,
                svgIcon: `<svg width="90" height="28" viewBox="0 0 90 32" fill="none"><path d="M35 2C55 8 55 24 35 30" stroke="#92400E" stroke-width="4" fill="none"/><line x1="35" y1="2" x2="35" y2="30" stroke="#E5E7EB" stroke-width="1.5"/><line x1="20" y1="16" x2="72" y2="16" stroke="#D97706" stroke-width="2.5"/><polygon points="72,12 82,16 72,20" fill="#E5E7EB"/></svg>`
            },
            {
                id: 3,
                key: '4',
                name: 'TÜFEKÇİ (1600 MUSKET)',
                weaponName: 'Çakmaklı Tüfek',
                ammoText: '1 / 1 (BARUT)',
                tipText: 'Sağ Tık: Zoom (ADS) | [R]: Barut Doldur | [F]: Süngü / Hançer Darbesi',
                speed: 96,
                maxHp: 100,
                type: 'hitscan',
                range: 150,
                damage: 90,
                headshotDamage: 135,
                cooldown: 15,
                reloadTime: 15,
                svgIcon: `<svg width="115" height="26" viewBox="0 0 115 28" fill="none"><rect x="28" y="9" width="82" height="4" fill="#9CA3AF"/><path d="M6 22L28 13H65V17H32L14 25H6V22Z" fill="#78350F"/><rect x="36" y="5" width="7" height="5" fill="#D1D5DB"/></svg>`
            }
        ];

        // ============================================================================
        // 3. HIGH-DETAIL PROCEDURAL PBR TEXTURES & BUMP MAPS (v3.0 HD)
        // ============================================================================
        function createStoneBrickTextures() {
            const c = document.createElement('canvas');
            const b = document.createElement('canvas');
            c.width = 256; c.height = 256;
            b.width = 256; b.height = 256;
            const ctx = c.getContext('2d');
            const bctx = b.getContext('2d');

            // Dark mortar base
            ctx.fillStyle = '#2d3138';
            ctx.fillRect(0, 0, 256, 256);
            bctx.fillStyle = '#151515';
            bctx.fillRect(0, 0, 256, 256);

            const rows = 8, cols = 4;
            const bh = 256 / rows, bw = 256 / cols;

            for (let r = 0; r < rows; r++) {
                const offset = (r % 2) * (bw / 2);
                for (let col = -1; col <= cols; col++) {
                    const x = col * bw + offset;
                    const y = r * bh;
                    const baseTone = 92 + Math.floor(Math.random() * 28);
                    const warmShift = Math.floor(Math.random() * 10);
                    ctx.fillStyle = `rgb(${baseTone + warmShift}, ${baseTone + 4}, ${baseTone + 8})`;
                    ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);

                    // Highlight top/left bevel for crisp stone depth
                    ctx.fillStyle = `rgba(255, 255, 255, 0.14)`;
                    ctx.fillRect(x + 3, y + 3, bw - 6, 3);
                    ctx.fillRect(x + 3, y + 3, 3, bh - 6);

                    // Shadow bottom/right bevel
                    ctx.fillStyle = `rgba(0, 0, 0, 0.25)`;
                    ctx.fillRect(x + 3, y + bh - 6, bw - 6, 3);
                    ctx.fillRect(x + bw - 6, y + 3, 3, bh - 6);

                    // Bump map stone elevation
                    const bVal = 185 + Math.floor(Math.random() * 55);
                    bctx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
                    bctx.fillRect(x + 4, y + 4, bw - 8, bh - 8);

                    // Micro-cracks & stone grain
                    for (let n = 0; n < 18; n++) {
                        const nx = x + 5 + Math.random() * (bw - 12);
                        const ny = y + 5 + Math.random() * (bh - 12);
                        ctx.fillStyle = n % 2 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
                        ctx.fillRect(nx, ny, 3, 3);
                        bctx.fillStyle = n % 2 === 0 ? '#777' : '#fff';
                        bctx.fillRect(nx, ny, 3, 3);
                    }
                }
            }

            const map = new THREE.CanvasTexture(c);
            const bumpMap = new THREE.CanvasTexture(b);
            map.wrapS = map.wrapT = THREE.RepeatWrapping;
            bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
            map.magFilter = THREE.NearestFilter;
            return { map, bumpMap };
        }

        function createWoodCrateTextures() {
            const c = document.createElement('canvas');
            const b = document.createElement('canvas');
            c.width = 128; c.height = 128;
            b.width = 128; b.height = 128;
            const ctx = c.getContext('2d');
            const bctx = b.getContext('2d');

            ctx.fillStyle = '#7c4722';
            ctx.fillRect(0, 0, 128, 128);
            bctx.fillStyle = '#999999';
            bctx.fillRect(0, 0, 128, 128);

            // Wood planks & grain
            for (let i = 0; i < 4; i++) {
                const py = i * 32;
                ctx.fillStyle = i % 2 === 0 ? '#854d27' : '#73411f';
                ctx.fillRect(0, py, 128, 30);
                ctx.fillStyle = '#3d200d';
                ctx.fillRect(0, py + 30, 128, 2);
                bctx.fillStyle = '#222222';
                bctx.fillRect(0, py + 30, 128, 2);

                for (let g = 0; g < 10; g++) {
                    ctx.fillStyle = 'rgba(45, 20, 5, 0.22)';
                    ctx.fillRect(Math.random() * 110, py + Math.random() * 26, 18, 2);
                }
            }

            // Heavy outer frame + diagonal brace
            ctx.strokeStyle = '#542d12';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(10, 10); ctx.lineTo(118, 118);
            ctx.stroke();

            ctx.fillStyle = '#4a2810';
            ctx.fillRect(0, 0, 128, 12);
            ctx.fillRect(0, 116, 128, 12);
            ctx.fillRect(0, 0, 12, 128);
            ctx.fillRect(116, 0, 12, 128);

            bctx.fillStyle = '#eeeeee';
            bctx.fillRect(0, 0, 128, 12);
            bctx.fillRect(0, 116, 128, 12);
            bctx.fillRect(0, 0, 12, 128);
            bctx.fillRect(116, 0, 12, 128);

            // Iron corner brackets & golden rivets
            const corners = [[0, 0], [104, 0], [0, 104], [104, 104]];
            corners.forEach(([cx, cy]) => {
                ctx.fillStyle = '#27272a';
                ctx.fillRect(cx, cy, 24, 24);
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(cx + 6, cy + 6, 4, 4);
                ctx.fillRect(cx + 14, cy + 14, 4, 4);
            });

            const map = new THREE.CanvasTexture(c);
            const bumpMap = new THREE.CanvasTexture(b);
            map.magFilter = THREE.NearestFilter;
            return { map, bumpMap };
        }

        function createCourtyardGroundTextures() {
            const c = document.createElement('canvas');
            const b = document.createElement('canvas');
            c.width = 256; c.height = 256;
            b.width = 256; b.height = 256;
            const ctx = c.getContext('2d');
            const bctx = b.getContext('2d');

            // Warm packed earth base
            ctx.fillStyle = '#7d5a38';
            ctx.fillRect(0, 0, 256, 256);
            bctx.fillStyle = '#606060';
            bctx.fillRect(0, 0, 256, 256);

            // Cobblestone pavers & dirt patches
            const grid = 8;
            const cell = 256 / grid;
            for (let gx = 0; gx < grid; gx++) {
                for (let gy = 0; gy < grid; gy++) {
                    const x = gx * cell;
                    const y = gy * cell;
                    if ((gx + gy) % 3 !== 0) {
                        const s = 105 + Math.floor(Math.random() * 25);
                        ctx.fillStyle = `rgb(${s}, ${s - 6}, ${s - 14})`;
                        ctx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
                        ctx.fillStyle = 'rgba(255,255,255,0.1)';
                        ctx.fillRect(x + 3, y + 3, cell - 6, 3);
                        bctx.fillStyle = '#d4d4d4';
                        bctx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
                    } else {
                        ctx.fillStyle = '#6e4e2e';
                        ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
                        bctx.fillStyle = '#888888';
                        bctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
                    }
                }
            }

            // Fine grit & pebbles
            for (let i = 0; i < 180; i++) {
                ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.16)' : 'rgba(255,235,200,0.12)';
                const px = Math.random() * 250;
                const py = Math.random() * 250;
                ctx.fillRect(px, py, 4, 4);
                bctx.fillStyle = i % 2 === 0 ? '#333' : '#fff';
                bctx.fillRect(px, py, 4, 4);
            }

            const map = new THREE.CanvasTexture(c);
            const bumpMap = new THREE.CanvasTexture(b);
            map.magFilter = THREE.NearestFilter;
            map.wrapS = map.wrapT = THREE.RepeatWrapping;
            bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
            map.repeat.set(20, 20);
            bumpMap.repeat.set(20, 20);
            return { map, bumpMap };
        }

        function createRoofTileTexture() {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#7f291e';
            ctx.fillRect(0, 0, 128, 128);
            for (let r = 0; r < 8; r++) {
                ctx.fillStyle = r % 2 === 0 ? '#913124' : '#6e2117';
                ctx.fillRect(0, r * 16, 128, 13);
                ctx.fillStyle = '#47130c';
                ctx.fillRect(0, r * 16 + 13, 128, 3);
            }
            const tex = new THREE.CanvasTexture(c);
            tex.magFilter = THREE.NearestFilter;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 4);
            return tex;
        }

        // ============================================================================
        // 3B. PROCEDURAL CHARACTER TEXTURES (Faces, Heraldry, Chainmail & Armor)
        // ============================================================================
        function createCharacterFaceTexture(role) {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Realistic skin tone gradient with facial contour shading
            const skinGrad = ctx.createRadialGradient(128, 120, 20, 128, 128, 140);
            skinGrad.addColorStop(0, '#eac096');
            skinGrad.addColorStop(0.65, '#d89e6c');
            skinGrad.addColorStop(1, '#b37745');
            ctx.fillStyle = skinGrad;
            ctx.fillRect(0, 0, 256, 256);

            // Cheekbone & eye-socket ambient occlusion
            ctx.fillStyle = 'rgba(70, 35, 15, 0.28)';
            ctx.beginPath();
            ctx.ellipse(78, 102, 28, 16, 0, 0, Math.PI * 2);
            ctx.ellipse(178, 102, 28, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Realistic Eyes (Sclera, iris ring, pupil, specular catchlight)
            [[78, 102], [178, 102]].forEach(([ex, ey]) => {
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.ellipse(ex, ey, 20, 10, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = role === 'knight' ? '#1e40af' : role === 'archer' ? '#15803d' : '#3e2723';
                ctx.beginPath();
                ctx.arc(ex, ey, 9, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#090d16';
                ctx.beginPath();
                ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ex - 3, ey - 3, 2.2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Furrowed eyebrows
            ctx.strokeStyle = '#26170c';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(50, 84); ctx.quadraticCurveTo(78, 76, 104, 88);
            ctx.moveTo(206, 84); ctx.quadraticCurveTo(178, 76, 152, 88);
            ctx.stroke();

            // Battle scar across cheek
            if (role === 'pikeman' || role === 'knight') {
                ctx.strokeStyle = 'rgba(136, 19, 55, 0.65)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(168, 62); ctx.lineTo(186, 148);
                ctx.stroke();
            }

            // Stubble shading on jaw
            ctx.fillStyle = 'rgba(40, 26, 16, 0.22)';
            ctx.fillRect(36, 155, 184, 90);

            // Lips
            ctx.fillStyle = '#8c4a32';
            ctx.fillRect(98, 178, 60, 9);

            const tex = new THREE.CanvasTexture(c);
            tex.anisotropy = 4;
            return tex;
        }

        function createHeraldicShieldTexture(primaryHex = '#881313', accentHex = '#d97706') {
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');

            // Quartered royal background with aged vignette
            ctx.fillStyle = primaryHex;
            ctx.fillRect(0, 0, 128, 128);
            ctx.fillRect(128, 128, 128, 128);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(128, 0, 128, 128);
            ctx.fillRect(0, 128, 128, 128);

            // Metallic gold cross & heraldic border
            const goldGrad = ctx.createLinearGradient(0, 0, 256, 256);
            goldGrad.addColorStop(0, '#fef08a');
            goldGrad.addColorStop(0.5, accentHex);
            goldGrad.addColorStop(1, '#78350f');

            ctx.strokeStyle = goldGrad;
            ctx.lineWidth = 18;
            ctx.strokeRect(9, 9, 238, 238);

            ctx.fillStyle = goldGrad;
            ctx.fillRect(112, 18, 32, 220);
            ctx.fillRect(18, 112, 220, 32);

            // Battle scratches & weathering
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 16; i++) {
                ctx.beginPath();
                const sx = 25 + Math.random() * 200;
                const sy = 25 + Math.random() * 200;
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + (Math.random() - 0.5) * 45, sy + (Math.random() - 0.5) * 45);
                ctx.stroke();
            }

            const tex = new THREE.CanvasTexture(c);
            tex.anisotropy = 4;
            return tex;
        }

        function createChainmailTexture() {
            const c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#1f242d';
            ctx.fillRect(0, 0, 128, 128);
            for (let y = 0; y < 128; y += 8) {
                for (let x = 0; x < 128; x += 8) {
                    const ox = (y % 16 === 0) ? 0 : 4;
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 2.2;
                    ctx.beginPath();
                    ctx.arc(x + ox, y, 3.6, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.strokeStyle = '#e5e7eb';
                    ctx.lineWidth = 1.0;
                    ctx.beginPath();
                    ctx.arc(x + ox - 0.5, y - 0.5, 3.2, -0.8, 0.8);
                    ctx.stroke();
                }
            }
            const tex = new THREE.CanvasTexture(c);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 2);
            return tex;
        }

        function createArmorPlateTexture() {
            const c = document.createElement('canvas');
            const b = document.createElement('canvas');
            c.width = 256; c.height = 256;
            b.width = 256; b.height = 256;
            const ctx = c.getContext('2d');
            const bctx = b.getContext('2d');

            // Brushed forged steel gradient
            const grad = ctx.createLinearGradient(0, 0, 256, 0);
            grad.addColorStop(0, '#9ca3af');
            grad.addColorStop(0.25, '#e5e7eb');
            grad.addColorStop(0.5, '#f9fafb');
            grad.addColorStop(0.75, '#d1d5db');
            grad.addColorStop(1, '#9ca3af');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 256, 256);

            bctx.fillStyle = '#808080';
            bctx.fillRect(0, 0, 256, 256);

            // Fine brushed metal grain & battle micro-scratches
            for (let i = 0; i < 350; i++) {
                const y = Math.random() * 256;
                ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                ctx.fillRect(0, y, 256, 1);
                bctx.fillStyle = i % 2 === 0 ? '#969696' : '#6e6e6e';
                bctx.fillRect(0, y, 256, 1);
            }

            // Gothic fluted armor ridges (kabartma oluklar)
            [64, 128, 192].forEach(rx => {
                ctx.fillStyle = 'rgba(17, 24, 39, 0.32)';
                ctx.fillRect(rx - 3, 18, 6, 220);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.fillRect(rx + 3, 18, 3, 220);
                bctx.fillStyle = '#ffffff';
                bctx.fillRect(rx - 4, 18, 8, 220);
            });

            // Engraved brass/gold border & rivets
            ctx.fillStyle = '#d97706';
            ctx.fillRect(0, 0, 256, 14);
            ctx.fillRect(0, 242, 256, 14);
            bctx.fillStyle = '#ffffff';
            bctx.fillRect(0, 0, 256, 14);
            bctx.fillRect(0, 242, 256, 14);

            for (let x = 20; x < 256; x += 36) {
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(x, 7, 3.5, 0, Math.PI * 2);
                ctx.arc(x, 249, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

            const map = new THREE.CanvasTexture(c);
            const bumpMap = new THREE.CanvasTexture(b);
            map.anisotropy = 4;
            return { map, bumpMap };
        }

        function createWalnutWoodTexture() {
            const c = document.createElement('canvas');
            const b = document.createElement('canvas');
            c.width = 256; c.height = 256;
            b.width = 256; b.height = 256;
            const ctx = c.getContext('2d');
            const bctx = b.getContext('2d');

            const grad = ctx.createLinearGradient(0, 0, 0, 256);
            grad.addColorStop(0, '#4a2511');
            grad.addColorStop(0.5, '#5c2f16');
            grad.addColorStop(1, '#3b1d0c');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 256, 256);

            bctx.fillStyle = '#808080';
            bctx.fillRect(0, 0, 256, 256);

            // Realistic walnut wood fibers
            for (let i = 0; i < 240; i++) {
                ctx.fillStyle = i % 3 === 0 ? 'rgba(20, 8, 2, 0.28)' : 'rgba(120, 65, 30, 0.16)';
                const y = Math.random() * 256;
                ctx.fillRect(0, y, 256, 1 + Math.random() * 2);
                bctx.fillStyle = i % 3 === 0 ? '#606060' : '#989898';
                bctx.fillRect(0, y, 256, 2);
            }

            const map = new THREE.CanvasTexture(c);
            const bumpMap = new THREE.CanvasTexture(b);
            map.anisotropy = 4;
            return { map, bumpMap };
        }

        const charFaceTextures = {
            knight: createCharacterFaceTexture('knight'),
            pikeman: createCharacterFaceTexture('pikeman'),
            archer: createCharacterFaceTexture('archer'),
            musket: createCharacterFaceTexture('musket')
        };
        const heraldicShieldTex = createHeraldicShieldTexture('#881313', '#f59e0b');
        const blueHeraldicTex = createHeraldicShieldTexture('#1e3a8a', '#f59e0b');
        const chainmailTex = createChainmailTexture();
        const armorPlateBundle = createArmorPlateTexture();
        const armorPlateTex = armorPlateBundle.map;
        const walnutTexBundle = createWalnutWoodTexture();

        // ============================================================================
        // 4. THREE.JS HD RENDERER, SKY DOME, CLOUDS, TORCHES & CASTLE ARENA
        // ============================================================================
        const canvas = document.getElementById('game-canvas');
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xd97736);
        scene.fog = new THREE.FogExp2(0xd9824c, 0.0046);

        // Generate realistic PBR Metallic Environment Map (PMREM) so armor, blades & musket barrels gleam like real forged metal!
        if (THREE.PMREMGenerator) {
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileCubemapShader();
            const envScene = new THREE.Scene();
            envScene.background = new THREE.Color(0x64748b);
            const eSky = new THREE.Mesh(
                new THREE.SphereGeometry(50, 16, 12),
                new THREE.MeshBasicMaterial({ color: 0xffedd5, side: THREE.BackSide })
            );
            const eGround = new THREE.Mesh(
                new THREE.PlaneGeometry(100, 100),
                new THREE.MeshBasicMaterial({ color: 0x292524, side: THREE.DoubleSide })
            );
            eGround.rotation.x = Math.PI / 2;
            eGround.position.y = -10;
            const eSun = new THREE.Mesh(
                new THREE.SphereGeometry(8, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            eSun.position.set(25, 32, 20);
            envScene.add(eSky, eGround, eSun);
            scene.environment = pmremGenerator.fromScene(envScene, 0.04).texture;
            pmremGenerator.dispose();
        }

        const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 350);
        camera.rotation.order = 'YXZ';

        // Sky & Ground Hemisphere Light + Warm Directional Sun Light
        const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x3f2e21, 0.68);
        scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xffd28a, 1.25);
        sunLight.position.set(55, 68, 42);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.bias = -0.0005;
        const d = 58;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        scene.add(sunLight);

        // Muzzle flash dynamic point light attached to player
        const muzzleLight = new THREE.PointLight(0xffaa33, 0, 16);
        scene.add(muzzleLight);

        // Procedural Sky Dome, Glowing Sun Orb & Drifting Voxel Clouds
        let skyDomeMesh = null;
        let sunDiscMesh = null;
        let sunHaloMesh = null;
        const skyClouds = [];
        let currentAtmosphereIdx = 0;

        const ATMOSPHERES = [
            {
                name: '🌅 GÜN BATIMI [H]',
                topCol: '#1e2952', midCol: '#c2593f', botCol: '#f59e0b',
                fogCol: 0xc86d45, fogDensity: 0.0045,
                sunCol: 0xffb76b, sunIntensity: 1.32, sunPos: [58, 46, 48],
                hemiSky: 0xffd8a8, hemiGround: 0x3b281e, hemiIntensity: 0.68,
                exposure: 1.15
            },
            {
                name: '☀️ ÖĞLE GÜNEŞİ [H]',
                topCol: '#1d4ed8', midCol: '#38bdf8', botCol: '#bae6fd',
                fogCol: 0x7dd3fc, fogDensity: 0.0038,
                sunCol: 0xfffbeb, sunIntensity: 1.35, sunPos: [40, 88, 30],
                hemiSky: 0xe0f2fe, hemiGround: 0x4b5563, hemiIntensity: 0.78,
                exposure: 1.12
            },
            {
                name: '🌙 GECE KUŞATMASI [H]',
                topCol: '#030712', midCol: '#0f172a', botCol: '#1e1b4b',
                fogCol: 0x0f172a, fogDensity: 0.0062,
                sunCol: 0x818cf8, sunIntensity: 0.55, sunPos: [-45, 72, -40],
                hemiSky: 0x312e81, hemiGround: 0x111827, hemiIntensity: 0.45,
                exposure: 1.05
            }
        ];

        function createSkyGradientTexture(topC, midC, botC) {
            const c = document.createElement('canvas');
            c.width = 32; c.height = 256;
            const ctx = c.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, 256);
            grad.addColorStop(0.0, topC);
            grad.addColorStop(0.55, midC);
            grad.addColorStop(1.0, botC);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 32, 256);
            return new THREE.CanvasTexture(c);
        }

        function buildSkyAndClouds() {
            const skyGeo = new THREE.SphereGeometry(240, 24, 16);
            const skyMat = new THREE.MeshBasicMaterial({
                map: createSkyGradientTexture(ATMOSPHERES[0].topCol, ATMOSPHERES[0].midCol, ATMOSPHERES[0].botCol),
                side: THREE.BackSide,
                fog: false
            });
            skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
            scene.add(skyDomeMesh);

            // Glowing Sun / Moon Orb in Sky
            sunDiscMesh = new THREE.Mesh(
                new THREE.SphereGeometry(11, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xffedd5, fog: false })
            );
            sunHaloMesh = new THREE.Mesh(
                new THREE.SphereGeometry(19, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.28, fog: false })
            );
            scene.add(sunDiscMesh, sunHaloMesh);

            // 18 Drifting Low-Poly Voxel Clouds
            const cloudMat = new THREE.MeshLambertMaterial({ color: 0xfff7ed, transparent: true, opacity: 0.85 });
            for (let i = 0; i < 18; i++) {
                const cg = new THREE.Group();
                const blocks = 3 + Math.floor(Math.random() * 3);
                for (let b = 0; b < blocks; b++) {
                    const cw = 8 + Math.random() * 10;
                    const ch = 2.5 + Math.random() * 2.5;
                    const cd = 6 + Math.random() * 8;
                    const part = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), cloudMat);
                    part.position.set((b - 1) * 5.5, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 3);
                    cg.add(part);
                }
                cg.position.set((Math.random() - 0.5) * 240, 46 + Math.random() * 24, (Math.random() - 0.5) * 240);
                scene.add(cg);
                skyClouds.push({ mesh: cg, speed: 1.2 + Math.random() * 1.8 });
            }
        }

        window.setAtmosphere = function(idx) {
            currentAtmosphereIdx = idx % ATMOSPHERES.length;
            const atmo = ATMOSPHERES[currentAtmosphereIdx];

            if (skyDomeMesh) {
                skyDomeMesh.material.map = createSkyGradientTexture(atmo.topCol, atmo.midCol, atmo.botCol);
                skyDomeMesh.material.needsUpdate = true;
            }
            scene.fog.color.setHex(atmo.fogCol);
            scene.fog.density = atmo.fogDensity;

            sunLight.color.setHex(atmo.sunCol);
            sunLight.intensity = atmo.sunIntensity;
            sunLight.position.set(...atmo.sunPos);

            if (sunDiscMesh && sunHaloMesh) {
                const sp = new THREE.Vector3(...atmo.sunPos).normalize().multiplyScalar(195);
                sunDiscMesh.position.copy(sp);
                sunHaloMesh.position.copy(sp);
                sunHaloMesh.material.color.setHex(atmo.sunCol);
            }

            hemiLight.color.setHex(atmo.hemiSky);
            hemiLight.groundColor.setHex(atmo.hemiGround);
            hemiLight.intensity = atmo.hemiIntensity;
            renderer.toneMappingExposure = atmo.exposure;

            const badge = document.getElementById('hud-lighting-badge');
            if (badge) badge.textContent = atmo.name;

            for (let i = 0; i < 3; i++) {
                const btn = document.getElementById(`atmo-btn-${i}`);
                if (btn) {
                    btn.className = i === currentAtmosphereIdx
                        ? 'px-2.5 py-1 rounded text-xs font-extrabold bg-amber-500 text-slate-950 cursor-pointer'
                        : 'px-2.5 py-1 rounded text-xs font-extrabold bg-slate-700 text-gray-200 cursor-pointer';
                }
            }
        };

        buildSkyAndClouds();
        setAtmosphere(0); // Default to dramatic Golden Hour Sunset Siege!

        // Map geometry & interactive containers
        const colliders = [];
        const ramps = [];
        const worldMeshes = [];
        const torches = [];
        const jumpPads = [];
        const barrels = [];

        const stoneTexBundle = createStoneBrickTextures();
        const crateTexBundle = createWoodCrateTextures();
        const groundTexBundle = createCourtyardGroundTextures();
        const roofTex = createRoofTileTexture();

        const stoneMat = new THREE.MeshStandardMaterial({
            map: stoneTexBundle.map,
            bumpMap: stoneTexBundle.bumpMap,
            bumpScale: 0.14,
            roughness: 0.85,
            metalness: 0.05
        });
        const darkStoneMat = new THREE.MeshStandardMaterial({
            color: 0x3b404a,
            bumpMap: stoneTexBundle.bumpMap,
            bumpScale: 0.1,
            roughness: 0.88,
            metalness: 0.12
        });
        const roofMat = new THREE.MeshStandardMaterial({
            map: roofTex,
            roughness: 0.75,
            metalness: 0.08
        });
        const crateMat = new THREE.MeshStandardMaterial({
            map: crateTexBundle.map,
            bumpMap: crateTexBundle.bumpMap,
            bumpScale: 0.10,
            roughness: 0.78,
            metalness: 0.08
        });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.85 });
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x4b7a30, roughness: 0.92 });
        const ironMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.82, roughness: 0.32 });

        function addBox(x, y, z, w, h, d, mat, isSolid = true, castShadow = true) {
            let useMat = mat;
            if (mat === stoneMat) {
                const clonedMap = stoneTexBundle.map.clone();
                const clonedBump = stoneTexBundle.bumpMap.clone();
                clonedMap.needsUpdate = true;
                clonedBump.needsUpdate = true;
                const rx = Math.max(1, Math.round(Math.max(w, d) / 6));
                const ry = Math.max(1, Math.round(h / 6));
                clonedMap.repeat.set(rx, ry);
                clonedBump.repeat.set(rx, ry);
                useMat = new THREE.MeshStandardMaterial({
                    map: clonedMap,
                    bumpMap: clonedBump,
                    bumpScale: 0.14,
                    roughness: 0.85,
                    metalness: 0.05
                });
            }
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), useMat);
            mesh.position.set(x, y, z);
            mesh.castShadow = castShadow;
            mesh.receiveShadow = true;
            scene.add(mesh);
            if (isSolid) {
                colliders.push({
                    minX: x - w / 2, maxX: x + w / 2,
                    minY: y - h / 2, maxY: y + h / 2,
                    minZ: z - d / 2, maxZ: z + d / 2
                });
                worldMeshes.push(mesh);
            }
            return mesh;
        }

        function createTorch(x, y, z) {
            // Iron wall bracket + wooden torch + multi-layer glowing flame
            const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.35), ironMat);
            bracket.position.set(x, y - 0.15, z);
            const stick = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.92, 0.20), woodMat);
            stick.position.set(x, y, z);
            const outerFlame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.38), new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.82 }));
            outerFlame.position.set(x, y + 0.58, z);
            const innerCore = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.30, 0.22), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
            innerCore.position.set(x, y + 0.56, z);

            const light = new THREE.PointLight(0xff7b00, 1.35, 18);
            light.position.set(x, y + 0.75, z);
            scene.add(bracket, stick, outerFlame, innerCore, light);
            torches.push({ flame: outerFlame, innerCore, light, basePos: outerFlame.position.clone(), phase: Math.random() * 10 });
        }

        function createSiegeCannon(x, y, z, rotY = 0) {
            const g = new THREE.Group();
            g.position.set(x, y, z);
            g.rotation.y = rotY;
            const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 2.2), woodMat);
            carriage.position.y = 0.45;
            const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.2, 10);
            wheelGeo.rotateZ(Math.PI / 2);
            [[-0.7, 0.45, -0.6], [0.7, 0.45, -0.6], [-0.7, 0.45, 0.6], [0.7, 0.45, 0.6]].forEach(([wx, wy, wz]) => {
                const w = new THREE.Mesh(wheelGeo, darkStoneMat);
                w.position.set(wx, wy, wz);
                g.add(w);
            });
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 2.6, 12), ironMat);
            barrel.rotation.x = Math.PI / 2 - 0.12;
            barrel.position.set(0, 0.95, 0.25);
            barrel.castShadow = true;
            g.add(carriage, barrel);
            scene.add(g);
            // Solid cannon carriage/wheels/barrel: the original geometry was
            // rendered without a physical obstacle, letting players pass through.
            const cos = Math.abs(Math.cos(rotY)), sin = Math.abs(Math.sin(rotY));
            const halfX = cos * 0.95 + sin * 1.65;
            const halfZ = sin * 0.95 + cos * 1.65;
            colliders.push({
                minX: x - halfX, maxX: x + halfX,
                minY: y + 0.04, maxY: y + 1.50,
                minZ: z - halfZ, maxZ: z + halfZ
            });
            // Melee/musket visibility must respect the same real meshes.
            g.traverse(child => {
                if (child.isMesh) worldMeshes.push(child);
            });
        }

        function createJumpPad(x, z) {
            const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 3.2), woodMat);
            base.position.set(x, 0.22, z);
            const padMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
            const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 2.5), padMat);
            top.position.set(x, 0.50, z);
            const ring = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 2.8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
            ring.position.set(x, 0.38, z);
            scene.add(base, top, ring);
            jumpPads.push({ x, z, radius: 1.85, topMesh: top, cooldown: 0 });
        }

        function createExplosiveBarrel(x, y, z) {
            const group = new THREE.Group();
            group.position.set(x, y, z);

            const bodyMat = new THREE.MeshLambertMaterial({ color: 0x991b1b });
            const bandMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
            const topMat = new THREE.MeshLambertMaterial({ color: 0x78350f });

            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.2, 8), bodyMat);
            body.position.y = 1.1;
            body.castShadow = true;

            const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.22, 8), bandMat);
            band1.position.y = 0.55;
            const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.22, 8), bandMat);
            band2.position.y = 1.65;

            const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 8), topMat);
            lid.position.y = 2.21;

            group.add(body, band1, band2, lid);
            scene.add(group);

            const label = document.createElement('div');
            label.className = 'absolute -translate-x-1/2 -translate-y-full pointer-events-none text-[10px] font-black text-amber-300 bg-red-950/85 border border-red-500/60 px-1.5 py-0.5 rounded krunker-text whitespace-nowrap';
            label.innerHTML = '💥 BARUT FIÇISI';
            document.getElementById('world-labels-container').appendChild(label);

            const barrelObj = {
                group,
                pos: new THREE.Vector3(x, y, z),
                hp: 40,
                active: true,
                respawnTimer: 0,
                label
            };
            const barrelIndex = barrels.length;
            group.traverse(c => { if (c.isMesh) c.userData.barrelIndex = barrelIndex; });
            barrels.push(barrelObj);
        }

        function buildCastleArena() {
            const floorMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(110, 110),
                new THREE.MeshStandardMaterial({
                    map: groundTexBundle.map,
                    bumpMap: groundTexBundle.bumpMap,
                    bumpScale: 0.12,
                    roughness: 0.90,
                    metalness: 0.02
                })
            );
            floorMesh.rotation.x = -Math.PI / 2;
            floorMesh.receiveShadow = true;
            scene.add(floorMesh);
            worldMeshes.push(floorMesh);

            addBox(-34, 0.08, 0, 12, 0.16, 76, grassMat, false, false);
            addBox(34, 0.08, 0, 12, 0.16, 76, grassMat, false, false);
            addBox(0, 0.08, -34, 60, 0.16, 12, grassMat, false, false);

            // Stone Courtyard Walkway Slabs & 3D Grass Tufts
            for (let z = -20; z <= 32; z += 4.5) {
                addBox(0, 0.06, z, 4.2, 0.12, 3.4, darkStoneMat, false, false);
            }
            for (let i = 0; i < 36; i++) {
                const gx = (Math.random() < 0.5 ? -34 : 34) + (Math.random() - 0.5) * 9;
                const gz = (Math.random() - 0.5) * 68;
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.35), grassMat);
                blade.position.set(gx, 0.4, gz);
                blade.rotation.y = Math.random() * Math.PI;
                scene.add(blade);
            }

            const arenaHalf = 42;
            const wallH = 7;
            const wallThick = 5;

            // Walkable Castle Walls
            addBox(0, wallH / 2, -arenaHalf, 88, wallH, wallThick, stoneMat, true);
            addBox(0, wallH / 2, arenaHalf, 88, wallH, wallThick, stoneMat, true);
            addBox(-arenaHalf, wallH / 2, 0, wallThick, wallH, 80, stoneMat, true);
            addBox(arenaHalf, wallH / 2, 0, wallThick, wallH, 80, stoneMat, true);

            // Outer guard walls
            addBox(0, wallH + 2.5, -arenaHalf - 2, 92, 5, 1.5, darkStoneMat, true);
            addBox(0, wallH + 2.5, arenaHalf + 2, 92, 5, 1.5, darkStoneMat, true);
            addBox(-arenaHalf - 2, wallH + 2.5, 0, 1.5, 5, 88, darkStoneMat, true);
            addBox(arenaHalf + 2, wallH + 2.5, 0, 1.5, 5, 88, darkStoneMat, true);

            // Merlons
            for (let i = -32; i <= 32; i += 6) {
                addBox(i, wallH + 1.1, -arenaHalf + 2, 3.2, 2.2, 1.2, darkStoneMat, true);
                addBox(i, wallH + 1.1, arenaHalf - 2, 3.2, 2.2, 1.2, darkStoneMat, true);
                addBox(-arenaHalf + 2, wallH + 1.1, i, 1.2, 2.2, 3.2, darkStoneMat, true);
                addBox(arenaHalf - 2, wallH + 1.1, i, 1.2, 2.2, 3.2, darkStoneMat, true);
            }

            // Corner Watchtowers with Pointed Timber/Tile Roofs
            [[-arenaHalf, -arenaHalf], [arenaHalf, -arenaHalf], [-arenaHalf, arenaHalf], [arenaHalf, arenaHalf]].forEach(([cx, cz]) => {
                addBox(cx, 7, cz, 11, 14, 11, stoneMat, true);
                addBox(cx, 14.3, cz, 12.2, 0.8, 12.2, darkStoneMat, false);
                const roof = new THREE.Mesh(new THREE.ConeGeometry(9.8, 6.2, 4), roofMat);
                roof.position.set(cx, 17.6, cz);
                roof.rotation.y = Math.PI / 4;
                roof.castShadow = true;
                scene.add(roof);
            });

            // Central Keep & Iron Portcullis Gatehouse
            addBox(0, 6, -28, 22, 12, 10, stoneMat, true);
            addBox(0, 3.8, -22.8, 6.5, 7.6, 1.2, darkStoneMat, false);
            // Iron Portcullis Bars
            for (let px = -2.4; px <= 2.4; px += 0.8) {
                addBox(px, 3.6, -22.4, 0.16, 7.0, 0.16, ironMat, false, false);
            }
            for (let py = 1.2; py <= 6.2; py += 1.2) {
                addBox(0, py, -22.4, 5.4, 0.16, 0.16, ironMat, false, false);
            }

            addBox(-8, 13.5, -28, 6, 4, 6, stoneMat, true);
            addBox(8, 13.5, -28, 6, 4, 6, stoneMat, true);
            const roofL = new THREE.Mesh(new THREE.ConeGeometry(5.5, 4.5, 4), roofMat);
            roofL.position.set(-8, 17.7, -28); roofL.rotation.y = Math.PI / 4; scene.add(roofL);
            const roofR = new THREE.Mesh(new THREE.ConeGeometry(5.5, 4.5, 4), roofMat);
            roofR.position.set(8, 17.7, -28); roofR.rotation.y = Math.PI / 4; scene.add(roofR);

            // 1600s Siege Cannons on the Keep & Walls
            createSiegeCannon(-15, 7.0, -40, 0);
            createSiegeCannon(15, 7.0, -40, 0);
            createSiegeCannon(0, 12.0, -25, 0);

            // Wooden Siege Ramps
            createRamp(-36.5, 0, 7, 7.5, 16, 'N');
            createRamp(36.5, 0, 7, 7.5, 16, 'S');
            createRamp(15, 0, 7, 16, 7.5, 'W');
            // North-wall access ramp in the gap between crenellations.
            createRamp(-23, 0, 7, 3, 15, 'NN');

            // Central Platform & Crates
            addBox(0, 0.9, 2, 12, 1.8, 12, stoneMat, true);
            addBox(-3.5, 2.9, 2, 3, 2.2, 3, crateMat, true);
            addBox(3.5, 2.9, -1, 3, 2.2, 3, crateMat, true);
            addBox(3.5, 5.1, -1, 2.6, 2.2, 2.6, crateMat, true);

            const cratePositions = [
                [-16, 1.4, -10, 2.8], [-16, 1.4, -6.8, 2.8], [-16, 4.2, -10, 2.6],
                [17, 1.4, -11, 2.8], [14, 1.4, -11, 2.8],
                [-18, 1.4, 15, 2.8], [-15, 1.4, 18, 2.8], [-18, 4.2, 15, 2.5],
                [18, 1.4, 14, 2.8], [18, 1.4, 17.2, 2.8], [18, 4.2, 14, 2.5],
                [0, 1.4, 20, 3.0], [3.2, 1.4, 20, 2.8]
            ];
            cratePositions.forEach(([x, y, z, s]) => addBox(x, y, z, s, 2.8, s, crateMat, true));

            // Royal Heraldic Banners with Golden Trim
            const bannerColors = [0xb91c1c, 0x1d4ed8, 0xd97706];
            for (let i = -20; i <= 20; i += 10) {
                const col = bannerColors[Math.abs(i / 10) % bannerColors.length];
                const bannerMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 });
                const goldTrim = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 });
                addBox(i, 5.2, -39.2, 1.9, 4.0, 0.2, bannerMat, false, false);
                addBox(i, 5.2, -39.1, 0.4, 2.6, 0.22, goldTrim, false, false);
                addBox(i, 5.2, 39.2, 1.9, 4.0, 0.2, bannerMat, false, false);
                addBox(i, 5.2, 39.1, 0.4, 2.6, 0.22, goldTrim, false, false);
            }

            // Multi-layered Trees
            [[-28, -18], [28, -18], [-28, 22], [28, 22]].forEach(([tx, tz]) => {
                addBox(tx, 2.5, tz, 1.4, 5, 1.4, woodMat, true);
                addBox(tx, 6.0, tz, 5.8, 3.6, 5.8, grassMat, false);
                addBox(tx, 8.6, tz, 4.2, 2.8, 4.2, grassMat, false);
                addBox(tx, 10.6, tz, 2.4, 2.0, 2.4, grassMat, false);
            });

            // Flickering Wall Torches
            [[-10, 4.5, -22.5], [10, 4.5, -22.5], [-20, 4.5, -39], [20, 4.5, -39], [-20, 4.5, 39], [20, 4.5, 39], [-5.5, 2.6, 2], [5.5, 2.6, 2]].forEach(([tx, ty, tz]) => {
                createTorch(tx, ty, tz);
            });

            // Courtyard Siege Jump Pads (Launch onto walls/central keep)
            createJumpPad(-22, 2);
            createJumpPad(22, 2);
            createJumpPad(0, -14);

            // Explosive 1600s Gunpowder Barrels
            [
                [-9, 0, -6],
                [10, 0, -5],
                [-11, 0, 12],
                [11, 0, 12],
                [0, 1.8, 5],
                [-2, 0, -19]
            ].forEach(([bx, by, bz]) => createExplosiveBarrel(bx, by, bz));
        }

        function createRamp(cx, startY, endY, w, d, dir) {
            const steps = 10;
            for (let i = 0; i < steps; i++) {
                const t = (i + 1) / steps;
                const h = startY + (endY - startY) * t;
                if (dir === 'N') {
                    const sz = d / steps;
                    const z = (cx < 0 ? 3 : -4) + (d / 2) - (i + 0.5) * sz;
                    addBox(cx, h / 2, z, w, h, sz, woodMat, false);
                } else if (dir === 'S') {
                    const sz = d / steps;
                    const z = -7 - (d / 2) + (i + 0.5) * sz;
                    addBox(cx, h / 2, z, w, h, sz, woodMat, false);
                } else if (dir === 'NN') {
                    const sz = d / steps;
                    const z = -25 - (i + 0.5) * sz;
                    const northHeight = Math.min(endY, h * steps / 9);
                    addBox(cx, northHeight / 2, z, w, northHeight, sz, woodMat, false);
                } else if (dir === 'W') {
                    const sx = w / steps;
                    const x = cx + (w / 2) - (i + 0.5) * sx;
                    addBox(x, h / 2, endY > 0 ? 36.5 : 0, sx, h, d, woodMat, false);
                }
            }
            if (dir === 'N') {
                ramps.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: 3 - d / 2, maxZ: 3 + d / 2, startY, endY, dir: 'N' });
            } else if (dir === 'S') {
                ramps.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: -7 - d / 2, maxZ: -7 + d / 2, startY, endY, dir: 'S' });
            } else if (dir === 'NN') {
                ramps.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: -40, maxZ: -25, startY, endY, dir: 'NN' });
            } else if (dir === 'W') {
                ramps.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: 36.5 - d / 2, maxZ: 36.5 + d / 2, startY, endY, dir: 'W' });
            }
        }

        buildCastleArena();

        // ============================================================================
        // 5. FIRST-PERSON 3D WEAPON VIEWMODELS v4.0 REALISTIC (Forged Steel, Walnut & Flintlock)
        // ============================================================================
        const weaponHolder = new THREE.Group();
        camera.add(weaponHolder);
        scene.add(camera);

        const viewmodels = [];
        // Invisible model-tip anchors for real-geometry calibration in desktop QA.
        const visualWeaponTipMarkers = [];
        const visualWeaponGripMarkers = [];
        let leftShieldGroup = null;
        let bowArrowMesh = null;
        let bowStringMesh = null;
        let musketHammerMesh = null;
        let musketRamrodMesh = null;
        let quickDaggerGroup = null;
        let meleeSlashTrailMesh = null;

        const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.58, metalness: 0.05 });
        const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.35, roughness: 0.55 });
        const steelMat = new THREE.MeshStandardMaterial({
            map: armorPlateBundle.map,
            bumpMap: armorPlateBundle.bumpMap,
            bumpScale: 0.03,
            color: 0xffffff,
            metalness: 0.92,
            roughness: 0.16
        });
        const gunmetalMat = new THREE.MeshStandardMaterial({
            map: armorPlateBundle.map,
            bumpMap: armorPlateBundle.bumpMap,
            bumpScale: 0.04,
            color: 0x9ca3af,
            metalness: 0.90,
            roughness: 0.24
        });
        const darkSteelMat = new THREE.MeshStandardMaterial({
            bumpMap: armorPlateBundle.bumpMap,
            bumpScale: 0.04,
            color: 0x4b5563,
            metalness: 0.88,
            roughness: 0.28
        });
        const goldMat = new THREE.MeshStandardMaterial({
            bumpMap: armorPlateBundle.bumpMap,
            bumpScale: 0.02,
            color: 0xfbbf24,
            metalness: 0.88,
            roughness: 0.20
        });
        const rubyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.25, roughness: 0.08, emissive: 0x450a0a });
        const darkWoodMat = new THREE.MeshStandardMaterial({
            map: walnutTexBundle.map,
            bumpMap: walnutTexBundle.bumpMap,
            bumpScale: 0.05,
            roughness: 0.52,
            metalness: 0.06
        });
        const redShieldMat = new THREE.MeshStandardMaterial({
            map: heraldicShieldTex,
            bumpMap: armorPlateBundle.bumpMap,
            bumpScale: 0.04,
            roughness: 0.38,
            metalness: 0.35
        });
        const ornateArmorMat = new THREE.MeshStandardMaterial({
            map: armorPlateBundle.map,
            bumpMap: armorPlateBundle.bumpMap,
            bumpScale: 0.06,
            metalness: 0.90,
            roughness: 0.20
        });
        const chainmailMat = new THREE.MeshStandardMaterial({
            map: chainmailTex,
            bumpMap: chainmailTex,
            bumpScale: 0.08,
            metalness: 0.78,
            roughness: 0.42
        });

        function createDetailedFirstPersonArm(sleeveColor = 0x7f1d1d, isLeft = false) {
            const armGroup = new THREE.Group();
            const puffMat = new THREE.MeshStandardMaterial({ color: sleeveColor, roughness: 0.68 });

            // Anatomical tapered upper sleeve with 1600s gold slash puffs
            const upperSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.34, 12), puffMat);
            upperSleeve.rotation.x = Math.PI / 2;
            upperSleeve.position.set(0, 0, 0.14);

            const elbowCouter = new THREE.Mesh(new THREE.SphereGeometry(0.078, 12, 10), ornateArmorMat);
            elbowCouter.scale.set(1.0, 0.85, 1.15);
            elbowCouter.position.set(0, 0, -0.01);

            // Sculpted Steel Vambrace (Tapered Forearm Tube) + Brass Hinged Cuff
            const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.072, 0.26, 14), ornateArmorMat);
            bracer.rotation.x = Math.PI / 2;
            bracer.position.set(0, 0, -0.14);

            const cuffRing = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 8, 16), goldMat);
            cuffRing.position.set(0, 0, -0.02);

            const wristRing = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.010, 8, 16), goldMat);
            wristRing.position.set(0, 0, -0.26);

            // Articulated Steel Gauntlet & Individual Curled Fingers
            const handPalm = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.058, 0.11, 10), darkSteelMat);
            handPalm.rotation.x = Math.PI / 2;
            handPalm.scale.set(1.15, 0.82, 1.0);
            handPalm.position.set(0, 0.005, -0.32);

            const knucklePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 8), goldMat);
            knucklePlate.rotation.z = Math.PI / 2;
            knucklePlate.position.set(0, 0.052, -0.36);

            for (let f = -1.5; f <= 1.5; f += 1.0) {
                const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.085, 8), steelMat);
                finger.position.set(f * 0.028, -0.012, -0.39);
                finger.rotation.x = 0.45;
                armGroup.add(finger);
            }
            const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.08, 8), steelMat);
            thumb.position.set(isLeft ? 0.058 : -0.058, 0.022, -0.34);
            thumb.rotation.set(0.3, 0, isLeft ? -0.5 : 0.5);

            armGroup.add(upperSleeve, elbowCouter, bracer, cuffRing, wristRing, handPalm, knucklePlate, thumb);
            return armGroup;
        }

        function buildViewmodels() {
            // [0] KNIGHT: REALISTIC FORGED ARMING SWORD / RAPIER-HILT BROADSWORDS (Right) + CURVED HEATER SHIELD (Left)
            const swordGroup = new THREE.Group();
            const rightArm0 = createDetailedFirstPersonArm(0x991b1b, false);
            rightArm0.position.set(0.34, -0.26, -0.26);

            // Ribbed leather & gold wire-wrapped grip
            const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.030, 0.25, 12), darkWoodMat);
            hilt.position.set(0.34, -0.18, -0.64);
            for (let r = -0.08; r <= 0.08; r += 0.04) {
                const wireRing = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.004, 6, 12), goldMat);
                wireRing.rotation.x = Math.PI / 2;
                wireRing.position.set(0.34, -0.18 + r, -0.64);
                swordGroup.add(wireRing);
            }
            // Faceted pear-shaped steel & gold pommel
            const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), goldMat);
            pommel.scale.set(1.0, 1.25, 1.0);
            pommel.position.set(0.34, -0.33, -0.64);

            // Swept S-Quillon Crossguard + Side-Ring Guard + Ruby Center Block
            const guardCenter = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.08), goldMat);
            guardCenter.position.set(0.34, -0.05, -0.64);
            const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), rubyMat);
            gem.position.set(0.34, -0.05, -0.595);
            const quillonBar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.42, 10), goldMat);
            quillonBar.rotation.z = Math.PI / 2;
            quillonBar.position.set(0.34, -0.05, -0.64);
            const sideRingGuard = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.010, 8, 16), goldMat);
            sideRingGuard.position.set(0.34, -0.05, -0.60);

            // Diamond-cross-section Forged Steel Blade (4-sided cylinder gives realistic sharp edges & central ridge!)
            const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.052, 1.18, 4), steelMat);
            blade.scale.set(1.0, 1.0, 0.28);
            blade.rotation.y = Math.PI / 4;
            blade.position.set(0.34, 0.56, -0.64);

            // Deep Metallic Fuller (Blood groove) & Ricasso collar
            const ricasso = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.14, 8), darkSteelMat);
            ricasso.scale.set(1.0, 1.0, 0.35);
            ricasso.position.set(0.34, 0.04, -0.64);
            const fuller = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.78, 8), goldMat);
            fuller.scale.set(1.0, 1.0, 0.45);
            fuller.position.set(0.34, 0.42, -0.64);

            // Left-hand Curved Knight Heater Shield + Left Armored Gauntlet
            leftShieldGroup = new THREE.Group();
            const leftArm0 = createDetailedFirstPersonArm(0x991b1b, true);
            leftArm0.position.set(0.06, -0.08, 0.24);
            const shieldBoard = new THREE.Mesh(
                new THREE.CylinderGeometry(0.38, 0.26, 0.68, 16, 1, false, -Math.PI * 0.32, Math.PI * 0.64),
                redShieldMat
            );
            shieldBoard.scale.set(1.0, 1.0, 0.35);
            const shieldRimTop = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.022, 8, 16, Math.PI * 0.72), goldMat);
            shieldRimTop.rotation.x = Math.PI / 2;
            shieldRimTop.rotation.z = Math.PI * 0.14;
            shieldRimTop.position.set(0, 0.34, 0.02);
            const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), goldMat);
            shieldBoss.scale.set(1.0, 1.0, 0.55);
            shieldBoss.position.set(0, 0.04, 0.13);
            leftShieldGroup.add(leftArm0, shieldBoard, shieldRimTop, shieldBoss);
            leftShieldGroup.position.set(-0.42, -0.24, -0.58);
            leftShieldGroup.rotation.y = 0.35;

            swordGroup.add(rightArm0, hilt, pommel, guardCenter, gem, quillonBar, sideRingGuard, ricasso, blade, fuller, leftShieldGroup);
            const swordVisualTip = new THREE.Object3D();
            swordVisualTip.position.set(0.34, 1.15, -0.64);
            swordGroup.add(swordVisualTip);
            visualWeaponTipMarkers[0] = swordVisualTip;
            const swordVisualGrip = new THREE.Object3D();
            swordVisualGrip.position.set(0.34, -0.05, -0.64);
            swordGroup.add(swordVisualGrip);
            visualWeaponGripMarkers[0] = swordVisualGrip;
            swordGroup.rotation.set(-0.22, -0.12, 0.08);
            weaponHolder.add(swordGroup);
            viewmodels.push(swordGroup);

            // [1] PIKEMAN: REALISTIC 1600s TERCIO HALBERD / PARTISAN POLEARM
            const spearGroup = new THREE.Group();
            const rightArm1 = createDetailedFirstPersonArm(0x1d4ed8, false);
            rightArm1.position.set(0.32, -0.24, -0.26);
            const leftArm1 = createDetailedFirstPersonArm(0x1d4ed8, true);
            leftArm1.position.set(0.14, -0.22, -0.68);
            leftArm1.rotation.y = -0.38;

            // Octagonal Ash Wood Pole + Steel Langets + Silk Tassel
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 2.35, 8), darkWoodMat);
            shaft.rotation.x = Math.PI / 2;
            shaft.position.set(0.32, -0.20, -0.98);
            const gripWrap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.48, 12), goldMat);
            gripWrap1.rotation.x = Math.PI / 2;
            gripWrap1.position.set(0.32, -0.20, -1.08);
            const socketCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.030, 0.22, 12), ornateArmorMat);
            socketCollar.rotation.x = Math.PI / 2;
            socketCollar.position.set(0.32, -0.20, -1.86);
            const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.18, 12), rubyMat);
            tassel.rotation.x = Math.PI / 2;
            tassel.position.set(0.32, -0.20, -1.74);

            // Curved Crescent Halberd Axe Blade + Rear Armor-Piercing Beak (Fluke) + Long Diamond Spike
            const halberdAxe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.018, 16, 1, false, 0, Math.PI * 0.65), steelMat);
            halberdAxe.rotation.z = Math.PI / 2;
            halberdAxe.position.set(0.36, -0.20, -1.96);
            const rearFluke = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 4), steelMat);
            rearFluke.rotation.z = Math.PI / 2 + 0.35;
            rearFluke.position.set(0.20, -0.20, -1.96);
            const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.052, 0.62, 4), steelMat);
            tip.scale.set(1.0, 1.0, 0.42);
            tip.rotation.x = -Math.PI / 2;
            tip.position.set(0.32, -0.20, -2.28);

            spearGroup.add(rightArm1, leftArm1, shaft, gripWrap1, socketCollar, tassel, halberdAxe, rearFluke, tip);
            const spearVisualTip = new THREE.Object3D();
            spearVisualTip.position.set(0.32, -0.20, -2.59);
            spearGroup.add(spearVisualTip);
            visualWeaponTipMarkers[1] = spearVisualTip;
            const spearVisualGrip = new THREE.Object3D();
            spearVisualGrip.position.set(0.32, -0.20, -0.64);
            spearGroup.add(spearVisualGrip);
            visualWeaponGripMarkers[1] = spearVisualGrip;
            weaponHolder.add(spearGroup);
            viewmodels.push(spearGroup);

            // [2] ARCHER: COMPOSITE RECURVE LONGBOW & BODKIN ARROW
            const bowGroup = new THREE.Group();
            const leftBowArm = createDetailedFirstPersonArm(0x15803d, true);
            leftBowArm.position.set(0.26, -0.22, -0.32);

            const bowRiser = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.32, 12), goldMat);
            bowRiser.position.set(0.26, -0.12, -0.68);
            const bowUpperLimb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.025, 0.46, 10), darkWoodMat);
            bowUpperLimb.position.set(0.26, 0.23, -0.61);
            bowUpperLimb.rotation.x = -0.36;
            const bowUpperTip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.16, 8), goldMat);
            bowUpperTip.position.set(0.26, 0.46, -0.56);
            bowUpperTip.rotation.x = 0.22; // Recurve horn tip!

            const bowLowerLimb = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.014, 0.46, 10), darkWoodMat);
            bowLowerLimb.position.set(0.26, -0.47, -0.61);
            bowLowerLimb.rotation.x = 0.36;
            const bowLowerTip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.008, 0.16, 8), goldMat);
            bowLowerTip.position.set(0.26, -0.70, -0.56);
            bowLowerTip.rotation.x = -0.22;

            bowStringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.08, 6), steelMat);
            bowStringMesh.position.set(0.26, -0.12, -0.52);

            bowArrowMesh = new THREE.Group();
            const aShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.88, 8), darkWoodMat);
            aShaft.rotation.x = Math.PI / 2;
            const aTip = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.16, 4), steelMat);
            aTip.rotation.x = -Math.PI / 2;
            aTip.position.z = -0.48;
            for (let v = 0; v < 3; v++) {
                const vane = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.048, 0.15), rubyMat);
                vane.rotation.z = (v * Math.PI * 2) / 3;
                vane.position.z = 0.34;
                bowArrowMesh.add(vane);
            }
            bowArrowMesh.add(aShaft, aTip);
            bowArrowMesh.position.set(0.24, -0.12, -0.68);

            bowGroup.add(leftBowArm, bowRiser, bowUpperLimb, bowUpperTip, bowLowerLimb, bowLowerTip, bowStringMesh, bowArrowMesh);
            bowGroup.rotation.z = 0.18;
            weaponHolder.add(bowGroup);
            viewmodels.push(bowGroup);

            // [3] MUSKETEER: ULTRA-DETAILED 1600 FLINTLOCK MUSKET (Octagonal-to-round barrel, Flash Pan, Frizzen, S-Hammer & Flint, Trigger Guard)
            const musketGroup = new THREE.Group();
            const rightArm3 = createDetailedFirstPersonArm(0x78350f, false);
            rightArm3.position.set(0.26, -0.29, -0.22);
            const leftSupportArm3 = createDetailedFirstPersonArm(0x78350f, true);
            leftSupportArm3.position.set(0.15, -0.25, -0.62);
            leftSupportArm3.rotation.y = -0.32;

            // 1. Sculpted Walnut Fore-stock & Curved 1600s Fishtail Buttstock
            const foreStock = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.046, 0.92, 10), darkWoodMat);
            foreStock.rotation.x = Math.PI / 2;
            foreStock.scale.set(1.0, 1.0, 1.15);
            foreStock.position.set(0.26, -0.19, -0.82);

            const wristGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.28, 10), darkWoodMat);
            wristGrip.rotation.x = Math.PI / 2 - 0.24;
            wristGrip.position.set(0.26, -0.22, -0.30);

            const buttStock = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.068, 0.36, 10), darkWoodMat);
            buttStock.rotation.x = Math.PI / 2 - 0.18;
            buttStock.scale.set(0.72, 1.0, 1.35);
            buttStock.position.set(0.26, -0.27, -0.06);

            const brassButtplate = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.068, 0.04, 10), goldMat);
            brassButtplate.rotation.x = Math.PI / 2 - 0.18;
            brassButtplate.scale.set(0.74, 1.0, 1.36);
            brassButtplate.position.set(0.26, -0.30, 0.11);

            const stockFiligree = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.032, 0.28), goldMat);
            stockFiligree.position.set(0.26, -0.20, -0.45);

            // 2. Forged Octagonal Breech + Round Tapered Steel Barrel + Hollow Muzzle Bore
            const breechOctagon = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.045, 0.48, 8), gunmetalMat);
            breechOctagon.rotation.x = Math.PI / 2;
            breechOctagon.position.set(0.26, -0.14, -0.52);

            const roundBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.039, 0.88, 16), steelMat);
            roundBarrel.rotation.x = Math.PI / 2;
            roundBarrel.position.set(0.26, -0.14, -1.16);

            const muzzleFlare = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.033, 0.07, 16), goldMat);
            muzzleFlare.rotation.x = Math.PI / 2;
            muzzleFlare.position.set(0.26, -0.14, -1.58);

            const muzzleBore = new THREE.Mesh(
                new THREE.CylinderGeometry(0.026, 0.026, 0.04, 14),
                new THREE.MeshBasicMaterial({ color: 0x050505 })
            );
            muzzleBore.rotation.x = Math.PI / 2;
            muzzleBore.position.set(0.26, -0.14, -1.60);

            // 3. Brass Barrel Bands & Sights
            [-0.78, -1.12, -1.44].forEach(bz => {
                const band = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.046, 0.045, 12), goldMat);
                band.rotation.x = Math.PI / 2;
                band.scale.set(1.0, 1.0, 1.25);
                band.position.set(0.26, -0.165, bz);
                musketGroup.add(band);
            });

            const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.026, 0.04), goldMat);
            rearSight.position.set(0.26, -0.095, -0.44);
            const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.042, 0.03), goldMat);
            frontSight.position.set(0.26, -0.098, -1.54);

            // 4. Authentic 1600s Flintlock Mechanism (Lockplate, Flash Pan, Frizzen & S-Hammer holding Flint)
            const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.065, 0.26), ornateArmorMat);
            lockPlate.position.set(0.21, -0.16, -0.46);

            const flashPan = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.020, 0.035, 10), goldMat);
            flashPan.position.set(0.19, -0.14, -0.50);

            const frizzenSteel = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.095, 0.045), steelMat);
            frizzenSteel.position.set(0.19, -0.095, -0.52);
            frizzenSteel.rotation.x = 0.25;

            // Animated S-Curved Flintlock Hammer Group (Cock + Jaws + Real Flint Stone)
            musketHammerMesh = new THREE.Group();
            musketHammerMesh.position.set(0.195, -0.15, -0.43);
            const hammerNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.11, 8), goldMat);
            hammerNeck.position.set(0, 0.05, 0);
            const hammerJaws = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.032, 0.058), darkSteelMat);
            hammerJaws.position.set(0, 0.095, -0.02);
            const flintStone = new THREE.Mesh(
                new THREE.ConeGeometry(0.018, 0.048, 4),
                new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 })
            );
            flintStone.rotation.x = -Math.PI / 2;
            flintStone.position.set(0, 0.095, -0.055);
            musketHammerMesh.add(hammerNeck, hammerJaws, flintStone);

            // 5. Brass Trigger Guard & Curved Trigger
            const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.008, 8, 14, Math.PI), goldMat);
            triggerGuard.rotation.y = Math.PI / 2;
            triggerGuard.rotation.x = Math.PI;
            triggerGuard.position.set(0.26, -0.23, -0.38);

            const triggerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.008, 0.045, 6), steelMat);
            triggerMesh.rotation.x = 0.35;
            triggerMesh.position.set(0.26, -0.235, -0.38);

            // 6. Cylindrical Ramrod with Brass Tip (Animated during Reload!)
            musketRamrodMesh = new THREE.Group();
            const rodShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 1.18, 8), darkSteelMat);
            rodShaft.rotation.x = Math.PI / 2;
            const rodBrassTip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.011, 0.08, 10), goldMat);
            rodBrassTip.rotation.x = Math.PI / 2;
            rodBrassTip.position.z = -0.58;
            musketRamrodMesh.add(rodShaft, rodBrassTip);
            musketRamrodMesh.position.set(0.26, -0.20, -0.92);

            musketGroup.add(
                rightArm3, leftSupportArm3,
                foreStock, wristGrip, buttStock, brassButtplate, stockFiligree,
                breechOctagon, roundBarrel, muzzleFlare, muzzleBore,
                rearSight, frontSight,
                lockPlate, flashPan, frizzenSteel, musketHammerMesh,
                triggerGuard, triggerMesh, musketRamrodMesh
            );
            weaponHolder.add(musketGroup);
            viewmodels.push(musketGroup);

            // Secondary Quick Melee Poignard / Bayonet Dagger (Shown on [F] / [V] slash)
            quickDaggerGroup = new THREE.Group();
            const dHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.024, 0.22, 10), darkWoodMat);
            dHandle.rotation.x = Math.PI / 2;
            const dPommel = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), goldMat);
            dPommel.position.z = 0.11;
            const dGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.20, 8), goldMat);
            dGuard.rotation.z = Math.PI / 2;
            dGuard.position.z = -0.11;
            const dBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.032, 0.54, 4), steelMat);
            dBlade.scale.set(1.0, 1.0, 0.35);
            dBlade.rotation.x = -Math.PI / 2;
            dBlade.position.z = -0.38;
            quickDaggerGroup.add(dHandle, dPommel, dGuard, dBlade);
            quickDaggerGroup.position.set(-0.2, -0.22, -0.4);
            quickDaggerGroup.visible = false;
            weaponHolder.add(quickDaggerGroup);

            // Glowing First-Person Sword / Spear Slash Arc Trail
            const arcGeo = new THREE.RingGeometry(0.55, 0.92, 16, 1, 0, Math.PI * 0.85);
            const arcMat = new THREE.MeshBasicMaterial({
                color: 0xfef08a,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.0
            });
            meleeSlashTrailMesh = new THREE.Mesh(arcGeo, arcMat);
            meleeSlashTrailMesh.position.set(0, -0.05, -1.05);
            meleeSlashTrailMesh.rotation.x = Math.PI / 2.2;
            weaponHolder.add(meleeSlashTrailMesh);
        }
        buildViewmodels();

        // ============================================================================
        // 6. PLAYER STATE & KRUNKER SLIDE-HOPPING / ABILITY MECHANICS
        // ============================================================================
        // Declared before initial selectClass(3) to avoid pre-init TDZ.
        let arenaClock = 0;
        const player = {
            pos: new THREE.Vector3(0, 2.5, 28),
            vel: new THREE.Vector3(0, 0, 0),
            yaw: 0,
            pitch: 0,
            standHeight: 2.35,
            crouchHeight: 1.35,
            currentHeight: 2.35,
            radius: 0.75,
            onGround: false,
            isSliding: false,
            isThirdPerson: false,
            walkCycle: 0,
            // TPS pose is visual-only; movement/collisions stay in player physics.
            tpsMotionState: ArenaCharacterMotion.createState(),
            hp: 100,
            maxHp: 100,
            classIdx: 3, // Starts as 1600 Musketeer
            ammo: 1,
            isReloading: false,
            reloadTimer: 0,
            attackCooldown: 0,
            attackAnimTime: 0,
            comboStep: 0,
            // Bow drawing
            isDrawingBow: false,
            bowCharge: 0,
            // Persistent across mid-round class switches: switching cannot reload early.
            lastBowShotAt: -Infinity,
            lastMusketShotAt: -Infinity,
            // Right-Click / Secondary Ability States
            isRMBDown: false,
            isShielding: false,
            shieldParryTime: 0,
            shieldParryCooldown: 0,
            parries: 0,
            abilityCooldown: 0,
            quickMeleeTime: 0,
            // Camera Feel (Sway & Shake)
            swayX: 0,
            swayY: 0,
            shakeIntensity: 0,
            weaponKick: 0,
            weaponTilt: 0,
            cameraImpactPitch: 0,
            cameraImpactYaw: 0,
            // Stats
            kills: 0,
            deaths: 0,
            streak: 0,
            bhopChain: 0
        };

        const keys = {};
        let activeWeaponSwing = null;
        let lastWeaponSwingRaycasts = 0;
        let isGameActive = false;
        let mouseSensitivity = 1.0;
        let playerCharGroup = null;
        const playerClassModels = [];

        window.toggleThirdPerson = function() {
            player.isThirdPerson = !player.isThirdPerson;
            player.tpsMotionState = ArenaCharacterMotion.createState();
            weaponHolder.visible = !player.isThirdPerson;
            if (playerCharGroup) {
                playerCharGroup.visible = player.isThirdPerson;
            }
            const statusEl = document.getElementById('hud-status-badge');
            if (statusEl) {
                statusEl.textContent = player.isThirdPerson ? '🎥 3. ŞAHIS (TPS)' : 'HAZIR';
            }
        };

        window.selectClass = function(idx) {
            activeWeaponSwing = null;
            player.tpsMotionState = ArenaCharacterMotion.createState();
            player.classIdx = idx;
            const cls = CLASSES[idx];
            player.maxHp = cls.maxHp;
            player.hp = cls.maxHp;
            player.isReloading = false;
            player.reloadTimer = 0;
            // Per-weapon shot stamps enforce 4/15s even after class switching.
            player.attackCooldown = 0;
            player.isDrawingBow = false;
            player.bowCharge = 0;
            player.isShielding = false;
            player.shieldParryTime = 0;
            player.shieldParryCooldown = 0;
            player.ammo = ArenaWeaponBalance.ready(player.lastMusketShotAt, arenaClock, 'musket') ? 1 : 0;
            if (idx === 3 && player.ammo === 0) {
                player.isReloading = true;
                player.reloadTimer = Math.max(0, ArenaWeaponBalance.SHOT_INTERVAL.musket -
                    (arenaClock - player.lastMusketShotAt));
            }

            document.getElementById('reload-indicator').classList.add('hidden');
            document.getElementById('bow-charge-ui').classList.add('hidden');
            document.getElementById('shield-overlay').style.opacity = '0';
            document.getElementById('ads-overlay').style.opacity = '0';

            for (let i = 0; i < 4; i++) {
                const card = document.getElementById(`card-class-${i}`);
                if (card) card.classList.toggle('selected', i === idx);
                const pill = document.getElementById(`pill-${i + 1}`);
                if (pill) {
                    pill.className = i === idx
                        ? 'hud-box px-2.5 py-1 rounded text-xs sm:text-sm font-bold krunker-text border-amber-400 bg-amber-500/25'
                        : 'hud-box px-2.5 py-1 rounded text-xs sm:text-sm font-bold krunker-text opacity-70';
                }
                if (viewmodels[i]) viewmodels[i].visible = (i === idx);
                if (playerClassModels[i]) playerClassModels[i].visible = (i === idx);
            }
            updateHUD();
        };

        function updateHUD() {
            const cls = CLASSES[player.classIdx];
            document.getElementById('hud-hp-text').textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
            const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
            const hpBar = document.getElementById('hud-hp-bar');
            hpBar.style.width = `${hpPct}%`;
            hpBar.className = `h-full transition-all duration-150 ${hpPct > 55 ? 'bg-lime-400' : hpPct > 25 ? 'bg-amber-400' : 'bg-rose-500'}`;

            document.getElementById('hud-class-name').textContent = cls.name;
            document.getElementById('hud-class-tip').textContent = cls.tipText;
            document.getElementById('hud-weapon-icon').innerHTML = cls.svgIcon;

            if (cls.id === 3) {
                document.getElementById('hud-ammo').textContent = player.isReloading
                    ? 'BARUT DOLDURULUYOR...'
                    : `${player.ammo} / 1 (BARUT)`;
            } else {
                document.getElementById('hud-ammo').textContent = cls.ammoText;
            }

            // Ability status badge
            const abilBadge = document.getElementById('hud-ability-badge');
            if (player.abilityCooldown > 0) {
                abilBadge.textContent = `YETENEK DOLUYOR: ${player.abilityCooldown.toFixed(1)}s`;
                abilBadge.className = 'text-[11px] font-extrabold bg-slate-800 text-gray-400 border border-white/10 px-2 py-0.5 rounded krunker-text';
            } else {
                const labels = [
                    '[SAĞ TIK] KALKAN / [F] ÇARPMA',
                    '[SAĞ TIK / F] KARGI HÜCUMU: HAZIR',
                    '[SOL TIK BASILI] YAY GERME / [F] HANÇER',
                    '[F] SÜNGÜ / HANÇER DARBESİ: HAZIR'
                ];
                abilBadge.textContent = labels[player.classIdx];
                abilBadge.className = 'text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded krunker-text';
            }

            document.getElementById('hud-kills').textContent = player.kills;
            document.getElementById('hud-deaths').textContent = player.deaths;
            document.getElementById('hud-streak').textContent = player.streak;
        }

        selectClass(3);

        // ============================================================================
        // 7. DISTINCT AI MEDIEVAL BOTS v2.0 (Knights, Pikemen, Tower Archers, Musketeers)
        // ============================================================================
        const BOT_PROFILES = [
            { name: 'Şövalye_34', role: 'knight', weapon: 'Kılıç & Kalkan', color: 0xb91c1c, range: 3.9, speed: 9.8, damage: 20, preferWall: false },
            { name: 'Ahmet_1600', role: 'musket', weapon: 'Tüfek', color: 0x78350f, range: 34.0, speed: 7.4, damage: 90, preferWall: true },
            { name: 'Mızraklı_Kurt', role: 'pikeman', weapon: 'Kargı', color: 0x1d4ed8, range: 5.8, speed: 10.4, damage: 35, preferWall: false },
            { name: 'Okçu_Reis', role: 'archer', weapon: 'Uzun Yay', color: 0x15803d, range: 32.0, speed: 8.2, damage: 23, preferWall: true },
            { name: 'Kara_Şövalye', role: 'knight', weapon: 'Çelik Kılıç', color: 0x374151, range: 3.9, speed: 9.5, damage: 20, preferWall: false },
            { name: 'Yeniçeri_Ali', role: 'musket', weapon: 'Tüfek', color: 0x991b1b, range: 30.0, speed: 7.8, damage: 90, preferWall: false }
        ];

        const COURTYARD_SPAWNS = [
            new THREE.Vector3(-24, 2, -20),
            new THREE.Vector3(24, 2, -20),
            new THREE.Vector3(-25, 2, 20),
            new THREE.Vector3(25, 2, 20),
            new THREE.Vector3(0, 2, -16)
        ];

        const RAMPART_SPAWNS = [
            new THREE.Vector3(-39, 9, -10),
            new THREE.Vector3(39, 9, 10),
            new THREE.Vector3(0, 9, 40),
            new THREE.Vector3(-18, 9, -40),
            new THREE.Vector3(18, 9, -40)
        ];

        // A* grid built once from the castle's existing collision geometry and ramps.
        const navigator = ArenaNavigation.createNavigator(colliders, ramps,
            { min: -43.75, max: 43.75, step: 1.25, upperEdge: 39.5, upperLevel: 7 });
        const bots = [];
        // Use the known level-design spawn pool, but prefer locations away from living fighters.
        function chooseArenaRespawn(pool, excludedBot = null, includePlayer = true) {
            const threats = bots.filter(other => other !== excludedBot && !other.dead)
                .map(other => other.mesh.position);
            if (includePlayer && isGameActive) threats.push(player.pos);
            const preferred = ArenaSpawnSafety.chooseSpawn(pool, threats);
            // Use the nearest valid point so a new fighter cannot spawn in battlements.
            const cell = navigator.nearest(preferred);
            return cell ? new THREE.Vector3(cell.x, cell.y, cell.z) : preferred;
        }
        const flyingHelmets = [];
        const worldLabelsContainer = document.getElementById('world-labels-container');

        function createBotMesh(profile) {
            const group = new THREE.Group();

            const tunicMat = new THREE.MeshStandardMaterial({ color: profile.color, roughness: 0.62 });
            const secondaryClothMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72 });
            const leatherMat = new THREE.MeshStandardMaterial({
                map: walnutTexBundle.map,
                bumpMap: walnutTexBundle.bumpMap,
                bumpScale: 0.04,
                color: 0x7c4722,
                roughness: 0.58
            });
            const buffLeatherMat = new THREE.MeshStandardMaterial({
                bumpMap: walnutTexBundle.bumpMap,
                bumpScale: 0.03,
                color: 0xc2874e,
                roughness: 0.64
            });
            const bootMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.55, metalness: 0.12 });
            const plumeMat = new THREE.MeshStandardMaterial({ color: profile.color, roughness: 0.42 });
            const whiteFeatherMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
            const hairBeardMat = new THREE.MeshStandardMaterial({
                color: profile.role === 'musket' ? 0x1c1917 : 0x3b2313,
                roughness: 0.75
            });
            const skinMatChar = new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.55 });
            const faceFrontMat = new THREE.MeshStandardMaterial({
                map: charFaceTextures[profile.role] || charFaceTextures.knight,
                roughness: 0.52
            });

            // ---------------- 1. ANATOMICAL ARTICULATED LEGS (Tapered Thighs, Winged Knee Poleyns, Greaves & Spurs) ----------------
            function buildArticulatedLeg(isLeft) {
                const legGroup = new THREE.Group();
                legGroup.position.set(isLeft ? -0.26 : 0.26, 1.0, 0);

                // Tapered Upper Thigh (1600s Breeches or Plate Cuisse)
                const isArmoredLeg = profile.role === 'knight' || profile.role === 'pikeman';
                const thigh = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.21, 0.17, 0.48, 12),
                    isArmoredLeg ? ornateArmorMat : secondaryClothMat
                );
                thigh.position.y = -0.22;

                // Sculpted Steel Knee Cop (Poleyn) with Side Wing & Gold Trim
                const kneeCop = new THREE.Mesh(
                    new THREE.SphereGeometry(0.18, 12, 10),
                    isArmoredLeg ? steelMat : leatherMat
                );
                kneeCop.scale.set(0.95, 0.75, 1.15);
                kneeCop.position.set(0, -0.46, 0.04);

                const kneeRing = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.018, 8, 14), goldMat);
                kneeRing.rotation.x = Math.PI / 2;
                kneeRing.position.set(0, -0.46, 0.01);

                // Tapered Shin Greave or Cavalier Bucket-Top Boot
                const shin = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.165, 0.135, 0.46, 12),
                    profile.role === 'knight' ? steelMat : bootMat
                );
                shin.position.y = -0.72;

                // Flared Cavalier Boot Cuff / Steel Greave Rim
                const bootCuff = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.19, 0.165, 0.14, 12),
                    profile.role === 'knight' ? goldMat : leatherMat
                );
                bootCuff.position.y = -0.53;

                // Anatomical Rounded Foot / Articulated Steel Sabaton + Golden Heel Spur
                const foot = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.12, 0.14, 0.48, 10),
                    profile.role === 'knight' ? darkSteelMat : bootMat
                );
                foot.rotation.x = Math.PI / 2;
                foot.scale.set(1.0, 1.0, 0.68);
                foot.position.set(0, -0.91, 0.09);

                const spur = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), goldMat);
                spur.rotation.x = -Math.PI / 2;
                spur.position.set(0, -0.89, -0.17);

                legGroup.add(thigh, kneeCop, kneeRing, shin, bootCuff, foot, spur);
                return legGroup;
            }

            const leftLeg = buildArticulatedLeg(true);
            const rightLeg = buildArticulatedLeg(false);

            // ---------------- 2. SCULPTED 1600s PEASCOD CUIRASS, TASSETS & ROLE GEAR ----------------
            const torsoGroup = new THREE.Group();
            torsoGroup.position.set(0, 1.54, 0);

            // Anatomical tapered torso core (broad chest tapering to waist)
            const baseTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.41, 1.08, 14), tunicMat);
            baseTorso.scale.set(1.05, 1.0, 0.68);
            baseTorso.castShadow = true;
            torsoGroup.add(baseTorso);

            // Flared Chainmail Skirt & Pelvis Guard
            const mailSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.50, 0.36, 14), chainmailMat);
            mailSkirt.scale.set(1.06, 1.0, 0.72);
            mailSkirt.position.y = -0.48;
            torsoGroup.add(mailSkirt);

            // Embossed Leather Sword Belt + Ornate Brass Buckle + Curved Rapier/Broadsword Scabbard
            const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.13, 16), leatherMat);
            belt.scale.set(1.08, 1.0, 0.74);
            belt.position.y = -0.35;
            const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.022, 8, 12), goldMat);
            buckle.position.set(0, -0.35, 0.34);

            const scabbardGroup = new THREE.Group();
            scabbardGroup.position.set(-0.52, -0.56, -0.05);
            scabbardGroup.rotation.x = 0.48;
            scabbardGroup.rotation.z = 0.14;
            const scabbardBody = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.028, 0.88, 10), leatherMat);
            const scabbardChape = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.16, 10), goldMat);
            scabbardChape.rotation.x = Math.PI;
            scabbardChape.position.y = -0.48;
            const scabbardLocket = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.045, 0.12, 10), goldMat);
            scabbardLocket.position.y = 0.38;
            scabbardGroup.add(scabbardBody, scabbardChape, scabbardLocket);
            torsoGroup.add(belt, buckle, scabbardGroup);

            // Sculpted Steel Gorget (Segmented Neck Collar with Roped Gold Rim)
            const gorget = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.18, 16), steelMat);
            gorget.scale.set(1.05, 1.0, 0.78);
            gorget.position.y = 0.54;
            const gorgetRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.022, 8, 16), goldMat);
            gorgetRim.rotation.x = Math.PI / 2;
            gorgetRim.scale.set(1.05, 0.78, 1.0);
            gorgetRim.position.y = 0.62;
            torsoGroup.add(gorget, gorgetRim);

            let capeMesh = null;

            if (profile.role === 'knight') {
                // Realistic Curved 1600s Peascod Breastplate + Central Keel Ridge + Articulated Tassets + Flowing Royal Cape
                const cuirassMain = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.45, 0.86, 16), ornateArmorMat);
                cuirassMain.scale.set(1.06, 1.0, 0.74);
                cuirassMain.position.y = 0.10;

                const chestDome = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), ornateArmorMat);
                chestDome.scale.set(1.12, 0.78, 0.58);
                chestDome.position.set(0, 0.16, 0.12);

                const centerKeel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.82, 4), goldMat);
                centerKeel.position.set(0, 0.10, 0.37);

                const waistFlange = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.032, 8, 16), goldMat);
                waistFlange.rotation.x = Math.PI / 2;
                waistFlange.scale.set(1.06, 0.74, 1.0);
                waistFlange.position.y = -0.28;

                // Overlapping Riveted Thigh Tassets (3 curved plates per leg)
                [-0.25, 0.25].forEach(tx => {
                    for (let l = 0; l < 3; l++) {
                        const lame = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.11, 10), ornateArmorMat);
                        lame.scale.set(1.0, 1.0, 0.55);
                        lame.position.set(tx, -0.40 - l * 0.09, 0.22 - l * 0.01);
                        lame.rotation.x = -0.15;
                        torsoGroup.add(lame);
                    }
                });

                // Draped Royal Cape with Gold Shoulder Brooches
                capeMesh = new THREE.Group();
                capeMesh.position.set(0, 0.48, -0.34);
                const capeCloth = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.42, 0.64, 1.48, 14, 1, false, -Math.PI * 0.45, Math.PI * 0.90),
                    new THREE.MeshStandardMaterial({ color: profile.color, roughness: 0.52, side: THREE.DoubleSide })
                );
                capeCloth.scale.set(1.1, 1.0, 0.28);
                capeCloth.position.y = -0.68;
                capeMesh.add(capeCloth);
                capeMesh.rotation.x = 0.16;

                torsoGroup.add(cuirassMain, chestDome, centerKeel, waistFlange, capeMesh);
            } else if (profile.role === 'pikeman') {
                // 1600s Spanish Tercio Munition Cuirass + Crimson Commander Sash + Tassets
                const cuirassMain = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.44, 0.82, 16), steelMat);
                cuirassMain.scale.set(1.05, 1.0, 0.72);
                cuirassMain.position.y = 0.12;

                const chestDome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 12), ornateArmorMat);
                chestDome.scale.set(1.10, 0.75, 0.55);
                chestDome.position.set(0, 0.16, 0.11);

                const sash = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.065, 10, 18), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.48 }));
                sash.scale.set(1.06, 0.74, 1.0);
                sash.rotation.x = Math.PI / 2;
                sash.rotation.y = 0.42;
                sash.position.y = 0.08;

                torsoGroup.add(cuirassMain, chestDome, sash);
            } else if (profile.role === 'musket') {
                // 1600s Suede Buff Coat + Steel Half-Gorgets + Diagonal Bandolier with 7 Realistic Wooden "12 Apostles" Powder Flasks & Bullet Pouch
                const buffCoat = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.46, 0.94, 14), buffLeatherMat);
                buffCoat.scale.set(1.06, 1.0, 0.72);
                buffCoat.position.y = 0.06;

                const bandolierRing = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.045, 8, 20), leatherMat);
                bandolierRing.scale.set(1.08, 0.75, 1.0);
                bandolierRing.rotation.x = Math.PI / 2;
                bandolierRing.rotation.y = -0.52;
                bandolierRing.position.y = 0.08;
                torsoGroup.add(buffCoat, bandolierRing);

                // Hanging Cylindrical Powder Charges ("12 Apostles") with Brass Caps & Cord
                for (let f = -3; f <= 3; f++) {
                    const flaskGroup = new THREE.Group();
                    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.046, 0.19, 10), darkWoodMat);
                    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.036, 0.06, 10), goldMat);
                    cap.position.y = 0.12;
                    flaskGroup.add(body, cap);
                    flaskGroup.position.set(f * 0.13, 0.05 + f * 0.065, 0.36 - Math.abs(f) * 0.025);
                    flaskGroup.rotation.z = (f % 2 === 0 ? 0.08 : -0.08);
                    torsoGroup.add(flaskGroup);
                }
            } else if (profile.role === 'archer') {
                // Studded Leather Brigandine + Brass Chest Buckles + Detailed Cylindrical Back Quiver with Feathered Arrows
                const brigandine = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.43, 0.88, 14), leatherMat);
                brigandine.scale.set(1.05, 1.0, 0.70);
                brigandine.position.y = 0.08;

                // Rivet studs across the leather brigandine
                for (let r = -1; r <= 1; r++) {
                    for (let c = -2; c <= 2; c++) {
                        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), goldMat);
                        stud.position.set(c * 0.14, 0.08 + r * 0.20, 0.35 - Math.abs(c) * 0.02);
                        torsoGroup.add(stud);
                    }
                }

                const quiver = new THREE.Group();
                quiver.position.set(0.22, 0.16, -0.42);
                quiver.rotation.z = -0.30;
                const qTube = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.86, 12), leatherMat);
                const qRim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 8, 14), goldMat);
                qRim.rotation.x = Math.PI / 2;
                qRim.position.y = 0.42;
                quiver.add(qTube, qRim);

                for (let a = -2; a <= 2; a++) {
                    const qArrow = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.48, 6), darkWoodMat);
                    qArrow.position.set(a * 0.04, 0.46, (a % 2) * 0.03);
                    const qFletch = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.14, 4), rubyMat);
                    qFletch.position.set(a * 0.04, 0.66, (a % 2) * 0.03);
                    quiver.add(qArrow, qFletch);
                }
                torsoGroup.add(brigandine, quiver);
            }

            // ---------------- 3. MULTI-LAYERED ROUNDED PAULDRONS & ARTICULATED ARMS ----------------
            function buildArticulatedArm(isLeft) {
                const armGroup = new THREE.Group();
                armGroup.position.set(isLeft ? -0.70 : 0.70, 1.92, 0);

                const isPlateArm = profile.role === 'knight' || profile.role === 'pikeman';

                // Sculpted Multi-Lame Shoulder Pauldron (Spherical Dome + Overlapping Steel Lames + Gold Rim)
                const pauldronDome = new THREE.Mesh(
                    new THREE.SphereGeometry(0.25, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
                    isPlateArm ? ornateArmorMat : tunicMat
                );
                pauldronDome.scale.set(1.05, 0.95, 1.05);
                pauldronDome.position.y = 0.08;

                const pauldronLame1 = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.24, 0.22, 0.10, 12),
                    isPlateArm ? steelMat : tunicMat
                );
                pauldronLame1.position.y = -0.06;

                const pauldronRim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.020, 8, 14), goldMat);
                pauldronRim.rotation.x = Math.PI / 2;
                pauldronRim.position.y = -0.10;

                // Upper Arm Rerebrace + Winged Elbow Couter + Tapered Forearm Vambrace + Steel Gauntlet
                const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.44, 12), tunicMat);
                upperArm.position.y = -0.28;

                const elbowCop = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 10, 10),
                    isPlateArm ? steelMat : leatherMat
                );
                elbowCop.position.y = -0.48;

                const vambrace = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.145, 0.12, 0.40, 12),
                    isPlateArm ? ornateArmorMat : leatherMat
                );
                vambrace.position.y = -0.66;

                const gauntlet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), darkSteelMat);
                gauntlet.scale.set(0.95, 1.15, 0.95);
                gauntlet.position.y = -0.90;

                armGroup.add(pauldronDome, pauldronLame1, pauldronRim, upperArm, elbowCop, vambrace, gauntlet);
                return armGroup;
            }

            const leftArm = buildArticulatedArm(true);
            const rightArm = buildArticulatedArm(false);
            rightArm.rotation.x = -Math.PI / 3;

            // ---------------- 4. SCULPTED HEAD, 3D MUSTACHE/BEARD & AUTHENTIC 1600s HELMETS ----------------
            const head = new THREE.Group();
            head.position.set(0, 2.52, 0);
            head.userData.isHead = true;

            // Rounded Anatomical Cranium & Jaw
            const skullMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.68, 16), [
                skinMatChar, skinMatChar, skinMatChar
            ]);
            skullMesh.rotation.y = Math.PI;
            skullMesh.userData.isHead = true;

            // Mapped Front Facial Mask
            const facePlate = new THREE.Mesh(
                new THREE.CylinderGeometry(0.365, 0.325, 0.64, 16, 1, true, -Math.PI * 0.35, Math.PI * 0.70),
                faceFrontMat
            );
            facePlate.userData.isHead = true;

            // 3D Sculpted Nose Bridge, Brow Ridge & 1600s Handlebar Mustache + Pointed Goatee
            const nose3D = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.22, 4), skinMatChar);
            nose3D.rotation.x = Math.PI / 2 - 0.25;
            nose3D.position.set(0, 0.02, 0.37);
            nose3D.userData.isHead = true;

            const mustacheL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.055, 0.22, 8), hairBeardMat);
            mustacheL.rotation.z = Math.PI / 2 + 0.22;
            mustacheL.position.set(-0.09, -0.10, 0.34);
            const mustacheR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.055, 0.22, 8), hairBeardMat);
            mustacheR.rotation.z = -Math.PI / 2 - 0.22;
            mustacheR.position.set(0.09, -0.10, 0.34);
            const goatee3D = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.26, 8), hairBeardMat);
            goatee3D.rotation.x = Math.PI;
            goatee3D.position.set(0, -0.28, 0.31);

            head.add(skullMesh, facePlate, nose3D, mustacheL, mustacheR, goatee3D);
            head.traverse(c => { if (c.isMesh) c.userData.isHead = true; });

            // Authentic 1600s Helmets & Hats
            const helmetGroup = new THREE.Group();
            helmetGroup.position.set(0, 2.74, 0);

            if (profile.role === 'knight') {
                // Authentic 1600s Close-Helm / Savoyard Armet with Pointed "Sparrow's Beak" Visor, Gold Cross, Breaths & Multi-Plume
                const helmSkull = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 14), ornateArmorMat);
                helmSkull.scale.set(1.0, 1.08, 1.12);
                helmSkull.position.y = -0.06;

                const helmComb = new THREE.Mesh(
                    new THREE.TorusGeometry(0.44, 0.048, 8, 16, Math.PI),
                    goldMat
                );
                helmComb.rotation.y = Math.PI / 2;
                helmComb.position.y = 0.02;

                // Pointed Bevor & Articulate Visor
                const pointedVisor = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.42, 4), steelMat);
                pointedVisor.rotation.x = Math.PI / 2;
                pointedVisor.rotation.z = Math.PI / 4;
                pointedVisor.scale.set(1.0, 1.0, 0.72);
                pointedVisor.position.set(0, -0.18, 0.32);

                const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.055, 0.16), new THREE.MeshBasicMaterial({ color: 0x05070b }));
                eyeSlit.position.set(0, -0.08, 0.42);

                const visorCross = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.16), goldMat);
                visorCross.position.set(0, -0.18, 0.44);

                // Flowing Multi-segment Feather Plume on Crown
                for (let p = 0; p < 3; p++) {
                    const plumeArc = new THREE.Mesh(
                        new THREE.SphereGeometry(0.18, 10, 10),
                        p === 1 ? whiteFeatherMat : plumeMat
                    );
                    plumeArc.scale.set(0.65, 1.1, 2.2);
                    plumeArc.position.set(0, 0.48 - p * 0.12, -0.10 - p * 0.22);
                    plumeArc.rotation.x = -0.35 - p * 0.25;
                    helmetGroup.add(plumeArc);
                }

                helmetGroup.add(helmSkull, helmComb, pointedVisor, eyeSlit, visorCross);
            } else if (profile.role === 'pikeman') {
                // Authentic 1600s Spanish Tercio / Conquistador Curved Morion Helmet with High Roped Comb & Boat Brim
                const morionBowl = new THREE.Mesh(
                    new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
                    steelMat
                );
                morionBowl.scale.set(0.96, 1.15, 1.12);
                morionBowl.position.y = -0.08;

                // Swept Boat-Shaped Morion Brim
                const morionBrim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.085, 8, 20), darkSteelMat);
                morionBrim.rotation.x = Math.PI / 2;
                morionBrim.scale.set(0.95, 1.32, 0.45);
                morionBrim.position.y = -0.12;

                // Tall Engraved Morion Comb (Crest)
                const highComb = new THREE.Mesh(
                    new THREE.TorusGeometry(0.42, 0.085, 8, 18, Math.PI),
                    goldMat
                );
                highComb.rotation.y = Math.PI / 2;
                highComb.scale.set(1.18, 1.35, 0.45);
                highComb.position.y = -0.04;

                const sidePlume = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), plumeMat);
                sidePlume.scale.set(0.55, 1.2, 2.2);
                sidePlume.position.set(0.42, 0.16, -0.18);
                sidePlume.rotation.x = 0.35;

                helmetGroup.add(morionBowl, morionBrim, highComb, sidePlume);
            } else if (profile.role === 'musket') {
                // Authentic 1600s Cavalier / Musketeer Wide-Brimmed Felt Hat (Cocked on one side with Jeweled Clasp & Sweeping Ostrich Plume)
                const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.46, 16), bootMat);
                hatCrown.position.y = 0.08;
                const crownTop = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 10), bootMat);
                crownTop.scale.set(1.0, 0.35, 1.0);
                crownTop.position.y = 0.30;

                const wideBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 0.94, 0.045, 24), bootMat);
                wideBrim.position.y = -0.12;
                wideBrim.rotation.z = 0.22; // Cocked brim!

                const silkHatband = new THREE.Mesh(new THREE.CylinderGeometry(0.448, 0.448, 0.10, 16), plumeMat);
                silkHatband.position.y = -0.05;

                const hatClasp = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), goldMat);
                hatClasp.position.set(-0.38, 0.02, 0.24);

                // Multi-segment sweeping white & crimson ostrich plumes
                const plume1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), whiteFeatherMat);
                plume1.scale.set(0.55, 1.1, 2.8);
                plume1.position.set(-0.44, 0.22, -0.14);
                plume1.rotation.set(0.28, 0.2, 0.35);

                const plume2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), plumeMat);
                plume2.scale.set(0.5, 0.9, 2.4);
                plume2.position.set(-0.36, 0.32, -0.26);
                plume2.rotation.set(0.42, 0.15, 0.25);

                helmetGroup.add(hatCrown, crownTop, wideBrim, silkHatband, hatClasp, plume1, plume2);
            } else {
                // Archer: 1600s Cabasset / Ribbed Steel Kettle Hat over Chainmail Coif
                const coif = new THREE.Mesh(new THREE.SphereGeometry(0.43, 14, 12), chainmailMat);
                coif.position.y = -0.12;

                const kettleDome = new THREE.Mesh(
                    new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
                    steelMat
                );
                kettleDome.scale.set(1.0, 1.22, 1.05);
                kettleDome.position.y = -0.02;

                const kettleBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.08, 18), ornateArmorMat);
                kettleBrim.position.y = -0.06;

                const brassBand = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.025, 8, 18), goldMat);
                brassBand.rotation.x = Math.PI / 2;
                brassBand.position.y = -0.02;

                const feather = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 8), goldMat);
                feather.position.set(0.38, 0.24, -0.14);
                feather.rotation.x = -0.35;

                helmetGroup.add(coif, kettleDome, kettleBrim, brassBand, feather);
            }

            helmetGroup.traverse(c => { if (c.isMesh) c.userData.isHead = true; });

            // ---------------- 5. REALISTIC 3D WEAPONS & SHIELDS IN BOT HANDS ----------------
            const weaponMount = new THREE.Group();
            weaponMount.position.set(0, -0.88, 0.25);

            if (profile.role === 'knight') {
                // Forged Diamond-Section Broadsword + Swept Crossguard + Pommel
                const bHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.34, 10), darkWoodMat);
                bHilt.position.y = -0.16;
                const bPommel = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), goldMat);
                bPommel.position.y = -0.34;
                const bGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.56, 10), goldMat);
                bGuard.rotation.z = Math.PI / 2;
                const bBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.075, 1.68, 4), steelMat);
                bBlade.scale.set(1.0, 1.0, 0.32);
                bBlade.rotation.y = Math.PI / 4;
                bBlade.position.y = 0.84;
                const bFuller = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.020, 1.15, 8), goldMat);
                bFuller.scale.set(1.0, 1.0, 0.45);
                bFuller.position.y = 0.62;
                weaponMount.add(bHilt, bPommel, bGuard, bBlade, bFuller);
                weaponMount.rotation.x = Math.PI / 3;

                // Curved Heraldic Heater Shield with Steel Boss attached to Left Arm
                const shieldGroup = new THREE.Group();
                const sMat = profile.color === 0xb91c1c
                    ? redShieldMat
                    : new THREE.MeshStandardMaterial({ map: blueHeraldicTex, bumpMap: armorPlateBundle.bumpMap, bumpScale: 0.04, roughness: 0.38, metalness: 0.35 });
                const sBoard = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.54, 0.36, 1.14, 16, 1, false, 0, Math.PI * 0.72),
                    sMat
                );
                sBoard.rotation.y = Math.PI * 0.14;
                sBoard.scale.set(0.42, 1.0, 1.0);
                const sBoss = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), goldMat);
                sBoss.position.set(-0.20, 0.05, 0);
                shieldGroup.add(sBoard, sBoss);
                shieldGroup.position.set(-0.20, -0.58, 0.28);
                leftArm.add(shieldGroup);
                leftArm.rotation.x = -0.45;
            } else if (profile.role === 'pikeman') {
                // Realistic 1600s Winged Halberd / Partisan with Crescent Axe, Rear Fluke & Silk Pennant
                const pShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.046, 3.45, 10), darkWoodMat);
                pShaft.rotation.x = Math.PI / 2;
                pShaft.position.z = 0.90;
                const pCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.048, 0.28, 10), goldMat);
                pCollar.rotation.x = Math.PI / 2;
                pCollar.position.z = 2.15;
                const pAxe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 14, 1, false, 0, Math.PI * 0.65), steelMat);
                pAxe.rotation.z = Math.PI / 2;
                pAxe.position.z = 2.25;
                const pSpike = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.08, 0.78, 4), steelMat);
                pSpike.scale.set(1.0, 1.0, 0.42);
                pSpike.rotation.x = Math.PI / 2;
                pSpike.position.z = 2.75;
                const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 4), plumeMat);
                pennant.position.set(0, -0.28, 1.95);
                weaponMount.add(pShaft, pCollar, pAxe, pSpike, pennant);
                weaponMount.rotation.x = Math.PI / 2.8;
            } else if (profile.role === 'archer') {
                // Composite Recurve Longbow + Nocked Bodkin Arrow
                const bRiser = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 10), goldMat);
                const bTop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.038, 0.62, 10), darkWoodMat);
                bTop.position.set(0, 0.48, -0.08);
                bTop.rotation.x = 0.28;
                const bBot = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.02, 0.62, 10), darkWoodMat);
                bBot.position.set(0, -0.48, -0.08);
                bBot.rotation.x = -0.28;
                const bString = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.48, 6), whiteFeatherMat);
                bString.position.z = -0.22;
                const nockedArr = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 8), goldMat);
                nockedArr.rotation.x = Math.PI / 2;
                nockedArr.position.z = 0.35;
                weaponMount.add(bRiser, bTop, bBot, bString, nockedArr);
                weaponMount.rotation.x = Math.PI / 2.2;
            } else {
                // Realistic 1600s Flintlock Musket in Bot Hands (Walnut Stock, Round Steel Barrel, Brass Bands, Flintlock Hammer & Ramrod)
                const mStock = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.082, 1.72, 10), darkWoodMat);
                mStock.rotation.x = Math.PI / 2;
                mStock.scale.set(0.75, 1.0, 1.25);
                mStock.position.z = 0.58;
                const mBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 2.08, 14), steelMat);
                mBarrel.rotation.x = Math.PI / 2;
                mBarrel.position.set(0, 0.08, 0.84);
                const mMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.10, 14), goldMat);
                mMuzzle.rotation.x = Math.PI / 2;
                mMuzzle.position.set(0, 0.08, 1.86);
                for (let b = 0; b < 3; b++) {
                    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.07, 12), goldMat);
                    band.rotation.x = Math.PI / 2;
                    band.position.set(0, 0.05, 0.65 + b * 0.42);
                    weaponMount.add(band);
                }
                const mLock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.28), goldMat);
                mLock.position.set(0.06, 0.06, 0.32);
                weaponMount.add(mStock, mBarrel, mMuzzle, mLock);
                weaponMount.rotation.x = Math.PI / 2.8;
            }
            rightArm.add(weaponMount);

            group.add(leftLeg, rightLeg, torsoGroup, head, helmetGroup, leftArm, rightArm);
            group._parts = { leftLeg, rightLeg, leftArm, rightArm, head, torso: torsoGroup, helmetGroup, capeMesh };
            // The existing illustrated meshes double as anatomical hit regions.
            // Classify by parent rig rather than a global vertical guess where possible.
            for (const [part,zone] of [[leftLeg,'leg'],[rightLeg,'leg'],
                [leftArm,'arm'],[rightArm,'arm'],[torsoGroup,'body'],
                [head,'head'],[helmetGroup,'head']]) {
                part.traverse(child => { if (child.isMesh) child.userData.hitZone = zone; });
            }
            // Carried blades and gun barrels are not vulnerable body parts.
            weaponMount.traverse(child => {
                if (child.isMesh) child.userData.hitZone = 'ignore';
            });
            return group;
        }

        // Build Player's Own 3D Character Model for [P] Third-Person Camera View!
        function buildPlayerThirdPersonCharacters() {
            playerCharGroup = new THREE.Group();
            playerCharGroup.visible = false;
            const playerProfiles = [
                { role: 'knight', color: 0xd97706 },
                { role: 'pikeman', color: 0x0284c7 },
                { role: 'archer', color: 0x16a34a },
                { role: 'musket', color: 0xb91c1c }
            ];
            playerProfiles.forEach((prof, idx) => {
                const m = createBotMesh(prof);
                m.visible = (idx === player.classIdx);
                playerCharGroup.add(m);
                playerClassModels.push(m);
            });
            scene.add(playerCharGroup);
        }
        buildPlayerThirdPersonCharacters();

        function spawnBots() {
            BOT_PROFILES.forEach((profile, i) => {
                const mesh = createBotMesh(profile);
                const spawnList = profile.preferWall ? RAMPART_SPAWNS : COURTYARD_SPAWNS;
                const sp = spawnList[i % spawnList.length];
                const initialNode = navigator.nearest(sp);
                if (initialNode) mesh.position.set(initialNode.x, initialNode.y, initialNode.z);
                else mesh.position.copy(sp);
                scene.add(mesh);

                const label = document.createElement('div');
                label.className = 'absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none';
                label.innerHTML = `
                    <div class="text-[11px] font-extrabold text-white krunker-text whitespace-nowrap mb-0.5">
                        ${profile.name} <span class="text-amber-300">[${profile.weapon}]</span>
                    </div>
                    <div class="w-14 h-2 bg-black/85 border border-black rounded-sm overflow-hidden p-[1px]">
                        <div class="bot-hp-fill h-full bg-rose-500 transition-all duration-75" style="width: 100%;"></div>
                    </div>
                `;
                worldLabelsContainer.appendChild(label);

                const botObj = {
                    id: i,
                    name: profile.name,
                    role: profile.role,
                    weapon: profile.weapon,
                    preferWall: profile.preferWall,
                    range: profile.range,
                    speed: profile.speed,
                    damage: profile.damage,
                    hp: 100,
                    maxHp: 100,
                    hasHelmet: true,
                    mesh,
                    label,
                    hpFill: label.querySelector('.bot-hp-fill'),
                    vel: new THREE.Vector3(),
                    targetPoint: (profile.preferWall ? RAMPART_SPAWNS : COURTYARD_SPAWNS)[(i + 2) % 5].clone(),
                    navPath: [],
                    navGoal: null,
                    navRefresh: 0,
                    navStuck: 0,
                    navRecovery: ArenaBotRecovery.create(),
                    navLastPosition: mesh.position.clone(),
                    tacticMode: 'patrol', tacticGoal: null, tacticTargetKey: null,
                    tacticLastTarget: null, tacticRefresh: 0,
                    attackTimer: 0.85 + Math.random() * 0.75,
                    lastRangedShotAt: -Infinity,
                    staggerTime: 0,
                    meleeWindup: 0,
                    rangedWindup: 0,
                    windupTargetKey: null,
                    guardTime: 0,
                    guardParryTime: 0,
                    guardCooldown: 0,
                    guardFacingYaw: 0,
                    guardAttempts: 0,
                    walkCycle: Math.random() * 10,
                    motionState: ArenaCharacterMotion.createState(Math.random() * Math.PI * 2),
                    strikePoseTime: 0,
                    hitFlashTimer: 0,
                    hitReactionTime: 0,
                    underFireUntil: 0,
                    hitLeanSign: 1,
                    dead: false,
                    respawnTimer: 0,
                    fallDirection: 1,
                    // Free-for-all arena: independent opponents, not a player-only pursuit.
                    arenaTargetType: null,
                    arenaTargetId: null,
                    arenaLockTime: 0,
                    arenaAggroType: null,
                    arenaAggroId: null,
                    arenaAggroUntil: 0,
                    arenaKills: 0,
                    arenaDeaths: 0
                };

                mesh.traverse(child => {
                    if (child.isMesh) child.userData.botIndex = i;
                });

                bots.push(botObj);
            });
        }
        spawnBots();

        // Pop enemy helmet into the air on Headshot!
        function popBotHelmet(bot) {
            if (!bot.hasHelmet) return;
            bot.hasHelmet = false;
            const helm = bot.mesh._parts.helmetGroup;
            helm.visible = false;

            const flyingHelm = helm.clone();
            flyingHelm.visible = true;
            flyingHelm.position.copy(bot.mesh.position).add(new THREE.Vector3(0, 2.75, 0));
            scene.add(flyingHelm);

            flyingHelmets.push({
                mesh: flyingHelm,
                vel: new THREE.Vector3((Math.random() - 0.5) * 6, 9 + Math.random() * 4, (Math.random() - 0.5) * 6),
                rotVel: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
                life: 2.2
            });
        }

        // ============================================================================
        // 8. PROJECTILES, STICKING ARROWS, VOLUMETRIC SMOKE & FLOATING DAMAGE NUMBERS
        // ============================================================================
        const arrows = [];
        const stuckArrows = [];
        const enemyTracers = [];
        const particles = [];

        function spawnFloatingDamage(worldPos, dmg, isHeadshot = false, extraTag = '') {
            const container = document.getElementById('damage-numbers-container');
            const proj = worldPos.clone().project(camera);
            if (proj.z >= 1.0) return;

            const sx = (proj.x * 0.5 + 0.5) * window.innerWidth + (Math.random() - 0.5) * 24;
            const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;

            const el = document.createElement('div');
            el.className = `dmg-number krunker-text ${isHeadshot ? 'text-2xl sm:text-3xl text-rose-500' : 'text-lg sm:text-xl text-amber-300'}`;
            el.style.left = `${sx}px`;
            el.style.top = `${sy}px`;
            el.textContent = isHeadshot ? `🎯 KRİTİK ${Math.round(dmg)}!` : `${extraTag}+${Math.round(dmg)}`;
            container.appendChild(el);
            setTimeout(() => el.remove(), 850);
        }

        function spawnSmokeCloud(origin, dir, count = 20, lingering = 2.8) {
            for (let i = 0; i < count; i++) {
                const size = 0.25 + Math.random() * 0.45;
                const isSpark = i < 4;
                const mat = new THREE.MeshLambertMaterial({
                    color: isSpark ? 0xfbbf24 : 0xd1d5db,
                    transparent: true,
                    opacity: isSpark ? 0.95 : 0.78
                });
                const puff = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
                puff.position.copy(origin).addScaledVector(dir, 1.0 + Math.random() * 1.1);
                puff.position.x += (Math.random() - 0.5) * 0.45;
                puff.position.y += (Math.random() - 0.5) * 0.45;
                puff.position.z += (Math.random() - 0.5) * 0.45;
                scene.add(puff);

                const lifeTime = isSpark ? 0.25 : (lingering * (0.65 + Math.random() * 0.45));
                particles.push({
                    mesh: puff,
                    vel: new THREE.Vector3(
                        dir.x * (1.5 + Math.random() * 3.5) + (Math.random() - 0.5) * 1.8,
                        0.45 + Math.random() * 1.1,
                        dir.z * (1.5 + Math.random() * 3.5) + (Math.random() - 0.5) * 1.8
                    ),
                    life: lifeTime,
                    maxLife: lifeTime,
                    grow: !isSpark,
                    drag: 0.94
                });
            }
        }

        function spawnHitSparks(pos, isHeadshot = false, weaponName = '') {
            const metal = /Kılıç|Kargı|Kalkan|Süngü|Hançer/.test(weaponName);
            const palette = metal ? [0xffe5a0, 0xfbbf24, 0xe2e8f0, 0xef4444] : [0xfca5a5, 0xef4444, 0xf59e0b];
            const count = isHeadshot ? 21 : metal ? 15 : 11;
            for (let i = 0; i < count; i++) {
                const mat = new THREE.MeshBasicMaterial({ color: palette[i % palette.length], transparent: true, opacity: 0.96 });
                const size = 0.06 + Math.random() * (metal ? 0.12 : 0.10);
                const p = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
                p.position.copy(pos);
                scene.add(p);
                const life = 0.19 + Math.random() * 0.19;
                particles.push({
                    mesh: p,
                    vel: new THREE.Vector3(
                        (Math.random() - 0.5) * (metal ? 14 : 9),
                        2 + Math.random() * 8,
                        (Math.random() - 0.5) * (metal ? 14 : 9)
                    ),
                    life, maxLife: life, gravity: true, impactTemporary: true
                });
            }
        }

        function triggerBarrelExplosion(barrel) {
            if (!barrel.active) return;
            barrel.active = false;
            barrel.group.visible = false;
            barrel.label.style.display = 'none';
            barrel.respawnTimer = 15.0; // Respawns after 15s

            sfx.playExplosion();
            player.shakeIntensity = Math.max(player.shakeIntensity, 0.55);

            const center = barrel.pos.clone().add(new THREE.Vector3(0, 1.2, 0));

            // Fiery explosion cubes + dark smoke cloud
            for (let i = 0; i < 36; i++) {
                const cols = [0xff4500, 0xf59e0b, 0xef4444, 0x374151];
                const size = 0.35 + Math.random() * 0.65;
                const mat = new THREE.MeshBasicMaterial({
                    color: cols[i % cols.length],
                    transparent: true,
                    opacity: 0.9
                });
                const p = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
                p.position.copy(center);
                scene.add(p);
                particles.push({
                    mesh: p,
                    vel: new THREE.Vector3(
                        (Math.random() - 0.5) * 18,
                        3 + Math.random() * 12,
                        (Math.random() - 0.5) * 18
                    ),
                    life: 0.7 + Math.random() * 0.8,
                    maxLife: 1.5,
                    grow: true,
                    gravity: i > 18
                });
            }

            // Area damage to nearby bots
            let killedByBarrel = 0;
            bots.forEach(bot => {
                if (bot.dead) return;
                const dist = bot.mesh.position.distanceTo(barrel.pos);
                if (dist < 11.5) {
                    const dmg = Math.round(160 * (1 - dist / 12.5));
                    damageBot(bot, dmg, false, 'Barut Fıçısı', '💥 ');
                    if (bot.hp <= 0) killedByBarrel++;
                }
            });

            if (killedByBarrel > 0) {
                showMedal('💥 BARUT İMHA!', '+100 KUŞATMA PATLAMASI', 'bg-orange-600 border-amber-300');
            }
        }

        // ============================================================================
        // 9. COMBAT, MEDALS, HITMARKERS & KILL FEED
        // ============================================================================
        const raycaster = new THREE.Raycaster();
        let hitmarkerTimeout = null;
        let impactHoldSeconds = 0;
        const impactVignetteEl = document.getElementById('impact-vignette');
        const impactTextEl = document.getElementById('impact-text');
        let impactTextTimeout = null;

        // Keep high-speed movement responsive; only slow simulation for a few real milliseconds.
        // Values deliberately below cinematic-style 100+ ms pauses.
        function registerWeaponSwing(type) {
            const kick = type === 'musket' ? 0.36 : type === 'spear' ? 0.19 : type === 'bow' ? 0.13 : 0.22;
            player.weaponKick = Math.max(player.weaponKick, kick);
            player.weaponTilt += type === 'musket' ? 0.09 : type === 'spear' ? -0.065 : 0.055;
            player.cameraImpactPitch += type === 'musket' ? 0.055 : type === 'bow' ? 0.009 : 0.016;
            player.shakeIntensity = Math.max(player.shakeIntensity, type === 'musket' ? 0.26 : 0.085);
        }
        function showImpactScreen(isHeadshot, lethal, heavy) {
            if (!impactVignetteEl || !impactTextEl) return;
            impactVignetteEl.className = 'impact-vignette ' + (lethal ? 'impact-kill' : isHeadshot ? 'impact-head' : 'impact-body');
            impactVignetteEl.style.animation = 'none';
            void impactVignetteEl.offsetWidth;
            impactVignetteEl.style.animation = '';
            if (isHeadshot || lethal) {
                impactTextEl.textContent = lethal ? '✦ DÜŞMAN DÜŞTÜ' : '✦ KRİTİK İSABET';
                impactTextEl.className = 'impact-text' + (lethal ? ' impact-text-kill' : '');
                impactTextEl.style.animation = 'none';
                void impactTextEl.offsetWidth;
                impactTextEl.style.animation = '';
                clearTimeout(impactTextTimeout);
                impactTextTimeout = setTimeout(() => { impactTextEl.textContent = ''; }, 440);
            }
        }
        function registerConfirmedHit(weaponName, isHeadshot, lethal, damage) {
            const melee = /Kılıç|Kargı|Kalkan|Süngü|Hançer/.test(weaponName);
            sfx.playWeaponImpact(weaponName, isHeadshot, lethal);
            impactHoldSeconds = Math.max(impactHoldSeconds, lethal ? 0.052 : melee ? 0.036 : isHeadshot ? 0.032 : 0.019);
            player.shakeIntensity = Math.max(player.shakeIntensity, lethal ? 0.26 : isHeadshot ? 0.22 : melee ? 0.16 : 0.105);
            player.cameraImpactPitch += lethal ? 0.022 : isHeadshot ? 0.016 : 0.009;
            player.cameraImpactYaw += (Math.random() - 0.5) * (lethal ? 0.026 : 0.015);
            player.weaponKick = Math.max(player.weaponKick, melee ? 0.23 : 0.14);
            showImpactScreen(isHeadshot, lethal, melee);
        }

        function triggerHitmarker(isHeadshot = false, lethal = false) {
            sfx.playHitmarker(isHeadshot);
            const hm = document.getElementById('hitmarker');
            hm.classList.toggle('hitmarker-head', isHeadshot);
            hm.classList.toggle('hitmarker-kill', lethal);
            hm.classList.remove('impact-marker-pop');
            void hm.offsetWidth;
            hm.classList.add('impact-marker-pop');
            hm.style.opacity = '1';
            clearTimeout(hitmarkerTimeout);
            hitmarkerTimeout = setTimeout(() => {
                hm.style.opacity = '0';
            }, lethal ? 230 : 175);
        }

        function showMedal(title, subtitle, colorClasses = 'bg-amber-600 border-amber-300') {
            const container = document.getElementById('medal-container');
            if (!container) return;
            const medal = document.createElement('div');
            medal.className = `medal-anim ${colorClasses} border-2 px-3.5 py-1 rounded-lg shadow-xl flex flex-col items-center krunker-text`;
            medal.innerHTML = `
                <div class="text-xs sm:text-sm font-black tracking-wider text-white">${title}</div>
                <div class="text-[10px] font-bold text-amber-200">${subtitle}</div>
            `;
            container.appendChild(medal);
            setTimeout(() => medal.remove(), 1800);
        }

        function addScorePopup(text, colorClass = 'text-amber-300') {
            const container = document.getElementById('score-popup-container');
            const el = document.createElement('div');
            el.className = `score-popup-anim text-base sm:text-lg font-black italic tracking-wider krunker-text ${colorClass}`;
            el.textContent = text;
            container.appendChild(el);
            setTimeout(() => el.remove(), 1150);
        }

        function addKillFeed(killer, weapon, victim, isPlayerKiller = true) {
            const feed = document.getElementById('kill-feed');
            const item = document.createElement('div');
            item.className = 'hud-box px-3 py-1 rounded text-xs sm:text-sm font-bold krunker-text flex items-center gap-1.5';
            const killerColor = isPlayerKiller ? 'text-rose-400' : 'text-amber-400';
            const victimColor = isPlayerKiller ? 'text-amber-300' : 'text-rose-400';
            item.innerHTML = `
                <span class="${killerColor}">${killer}</span>
                <span class="text-gray-200">[${weapon}]</span>
                <span class="${victimColor}">${victim}</span>
            `;
            feed.prepend(item);
            while (feed.children.length > 5) feed.lastChild.remove();
            setTimeout(() => { if (item.parentNode) item.remove(); }, 6500);
        }

        // Combat impulses must obey the same castle colliders as navigation.
        // Raw mesh.position.addScaledVector bypassed wall/ramp checks and could
        // push bots through parapets during hits or the shield-bash ability.
        function applyBotWorldKnockback(bot, direction, distance) {
            if (!bot || !(distance > 0)) return 0;
            const planar = Math.hypot(direction.x, direction.z);
            if (planar < 0.000001) return 0;
            const x = bot.mesh.position.x, z = bot.mesh.position.z;
            const origin = {x, z, y: navigator.heightAt(x, z)};
            const next = navigator.safeAdvance(origin,
                {x: direction.x / planar, z: direction.z / planar}, distance);
            if (!navigator.walkableAt(next.x, next.z, next.y)) return 0;
            const actual = Math.hypot(next.x - x, next.z - z);
            bot.mesh.position.x = next.x;
            bot.mesh.position.z = next.z;
            if (actual > 0.025) {
                // An impulse invalidates the old AI route; replan from safe ground.
                bot.navPath.length = 0;
                bot.navGoal = null;
                bot.navRefresh = 0;
                bot.navStuck = 0;
                bot.tacticRefresh = 0;
            }
            return actual;
        }

        function damageBot(bot, dmg, isHeadshot, weaponName, prefixTag = '', impactPoint = null) {
            if (!bot || bot.dead) return;
            bot.hp -= dmg;
            // A player's attack draws THIS bot's attention, not the entire arena.
            if (bot.hp > 0) markArenaAggro(bot, 'player', null);
            const lethal = bot.hp <= 0;
            bot.hitFlashTimer = 0.17;
            bot.hitReactionTime = lethal ? 0.38 : 0.24;
            if (!lethal) {
                bot.underFireUntil = (typeof arenaClock === 'number' ? arenaClock : 0) + 2;
                bot.tacticRefresh = 0;
            }
            bot.hitLeanSign = (player.pos.x < bot.mesh.position.x) ? -1 : 1;
            bot.mesh.scale.set(lethal ? 1.17 : 1.10, lethal ? 0.86 : 0.91, 1.08);
            // Small impact displacement; does not change nominal damage or weapon range.
            const knock = bot.mesh.position.clone().sub(player.pos);
            knock.y = 0;
            if (knock.lengthSq() > 0.0001) applyBotWorldKnockback(bot, knock, lethal ? 0.35 : 0.16);
            triggerHitmarker(isHeadshot, lethal);
            registerConfirmedHit(weaponName, isHeadshot, lethal, dmg);

            const hitPos = impactPoint ? impactPoint.clone() : bot.mesh.position.clone().add(new THREE.Vector3(0, isHeadshot ? 2.6 : 1.6, 0));
            spawnHitSparks(hitPos, isHeadshot, weaponName);
            spawnFloatingDamage(hitPos, dmg, isHeadshot, prefixTag);

            if (isHeadshot) {
                popBotHelmet(bot);
            }

            if (bot.hp <= 0) {
                player.kills++;
                bot.arenaDeaths++;
                ArenaTelemetry.recordKill(arenaTelemetry, 'player', 'bot:' + bot.id, {
                    classIdx:player.classIdx, weapon:weaponName,
                    second:arenaMatch.durationSeconds - arenaMatch.remaining
                });
                player.streak++;
                player.hp = Math.min(player.maxHp, player.hp + 30);
                updateHUD();

                const isAirborneKill = !player.onGround && player.pos.y > 4.2;
                if (isHeadshot) {
                    addScorePopup('+150 KAFADAN VURUŞ!', 'text-rose-400');
                    showMedal('🎯 KAFADAN İNFAZ!', '+50 MİĞFER UÇURULDU', 'bg-rose-600 border-amber-300');
                } else if (isAirborneKill) {
                    addScorePopup('+140 HAVADAN İNFAZ!', 'text-sky-300');
                    showMedal('🦅 HAVADAN İNFAZ!', '+75 AKROBATİK LEŞ', 'bg-sky-600 border-sky-200');
                } else {
                    addScorePopup('+100 DÜŞMAN DEVİRİLDİ', 'text-amber-300');
                }

                if (player.streak > 0 && player.streak % 3 === 0) {
                    showMedal(`🔥 ${player.streak}x SERİ KATİL!`, 'DURDURULAMAZ KUŞATMACI', 'bg-purple-700 border-amber-300');
                }

                addKillFeed('Sen_1600', weaponName, bot.name, true);

                // Let the final blow read on screen before bringing this combatant back.
                // The same six AI fighters respawn after the fall; no corpses accumulate.
                bot.dead = true;
                bot.hp = 0;
                bot.respawnTimer = 1.15;
                bot.fallDirection = bot.hitLeanSign;
                bot.label.style.display = 'none';
                bot.arenaTargetType = null;
                bot.arenaTargetId = null;
                bot.arenaAggroType = null;
                bot.arenaAggroUntil = 0;
            }
        }

        // ============================================================================
        // FREE-FOR-ALL ARENA AI: six independent fighters + the player.
        // This module deliberately keeps the original model, rendering and player combat.
        // ============================================================================
        const arenaSightRay = new THREE.Raycaster();
        const arenaAimTmp = new THREE.Vector3();
        const arenaAimOrigin = new THREE.Vector3();

        function arenaActorPosition(type, id) {
            if (type === 'player') return isGameActive ? player.pos : null;
            const foe = bots[id];
            return foe && !foe.dead ? foe.mesh.position : null;
        }

        function arenaTargetDistance(bot, type, id) {
            const pos = arenaActorPosition(type, id);
            if (!pos) return Infinity;
            const dx = pos.x - bot.mesh.position.x;
            const dz = pos.z - bot.mesh.position.z;
            const dy = pos.y - bot.mesh.position.y;
            // Height adds a targeting penalty; use the ramp network when it connects.
            return Math.hypot(dx, dz, dy * 1.2);
        }

        function arenaTargetCount(type, id, excludeId) {
            return bots.reduce((n, other) => n + (
                other.id !== excludeId && !other.dead &&
                other.arenaTargetType === type &&
                (type === 'player' || other.arenaTargetId === id) ? 1 : 0
            ), 0);
        }

        function setArenaTarget(bot, type, id) {
            bot.arenaTargetType = type;
            bot.arenaTargetId = type === 'bot' ? id : null;
            // Not a permanent lock: periodically reassess opponents.
            bot.arenaLockTime = arenaClock + 2.4 + Math.random() * 1.8;
        }

        function chooseArenaTarget(bot) {
            if (bot.dead || !isGameActive) return null;
            const maxDetection = bot.range > 8 ? 43 : 33;
            // A bot retaliates against a recent attacker if that attacker is reachable.
            if (bot.arenaAggroType && arenaClock < bot.arenaAggroUntil &&
                ArenaBotRecovery.allows(bot.navRecovery, bot.arenaAggroType + ':' +
                    (bot.arenaAggroType === 'player' ? 'player' : bot.arenaAggroId))) {
                const aggroDist = arenaTargetDistance(bot, bot.arenaAggroType, bot.arenaAggroId);
                if (aggroDist < maxDetection + 9) {
                    setArenaTarget(bot, bot.arenaAggroType, bot.arenaAggroId);
                    return { type: bot.arenaTargetType, id: bot.arenaTargetId,
                        position: arenaActorPosition(bot.arenaTargetType, bot.arenaTargetId) };
                }
            }
            const currentPos = arenaActorPosition(bot.arenaTargetType, bot.arenaTargetId);
            const currentDist = arenaTargetDistance(bot, bot.arenaTargetType, bot.arenaTargetId);
            if (currentPos && currentDist < maxDetection + 5 &&
                arenaClock < bot.arenaLockTime &&
                ArenaBotRecovery.allows(bot.navRecovery, bot.arenaTargetType + ':' +
                    (bot.arenaTargetType === 'player' ? 'player' : bot.arenaTargetId))) {
                return { type: bot.arenaTargetType, id: bot.arenaTargetId, position: currentPos };
            }
            const candidates = [];
            for (const other of bots) {
                if (other.id === bot.id || other.dead) continue;
                if (!ArenaBotRecovery.allows(bot.navRecovery, 'bot:' + other.id)) continue;
                const dist = arenaTargetDistance(bot, 'bot', other.id);
                if (dist >= maxDetection) continue;
                const attackers = arenaTargetCount('bot', other.id, bot.id);
                // Distance matters, but spreading combat over the arena matters too.
                const score = dist + attackers * 9 + Math.random() * 5;
                candidates.push({ type: 'bot', id: other.id, position: other.mesh.position, score });
            }
            const playerDistance = arenaTargetDistance(bot, 'player', null);
            // At most one normal bot pursues the player at once; retaliation is separate.
            if (playerDistance < Math.min(maxDetection, 26) &&
                ArenaBotRecovery.allows(bot.navRecovery, 'player:player') &&
                arenaTargetCount('player', null, bot.id) === 0) {
                // Bots deliberately prefer other available opponents to a player dogpile.
                candidates.push({ type: 'player', id: null, position: player.pos,
                    score: playerDistance + 14 + Math.random() * 7 });
            }
            candidates.sort((a, b) => a.score - b.score);
            const choice = candidates[0];
            if (!choice) {
                bot.arenaTargetType = null;
                bot.arenaTargetId = null;
                bot.arenaLockTime = arenaClock + 0.55;
                return null;
            }
            setArenaTarget(bot, choice.type, choice.id);
            return choice;
        }

        function markArenaAggro(victim, type, attackerId) {
            victim.arenaAggroType = type;
            victim.arenaAggroId = type === 'bot' ? attackerId : null;
            victim.arenaAggroUntil = arenaClock + 3.7;
            victim.arenaLockTime = 0;
        }

        // Combat foundation: prevent strikes and hitscan shots from hitting through stone/props.
        // Only static world colliders participate; characters are checked separately.
        function arenaWorldBlockBetween(from, to) {
            const displacement = to.clone().sub(from);
            const distance = displacement.length();
            if (distance <= 0.15) return false;
            arenaSightRay.set(from, displacement.multiplyScalar(1 / distance));
            arenaSightRay.near = 0.05;
            arenaSightRay.far = distance - 0.10;
            return arenaSightRay.intersectObjects(worldMeshes, false).length > 0;
        }

        function arenaLineOfSight(bot, targetPos, targetIsPlayer) {
            const origin = arenaAimOrigin.copy(bot.mesh.position);
            origin.y += 1.8;
            const end = arenaAimTmp.copy(targetPos);
            end.y += targetIsPlayer ? 1.0 : 1.65;
            const dir = end.sub(origin);
            const distance = dir.length();
            if (distance < 0.01) return true;
            arenaSightRay.set(origin, dir.multiplyScalar(1 / distance));
            arenaSightRay.near = 0.12;
            arenaSightRay.far = Math.max(0.12, distance - 0.55);
            return arenaSightRay.intersectObjects(worldMeshes, false).length === 0;
        }

        // Tactical vantage checks use the same world occlusion as real shots.
        function arenaCanSeeFrom(point, targetPos, targetIsPlayer) {
            const origin = new THREE.Vector3(point.x, point.y + 1.8, point.z);
            const end = targetPos.clone();
            end.y += targetIsPlayer ? 1.0 : 1.65;
            const direction = end.sub(origin), distance = direction.length();
            if (distance < 0.01) return true;
            arenaSightRay.set(origin, direction.multiplyScalar(1 / distance));
            arenaSightRay.near = 0.12;
            arenaSightRay.far = Math.max(0.12, distance - 0.55);
            return arenaSightRay.intersectObjects(worldMeshes, false).length === 0;
        }
        function arenaShotTracer(start, end, isArrow) {
            const path = end.clone().sub(start);
            const length = path.length();
            if (length < 0.1) return;
            const geometry = new THREE.CylinderGeometry(isArrow ? 0.015 : 0.027, isArrow ? 0.015 : 0.027, length, 5);
            const material = new THREE.MeshBasicMaterial({ color: isArrow ? 0xfde68a : 0xffc879,
                transparent: true, opacity: isArrow ? 0.85 : 0.94, depthWrite: false });
            const beam = new THREE.Mesh(geometry, material);
            beam.position.copy(start).addScaledVector(path, 0.5);
            beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), path.normalize());
            scene.add(beam);
            const lifetime = isArrow ? 0.16 : 0.085;
            particles.push({ mesh: beam, vel: new THREE.Vector3(), life: lifetime,
                maxLife: lifetime, impactTemporary: true });
        }

        function damageBotFromBot(attacker, victim, damage) {
            if (!attacker || attacker.dead || !victim || victim.dead || attacker.id === victim.id) return;
            // Knight defenders must raise their shield DURING an observed wind-up.
            // Never retroactively decide to parry when a hit is registered.
            if (victim.role === 'knight' && victim.guardTime > 0) {
                const defense = ArenaCombatDefense.assessShield({
                    shielding: true, defender: victim.mesh.position,
                    attacker: attacker.mesh.position, yaw: victim.guardFacingYaw,
                    parryTime: victim.guardParryTime,
                    melee: attacker.role === 'knight' || attacker.role === 'pikeman'
                });
                if (defense.kind === 'parry') {
                    attacker.staggerTime = ArenaCombatDefense.STAGGER_DURATION;
                    attacker.meleeWindup = 0;
                    victim.guardParryTime = 0;
                    victim.guardTime = 0;
                    const spark = victim.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0));
                    spawnHitSparks(spark, false, 'Kalkan');
                    sfx.playMetalClang();
                    return;
                }
                if (defense.kind === 'block') {
                    damage = Math.round(damage * defense.multiplier);
                    sfx.playMetalClang();
                }
            }
            victim.hp = Math.max(0, victim.hp - damage);
            const lethal = victim.hp <= 0;
            const delta = victim.mesh.position.clone().sub(attacker.mesh.position);
            delta.y = 0;
            victim.hitFlashTimer = 0.17;
            victim.hitReactionTime = lethal ? 0.38 : 0.24;
            if (!lethal) {
                victim.underFireUntil = (typeof arenaClock === 'number' ? arenaClock : 0) + 2;
                victim.tacticRefresh = 0;
            }
            victim.hitLeanSign = delta.x < 0 ? -1 : 1;
            victim.mesh.scale.set(lethal ? 1.17 : 1.10, lethal ? 0.86 : 0.91, 1.08);
            if (delta.lengthSq() > 0.0001) {
                applyBotWorldKnockback(victim, delta, lethal ? 0.34 : 0.14);
            }
            const impactPoint = victim.mesh.position.clone().add(new THREE.Vector3(0, 1.7, 0));
            spawnHitSparks(impactPoint, false, attacker.weapon);
            // Bot-vs-bot blows must NEVER show a player hitmarker or heal/score the player.
            if (lethal) {
                attacker.arenaKills++;
                victim.arenaDeaths++;
                ArenaTelemetry.recordKill(arenaTelemetry, 'bot:' + attacker.id,
                    'bot:' + victim.id, {weapon:attacker.weapon,
                        second:arenaMatch.durationSeconds - arenaMatch.remaining});
                addKillFeed(attacker.name, attacker.weapon, victim.name, false);
                victim.dead = true;
                victim.hp = 0;
                victim.respawnTimer = 1.15;
                victim.fallDirection = victim.hitLeanSign;
                victim.label.style.display = 'none';
                victim.arenaTargetType = null;
                victim.arenaTargetId = null;
                victim.arenaAggroType = null;
                victim.arenaAggroUntil = 0;
            } else {
                markArenaAggro(victim, 'bot', attacker.id);
            }
        }

        function arenaBotAttack(bot, target, targetDistance) {
            if (!target || !isGameActive || bot.dead || bot.staggerTime > 0) return;
            const targetPos = arenaActorPosition(target.type, target.id);
            if (!targetPos) return;
            const isRanged = bot.role === 'archer' || bot.role === 'musket';
            // Melee combatants also require a clear path; walls block every weapon type.
            if (!arenaLineOfSight(bot, targetPos, target.type === 'player')) return;
            // The bot must actually face its opponent; its shot cannot land sideways.
            if (!ArenaBotOffense.facing(bot.role, bot.mesh.rotation.y, bot.mesh.position, targetPos)) {
                bot.attackTimer = Math.max(bot.attackTimer, 0.18);
                return;
            }
            const origin = bot.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0));
            const weapon = ArenaWeaponBalance.weaponForRole(bot.role);
            const cadence = isRanged
                ? ArenaWeaponBalance.SHOT_INTERVAL[weapon] : null;
            // Absolute shot time survives death/respawn and temporary target loss.
            if (isRanged && !ArenaWeaponBalance.ready(bot.lastRangedShotAt,arenaClock,weapon)) {
                bot.attackTimer = Math.max(bot.attackTimer,
                    cadence-(arenaClock-bot.lastRangedShotAt));
                return;
            }
            let shot = null;
            let targetPoint = targetPos.clone().add(
                new THREE.Vector3(0,target.type === 'player' ? 1.0 : 1.65,0));
            if (isRanged) {
                const targetBase = target.type === 'player'
                    ? {x:player.pos.x,y:player.pos.y-player.currentHeight,z:player.pos.z}
                    : targetPos;
                shot = ArenaWeaponBalance.aimedShot(
                    bot.role,origin,targetBase,Math.random(),Math.random(),
                    target.type === 'player' && player.isSliding ? 1.9 : 3);
                if (!shot.point) return;
                targetPoint = new THREE.Vector3(shot.point.x,shot.point.y,shot.point.z);
            }
            const shotDir = targetPoint.clone().sub(origin).normalize();
            bot.attackTimer = isRanged ? cadence
                : ArenaBotOffense.nextCooldown(bot.role, Math.random());
            bot.strikePoseTime = isRanged ? 0.17 : 0.25;
            if (isRanged) {
                bot.lastRangedShotAt = arenaClock;
                arenaShotTracer(origin, targetPoint, bot.role === 'archer');
                if (bot.role === 'musket') spawnSmokeCloud(origin, shotDir, 8, 1.0);
                // Visible misses, lateral shots and blocked impact paths never damage.
                if (!shot.hit || arenaWorldBlockBetween(origin,targetPoint)) return;
            }
            // Both AI and human participants use the same weapon+zone damage table.
            // Close-range strikes hit the body; ranged impacts derive from the actual aim.
            const zone = isRanged ? shot.zone : 'body';
            const impactDamage = ArenaWeaponBalance.damage(weapon, zone,
                bot.role === 'archer' ? 0.5 : 1);
            if (target.type === 'bot') {
                const enemy = bots[target.id];
                if (enemy && !enemy.dead) damageBotFromBot(bot, enemy, impactDamage);
                return;
            }
            let incomingDmg = impactDamage;
            const defense = ArenaCombatDefense.assessShield({
                shielding: player.classIdx === 0 && player.isShielding,
                defender: player.pos, attacker: bot.mesh.position,
                yaw: player.yaw, parryTime: player.shieldParryTime,
                melee: !isRanged
            });
            if (defense.kind === 'parry') {
                // Parry interrupts the attacker; no kill, heal or credit.
                player.shieldParryTime = 0;
                player.parries++;
                bot.staggerTime = ArenaCombatDefense.STAGGER_DURATION;
                bot.meleeWindup = 0;
                bot.attackTimer = Math.max(bot.attackTimer, 0.8);
                bot.hitReactionTime = 0.24;
                bot.hitFlashTimer = 0.15;
                sfx.playMetalClang();
                addScorePopup('⚔️ KUSURSUZ SAVUŞTURMA!', 'text-amber-300');
                document.getElementById('hud-status-badge').textContent = '⚔️ PARRY BAŞARILI';
                updateHUD();
                return;
            }
            if (defense.kind === 'block') {
                incomingDmg = Math.round(incomingDmg * defense.multiplier);
                sfx.playMetalClang();
                addScorePopup('🛡️ ÖNDEN BLOK!', 'text-sky-300');
            } else {
                sfx.playPlayerHit();
                player.shakeIntensity = Math.max(player.shakeIntensity, 0.19);
                player.cameraImpactYaw += (Math.random() - 0.5) * 0.045;
                const overlay = document.getElementById('damage-overlay');
                overlay.style.opacity = '1';
                setTimeout(() => { overlay.style.opacity = '0'; }, 180);
            }
            player.hp -= incomingDmg;
            if (player.hp <= 0) {
                player.deaths++;
                bot.arenaKills++;
                ArenaTelemetry.recordKill(arenaTelemetry, 'bot:' + bot.id, 'player', {
                    weapon:bot.weapon,
                    second:arenaMatch.durationSeconds - arenaMatch.remaining
                });
                player.streak = 0;
                player.hp = player.maxHp;
                addKillFeed(bot.name, bot.weapon, 'Sen_1600', false);
                addScorePopup('YENİDEN DOĞDUN!', 'text-rose-400');
                const sp = chooseArenaRespawn(COURTYARD_SPAWNS, null, false);
                player.pos.set(sp.x, sp.y + 1.5, sp.z);
                player.tpsMotionState = ArenaCharacterMotion.createState();
                // The killer returns to fighting the whole arena, not camping the respawn.
                bot.arenaTargetType = null;
                bot.arenaTargetId = null;
                bot.arenaLockTime = 0;
                bot.arenaAggroType = null;
                bot.arenaAggroUntil = 0;
            }
            updateHUD();
        }

        // Check if player hit an explosive barrel along ray
        function checkBarrelHit(maxDist) {
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            raycaster.far = maxDist;
            const barrelMeshes = [];
            barrels.forEach(b => {
                if (b.active) b.group.traverse(c => { if (c.isMesh) barrelMeshes.push(c); });
            });
            const hits = raycaster.intersectObjects(barrelMeshes, false);
            if (hits.length > 0) {
                const barrel = barrels[hits[0].object.userData.barrelIndex];
                if (barrel && !arenaWorldBlockBetween(camera.position, hits[0].point)) {
                    triggerHitmarker(false);
                    triggerBarrelExplosion(barrel);
                    return true;
                }
            }
            return false;
        }

        // Ordered sampled blade contact: world, active barrels and living bots
        // share a nearest-hit ray; walls cannot be bypassed by fallback detection.
        function arenaPlayerMeleeContact(kind, range) {
            const targets = [...worldMeshes];
            bots.filter(b => !b.dead).forEach(b => b.mesh.traverse(c => {
                if (c.isMesh) targets.push(c);
            }));
            barrels.filter(b => b.active).forEach(b => b.group.traverse(c => {
                if (c.isMesh) targets.push(c);
            }));
            const initialDir = new THREE.Vector3(0, 0, -1)
                .applyQuaternion(camera.quaternion).normalize();
            return ArenaMeleeContact.selectContact({kind, reach: range,
                castRay(angle, reach) {
                    const dir = initialDir.clone().applyAxisAngle(
                        new THREE.Vector3(0, 1, 0), angle);
                    raycaster.set(camera.position, dir);
                    raycaster.near = 0.01;
                    raycaster.far = reach;
                    const hits = raycaster.intersectObjects(targets, false);
                    if (!hits.length) return null;
                    const hit = hits[0];
                    const index = hit.object.userData.botIndex;
                    const barrelIndex = hit.object.userData.barrelIndex;
                    if (index !== undefined && bots[index] && !bots[index].dead)
                        return {kind:'bot', bot:bots[index], point:hit.point,
                            isHead:!!hit.object.userData.isHead, distance:hit.distance};
                    if (barrelIndex !== undefined && barrels[barrelIndex] && barrels[barrelIndex].active)
                        return {kind:'barrel', barrel:barrels[barrelIndex],
                            point:hit.point,distance:hit.distance};
                    return {kind:'world',distance:hit.distance};
                }
            });
        }

        // Quick Melee [F] or [V] (Bayonet / Dagger / Shield Bash / Spear Surge)
        function performQuickAbilityOrMelee() {
            if (!isGameActive) return;

            // Class 0 (Knight): Shield Bash Dash!
            if (player.classIdx === 0 && player.abilityCooldown <= 0) {
                player.abilityCooldown = 2.6;
                sfx.playMetalClang();
                sfx.playMeleeSwing(0.8);
                player.shakeIntensity = 0.25;
                const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
                player.vel.x = forward.x * 28;
                player.vel.z = forward.z * 28;
                player.attackAnimTime = 0.82;
                registerWeaponSwing('spear');

                // Knockback & damage nearby bots in front
                bots.forEach(bot => {
                    if (bot.dead) return;
                    const toBot = bot.mesh.position.clone().sub(player.pos);
                    if (toBot.length() < 6.5 && forward.dot(toBot.normalize()) > 0.5 &&
                        !arenaWorldBlockBetween(player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)),
                            bot.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)))) {
                        damageBot(bot, 85, false, 'Kalkan Çarpması', '🛡️ ');
                        applyBotWorldKnockback(bot, forward, 4.5);
                    }
                });
                updateHUD();
                return;
            }

            // Class 1 (Pikeman): Momentum Spear Charge Surge!
            if (player.classIdx === 1 && player.abilityCooldown <= 0) {
                player.abilityCooldown = 3.0;
                sfx.playMeleeSwing(1.3);
                const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
                player.vel.x = forward.x * 30;
                player.vel.z = forward.z * 30;
                player.bhopChain = Math.min(6, player.bhopChain + 2);
                addScorePopup('⚡ KARGI HÜCUMU!', 'text-sky-300');
                performPrimaryAttack();
                updateHUD();
                return;
            }

            // Class 2 (Archer) or Class 3 (Musketeer): Quick Bayonet / Dagger Slash (Works even while reloading!)
            if (player.quickMeleeTime > 0) return;
            player.quickMeleeTime = 0.82;
            registerWeaponSwing('melee');
            sfx.playMeleeSwing(1.35);

            const contact = arenaPlayerMeleeContact('dagger', 5.2);
            if (contact && contact.kind === 'barrel') {
                triggerBarrelExplosion(contact.barrel);
            } else if (contact && contact.kind === 'bot') {
                damageBot(contact.bot, ArenaWeaponBalance.damage('dagger','body'), false,
                    'Süngü / Hançer', '🗡️ ', contact.point);
            }
        }

        function performPrimaryAttack() {
            if (!isGameActive) return;
            const cls = CLASSES[player.classIdx];

            // If Knight is holding Shield (Right-Click) + clicks Left-Click -> Shield Bash!
            if (cls.id === 0 && player.isShielding && player.abilityCooldown <= 0) {
                performQuickAbilityOrMelee();
                return;
            }

            if (player.attackCooldown > 0 || player.isReloading) return;
            if (cls.id === 3 && !ArenaWeaponBalance.ready(
                player.lastMusketShotAt, arenaClock, 'musket')) return;

            if (cls.id === 3 && player.ammo <= 0) {
                startReload();
                return;
            }

            player.attackCooldown = cls.id === 3 ? 0.30 : cls.cooldown;
            player.attackAnimTime = cls.type === 'melee' ? 0.82 : 1.0;
            registerWeaponSwing(cls.id === 3 ? 'musket' : cls.id === 1 ? 'spear' : 'melee');
            player.comboStep = (player.comboStep + 1) % 2;

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

            // [0] SWORD or [1] MOMENTUM SPEAR
            if (cls.type === 'melee') {
                sfx.playMeleeSwing(cls.id === 1 ? 0.85 : (player.comboStep === 0 ? 1.0 : 1.18));

                // Damage is resolved throughout the visible animation, not on click.
                const horizSpeed = Math.hypot(player.vel.x, player.vel.z);
                const speedRatio = Math.max(1.0, horizSpeed / 13.5);
                // Skill reward remains, but cannot erase the intended 3-hit baseline.
                const momentumBonus = cls.id === 1
                    ? Math.min(12, Math.round((speedRatio - 1.0) * 7)) : 0;
                activeWeaponSwing = ArenaWeaponSweep.begin(cls.id === 1 ? 'spear' : 'sword',
                    cls.range, player.comboStep);
                activeWeaponSwing.classIdx = player.classIdx;
                activeWeaponSwing.damage = cls.damage;
                activeWeaponSwing.headshotDamage = cls.headshotDamage;
                activeWeaponSwing.bonus = momentumBonus;
                activeWeaponSwing.weaponName = cls.weaponName;
                activeWeaponSwing.tag = momentumBonus >= 20 ? '⚡ HIZ ' : '';
            }
            // [3] 1600 FLINTLOCK MUSKET
            else if (cls.type === 'hitscan') {
                sfx.playMusketBoom();
                player.ammo = 0;
                player.lastMusketShotAt = arenaClock;
                player.shakeIntensity = 0.35;
                muzzleLight.position.copy(camera.position).addScaledVector(dir, 1.2);
                muzzleLight.intensity = 3.5;
                updateHUD();

                // Camera and viewmodel recoil are now handled as decaying impulses.

                // Volumetric lingering black-powder smoke cloud
                spawnSmokeCloud(camera.position, dir, 22, 3.0);

                if (!checkBarrelHit(cls.range)) {
                    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                    raycaster.far = cls.range;
                    const botMeshes = [];
                    bots.filter(b => !b.dead).forEach(b => b.mesh.traverse(c => {
                        if (c.isMesh && c.userData.hitZone !== 'ignore') botMeshes.push(c);
                    }));
                    const hits = raycaster.intersectObjects(botMeshes, false);

                    if (hits.length > 0 && !arenaWorldBlockBetween(camera.position, hits[0].point)) {
                        const hit = hits[0];
                        const bot = bots[hit.object.userData.botIndex];
                        const zone = ArenaWeaponBalance.zoneFromMesh(
                            hit.object, hit.point.y, bot ? bot.mesh.position.y : 0);
                        if (bot) {
                            damageBot(bot, ArenaWeaponBalance.damage('musket',zone),
                                zone === 'head', cls.weaponName, '', hit.point);
                        }
                    }
                }

                setTimeout(() => {
                    if (player.classIdx === 3 && player.ammo === 0 && !player.isReloading) {
                        startReload();
                    }
                }, 260);
            }
        }

        function releaseChargedBow() {
            if (!player.isDrawingBow) return;
            const charge = Math.max(0.25, player.bowCharge);
            player.isDrawingBow = false;
            player.bowCharge = 0;
            if (!ArenaWeaponBalance.ready(player.lastBowShotAt, arenaClock,'bow')) return;
            player.lastBowShotAt = arenaClock;
            player.attackCooldown = ArenaWeaponBalance.SHOT_INTERVAL.bow;
            player.attackAnimTime = 1.0;
            registerWeaponSwing('bow');
            document.getElementById('bow-charge-ui').classList.add('hidden');

            sfx.playBowRelease(charge);
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

            // Create physical 3D arrow with feathered fletching
            const arrowGroup = new THREE.Group();
            const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.25), goldMat);
            const head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), steelMat);
            head.rotation.x = -Math.PI / 2;
            head.position.z = -0.68;
            arrowGroup.add(shaft, head);
            arrowGroup.position.copy(camera.position).addScaledVector(dir, 0.9);
            arrowGroup.quaternion.copy(camera.quaternion);
            scene.add(arrowGroup);

            const speed = 38 + charge * 46; // Up to 84 speed at full draw!
            arrows.push({
                mesh: arrowGroup,
                vel: dir.clone().multiplyScalar(speed),
                charge,
                gravityFactor: 18 * (1.25 - charge * 0.75), // Flatter trajectory at full draw
                life: 3.5,
                trailTimer: 0
            });
        }

        function startReload() {
            if (player.classIdx !== 3 || player.isReloading || player.ammo === 1) return;
            sfx.playReloadStep(1);
            player.isReloading = true;
            player.reloadTimer = Math.max(0.01,
                ArenaWeaponBalance.SHOT_INTERVAL.musket -
                (arenaClock - player.lastMusketShotAt));
            player.lastReloadStep = 1;
            document.getElementById('reload-indicator').classList.remove('hidden');
            updateHUD();
        }

        // ============================================================================
        // 10. INPUT LISTENERS & POINTER LOCK
        // ============================================================================
        const menuOverlay = document.getElementById('menu-overlay');
        const playBtn = document.getElementById('play-btn');
        const sensSlider = document.getElementById('sens-slider');
        const sensValue = document.getElementById('sens-value');
        const matchResultsOverlay = document.getElementById('match-results-overlay');
        const matchResultsTable = document.getElementById('match-results-table');
        const matchWinnerTitle = document.getElementById('match-winner-title');
        const matchDurationLabel = document.getElementById('match-duration-label');
        const liveScoreboardOverlay = document.getElementById('match-live-scoreboard');
        const liveScoreboardTable = document.getElementById('match-live-table');
        const matchDurationButtons = [...document.querySelectorAll('[data-duration-seconds]')];
        let tabScoreboardHeld = false;
        let scoreboardRefreshSeconds = 0;

        function hideLiveScoreboard() {
            tabScoreboardHeld = false;
            liveScoreboardOverlay.classList.add('hidden');
            liveScoreboardOverlay.setAttribute('aria-hidden', 'true');
        }

        function renderLiveScoreboard() {
            if (!tabScoreboardHeld || arenaMatch.phase !== 'playing') return;
            const standings = ArenaMatch.leaderboard(player, bots);
            liveScoreboardTable.replaceChildren();
            for (const entry of standings) {
                const row = document.createElement('div');
                row.className = 'match-live-row' + (entry.isPlayer ? ' is-player' : '');
                for (const value of [entry.rank, entry.name, entry.kills, entry.deaths, entry.kd.toFixed(2)]) {
                    const cell = document.createElement('span');
                    cell.className = 'match-live-cell';
                    cell.textContent = String(value);
                    row.appendChild(cell);
                }
                liveScoreboardTable.appendChild(row);
            }
            liveScoreboardOverlay.classList.remove('hidden');
            liveScoreboardOverlay.setAttribute('aria-hidden', 'false');
        }

        function syncMatchDurationControls() {
            const editable = arenaMatch.phase === 'menu';
            matchDurationButtons.forEach(button => {
                const selected = Number(button.dataset.durationSeconds) === arenaMatch.durationSeconds;
                button.disabled = !editable;
                button.classList.toggle('selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
            matchDurationLabel.textContent = ArenaMatch.clock(arenaMatch.durationSeconds);
        }

        matchDurationButtons.forEach(button => button.addEventListener('click', () => {
            if (arenaMatch.phase !== 'menu') return;
            ArenaMatch.configure(arenaMatch, Number(button.dataset.durationSeconds));
            matchTimeSeconds = arenaMatch.remaining;
            document.getElementById('hud-timer').textContent = ArenaMatch.clock(matchTimeSeconds);
            syncMatchDurationControls();
        }));

        function resetFreeForAllRound() {
            hideLiveScoreboard();
            scoreboardRefreshSeconds = 0;
            ArenaTelemetry.reset(arenaTelemetry);
            telemetrySampleAccumulator = 0;
            player.kills = 0;
            player.deaths = 0;
            player.streak = 0;
            player.hp = player.maxHp;
            player.vel.set(0, 0, 0);
            player.onGround = false;
            player.isSliding = false;
            player.currentHeight = player.standHeight;
            player.ammo = 1;
            player.lastBowShotAt = -Infinity;
            player.lastMusketShotAt = -Infinity;
            player.isReloading = false;
            player.reloadTimer = 0;
            player.attackCooldown = 0;
            player.attackAnimTime = 0;
            player.weaponKick = 0;
            player.shakeIntensity = 0;
            player.shieldParryTime = 0;
            player.shieldParryCooldown = 0;
            player.isShielding = false;
            player.bowCharge = 0;
            player.isDrawingBow = false;
            player.bhopChain = 0;
            player.tpsMotionState = ArenaCharacterMotion.createState();
            activeWeaponSwing = null;
            impactHoldSeconds = 0;
            const safeSpawn = chooseArenaRespawn(COURTYARD_SPAWNS, null, false);
            player.pos.set(safeSpawn.x, safeSpawn.y + player.currentHeight, safeSpawn.z);
            bots.forEach(bot => {
                bot.arenaKills = 0;
                bot.arenaDeaths = 0;
                bot.lastRangedShotAt = -Infinity;
                bot.hp = bot.maxHp;
                bot.dead = false;
                bot.respawnTimer = 0;
                bot.hasHelmet = true;
                bot.mesh._parts.helmetGroup.visible = true;
                bot.mesh.rotation.x = 0;
                bot.mesh.rotation.z = 0;
                bot.mesh.scale.set(1, 1, 1);
                bot.mesh.position.copy(chooseArenaRespawn(
                    bot.preferWall ? RAMPART_SPAWNS : COURTYARD_SPAWNS, bot, false));
                bot.navPath.length = 0;
                bot.navGoal = null;
                bot.navRefresh = 0;
                bot.navStuck = 0;
                ArenaBotRecovery.reset(bot.navRecovery);
                bot.navLastPosition.copy(bot.mesh.position);
                bot.tacticGoal = null;
                bot.tacticTargetKey = null;
                bot.tacticLastTarget = null;
                bot.tacticRefresh = 0;
                bot.tacticMode = 'patrol';
                bot.hitReactionTime = 0;
                bot.underFireUntil = 0;
                bot.staggerTime = 0;
                bot.meleeWindup = 0;
                bot.rangedWindup = 0;
                bot.windupTargetKey = null;
                bot.strikePoseTime = 0;
                bot.motionState = ArenaCharacterMotion.createState();
                bot.guardTime = 0;
                bot.guardParryTime = 0;
                bot.guardCooldown = 0;
                bot.attackTimer = 0.8 + Math.random() * 0.8;
                bot.arenaTargetType = null;
                bot.arenaTargetId = null;
                bot.arenaLockTime = 0;
                bot.arenaAggroType = null;
                bot.arenaAggroId = null;
                bot.arenaAggroUntil = 0;
            });
            document.getElementById('kill-feed').replaceChildren();
            document.getElementById('reload-indicator').classList.add('hidden');
            document.getElementById('bow-charge-ui').classList.add('hidden');
            document.getElementById('shield-overlay').style.opacity = '0';
            ArenaMatch.begin(arenaMatch);
            syncMatchDurationControls();
            matchTimeSeconds = arenaMatch.remaining;
            document.getElementById('hud-timer').textContent = ArenaMatch.clock(matchTimeSeconds);
            matchResultsOverlay.classList.add('hidden');
            updateHUD();
        }

        function showMatchResults() {
            hideLiveScoreboard();
            const result = ArenaMatch.finish(arenaMatch, player, bots);
            matchDurationLabel.textContent = ArenaMatch.clock(result.seconds);
            isGameActive = false;
            activeWeaponSwing = null;
            Object.keys(keys).forEach(key => { keys[key] = false; });
            menuOverlay.classList.add('hidden');
            matchResultsTable.replaceChildren();
            matchWinnerTitle.textContent = result.playerWon
                ? '🏆 KUŞATMAYI KAZANDIN!'
                : '🏆 KAZANAN: ' + result.winnerName;
            result.standings.forEach(entry => {
                const line = document.createElement('div');
                line.className = 'grid grid-cols-[2.5rem_1fr_3rem_3rem_3.5rem] items-center gap-2 rounded-lg px-3 py-2 border border-white/10 ' +
                    (entry.isPlayer ? 'bg-amber-500/20 text-amber-200' : 'bg-slate-800/80 text-slate-100');
                for (const value of [entry.rank, entry.name, entry.kills, entry.deaths, entry.kd.toFixed(2)]) {
                    const cell = document.createElement('span');
                    cell.className = 'text-sm sm:text-base font-bold krunker-text truncate';
                    cell.textContent = String(value);
                    line.appendChild(cell);
                }
                matchResultsTable.appendChild(line);
            });
            matchResultsOverlay.classList.remove('hidden');
            if (document.pointerLockElement === canvas && document.exitPointerLock)
                document.exitPointerLock();
        }

        sensSlider.addEventListener('input', (e) => {
            mouseSensitivity = parseFloat(e.target.value);
            sensValue.textContent = `${mouseSensitivity.toFixed(1)}x`;
        });

        playBtn.addEventListener('click', () => {
            sfx.init();
            if (arenaMatch.phase === 'menu' || arenaMatch.phase === 'results')
                resetFreeForAllRound();
            else ArenaMatch.resume(arenaMatch);
            isGameActive = arenaMatch.phase === 'playing';
            syncMatchDurationControls();
            menuOverlay.classList.add('hidden');
            if (canvas.requestPointerLock) canvas.requestPointerLock();
        });

        document.getElementById('match-replay-btn').addEventListener('click', () => {
            resetFreeForAllRound();
            isGameActive = true;
            menuOverlay.classList.add('hidden');
            if (canvas.requestPointerLock) canvas.requestPointerLock();
        });
        // Optional local diagnostic export after a round; no network or gameplay mutation.
        document.getElementById('match-qa-export-btn').addEventListener('click', () => {
            if (arenaMatch.phase !== 'results' || !arenaMatch.result) return;
            const report = {
                schema: 'killtheking-ffa-qa-v1',
                matchResult: arenaMatch.result,
                metrics: window.krunkerArenaBalanceReport()
            };
            const blob = new Blob([JSON.stringify(report, null, 2)],
                {type:'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'KillTheKing_FFA_QA_' +
                Math.round(arenaMatch.durationSeconds / 60) + 'min.json';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
        document.getElementById('match-menu-btn').addEventListener('click', () => {
            arenaMatch.phase = 'menu';
            ArenaMatch.configure(arenaMatch, arenaMatch.durationSeconds);
            matchTimeSeconds = arenaMatch.remaining;
            document.getElementById('hud-timer').textContent = ArenaMatch.clock(matchTimeSeconds);
            syncMatchDurationControls();
            hideLiveScoreboard();
            isGameActive = false;
            matchResultsOverlay.classList.add('hidden');
            menuOverlay.classList.remove('hidden');
            playBtn.textContent = 'YENİ MAÇ BAŞLAT';
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                if (arenaMatch.phase === 'paused') ArenaMatch.resume(arenaMatch);
                isGameActive = arenaMatch.phase === 'playing';
                if (isGameActive) menuOverlay.classList.add('hidden');
            } else {
                hideLiveScoreboard();
                if (arenaMatch.phase === 'playing') ArenaMatch.pause(arenaMatch);
                isGameActive = false;
                activeWeaponSwing = null;
                syncMatchDurationControls();
                if (arenaMatch.phase !== 'results') {
                    menuOverlay.classList.remove('hidden');
                    playBtn.textContent = arenaMatch.phase === 'paused'
                        ? 'MAÇA DEVAM ET' : 'KUŞATMAYA GİR (BAŞLA)';
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isGameActive) return;
            const isZoomed = (player.classIdx === 3 || player.classIdx === 2) && player.isRMBDown;
            const sens = 0.0022 * mouseSensitivity * (isZoomed ? 0.55 : 1.0);
            player.yaw -= e.movementX * sens;
            player.pitch -= e.movementY * sens;
            player.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, player.pitch));

            // Add weapon sway impulse
            player.swayX = THREE.MathUtils.clamp(player.swayX - e.movementX * 0.0006, -0.08, 0.08);
            player.swayY = THREE.MathUtils.clamp(player.swayY + e.movementY * 0.0006, -0.08, 0.08);
        });

        window.addEventListener('mousedown', (e) => {
            if (!isGameActive) return;
            if (e.button === 0) {
                if (player.classIdx === 2) {
                    // Start drawing bow
                    if (player.attackCooldown <= 0 &&
                        ArenaWeaponBalance.ready(player.lastBowShotAt, arenaClock,'bow')) {
                        player.isDrawingBow = true;
                        player.bowCharge = 0.1;
                        document.getElementById('bow-charge-ui').classList.remove('hidden');
                    }
                } else {
                    performPrimaryAttack();
                }
            } else if (e.button === 2) {
                player.isRMBDown = true;
                if (player.classIdx === 0) {
                    // Fresh shield raise grants a short parry, never spammable.
                    if (!player.isShielding && player.shieldParryCooldown <= 0) {
                        player.shieldParryTime = ArenaCombatDefense.PARRY_DURATION;
                        player.shieldParryCooldown = ArenaCombatDefense.PARRY_COOLDOWN;
                    }
                    player.isShielding = true;
                    document.getElementById('shield-overlay').style.opacity = '1';
                    document.getElementById('hud-status-badge').textContent = player.shieldParryTime > 0 ? '⚔️ SAVUŞTURMA PENCERESİ' : '🛡️ KALKAN AÇIK';
                } else if (player.classIdx === 1) {
                    // Pikeman triggers Kargı Hücumu!
                    performQuickAbilityOrMelee();
                } else {
                    // Archer / Musketeer ADS Zoom
                    document.getElementById('ads-overlay').style.opacity = '1';
                    document.getElementById('crosshair').style.transform = 'scale(0.65)';
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0 && player.classIdx === 2 && player.isDrawingBow) {
                releaseChargedBow();
            } else if (e.button === 2) {
                player.isRMBDown = false;
                player.isShielding = false;
                player.shieldParryTime = 0;
                document.getElementById('shield-overlay').style.opacity = '0';
                document.getElementById('ads-overlay').style.opacity = '0';
                document.getElementById('crosshair').style.transform = 'scale(1)';
                document.getElementById('hud-status-badge').textContent = 'HAZIR';
            }
        });

        window.addEventListener('contextmenu', e => e.preventDefault());

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Tab') {
                // Keep native TAB keyboard navigation usable in the menu and results.
                if (isGameActive && arenaMatch.phase === 'playing') {
                    e.preventDefault();
                    tabScoreboardHeld = true;
                    if (!e.repeat) {
                        renderLiveScoreboard();
                        scoreboardRefreshSeconds = 0.15;
                    }
                }
                return;
            }
            keys[e.code] = true;
            if (e.code === 'Digit1') selectClass(0);
            if (e.code === 'Digit2') selectClass(1);
            if (e.code === 'Digit3') selectClass(2);
            if (e.code === 'Digit4') selectClass(3);
            if (e.code === 'KeyR') startReload();
            if (e.code === 'KeyF' || e.code === 'KeyV') performQuickAbilityOrMelee();
            if (e.code === 'KeyH') setAtmosphere(currentAtmosphereIdx + 1);
            if (e.code === 'KeyP') toggleThirdPerson();
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Tab') {
                if (tabScoreboardHeld) e.preventDefault();
                hideLiveScoreboard();
                return;
            }
            keys[e.code] = false;
        });
        window.addEventListener('blur', () => {
            hideLiveScoreboard();
            Object.keys(keys).forEach(key => { keys[key] = false; });
            if (arenaMatch.phase === 'playing') {
                ArenaMatch.pause(arenaMatch);
                isGameActive = false;
                if (document.pointerLockElement === canvas && document.exitPointerLock)
                    document.exitPointerLock();
            }
        });

        const speedLinesCanvas = document.getElementById('speed-lines-canvas');
        const speedLinesCtx = speedLinesCanvas.getContext('2d');

        function resizeCanvases() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            speedLinesCanvas.width = window.innerWidth;
            speedLinesCanvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvases);
        resizeCanvases();

        // ============================================================================
        // 11. COLLISION DETECTION, JUMP PADS & SLIDE-HOPPING PHYSICS
        // ============================================================================
        function getRampHeightAt(x, z) {
            for (const r of ramps) {
                if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) {
                    let t = 0;
                    if (r.dir === 'NN') t = (r.maxZ - z) / (r.maxZ - r.minZ - 1.5);
                    else if (r.dir === 'N') t = (r.maxZ - z) / (r.maxZ - r.minZ);
                    else if (r.dir === 'S') t = (z - r.minZ) / (r.maxZ - r.minZ);
                    else if (r.dir === 'W') t = (r.maxX - x) / (r.maxX - r.minX);
                    return r.startY + Math.max(0, Math.min(1, t)) * (r.endY - r.startY);
                }
            }
            return 0;
        }

        function resolvePlayerCollisions(dt) {
            const rad = player.radius;
            const h = player.currentHeight;
            // Sweep the entire player footprint across each frame: endpoint
            // overlap tests let high-speed slide-hops pass through narrow walls.
            const swept = ArenaPlayerCollision.move({
                from: player.pos, velocity: player.vel, dt,
                radius: rad, height: h, colliders
            });
            // A wooden ramp is a walkable slope from its entrance but a
            // raised vertical side from the courtyard. Reject side teleports.
            const terrain = ArenaPlayerCollision.limitRampEntry({
                from: player.pos, to: {x: swept.x, z: swept.z},
                radius: rad, height: h, groundAt: getRampHeightAt
            });
            player.pos.x = terrain.x;
            player.pos.z = terrain.z;
            // Keep tangential slide-hop movement; stop only blocked axes.
            if (swept.hitX || terrain.hitX) player.vel.x = 0;
            if (swept.hitZ || terrain.hitZ) player.vel.z = 0;

            player.pos.y += player.vel.y * dt;
            let floorY = getRampHeightAt(player.pos.x, player.pos.z);

            for (const c of colliders) {
                if (player.pos.x + rad > c.minX && player.pos.x - rad < c.maxX &&
                    player.pos.z + rad > c.minZ && player.pos.z - rad < c.maxZ) {
                    if (player.pos.y - h >= c.maxY - 1.15 && player.vel.y <= 0) {
                        floorY = Math.max(floorY, c.maxY);
                    }
                }
            }

            if (player.pos.y - h <= floorY) {
                player.pos.y = floorY + h;
                player.vel.y = 0;
                player.onGround = true;
            } else {
                player.onGround = false;
            }

            // Check Jump Pads in Courtyard
            for (const pad of jumpPads) {
                if (pad.cooldown > 0) pad.cooldown -= dt;
                const dPad = Math.hypot(player.pos.x - pad.x, player.pos.z - pad.z);
                if (dPad < pad.radius && player.pos.y - h < 1.2 && pad.cooldown <= 0) {
                    pad.cooldown = 0.45;
                    player.vel.y = 21.5; // High siege launch!
                    player.onGround = false;
                    player.bhopChain = Math.min(6, player.bhopChain + 1.5);
                    sfx.playJumpPad();
                    addScorePopup('🚀 MANCINIK SIÇRAMASI!', 'text-sky-300');
                }
            }
        }

        // ============================================================================
        // 12. SPEED LINES & LIVE RADAR RENDERERS
        // ============================================================================
        const radarCanvas = document.getElementById('radar-canvas');
        const radarCtx = radarCanvas.getContext('2d');

        function renderSpeedLines(displaySpeed) {
            speedLinesCtx.clearRect(0, 0, speedLinesCanvas.width, speedLinesCanvas.height);
            if (displaySpeed < 130) return;

            const alpha = Math.min(0.45, (displaySpeed - 130) / 110);
            const cx = speedLinesCanvas.width / 2;
            const cy = speedLinesCanvas.height / 2;
            const maxR = Math.hypot(cx, cy);

            speedLinesCtx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            speedLinesCtx.lineWidth = 2;

            const t = performance.now() * 0.02;
            for (let i = 0; i < 28; i++) {
                const angle = (i / 28) * Math.PI * 2 + Math.sin(t + i) * 0.04;
                const innerR = maxR * (0.58 + (Math.sin(t * 2 + i * 3) * 0.08));
                speedLinesCtx.beginPath();
                speedLinesCtx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
                speedLinesCtx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
                speedLinesCtx.stroke();
            }
        }

        function renderRadar() {
            const w = radarCanvas.width;
            const h = radarCanvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const scale = (w / 2) / 46; // Arena is -42 to +42

            radarCtx.clearRect(0, 0, w, h);

            // Outer wall square
            radarCtx.strokeStyle = 'rgba(255,255,255,0.22)';
            radarCtx.lineWidth = 2;
            radarCtx.strokeRect(cx - 42 * scale, cy - 42 * scale, 84 * scale, 84 * scale);

            // Jump Pads (Cyan)
            radarCtx.fillStyle = '#38bdf8';
            jumpPads.forEach(jp => {
                radarCtx.fillRect(cx + jp.x * scale - 2, cy + jp.z * scale - 2, 4, 4);
            });

            // Explosive Barrels (Orange)
            radarCtx.fillStyle = '#f97316';
            barrels.forEach(b => {
                if (b.active) {
                    radarCtx.beginPath();
                    radarCtx.arc(cx + b.pos.x * scale, cy + b.pos.z * scale, 2.6, 0, Math.PI * 2);
                    radarCtx.fill();
                }
            });

            // Enemies (Red dots)
            radarCtx.fillStyle = '#ef4444';
            bots.forEach(bot => {
                if (bot.dead) return;
                radarCtx.beginPath();
                radarCtx.arc(cx + bot.mesh.position.x * scale, cy + bot.mesh.position.z * scale, 3.2, 0, Math.PI * 2);
                radarCtx.fill();
            });

            // Player position & FOV cone (Lime/Amber)
            const px = cx + player.pos.x * scale;
            const pz = cy + player.pos.z * scale;
            const lookAngle = -player.yaw - Math.PI / 2;

            radarCtx.fillStyle = 'rgba(250, 204, 21, 0.22)';
            radarCtx.beginPath();
            radarCtx.moveTo(px, pz);
            radarCtx.arc(px, pz, 18, lookAngle - 0.5, lookAngle + 0.5);
            radarCtx.closePath();
            radarCtx.fill();

            radarCtx.fillStyle = '#a3e635';
            radarCtx.beginPath();
            radarCtx.arc(px, pz, 3.5, 0, Math.PI * 2);
            radarCtx.fill();
        }

        // ============================================================================
        // 13. MAIN GAME LOOP v2.0
        // ============================================================================
        let lastTime = performance.now();
        const arenaMatch = ArenaMatch.create();
        const arenaTelemetry = ArenaTelemetry.create();
        let telemetrySampleAccumulator = 0;
        let matchTimeSeconds = arenaMatch.remaining;
        syncMatchDurationControls();
        let fpsFrames = 0;
        let fpsTimer = 0;

        // Procedural animation of existing joint groups only; no mesh replacement.
        function blendArticulatedRig(parts, pose, dt) {
            const rate = Math.min(1, dt * 15);
            parts.leftLeg.rotation.x = THREE.MathUtils.lerp(parts.leftLeg.rotation.x, pose.leftLeg, rate);
            parts.rightLeg.rotation.x = THREE.MathUtils.lerp(parts.rightLeg.rotation.x, pose.rightLeg, rate);
            if (parts.leftArm) parts.leftArm.rotation.x = THREE.MathUtils.lerp(parts.leftArm.rotation.x, pose.leftArm, rate);
            if (parts.rightArm) parts.rightArm.rotation.x = THREE.MathUtils.lerp(parts.rightArm.rotation.x, pose.rightArm, rate);
            if (parts.torso) {
                parts.torso.rotation.x = THREE.MathUtils.lerp(parts.torso.rotation.x, pose.torsoX, rate);
                parts.torso.rotation.z = THREE.MathUtils.lerp(parts.torso.rotation.z, pose.torsoZ, rate);
            }
            if (parts.head) parts.head.rotation.x = THREE.MathUtils.lerp(parts.head.rotation.x, pose.headX, rate);
            if (parts.capeMesh) parts.capeMesh.rotation.x = THREE.MathUtils.lerp(parts.capeMesh.rotation.x, pose.capeX, rate);
        }

        // TPS player shares the bot rig solver but never changes gameplay physics.
        function applyPlayerTpsMotion(model, dt, groundTravel) {
            if (!model || !model._parts) return;
            const roles = ['knight', 'pikeman', 'archer', 'musket'];
            const attackLevel = Math.max(0, Math.min(1,
                player.attackAnimTime / (CLASSES[player.classIdx].type === 'melee' ? .82 : 1)));
            const pose = ArenaCharacterMotion.update(player.tpsMotionState, dt, {
                travel: player.onGround && !player.isSliding ? groundTravel : 0,
                role: roles[player.classIdx],
                guard: player.classIdx === 0 && player.isShielding,
                strike: .25 * attackLevel,
                sliding: player.onGround && player.isSliding,
                airborne: !player.onGround,
                hit: 0, stagger: 0
            });
            blendArticulatedRig(model._parts, pose, dt);
        }

        function applyBotMotion(bot, dt, distance = 0) {
            const pose = ArenaCharacterMotion.update(bot.motionState, dt, {
                travel: distance, role: bot.role, windup: bot.meleeWindup,
                strike: bot.strikePoseTime, guard: bot.guardTime > 0,
                stagger: bot.staggerTime, hit: bot.hitReactionTime
            });
            blendArticulatedRig(bot.mesh._parts, pose, dt);
            bot.strikePoseTime = Math.max(0, bot.strikePoseTime - dt);
        }

        function updateGame(dt) {
            arenaClock += dt;
            if (player.shieldParryTime > 0) {
                player.shieldParryTime = Math.max(0, player.shieldParryTime - dt);
                if (player.shieldParryTime === 0 && player.isShielding) {
                    document.getElementById('hud-status-badge').textContent = '🛡️ KALKAN AÇIK';
                }
            }
            player.shieldParryCooldown = Math.max(0, player.shieldParryCooldown - dt);
            const cls = CLASSES[player.classIdx];

            // Decay muzzle flash light
            if (muzzleLight.intensity > 0) {
                muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 28);
            }

            // Drift 3D Voxel Clouds across the sky
            skyClouds.forEach(c => {
                c.mesh.position.x += c.speed * dt;
                if (c.mesh.position.x > 130) c.mesh.position.x = -130;
            });

            // Flicker torches & spawn occasional embers
            const nowSec = performance.now() * 0.001;
            torches.forEach(t => {
                t.light.intensity = 1.25 + Math.sin(nowSec * 12 + t.phase) * 0.25;
                t.flame.scale.y = 0.9 + Math.cos(nowSec * 15 + t.phase) * 0.22;
                if (t.innerCore) t.innerCore.scale.y = 0.85 + Math.sin(nowSec * 18 + t.phase) * 0.2;
                if (Math.random() < 0.06) {
                    const ember = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
                    ember.position.copy(t.basePos);
                    scene.add(ember);
                    particles.push({
                        mesh: ember,
                        vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.5 + Math.random(), (Math.random() - 0.5) * 0.6),
                        life: 0.45,
                        maxLife: 0.45
                    });
                }
            });

            // Barrel Respawns & Floating Labels
            barrels.forEach(b => {
                if (!b.active) {
                    b.respawnTimer -= dt;
                    if (b.respawnTimer <= 0) {
                        b.active = true;
                        b.hp = 40;
                        b.group.visible = true;
                    }
                } else {
                    const dToPlayer = b.pos.distanceTo(player.pos);
                    const topWorld = b.pos.clone().add(new THREE.Vector3(0, 2.7, 0));
                    const proj = topWorld.project(camera);
                    if (proj.z < 1.0 && dToPlayer < 28) {
                        b.label.style.display = 'block';
                        b.label.style.left = `${(proj.x * 0.5 + 0.5) * window.innerWidth}px`;
                        b.label.style.top = `${(-proj.y * 0.5 + 0.5) * window.innerHeight}px`;
                    } else {
                        b.label.style.display = 'none';
                    }
                }
            });

            // 1. Cooldowns, Bow Draw & Multi-Stage 1600s Musket Reload
            if (player.attackCooldown > 0) player.attackCooldown = Math.max(0, player.attackCooldown - dt);
            if (player.attackAnimTime > 0) player.attackAnimTime = Math.max(0, player.attackAnimTime - dt * (cls.type === 'melee' ? 3.7 : 4.2));
            player.weaponKick = THREE.MathUtils.lerp(player.weaponKick, 0, Math.min(1, dt * 17));
            player.weaponTilt = THREE.MathUtils.lerp(player.weaponTilt, 0, Math.min(1, dt * 15));
            player.cameraImpactPitch = THREE.MathUtils.lerp(player.cameraImpactPitch, 0, Math.min(1, dt * 19));
            player.cameraImpactYaw = THREE.MathUtils.lerp(player.cameraImpactYaw, 0, Math.min(1, dt * 19));
            if (player.quickMeleeTime > 0) player.quickMeleeTime = Math.max(0, player.quickMeleeTime - dt * 4.5);
            if (player.abilityCooldown > 0) {
                player.abilityCooldown = Math.max(0, player.abilityCooldown - dt);
                updateHUD();
            }

            if (player.isDrawingBow) {
                player.bowCharge = Math.min(1.0, player.bowCharge +
                    dt / ArenaWeaponBalance.BOW_DRAW_SECONDS);
                const pct = Math.round(player.bowCharge * 100);
                document.getElementById('bow-charge-label').textContent = pct >= 100 ? '🔥 TAM GERİLDİ (%100)!' : `YAY GERİLİYOR: %${pct}`;
                document.getElementById('bow-charge-fill').style.width = `${pct}%`;
            }

            if (player.isReloading) {
                player.reloadTimer -= dt;
                const total = CLASSES[3].reloadTime;
                const progress = (total - player.reloadTimer) / total;
                const pct = Math.min(100, Math.max(0, progress * 100));
                document.getElementById('reload-bar-fill').style.width = `${pct}%`;

                const stageEl = document.getElementById('reload-stage-text');
                if (progress < 0.38) {
                    stageEl.textContent = '1/3 BARUT DÖKÜLÜYOR...';
                } else if (progress < 0.78) {
                    stageEl.textContent = '2/3 HARBİ İLE SIKIŞTIRILIYOR...';
                    if (player.lastReloadStep === 1) { player.lastReloadStep = 2; sfx.playReloadStep(2); }
                } else {
                    stageEl.textContent = '3/3 ÇAKMAKTAŞI KURULUYOR...';
                    if (player.lastReloadStep === 2) { player.lastReloadStep = 3; sfx.playReloadStep(3); }
                }

                if (player.reloadTimer <= 0) {
                    player.isReloading = false;
                    player.ammo = 1;
                    document.getElementById('reload-indicator').classList.add('hidden');
                    updateHUD();
                }
            }

            // 2. Player Movement & True Krunker Slide-Hopping Mechanic
            if (isGameActive) {
                const wantsSlide = keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyC'];
                player.isSliding = wantsSlide;
                const targetHeight = wantsSlide ? player.crouchHeight : player.standHeight;
                player.currentHeight = THREE.MathUtils.lerp(player.currentHeight, targetHeight, dt * 14);

                const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
                const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);

                const moveDir = new THREE.Vector3();
                if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forward);
                if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forward);
                if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(right);
                if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(right);
                if (moveDir.lengthSq() > 0) moveDir.normalize();

                // Slide-Hop & Bunny-Hop Jump
                if (keys['Space'] && player.onGround) {
                    player.vel.y = 12.6;
                    player.onGround = false;
                    if (moveDir.lengthSq() > 0) {
                        // Jumping out of a slide (Shift/C) grants huge Krunker slide-hop boost!
                        const gain = wantsSlide ? 1.45 : 0.85;
                        player.bhopChain = Math.min(6.5, player.bhopChain + gain);
                        if (wantsSlide && player.bhopChain > 2.5) {
                            document.getElementById('hud-slide-indicator').textContent = `⚡ SLIDE-HOP x${player.bhopChain.toFixed(1)}!`;
                        }
                    }
                } else if (player.onGround && !keys['Space']) {
                    // Sliding on ground preserves momentum much longer than walking!
                    const decayRate = wantsSlide ? 1.8 : 6.5;
                    player.bhopChain = Math.max(0, player.bhopChain - dt * decayRate);
                    if (player.bhopChain < 0.5) {
                        document.getElementById('hud-slide-indicator').textContent = 'SHIFT + SPACE: SLIDE-HOP';
                    }
                }

                const slowFactor = (player.isShielding || player.isDrawingBow) ? 0.76 : 1.0;
                const baseMoveSpeed = (cls.speed / 100) * 14.5 * slowFactor;
                const bhopMultiplier = 1.0 + player.bhopChain * 0.135;
                const targetSpeed = baseMoveSpeed * bhopMultiplier;

                const accel = player.onGround ? (wantsSlide ? 8.0 : 14.0) : 5.2;
                player.vel.x = THREE.MathUtils.lerp(player.vel.x, moveDir.x * targetSpeed, accel * dt);
                player.vel.z = THREE.MathUtils.lerp(player.vel.z, moveDir.z * targetSpeed, accel * dt);

                player.vel.y -= 30.0 * dt;
                // Drive TPS footfall by actual post-collision translation, not velocity
                // (bots and players may have high velocity while pressed against walls).
                const oldTPSX = player.pos.x, oldTPSZ = player.pos.z;
                resolvePlayerCollisions(dt);
                const actualGroundTravel = Math.hypot(player.pos.x-oldTPSX, player.pos.z-oldTPSZ);
                const safeGroundTravel = actualGroundTravel < 3.5 ? actualGroundTravel : 0;

                const horizSpeed = Math.hypot(player.vel.x, player.vel.z);
                const displaySpeed = Math.round((horizSpeed / 14.5) * cls.speed);
                const speedEl = document.getElementById('hud-speed');
                speedEl.textContent = displaySpeed > 5 ? displaySpeed : 0;
                speedEl.className = displaySpeed > 135 ? 'text-sky-300' : displaySpeed > 110 ? 'text-amber-400' : 'text-white';

                renderSpeedLines(displaySpeed);

                // Dynamic FOV & Screen Shake
                const isZoomed = (player.classIdx === 3 || player.classIdx === 2) && player.isRMBDown;
                const targetFov = isZoomed ? 48 : (80 + Math.max(0, displaySpeed - 100) * 0.18);
                camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 12);
                camera.updateProjectionMatrix();

                // Camera Shake decay
                let shakeX = 0, shakeY = 0;
                if (player.shakeIntensity > 0) {
                    shakeX = (Math.random() - 0.5) * player.shakeIntensity * 0.15;
                    shakeY = (Math.random() - 0.5) * player.shakeIntensity * 0.15;
                    player.shakeIntensity = Math.max(0, player.shakeIntensity - dt * 2.2);
                }

                // First-Person vs [P] Third-Person Over-the-Shoulder Camera
                camera.rotation.y = player.yaw + shakeX + player.cameraImpactYaw;
                camera.rotation.x = player.pitch + shakeY + player.cameraImpactPitch;
                camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, wantsSlide ? -0.035 : 0, dt * 10);

                if (player.isThirdPerson && playerCharGroup) {
                    const camBack = new THREE.Vector3(0.65, 0.65, 4.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
                    camera.position.copy(player.pos).add(camBack);

                    // Update player's own 3D character mesh pose & animations
                    playerCharGroup.position.set(player.pos.x, player.pos.y - player.currentHeight, player.pos.z);
                    playerCharGroup.rotation.y = player.yaw + Math.PI;

                    const activeModel = playerClassModels[player.classIdx];
                    applyPlayerTpsMotion(activeModel, dt, safeGroundTravel);
                } else {
                    camera.position.copy(player.pos);
                }

                // Relax weapon sway back to center
                player.swayX = THREE.MathUtils.lerp(player.swayX, 0, dt * 10);
                player.swayY = THREE.MathUtils.lerp(player.swayY, 0, dt * 10);

                const vm = viewmodels[player.classIdx];
                if (vm) {
                    const bobTime = performance.now() * 0.011;
                    const isMoving = horizSpeed > 1.5 && player.onGround && !wantsSlide;
                    const bobX = isMoving ? Math.cos(bobTime) * 0.025 : 0;
                    const bobY = isMoving ? Math.abs(Math.sin(bobTime * 2)) * 0.028 : 0;

                    const adsOffsetX = isZoomed ? -0.17 : 0;
                    const adsOffsetY = isZoomed ? 0.055 : 0;

                    const anim = Math.sin(player.attackAnimTime * Math.PI);
                    let atkRotX = 0, atkRotZ = 0, atkZ = 0;

                    if (player.classIdx === 0) { // Knight Sword + Shield + Glowing Slash Arc
                        if (activeWeaponSwing && activeWeaponSwing.kind === 'sword') {
                            const phase = THREE.MathUtils.clamp(1 - player.attackAnimTime / 0.82, 0, 1);
                            const visual = ArenaWeaponSweep.visualPose('sword', activeWeaponSwing.side, phase);
                            atkRotX = visual.rotationX;
                            atkRotZ = visual.rotationZ;
                            atkZ = visual.offsetZ;
                        } else {
                            atkRotX = -anim * 1.15;
                            atkRotZ = (player.comboStep === 0 ? 1 : -0.7) * anim * 0.85;
                            atkZ = -anim * 0.25;
                        }
                        if (meleeSlashTrailMesh) {
                            meleeSlashTrailMesh.material.opacity = anim * 0.68;
                            meleeSlashTrailMesh.rotation.z = (player.comboStep === 0 ? -1 : 1) * player.attackAnimTime * 2.5;
                        }
                        if (leftShieldGroup) {
                            leftShieldGroup.position.x = THREE.MathUtils.lerp(leftShieldGroup.position.x, player.isShielding ? -0.16 : -0.42, dt * 14);
                            leftShieldGroup.position.y = THREE.MathUtils.lerp(leftShieldGroup.position.y, player.isShielding ? -0.10 : -0.24, dt * 14);
                            leftShieldGroup.rotation.y = THREE.MathUtils.lerp(leftShieldGroup.rotation.y, player.isShielding ? 0.05 : 0.35, dt * 14);
                        }
                    } else if (player.classIdx === 1) { // Pikeman Spear
                        if (activeWeaponSwing && activeWeaponSwing.kind === 'spear') {
                            const phase = THREE.MathUtils.clamp(1 - player.attackAnimTime / 0.82, 0, 1);
                            atkZ = ArenaWeaponSweep.visualPose('spear', activeWeaponSwing.side, phase).offsetZ;
                        } else {
                            atkZ = -anim * 0.72;
                        }
                        if (meleeSlashTrailMesh) meleeSlashTrailMesh.material.opacity = 0;
                    } else if (player.classIdx === 2) { // Archer Bow Draw
                        atkZ = anim * 0.14;
                        if (meleeSlashTrailMesh) meleeSlashTrailMesh.material.opacity = 0;
                        if (bowArrowMesh && bowStringMesh) {
                            const pullZ = player.isDrawingBow ? player.bowCharge * 0.26 : 0;
                            bowArrowMesh.position.z = -0.68 + pullZ;
                            bowStringMesh.position.z = -0.52 + pullZ;
                        }
                    } else if (player.classIdx === 3) { // 1600 Musket + Animated Ramrod & Hammer
                        atkZ = anim * 0.28;
                        if (meleeSlashTrailMesh) meleeSlashTrailMesh.material.opacity = 0;
                        const reloadPitch = player.isReloading ? -0.48 + Math.sin(performance.now() * 0.015) * 0.12 : 0;
                        atkRotX = anim * 0.38 + reloadPitch;
                        if (musketHammerMesh) {
                            musketHammerMesh.rotation.x = player.ammo === 1 ? -0.45 : 0.25;
                        }
                        if (musketRamrodMesh) {
                            if (player.isReloading) {
                                musketRamrodMesh.position.y = -0.15;
                                musketRamrodMesh.position.z = -1.15 + Math.sin(performance.now() * 0.022) * 0.28;
                            } else {
                                musketRamrodMesh.position.y = -0.20;
                                musketRamrodMesh.position.z = -0.88;
                            }
                        }
                    }

                    vm.position.set(adsOffsetX + bobX + player.swayX, adsOffsetY - bobY + player.swayY - player.weaponKick * 0.13, atkZ + player.weaponKick);
                    vm.rotation.x = (player.classIdx === 0 ? -0.22 : 0) + atkRotX + player.weaponKick * 0.36;
                    vm.rotation.z = (player.classIdx === 0 ? 0.08 : player.classIdx === 2 ? 0.18 : 0) + atkRotZ + player.weaponTilt;
                }

                // Quick Melee Bayonet / Dagger Slash animation
                if (quickDaggerGroup) {
                    if (player.quickMeleeTime > 0) {
                        quickDaggerGroup.visible = true;
                        const sAnim = Math.sin(player.quickMeleeTime * Math.PI);
                        quickDaggerGroup.position.set(-0.15 + sAnim * 0.2, -0.18, -0.35 - sAnim * 0.55);
                        quickDaggerGroup.rotation.x = -sAnim * 0.4;
                    } else {
                        quickDaggerGroup.visible = false;
                    }
                }
            }

            // Trace the animated sword arc or spear thrust on each frame.
            if (activeWeaponSwing && isGameActive && player.classIdx === activeWeaponSwing.classIdx) {
                const swing = activeWeaponSwing;
                const origin = (player.isThirdPerson ? player.pos : camera.position).clone();
                const orientation = camera.quaternion.clone();
                // Keep one candidate buffer per swing and ignore distant
                // dynamic combatants; static castle geometry always stays in.
                const targets = swing.contactTargets || (swing.contactTargets = []);
                targets.length = 0;
                for (const mesh of worldMeshes) targets.push(mesh);
                for (const bot of bots) {
                    if (bot.dead || !ArenaWeaponSweep.withinReach(origin, bot.mesh.position, swing.reach, 4)) continue;
                    bot.mesh.traverse(c => {
                        if (c.isMesh && c.userData.hitZone !== 'ignore') targets.push(c);
                    });
                }
                for (const barrel of barrels) {
                    if (!barrel.active || !ArenaWeaponSweep.withinReach(origin, barrel.pos, swing.reach, 4)) continue;
                    barrel.group.traverse(c => { if (c.isMesh) targets.push(c); });
                }
                const castSegment = (localFrom, localTo, worldSpace) => {
                    // World-space bridges cover player displacement between frames;
                    // the usual animation segments remain local to the camera.
                    const from = worldSpace
                        ? new THREE.Vector3(localFrom.x, localFrom.y, localFrom.z)
                        : origin.clone().add(new THREE.Vector3(
                            localFrom.x, localFrom.y, localFrom.z).applyQuaternion(orientation));
                    const to = worldSpace
                        ? new THREE.Vector3(localTo.x, localTo.y, localTo.z)
                        : origin.clone().add(new THREE.Vector3(
                            localTo.x, localTo.y, localTo.z).applyQuaternion(orientation));
                    const direction = to.sub(from);
                    const length = direction.length();
                    if (length < 0.001) return null;
                    swing.raycastCount = (swing.raycastCount || 0) + 1;
                    raycaster.set(from, direction.multiplyScalar(1 / length));
                    raycaster.near = 0.001;
                    raycaster.far = length;
                    const hit = raycaster.intersectObjects(targets, false)[0];
                    if (!hit) return null;
                    const index = hit.object.userData.botIndex;
                    if (index !== undefined && bots[index] && !bots[index].dead)
                        return {kind:'bot',bot:bots[index],point:hit.point,
                            hitZone:ArenaWeaponBalance.zoneFromMesh(
                                hit.object,hit.point.y,bots[index].mesh.position.y),
                            isHead:!!hit.object.userData.isHead,distance:hit.distance};
                    const barrelIndex = hit.object.userData.barrelIndex;
                    if (barrelIndex !== undefined && barrels[barrelIndex] && barrels[barrelIndex].active)
                        return {kind:'barrel',barrel:barrels[barrelIndex],distance:hit.distance};
                    return {kind:'world',distance:hit.distance};
                };
                let impact = null;
                if (!player.isThirdPerson && visualWeaponTipMarkers[swing.classIdx] &&
                    visualWeaponGripMarkers[swing.classIdx]) {
                    // Use current rendered model transforms, including recoil, sway and bob.
                    const marker = visualWeaponTipMarkers[swing.classIdx];
                    const gripMarker = visualWeaponGripMarkers[swing.classIdx];
                    camera.updateMatrixWorld(true);
                    const tip = camera.worldToLocal(marker.getWorldPosition(new THREE.Vector3()));
                    const grip = camera.worldToLocal(gripMarker.getWorldPosition(new THREE.Vector3()));
                    const proxy = ArenaModelWeaponContact.proxy({
                        kind: swing.kind, reach: swing.reach, origin,
                        forward: new THREE.Vector3(0, 0, -1).applyQuaternion(orientation),
                        right: new THREE.Vector3(1, 0, 0).applyQuaternion(orientation),
                        grip, tip
                    });
                    impact = ArenaModelWeaponContact.advance(swing, dt,
                        proxy ? {origin,point:proxy.point} : null,
                        (from, to) => castSegment(from, to, true));
                } else {
                    // TPS has a hidden camera-attached viewmodel: keep the
                    // original player-centered sweep until TPS is calibrated.
                    impact = ArenaWeaponSweep.advance(swing, dt, castSegment, localTip => {
                        const tip = new THREE.Vector3(localTip.x, localTip.y, localTip.z);
                        return tip.applyQuaternion(orientation).add(origin);
                    });
                }
                if (impact && impact.kind === 'barrel') triggerBarrelExplosion(impact.barrel);
                else if (impact && impact.kind === 'bot') {
                    const kind = swing.classIdx === 1 ? 'spear' : 'sword';
                    const zone = impact.hitZone || (impact.isHead ? 'head'
                        : ArenaWeaponBalance.zoneFromAim(impact.point && impact.point.y,
                            impact.bot.mesh.position.y));
                    const damage = ArenaWeaponBalance.damage(kind,zone) + swing.bonus;
                    damageBot(impact.bot, damage, zone === 'head', swing.weaponName, swing.tag, impact.point);
                }
                if (swing.finished || swing.resolved) {
                    lastWeaponSwingRaycasts = swing.raycastCount || 0;
                    activeWeaponSwing = null;
                }
            } else if (activeWeaponSwing && (!isGameActive || player.classIdx !== activeWeaponSwing.classIdx)) {
                activeWeaponSwing = null;
            }

            // 3. Update Physical Arrows, Wind Trails & Sticking Impact
            for (let i = arrows.length - 1; i >= 0; i--) {
                const arr = arrows[i];
                arr.life -= dt;
                arr.vel.y -= arr.gravityFactor * dt;

                const prevPos = arr.mesh.position.clone();
                arr.mesh.position.addScaledVector(arr.vel, dt);
                arr.mesh.lookAt(arr.mesh.position.clone().add(arr.vel));

                // Spawn wind trail cube behind arrow
                arr.trailTimer -= dt;
                if (arr.trailTimer <= 0) {
                    arr.trailTimer = 0.025;
                    const trail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.28), new THREE.MeshBasicMaterial({ color: 0xe5e7eb, transparent: true, opacity: 0.55 }));
                    trail.position.copy(prevPos);
                    trail.quaternion.copy(arr.mesh.quaternion);
                    scene.add(trail);
                    particles.push({ mesh: trail, vel: new THREE.Vector3(), life: 0.22, maxLife: 0.22, grow: false });
                }

                // Swept collision: find the FIRST obstruction along the complete frame segment.
                // Earlier frame-end overlap checks could hit a bot behind a wall.
                const impact = ArenaArrowCollision.sweep(prevPos, arr.mesh.position, {
                    barrels,
                    bots,
                    groundY: 0.15,
                    worldHit(from, to) {
                        const travel = to.clone().sub(from);
                        const distance = travel.length();
                        if (distance <= 0.000001) return null;
                        raycaster.set(from, travel.multiplyScalar(1 / distance));
                        raycaster.near = 0;
                        raycaster.far = distance;
                        return raycaster.intersectObjects(worldMeshes, false)[0] || null;
                    }
                });
                if (impact) {
                    arr.mesh.position.set(impact.point.x, impact.point.y, impact.point.z);
                    if (impact.type === 'barrel') {
                        triggerHitmarker(false);
                        triggerBarrelExplosion(impact.target);
                        scene.remove(arr.mesh);
                    } else if (impact.type === 'bot') {
                        const bot = impact.target;
                        const zone = ArenaWeaponBalance.zoneFromAim(
                            impact.point.y, bot.mesh.position.y);
                        const bowCls = CLASSES[2];
                        const baseDmg = ArenaWeaponBalance.damage('bow',zone,arr.charge);
                        damageBot(bot, baseDmg, zone === 'head', bowCls.weaponName, '', arr.mesh.position);
                        scene.remove(arr.mesh);
                    } else {
                        if (isGameActive && arr.mesh.position.distanceTo(player.pos) < 35) sfx.playArrowThud();
                        stuckArrows.push({ mesh: arr.mesh, life: 10.0 });
                    }
                    arrows.splice(i, 1);
                    continue;
                }

                if (arr.life <= 0) {
                    scene.remove(arr.mesh);
                    arrows.splice(i, 1);
                }
            }

            // Cleanup stuck arrows after 10s
            for (let i = stuckArrows.length - 1; i >= 0; i--) {
                stuckArrows[i].life -= dt;
                if (stuckArrows[i].life <= 0) {
                    scene.remove(stuckArrows[i].mesh);
                    stuckArrows.splice(i, 1);
                }
            }

            // Update Pop-off Flying Helmets
            for (let i = flyingHelmets.length - 1; i >= 0; i--) {
                const fh = flyingHelmets[i];
                fh.life -= dt;
                fh.vel.y -= 24 * dt;
                fh.mesh.position.addScaledVector(fh.vel, dt);
                fh.mesh.rotation.x += fh.rotVel.x * dt;
                fh.mesh.rotation.y += fh.rotVel.y * dt;
                fh.mesh.rotation.z += fh.rotVel.z * dt;
                if (fh.mesh.position.y < 0.25) {
                    fh.mesh.position.y = 0.25;
                    fh.vel.y *= -0.45;
                }
                if (fh.life <= 0) {
                    scene.remove(fh.mesh);
                    flyingHelmets.splice(i, 1);
                }
            }

            // 4. Update Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= dt;
                if (p.gravity) p.vel.y -= 18 * dt;
                if (p.drag) p.vel.multiplyScalar(p.drag);
                p.mesh.position.addScaledVector(p.vel, dt);
                if (p.grow) {
                    p.mesh.scale.addScalar(dt * 1.45);
                    if (p.mesh.material.transparent) {
                        p.mesh.material.opacity = Math.max(0, (p.life / p.maxLife) * 0.75);
                    }
                }
                if (p.life <= 0) {
                    scene.remove(p.mesh);
                    if (p.impactTemporary) {
                        p.mesh.geometry.dispose();
                        p.mesh.material.dispose();
                    }
                    particles.splice(i, 1);
                }
            }

            // 5. Update AI Bots & Screen-Space Health Bars
            bots.forEach(bot => {
                if (bot.dead) {
                    // Brief readable collapse, then a clean respawn with restored pose.
                    bot.respawnTimer -= dt;
                    bot.label.style.display = 'none';
                    const fallen = THREE.MathUtils.clamp((1.15 - bot.respawnTimer) / 0.32, 0, 1);
                    bot.mesh.rotation.z = bot.fallDirection * fallen * 1.22;
                    bot.mesh.rotation.x = -fallen * 0.20;
                    bot.mesh.scale.set(1.07, 1 - fallen * 0.18, 1.03);
                    const deathPose = ArenaCharacterMotion.deathPose(fallen, bot.fallDirection);
                    const parts = bot.mesh._parts;
                    parts.leftLeg.rotation.x = deathPose.leftLeg;
                    parts.rightLeg.rotation.x = deathPose.rightLeg;
                    if (parts.leftArm) parts.leftArm.rotation.x = deathPose.leftArm;
                    if (parts.rightArm) parts.rightArm.rotation.x = deathPose.rightArm;
                    if (parts.torso) {
                        parts.torso.rotation.x = deathPose.torsoX;
                        parts.torso.rotation.z = deathPose.torsoZ;
                    }
                    if (parts.head) parts.head.rotation.x = deathPose.headX;
                    if (bot.respawnTimer <= 0) {
                        bot.dead = false;
                        bot.hp = bot.maxHp;
                        bot.hasHelmet = true;
                        bot.mesh._parts.helmetGroup.visible = true;
                        const spawns = bot.preferWall ? RAMPART_SPAWNS : COURTYARD_SPAWNS;
                        bot.mesh.position.copy(chooseArenaRespawn(spawns, bot, true));
                        bot.navPath.length = 0;
                        bot.navGoal = null;
                        bot.navRefresh = 0;
                        bot.navStuck = 0;
                        ArenaBotRecovery.reset(bot.navRecovery);
                        bot.navLastPosition.copy(bot.mesh.position);
                        bot.tacticGoal = null;
                        bot.tacticTargetKey = null;
                        bot.tacticLastTarget = null;
                        bot.tacticRefresh = 0;
                        bot.tacticMode = 'patrol';
                        bot.mesh.rotation.x = 0;
                        bot.mesh.rotation.z = 0;
                        bot.mesh.scale.set(1, 1, 1);
                        bot.hitReactionTime = 0;
                        bot.underFireUntil = 0;
                        bot.staggerTime = 0;
                        bot.meleeWindup = 0;
                        bot.rangedWindup = 0;
                        bot.windupTargetKey = null;
                        bot.strikePoseTime = 0;
                        bot.motionState = ArenaCharacterMotion.createState();
                        bot.guardTime = 0;
                        bot.guardParryTime = 0;
                        bot.guardCooldown = 0;
                        bot.attackTimer = 0.8 + Math.random() * 0.8;
                        bot.arenaTargetType = null;
                        bot.arenaTargetId = null;
                        bot.arenaLockTime = 0;
                        bot.arenaAggroType = null;
                        bot.arenaAggroId = null;
                        bot.arenaAggroUntil = 0;
                    }
                    return;
                }
                if (bot.staggerTime > 0) {
                    bot.staggerTime = Math.max(0, bot.staggerTime - dt);
                    bot.attackTimer = Math.max(bot.attackTimer, 0.2);
                    applyBotMotion(bot, dt);
                    return;
                }
                const toPlayer = new THREE.Vector3().subVectors(player.pos, bot.mesh.position);
                const flatToPlayer = new THREE.Vector3(toPlayer.x, 0, toPlayer.z);
                const distToPlayer = flatToPlayer.length();
                // Bot guard starts in response to visible melee preparation,
                // not after getting hit. Some knights attempt a late precise read.
                bot.guardCooldown = Math.max(0, bot.guardCooldown - dt);
                bot.guardTime = Math.max(0, bot.guardTime - dt);
                bot.guardParryTime = Math.max(0, bot.guardParryTime - dt);
                if (bot.role === 'knight' && bot.guardCooldown <= 0) {
                    const threat = bots.find(other => other !== bot && !other.dead &&
                        other.meleeWindup > 0 && other.arenaTargetType === 'bot' &&
                        other.arenaTargetId === bot.id &&
                        other.mesh.position.distanceTo(bot.mesh.position) < 8 &&
                        arenaLineOfSight(other, bot.mesh.position, false));
                    // Knights also react to a visible player's melee wind-up rather than
                    // holding their shield only against other bots.
                    const playerMeleeThreat = !threat && ArenaBotOffense.playerMeleeThreat({
                        classIdx:player.classIdx, attackTime:player.attackAnimTime,
                        distance:distToPlayer, visible:arenaLineOfSight(bot, player.pos, true)
                    });
                    const lateRead = threat
                        ? (bot.id + threat.id + bot.guardAttempts) % 3 === 0
                        : (bot.id + bot.guardAttempts) % 3 === 0;
                    if ((threat || playerMeleeThreat) &&
                        (!lateRead || (threat ? threat.meleeWindup <= 0.18 : player.attackAnimTime <= 0.42))) {
                        const threatPos = threat ? threat.mesh.position : player.pos;
                        const dx = threatPos.x - bot.mesh.position.x;
                        const dz = threatPos.z - bot.mesh.position.z;
                        bot.guardFacingYaw = Math.atan2(-dx, -dz);
                        bot.guardTime = 0.8;
                        bot.guardParryTime = lateRead ? 0.23 : 0;
                        bot.guardCooldown = 2.4;
                        bot.guardAttempts++;
                    }
                }
                let arenaTarget = chooseArenaTarget(bot);
                const targetPosition = arenaTarget ? arenaTarget.position : null;
                const arenaDist = arenaTarget
                    ? arenaTargetDistance(bot, arenaTarget.type, arenaTarget.id) : Infinity;

                let moveTarget = bot.targetPoint;
                if (targetPosition) {
                    moveTarget = targetPosition;
                } else if (bot.mesh.position.distanceTo(bot.targetPoint) < 3.5) {
                    const pool = bot.preferWall ? RAMPART_SPAWNS : COURTYARD_SPAWNS;
                    bot.targetPoint = pool[Math.floor(Math.random() * pool.length)].clone();
                    moveTarget = bot.targetPoint;
                }

                // Navigation 2.0: route around world colliders and refresh moving-target paths.
                const botGround = {
                    x: bot.mesh.position.x, z: bot.mesh.position.z,
                    y: navigator.heightAt(bot.mesh.position.x, bot.mesh.position.z)
                };
                const goal = {
                    x: moveTarget.x, z: moveTarget.z,
                    y: navigator.heightAt(moveTarget.x, moveTarget.z)
                };
                const hasClearShot = !!(targetPosition &&
                    arenaLineOfSight(bot, targetPosition, arenaTarget.type === 'player'));
                let needsApproach = true;
                if (targetPosition) {
                    const key = arenaTarget.type + ':' + (arenaTarget.id == null ? 'player' : arenaTarget.id);
                    const moved = !bot.tacticLastTarget ||
                        Math.hypot(bot.tacticLastTarget.x - targetPosition.x,
                            bot.tacticLastTarget.z - targetPosition.z) > 5;
                    bot.tacticRefresh -= dt;
                    if (key !== bot.tacticTargetKey || moved || bot.tacticRefresh <= 0) {
                        const tactic = ArenaCombatTactics.plan({
                            role: bot.role, from: botGround, target: targetPosition,
                            range: bot.range, hasLineOfSight: hasClearShot,
                            underPressure: arenaClock < bot.underFireUntil,
                            navigator, seed: bot.id,
                            canSeeFrom: (candidate, opponent) => arenaCanSeeFrom(
                                candidate, opponent, arenaTarget.type === 'player')
                        });
                        bot.tacticMode = tactic.mode;
                        bot.tacticGoal = tactic.goal;
                        bot.tacticTargetKey = key;
                        bot.tacticLastTarget = targetPosition.clone();
                        bot.tacticRefresh = 0.68 + bot.id * 0.09;
                        bot.navPath.length = 0;
                        bot.navRefresh = 0;
                    }
                    needsApproach = bot.tacticMode !== 'hold';
                    if (bot.tacticGoal) {
                        goal.x = bot.tacticGoal.x;
                        goal.z = bot.tacticGoal.z;
                        goal.y = bot.tacticGoal.y;
                    }
                } else {
                    bot.tacticMode = 'patrol';
                    bot.tacticGoal = null;
                    bot.tacticTargetKey = null;
                }
                const directRoute = navigator.clearSegment(botGround, goal);

                bot.navRefresh -= dt;
                if (!directRoute && needsApproach &&
                    (!bot.navGoal || bot.navRefresh <= 0 ||
                     Math.hypot(goal.x - bot.navGoal.x, goal.z - bot.navGoal.z) > 4)) {
                    bot.navPath = navigator.findPath(botGround, goal);
                    bot.navGoal = goal;
                    bot.navRefresh = 0.75 + bot.id * 0.13;
                }
                if (directRoute) {
                    bot.navPath.length = 0;
                    bot.navGoal = goal;
                }

                let steerTarget = null;
                if (directRoute) {
                    steerTarget = goal;
                } else if (bot.navPath.length) {
                    while (bot.navPath.length > 1 &&
                        Math.hypot(bot.navPath[0].x - botGround.x,
                            bot.navPath[0].z - botGround.z) < 1.3) bot.navPath.shift();
                    steerTarget = bot.navPath[0];
                }
                let animationTravel = 0;
                let recoveryAttempting = needsApproach && !steerTarget && !directRoute;
                if (needsApproach && steerTarget) {
                    const stepDir = new THREE.Vector3(
                        steerTarget.x - botGround.x, 0, steerTarget.z - botGround.z);
                    const remaining = stepDir.length();
                    if (remaining > 0.1) {
                        recoveryAttempting = true;
                        stepDir.normalize();
                        bot.mesh.rotation.y = ArenaCharacterMotion.turnToward(
                            bot.mesh.rotation.y, Math.atan2(stepDir.x, stepDir.z), dt);
                        const beforeX = bot.mesh.position.x, beforeZ = bot.mesh.position.z;
                        const newPos = navigator.safeAdvance(botGround, stepDir,
                            Math.min(bot.speed * dt, remaining));
                        bot.mesh.position.x = newPos.x;
                        bot.mesh.position.z = newPos.z;
                        const madeProgress = Math.hypot(newPos.x-beforeX,newPos.z-beforeZ);
                        if (madeProgress > 0.025) animationTravel = madeProgress;
                    }
                } else {
                    // Hold tactical facing but ease the walk animation to idle.
                    if (targetPosition) {
                        const facing = targetPosition.clone().sub(bot.mesh.position);
                        if (facing.lengthSq() > 0.04) {
                            bot.mesh.rotation.y = ArenaCharacterMotion.turnToward(
                                bot.mesh.rotation.y, Math.atan2(facing.x, facing.z), dt);
                        }
                    }
                }
                const recovery = ArenaBotRecovery.advance(bot.navRecovery, dt, {
                    attempting: recoveryAttempting, travel: animationTravel,
                    targetKey: arenaTarget ? arenaTarget.type + ':' +
                        (arenaTarget.type === 'player' ? 'player' : arenaTarget.id) : null
                });
                // This reports actual sustained obstruction rather than resetting after
                // every retry; movement still only uses navigator.safeAdvance.
                bot.navStuck = bot.navRecovery.blockedFor;
                if (recovery.replan) {
                    bot.navPath.length = 0;
                    bot.navGoal = null;
                    bot.navRefresh = 0;
                    bot.tacticRefresh = 0;
                }
                if (recovery.retarget) {
                    // Stop pursuing an opponent behind an inaccessible route, briefly
                    // omit that opponent from candidate selection, and repath normally.
                    bot.arenaTargetType = null;
                    bot.arenaTargetId = null;
                    bot.arenaLockTime = 0;
                    bot.arenaAggroType = null;
                    bot.arenaAggroId = null;
                    bot.arenaAggroUntil = 0;
                    bot.tacticGoal = null;
                    bot.tacticTargetKey = null;
                    bot.meleeWindup = 0;
                    bot.rangedWindup = 0;
                    bot.windupTargetKey = null;
                    arenaTarget = null; // Prevent a stale same-frame combat strike.
                }

                // Hit reaction is visibly different from walk/breath cycle.
                if (bot.hitReactionTime > 0) {
                    bot.hitReactionTime = Math.max(0, bot.hitReactionTime - dt);
                    const impactEnvelope = Math.sin((bot.hitReactionTime / 0.24) * Math.PI);
                    bot.mesh.rotation.z = bot.hitLeanSign * Math.max(0, impactEnvelope) * 0.17;
                    bot.mesh.rotation.x = -Math.max(0, impactEnvelope) * 0.11;
                } else {
                    bot.mesh.rotation.z = THREE.MathUtils.lerp(bot.mesh.rotation.z, 0, dt * 12);
                    bot.mesh.rotation.x = THREE.MathUtils.lerp(bot.mesh.rotation.x, 0, dt * 12);
                }
                bot.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 14));
                // Ramp and upper-walkway elevation remain consistent with the route.
                const navHeight = navigator.heightAt(bot.mesh.position.x, bot.mesh.position.z);
                bot.mesh.position.y = THREE.MathUtils.lerp(bot.mesh.position.y,
                    navHeight, Math.min(1, dt * 10));

                // Aim towards any visible opponent within weapon reach while preparing
                // an attack, without rotating the movement vector or changing A* routes.
                if (targetPosition && hasClearShot && arenaDist <= bot.range) {
                    const dx = targetPosition.x - bot.mesh.position.x;
                    const dz = targetPosition.z - bot.mesh.position.z;
                    if (Math.hypot(dx, dz) > 0.05) {
                        bot.mesh.rotation.y = ArenaCharacterMotion.turnToward(
                            bot.mesh.rotation.y, Math.atan2(dx, dz), dt, 12);
                    }
                }
                // A windup belongs to a specific opponent; it cannot silently
                // switch to a different fighter during its final frame.
                const attackTargetKey = arenaTarget ? arenaTarget.type + ':' +
                    (arenaTarget.type === 'player' ? 'player' : arenaTarget.id) : null;
                // Melee and ranged bots telegraph before striking, leaving a chance
                // to move behind a wall or parry; all attacks still require clear sight.
                if (bot.rangedWindup > 0) {
                    bot.rangedWindup = Math.max(0, bot.rangedWindup - dt);
                    if (!arenaTarget || attackTargetKey !== bot.windupTargetKey ||
                        arenaDist > bot.range ||
                        !arenaLineOfSight(bot, targetPosition, arenaTarget.type === 'player')) {
                        bot.rangedWindup = 0;
                        bot.windupTargetKey = null;
                        bot.attackTimer = 0.35;
                    } else if (bot.rangedWindup <= 0) {
                        arenaBotAttack(bot, arenaTarget, arenaDist);
                    }
                } else if (bot.meleeWindup > 0) {
                    bot.meleeWindup = Math.max(0, bot.meleeWindup - dt);
                    // Motion layer renders the attack preparation pose.
                    if (!isGameActive || !arenaTarget ||
                        attackTargetKey !== bot.windupTargetKey ||
                        arenaDist > bot.range ||
                        !arenaLineOfSight(bot, targetPosition, arenaTarget.type === 'player')) {
                        bot.meleeWindup = 0;
                        bot.windupTargetKey = null;
                        bot.attackTimer = 0.35;
                    } else if (bot.meleeWindup <= 0) {
                        arenaBotAttack(bot, arenaTarget, arenaDist);
                    }
                } else if (isGameActive && arenaTarget && arenaDist <= bot.range) {
                    bot.attackTimer -= dt;
                    if (bot.attackTimer <= 0) {
                        bot.windupTargetKey = attackTargetKey;
                        if (bot.role === 'knight' || bot.role === 'pikeman') {
                            bot.meleeWindup = ArenaBotOffense.windup(bot.role);
                            bot.attackTimer = 0;
                        } else {
                            bot.rangedWindup = ArenaBotOffense.windup(bot.role);
                            bot.strikePoseTime = Math.max(bot.strikePoseTime, 0.16);
                            bot.attackTimer = 0;
                        }
                    }
                } else if (bot.attackTimer > 0) {
                    bot.attackTimer -= dt * 0.45;
                }

                applyBotMotion(bot, dt, animationTravel);

                // Project 3D position above bot head to 2D screen
                const headWorld = bot.mesh.position.clone().add(new THREE.Vector3(0, 3.4, 0));
                const projected = headWorld.project(camera);
                if (projected.z < 1.0 && distToPlayer < 75) {
                    const sx = (projected.x * 0.5 + 0.5) * window.innerWidth;
                    const sy = (-projected.y * 0.5 + 0.5) * window.innerHeight;
                    bot.label.style.display = 'flex';
                    bot.label.style.left = `${sx}px`;
                    bot.label.style.top = `${sy}px`;
                    bot.hpFill.style.width = `${Math.max(0, (bot.hp / bot.maxHp) * 100)}%`;
                } else {
                    bot.label.style.display = 'none';
                }
            });

            // Observations every game-time second; pausing stops updateGame entirely.
            // Sampling is measurement-only: never influences targeting or damage.
            telemetrySampleAccumulator += dt;
            if (telemetrySampleAccumulator >= 1) {
                ArenaTelemetry.sampleTargets(arenaTelemetry, bots);
                telemetrySampleAccumulator -= 1;
            }

            // 6. Match Timer, Radar & FPS Counter
            const matchFinished = ArenaMatch.tick(arenaMatch, dt);
            matchTimeSeconds = arenaMatch.remaining;
            document.getElementById('hud-timer').textContent = ArenaMatch.clock(matchTimeSeconds);
            if (matchFinished) showMatchResults();
            if (tabScoreboardHeld && arenaMatch.phase === 'playing') {
                scoreboardRefreshSeconds -= dt;
                if (scoreboardRefreshSeconds <= 0) {
                    renderLiveScoreboard();
                    scoreboardRefreshSeconds = 0.15;
                }
            }

            renderRadar();

            fpsFrames++;
            fpsTimer += dt;
            if (fpsTimer >= 0.5) {
                document.getElementById('hud-fps').textContent = Math.round(fpsFrames / fpsTimer);
                fpsFrames = 0;
                fpsTimer = 0;
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            const now = performance.now();
            const dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;

            let gameDt = dt;
            if (impactHoldSeconds > 0) {
                impactHoldSeconds = Math.max(0, impactHoldSeconds - dt);
                gameDt *= 0.16;
            }
            if (isGameActive && arenaMatch.phase === 'playing') updateGame(gameDt);
            renderer.render(scene, camera);
        }

        // Read-only runtime snapshot for arena QA; no controls or game state changes.
        window.krunkerArenaStatus = () => ({
            mode: 'serbest-arena',
            matchPhase: arenaMatch.phase,
            matchRemaining: arenaMatch.remaining,
            matchDurationSeconds: arenaMatch.durationSeconds,
            liveScoreboardVisible: !liveScoreboardOverlay.classList.contains('hidden'),
            telemetry: ArenaTelemetry.snapshot(arenaTelemetry),
            matchResults: arenaMatch.result,
            matchStandings: ArenaMatch.leaderboard(player, bots),
            playerClassIdx: player.classIdx,
            playerClassName: CLASSES[player.classIdx].name,
            botCount: bots.length,
            bots: bots.map(b => ({ name: b.name, role: b.role, weapon: b.weapon, hp: b.hp, dead: b.dead,
                remainingWaypoints: b.navPath.length, navigationStuckTime: b.navStuck,
                tacticalMode: b.tacticMode, meleeWindup: b.meleeWindup,
                guarding: b.guardTime > 0, guardParryTime: b.guardParryTime,
                walkBlend: b.motionState.weight, strikePoseTime: b.strikePoseTime,
                target: b.arenaTargetType === 'bot' && bots[b.arenaTargetId]
                    ? bots[b.arenaTargetId].name : b.arenaTargetType,
                arenaKills: b.arenaKills, arenaDeaths: b.arenaDeaths })),
            playerKills: player.kills,
            playerParries: player.parries,
            playerDeaths: player.deaths,
            playerTPSWalkBlend: player.tpsMotionState.weight,
            weaponSwingActive: !!activeWeaponSwing,
            lastWeaponSwingRaycasts,
            // Only sampled when inspected; doesn't add work to the game loop.
            visualWeaponTip: (player.classIdx < 2 && visualWeaponTipMarkers[player.classIdx])
                ? (() => {
                    const marker = visualWeaponTipMarkers[player.classIdx];
                    const world = marker.getWorldPosition(new THREE.Vector3());
                    const local = camera.worldToLocal(world);
                    return {x:local.x,y:local.y,z:local.z};
                })() : null
        });
        // Read-only A2 combat balance QA: computed only on explicit developer inspection.
        window.krunkerArenaBalanceReport = () => ArenaQAReport.summarize(window.krunkerArenaStatus());
        window.onload = function() {
            animate();
        };
    