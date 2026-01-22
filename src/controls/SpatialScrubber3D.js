import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * SpatialScrubber3D - 3D Animation Timeline Control
 * 
 * A physical 3D track with a draggable handle that controls animation playback.
 * Features ghost frame previews, velocity-based playback, and magnetic snapping.
 * 
 * @extends BaseControl3D
 */
export class SpatialScrubber3D extends BaseControl3D {
    constructor(scene, camera, position, config = {}) {
        // Initialize properties BEFORE calling super()
        // This is necessary because BaseControl3D.constructor calls this.create()

        // Configuration - must be set before super()
        const trackCurve = config.trackCurve || SpatialScrubber3D.createDefaultCurve();
        const animationMixer = config.animationMixer || null;
        const duration = config.duration || 10; // seconds
        const keyframes = config.keyframes || [0, 0.25, 0.5, 0.75, 1.0];
        const ghostMesh = config.ghostMesh || null;
        const snapDistance = config.snapDistance || 0.05;
        const trackRadius = config.trackRadius || 0.1;
        const handleRadius = config.handleRadius || 0.3;
        const onScrub = config.onScrub || null;

        // Call parent constructor
        super(scene, camera, position, config);

        // Now assign to instance properties
        this.trackCurve = trackCurve;
        this.animationMixer = animationMixer;
        this.duration = duration;
        this.keyframes = keyframes;
        this.ghostMesh = ghostMesh;
        this.snapDistance = snapDistance;
        this.trackRadius = trackRadius;
        this.handleRadius = handleRadius;
        this.onScrub = onScrub;

        // State
        this.handlePosition = 0; // [0, 1] along curve
        this.isDragging = false;
        this.lastPosition = 0;
        this.velocity = 0;
        this.lastTime = Date.now();

        // Meshes
        this.trackMesh = null;
        this.progressMesh = null;
        this.handle = null;
        this.ghostMeshes = [];
        this.keyframeMarkers = [];

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // Now create all 3D components (trackCurve is initialized)
        this.create();

        // Setup interaction
        this.setupInteraction();
    }

    /**
     * Create default circular track curve (static method)
     */
    static createDefaultCurve() {
        const points = [];
        const radius = 3;
        const segments = 64;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }

