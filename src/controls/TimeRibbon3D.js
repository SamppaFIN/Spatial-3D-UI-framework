import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';
import { ControlRegistry } from '../core/ControlRegistry.js';

/**
 * TimeRibbon3D - Physical timeline manipulation control
 * 
 * A glowing ribbon that spirals around objects, representing a timeline.
 * Users can grab and rotate it like a film reel to scrub through time.
 * 
 * Features:
 * - CatmullRomCurve3 ribbon path
 * - AI-generated highlight nodes
 * - Ghost mesh previews at key moments
 * - Smooth time scrubbing
 * 
 * @extends BaseControl3D
 */
export class TimeRibbon3D extends BaseControl3D {
    /**
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {THREE.Camera} camera - The Three.js camera
     * @param {Array<number>} position - [x, y, z] position
     * @param {Object} config - Configuration object
     * @param {Array} config.timeline - Array of {time, label, description, data}
     * @param {number} config.radius - Radius of ribbon spiral (default: 5)
     * @param {number} config.turns - Number of spiral turns (default: 3)
     * @param {number} config.ribbonWidth - Width of ribbon (default: 0.3)
     * @param {Function} config.onTimeChange - Callback when time changes
     * @param {boolean} config.aiHighlights - Auto-generate highlights (default: false)
     * @param {THREE.WebGLRenderer} config.renderer - Required for HTML overlays
     */
    constructor(scene, camera, position, config = {}) {
        // Set flag to prevent create() from running during super()
        // We'll call _createInternal() after all properties are initialized
        const _deferInit = true;

        // Timeline configuration
        const timeline = config.timeline || [];
        const currentTime = timeline.length > 0 ? timeline[0].time : 0;
        const minTime = timeline.length > 0 ? timeline[0].time : 0;
        const maxTime = timeline.length > 0 ? timeline[timeline.length - 1].time : 100;

        // Store in temporary variables to assign after super()
        const tempConfig = {
            timeline,
            currentTime,
            minTime,
            maxTime,
            radius: config.radius || 5,
            turns: config.turns || 3,
            ribbonWidth: config.ribbonWidth || 0.3,
            segments: 200,
            onTimeChange: config.onTimeChange || ((time) => console.log('Time:', time)),
            aiHighlights: config.aiHighlights || false
        };

        super(scene, camera, position, config);

        // Now assign all properties after super() completes
        this.timeline = tempConfig.timeline;
        this.currentTime = tempConfig.currentTime;
        this.minTime = tempConfig.minTime;
        this.maxTime = tempConfig.maxTime;
        this.radius = tempConfig.radius;
        this.turns = tempConfig.turns;
        this.ribbonWidth = tempConfig.ribbonWidth;
        this.segments = tempConfig.segments;
        this.onTimeChange = tempConfig.onTimeChange;
        this.aiHighlights = tempConfig.aiHighlights;

        // Visual elements
        this.ribbonMesh = null;
        this.ribbonPath = null;
        this.highlightNodes = [];
        this.ghostMeshes = [];
        this.handleSphere = null;

        // Interaction
        this.isDragging = false;
        this.dragStartPoint = null;

        // Now that all properties are initialized, create the visual elements
        this._initialized = true;
        this._createInternal();

        // Register with ControlRegistry
        ControlRegistry.register(this);
    }

    /**
     * Override create() to prevent it from running before initialization
     */
    create() {
        if (!this._initialized) {
            // Called by BaseControl3D before our properties are set
            return;
        }
        this._createInternal();
    }

    /**
     * Internal create method - contains the actual implementation
     */
    _createInternal() {
        this.group = new THREE.Group();
        this.group.position.set(...this.position);

        // Generate ribbon path (spiral)
        this.createRibbonPath();

        // Create ribbon mesh
        this.createRibbonMesh();

        // Create highlight nodes
        this.createHighlightNodes();

        // Create draggable handle
        this.createHandle();

        // Create ghost meshes (optional)
        if (this.timeline.length > 0) {
            this.createGhostMeshes();
        }

        this.scene.add(this.group);
    }

    /**
     * Generate a spiral path for the ribbon using CatmullRomCurve3
     */
    createRibbonPath() {
        const points = [];
        const totalPoints = this.segments;

        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints;
            const angle = t * Math.PI * 2 * this.turns;
            const height = (t - 0.5) * 10; // Vertical spread

            const x = Math.cos(angle) * this.radius;
            const z = Math.sin(angle) * this.radius;
            const y = height;

            points.push(new THREE.Vector3(x, y, z));
        }

