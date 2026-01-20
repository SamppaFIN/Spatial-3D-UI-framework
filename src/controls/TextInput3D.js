import { BaseControl3D } from '../core/BaseControl3D.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';
import * as THREE from 'three';

export class TextInput3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null
        });

        // TextInput-specific properties
        this.value = config.value || '';
        this.placeholder = config.placeholder || 'Enter text...';
        this.width = config.width || 3.0;
        this.height = config.height || 0.8;
        this.depth = config.depth || 0.1;

        // Mode system: 3 different shapes
        this.mode = config.mode || 0;
        this.modes = ['box', 'sphere', 'sacred'];

        // Colors
        this.backgroundColor = config.backgroundColor || 0x2a2a3e;
        this.borderColor = config.borderColor || 0x5a5a8e;
        this.focusColor = config.focusColor || 0x6a6aae;

        // State
        this.isFocused = false;
        this.onChangeCallback = config.onChange || null;
        this.onSubmitCallback = config.onSubmit || null;

        // NEW: Validation
        this.validation = config.validation || null; // Regex or function
        this.isValid = true;
        this.errorMessage = config.errorMessage || 'Invalid input';

        // NEW: Character counter
        this.maxLength = config.maxLength || null;
        this.showCounter = config.showCounter || false;
        this.counterMesh = null;

        // NEW: Password toggle
        this.type = config.type || 'text'; // 'text', 'password', 'email', 'number'
        this.showPassword = false;
        this.toggleButtonMesh = null;

        // NEW: Input masking
        this.mask = config.mask || null; // e.g., '(###) ###-####' for phone

        // NEW: Style presets
        this.style = config.style || 'default'; // default, post-it, dialog, idea, board, message
        this.customClass = config.customClass || '';

        // Animation properties
        this.animationSpeed = 0.15;
        this.targetScale = 1.0;
        this.currentScale = 1.0;
        this.hoverScale = 1.05;
        this.focusScale = 1.08;

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

        this.createInputPanel();
        this.createInputField();
        this.updateVisualState();

        // Setup keyboard input after input field is created
        this.setupKeyboardInput();
    }

    createInputPanel() {
        if (this.panelMesh) {
            this.group.remove(this.panelMesh);
            this.panelMesh.geometry.dispose();
            this.panelMesh.material.dispose();
        }

        let geometry;
        switch (this.modes[this.mode]) {
            case 'box':
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
                break;
            case 'sphere':
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
                break;
            case 'sacred':
                const size = Math.min(this.width, this.height) / 2;
                geometry = new THREE.OctahedronGeometry(size, 0);
                break;
        }

        const material = new THREE.MeshStandardMaterial({
            color: this.backgroundColor,
            metalness: 0.3,
            roughness: 0.7,
            emissive: this.borderColor,
            emissiveIntensity: 0.1
        });

        this.panelMesh = new THREE.Mesh(geometry, material);
        this.panelMesh.castShadow = true;
        this.panelMesh.receiveShadow = true;
        this.group.add(this.panelMesh);
    }

    getOverlayPosition() {
        // Calculate world position of the front face
        // Takes into account group position, rotation, and SCALE
        const zOffset = this.depth / 2 + 0.02; // Small offset from face
        const localPos = new THREE.Vector3(0, 0, zOffset);

        // Convert to world space
        this.group.updateMatrixWorld(true);
        return localPos.applyMatrix4(this.group.matrixWorld);
    }

    createInputField() {
        const htmlOverlay = getHTMLOverlay();

        // Create input element
        const inputElement = document.createElement('input');
        inputElement.type = this.type;
        inputElement.className = `spatial-text-input ${this.style} ${this.customClass}`;
        inputElement.value = this.value;
        inputElement.placeholder = this.placeholder;
        // Adjust size relative to 3D dimensions
        inputElement.style.width = `${this.width * 100}px`;
        inputElement.style.height = `${this.height * 60}px`;
        inputElement.style.padding = '10px';
        inputElement.style.fontSize = '24px'; // Larger font for better visibility
        inputElement.style.border = 'none';
        inputElement.style.background = 'transparent';
        inputElement.style.color = '#ffffff';
        inputElement.style.outline = 'none';

        if (this.showPassword && this.type === 'password') {
            inputElement.type = 'text';
        }

        // Event listeners
        inputElement.addEventListener('input', (e) => {
            this.value = e.target.value;
            if (this.onChangeCallback) {
                this.onChangeCallback(this, this.value);
            }
        });

        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.onSubmitCallback) {
                this.onSubmitCallback(this, this.value);
            }
        });

        inputElement.addEventListener('focus', () => {
            this.isFocused = true;
            this.targetScale = this.focusScale;
            this.updateBorderColor();
        });

        inputElement.addEventListener('blur', () => {
            this.isFocused = false;
            this.targetScale = 1.0;
            this.updateBorderColor();
        });

        // Calculate correct position
        const position = this.getOverlayPosition();
        const rotation = this.group.rotation;

        // Create overlay
        htmlOverlay.createOverlay(`textinput_${this.controlId}`, inputElement, position, {
            className: `spatial-text-input ${this.style} ${this.customClass}`,
            scale: [0.01, 0.01, 0.01],
            rotation: [rotation.x, rotation.y, rotation.z],
            styles: {
                opacity: '1'
            }
        });

        htmlOverlay.setVisible(`textinput_${this.controlId}`, true);
        this.inputElement = inputElement;
    }

    setStyle(newStyle) {
        this.style = newStyle;
        const htmlOverlay = getHTMLOverlay();
        htmlOverlay.updateClass(`textinput_${this.controlId}`, `spatial-text-input ${this.style} ${this.customClass}`);
    }

    setupKeyboardInput() {
        // Override onClick to focus input
        const originalOnClick = this.onClickCallback;
        this.onClickCallback = () => {
            if (this.inputElement) {
                this.inputElement.focus();
            }
            if (originalOnClick) {
                originalOnClick(this);
            }
        };
    }

    updateBorderColor() {
        if (this.panelMesh && this.panelMesh.material) {
            const color = this.isFocused ? this.focusColor : this.borderColor;
            this.panelMesh.material.emissive.setHex(color);
            this.panelMesh.material.emissiveIntensity = this.isFocused ? 0.2 : 0.1;
        }
    }

    setValue(newValue) {
        this.value = newValue;
        if (this.inputElement) {
            this.inputElement.value = newValue;
        }
    }

    getValue() {
        return this.value;
    }

    focus() {
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }

    blur() {
        if (this.inputElement) {
            this.inputElement.blur();
        }
    }

    onHover() {
        super.onHover();
        if (!this.isFocused) {
            this.targetScale = this.hoverScale;
        }
    }

    onHoverLeave() {
        super.onHoverLeave();
        if (!this.isFocused) {
            this.targetScale = 1.0;
        }
    }

    update() {
        // Smooth scale animation
        this.currentScale += (this.targetScale - this.currentScale) * this.animationSpeed;
        if (Math.abs(this.targetScale - this.currentScale) > 0.001) {
            this.group.scale.setScalar(this.currentScale);
        }

        // Always update visual state to sync overlay with potentially moving/scaling parent
        this.updateVisualState();
    }

    updateVisualState() {
        super.updateVisualState();

        // precise update of overlay transform
        const htmlOverlay = getHTMLOverlay();

        // We must update matrix world to get accurate world position including scale
        this.group.updateMatrixWorld();

        const position = this.getOverlayPosition();
        const rotation = new THREE.Euler().setFromQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
        const scale = this.group.getWorldScale(new THREE.Vector3()).multiplyScalar(0.01);

        htmlOverlay.updateTransform(`textinput_${this.controlId}`, position, rotation, scale);
    }

    dispose() {
        // Remove HTML overlay
        const htmlOverlay = getHTMLOverlay();
        htmlOverlay.removeOverlay(`textinput_${this.controlId}`);
        super.dispose();
    }
}
