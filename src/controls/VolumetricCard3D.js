import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export class VolumetricCard3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        // Configuration
        this.width = config.width || 2.5;
        this.height = config.height || 3.5;
        this.baseColor = config.baseColor !== undefined ? config.baseColor : 0x222222;
        this.modelScale = config.modelScale || 1.0;
        this.popHeight = config.popHeight || 0.5; // How far out it pops
        this.popScale = config.popScale || 1.2;    // How much it grows

        this.modelObject = config.modelObject || null; // Pass an existing Mesh/Group

        // Animation State
        this.currentPop = 0;
        this.targetPop = 0;

        this.create();

        // Setup simple default model if none provided
        if (this.modelObject) {
            this.setVolumetricContent(this.modelObject);
        } else {
            this.createDefaultModel();
        }
    }

    createDefaultModel() {
        const group = new THREE.Group();

        // Simple "Shoe" placeholder (Box + Torus)
        const sole = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.1, 1.5),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        sole.position.y = -0.2;

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.4, 1.0),
            new THREE.MeshStandardMaterial({ color: 0xff4400 })
        );
        body.position.set(0, 0.1, 0.1);

        group.add(sole, body);
        this.setVolumetricContent(group);
    }

    create() {
        if (this.baseColor === undefined) return;

        // 1. Base (The Card)
        const baseGeo = new RoundedBoxGeometry(this.width, this.height, 0.1, 4, 0.2);

        // Setup Canvas Texture for the front face
        this.canvas = document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 768;
        this.context = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);

        const baseMat = new THREE.MeshStandardMaterial({
            color: this.baseColor,
            roughness: 0.1,
            metalness: 0.5
        });

        const faceMat = new THREE.MeshStandardMaterial({
            map: this.texture,
            transparent: true,
            roughness: 0.2,
            metalness: 0.3
        });

        // Use multi-material for front face
        this.baseMesh = new THREE.Mesh(baseGeo, [baseMat, baseMat, baseMat, baseMat, faceMat, baseMat]);
        this.baseMesh.userData.isInteractive = true;
        this.baseMesh.userData.control = this;
        this.baseMesh.castShadow = true;
        this.baseMesh.receiveShadow = true;

        this.group.add(this.baseMesh);

        // 2. Model Container (The "Stage")
        this.modelContainer = new THREE.Group();
        this.modelContainer.position.z = 0.05;
        this.group.add(this.modelContainer);

        // Initial text
        this.setTextContent(this.config.title || "", this.config.description || "");
    }

    /**
     * Updates the text displayed on the card via canvas texture.
     */
    setTextContent(title, description) {
        if (!this.context) return;
        const ctx = this.context;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, w, h);

        // Border/Header
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, w - 40, h - 40);

        // Title
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 48px Inter, Arial';
        ctx.textAlign = 'center';
        this.wrapText(ctx, title.toUpperCase(), w / 2, 100, w - 80, 60);

        // Description
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Inter, Arial';
        this.wrapText(ctx, description, w / 2, h - 180, w - 100, 40);

        this.texture.needsUpdate = true;
    }

    /**
     * Helper to wrap text on canvas
     */
    wrapText(context, text, x, y, maxWidth, lineHeight) {
        if (!text) return;
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, currentY);
    }

    /**
     * Sets the 3D content to be displayed in the card.
     * @param {THREE.Object3D} content - The mesh or group to display
     */
    setVolumetricContent(content) {
        if (!content) return;

        // Clean up existing model
        if (this.activeModel) {
            this.modelContainer.remove(this.activeModel);
            this.activeModel = null;
        }

        this.modelObject = content;

        // Clone and add to container
        const model = content.clone();
        model.scale.setScalar(this.modelScale);
        this.modelContainer.add(model);
        this.activeModel = model;
    }

    update() {
        if (!this.camera || !this.isEnabled) return;

        // Interaction Logic
        // Check hover state from BaseControl3D
        // If hovered, targetPop = 1, else 0

        this.targetPop = this.isHovered ? 1 : 0;

        // Animate Pop
        // Simple lerp
        this.currentPop += (this.targetPop - this.currentPop) * 0.1;

        if (this.activeModel) {
            // Z Position: Move out
            const zOffset = 0.05 + (this.currentPop * this.popHeight);
            this.modelContainer.position.z = zOffset;

            // Scale: Grow
            const scaleLayer = 1 + (this.currentPop * (this.popScale - 1));
            this.modelContainer.scale.setScalar(scaleLayer);

            // Rotation: Add subtle idle spin + interaction spin?
            // If hovered, maybe rotate based on mouse interaction? 
            // For now, simple idle spin when active
            if (this.isHovered) {
                this.activeModel.rotation.y += 0.02;
            } else {
                // Return to front?
                this.activeModel.rotation.y += (0 - this.activeModel.rotation.y) * 0.1;
            }
        }
    }

    get2DContent() {
        const container = super.get2DContent();

        const preview = document.createElement('div');
        preview.style.cssText = `
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        `;

        const title = (this.config.title || "");
        const desc = (this.config.description || "");

        const createField = (label, value, onChange) => {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
            wrap.innerHTML = `<label style="font-size: 0.8em; color: #00d4ff; font-weight: bold;">${label}</label>`;
            const input = document.createElement('input');
            input.value = value;
            input.style.cssText = 'background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px; border-radius: 6px;';
            input.oninput = (e) => onChange(e.target.value);
            wrap.appendChild(input);
            return wrap;
        };

        preview.appendChild(createField('CARD TITLE', title, (v) => {
            this.config.title = v;
            this.setTextContent(v, this.config.description || "");
        }));

        preview.appendChild(createField('CARD DESCRIPTION', desc, (v) => {
            this.config.description = v;
            this.setTextContent(this.config.title || "", v);
        }));

        container.appendChild(preview);
        return container;
    }
}
