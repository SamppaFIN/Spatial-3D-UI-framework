import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export class PortalCard3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        // Configuration
        this.width = config.width || 3.0;
        this.height = config.height || 4.0;
        this.resolution = config.resolution || 512;
        this.clearColor = config.clearColor || 0x220033;
        this.portalScene = config.portalScene || new THREE.Scene(); // The world inside

        // Setup internal scene keys if empty
        if (!config.portalScene) {
            this.setupDefaultInnerScene();
        }

        this.portalCamera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.portalCamera.position.z = 5;

        // Render Target
        this.renderTarget = new THREE.WebGLRenderTarget(this.resolution, this.resolution * (this.height / this.width));

        this.create();
    }

    setupDefaultInnerScene() {
        // A simple rotating cube if no scene provided
        this.portalScene.background = new THREE.Color(this.clearColor);
        const l = new THREE.DirectionalLight(0xffffff, 2);
        l.position.set(1, 1, 1);
        this.portalScene.add(l);
        this.portalScene.add(new THREE.AmbientLight(0xffffff, 0.5));

        const geo = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const mat = new THREE.MeshNormalMaterial({ wireframe: true });
        this.defaultObject = new THREE.Mesh(geo, mat);
        this.portalScene.add(this.defaultObject);
        this.hasDefaultAnimation = true;
    }

    create() {
        if (!this.renderTarget) return; // Wait for initialization

        // Frame/Rim
        const frameGeo = new RoundedBoxGeometry(this.width + 0.2, this.height + 0.2, 0.1, 4, 0.1);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.2,
            metalness: 0.8
        });
        this.frame = new THREE.Mesh(frameGeo, frameMat);
        this.group.add(this.frame);

        // Screen (The Portal)
        const screenGeo = new THREE.PlaneGeometry(this.width, this.height);
        const screenMat = new THREE.MeshBasicMaterial({
            map: this.renderTarget.texture
        });
        this.screen = new THREE.Mesh(screenGeo, screenMat);
        this.screen.position.z = 0.06; // Slightly in front of frame
        this.group.add(this.screen);
    }

    update() {
        if (!this.camera || !this.isEnabled) return;

        // 1. Update Portal Camera Logic (Parallax)
        // Convert world view vector to local space of the portal
        // If main camera moves LEFT (relative to portal), portal camera should move LEFT to reveal RIGHT side of inner world.

        // Get main camera position in local space of the portal group
        const localCamPos = this.group.worldToLocal(this.camera.position.clone());

        // Map localCamPos (x,y) to portal camera position
        // We limit the movement to keep the inner object in view
        // Factor 0.5 means if I move 2m left, inner camera moves 1m left.
        const parallaxFactor = 0.5;
        this.portalCamera.position.x = localCamPos.x * parallaxFactor;
        this.portalCamera.position.y = localCamPos.y * parallaxFactor;

        // Ensure portal camera always looks at the center of the inner world (or specific target)
        this.portalCamera.lookAt(0, 0, 0);

        // 2. Default Animation
        if (this.hasDefaultAnimation && this.defaultObject) {
            this.defaultObject.rotation.x += 0.01;
            this.defaultObject.rotation.y += 0.01;
        }
    }

    // Must be called explicitly before main render
    render(renderer) {
        if (!renderer) return;

        // Save state
        const originalTarget = renderer.getRenderTarget();
        const originalShadowMapEnabled = renderer.shadowMap.enabled;

        // Render portal
        renderer.setRenderTarget(this.renderTarget);
        // renderer.shadowMap.enabled = false; // Optimize?
        renderer.render(this.portalScene, this.portalCamera);

        // Restore
        renderer.setRenderTarget(originalTarget);
        // renderer.shadowMap.enabled = originalShadowMapEnabled;
    }
}
