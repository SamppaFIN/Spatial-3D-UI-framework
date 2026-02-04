import * as THREE from 'three';

/**
 * SemanticGhost (Holo-Companion)
 * 
 * A persistent AI drone that hovers near the user and scans the environment.
 * When the user focuses on an interactive object, the ghost flies to it
 * and projects a holographic information panel.
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
                color: 0xff66cc,
                desc: "Gentle guide"
            },
            infinite: {
                name: "Infinite",
                prefix: "♾️",
                color: 0x00ccff,
                desc: "Cosmic observer"
            }
        };
        this.currentPersona = this.personas.aurora;

        // State
        this.state = 'FOLLOWING'; // FOLLOWING, SCANNING, ENGAGED, GUIDING
        this.targetObject = null;
        this.scanTimer = 0;

        // Raycaster
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 15;

        // Visuals
        this.initVisuals();
        this.initHoloPanel();

        // Initial set
        this.setPersona('aurora');
    }

    initVisuals() {
        // --- Core Orb ---
        const coreGeo = new THREE.IcosahedronGeometry(0.15, 1);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: this.currentPersona.color,
            emissiveIntensity: 1.0,
            roughness: 0.2,
            metalness: 0.9,
            flatShading: true,
            depthTest: false // Always visible
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.core.renderOrder = 999;
        this.add(this.core);

        // --- Outer Rings ---
        // Ring 1 (Horizontal)
        const r1Geo = new THREE.TorusGeometry(0.25, 0.01, 8, 32);
        const rMat = new THREE.MeshBasicMaterial({
            color: this.currentPersona.color,
            transparent: true,
            opacity: 0.8,
            depthTest: false // Always visible
        });
        this.ring1 = new THREE.Mesh(r1Geo, rMat);
        this.ring1.renderOrder = 999;
        this.add(this.ring1);

        // Ring 2 (Vertical-ish)
        this.ring2 = new THREE.Mesh(r1Geo, rMat);
        this.ring2.rotation.x = Math.PI / 2;
        this.ring2.scale.set(0.8, 0.8, 0.8);
        this.ring2.renderOrder = 999;
        this.add(this.ring2);

        // --- Scanner Beam ---
        const beamGeo = new THREE.ConeGeometry(0.05, 2, 8, 1, true);
        beamGeo.translate(0, 1, 0); // Origin at tip
        beamGeo.rotateX(-Math.PI / 2); // Point forward
        const beamMat = new THREE.MeshBasicMaterial({
            color: this.currentPersona.color,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            depthTest: false // Always visible
        });
        this.scannerBeam = new THREE.Mesh(beamGeo, beamMat);
        this.scannerBeam.renderOrder = 999;
        this.add(this.scannerBeam);
    }

    setVisible(isVisible) {
        this.visible = isVisible;
        if (!isVisible) {
            this.state = 'IDLE';
            this.targetObject = null;
        } else {
            this.state = 'FOLLOWING';
        }
    }

    /**
     * Actively guide the user to a specific object.
     * @param {THREE.Object3D} targetObject - The object to highlight.
     * @param {string} text - The explanation text to show.
     */
    guideTo(targetObject, text) {
        console.log("SemanticGhost: guideTo called for target", targetObject);
        this.state = 'GUIDING';
        this.targetObject = targetObject;
        this.scanTimer = 0;

        // Immediate visual feedback
        this.updatePanelText(text);

        // Ensure visible
        this.setVisible(true);
        this.holoPanel.visible = true;
    }

    /**
     * Stop guiding and return to passive following mode.
     */
    stopGuiding() {
        console.log("SemanticGhost: stopGuiding called");
        this.state = 'FOLLOWING';
        this.targetObject = null;
        this.holoPanel.scale.set(0, 0, 0); // Hide panel smoothly via update loop
    }

    initHoloPanel() {
        this.panelCanvas = document.createElement('canvas');
        this.panelCanvas.width = 512;
        this.panelCanvas.height = 256;
        this.panelCtx = this.panelCanvas.getContext('2d');

        this.panelTex = new THREE.CanvasTexture(this.panelCanvas);
        // Anisotropy helps text readablity at angles
        if (this.renderer) this.panelTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

        const mat = new THREE.MeshBasicMaterial({
            map: this.panelTex,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false // Always visible
        });

        const geo = new THREE.PlaneGeometry(1.5, 0.75);
        this.holoPanel = new THREE.Mesh(geo, mat);
        this.holoPanel.position.set(0, 0.6, 0); // Above drone
        this.holoPanel.scale.set(0, 0, 0); // Start hidden
        this.holoPanel.renderOrder = 999;
        this.add(this.holoPanel);
    }

    updatePanelText(text) {
        const ctx = this.panelCtx;
        const w = 512, h = 256;

        ctx.clearRect(0, 0, w, h);

        // Holo Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `rgba(${this.hexToRgb(this.currentPersona.color)}, 0.1)`);
        grad.addColorStop(0.5, `rgba(${this.hexToRgb(this.currentPersona.color)}, 0.4)`);
        grad.addColorStop(1, `rgba(${this.hexToRgb(this.currentPersona.color)}, 0.1)`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Tech Borders
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, w - 20, h - 20);

        // Corner Accents
        ctx.fillStyle = this.getHexString(this.currentPersona.color);
        ctx.fillRect(0, 0, 40, 4);
        ctx.fillRect(0, 0, 4, 40);
        ctx.fillRect(w - 40, h - 4, 40, 4);
        ctx.fillRect(w - 4, h - 40, 4, 40);

        // Text
        ctx.shadowColor = this.getHexString(this.currentPersona.color);
        ctx.shadowBlur = 10;

        // Header
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.currentPersona.prefix} ANALYSIS`, 40, 50);

        // Body
        ctx.font = '24px "Inter", sans-serif';
        ctx.textAlign = 'center';

        // Simple wrap (split by spaces for demo)
        const words = text.split(' ');
        let line = '';
        let y = 100;
        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 440) {
                ctx.fillText(line, w / 2, y);
                line = word + ' ';
                y += 35;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, w / 2, y);

        this.panelTex.needsUpdate = true;
    }

    setPersona(key) {
        if (this.personas[key]) {
            this.currentPersona = this.personas[key];
            const col = new THREE.Color(this.currentPersona.color);

            this.core.material.emissive.set(col);
            this.ring1.material.color.set(col);
            this.ring2.material.color.set(col);
            this.scannerBeam.material.color.set(col);

            // Re-render current panel
            if (this.holoPanel.visible && this.targetObject) {
                this.updatePanelText(this.targetObject.userData.helpText);
            }
        }
    }

    // --- Helpers ---
    hexToRgb(hex) {
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;
        return `${r},${g},${b}`;
    }

    getHexString(hex) {
        return '#' + hex.toString(16).padStart(6, '0');
    }

    update(delta, time) {
        // Debug once per ~100 frames to avoid spam
        // if (Math.random() < 0.01) console.log("SemanticGhost update. State:", this.state);

        // 1. Raycasting (Vision)
        // Only scan if not actively guiding
        if (this.state !== 'GUIDING') {
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);

            let visibleTarget = null;
            for (let hit of intersects) {
                let obj = hit.object;
                // Traverse up to find userData
                while (obj) {
                    if (obj.userData && obj.userData.helpText) {
                        visibleTarget = obj;
                        break;
                    }
                    obj = obj.parent;
                    if (obj && obj.type === 'Scene') break;
                }
                if (visibleTarget) break;
            }

            // 2. Logic & State Machine
            if (visibleTarget) {
                if (this.targetObject !== visibleTarget) {
                    // New target found
                    this.targetObject = visibleTarget;
                    this.scanTimer = 0;
                    this.state = 'SCANNING';
                } else {
                    // Sustained focus
                    this.scanTimer += delta;
                    if (this.scanTimer > 0.6 && this.state !== 'ENGAGED') {
                        // Lock on!
                        this.state = 'ENGAGED';
                        this.updatePanelText(this.targetObject.userData.helpText);
                    }
                }
            } else {
                // Lost target
                if (this.state !== 'FOLLOWING') {
                    this.targetObject = null;
                    this.state = 'FOLLOWING';
                    this.scanTimer = 0;
                }
            }
        }

        // 3. Movement Logic
        const targetPos = new THREE.Vector3();

        if ((this.state === 'ENGAGED' || this.state === 'GUIDING') && this.targetObject) {
            // Fly to object
            this.targetObject.getWorldPosition(targetPos);
            // Hover slightly above/right of it
            targetPos.y += 0.8;
            targetPos.x += 0.5;
            targetPos.z += 0.2; // slight bias

            // Look at camera
            this.lookAt(this.camera.position);

        } else {
            // Shoulder Hover Mode (FOLLOWING / SCANNING)
            // Relative to camera
            const offset = new THREE.Vector3(0.6, 0.3, -1.2); // Right shoulder, slightly forward
            offset.applyQuaternion(this.camera.quaternion);
            targetPos.copy(this.camera.position).add(offset);

            // Look forward (or at target if scanning)
            if (this.state === 'SCANNING' && this.targetObject) {
                const lookPos = new THREE.Vector3();
                this.targetObject.getWorldPosition(lookPos);
                this.lookAt(lookPos);
            } else {
                // Look same dir as camera (roughly)
                const camForward = new THREE.Vector3(0, 0, -5).applyQuaternion(this.camera.quaternion);
                this.lookAt(this.camera.position.clone().add(camForward));
            }
        }

        // Smooth Move
        this.position.lerp(targetPos, delta * 3.0);

        // 4. Visual Animations

        // Rings rotation
        this.ring1.rotation.z = time * 0.5;
        this.ring2.rotation.y = time * 0.7;

        // Core breathing
        const pulse = 0.8 + Math.sin(time * 3) * 0.2;
        this.core.scale.setScalar(pulse);

        // Scanner Beam
        if (this.state === 'SCANNING') {
            this.scannerBeam.material.opacity = THREE.MathUtils.lerp(this.scannerBeam.material.opacity, 0.4, delta * 10);
            this.scannerBeam.scale.x = 1.0 + Math.sin(time * 20) * 0.2; // Flicker
        } else {
            this.scannerBeam.material.opacity = THREE.MathUtils.lerp(this.scannerBeam.material.opacity, 0, delta * 10);
        }

        // Holo Panel Scale
        const targetScale = (this.state === 'ENGAGED' || this.state === 'GUIDING') ? 1 : 0;
        this.holoPanel.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
    }
}
// End
