import { BaseControl3D } from '../core/BaseControl3D.js';
import * as THREE from 'three';

export class Toggle3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null,
            onClick: config.onClick || null
        });

        // Toggle-specific properties
        this.label = config.label || 'Toggle';
        this.width = config.width || 2.0;
        this.height = config.height || 0.6;
        this.depth = config.depth || 0.15;

        // Mode system: 3 different shapes
        this.mode = config.mode || 0;
        this.modes = ['box', 'sphere', 'sacred'];

        // NEW: Multi-state support
        this.states = config.states || ['off', 'on']; // Can have 2+ states
        this.currentStateIndex = config.currentStateIndex || (config.isOn ? 1 : 0);
        this.stateColors = config.stateColors || [0x666666, 0x3366ff]; // Colors for each state
        this.stateIcons = config.stateIcons || null; // Optional icons for each state

        // Backward compatibility
        this.isOn = this.currentStateIndex > 0;
        this.onColor = config.onColor || this.stateColors[1] || 0x3366ff;
        this.offColor = config.offColor || this.stateColors[0] || 0x666666;
        this.currentColor = this.stateColors[this.currentStateIndex] || this.offColor;

        // NEW: Track shape options
        this.trackShape = config.trackShape || 'pill'; // 'pill', 'circle', 'square', 'box'

        // NEW: Animation presets
        this.animationPreset = config.animationPreset || 'slide'; // 'slide', 'bounce', 'fade'
        this.bounceIntensity = config.bounceIntensity || 0.2;

        // Animation properties
        this.animationSpeed = 0.15;
        this.targetScale = 1.0;
        this.currentScale = 1.0;
        this.hoverScale = 1.05;

        // Toggle handle animation
        this.handlePosition = this.isOn ? 1.0 : -1.0;
        this.targetHandlePosition = this.handlePosition;
        this.handleVelocity = 0; // For bounce animation

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
        this.createHandle();
        if (this.stateIcons) {
            this.createStateIcon();
        }
        this.createLabel();
        this.createGlow();
        this.updateVisualState();
    }

    createTrack() {
        if (this.trackMesh) {
            this.group.remove(this.trackMesh);
            this.trackMesh.geometry.dispose();
            this.trackMesh.material.dispose();
        }

        let geometry;

        // Create geometry based on trackShape
        switch (this.trackShape) {
            case 'pill':
                // Rounded pill shape (capsule)
                geometry = new THREE.CapsuleGeometry(this.height / 2, this.width - this.height, 16, 8);
                // Rotate to horizontal
                geometry.rotateZ(Math.PI / 2);
                break;
            case 'circle':
                // Circular track
                geometry = new THREE.TorusGeometry(this.height / 2, this.height / 4, 16, 32);
                break;
            case 'square':
                // Square with sharp corners
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth, 1, 1, 1);
                break;
            case 'box':
            default:
                // Default box shape
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth, 1, 1, 1);
                break;
        }

        const material = new THREE.MeshStandardMaterial({
            map: this.gradientTexture,
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.4,
            emissive: this.currentColor,
            emissiveIntensity: 0.2,
            emissiveMap: this.gradientTexture
        });

        this.trackMesh = new THREE.Mesh(geometry, material);
        this.trackMesh.castShadow = true;
        this.trackMesh.receiveShadow = true;
        this.trackMesh.userData.isInteractive = true;
        this.trackMesh.userData.control = this;

        this.group.add(this.trackMesh);
    }

    createHandle() {
        if (this.handleMesh) {
            this.group.remove(this.handleMesh);
            this.handleMesh.geometry.dispose();
            this.handleMesh.material.dispose();
        }

        const handleWidth = this.height * 0.8;
        const handleHeight = this.height * 0.8;
        const handleDepth = this.depth * 1.2;

        let handleGeometry;
        switch (this.modes[this.mode]) {
            case 'box':
                handleGeometry = new THREE.BoxGeometry(handleWidth, handleHeight, handleDepth, 1, 1, 1);
                break;
            case 'sphere':
                handleGeometry = new THREE.SphereGeometry(handleHeight / 2, 16, 16);
                break;
            case 'sacred':
                handleGeometry = new THREE.OctahedronGeometry(handleHeight / 2, 0);
                break;
        }

        const handleColor = this.isOn ? 0xffffff : 0xcccccc;
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: handleColor,
            metalness: 0.6,
            roughness: 0.2,
            emissive: this.isOn ? 0x88aaff : 0x444444,
            emissiveIntensity: this.isOn ? 0.5 : 0.1
        });

        this.handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
        this.handleMesh.castShadow = true;
        this.handleMesh.receiveShadow = true;
        this.handleMesh.userData.isInteractive = true;
        this.handleMesh.userData.control = this;

        const trackWidth = this.width;
        const handleX = (this.handlePosition * (trackWidth / 2 - handleWidth / 2));
        this.handleMesh.position.set(handleX, 0, this.depth / 2 + handleDepth / 2);

        this.group.add(this.handleMesh);
    }

    createGradientTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const resolution = 512;
        canvas.width = resolution;
        canvas.height = resolution;

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const scaledResolution = resolution * pixelRatio;
        canvas.width = scaledResolution;
        canvas.height = scaledResolution;
        ctx.scale(pixelRatio, pixelRatio);

        const gradient = ctx.createLinearGradient(0, 0, resolution, resolution);
        const color1 = this.isOn ? '#3366ff' : '#666666';
        const color2 = this.isOn ? '#0044cc' : '#444444';
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, color1);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, resolution, resolution);

        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 15; i++) {
            ctx.fillRect(
                Math.random() * resolution,
                Math.random() * resolution,
                2, 2
            );
        }

        this.gradientTexture = new THREE.CanvasTexture(canvas);
        this.gradientTexture.needsUpdate = true;
        this.gradientTexture.minFilter = THREE.LinearMipmapLinearFilter;
        this.gradientTexture.magFilter = THREE.LinearFilter;
        this.gradientTexture.generateMipmaps = true;
    }

    createLabel() {
        if (this.labelMesh) {
            this.group.remove(this.labelMesh);
            this.labelMesh.geometry.dispose();
            this.labelMesh.material.dispose();
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const resolution = 512;
        canvas.width = resolution;
        canvas.height = resolution;

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const scaledResolution = resolution * pixelRatio;
        canvas.width = scaledResolution;
        canvas.height = scaledResolution;
        ctx.scale(pixelRatio, pixelRatio);

        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${resolution * 0.1}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, resolution / 2, resolution / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;

        const labelGeometry = new THREE.PlaneGeometry(
            this.width * 0.6,
            this.height * 0.3
        );
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });

        this.labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
        this.labelMesh.position.set(0, -this.height / 2 - 0.2, this.depth / 2 + 0.02);
        this.labelMesh.renderOrder = 10;

        this.group.add(this.labelMesh);
    }

    createStateIcon() {
        // Remove old icon if exists
        if (this.stateIconMesh) {
            this.group.remove(this.stateIconMesh);
            this.stateIconMesh.geometry.dispose();
            this.stateIconMesh.material.dispose();
        }

        if (!this.stateIcons || !this.stateIcons[this.currentStateIndex]) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const resolution = 128;
        canvas.width = resolution;
        canvas.height = resolution;

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const scaledResolution = resolution * pixelRatio;
        canvas.width = scaledResolution;
        canvas.height = scaledResolution;
        ctx.scale(pixelRatio, pixelRatio);

        // Draw current state icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${resolution * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.stateIcons[this.currentStateIndex], resolution / 2, resolution / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;

        const iconSize = this.height * 0.5;
        const iconGeometry = new THREE.PlaneGeometry(iconSize, iconSize);
        const iconMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });

        this.stateIconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
        this.stateIconMesh.position.set(0, 0, this.depth / 2 + 0.03);
        this.stateIconMesh.renderOrder = 15;
        this.group.add(this.stateIconMesh);
    }

    createGlow() {
        if (this.glowMesh) {
            this.group.remove(this.glowMesh);
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }

        if (!this.trackMesh || !this.trackMesh.geometry) return;

        const glowGeometry = this.trackMesh.geometry.clone();
        glowGeometry.scale(1.1, 1.1, 1.1);

        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.currentColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });

        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.renderOrder = -1;
        this.group.add(this.glowMesh);
    }

    toggle() {
        // Cycle to next state
        this.currentStateIndex = (this.currentStateIndex + 1) % this.states.length;
        this.isOn = this.currentStateIndex > 0; // Backward compatibility

        // Update color for current state
        this.currentColor = this.stateColors[this.currentStateIndex] || this.offColor;
        this.targetHandlePosition = (this.currentStateIndex / (this.states.length - 1)) * 2 - 1;

        // For bounce animation, add initial velocity
        if (this.animationPreset === 'bounce') {
            const direction = this.targetHandlePosition > this.handlePosition ? 1 : -1;
            this.handleVelocity = direction * this.bounceIntensity;
        }

        this.createGradientTexture();
        if (this.trackMesh && this.trackMesh.material) {
            this.trackMesh.material.map = this.gradientTexture;
            this.trackMesh.material.emissive.setHex(this.currentColor);
            this.trackMesh.material.emissiveIntensity = this.isOn ? 0.4 : 0.2;
        }

        if (this.handleMesh && this.handleMesh.material) {
            const handleColor = this.isOn ? 0xffffff : 0xcccccc;
            this.handleMesh.material.color.setHex(handleColor);
            this.handleMesh.material.emissive.setHex(this.isOn ? 0x88aaff : 0x444444);
            this.handleMesh.material.emissiveIntensity = this.isOn ? 0.5 : 0.1;
        }

        if (this.glowMesh && this.glowMesh.material) {
            this.glowMesh.material.color.setHex(this.currentColor);
        }

        // Update state icon if using icons
        if (this.stateIcons) {
            this.createStateIcon();
        }
    }

    onMouseClick(event) {
        if (!this.isEnabled || !this.camera) return;

        const intersect = this.checkIntersection(this.camera, event);
        if (intersect) {
            // Toggle immediately without double-click delay
            this.toggle();
        }
    }

    onClick() {
        this.toggle();
    }

    onPress() {
        this.targetScale = 0.95;
    }

    onRelease() {
        this.targetScale = 1.0;
    }

    updateVisualState() {
        this.currentScale += (this.targetScale - this.currentScale) * this.animationSpeed;
        this.group.scale.setScalar(this.currentScale);

        this.handlePosition += (this.targetHandlePosition - this.handlePosition) * this.animationSpeed;
        if (this.handleMesh) {
            const trackWidth = this.width;
            const handleWidth = this.height * 0.8;
            const handleX = (this.handlePosition * (trackWidth / 2 - handleWidth / 2));
            this.handleMesh.position.x = handleX;
        }

        if (this.trackMesh && this.trackMesh.material) {
            if (this.isPressed) {
                this.trackMesh.material.emissiveIntensity = 0.6;
                if (this.glowMesh) {
                    this.glowMesh.material.opacity = 0.4;
                }
            } else if (this.isHovered) {
                this.trackMesh.material.emissiveIntensity = this.isOn ? 0.5 : 0.3;
                this.targetScale = this.hoverScale;
                if (this.glowMesh) {
                    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.2;
                    this.glowMesh.material.opacity = pulse;
                }
            } else {
                this.trackMesh.material.emissiveIntensity = this.isOn ? 0.4 : 0.2;
                this.targetScale = 1.0;
                if (this.glowMesh) {
                    this.glowMesh.material.opacity = 0.15;
                }
            }
        }
    }

    onHover() {
        super.onHover();
        this.updateVisualState();
    }

    onHoverLeave() {
        super.onHoverLeave();
        this.updateVisualState();
    }

    update() {
        this.updateVisualState();
    }

    setLabel(newLabel) {
        this.label = newLabel;
        this.createLabel();
    }

    setMode(modeIndex) {
        if (modeIndex >= 0 && modeIndex < this.modes.length) {
            this.mode = modeIndex;
            this.createGradientTexture();
            this.createTrack();
            this.createHandle();
            this.createGlow();
        }
    }

    setIsOn(isOn) {
        if (this.isOn !== isOn) {
            this.toggle();
        }
    }
}
