import * as THREE from 'three';
import { Button3D } from '../../src/controls/Button3D.js';
import { VolumetricCard3D } from '../../src/controls/VolumetricCard3D.js';
import { KRAKOUT_LEVELS, BLOCK_TYPES, MONSTER_TYPES } from './KrakoutData.js';

export class CosmicBlockade {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.blocks = [];
        this.powerups = [];
        this.balls = [];
        this.monsters = [];
        this.popups = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 0;
        this.gameState = 'START';

        // Audio System
        this.audioCtx = null;
        this.masterGain = null;

        this.paddle = null;
        this.paddleWidth = 3;
        this.paddleVelocityX = 0;
        this.previousPaddleX = 0;

        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

        this.activeEffects = {
            largePaddle: 0,
            safetyFloor: 0,
            glue: false,
            stickyBall: null,
            missileMode: 0,
            slowMode: 0,
            bombMode: 0
        };

        this.floorMesh = null;
        this.hud = null;
        this.highScores = this.loadHighScores();

        this.init();
        this.setupEventListeners();
    }

    init() {
        this.setupPaddle();
        this.setupHUD();
        this.setupEnvironment();
        this.setupFloor();
        this.loadLevel(0);
    }

    setupEventListeners() {
        const handleInteraction = () => {
            this.initAudio();
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
        window.addEventListener('mousedown', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('mousedown', () => {
            if (this.activeEffects.stickyBall) {
                this.releaseBall();
                this.playSound('bounce');
            }
            if (this.activeEffects.missileMode > 0) {
                this.fireMissile();
            }
        });
    }

    loadHighScores() {
        const saved = localStorage.getItem('cosmic_blockade_scores');
        return saved ? JSON.parse(saved) : [{ name: "OMEGA", score: 5000 }, { name: "ALPHA", score: 2500 }];
    }

    saveHighScore(score) {
        this.highScores.push({ name: "PLAYER", score: score });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 5);
        localStorage.setItem('cosmic_blockade_scores', JSON.stringify(this.highScores));
    }

    loadLevel(index) {
        if (index >= KRAKOUT_LEVELS.length) {
            alert("UNIVERSAL MASTERY ACHIEVED! YOU CLEARED ALL LEVELS.");
            this.saveHighScore(this.score);
            location.reload();
            return;
        }

        this.currentLevel = index;
        const levelData = KRAKOUT_LEVELS[index];

        this.blocks.forEach(b => { if (b.dispose) b.dispose(); else this.scene.remove(b.group); });
        this.blocks = [];
        this.monsters.forEach(m => this.scene.remove(m));
        this.monsters = [];
        this.powerups.forEach(p => this.scene.remove(p));
        this.powerups = [];

        const layout = levelData.layout;
        const startX = -((layout[0].length - 1) * 1.6) / 2;
        const startY = 7.5;

        layout.forEach((row, rowIndex) => {
            row.forEach((type, colIndex) => {
                if (type && BLOCK_TYPES[type]) {
                    const x = startX + colIndex * 1.6;
                    const y = startY - rowIndex * 1.0;
                    this.spawnBlock(x, y, type);
                }
            });
        });

        this.resetBalls();
        this.showPopup(`LEVEL ${index + 1}: ${levelData.name}`, 0x00d4ff);
    }

    resetBalls() {
        this.balls.forEach(b => this.scene.remove(b));
        this.balls = [];
        this.spawnBall(0, -4, new THREE.Vector3(0.12, 0.12, 0));
    }

    setupPaddle() {
        const geo = new THREE.BoxGeometry(1, 0.6, 0.4);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 1,
            metalness: 0.8, roughness: 0.2
        });
        this.paddle = new THREE.Mesh(geo, mat);
        this.paddle.scale.x = this.paddleWidth;
        this.paddle.position.set(0, -5, 0);
        this.scene.add(this.paddle);

        const glowGeo = new THREE.BoxGeometry(1.1, 0.8, 0.3);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.2 });
        this.paddle.add(new THREE.Mesh(glowGeo, glowMat));
    }

    spawnBall(x, y, velocity) {
        const geo = new THREE.SphereGeometry(0.25, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00d4ff, emissiveIntensity: 1 });
        const ball = new THREE.Mesh(geo, mat);
        ball.position.set(x, y, 0);
        ball.velocity = velocity || new THREE.Vector3(0.12, 0.12, 0);
        ball.spin = 0; // Curve factor
        this.scene.add(ball);
        this.balls.push(ball);
    }

    spawnBlock(x, y, typeKey) {
        const config = BLOCK_TYPES[typeKey];
        const block = new Button3D(this.scene, this.camera, [x, y, 0], {
            renderer: this.renderer,
            text: typeKey === 'I' ? "METL" : (typeKey === 'N' ? "NOVA" : typeKey),
            width: 1.5,
            height: 0.8,
            color: config.color,
            onClick: () => { this.handleBlockHit(block); }
        });

        if (config.transparent) {
            block.group.traverse(child => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = config.opacity || 0.5;
                }
            });
        }

        if (config.emissive) {
            block.group.traverse(child => {
                if (child.material && (child.material.isMeshStandardMaterial || child.material.isMeshPhongMaterial)) {
                    child.material.emissive = new THREE.Color(config.emissive);
                    child.material.emissiveIntensity = config.emissiveIntensity || 1.0;
                }
            });
        }

        block.hp = config.hp;
        block.typeKey = typeKey;
        block.pulse = config.pulse || false;
        this.blocks.push(block);
    }

    handleBlockHit(block) {
        if (block.typeKey === 'I') return;

        if (this.activeEffects.bombMode > 0) {
            this.explode(block);
        } else {
            block.hp--;
            if (block.hp <= 0) {
                this.destroyBlock(block);
            } else {
                block.group.scale.set(1.1, 1.1, 1.1);
                setTimeout(() => { if (block.group) block.group.scale.set(1, 1, 1); }, 100);
            }
        }
    }

    explode(centerBlock) {
        const pos = centerBlock.group.position;
        const radius = 2.5;
        this.createExplosion(pos.x, pos.y, 0xffaa00, 30);
        this.playSound('destroy');

        const targets = this.blocks.filter(b => b.group.position.distanceTo(pos) < radius && b.typeKey !== 'I');
        targets.forEach(t => this.destroyBlock(t));

        const geo = new THREE.SphereGeometry(radius, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4 });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.copy(pos);
        this.scene.add(sphere);
        setTimeout(() => this.scene.remove(sphere), 300);
        this.activeEffects.bombMode--;
    }

    destroyBlock(block) {
        const pos = block.group.position;
        const color = BLOCK_TYPES[block.typeKey].color;
        this.createExplosion(pos.x, pos.y, color, 15);
        this.playSound('destroy');

        if (Math.random() < 0.25 || block.typeKey === 'N') {
            this.spawnPowerup(pos.x, pos.y);
        }

        this.score += BLOCK_TYPES[block.typeKey].points;
        if (block.dispose) block.dispose();
        else this.scene.remove(block.group);

        this.blocks = this.blocks.filter(b => b !== block);

        const destructibles = this.blocks.filter(b => b.typeKey !== 'I');
        if (destructibles.length === 0) {
            this.loadLevel(this.currentLevel + 1);
        }
    }

    spawnPowerup(x, y) {
        const letters = ['E', 'S', 'G', 'M', 'B', 'P', 'T'];
        const type = letters[Math.floor(Math.random() * letters.length)];

        const geo = new THREE.IcosahedronGeometry(0.4, 0);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 2 });
        const pu = new THREE.Mesh(geo, mat);
        pu.position.set(x, y, 0);
        pu.type = type;

        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white'; ctx.font = 'bold 48px Arial'; ctx.textAlign = 'center';
        ctx.fillText(type, 32, 48);
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.scale.set(0.6, 0.6, 1);
        pu.add(sprite);

        this.scene.add(pu);
        this.powerups.push(pu);
    }

    showPopup(text, color = 0xffff00) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
        ctx.font = 'bold 32px Arial'; ctx.textAlign = 'center';
        ctx.fillText(text, 128, 42);

        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.position.set(this.paddle.position.x, this.paddle.position.y + 1.5, 0);
        sprite.scale.set(4, 1, 1);
        this.scene.add(sprite);

        this.popups.push({ mesh: sprite, life: 2.0 });
    }

    spawnMonster() {
        const template = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)];
        let geo;
        if (template.geo === 'Torus') geo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        else if (template.geo === 'Sphere') geo = new THREE.SphereGeometry(0.3, 8, 8);
        else geo = new THREE.DodecahedronGeometry(0.3, 0);

        const mat = new THREE.MeshStandardMaterial({ color: template.color, emissive: template.color, emissiveIntensity: 1 });
        const monster = new THREE.Mesh(geo, mat);
        monster.position.set((Math.random() - 0.5) * 12, 8, 0);
        monster.velocity = new THREE.Vector2((Math.random() - 0.5) * 0.1, -0.04);
        monster.monsterType = template.type;
        monster.behavior = template.behavior;
        this.scene.add(monster);
        this.monsters.push(monster);
    }

    applyPowerup(type) {
        this.score += 500;
        this.playSound('powerup');
        this.createExplosion(this.paddle.position.x, this.paddle.position.y, 0xffff00, 20);
        switch (type) {
            case 'E': this.activeEffects.largePaddle = 15; this.paddle.scale.x = this.paddleWidth * 1.5; this.showPopup("EXPANDED!"); break;
            case 'S': this.activeEffects.slowMode = 10; this.showPopup("TIME SLOWED"); break;
            case 'G': this.activeEffects.glue = true; this.showPopup("GLUE ACTIVE"); break;
            case 'M': this.activeEffects.missileMode = 20; this.showPopup("MISSILES ARMED"); break;
            case 'B': this.activeEffects.bombMode = 5; this.showPopup("BOMBS LOADED"); break;
            case 'P': this.activeEffects.safetyFloor = 1; this.floorMesh.material.opacity = 0.5; this.showPopup("SHIELD UP"); break;
            case 'T': Array(2).fill().forEach(() => this.spawnBall(this.paddle.position.x, this.paddle.position.y + 1)); this.showPopup("TRIPLE BALL!"); break;
        }
    }

    releaseBall() {
        if (this.activeEffects.stickyBall) {
            this.activeEffects.stickyBall.velocity.set(0, 0.12, 0);
            this.activeEffects.stickyBall = null;
        }
    }

    fireMissile() {
        this.playSound('shoot');
        const geo = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(this.paddle.position.x, this.paddle.position.y + 0.5, 0);
        m.velocity = new THREE.Vector3(0, 0.25, 0);
        this.scene.add(m);
        this.monsters.push(m);
        m.isMissile = true;
        this.activeEffects.missileMode--;
    }

    setupHUD() {
        this.hud = new VolumetricCard3D(this.scene, this.camera, [-8, 6, -5], {
            renderer: this.renderer, title: "KRAKOUT MEGA", width: 5, height: 4, color: 0x101020, opacity: 0.9
        });
    }

    setupEnvironment() {
        const geo = new THREE.BoxGeometry(14, 16, 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.05 });
        this.scene.add(new THREE.Mesh(geo, mat));
    }

    setupFloor() {
        const geo = new THREE.PlaneGeometry(14, 0.5);
        this.floorMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 }));
        this.floorMesh.position.y = -7.5; this.floorMesh.rotation.x = Math.PI / 2;
        this.scene.add(this.floorMesh);
    }

    initAudio() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioCtx.destination);
    }

    playSound(type) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.audioCtx.currentTime;

        if (type === 'bounce') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'destroy') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'powerup') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554, now + 0.1);
            osc.frequency.setValueAtTime(659, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'shoot') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    }

    createExplosion(x, y, color, count = 10) {
        this.particleGeo = this.particleGeo || new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const mat = new THREE.MeshBasicMaterial({ color: color });

        for (let i = 0; i < count; i++) {
            const p = new THREE.Mesh(this.particleGeo, mat);
            p.position.set(x, y, 0);
            p.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.1
            );
            p.life = 1.0;
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    update(delta) {
        if (this.gameState !== 'PLAYING') return;

        this.updateTimers(delta);
        this.updatePaddle();
        this.updateBalls();
        this.updatePopups(delta);
        this.updateBlocks(delta);
        this.updateParticles(delta);
        this.updatePowerups();
        this.updateMonsters();
        this.checkCollisions();
        this.updateHUDDisplay();

        if (Math.random() < 0.008) this.spawnMonster();
    }

    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.position.add(p.velocity);
            p.life -= 1.5 * delta;
            const s = Math.max(0, p.life);
            p.scale.set(s, s, s);
            if (p.life <= 0) {
                this.scene.remove(p);
                if (p.material) p.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.position.y -= 0.05;
            p.rotation.y += 0.05;
            p.rotation.x += 0.02;

            // Collision with paddle
            const dist = p.position.distanceTo(this.paddle.position);
            if (dist < 1.0) {
                this.applyPowerup(p.type);
                this.scene.remove(p);
                this.powerups.splice(i, 1);
            } else if (p.position.y < -9) {
                this.scene.remove(p);
                this.powerups.splice(i, 1);
            }
        }
    }

    updatePopups(delta) {
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            p.life -= 0.016;
            p.mesh.position.y += 0.01;
            p.mesh.material.opacity = p.life;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.popups.splice(i, 1);
            }
        }
    }

    updateBlocks(delta) {
        this.blocks.forEach(block => {
            if (block.pulse) {
                const s = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
                block.group.scale.set(s, s, s);
            }
        });
    }

    updateTimers(delta) {
        if (this.activeEffects.largePaddle > 0) {
            this.activeEffects.largePaddle -= 0.016;
            if (this.activeEffects.largePaddle <= 0) this.paddle.scale.x = this.paddleWidth;
        }
        if (this.activeEffects.slowMode > 0) this.activeEffects.slowMode -= 0.016;
        if (this.activeEffects.missileMode <= 0) this.activeEffects.missileMode = 0;
    }

    updatePaddle() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersectPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.plane, intersectPoint);
        if (intersectPoint) {
            const targetX = THREE.MathUtils.clamp(intersectPoint.x, -5.5, 5.5);
            this.paddle.position.x += (targetX - this.paddle.position.x) * 0.25;
            this.paddleVelocityX = this.paddle.position.x - this.previousPaddleX;
            this.previousPaddleX = this.paddle.position.x;

            if (this.activeEffects.stickyBall) {
                this.activeEffects.stickyBall.position.x = this.paddle.position.x;
            }
        }
    }

    updateBalls() {
        const speedMult = this.activeEffects.slowMode > 0 ? 0.5 : 1.0;
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            if (ball === this.activeEffects.stickyBall) continue;

            // Apply spin (Magnus effect) - curves the velocity vector
            if (Math.abs(ball.spin) > 0.01) {
                const curvePower = ball.spin * 0.05;
                ball.velocity.x += curvePower;
                ball.spin *= 0.98; // Friction/Air resistance on spin
            }

            ball.position.add(ball.velocity.clone().multiplyScalar(speedMult));

            // Visual rotation based on velocity and spin
            ball.rotation.z -= ball.velocity.x * 2 + (ball.spin * 0.5);

            if (Math.abs(ball.position.x) > 6.5) {
                ball.velocity.x *= -1;
                ball.position.x = Math.sign(ball.position.x) * 6.5;
                this.playSound('bounce');
                // Wall impact generates some spin based on angle
                ball.spin += ball.velocity.y * 0.2;
            }
            if (ball.position.y > 7.8) {
                ball.velocity.y *= -1;
                ball.position.y = 7.8;
                this.playSound('bounce');
                ball.spin *= 1.1; // Bonus spin on ceiling hit
            }

            if (ball.position.y < -7 && this.activeEffects.safetyFloor > 0) {
                ball.velocity.y = Math.abs(ball.velocity.y);
                this.activeEffects.safetyFloor--;
                this.floorMesh.material.opacity = 0;
                this.showPopup("SHIELD USED", 0xffaa00);
            } else if (ball.position.y < -9) {
                this.scene.remove(ball);
                this.balls.splice(i, 1);
            }
        }

        if (this.balls.length === 0) {
            this.handleLifeLost();
        }
    }

    handleLifeLost() {
        this.lives--;
        if (this.lives > 0) {
            this.showPopup(`LIVES LEFT: ${this.lives}`, 0xff0000);
            this.resetBalls();
        } else {
            this.gameOver();
        }
    }

    updateMonsters() {
        const ball = this.balls[0]; // Primary ball for stalking
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const m = this.monsters[i];

            if (m.isMissile) {
                m.position.y += 0.25;
            } else {
                if (m.behavior === 'follow' && ball) {
                    const dir = ball.position.x - m.position.x;
                    m.velocity.x += Math.sign(dir) * 0.005;
                    m.velocity.x = THREE.MathUtils.clamp(m.velocity.x, -0.05, 0.05);
                } else if (m.behavior === 'teleport' && Math.random() < 0.01) {
                    m.position.x = (Math.random() - 0.5) * 10;
                }
                m.position.add(new THREE.Vector3(m.velocity.x, m.velocity.y, 0));
            }

            if (m.position.y < -9 || m.position.y > 9) { this.scene.remove(m); this.monsters.splice(i, 1); }
        }
    }

    checkCollisions() {
        this.balls.forEach(ball => {
            const dx = Math.abs(ball.position.x - this.paddle.position.x);
            const dy = Math.abs(ball.position.y - this.paddle.position.y);
            const currentHalfWidth = this.paddle.scale.x / 2;

            if (dx < (currentHalfWidth + 0.3) && dy < 0.5 && ball.velocity.y < 0) {
                this.playSound('bounce');
                this.createExplosion(ball.position.x, ball.position.y, 0x00d4ff, 5);
                if (this.activeEffects.glue) {
                    this.activeEffects.stickyBall = ball;
                    ball.velocity.set(0, 0, 0);
                    ball.spin = 0;
                    this.activeEffects.glue = false;
                } else {
                    ball.velocity.y = Math.abs(ball.velocity.y);
                    const hitOffset = (ball.position.x - this.paddle.position.x) / currentHalfWidth;

                    // SPIN GENERATION: Paddle movement adds spin
                    const impactSpin = this.paddleVelocityX * 1.5;
                    ball.spin = (ball.spin * 0.5) + impactSpin + (hitOffset * 0.1);

                    ball.velocity.x = hitOffset * 0.18 + (this.paddleVelocityX * 0.45);
                    ball.velocity.clampLength(0.15, 0.45);

                    if (Math.abs(ball.spin) > 0.3) this.showPopup("MEGA SPIN!!", 0xcc00ff);
                }
            }

            this.blocks.forEach(block => {
                const dist = ball.position.distanceTo(block.group.position);
                if (dist < 1.1) {
                    ball.velocity.y *= -1;
                    ball.position.add(ball.velocity);
                    this.handleBlockHit(block);
                }
            });

            this.monsters.forEach(m => {
                if (!m.isMissile && ball.position.distanceTo(m.position) < 0.7) {
                    ball.velocity.x *= -1.1; ball.velocity.y *= -1.1;
                }
            });
        });

        this.monsters.filter(m => m.isMissile).forEach(missile => {
            this.blocks.forEach(block => {
                if (missile.position.distanceTo(block.group.position) < 1.0) {
                    this.handleBlockHit(block);
                    missile.position.y = 10;
                }
            });
        });
    }

    updateHUDDisplay() {
        if (!this.hud) return;
        const top = this.highScores[0];
        const hearts = "❤️".repeat(this.lives);
        const msg = `# LVL ${this.currentLevel + 1}: ${KRAKOUT_LEVELS[this.currentLevel].name}\n` +
            `LIVES: ${hearts}\n` +
            `PTS: ${this.score}\n` +
            `BEST: ${top.score} (${top.name})\n` +
            `BLK: ${this.blocks.filter(b => b.typeKey !== 'I').length}\n` +
            (this.activeEffects.missileMode > 0 ? `🚀 MISSILES: ${this.activeEffects.missileMode}\n` : "") +
            (this.activeEffects.stickyBall ? "🧲 STUCK!" : "");
        this.hud.set('content', msg);
    }

    start() {
        this.gameState = 'PLAYING';
        this.score = 0;
        this.lives = 3;
        this.loadLevel(0);
    }

    gameOver() {
        this.gameState = 'GAMEOVER';
        this.saveHighScore(this.score);
        alert(`GAME OVER.\nLEVEL: ${this.currentLevel + 1}\nFINAL SCORE: ${this.score}\n\nHigh scores saved.`);
        location.reload();
    }
}
