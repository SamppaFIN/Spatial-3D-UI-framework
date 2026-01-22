import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { ControlRegistry } from './ControlRegistry.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';
import { MarkdownRenderer } from '../utils/MarkdownRenderer.js';

export class BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = config.renderer || null;
        this.position = position;
        this.config = config;

        // Create group for the control
        this.group = new THREE.Group();
        this.group.position.set(...position);

        // State System (New Standard)
        this.state = {
            // Core Identity
            id: this.controlId,
            type: this.constructor.name,

            // Dimensions (Standardized)
            width: config.width || 1.0,
            height: config.height || 1.0,
            depth: config.depth || 0.1,

            // Visuals
            visible: true,
            opacity: 1.0,
            style: config.style || 'default',

            // Custom Data (Merge config)
            ...config
        };

        // Event System
        this.events = {}; // { 'click': [cb1, cb2] }

        // Legacy State (Keep for compat, but sync where possible)
        this.isHovered = false;
        this.isPressed = false;
        this.isEnabled = config.enabled !== false;
        this.isEditMode = false;

        // TransformControls
        this.transformControls = null;

        // Callbacks
        this.onClickCallback = config.onClick || null;
        this.onHoverCallback = config.onHover || null;
        this.onHoverLeaveCallback = config.onHoverLeave || null;

        // Raycasting setup
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Double-click detection
        this.lastClickTime = 0;
        this.doubleClickDelay = 300; // milliseconds
        this.onDoubleClickCallback = config.onDoubleClick || null;

        // Tooltip and label configuration
        this.controlId = config.controlId || `control_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.tooltipConfig = config.tooltip || null;
        this.labelConfig = config.labelConfig || null;
        this.tooltipOverlayId = `tooltip_${this.controlId}`;
        this.labelOverlayId = `label_${this.controlId}`;

        // Create the control mesh (override in subclasses)
        this.create();

        // Add to scene
        this.scene.add(this.group);

        // Setup TransformControls if renderer is available
        if (this.renderer) {
            this.setupTransformControls();
        }

        // Register with ControlRegistry
        ControlRegistry.register(this);

        // Setup event listeners
        this.setupEventListeners();

        // Setup tooltip and label overlays
        this.setupTooltipAndLabel();
        // Setup tooltip and label overlays
        this.setupTooltipAndLabel();
    }

    // --- 1. Standard Data Interface ---

    /**
     * Set a property and trigger updates.
     * @param {string} key - Property name
     * @param {any} value - New value
     */
    set(key, value) {
        if (this.state[key] === value) return; // No change

        const oldValue = this.state[key];
        this.state[key] = value;

        // Notify internal handler
        this.onStateChange(key, value, oldValue);

        // Emit generic change event
        this.emit('change', { key, value, oldValue });

        // Trigger visual update
        this.updateVisualState();
    }

    /**
     * Get a property value.
     * @param {string} key 
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Virtual method: Handle state changes. Override in subclasses.
     */
    onStateChange(key, value, oldValue) {
        // e.g. if (key === 'width') resizeMesh();
    }


    // --- 2. Event System ---

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data = {}) {
        if (this.events[event]) {
            this.events[event].forEach(cb => cb(data, this));
        }

        // Integrity check for Legacy Callbacks
        if (event === 'click' && this.onClickCallback) this.onClickCallback(this);
        if (event === 'hover' && this.onHoverCallback) this.onHoverCallback(this);
        if (event === 'hover-leave' && this.onHoverLeaveCallback) this.onHoverLeaveCallback(this);
        if (event === 'dblclick' && this.onDoubleClickCallback) this.onDoubleClickCallback(this);
    }


    // --- 3. Serialization ---

    toJSON() {
        return {
            id: this.controlId,
            type: this.constructor.name,
            position: this.group.position.toArray(),
            rotation: this.group.rotation.toArray(),
            scale: this.group.scale.toArray(),
            state: { ...this.state } // Copy state
        };
    }

    fromJSON(data) {
        if (data.position) this.group.position.fromArray(data.position);
        if (data.rotation) this.group.rotation.fromArray(data.rotation);
        if (data.scale) this.group.scale.fromArray(data.scale);

        // Merge state
        if (data.state) {
            Object.keys(data.state).forEach(key => {
                this.set(key, data.state[key]);
            });
        }
    }

    create() {
        // Override in subclasses
        // Should create mesh and add to this.group
    }

    setupEventListeners() {
        // Mouse events
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onMouseClick(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Touch events for mobile
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    getMousePosition(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
    }

    checkIntersection(camera, event) {
        const canvas = event.target?.closest('canvas') || document.querySelector('canvas');
        if (!canvas || !camera) return null;

        const mousePos = this.getMousePosition(event, canvas);
        const mouse = new THREE.Vector2(mousePos.x, mousePos.y);
        this.raycaster.setFromCamera(mouse, camera);

        // Check intersection with control's meshes
        const intersects = this.raycaster.intersectObjects(this.group.children, true);
        if (intersects.length > 0) {
            const intersection = intersects[0];
            // Check if it's a mode button
            if (intersection.object.userData.isModeButton) {
                return { ...intersection, isModeButton: true };
            }
            return intersection;
        }
        return null;
    }

    onMouseMove(event) {
        if (!this.isEnabled || !this.camera) return;

        const intersect = this.checkIntersection(this.camera, event);
        if (intersect) {
            if (!this.isHovered) {
                this.isHovered = true;
                this.onHover();
            }
        } else {
            if (this.isHovered) {
                this.isHovered = false;
                this.onHoverLeave();
            }
        }
    }

    onMouseClick(event) {
        if (!this.isEnabled || !this.camera) return;

        const intersect = this.checkIntersection(this.camera, event);
        if (intersect) {
            // Check for double-click
            const currentTime = Date.now();
            const timeSinceLastClick = currentTime - this.lastClickTime;

            if (timeSinceLastClick < this.doubleClickDelay && this.lastClickTime > 0) {
                // Double-click detected - cancel pending single click
                if (this.clickTimeout) {
                    clearTimeout(this.clickTimeout);
                    this.clickTimeout = null;
                }
                this.handleDoubleClick();
                this.lastClickTime = 0; // Reset to prevent triple-click
            } else {
                // Schedule single click with delay to allow double-click detection
                this.lastClickTime = currentTime;
                if (this.clickTimeout) {
                    clearTimeout(this.clickTimeout);
                }
                this.clickTimeout = setTimeout(() => {
                    this.handleClick();
                    this.clickTimeout = null;
                }, this.doubleClickDelay);
            }
        }
    }

    handleDoubleClick() {
        this.emit('dblclick', { type: 'dblclick' });
        this.onDoubleClick();
    }

    onDoubleClick() {
        // Override in subclasses or handle default behavior
        // Default: focus camera on this object
        if (this.scene && this.camera) {
            this.focusCamera();
        }
    }

    /**
     * Focus camera on this control, showing its front side centered in view
     */
    focusCamera() {
        if (!this.camera || !this.scene) return;

        // Calculate bounding box of the control
        const box = new THREE.Box3().setFromObject(this.group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Calculate distance needed to fit object in view
        // Use the largest dimension to ensure object fits comfortably
        const maxDim = Math.max(size.x, size.y, size.z);

        // Calculate distance based on camera FOV and object size
        // Formula: distance = (objectSize / 2) / tan(FOV / 2) * padding
        const fov = this.camera.fov * (Math.PI / 180); // Convert to radians
        const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.5; // 1.5x padding for comfortable view

        // Ensure minimum distance
        const minDistance = Math.max(distance, maxDim * 2);

        // Calculate camera position in front of object
        // Front is typically negative Z direction in world space
        // Position camera slightly above center for better viewing angle
        const cameraOffset = new THREE.Vector3(0, size.y * 0.2, minDistance);
        const targetPosition = center.clone().add(cameraOffset);

        // Animate camera to focus position
        this.animateCameraToFocus(targetPosition, center);
    }

    /**
     * Animate camera smoothly to focus position
     */
    animateCameraToFocus(targetPosition, lookAt) {
        if (!this.camera || !this.scene) return;

        const startPosition = this.camera.position.clone();
        const startTarget = ControlRegistry.orbitControls
            ? ControlRegistry.orbitControls.target.clone()
            : lookAt.clone();

        const duration = 1000; // milliseconds
        const startTime = Date.now();

        // Get OrbitControls reference for smooth animation
        const orbitControls = ControlRegistry.orbitControls;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out cubic)
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            // Interpolate camera position
            this.camera.position.lerpVectors(startPosition, targetPosition, eased);

            // Update OrbitControls target (where camera looks)
            if (orbitControls) {
                orbitControls.target.lerpVectors(startTarget, lookAt, eased);
                orbitControls.update();
            } else {
                // Fallback: use lookAt directly
                this.camera.lookAt(lookAt);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure final position is exact
                this.camera.position.copy(targetPosition);
                if (orbitControls) {
                    orbitControls.target.copy(lookAt);
                    orbitControls.update();
                } else {
                    this.camera.lookAt(lookAt);
                }
            }
        };

        animate();
    }

    onMouseDown(event) {
        if (!this.isEnabled || !this.camera) return;

        const intersect = this.checkIntersection(this.camera, event);
        if (intersect) {
            this.isPressed = true;
            this.onPress();
        }
    }

    onMouseUp(event) {
        if (this.isPressed) {
            this.isPressed = false;
            this.onRelease();
        }
    }

    onTouchStart(event) {
        if (!this.isEnabled) return;
        event.preventDefault();
        const touch = event.touches[0];
        const syntheticEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: event.target
        };
        this.onMouseDown(syntheticEvent);
    }

    onTouchEnd(event) {
        event.preventDefault();
        this.onMouseUp(event);
    }

    handleClick() {
        this.emit('click', { type: 'click' });
        this.onClick();
    }

    onClick() {
        // Override in subclasses
    }

    onPress() {
        // Override in subclasses
    }

    onRelease() {
        // Override in subclasses
    }

    onHover() {
        this.emit('hover', { type: 'hover' });
        // Show tooltip on hover
        if (this.tooltipConfig) {
            this.updateTooltipVisibility(true);
        }
    }

    onHoverLeave() {
        this.emit('hover-leave', { type: 'hover-leave' });
        // Hide tooltip when hover leaves
        if (this.tooltipConfig) {
            this.updateTooltipVisibility(false);
        }
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.updateVisualState();
    }

    updateVisualState() {
        // Override in subclasses to update visual appearance
        // Update tooltip and label positions
        this.updateTooltipAndLabelPositions();
    }

    /**
     * Setup tooltip and label HTML overlays
     */
    setupTooltipAndLabel() {
        // Delay creation to ensure HTMLOverlay is initialized
        setTimeout(() => {
            const htmlOverlay = getHTMLOverlay();

            // Create tooltip if configured
            if (this.tooltipConfig && this.tooltipConfig.content) {
                this.createTooltip();
            }

            // Create label if configured
            if (this.labelConfig && this.labelConfig.content) {
                this.createLabel();
            }
        }, 100);
    }

    /**
     * Create tooltip HTML overlay
     */
    createTooltip() {
        if (!this.tooltipConfig || !this.tooltipConfig.content) return;

        const htmlOverlay = getHTMLOverlay();
        const htmlContent = MarkdownRenderer.render(this.tooltipConfig.content);

        // Create tooltip element
        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'spatial-tooltip';
        tooltipElement.innerHTML = htmlContent;

        // Calculate position offset
        const offset = this.tooltipConfig.offset || this.getDefaultTooltipOffset();
        const position = new THREE.Vector3(
            this.group.position.x + offset[0],
            this.group.position.y + offset[1],
            this.group.position.z + offset[2]
        );

        // Create overlay - hidden by default, shown on hover
        // Use small scale for CSS3DRenderer (HTML elements need tiny scale in 3D space)
        htmlOverlay.createOverlay(this.tooltipOverlayId, tooltipElement, position, {
            className: 'spatial-tooltip',
            scale: [0.01, 0.01, 0.01], // Scale down for CSS3DRenderer
            styles: {
                opacity: '0',
                transition: 'opacity 0.2s ease-in-out'
            }
        });

        // Hidden by default
        htmlOverlay.setVisible(this.tooltipOverlayId, false);
    }

    /**
     * Create label HTML overlay
     */
    createLabel() {
        if (!this.labelConfig || !this.labelConfig.content) return;

        const htmlOverlay = getHTMLOverlay();
        const htmlContent = MarkdownRenderer.render(this.labelConfig.content);

        // Create label element
        const labelElement = document.createElement('div');
        labelElement.className = 'spatial-label';
        labelElement.innerHTML = htmlContent;

        // Calculate position offset
        const offset = this.labelConfig.offset || this.getDefaultLabelOffset();
        const position = new THREE.Vector3(
            this.group.position.x + offset[0],
            this.group.position.y + offset[1],
            this.group.position.z + offset[2]
        );

        // Create overlay
        htmlOverlay.createOverlay(this.labelOverlayId, labelElement, position, {
            className: 'spatial-label',
            scale: [0.01, 0.01, 0.01] // Scale down for CSS3DRenderer
        });
    }

    /**
     * Get default tooltip offset based on position option
     */
    getDefaultTooltipOffset() {
        const position = this.tooltipConfig.position || 'top';
        const defaultOffsets = {
            'top': [0, 1.0, 0],
            'bottom': [0, -1.0, 0],
            'left': [-1.5, 0, 0],
            'right': [1.5, 0, 0]
        };
        return defaultOffsets[position] || defaultOffsets['top'];
    }

    /**
     * Get default label offset based on position option
     */
    getDefaultLabelOffset() {
        const position = this.labelConfig.position || 'bottom';
        const defaultOffsets = {
            'top': [0, 1.2, 0],
            'bottom': [0, -1.2, 0]
        };
        return defaultOffsets[position] || defaultOffsets['bottom'];
    }

    /**
     * Update tooltip visibility
     */
    updateTooltipVisibility(visible) {
        if (!this.tooltipConfig) return;

        const htmlOverlay = getHTMLOverlay();
        htmlOverlay.setVisible(this.tooltipOverlayId, visible);

        // Animate opacity
        const overlay = htmlOverlay.objects.get(this.tooltipOverlayId);
        if (overlay && overlay.element) {
            overlay.element.style.opacity = visible ? '1' : '0';
        }
    }

    /**
     * Update tooltip and label positions based on control position
     */
    updateTooltipAndLabelPositions() {
        const htmlOverlay = getHTMLOverlay();

        // Update tooltip position
        if (this.tooltipConfig) {
            const offset = this.tooltipConfig.offset || this.getDefaultTooltipOffset();
            // Add small Z-offset to ensure tooltip appears in front of control
            const tooltipZOffset = 0.1; // Small offset to bring tooltip forward
            const position = new THREE.Vector3(
                this.group.position.x + offset[0],
                this.group.position.y + offset[1],
                this.group.position.z + offset[2] + tooltipZOffset
            );
            htmlOverlay.updatePosition(this.tooltipOverlayId, position);
        }

        // Update label position
        if (this.labelConfig) {
            const offset = this.labelConfig.offset || this.getDefaultLabelOffset();
            const position = new THREE.Vector3(
                this.group.position.x + offset[0],
                this.group.position.y + offset[1],
                this.group.position.z + offset[2]
            );
            htmlOverlay.updatePosition(this.labelOverlayId, position);
        }
    }

    /**
     * Update label using OpenAI API
     * @param {string} apiKey - OpenAI API key
     * @param {string} prompt - Prompt for label generation
     * @param {Function} onSuccess - Callback when label is generated successfully
     * @param {Function} onError - Callback when error occurs
     * @returns {Promise<string>} - Generated label text
     */
    async updateLabelWithAI(apiKey, prompt, onSuccess, onError) {
        if (!apiKey) {
            const error = new Error('OpenAI API key is required');
            if (onError) onError(error);
            throw error;
        }

        if (!prompt) {
            const error = new Error('Prompt is required');
            if (onError) onError(error);
            throw error;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    max_tokens: 20,
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            const newLabel = data.choices[0].message.content.trim();

            // Update label if this control has one
            if (this.label !== undefined) {
                this.label = newLabel;
            }

            // Update label config if it exists
            if (this.labelConfig) {
                this.labelConfig.content = newLabel;
                // Recreate label overlay with new content
                const htmlOverlay = getHTMLOverlay();
                htmlOverlay.removeOverlay(this.labelOverlayId);
                this.createLabel();
            }

            if (onSuccess) onSuccess(newLabel);
            return newLabel;

        } catch (error) {
            console.error('OpenAI API error:', error);
            if (onError) onError(error);
            throw error;
        }
    }

    dispose() {
        // Remove from scene
        if (this.group.parent) {
            this.scene.remove(this.group);
        }

        // Dispose geometries and materials
        this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material?.dispose();
                }
            }
        });

        // Remove event listeners
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onMouseClick);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchend', this.onTouchEnd);
    }

    getGroup() {
        return this.group;
    }

    getPosition() {
        return this.group.position.clone();
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
        // Update TransformControls position if it exists
        if (this.transformControls) {
            this.transformControls.update();
        }
        // Update tooltip and label positions
        this.updateTooltipAndLabelPositions();
    }

    setupTransformControls() {
        if (!this.renderer) return;

        // Create TransformControls for translation (XYZ handles)
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.setMode('translate'); // Translation mode (XYZ arrows)
        this.transformControls.setSpace('world'); // World space coordinates
        this.transformControls.attach(this.group);
        this.transformControls.visible = false; // Hidden by default

        // Store event handlers for proper cleanup
        this.onDraggingChanged = (event) => {
            const orbitControls = ControlRegistry.orbitControls;
            if (orbitControls) {
                orbitControls.enabled = !event.value;
            }
        };

        this.onTransformChange = () => {
            // Position is automatically updated via attach()
            // This event fires during dragging
        };

        // Coordinate with OrbitControls: disable OrbitControls when dragging TransformControls
        this.transformControls.addEventListener('dragging-changed', this.onDraggingChanged);

        // Update position when TransformControls changes
        this.transformControls.addEventListener('change', this.onTransformChange);

        // Add to scene
        this.scene.add(this.transformControls);
    }

    showTransformControls() {
        if (this.transformControls) {
            // Re-attach to group if needed
            if (!this.transformControls.object) {
                this.transformControls.attach(this.group);
            }
            this.transformControls.visible = true;
            this.transformControls.update();
        }
    }

    hideTransformControls() {
        if (this.transformControls) {
            this.transformControls.visible = false;
            // Detach from group to prevent any update issues
            this.transformControls.detach();
            // Ensure OrbitControls is re-enabled when hiding TransformControls
            const orbitControls = ControlRegistry.orbitControls;
            if (orbitControls) {
                orbitControls.enabled = true;
            }
        }
    }

    setEditMode(enabled) {
        this.isEditMode = enabled;
        if (enabled) {
            this.showTransformControls();
        } else {
            this.hideTransformControls();
        }
    }

    updateTransformControls() {
        if (this.transformControls && this.transformControls.visible) {
            this.transformControls.update();
        }
    }

    dispose() {
        // Remove tooltip and label overlays
        const htmlOverlay = getHTMLOverlay();
        if (this.tooltipConfig) {
            htmlOverlay.removeOverlay(this.tooltipOverlayId);
        }
        if (this.labelConfig) {
            htmlOverlay.removeOverlay(this.labelOverlayId);
        }

        // Remove TransformControls and clean up event listeners
        if (this.transformControls) {
            // Remove event listeners before disposing
            if (this.onDraggingChanged) {
                this.transformControls.removeEventListener('dragging-changed', this.onDraggingChanged);
            }
            if (this.onTransformChange) {
                this.transformControls.removeEventListener('change', this.onTransformChange);
            }

            // Detach and remove from scene
            this.transformControls.detach();
            this.scene.remove(this.transformControls);
            this.transformControls.dispose();
            this.transformControls = null;

            // Ensure OrbitControls is re-enabled
            const orbitControls = ControlRegistry.orbitControls;
            if (orbitControls) {
                orbitControls.enabled = true;
            }
        }

        // Unregister from ControlRegistry
        ControlRegistry.unregister(this);

        // Remove from scene
        if (this.group.parent) {
            this.scene.remove(this.group);
        }

        // Dispose geometries and materials
        this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material?.dispose();
                }
            }
        });

        // Clear click timeout
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }

        // Remove event listeners
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onMouseClick);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchend', this.onTouchEnd);
    }
}
