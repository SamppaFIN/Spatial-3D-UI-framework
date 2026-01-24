import * as THREE from 'three';
import { SpatialControls } from '../controls/SpatialControls.js';
import { StarfieldBackground } from './StarfieldBackground.js';
import { CoordinatePlane } from './CoordinatePlane.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';

/**
 * SpatialEnvironment
 * A standardized "Room" component that sets up the full 3D environment for demos.
 * Includes: Scene, Camera, Renderer, Starfield, Grid, Lighting, and Controls.
 */
export class SpatialEnvironment {
    constructor(container = document.body, config = {}) {
        this.container = container;
        this.config = {
            fogDensity: 0.02,
            gridSize: 50,
            cameraPos: [0, 1.6, 4],
            ...config
        };

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Core Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Environment Components
        this.starfield = null;
        this.grid = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        this.updatables = []; // List of objects with .update(delta, time)
    }

    init() {
        // 1. Scene & Fog
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000005, this.config.fogDensity);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.camera.position.set(...this.config.cameraPos);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Clear existing canvas if any
        if (this.container.querySelector('canvas')) {
            this.container.innerHTML = '';
        }
        this.container.appendChild(this.renderer.domElement);

        // 3b. HTML Overlay (CSS3DRenderer)
        this.htmlOverlay = getHTMLOverlay();
        this.htmlOverlay.init(this.container);

        // 4. Environment (Stars & Grid)
        this.starfield = new StarfieldBackground(this.scene);
        this.grid = new CoordinatePlane(this.scene, this.config.gridSize, this.config.gridSize);

        // 5. Lighting (Standard Setup)
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 10, 5);
        this.scene.add(dirLight);

        // 6. Controls
        this.controls = new SpatialControls(this.camera, this.renderer.domElement, this.scene);
        this.controls.enableAudio = false; // Ensure audio is disabled globally

        // 7. Event Listeners
        window.addEventListener('resize', () => this.onResize());
    }

    /**
     * Add an object to the scene and optionally register it for updates.
     * @param {THREE.Object3D} object 
     * @param {boolean} isUpdatable - If true, calls object.update(delta, time)
     */
    add(object, isUpdatable = false) {
        if (!this.scene) return;
        this.scene.add(object);
        if (isUpdatable && typeof object.update === 'function') {
            this.updatables.push(object);
        }
    }

    start() {
        this.renderer.setAnimationLoop(() => this.animate());
    }

    animate() {
        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();

        // Core updates
        this.controls.update(delta);
        this.starfield.update(time);

        // Custom updates
        this.updatables.forEach(obj => obj.update(delta, time));

        this.renderer.render(this.scene, this.camera);

        // Render HTML Overlay
        if (this.htmlOverlay) {
            this.htmlOverlay.render(this.camera);
        }
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);

        if (this.htmlOverlay) {
            this.htmlOverlay.onWindowResize();
        }
    }

    destroy() {
        this.renderer.dispose();
        // Remove listeners, etc.
    }
}
