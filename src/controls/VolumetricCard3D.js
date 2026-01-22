import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export class VolumetricCard3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        // Configuration
        this.width = config.width || 2.5;
        this.height = config.height || 3.5;
        this.baseColor = config.baseColor || 0x222222;
        this.modelScale = config.modelScale || 1.0;
        this.popHeight = config.popHeight || 0.5; // How far out it pops
        this.popScale = config.popScale || 1.2;    // How much it grows

        this.modelObject = config.modelObject || null; // Pass an existing Mesh/Group

        // Animation State
        this.currentPop = 0;
        this.targetPop = 0;

        // Setup simple default model if none provided
        if (!this.modelObject) {
            this.createDefaultModel();
        }

        this.create();
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
        this.modelObject = group;
    }

    create() {
        if (this.baseColor === undefined) return;

        // 1. Base (The Card)
        const baseGeo = new RoundedBoxGeometry(this.width, this.height, 0.1, 4, 0.2);
        const baseMat = new THREE.MeshStandardMaterial({
            color: this.baseColor,
            roughness: 0.1,
            metalness: 0.5
        });

        this.baseMesh = new THREE.Mesh(baseGeo, baseMat);
        this.baseMesh.userData.isInteractive = true;
        this.baseMesh.userData.control = this;
        this.baseMesh.castShadow = true;
        this.baseMesh.receiveShadow = true;

        this.group.add(this.baseMesh);

        // 2. Model Container (The "Stage")
        // We might want to mask the bottom of the model so it looks like it emerges from the card?
        // For now, let's just place it.

        this.modelContainer = new THREE.Group();
        this.modelContainer.position.z = 0.05; // Resting on surface
        this.group.add(this.modelContainer);

        if (this.modelObject) {
            // Clone if possible to avoid stealing from other scenes? 
            // Better to assume user passes unique or we clone.
            const model = this.modelObject.clone();
            model.scale.setScalar(this.modelScale);
            this.modelContainer.add(model);
            this.activeModel = model;
        }
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
}
