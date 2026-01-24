import { BaseControl3D } from '../core/BaseControl3D.js';
import * as THREE from 'three';

/**
 * ChronoLens3D
 * A portal/lens that renders the scene with a different "reality filter" (Material Override).
 * Uses WebGLRenderTarget to capture the scene from a secondary camera perspective or state.
 */
export class ChronoLens3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        if (!this.renderer) {
            console.warn('ChronoLens3D requires a renderer in config!');
        }

        this.width = config.width || 3;
        this.height = config.height || 2;
        this.fov = config.fov || 75; // Lens FOV

        // Render Target setup
        const resolution = 512;
        this.renderTarget = new THREE.WebGLRenderTarget(resolution, resolution);
        this.lensCamera = new THREE.PerspectiveCamera(this.fov, this.width / this.height, 0.1, 100);

        // Material that displays the rendered texture
        this.lensMaterial = new THREE.MeshBasicMaterial({
            map: this.renderTarget.texture,
            side: THREE.DoubleSide
        });

        // Frame
        this.frameGroup = new THREE.Group();
        this.group.add(this.frameGroup);

        this.createLens();
    }

    createLens() {
        // 1. The Glass (Lens)
        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        this.lensMesh = new THREE.Mesh(geometry, this.lensMaterial);
        this.group.add(this.lensMesh);

        // 2. The Frame (Chassis)
        const frameGeo = new THREE.BoxGeometry(this.width + 0.2, this.height + 0.2, 0.1);
        // Cut out the center? No, easier to just put it behind or use 4 boxes.
        // Let's use Torus for a circular lens or just a rim for rectangular.
        // Simple Rim:
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });

        // Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(this.width + 0.2, 0.1, 0.2), rimMat);
        top.position.y = this.height / 2 + 0.05;
        this.frameGroup.add(top);

        // Bottom
        const bot = new THREE.Mesh(new THREE.BoxGeometry(this.width + 0.2, 0.1, 0.2), rimMat);
        bot.position.y = -this.height / 2 - 0.05;
        this.frameGroup.add(bot);

        // Left
        const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, this.height, 0.2), rimMat);
        left.position.x = -this.width / 2 - 0.05;
        this.frameGroup.add(left);

        // Right
        const right = new THREE.Mesh(new THREE.BoxGeometry(0.1, this.height, 0.2), rimMat);
        right.position.x = this.width / 2 + 0.05;
        this.frameGroup.add(right);
    }

    update() {
        if (!this.renderer || !this.scene || !this.camera) return;

        // 1. Hide lens surface to avoid seeing itself (feedback loop)
        this.lensMesh.visible = false;

        // 2. Update Lens Camera
        // Strategy: Lens acts as a window. The camera behind the lens needs to match the user's viewing angle.
        // For a simple "portal", we can just snap the lens camera to the main camera, 
        // OR move it to a different world.

        // Let's implement "Wireframe Vision" - same position, different style.
        this.lensCamera.position.copy(this.camera.position);
        this.lensCamera.quaternion.copy(this.camera.quaternion);
        this.lensCamera.aspect = this.width / this.height; // Can adjust based on real aspect
        this.lensCamera.updateProjectionMatrix();

        // 3. Apply Override Material (The "Chrono/X-Ray" effect)
        const originalOverride = this.scene.overrideMaterial;

        // Create a cool "Matrix/Future" wireframe material
        if (!this.wireframeMaterial) {
            this.wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
        }

        this.scene.overrideMaterial = this.wireframeMaterial;

        // 4. Render to Target
        // Note: Scene background might need to change too
        const originalBg = this.scene.background;
        this.scene.background = new THREE.Color(0x001100); // Matrix black

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.lensCamera);
        this.renderer.setRenderTarget(null); // Back to screen

        // 5. Restore State
        this.scene.overrideMaterial = originalOverride;
        this.scene.background = originalBg;
        this.lensMesh.visible = true;
    }
}
