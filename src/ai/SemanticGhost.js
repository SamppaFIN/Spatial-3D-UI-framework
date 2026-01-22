import * as THREE from 'three';
import { TextInput3D } from '../controls/TextInput3D.js';

/**
 * SemanticGhost - A predictive help avatar.
 * 
 * Behavior:
 * 1. Follows the user (camera) but stays invisible/dispersed when moving.
 * 2. When user stops moving (Hesitation), it coalesces into a form.
 * 3. It raycasts forward to see what the user is looking at.
 * 4. If target has `userData.helpText`, it displays a speech bubble.
 */
export class SemanticGhost extends THREE.Group {
    constructor(camera, scene, renderer) {
        super();
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;

        // Personas
        this.personas = {
            aurora: {
                name: "Aurora",
                prefix: "🌸",
                color: 0xff66cc, // Pink
                desc: "Gentle, nature-inspired, empathetic."
            },
            infinite: {
                name: "Infinite",
                prefix: "♾️",
                color: 0x00ccff, // Cyan
                desc: "Cosmic, limitless, precise."
            }
        };
        this.currentPersona = this.personas.aurora; // Default

        // State
        this.state = 'IDLE'; // IDLE, FORMING, ACTIVE, DISPERSING
        this.targetObject = null;
        this.lastCameraPos = new THREE.Vector3();
        this.lastCameraQuat = new THREE.Quaternion();
        this.idleTime = 0;
        this.isGhostVisible = false;
        this.forced = false;

        // Raycaster
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 10;

        // Visuals
        this.initParticles();
        this.initGlow();
        this.initGhostMesh();
        this.initSpeechBubble();
        this.initInput();

        // Input Listeners
        window.addEventListener('dblclick', () => this.forceSummon());
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h') this.forceSummon();
        });
    }

    forceSummon() {
        this.forced = true;
        this.state = 'FORMING';
        this.idleTime = 5.0; // Artificial idle time
        // Immediate Greeting
        if (!this.targetObject) {
            this.updateSpeech("Greetings. I am the Semantic Ghost.");
        }
    }

    initGhostMesh() {
        // A translucent, wispy capsule to give it form
        const geo = new THREE.CapsuleGeometry(0.12, 0.4, 4, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.ghostMesh = new THREE.Mesh(geo, mat);
        this.ghostMesh.position.y = -0.1;
        this.add(this.ghostMesh);
    }

    initGlow() {
        // Inner glow light
        this.pointLight = new THREE.PointLight(this.currentPersona.color, 0, 3);
        this.add(this.pointLight);

        // Sprite Glow
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({
            map: tex,
            color: this.currentPersona.color,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending
        });
        this.glowSprite = new THREE.Sprite(mat);
        this.glowSprite.scale.set(1.5, 1.5, 1.5);
        this.add(this.glowSprite);
    }

    initParticles() {
        // Create a cloud of particles with volume
        const particleCount = 400;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        const randoms = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5);
            const y = (Math.random() - 0.5);
            const z = (Math.random() - 0.5);

            // Normalize to sphere volume
            const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.2 * Math.random() + 0.1);

            positions[i * 3] = v.x;
            positions[i * 3 + 1] = v.y;
            positions[i * 3 + 2] = v.z;

            originalPositions[i * 3] = v.x;
            originalPositions[i * 3 + 1] = v.y;
            originalPositions[i * 3 + 2] = v.z;

            randoms[i] = Math.random() * Math.PI * 2;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
        geom.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        const mat = new THREE.PointsMaterial({
            color: this.currentPersona.color,
            size: 0.03,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geom, mat);
        this.add(this.particles);
    }

    initInput() {
        if (!this.renderer) return;

        // Add a 3D Text Input below the ghost
        this.inputControl = new TextInput3D(this.scene, this.camera, [0, -0.6, 0], {
            width: 1.8,
            height: 0.4,
            placeholder: "Speak to me...",
            renderer: this.renderer,
            backgroundColor: 0x000000,
            backgroundOpacity: 0.3, // Glassy
            borderColor: this.currentPersona.color,
            onSubmit: (ctrl, text) => {
                this.handleInput(text);
                ctrl.setValue(""); // Clear after submit
            }
        });

        // Attach to ghost group
        this.add(this.inputControl.group);
        this.inputControl.group.visible = false;
    }

    handleInput(text) {
        // Echo back for now
        this.updateSpeech(`${this.currentPersona.prefix} I heard: "${text}"`);
    }

    setPersona(key) {
        if (this.personas[key]) {
            this.currentPersona = this.personas[key];
            this.particles.material.color.setHex(this.currentPersona.color);
            this.pointLight.color.setHex(this.currentPersona.color);
            this.glowSprite.material.color.setHex(this.currentPersona.color);

            if (this.inputControl) {
                // Update input border color if possible, or just re-create? 
                // BaseControl logic needed, for now just simplistic
            }

            // If active, refresh bubble
            if (this.state === 'ACTIVE' && this.targetObject) {
                this.updateSpeech(this.targetObject.userData.helpText);
            } else if (this.state === 'ACTIVE' && !this.targetObject) {
                this.updateSpeech(`${this.currentPersona.prefix} I am here.`);
            }
        }
    }

    initSpeechBubble() {
        // Simple sprite for text
        this.bubbleCanvas = document.createElement('canvas');
        this.bubbleCanvas.width = 512;
        this.bubbleCanvas.height = 256;
        this.bubbleContext = this.bubbleCanvas.getContext('2d');

        this.bubbleTexture = new THREE.CanvasTexture(this.bubbleCanvas);
        const mat = new THREE.SpriteMaterial({ map: this.bubbleTexture, transparent: true, opacity: 0 });

        this.bubble = new THREE.Sprite(mat);
        this.bubble.scale.set(1, 0.5, 1);
        this.bubble.position.set(0, 0.5, 0); // Above ghost
        this.add(this.bubble);
    }

    updateSpeech(text) {
        const ctx = this.bubbleContext;
        ctx.clearRect(0, 0, 512, 256);

        // Styling
        ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
        ctx.strokeStyle = '#' + this.currentPersona.color.toString(16).padStart(6, '0');
        ctx.lineWidth = 4;

        // Rounded rect
        const x = 10, y = 10, w = 492, h = 236, r = 30;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
        ctx.stroke();

        // Header (Persona Name)
        ctx.font = 'bold 30px "Inter", sans-serif';
        ctx.fillStyle = ctx.strokeStyle;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`${this.currentPersona.prefix} ${this.currentPersona.name}`, 40, 30);

        // Body Text
        ctx.font = '36px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const words = text.split(' ');
        if (words.length > 6) {
            ctx.fillText(text.substring(0, text.length / 2), 256, 120);
            ctx.fillText(text.substring(text.length / 2), 256, 170);
        } else {
            ctx.fillText(text, 256, 148);
        }

        this.bubbleTexture.needsUpdate = true;
    }

    update(delta, time) {
        // 1. Detect Motion (High sensitivity or Forced)
        const dist = this.camera.position.distanceTo(this.lastCameraPos);
        const rot = this.camera.quaternion.angleTo(this.lastCameraQuat);
        const isMoving = (dist > 0.005 || rot > 0.005) && !this.forced;

        if (isMoving) {
            this.idleTime = 0;
            this.state = 'DISPERSING';
            this.lastCameraPos.copy(this.camera.position);
            this.lastCameraQuat.copy(this.camera.quaternion);
            this.forced = false;
        } else {
            this.idleTime += delta;
            // Short wait trigger (1.0s)
            if (this.idleTime > 1.0 && this.state !== 'ACTIVE') {
                this.state = 'FORMING';
            }
        }

        // 2. State Machine behavior
        if (this.state === 'FORMING') {
            // Raycast check
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);

            let foundTarget = null;
            for (let hit of intersects) {
                let obj = hit.object;
                if (obj === this.ghostMesh) continue; // Ignore self

                while (obj) {
                    if (obj.userData && obj.userData.helpText) {
                        foundTarget = obj;
                        break;
                    }
                    obj = obj.parent;
                }
                if (foundTarget) break;
            }

            if (foundTarget) {
                this.targetObject = foundTarget;
                this.updateSpeech(foundTarget.userData.helpText);
                this.state = 'ACTIVE';
                this.visible = true;
            } else if (this.forced) {
                // If forced but no target, just appear generic
                this.targetObject = null;
                // Text already set in forceSummon, but ensure it sticks or updates
                this.updateSpeech(`${this.currentPersona.prefix} I am the Semantic Ghost.`);
                this.state = 'ACTIVE';
                this.visible = true;
            } else {
                this.state = 'IDLE';
            }
        }

        // 3. Animation
        const targetOpacity = (this.state === 'ACTIVE') ? 1.0 : 0.0;

        // Float lerp
        this.particles.material.opacity = THREE.MathUtils.lerp(this.particles.material.opacity, (this.state === 'ACTIVE' ? 1.0 : 0), delta * 3);
        this.glowSprite.material.opacity = THREE.MathUtils.lerp(this.glowSprite.material.opacity, (this.state === 'ACTIVE' ? 0.8 : 0), delta * 3);
        this.pointLight.intensity = THREE.MathUtils.lerp(this.pointLight.intensity, (this.state === 'ACTIVE' ? 1.5 : 0), delta * 3);
        this.bubble.material.opacity = THREE.MathUtils.lerp(this.bubble.material.opacity, (this.state === 'ACTIVE' ? 1 : 0), delta * 5);
        this.ghostMesh.material.opacity = THREE.MathUtils.lerp(this.ghostMesh.material.opacity, (this.state === 'ACTIVE' ? 0.5 : 0), delta * 2);

        // Input Visibility
        if (this.inputControl) {
            this.inputControl.group.visible = (this.state === 'ACTIVE');
            if (this.state === 'ACTIVE') this.inputControl.update();
        }

        // Position the ghost
        if (this.state === 'ACTIVE') {
            const targetPos = new THREE.Vector3();

            if (this.targetObject && this.targetObject.position) {
                this.targetObject.getWorldPosition(targetPos);
                // Offset towards camera
                const toCam = new THREE.Vector3().subVectors(this.camera.position, targetPos).normalize();
                targetPos.add(toCam.multiplyScalar(0.7));
                targetPos.y += 0.4;
            } else {
                // Default position (floating in front of camera)
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                targetPos.copy(this.camera.position).add(forward.multiplyScalar(1.2));
                targetPos.y -= 0.1;
            }

            // Smooth follow
            this.position.lerp(targetPos, delta * 4);
            this.lookAt(this.camera.position);

            // Animate particles (breathing + organic noise)
            const positions = this.particles.geometry.attributes.position;
            const originals = this.particles.geometry.attributes.originalPosition;
            const randoms = this.particles.geometry.attributes.aRandom;

            for (let i = 0; i < positions.count; i++) {
                const ox = originals.getX(i);
                const oy = originals.getY(i);
                const oz = originals.getZ(i);
                const r = randoms.getX(i);

                const breathe = 1.0 + Math.sin(time * 2 + r) * 0.1;
                const driftX = Math.sin(time * 1.5 + r * 2) * 0.05;
                const driftY = Math.cos(time * 1.2 + r * 3) * 0.05;

                positions.setXYZ(i, ox * breathe + driftX, oy * breathe + driftY, oz * breathe);
            }
            positions.needsUpdate = true;

            // Wobble
            this.ghostMesh.position.y = -0.1 + Math.sin(time * 2) * 0.05;

        } else if (this.state === 'DISPERSING') {
            this.particles.material.opacity = THREE.MathUtils.lerp(this.particles.material.opacity, 0, delta * 10);
            this.glowSprite.material.opacity = THREE.MathUtils.lerp(this.glowSprite.material.opacity, 0, delta * 10);
            this.ghostMesh.material.opacity = THREE.MathUtils.lerp(this.ghostMesh.material.opacity, 0, delta * 10);
            this.bubble.material.opacity = THREE.MathUtils.lerp(this.bubble.material.opacity, 0, delta * 10);
            if (this.inputControl) this.inputControl.group.visible = false;
        }
    }
}
