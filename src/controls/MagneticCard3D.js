import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export class MagneticCard3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        // Properties initialized in create() to support BaseControl3D calling it
        // State
        this.targetRotation = new THREE.Quaternion();
        this.currentRotation = new THREE.Quaternion();
        this.targetParallax = new THREE.Vector3();
        this.velocity = new THREE.Vector3(0, 0, 0);
    }

    create() {
        // Initialize properties here because BaseControl3D calls create() in super()
        const config = this.config || {};
        this.width = config.width || 2.0;
        this.height = config.height || 3.0;
        this.radius = config.cornerRadius || 0.1;
        this.color = config.color || 0x1a1a2e;

        // Physics
        this.influenceRadius = config.influenceRadius || 3.0;
        this.maxTilt = config.maxTilt || 0.3;
        this.springStrength = config.springStrength || 0.1;
        this.damping = config.damping || 0.8;
        this.parallaxScale = config.parallaxScale || 0.15;

        // 1. Card Body
        const geometry = new RoundedBoxGeometry(this.width, this.height, 0.05, 8, this.radius);
        const material = new THREE.MeshPhysicalMaterial({
            color: this.color,
            metalness: 0.1,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            side: THREE.FrontSide
        });

        this.cardMesh = new THREE.Mesh(geometry, material);
        this.cardMesh.castShadow = true;
        this.cardMesh.receiveShadow = true;
        this.cardMesh.userData.isInteractive = true;
        this.cardMesh.userData.control = this;

        this.group.add(this.cardMesh);

        // 2. Parallax Content Container
        this.contentGroup = new THREE.Group();
        this.contentGroup.position.z = 0.03; // Slightly above surface
        this.cardMesh.add(this.contentGroup);

        // Add demo content if provided (simple text/icon)
        if (this.config.title || this.config.description) {
            this.addDefaultContent(this.config.title, this.config.description);
        }
    }

    addDefaultContent(title, description) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 768;

        // Background - Transparent
        ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        if (title) {
            ctx.font = 'bold 60px Inter, sans-serif';
            ctx.fillText(title, canvas.width / 2, 200);
        }

        if (description) {
            ctx.font = '30px Inter, sans-serif';
            // Simple wrap or single line
            ctx.fillText(description, canvas.width / 2, 300);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const geo = new THREE.PlaneGeometry(this.width, this.height);
        const mesh = new THREE.Mesh(geo, mat);

        this.contentGroup.add(mesh);
    }

    addContent(object3D) {
        this.contentGroup.add(object3D);
    }

    update() {
        if (!this.camera || !this.isEnabled) return;

        // 1. Calculate proximity and target rotation
        // We need a raycaster from the mouse position to a virtual plane at the card's Z-depth 
        // to get the "cursor world position" roughly.
        // BaseControl3D updates `this.raycaster` in `onMouseMove` but we might need continuous tracking.
        // Let's use camera look vector or last known mouse hit?
        // Actually BaseControl3D doesn't store "last known world cursor pos".
        // We can check intersection with an invisible plane covering the area.

        // Simulating "Magnetic" feel usually implies tracking mouse/controller even when NOT directly over the object,
        // but close to it.
        // We'll assume the parent/scene provides a cursor interaction point, or we infer it.
        // For desktop mouse, we can use the `BaseControl3D` mouse handler logic if we modify it to track nearby.
        // BUT `checkIntersection` only intersects the object itself.

        // WORKAROUND: We will simply assume if `isHovered` is true, we track intersection point locally.
        // If not hovered, we return to default.
        // BETTER: Create a larger invisible "Influence Volume" (Sphere/Box) to detect "nearby" cursor.

        // Let's add an influence mesh (invisible)
        if (!this.influenceMesh) {
            const geo = new THREE.PlaneGeometry(this.width * 2.5, this.height * 2.5);
            const mat = new THREE.MeshBasicMaterial({ visible: false });
            this.influenceMesh = new THREE.Mesh(geo, mat);
            // Add to group but ensure raycaster checks it
            this.group.add(this.influenceMesh);
        }

        // We depend on BaseControl3D's raycasting to trigger `onMouseMove`.
        // However, standard BaseControl raycasts against `this.group.children`.
        // So checking the invisible influence mesh works!

        // If we have an intersection on the influence mesh:
        // (BaseControl needs to expose the intersection point. It currently doesn't easily store it.)
        // We'll do a quick custom raycast here or modify BaseControl?
        // Let's do a local raycast.

        // Use Global mouse position from BaseControl if available? It's passed in events.
        // Let's just track the last intersection point if stored.
        // BaseControl doesn't store it.

        // Let's implement a "lazy" cursor tracking via the `raycaster` we have.
        // We need the mouse coordinates. BaseControl3D listeners update `onMouseMove(e)`.
        // We need to store the mouse event or vector.
    }

    // Override onMouseMove to get data
    onMouseMove(event) {
        if (!this.isEnabled || !this.camera) return;

        // Safely get canvas/rect
        let canvas = null;
        if (this.renderer) {
            canvas = this.renderer.domElement;
        } else {
            // Fallback: Try to find canvas from event target or global
            canvas = event.target?.closest('canvas') || document.querySelector('canvas');
        }

        if (!canvas) return; // Cannot process without canvas

        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        const mouse = new THREE.Vector2(x, y);

        this.raycaster.setFromCamera(mouse, this.camera);

        // Intersect with influence mesh specifically
        const intersects = this.raycaster.intersectObject(this.group, true); // Deep check

        let targetPoint = null;
        let dist = Infinity;

        if (intersects.length > 0) {
            const hit = intersects[0]; // Nearest
            dist = hit.point.distanceTo(this.group.position);

            // If within influence logic
            if (dist <= this.influenceRadius) {
                // Calculate local point relative to center
                const localPoint = this.group.worldToLocal(hit.point.clone());

                // Tilt logic: 
                // Imagine a stick pushing the card. 
                // If cursor is Top-Right, card tilts Top specific?
                // Standard "LookAt" cursor behavior:
                // If cursor is at (1, 1, 0) relative, we want normal to point towards it? 
                // No, standard "Apple TV" tilt is: Cursor Top-Right -> Card tilts down-left (pushes corner down)?
                // OR Card Looks At Camera + Offset?
                // Usually "Tilt towards cursor" means the face follows the cursor.

                // Let's try: Rotate around X and Y based on local X/Y.
                // Local X = 1 => Rotate Y positive? 
                const rx = -localPoint.y * this.maxTilt; // Pitch
                const ry = localPoint.x * this.maxTilt;  // Yaw

                const euler = new THREE.Euler(rx, ry, 0, 'XYZ');
                this.targetRotation.setFromEuler(euler);

                // Parallax: Move content opposite to tilt? or with it?
                // If card tilts right (Yaw +), content should slide left (neg X) to look "deep".
                if (this.targetParallax) { // Ensure targetParallax exists or just use local scoped variable?
                    // We need to set THIS.targetParallax
                    this.targetParallax.set(-localPoint.x * this.parallaxScale, -localPoint.y * this.parallaxScale, 0);
                }

                // Hover Scale
                // Use built-in scaling or just keep it simple?
            } else {
                this.resetTilt();
            }
        } else {
            this.resetTilt();
        }

        // Removed slerp from here, moved to update()
    }

    resetTilt() {
        this.targetRotation.identity();
        if (this.targetParallax) this.targetParallax.set(0, 0, 0);
        else if (this.contentGroup) {
            // Fallback if update loop isn't running - but we want update loop to handle reset too
        }
    }

    update() {
        if (!this.camera || !this.isEnabled) return;

        // Apply Physics (Damping)
        this.cardMesh.quaternion.slerp(this.targetRotation, 1 - this.damping * 0.1);

        if (this.contentGroup && this.targetParallax) {
            this.contentGroup.position.lerp(this.targetParallax, 1 - this.damping * 0.1);
            this.contentGroup.position.z = 0.03;
        }
    }

    resetTilt() {
        this.targetRotation.identity();
        if (this.contentGroup) {
            this.contentGroup.position.x = 0;
            this.contentGroup.position.y = 0;
            // z stays
        }
    }
}
