import * as THREE from 'three';

/**
 * LiquidContainer - Creates a "Gooey" metaball effect for its children.
 * 
 * Works by:
 * 1. Rendering children to an offscreen buffer (RenderTarget).
 * 2. Applying a Blur + Threshold shader to fusion nearby shapes.
 * 3. Displaying the result on a plane facing the camera.
 */
export class LiquidContainer extends THREE.Group {
    constructor(width = 4, height = 4, renderer) {
        super();
        this.width = width;
        this.height = height;
        this.renderer = renderer;

        this.initTargets();
        this.initDisplayMesh();

        // Group to hold actual content objects (buttons, etc.)
        // These will be hidden from main scene, but rendered to our target
        this.contentGroup = new THREE.Group();
        // We don't add contentGroup to 'this' directly, to avoid double rendering in main loop?
        // Actually, we can add it but set visible=false, then toggle visible=true during our custom render pass.
        this.add(this.contentGroup);
        this.contentGroup.visible = false;

        // Params
        this.threshold = 0.5;
        this.smoothness = 0.1;
    }

    initTargets() {
        // Create offscreen buffer
        // Half resolution for performance + natural softness
        const pixelRatio = this.renderer.getPixelRatio();
        const w = 512 * pixelRatio;
        const h = 512 * pixelRatio;

        this.renderTarget = new THREE.WebGLRenderTarget(w, h, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType, // Better precision for smooth gradients
            depthBuffer: true,
            stencilBuffer: false
        });
    }

    initDisplayMesh() {
        // Custom Shader for Gooey Effect
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform sampler2D tDiffuse;
            uniform float threshold;
            uniform float smoothness;
            varying vec2 vUv;

            void main() {
                // simple 9-tap Gaussian blur (approx)
                vec4 color = vec4(0.0);
                float total = 0.0;
                float offset = 0.004; // Blur radius relative to UV

                for (float x = -1.0; x <= 1.0; x += 1.0) {
                    for (float y = -1.0; y <= 1.0; y += 1.0) {
                        float weight = 1.0 - (abs(x) + abs(y)) * 0.25;
                        color += texture2D(tDiffuse, vUv + vec2(x, y) * offset) * weight;
                        total += weight;
                    }
                }
                color /= total;

                // Thresholding (Metaball effect)
                // If alpha is high enough, keep opaque. If low, make transparent.
                // Smoothstep handles antialiasing edges.
                float a = smoothstep(threshold - smoothness, threshold + smoothness, color.a);
                
                // Discard fully transparent pixels to fix z-sorting issues?
                if (a < 0.01) discard;

                gl_FragColor = vec4(color.rgb, a);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: this.renderTarget.texture },
                threshold: { value: 0.5 },
                smoothness: { value: 0.05 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });

        // The plane that displays the liquid UI
        this.displayMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(this.width, this.height),
            this.material
        );
        this.add(this.displayMesh);
    }

    /**
     * Add objects to the liquid simulation
     */
    addContent(object) {
        this.contentGroup.add(object);
    }

    /**
     * Must be called every frame before main render
     */
    update(camera) {
        if (!this.renderer) return;

        // 1. Save current state
        const originalTarget = this.renderer.getRenderTarget();
        const originalClearColor = this.renderer.getClearColor(new THREE.Color());
        const originalClearAlpha = this.renderer.getClearAlpha();

        // 2. Prepare for offscreen render
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.setClearColor(0x000000, 0); // Transparent clear
        this.renderer.clear();

        // 3. Render content
        // Toggle visibility so only content renders
        this.contentGroup.visible = true;
        this.displayMesh.visible = false;

        // We need to render the contentGroup. 
        // But render() takes a scene. Creating a new scene is expensive?
        // Let's just render the contentGroup directly? No, Three.js render takes Scene.
        // Quick hack: Temporarily swap scene background or use specific camera/layers? 
        // A helper scene is best.
        if (!this.helperScene) {
            this.helperScene = new THREE.Scene();
            // Add lights if needed? Or rely on unlit/emissive materials for liquid?
            // Ambient light for base visibility
            this.helperScene.add(new THREE.AmbientLight(0xffffff, 1.0));
        }

        // Move content to helper scene temporarily
        // This is tricky if it needs to share state with main scene.
        // BETTER: Render main scene but hide everything except contentGroup? Too slow.

        // SIMPLEST: Just reparent contentGroup to helperScene, render, reparent back.
        // Preserves local transforms if world matrices are updated?
        // Might be jittery due to coordinate shifts.

        // BETTER APPROACH: contentGroup stays in helperScene permanently?
        // Yes, if LiquidContainer is just the view.

        // Let's try: Helper Scene approach
        this.helperScene.add(this.contentGroup);
        this.renderer.render(this.helperScene, camera);

        // 4. Restore
        this.contentGroup.visible = false; // Hide from main pass
        this.displayMesh.visible = true;

        this.renderer.setRenderTarget(originalTarget);
        this.renderer.setClearColor(originalClearColor, originalClearAlpha);
    }
}
