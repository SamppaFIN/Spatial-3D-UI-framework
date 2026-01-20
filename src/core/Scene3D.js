import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';

export class Scene3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.htmlOverlay = null;
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows for landscape and future 3D components
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create OrbitControls for camera navigation
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.1; // Allow zooming very close to objects
        this.controls.maxDistance = 50; // Increased max distance for better overview
        this.controls.enablePan = true;
        
        // Initialize HTML overlay system
        this.htmlOverlay = getHTMLOverlay();
        this.htmlOverlay.init(this.canvas.parentElement || document.body);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.htmlOverlay) {
            this.htmlOverlay.onWindowResize();
        }
    }
    
    render() {
        this.controls.update();
        // TransformControls update is handled by individual controls
        this.renderer.render(this.scene, this.camera);
        
        // Render HTML overlays after WebGL render
        if (this.htmlOverlay) {
            this.htmlOverlay.render(this.camera);
        }
    }
    
    getScene() {
        return this.scene;
    }
    
    getCamera() {
        return this.camera;
    }
    
    getRenderer() {
        return this.renderer;
    }
    
    getControls() {
        return this.controls;
    }
}