        this.ribbonPath = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    }

    /**
     * Create the visual ribbon mesh with gradient material
     */
    createRibbonMesh() {
        // Create tube geometry along the path
        const tubeGeometry = new THREE.TubeGeometry(
            this.ribbonPath,
            this.segments,
            this.ribbonWidth,
            8,
            false
        );

        // Create gradient material (past -> present -> future)
        const material = new THREE.MeshStandardMaterial({
            color: 0x4ecdc4,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 0.4,
            transparent: true,
            opacity: 0.8
        });

        this.ribbonMesh = new THREE.Mesh(tubeGeometry, material);
        this.ribbonMesh.userData.isTimeRibbon = true;
        this.group.add(this.ribbonMesh);
    }

    /**
     * Create glowing nodes at timeline highlights
     */
    createHighlightNodes() {
        this.timeline.forEach((event, index) => {
            const t = this.mapTimeToRibbon(event.time);
            const position = this.ribbonPath.getPoint(t);

            // Create glowing sphere
            const geometry = new THREE.SphereGeometry(0.4, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffd700,
                emissiveIntensity: 1.0,
                metalness: 0.5,
                roughness: 0.2
            });

            const node = new THREE.Mesh(geometry, material);
            node.position.copy(position);
            node.userData.event = event;
            node.userData.isHighlight = true;

            // Add pulsing animation
            node.userData.pulsePhase = index * 0.5;

            this.highlightNodes.push(node);
            this.group.add(node);
        });
    }

    /**
     * Create draggable handle sphere
     */
    createHandle() {
        const geometry = new THREE.SphereGeometry(0.6, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.8,
            metalness: 0.7,
            roughness: 0.3
        });

        this.handleSphere = new THREE.Mesh(geometry, material);
        this.handleSphere.userData.isDraggable = true;
        this.handleSphere.userData.isHandle = true;

        // Position at current time
        this.updateHandlePosition();

        this.group.add(this.handleSphere);
    }

    /**
     * Create semi-transparent ghost meshes at key moments
     */
    createGhostMeshes() {
        // Create simple placeholder ghosts
        this.timeline.forEach((event, index) => {
            const t = this.mapTimeToRibbon(event.time);
            const position = this.ribbonPath.getPoint(t);

            // Simple box as placeholder
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.2,
                wireframe: true
            });

            const ghost = new THREE.Mesh(geometry, material);
            ghost.position.copy(position);
            ghost.position.y += 1; // Offset above ribbon

            this.ghostMeshes.push(ghost);
            this.group.add(ghost);
        });
    }

    /**
     * Map timeline value to ribbon position [0, 1]
     */
    mapTimeToRibbon(time) {
        return (time - this.minTime) / (this.maxTime - this.minTime);
    }

    /**
     * Map ribbon position [0, 1] to timeline value
     */
    mapRibbonToTime(t) {
        return this.minTime + t * (this.maxTime - this.minTime);
    }

    /**
     * Update handle position based on current time
     */
    updateHandlePosition() {
        if (!this.handleSphere) return;

        const t = this.mapTimeToRibbon(this.currentTime);
        const position = this.ribbonPath.getPoint(t);
        this.handleSphere.position.copy(position);
    }

    /**
     * Handle raycaster interaction
     */
    handleRaycast(raycaster) {
        // Check if handle is being grabbed
        const handleIntersects = raycaster.intersectObject(this.handleSphere);

        if (handleIntersects.length > 0) {
            return { object: this.handleSphere, point: handleIntersects[0].point };
        }

        // Check ribbon itself
        const ribbonIntersects = raycaster.intersectObject(this.ribbonMesh);
        if (ribbonIntersects.length > 0) {
            return { object: this.ribbonMesh, point: ribbonIntersects[0].point };
        }

        return null;
    }

    /**
     * Start dragging
     */
    startDrag(point) {
        this.isDragging = true;
        this.dragStartPoint = point.clone();
    }

    /**
     * Update drag position
     */
    updateDrag(point) {
        if (!this.isDragging) return;

        // Find closest point on ribbon path
        const closestT = this.findClosestPointOnPath(point);

        // Update current time
        this.currentTime = this.mapRibbonToTime(closestT);
        this.updateHandlePosition();

        // Trigger callback
        this.onTimeChange(this.currentTime);
    }

    /**
     * End dragging
     */
    endDrag() {
        this.isDragging = false;
        this.dragStartPoint = null;
    }

    /**
     * Find closest point on path to given 3D point
     */
    findClosestPointOnPath(point) {
        let closestT = 0;
        let closestDistance = Infinity;

        // Sample path at multiple points
        for (let i = 0; i <= 100; i++) {
            const t = i / 100;
            const pathPoint = this.ribbonPath.getPoint(t);
            const distance = point.distanceTo(pathPoint);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestT = t;
            }
        }

        return closestT;
    }

    /**
     * Animate to specific time
     */
    scrubToTime(targetTime, duration = 1000) {
        const startTime = this.currentTime;
        const startTimestamp = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            this.currentTime = startTime + (targetTime - startTime) * eased;
            this.updateHandlePosition();
            this.onTimeChange(this.currentTime);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Update animation loop
     */
    update() {
        // Pulse highlight nodes
        this.highlightNodes.forEach((node, index) => {
            const phase = node.userData.pulsePhase + Date.now() * 0.001;
            const scale = 1 + Math.sin(phase) * 0.2;
            node.scale.setScalar(scale);
        });

        // Rotate ghost meshes to face camera
        this.ghostMeshes.forEach(ghost => {
            ghost.lookAt(this.camera.position);
        });
    }

    /**
     * Clean up
     */
    dispose() {
        ControlRegistry.unregister(this);

        // Dispose geometries and materials
        this.ribbonMesh?.geometry.dispose();
        this.ribbonMesh?.material.dispose();

        this.highlightNodes.forEach(node => {
            node.geometry.dispose();
            node.material.dispose();
        });

        this.ghostMeshes.forEach(ghost => {
            ghost.geometry.dispose();
            ghost.material.dispose();
        });

        if (this.handleSphere) {
            this.handleSphere.geometry.dispose();
            this.handleSphere.material.dispose();
        }

        this.scene.remove(this.group);
    }
}
