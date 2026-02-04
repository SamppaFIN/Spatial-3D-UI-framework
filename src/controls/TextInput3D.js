import { BaseControl3D } from '../core/BaseControl3D.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Text } from 'troika-three-text';

export class TextInput3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null
        });

        // --- Configuration ---
        this.value = config.value || '';
        this.placeholder = config.placeholder || 'Enter text...';
        this.type = config.type || 'text';

        // Dimensions
        this.width = config.width || 3.0;
        this.height = config.height || 0.6; // Slightly taller default
        this.depth = config.fieldDepth || 0.1; // Deep field effect
        this.bevelRadius = config.bevelRadius || 0.02;

        // Visual Properties
        this.fontSize = config.fontSize || 0.25;
        this.padding = config.padding || 0.2;
        this.textColor = config.textColor || 0xffffff;
        this.placeholderColor = config.placeholderColor || 0x8888aa;

        // Glassmorphism (Background)
        this.backgroundColor = config.backgroundColor || 0x222233;
        this.backgroundOpacity = config.backgroundOpacity !== undefined ? config.backgroundOpacity : 0.6;
        this.borderColor = config.borderColor || 0x667eea;

        // Interactive state colors
        this.focusColor = config.focusColor || 0x00d4ff;
        this.hoverScale = 1.02;
        this.focusScale = config.focusScale || 1.05;

        // Cursor / Caret
        this.cursorBlinkRate = config.cursorBlinkRate || 500; // ms
        this.cursorColor = config.cursorColor || 0xffffff;
        this.cursorWidth = 0.02;

        // Internal State
        this.isFocused = false;
        this._cursorVisible = false;
        this._lastBlinkTime = 0;
        this._textWidth = 0;

        // Callbacks
        this.onChangeCallback = config.onChange || null;
        this.onSubmitCallback = config.onSubmit || null;

        // Hidden Input for capturing actual typing
        this.domInput = this.createHiddenInput();

        // Re-create geometry on init
        if (this.group) {
            this.group.clear(); // Clear existing children
            this.create();
        }
    }

    createHiddenInput() {
        const input = document.createElement('input');
        input.type = 'text';
        input.style.position = 'absolute';
        input.style.opacity = '0';
        input.style.width = '1px';
        input.style.height = '1px';
        input.style.pointerEvents = 'none';

        // Sync Logic
        input.addEventListener('input', (e) => {
            if (!this.isFocused) return;
            this.setValue(e.target.value);
        });

        input.addEventListener('blur', () => {
            if (this.isFocused) this.blur();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (this.onSubmitCallback) this.onSubmitCallback(this, this.value);
                this.blur();
            }
        });

        document.body.appendChild(input);
        return input;
    }

    create() {
        // 1. Background (Rounded Glass)
        this.createBackground();

        // 2. Text Mesh (SDF)
        this.createText();

        // 3. Caret / Cursor
        this.createCaret();

        // 4. Hit Target (Invisible plane for raycasting)
        this.createHitTarget();
    }

    createBackground() {
        const geometry = new RoundedBoxGeometry(this.width, this.height, this.depth, 4, this.bevelRadius);

        const material = new THREE.MeshPhysicalMaterial({
            color: this.backgroundColor,
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.2, // Glass effect
            thickness: 0.5,
            transparent: true,
            opacity: this.backgroundOpacity,
            emissive: this.borderColor,
            emissiveIntensity: 0.1,
            side: THREE.DoubleSide
        });

        this.backgroundMesh = new THREE.Mesh(geometry, material);
        this.backgroundMesh.castShadow = true;
        this.backgroundMesh.receiveShadow = true;
        this.group.add(this.backgroundMesh);
    }

    createText() {
        this.textMesh = new Text();
        // Fix: Apply masking logic immediately
        const displayText = (this.type === 'password' && this.value)
            ? '*'.repeat(this.value.length)
            : (this.value || this.placeholder);

        this.textMesh.text = displayText;
        this.textMesh.fontSize = this.fontSize;
        this.textMesh.color = this.value ? this.textColor : this.placeholderColor;
        this.textMesh.anchorX = 'left';
        this.textMesh.anchorY = 'middle';

        // Position: slightly in front of background, left-aligned with padding
        const xPos = -this.width / 2 + this.padding;
        this.textMesh.position.set(xPos, 0, this.depth / 2 + 0.01);

        // Troika sync
        this.textMesh.sync();
        this.group.add(this.textMesh);

        // Update width listener
        this.textMesh.addEventListener('synccomplete', () => {
            // We need bounding box to know where to put caret
            if (this.textMesh.geometry.boundingBox) {
                this._textWidth = this.textMesh.geometry.boundingBox.max.x - this.textMesh.geometry.boundingBox.min.x;
                // Update caret position after sync to ensure it moves
                this.updateCaretPosition();
            }
        });
    }

    // New: Support for 3D Material Styles
    setStyle(styleName) {
        if (!this.backgroundMesh) return;

        const mat = this.backgroundMesh.material;

        switch (styleName) {
            case 'post-it':
                mat.color.setHex(0xffeb3b); // Yellow
                mat.transmission = 0; // Solid
                mat.opacity = 1;
                mat.roughness = 0.9;
                mat.metalness = 0;
                mat.emissive.setHex(0x000000);
                this.textColor = 0x333333; // Dark text
                this.placeholderColor = 0x666666;
                this.updateText();
                break;

            case 'dialog':
                mat.color.setHex(0xffffff); // White
                mat.transmission = 0;
                mat.opacity = 1;
                mat.roughness = 0.2;
                mat.metalness = 0.1;
                mat.emissive.setHex(0xcccccc);
                this.textColor = 0x000000;
                this.placeholderColor = 0x888888;
                this.updateText();
                break;

            case 'board':
                mat.color.setHex(0x8d6e63); // Wood/Cork
                mat.transmission = 0;
                mat.opacity = 1;
                mat.roughness = 1.0;
                this.textColor = 0xffffff;
                this.placeholderColor = 0xdddddd;
                this.updateText();
                break;

            case 'cyber':
            case 'message':
                mat.color.setHex(0x222233);
                mat.transmission = 0.6;
                mat.opacity = 0.8;
                mat.roughness = 0.2;
                mat.metalness = 0.8;
                this.textColor = 0x00d4ff;
                this.placeholderColor = 0x445566;
                this.updateText();
                break;

            default: // Default Glass
                mat.color.setHex(this.config.backgroundColor || 0x222233);
                mat.transmission = 0.2;
                mat.opacity = this.config.backgroundOpacity || 0.6;
                mat.roughness = 0.2;
                mat.metalness = 0.1;
                this.textColor = this.config.textColor || 0xffffff;
                this.placeholderColor = this.config.placeholderColor || 0x8888aa;
                this.updateText();
                break;
        }
    }

    updateText() {
        if (this.textMesh) {
            const displayText = (this.type === 'password' && this.value)
                ? '*'.repeat(this.value.length)
                : (this.value || this.placeholder);
            this.textMesh.text = displayText;
            this.textMesh.color = this.value ? this.textColor : this.placeholderColor;
            this.textMesh.sync();
        }
    }

    createCaret() {
        const geometry = new THREE.BoxGeometry(this.cursorWidth, this.fontSize * 1.2, 0.01);
        const material = new THREE.MeshBasicMaterial({
            color: this.cursorColor,
            transparent: true,
            opacity: 0, // Hidden by default
            depthTest: false // Render on top
        });

        this.caretMesh = new THREE.Mesh(geometry, material);
        // Initial position: start of line
        this.updateCaretPosition();
        this.group.add(this.caretMesh);
    }

    createHitTarget() {
        // Invisible plane slightly larger than background for easier clicking
        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(geometry, material);
        hitMesh.position.z = this.depth / 2 + 0.02;

        // Attach user data for interaction raycasting
        hitMesh.userData.isInteractive = true;
        hitMesh.userData.control = this;

        this.group.add(hitMesh);
    }

    updateCaretPosition() {
        if (!this.caretMesh) return;

        // If placeholder is showing, caret is at start
        // If value is present, caret is after text
        const xStart = -this.width / 2 + this.padding;

        if (!this.value) {
            this.caretMesh.position.set(xStart, 0, this.depth / 2 + 0.02);
            return;
        }

        // We estimate caret pos based on text width
        // For accurate caret, we assume cursor is always at end for this simple v1
        // Troika gives us the total width of the text block

        // Wait for sync or use current valid bounds
        // Note: _textWidth is updated in 'synccomplete'

        // Fallback or use measured width
        // A simple approximation if sync hasn't happened: measure chars? No, wait for bounding box.
        // We'll update caret in the update loop or sync callback.
    }

    // --- Interaction ---

    onClick() {
        if (!this.isEnabled) return;
        this.focus();
    }

    focus() {
        if (this.isFocused) return;
        this.isFocused = true;

        // Activate DOM input
        this.domInput.value = this.value;
        this.domInput.focus();

        // Visual updates
        this.updateBorderState();
    }

    blur() {
        if (!this.isFocused) return;
        this.isFocused = false;

        // Deactivate DOM input
        this.domInput.blur();

        // Visual updates
        this.updateBorderState();
        if (this.caretMesh) this.caretMesh.material.opacity = 0;
    }

    setValue(text) {
        if (this.value === text) return;
        this.value = text;

        // Update Text Mesh
        if (this.textMesh) {
            this.textMesh.text = this.value || this.placeholder;
            this.textMesh.color = this.value ? this.textColor : this.placeholderColor;
            this.textMesh.sync();
        }

        this.updateVisualState();
        if (this.onChangeCallback) {
            this.onChangeCallback(this, this.value);
        }
    }

    getValue() {
        return this.value;
    }

    // --- Animation & Update ---

    update() {
        super.update(); // Handles interactions basics

        // Animate Focus Scale
        const targetScale = this.isFocused ? this.focusScale : (this.isHovered ? this.hoverScale : 1.0);
        this.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // Animate Caret
        if (this.isFocused && this.caretMesh) {
            const now = Date.now();
            if (now - this._lastBlinkTime > this.cursorBlinkRate) {
                this._cursorVisible = !this._cursorVisible;
                this.caretMesh.material.opacity = this._cursorVisible ? 1 : 0;
                this._lastBlinkTime = now;
            }

            // Update Caret Position based on text bounds
            // We do this here to catch updates after text sync
            const xStart = -this.width / 2 + this.padding;
            if (this.value && this.textMesh.geometry.boundingBox) {
                const bounds = this.textMesh.geometry.boundingBox;
                // Text is anchored left, so bounds.max.x is strictly the width relative to anchor
                const w = bounds.max.x - bounds.min.x;
                // But wait, Troika anchorX='left' means local origin is at left.
                // So bounds.max.x should be the width.
                this.caretMesh.position.x = xStart + w + 0.02; // small gap
            } else {
                this.caretMesh.position.x = xStart;
            }
        }
    }

    updateBorderState() {
        if (!this.backgroundMesh) return;

        const mat = this.backgroundMesh.material;
        if (this.isFocused) {
            mat.emissive.setHex(this.focusColor);
            mat.emissiveIntensity = 0.5;
            mat.opacity = Math.min(1, this.backgroundOpacity + 0.2);
        } else {
            mat.emissive.setHex(this.borderColor);
            mat.emissiveIntensity = 0.1;
            mat.opacity = this.backgroundOpacity;
        }
    }

    dispose() {
        if (this.domInput && this.domInput.parentElement) {
            this.domInput.parentElement.removeChild(this.domInput);
        }
        if (this.textMesh) this.textMesh.dispose();
        if (this.backgroundMesh) {
            this.backgroundMesh.geometry.dispose();
            this.backgroundMesh.material.dispose();
        }
        super.dispose();
    }
}
