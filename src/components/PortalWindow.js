import * as THREE from 'three';

/**
 * PortalWindow - Creates a "window" into another scene using Stencil Buffers.
 * 
 * Usage:
 * const portal = new PortalWindow(width, height);
 * portal.add(someObject); // Only visible through the window
 * scene.add(portal);
 */
export class PortalWindow extends THREE.Group {
    constructor(width = 2, height = 3) {
        super();
        this.width = width;
        this.height = height;

        this.initPortal();
    }

    initPortal() {
        // 1. The Geometry for the "Window Pane"
        const geometry = new THREE.PlaneGeometry(this.width, this.height);

        // 2. The Material for the Window Pane
        // It should write to the stencil buffer but be invisible (colorWrite: false)
        // or effectively acting as the mask.
        const stencilMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            colorWrite: false, // Don't draw pixels
            depthWrite: false, // Don't write depth
            stencilWrite: true,
            stencilFunc: THREE.AlwaysStencilFunc, // Always pass
            stencilFail: THREE.ReplaceStencilOp,
            stencilZFail: THREE.ReplaceStencilOp,
            stencilZPass: THREE.ReplaceStencilOp,
            stencilRef: 1, // Write '1' to stencil buffer
        });

        const portalFrame = new THREE.Mesh(geometry, stencilMaterial);
        portalFrame.renderOrder = 0; // Render first
        this.add(portalFrame);
        this.portalFrame = portalFrame;

        // 3. A container for objects that should ONLY be seen through the portal
        this.portalWorld = new THREE.Group();
        this.add(this.portalWorld);
    }

    /**
     * Add objects that should exist "inside" the portal.
     * We need to override their materials to check the stencil buffer.
     * @param {THREE.Object3D} object 
     */
    addContent(object) {
        this.portalWorld.add(object);

        // Traverse and update materials to only render where stencil == 1
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                // Clone material to avoid affecting other instances
                const mat = child.material.clone();
                mat.stencilWrite = true;
                mat.stencilFunc = THREE.EqualStencilFunc; // Only draw if stencil == ref
                mat.stencilRef = 1;
                child.material = mat;
            }
        });
    }

    /**
     * Optional: Add a visual frame/border around the invisible window
     */
    addBorder(thickness = 0.1, color = 0x88ccff) {
        const frameGeo = new THREE.BoxGeometry(this.width + thickness, this.height + thickness, thickness);
        // Hollow out center (simplification: just 4 bars would be better, but box is fast placeholder)
        // Actually, let's do 4 bars for a proper frame
        const frameGroup = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });

        // Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(this.width, thickness, thickness), mat);
        top.position.y = this.height / 2 + thickness / 2;
        frameGroup.add(top);

        // Bottom
        const bot = new THREE.Mesh(new THREE.BoxGeometry(this.width, thickness, thickness), mat);
        bot.position.y = -this.height / 2 - thickness / 2;
        frameGroup.add(bot);

        // Left
        const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.height + thickness * 2, thickness), mat);
        left.position.x = -this.width / 2 - thickness / 2;
        frameGroup.add(left);

        // Right
        const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, this.height + thickness * 2, thickness), mat);
        right.position.x = this.width / 2 + thickness / 2;
        frameGroup.add(right);

        this.add(frameGroup);
    }
}
