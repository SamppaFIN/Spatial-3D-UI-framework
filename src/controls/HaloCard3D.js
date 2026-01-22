import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * HaloCard3D - A floating information billboard that follows an anchor object.
 * Features automatic billboarding, smooth follow lag, and customizable floating effects.
 */
export class HaloCard3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        // Configuration
        this.width = config.width || 2.0;
        this.height = config.height || 1.0;
        this.padding = config.padding || 0.1;
        this.color = config.color || 0x00aaff; // Sci-fi blue
        this.opacity = config.opacity || 0.8;

        this.anchorObject = config.anchorObject || null;
        this.offset = new THREE.Vector3().fromArray(config.offset || [0, 1.5, 0]);
        this.lookAtCamera = config.lookAtCamera !== false;
        this.floatingEffect = config.floatingEffect !== false;

        // Animation state
        this.time = 0;
        this.initialPosition = this.group.position.clone();

        this.create();
    }

    create() {
        // 1. Semi-transparent background panel
        // Use a PlaneGeometry with a glowing border or glass look
        const shape = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshPhysicalMaterial({
            color: this.color,
            transparent: true,
            opacity: this.opacity,
            roughness: 0.1,
            metalness: 0.2,
            transmission: 0.5,
            thickness: 0.1,
            side: THREE.DoubleSide
        });

        this.backgroundMesh = new THREE.Mesh(shape, material);
        this.group.add(this.backgroundMesh);

        // 2. Glowing border (outline)
        const edges = new THREE.EdgesGeometry(shape);
        const lineMat = new THREE.LineBasicMaterial({ color: this.color, linewidth: 2 });
        this.border = new THREE.LineSegments(edges, lineMat);
        this.group.add(this.border);

        // 3. Content Label
        if (this.config.title) {
            this.addTextLabel(this.config.title);
        }
    }

    addTextLabel(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;

        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'Bold 80px Inter, Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const geometry = new THREE.PlaneGeometry(this.width - this.padding, this.height - this.padding);
        const labelMesh = new THREE.Mesh(geometry, material);
        labelMesh.position.z = 0.01; // Slightly in front
        this.group.add(labelMesh);
    }

    update() {
        if (!this.camera || !this.isEnabled) return;

        // 1. Follow Anchor logic
        if (this.anchorObject) {
            const targetPos = this.anchorObject.position.clone().add(this.offset);
            this.group.position.lerp(targetPos, 0.1); // Smooth lag-follow
        }

        // 2. Billboarding (facing camera)
        if (this.lookAtCamera) {
            this.group.lookAt(this.camera.position);
        }

        // 3. Floating effect
        if (this.floatingEffect) {
            this.time += 0.02;
            const bob = Math.sin(this.time) * 0.1;
            this.group.position.y += bob * 0.05; // Subtle vertical bobbing
        }
    }
}
