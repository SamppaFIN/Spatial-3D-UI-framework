import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';
import { ControlRegistry } from './ControlRegistry.js';

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

        const container = this.canvas.parentElement || document.body;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || 500;

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            55,
            width / height,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Create OrbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = 50;
        this.controls.enablePan = true;

        // ── Touch Optimizations ──
        this._setupTouchSupport();

        // Initialize HTML overlay system
        this.htmlOverlay = getHTMLOverlay();
        this.htmlOverlay.init(container);
        this.htmlOverlay.setSize(width, height);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Auto-register with ControlRegistry (DX improvement: no manual call needed)
        ControlRegistry.setOrbitControls(this.controls);
        ControlRegistry.setRenderer(this.renderer);
    }

    onWindowResize() {
        const container = this.canvas.parentElement || document.body;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || 500;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        if (this.htmlOverlay) {
            this.htmlOverlay.setSize(width, height);
        }
    }

    // ── Touch Support ──

    /**
     * Configure touch-optimized OrbitControls + double-tap reset + touch hover.
     * @private
     */
    _setupTouchSupport() {
        const canvas = this.renderer.domElement;

        // 1. CSS: prevent browser gestures on the 3D canvas
        canvas.style.touchAction = 'none';

        // 2. OrbitControls touch mapping (Three.js 0.160 defaults are correct,
        //    but we make them explicit for clarity and future-proofing)
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        // 3. Double-tap → reset camera to default position
        let lastTapTime = 0;
        const defaultPos = this.camera.position.clone();
        const defaultTarget = new THREE.Vector3(0, 0, 0);
        const DOUBLE_TAP_DELAY = 300; // ms

        canvas.addEventListener('touchend', (e) => {
            // Only trigger for single-finger taps (not pinch/swipe)
            if (e.changedTouches.length !== 1) return;

            const now = Date.now();
            if (now - lastTapTime < DOUBLE_TAP_DELAY) {
                // Double tap detected — reset camera
                e.preventDefault();
                this._animateCameraReset(defaultPos, defaultTarget);
                this._pulseCanvasBorder();
                lastTapTime = 0;
            } else {
                lastTapTime = now;
            }
        }, { passive: false });

        // Also support double-click on desktop for consistency
        canvas.addEventListener('dblclick', (e) => {
            this._animateCameraReset(defaultPos, defaultTarget);
            this._pulseCanvasBorder();
        });

        // 4. Touch hover raycaster — highlight nearest control on touch move
        this._bindTouchHover(canvas);
    }

    /**
     * Smoothly animate camera back to a target position + lookAt.
     * @private
     */
    _animateCameraReset(targetPos, targetLookAt, duration = 600) {
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1.0);
            // Ease-out cubic
            const ease = 1 - Math.pow(1 - t, 3);

            this.camera.position.lerpVectors(startPos, targetPos, ease);
            this.controls.target.lerpVectors(startTarget, targetLookAt, ease);

            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Brief pulsing glow on the canvas border (visual feedback for reset).
     * @private
     */
    _pulseCanvasBorder() {
        const canvas = this.renderer.domElement;
        canvas.style.transition = 'box-shadow 0.15s ease-out';
        canvas.style.boxShadow = 'inset 0 0 60px rgba(78, 205, 196, 0.4)';
        setTimeout(() => {
            canvas.style.boxShadow = 'inset 0 0 0px rgba(78, 205, 196, 0)';
            setTimeout(() => {
                canvas.style.transition = '';
                canvas.style.boxShadow = '';
            }, 150);
        }, 150);
    }

    /**
     * Touch-based raycaster: on touch-move (single finger, not rotating),
     * find the nearest registered control and simulate hover.
     * @private
     */
    _bindTouchHover(canvas) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let lastHovered = null;

        canvas.addEventListener('touchmove', (e) => {
            // Only for single-finger moves (not pinch)
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();

            // Normalize to NDC (-1 to +1)
            mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);

            // Get all registered control meshes
            const allControls = ControlRegistry.getAll();
            const meshes = allControls
                .map(c => c.mesh || c.group)
                .filter(Boolean);

            if (meshes.length === 0) return;

            const intersects = raycaster.intersectObjects(meshes, true);

            // Clear previous hover
            if (lastHovered && (!intersects.length || !this._isSameControl(lastHovered, intersects[0].object, allControls))) {
                const prev = this._findControlByMesh(lastHovered, allControls);
                if (prev && prev.onHoverLeave) prev.onHoverLeave();
                if (prev) prev.isHovered = false;
                lastHovered = null;
            }

            // Set new hover
            if (intersects.length > 0) {
                const hit = intersects[0].object;
                if (!lastHovered || !this._isSameControl(lastHovered, hit, allControls)) {
                    lastHovered = hit;
                    const ctrl = this._findControlByMesh(hit, allControls);
                    if (ctrl) {
                        ctrl.isHovered = true;
                        if (ctrl.onHover) ctrl.onHover();
                    }
                }
            }
        }, { passive: true });

        // Clear hover on touch end
        canvas.addEventListener('touchend', () => {
            if (lastHovered) {
                const allControls = ControlRegistry.getAll();
                const ctrl = this._findControlByMesh(lastHovered, allControls);
                if (ctrl && ctrl.onHoverLeave) ctrl.onHoverLeave();
                if (ctrl) ctrl.isHovered = false;
                lastHovered = null;
            }
        });
    }

    /**
     * Check if a hit object belongs to the same control as the last hovered.
     * @private
     */
    _isSameControl(lastMesh, newMesh, allControls) {
        const lastCtrl = this._findControlByMesh(lastMesh, allControls);
        const newCtrl = this._findControlByMesh(newMesh, allControls);
        return lastCtrl === newCtrl;
    }

    /**
     * Walk up the object hierarchy to find the parent control.
     * @private
     */
    _findControlByMesh(obj, allControls) {
        let current = obj;
        while (current) {
            for (const ctrl of allControls) {
                if (ctrl.mesh === current || ctrl.group === current) return ctrl;
            }
            current = current.parent;
        }
        return null;
    }

    setBackgroundColor(color) {
        if (this.scene) {
            this.scene.background = new THREE.Color(color);
        }
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        if (this.htmlOverlay) {
            this.htmlOverlay.render(this.camera);
        }
    }

    getScene() { return this.scene; }
    getCamera() { return this.camera; }
    getRenderer() { return this.renderer; }
    getControls() { return this.controls; }
}