        return new THREE.CatmullRomCurve3(points, true);
    }

    /**
     * Create the scrubber components
     * Called by BaseControl3D constructor
     */
    create() {
        // Check if trackCurve is initialized
        // If not, it means we're being called from BaseControl3D constructor
        // before SpatialScrubber3D constructor has finished
        if (!this.trackCurve) {
            // Defer creation - will be called manually after initialization
            return;
        }

        console.log('SpatialScrubber3D: Initializing components with curve', this.trackCurve);

        this.createTrack();
        this.createProgressTrail();
        this.createHandle();
        this.createKeyframeMarkers();
        if (this.ghostMesh) {
            this.createGhostMeshes();
        }
    }

    /**
     * Create the track geometry
     */
    createTrack() {
        const geometry = new THREE.TubeGeometry(
            this.trackCurve,
            64,  // tubular segments
            this.trackRadius,
            8,   // radial segments
            false // not closed
        );

        const material = new THREE.MeshStandardMaterial({
            color: 0x2a9d8f,
            emissive: 0x1a5d5f,
            metalness: 0.6,
            roughness: 0.3
        });

        this.trackMesh = new THREE.Mesh(geometry, material);
        this.group.add(this.trackMesh);
    }

    /**
     * Create progress trail that follows handle
     */
    createProgressTrail() {
        // Clone track geometry for progress indicator
        const geometry = new THREE.TubeGeometry(
            this.trackCurve,
            64,
            this.trackRadius * 1.1, // Slightly larger
            8,
            false
        );

        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.6
        });

        this.progressMesh = new THREE.Mesh(geometry, material);

        // Use morph targets or custom shader to show only completed portion
        // For now, we'll scale it dynamically in update()
        this.progressMesh.scale.set(0, 1, 1);
        this.group.add(this.progressMesh);
    }

    /**
     * Create draggable handle
     */
    createHandle() {
        if (!this.trackCurve) return;

        const geometry = new THREE.SphereGeometry(this.handleRadius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });

        this.handle = new THREE.Mesh(geometry, material);
        this.handle.userData.isScrubberHandle = true;

        // Position at start of curve
        const startPoint = this.trackCurve.getPoint(0);
        this.handle.position.copy(startPoint);

        this.group.add(this.handle);
    }

    /**
     * Create keyframe markers along track
     */
    createKeyframeMarkers() {
        this.keyframes.forEach(t => {
            const geometry = new THREE.SphereGeometry(this.trackRadius * 1.5, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0xffaa00,
                emissiveIntensity: 0.3,
                metalness: 0.5,
                roughness: 0.5
            });

            const marker = new THREE.Mesh(geometry, material);
            const point = this.trackCurve.getPoint(t);
            marker.position.copy(point);
            marker.userData.keyframeTime = t;

            this.keyframeMarkers.push(marker);
            this.group.add(marker);
        });
    }

    /**
     * Create ghost mesh previews at keyframes
     */
    createGhostMeshes() {
        if (!this.ghostMesh) return;

        this.keyframes.forEach(t => {
            // Clone the template mesh
            const ghost = this.ghostMesh.clone();

            // Make semi-transparent
            ghost.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = 0.3;
                    child.material.emissive = new THREE.Color(0x00ffff);
                    child.material.emissiveIntensity = 0.2;
                }
            });

            // Position along track
            const point = this.trackCurve.getPoint(t);
            ghost.position.copy(point);

            // Store reference
            this.ghostMeshes.push({ mesh: ghost, t: t });
            this.group.add(ghost);
        });
    }

    /**
     * Setup mouse/touch interaction
     */
    setupInteraction() {
        this.boundOnMouseDown = this.onMouseDown.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnMouseUp = this.onMouseUp.bind(this);

        window.addEventListener('mousedown', this.boundOnMouseDown);
        window.addEventListener('mousemove', this.boundOnMouseMove);
        window.addEventListener('mouseup', this.boundOnMouseUp);
    }

    /**
     * Handle mouse down - start dragging
     */
    onMouseDown(event) {
        if (!this.isEnabled) return;

        const canvas = event.target?.closest('canvas');
        if (!canvas) return;

        // Get mouse position
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast to check if handle was clicked
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.handle);

        if (intersects.length > 0) {
            this.isDragging = true;
            this.lastTime = Date.now();
            document.body.style.cursor = 'grabbing';
        }
    }

    /**
     * Handle mouse move - update handle position
     */
    onMouseMove(event) {
        if (!this.isDragging) return;

        const canvas = event.target?.closest('canvas');
        if (!canvas) return;

        // Get mouse position
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast to get world position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Intersect with a plane at the track's height
        const worldPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.dragPlane, worldPoint);

        if (worldPoint) {
            this.updateDrag(worldPoint);
        }
    }

    /**
     * Handle mouse up - stop dragging
     */
    onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.velocity = 0;
            document.body.style.cursor = 'default';
        }
    }

    /**
     * Update handle position during drag
     */
    updateDrag(worldPoint) {
        // Find closest point on curve
        const closestT = this.findClosestPointOnCurve(worldPoint);

        // Check for magnetic snap to keyframes
        let snappedT = closestT;
        for (const keyframe of this.keyframes) {
            if (Math.abs(closestT - keyframe) < this.snapDistance) {
                snappedT = keyframe;
                break;
            }
        }

        // Calculate velocity
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // seconds
        const deltaT = snappedT - this.lastPosition;
        this.velocity = deltaTime > 0 ? deltaT / deltaTime : 0;

        // Update position
        this.handlePosition = snappedT;
        this.lastPosition = snappedT;
        this.lastTime = currentTime;

        // Update visual position
        const point = this.trackCurve.getPoint(snappedT);
        this.handle.position.copy(point);

        // Update animation
        this.updateAnimation();
    }

    /**
     * Find closest point on curve to world position
     */
    findClosestPointOnCurve(worldPoint) {
        let closestT = 0;
        let minDistance = Infinity;

        // Sample curve at regular intervals
        const samples = 100;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const point = this.trackCurve.getPoint(t);
            const distance = worldPoint.distanceTo(point);

            if (distance < minDistance) {
                minDistance = distance;
                closestT = t;
            }
        }

        // Refine with nearby samples
        const refineSamples = 20;
        const refineRange = 1 / samples;
        for (let i = 0; i <= refineSamples; i++) {
            const t = closestT - refineRange + (i / refineSamples) * refineRange * 2;
            if (t < 0 || t > 1) continue;

            const point = this.trackCurve.getPoint(t);
            const distance = worldPoint.distanceTo(point);

            if (distance < minDistance) {
                minDistance = distance;
                closestT = t;
            }
        }

        return THREE.MathUtils.clamp(closestT, 0, 1);
    }

    /**
     * Update animation based on handle position
     */
    updateAnimation() {
        if (this.animationMixer) {
            const time = this.handlePosition * this.duration;
            this.animationMixer.setTime(time);
        }

        // Trigger callback
        if (this.onScrub) {
            const time = this.handlePosition * this.duration;
            this.onScrub(time, this.velocity);
        }

        // Update ghost visibility
        this.updateGhostVisibility();
    }

    /**
     * Update ghost mesh visibility based on proximity
     */
    updateGhostVisibility() {
        this.ghostMeshes.forEach(ghost => {
            const distance = Math.abs(ghost.t - this.handlePosition);

            // Fade based on distance
            const opacity = THREE.MathUtils.lerp(
                0.1,  // far
                0.6,  // near
                1.0 - Math.min(distance / 0.2, 1.0)
            );

            ghost.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material.transparent) {
                    child.material.opacity = opacity;
                }
            });
        });
    }

    /**
     * Scrub to specific position [0, 1]
     */
    scrubToPosition(t) {
        this.handlePosition = THREE.MathUtils.clamp(t, 0, 1);

        // Update handle position if it exists
        if (this.handle && this.trackCurve) {
            const point = this.trackCurve.getPoint(this.handlePosition);
            this.handle.position.copy(point);
        }

        this.updateAnimation();
    }

    /**
     * Update method called each frame
     */
    update() {
        // Animate handle glow when hovering
        if (this.handle) {
            const time = Date.now() * 0.001;
            this.handle.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.2;
        }

        // Animate keyframe markers
        this.keyframeMarkers.forEach((marker, index) => {
            const time = Date.now() * 0.001;
            const offset = index * 0.5;
            marker.material.emissiveIntensity = 0.3 + Math.sin(time * 2 + offset) * 0.2;
        });
    }

    /**
     * Dispose of resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('mousedown', this.boundOnMouseDown);
        window.removeEventListener('mousemove', this.boundOnMouseMove);
        window.removeEventListener('mouseup', this.boundOnMouseUp);

        // Dispose ghost meshes
        this.ghostMeshes.forEach(ghost => {
            ghost.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                    child.material?.dispose();
                }
            });
        });

        // Call parent dispose
        super.dispose();
    }
}
