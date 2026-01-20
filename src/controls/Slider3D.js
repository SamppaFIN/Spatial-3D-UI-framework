import { BaseControl3D } from '../core/BaseControl3D.js';
import { ControlRegistry } from '../core/ControlRegistry.js';
import * as THREE from 'three';

export class Slider3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null,
            onClick: config.onClick || null
        });

        // Slider-specific properties
        this.label = config.label || 'Slider';
        this.width = config.width || 4.0;
        this.height = config.height || 0.3;
        this.depth = config.depth || 0.2;

        // Mode system: 3 different shapes
        this.mode = config.mode || 0;
        this.modes = ['box', 'sphere', 'sacred'];

        // Slider value properties
        // Support either values array OR min/max/step
        this.values = config.values || null; // Array of values (numbers or strings)
        this.min = config.min !== undefined ? config.min : 0;
        this.max = config.max !== undefined ? config.max : 100;
        this.step = config.step !== undefined ? config.step : 1;

        if (this.values && Array.isArray(this.values) && this.values.length > 0) {
            // Use values array mode
            this.valueIndex = config.valueIndex !== undefined ? config.valueIndex : 0;
            this.valueIndex = Math.max(0, Math.min(this.values.length - 1, this.valueIndex));
            this.value = this.values[this.valueIndex];
        } else {
            // Use min/max/step mode
            this.value = config.value !== undefined ? config.value : this.min;
            this.value = Math.max(this.min, Math.min(this.max, this.value));
            this.valueIndex = null;
        }

        // Colors
        this.trackColor = config.trackColor || 0x444444;
        this.fillColor = config.fillColor || 0x3366ff;
        this.handleColor = config.handleColor || 0x6bb6ff;

        // NEW: Dual-handle range slider
        this.dualHandle = config.dualHandle || false;
        this.minValue = config.minValue !== undefined ? config.minValue : this.min;
        this.maxValue = config.maxValue !== undefined ? config.maxValue : this.max;

        // NEW: Tick marks
        this.tickMarks = config.tickMarks || false;
        this.tickInterval = config.tickInterval || 10;
        this.tickMeshes = [];

        // NEW: Gradient track
        this.gradientTrack = config.gradientTrack || false;
        this.gradientColors = config.gradientColors || [0xff0000, 0xffff00, 0x00ff00];

        // NEW: Snap points
        this.snapPoints = config.snapPoints || null; // Array of values to snap to
        this.snapThreshold = config.snapThreshold || 0.05; // Snap within 5% of range

        // NEW: Keyboard controls
        this.keyboardStep = config.keyboardStep || this.step;
        this.keyboardEnabled = config.keyboardEnabled !== false;

        // Handle properties
        this.handleSize = config.handleSize || 0.4;
        this.handleDepth = config.handleDepth || 0.3;

        // Animation properties
        this.animationSpeed = 0.15;
        this.targetScale = 1.0;
        this.currentScale = 1.0;
        this.hoverScale = 1.05;

        // Drag state
        this.isDragging = false;
        this.isDraggingMin = false; // For dual-handle
        this.isDraggingMax = false; // For dual-handle
        this.dragStartX = 0;
        this.dragStartValue = 0;

        // Callbacks
        this.onChangeCallback = config.onChange || null;
        this.onChangeEndCallback = config.onChangeEnd || null;

        // Value display properties
        this.showValue = config.showValue !== false; // Show by default
        this.valueTextSize = config.valueTextSize || 32;
        this.valueTextColor = config.valueTextColor || '#ffffff';
        this.valueMesh = null;
        this.valueTexture = null;
        this.minValueMesh = null; // For dual-handle
        this.maxValueMesh = null; // For dual-handle

        // Calculate handle position from value
        if (this.dualHandle) {
            this.minHandlePosition = this.valueToPosition(this.minValue);
            this.maxHandlePosition = this.valueToPosition(this.maxValue);
            this.targetMinHandlePosition = this.minHandlePosition;
            this.targetMaxHandlePosition = this.maxHandlePosition;
        } else {
            if (this.values && Array.isArray(this.values)) {
                this.handlePosition = this.valueToPosition(this.valueIndex);
            } else {
                this.handlePosition = this.valueToPosition(this.value);
            }
            this.targetHandlePosition = this.handlePosition;
        }

        // Bind event handlers for document-level listeners
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnMouseUp = this.onMouseUp.bind(this);

        if (this.group) {
            while (this.group.children.length > 0) {
                this.group.remove(this.group.children[0]);
            }
            this.create();
        }
    }

    create() {
        if (!this.modes || this.mode === undefined) {
            return;
        }

        this.createGradientTexture();
        this.createTrack();
        this.createFill();
        this.createHandle();
        this.createLabel();
        this.createGlow();
        this.createValueDisplay();
        this.updateVisualState();
    }

    createGradientTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, `#${this.trackColor.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, `#${this.fillColor.toString(16).padStart(6, '0')}`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.gradientTexture = new THREE.CanvasTexture(canvas);
        this.gradientTexture.needsUpdate = true;
        this.gradientTexture.minFilter = THREE.LinearFilter;
        this.gradientTexture.magFilter = THREE.LinearFilter;
        this.gradientTexture.anisotropy = 16;
    }

    createTrack() {
        if (this.trackMesh) {
            this.group.remove(this.trackMesh);
            this.trackMesh.geometry.dispose();
            this.trackMesh.material.dispose();
        }

        let geometry;
        switch (this.modes[this.mode]) {
            case 'box':
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth, 1, 1, 1);
                break;
            case 'sphere':
                // Use rounded box for sphere mode
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth, 1, 1, 1);
                break;
            case 'sacred':
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth, 1, 1, 1);
                break;
        }

        const material = new THREE.MeshStandardMaterial({
            map: this.gradientTexture,
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.4,
            emissive: this.trackColor,
            emissiveIntensity: 0.1
        });

        this.trackMesh = new THREE.Mesh(geometry, material);
        this.trackMesh.castShadow = true;
        this.trackMesh.receiveShadow = true;
        this.trackMesh.userData.isTrack = true;
        this.trackMesh.userData.isInteractive = true;
        this.trackMesh.userData.control = this;

        this.group.add(this.trackMesh);
    }

    createFill() {
        if (this.fillMesh) {
            this.group.remove(this.fillMesh);
            this.fillMesh.geometry.dispose();
            this.fillMesh.material.dispose();
        }

        // Create fill with full width, will be scaled
        const geometry = new THREE.BoxGeometry(this.width, this.height * 0.9, this.depth * 0.9);
        const material = new THREE.MeshStandardMaterial({
            color: this.fillColor,
            metalness: 0.5,
            roughness: 0.3,
            emissive: this.fillColor,
            emissiveIntensity: 0.3
        });

        this.fillMesh = new THREE.Mesh(geometry, material);
        this.fillMesh.position.x = 0;
        this.fillMesh.castShadow = true;
        this.fillMesh.receiveShadow = true;

        // Set initial scale based on value
        const fillRatio = (this.value - this.min) / (this.max - this.min);
        this.fillMesh.scale.x = fillRatio;
        this.fillMesh.position.x = -this.width / 2 + (this.width * fillRatio) / 2;

        this.group.add(this.fillMesh);
    }

    createHandle() {
        if (this.handleMesh) {
            this.group.remove(this.handleMesh);
            this.handleMesh.geometry.dispose();
            this.handleMesh.material.dispose();
        }

        let geometry;
        switch (this.modes[this.mode]) {
            case 'box':
                geometry = new THREE.BoxGeometry(this.handleSize, this.handleSize, this.handleDepth);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(this.handleSize / 2, 16, 16);
                break;
            case 'sacred':
                // Create octahedron for sacred geometry
                geometry = new THREE.OctahedronGeometry(this.handleSize / 2, 0);
                break;
        }

        const material = new THREE.MeshStandardMaterial({
            color: this.handleColor,
            metalness: 0.7,
            roughness: 0.2,
            emissive: this.handleColor,
            emissiveIntensity: 0.4
        });

        this.handleMesh = new THREE.Mesh(geometry, material);
        this.handleMesh.position.x = this.handlePosition;
        this.handleMesh.position.y = 0;
        this.handleMesh.position.z = this.depth / 2 + this.handleDepth / 2;
        this.handleMesh.castShadow = true;
        this.handleMesh.receiveShadow = true;
        this.handleMesh.userData.isHandle = true;
        this.handleMesh.userData.isInteractive = true;
        this.handleMesh.userData.control = this;

        this.group.add(this.handleMesh);
    }

    createLabel() {
        // Label is handled by HTML overlay system via BaseControl3D
    }

    createGlow() {
        if (this.glowMesh) {
            this.group.remove(this.glowMesh);
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }

        const glowGeometry = new THREE.SphereGeometry(this.handleSize / 2 + 0.1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.handleColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });

        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.position.copy(this.handleMesh.position);
        this.glowMesh.position.z -= 0.05;
        this.glowMesh.visible = false;

        this.group.add(this.glowMesh);
    }

    createValueDisplay() {
        if (!this.showValue) return;

        // Create canvas for text rendering
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;

        // Create texture from canvas
        this.valueTexture = new THREE.CanvasTexture(canvas);
        this.valueTexture.minFilter = THREE.LinearFilter;
        this.valueTexture.magFilter = THREE.LinearFilter;

        // Create plane geometry for value display
        const geometry = new THREE.PlaneGeometry(0.8, 0.4);
        const material = new THREE.MeshBasicMaterial({
            map: this.valueTexture,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.valueMesh = new THREE.Mesh(geometry, material);
        this.valueMesh.position.x = this.handlePosition;
        this.valueMesh.position.y = this.handleSize / 2 + 0.3; // Above handle
        this.valueMesh.position.z = this.depth / 2 + this.handleDepth / 2;

        // Disable raycasting on value display to prevent it from being draggable
        this.valueMesh.raycast = () => { };

        this.group.add(this.valueMesh);

        // Initial render
        this.updateValueDisplay();
    }

    updateValueDisplay() {
        if (!this.showValue || !this.valueTexture) return;

        const canvas = this.valueTexture.image;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background with rounded corners
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 8);
        ctx.fill();

        // Draw text
        ctx.font = `bold ${this.valueTextSize}px Arial`;
        ctx.fillStyle = this.valueTextColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Format value for display
        const displayValue = typeof this.value === 'number'
            ? this.value.toFixed(0)
            : this.value.toString();

        ctx.fillText(displayValue, canvas.width / 2, canvas.height / 2);

        // Update texture
        this.valueTexture.needsUpdate = true;
    }


    valueToPosition(value) {
        if (this.values && Array.isArray(this.values)) {
            // Use values array mode - convert index to position
            const index = typeof value === 'number' && value >= 0 && value < this.values.length
                ? value
                : this.values.indexOf(value);
            if (index >= 0 && index < this.values.length) {
                const normalized = index / (this.values.length - 1);
                return -this.width / 2 + normalized * this.width;
            }
            return -this.width / 2;
        } else {
            // Use min/max/step mode
            const normalized = (value - this.min) / (this.max - this.min);
            return -this.width / 2 + normalized * this.width;
        }
    }

    positionToValue(position) {
        if (this.values && Array.isArray(this.values)) {
            // Use values array mode - convert position to index
            const normalized = (position + this.width / 2) / this.width;
            const index = Math.round(normalized * (this.values.length - 1));
            const clampedIndex = Math.max(0, Math.min(this.values.length - 1, index));
            return this.values[clampedIndex];
        } else {
            // Use min/max/step mode
            const normalized = (position + this.width / 2) / this.width;
            let value = this.min + normalized * (this.max - this.min);

            // Apply step
            if (this.step > 0) {
                value = Math.round(value / this.step) * this.step;
            }

            // Clamp to min/max
            return Math.max(this.min, Math.min(this.max, value));
        }
    }

    positionToIndex(position) {
        // Convert position to array index (for values array mode)
        if (!this.values || !Array.isArray(this.values)) return null;
        const normalized = (position + this.width / 2) / this.width;
        const index = Math.round(normalized * (this.values.length - 1));
        return Math.max(0, Math.min(this.values.length - 1, index));
    }

    setValue(newValue, triggerCallback = true) {
        let changed = false;

        if (this.values && Array.isArray(this.values)) {
            // Use values array mode
            const newIndex = typeof newValue === 'number' && newValue >= 0 && newValue < this.values.length
                ? newValue
                : this.values.indexOf(newValue);

            if (newIndex >= 0 && newIndex < this.values.length && newIndex !== this.valueIndex) {
                this.valueIndex = newIndex;
                this.value = this.values[this.valueIndex];
                changed = true;
            }
        } else {
            // Use min/max/step mode
            const clampedValue = Math.max(this.min, Math.min(this.max, newValue));

            // Apply step
            let steppedValue = clampedValue;
            if (this.step > 0) {
                steppedValue = Math.round(clampedValue / this.step) * this.step;
            }

            if (steppedValue !== this.value) {
                this.value = steppedValue;
                changed = true;
            }
        }

        if (changed) {
            this.targetHandlePosition = this.valueToPosition(this.value);

            // Update fill
            if (this.fillMesh) {
                let fillRatio;
                if (this.values && Array.isArray(this.values)) {
                    fillRatio = this.valueIndex / (this.values.length - 1);
                } else {
                    fillRatio = (this.value - this.min) / (this.max - this.min);
                }
                this.fillMesh.scale.x = fillRatio;
                this.fillMesh.position.x = -this.width / 2 + (this.width * fillRatio) / 2;
            }

            // Update value display
            this.updateValueDisplay();

            if (triggerCallback && this.onChangeCallback) {
                this.onChangeCallback(this, this.value, this.valueIndex);
            }
        }
    }

    onMouseDown(event) {
        if (!this.isEnabled || !this.camera) return;



        const intersect = this.checkIntersection(this.camera, event);



        if (intersect) {
            // Check if handle or track was clicked
            if (intersect.object.userData.isHandle || intersect.object.userData.isInteractive) {
                this.isPressed = true;
                this.isDragging = true;

                // Disable OrbitControls during drag to prevent camera rotation
                const orbitControls = ControlRegistry.orbitControls;
                if (orbitControls) {
                    orbitControls.enabled = false;
                }

                // Add global event listeners for drag (ensures drag works even if mouse leaves canvas)
                document.addEventListener('mousemove', this.boundOnMouseMove, false);
                document.addEventListener('mouseup', this.boundOnMouseUp, false);



                // Get mouse position in world space
                const canvas = event.target?.closest('canvas') || document.querySelector('canvas');
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const mousePos = this.getMousePosition(event, canvas);
                    this.dragStartX = mousePos.x;
                    this.dragStartValue = this.value;
                }

                // If track was clicked (not handle), jump handle to that position immediately
                if (intersect.object.userData.isTrack && !intersect.object.userData.isHandle) {
                    this.updateValueFromMouse(event);
                }

                this.onPress();
            }
        }
    }

    updateValueFromMouse(event) {
        const canvas = event.target?.closest('canvas') || document.querySelector('canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        // Define plane in world space that matches the slider's local XY plane
        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, this.group.getWorldPosition(new THREE.Vector3()));

        const intersection = new THREE.Vector3();
        const hasIntersection = raycaster.ray.intersectPlane(plane, intersection);

        if (hasIntersection) {
            // Convert world intersection to local space
            this.group.worldToLocal(intersection);

            // Now intersection.x is the local X position along the track
            const newValue = this.positionToValue(intersection.x);
            this.setValue(newValue, true);
        }
    }


    onMouseMove(event) {
        if (!this.isEnabled || !this.camera) return;

        if (this.isDragging) {
            // Update value based on mouse movement
            const canvas = event.target?.closest('canvas') || document.querySelector('canvas');
            if (canvas) {
                const mousePos = this.getMousePosition(event, canvas);
                const mouse = new THREE.Vector2(mousePos.x, mousePos.y);
                this.raycaster.setFromCamera(mouse, this.camera);

                // Define plane in world space that matches the slider's local XY plane
                const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
                const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, this.group.getWorldPosition(new THREE.Vector3()));

                const intersection = new THREE.Vector3();
                const hasIntersection = this.raycaster.ray.intersectPlane(plane, intersection);

                if (hasIntersection) {
                    // Convert world intersection to local space
                    this.group.worldToLocal(intersection);

                    // intersection.x is now the correct local X position
                    const newValue = this.positionToValue(intersection.x);
                    this.setValue(newValue, true);
                }
            }
        } else {
            // Normal hover detection
            super.onMouseMove(event);
        }
    }

    onMouseUp(event) {
        if (this.isPressed || this.isDragging) {
            this.isPressed = false;
            this.isDragging = false;

            // Remove global event listeners
            document.removeEventListener('mousemove', this.boundOnMouseMove, false);
            document.removeEventListener('mouseup', this.boundOnMouseUp, false);

            // Re-enable OrbitControls after drag
            const orbitControls = ControlRegistry.orbitControls;
            if (orbitControls) {
                orbitControls.enabled = true;
            }

            if (this.onChangeEndCallback) {
                this.onChangeEndCallback(this, this.value, this.valueIndex);
            }

            this.onRelease();
        }
    }

    onPress() {
        this.targetScale = 0.95;
        if (this.glowMesh) {
            this.glowMesh.visible = true;
        }
    }

    onRelease() {
        this.targetScale = 1.0;
        if (this.glowMesh) {
            this.glowMesh.visible = false;
        }
    }

    onHover() {
        super.onHover();
        this.targetScale = this.hoverScale;
        if (this.glowMesh) {
            this.glowMesh.visible = true;
        }
    }

    onHoverLeave() {
        super.onHoverLeave();
        if (!this.isDragging) {
            this.targetScale = 1.0;
            if (this.glowMesh) {
                this.glowMesh.visible = false;
            }
        }
    }

    onClick() {
        super.onClick();
        // Focus camera on slider when clicked (but not when dragging)
        if (!this.isDragging) {
            this.focusCamera();
        }
    }

    updateVisualState() {
        // Update handle position with animation
        if (this.handleMesh) {
            this.handlePosition += (this.targetHandlePosition - this.handlePosition) * this.animationSpeed;
            this.handleMesh.position.x = this.handlePosition;

            // Update glow position
            if (this.glowMesh) {
                this.glowMesh.position.x = this.handlePosition;
            }

            // Update value display position to follow handle
            if (this.valueMesh) {
                this.valueMesh.position.x = this.handlePosition;
            }
        }

        // Update scale
        this.currentScale += (this.targetScale - this.currentScale) * this.animationSpeed;
        if (this.group) {
            this.group.scale.set(this.currentScale, this.currentScale, this.currentScale);
        }
    }

    update() {
        this.updateVisualState();
    }

    getValue() {
        return this.value;
    }

    getValueIndex() {
        // Return current index if using values array, null otherwise
        return this.valueIndex;
    }

    getNormalizedValue() {
        if (this.values && Array.isArray(this.values)) {
            return this.valueIndex / (this.values.length - 1);
        } else {
            return (this.value - this.min) / (this.max - this.min);
        }
    }

    dispose() {
        // Remove any lingering event listeners
        document.removeEventListener('mousemove', this.boundOnMouseMove, false);
        document.removeEventListener('mouseup', this.boundOnMouseUp, false);

        // Call parent cleanup
        super.dispose();
    }
}
