import { BaseControl3D } from '../core/BaseControl3D.js';
import { ParticleSystem } from '../utils/ParticleSystem.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export class Button3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null,
            onClick: config.onClick || null
        });

        // Button-specific properties (must be after super())
        this.label = config.label || 'Button';
        this.width = config.width || 2.0;
        this.height = config.height || 0.8;
        this.depth = config.depth || 0.2;

        // Geometry options (NEW)
        this.geometryType = config.geometryType || 'box'; // box, sphere, cylinder, torus, cone, pill, hexagon, diamond, octahedron
        this.bevelRadius = config.bevelRadius || 0.15;
        this.sphereSegments = config.sphereSegments || 32;
        this.cylinderSegments = config.cylinderSegments || 32;
        this.torusTube = config.torusTube || 0.3;

        // Mode system: 3 different shapes (DEPRECATED - use geometryType instead)
        this.mode = config.mode || 0; // 0: box, 1: sphere, 2: sacred geometry
        this.modes = ['box', 'sphere', 'sacred'];

        // Colors with gradients
        this.colorRed = config.colorRed || 0xff3333;
        this.colorGreen = config.colorGreen || 0x33ff33;
        this.currentColor = this.colorRed;

        // NEW: Advanced color features
        this.color = config.color || this.colorRed; // Primary color
        this.gradient = config.gradient || null; // Array of colors for gradient
        this.gradientColors = this.gradient || [this.color, this.color];

        // NEW: Icon support
        this.icon = config.icon || null; // Emoji or text icon
        this.iconPosition = config.iconPosition || 'left'; // 'left', 'right', 'top', 'bottom', 'center'
        this.iconSize = config.iconSize || 0.4; // Relative to button height

        // NEW: Loading state
        this.loading = config.loading || false;
        this.loadingRotation = 0;

        // NEW: Effects
        this.particleEffect = config.particleEffect !== false; // Enabled by default
        this.rippleEffect = config.rippleEffect !== false; // Enabled by default
        this.pulseAnimation = config.pulseAnimation || false;
        this.pulseSpeed = config.pulseSpeed || 0.003;
        this.pulseIntensity = config.pulseIntensity || 0.1;
        this.pulseTime = 0;
        this.pulseGlow = null;

        // NEW: Sound effects
        this.soundEffect = config.soundEffect || null; // Path to sound file
        this.audioContext = null;
        this.audioBuffer = null;

        // Animation properties
        this.animationSpeed = 0.15;
        this.targetScale = 1.0;
        this.currentScale = 1.0;
        this.hoverScale = 1.08;

        // State
        this.isRed = true;
        this.particleSystems = [];
        this.ripples = []; // Active ripple effects



        // Note: create() was already called by BaseControl3D constructor, so we need to call it again
        // after initializing our properties, OR make create() defensive
        // Since BaseControl3D already called create(), we'll recreate with proper initialization
        if (this.group) {
            // Clear any partially created mesh
            while (this.group.children.length > 0) {
                this.group.remove(this.group.children[0]);
            }
            // Now create properly
            this.create();
        }
    }

    create() {


        // Early return if properties not initialized yet (called from BaseControl3D constructor)
        if (!this.modes || this.mode === undefined) {

            return; // Will be called again after initialization
        }

        // Create gradient texture first (needed for shape material)
        this.createGradientTexture();



        // Create shape based on current mode
        this.createShape();

        // Create label and icon
        if (this.icon) {
            this.createIcon();
        }
        this.createMeshLabel();

        // Create loading spinner if needed
        if (this.loading) {
            this.createLoadingSpinner();
        }


        // Create glow effect
        this.createGlow();

        // Create integrated mode switch button
        this.createModeButton();

        // Load sound effect if specified
        if (this.soundEffect) {
            this.loadSoundEffect();
        }

        // Update initial visual state
        this.updateVisualState();
    }

    createModeButton() {
        // Remove old mode button if exists
        if (this.modeButtonMesh) {
            this.group.remove(this.modeButtonMesh);
            this.modeButtonMesh.geometry.dispose();
            this.modeButtonMesh.material.dispose();
        }

        // Create small blue button integrated into the main button's edge
        // Size: about 15% of main button height, positioned at top-right corner
        const modeButtonSize = Math.min(this.width, this.height) * 0.15;
        const modeButtonDepth = this.depth * 0.8;

        // Position at top-right corner, slightly protruding
        const offsetX = this.width / 2 - modeButtonSize / 2;
        const offsetY = this.height / 2 - modeButtonSize / 2;
        const offsetZ = this.depth / 2 + modeButtonDepth / 2 + 0.01; // Slightly in front

        // Create geometry based on main button mode (but smaller)
        let modeGeometry;
        if (this.modes[this.mode] === 'sphere') {
            modeGeometry = new THREE.SphereGeometry(modeButtonSize / 2, 16, 16);
        } else {
            modeGeometry = new THREE.BoxGeometry(modeButtonSize, modeButtonSize, modeButtonDepth, 1, 1, 1);
        }

        // Create blue gradient texture for mode button
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const resolution = 256;
        canvas.width = resolution;
        canvas.height = resolution;

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const scaledResolution = resolution * pixelRatio;
        canvas.width = scaledResolution;
        canvas.height = scaledResolution;
        ctx.scale(pixelRatio, pixelRatio);

        // Blue gradient
        const gradient = ctx.createLinearGradient(0, 0, resolution, resolution);
        gradient.addColorStop(0, '#3366ff');
        gradient.addColorStop(0.5, '#0044cc');
        gradient.addColorStop(1, '#3366ff');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, resolution, resolution);

        const modeTexture = new THREE.CanvasTexture(canvas);
        modeTexture.needsUpdate = true;
        modeTexture.minFilter = THREE.LinearMipmapLinearFilter;
        modeTexture.magFilter = THREE.LinearFilter;
        modeTexture.generateMipmaps = true;

        // Blue material
        const modeMaterial = new THREE.MeshStandardMaterial({
            map: modeTexture,
            color: 0xffffff,
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0x3366ff,
            emissiveIntensity: 0.4,
            emissiveMap: modeTexture
        });

        this.modeButtonMesh = new THREE.Mesh(modeGeometry, modeMaterial);
        this.modeButtonMesh.position.set(offsetX, offsetY, offsetZ);
        this.modeButtonMesh.castShadow = true;
        this.modeButtonMesh.receiveShadow = true;
        this.modeButtonMesh.userData.isInteractive = true;
        this.modeButtonMesh.userData.isModeButton = true;
        this.modeButtonMesh.userData.control = this;

        // Add small icon/symbol on mode button (optional - can show current mode)
        this.createModeButtonIcon();

        this.group.add(this.modeButtonMesh);
    }

    createModeButtonIcon() {
        // Remove old icon if exists
        if (this.modeIconMesh) {
            this.group.remove(this.modeIconMesh);
            this.modeIconMesh.geometry.dispose();
            this.modeIconMesh.material.dispose();
        }

        // Create small icon texture showing mode indicator
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

        // Draw mode indicator (shape icon)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${resolution * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw symbol based on mode
        const symbols = ['□', '○', '◇']; // Box, Sphere, Sacred
        ctx.fillText(symbols[this.mode] || '□', resolution / 2, resolution / 2);

        const iconTexture = new THREE.CanvasTexture(canvas);
        iconTexture.needsUpdate = true;
        iconTexture.minFilter = THREE.LinearMipmapLinearFilter;
        iconTexture.magFilter = THREE.LinearFilter;
        iconTexture.generateMipmaps = true;

        const modeButtonSize = Math.min(this.width, this.height) * 0.15;
        const iconGeometry = new THREE.PlaneGeometry(modeButtonSize * 0.6, modeButtonSize * 0.6);
        const iconMaterial = new THREE.MeshBasicMaterial({
            map: iconTexture,
            transparent: true,
            alphaTest: 0.1
        });

        this.modeIconMesh = new THREE.Mesh(iconGeometry, iconMaterial);

        // Position icon on mode button (same position as mode button)
        const offsetX = this.width / 2 - modeButtonSize / 2;
        const offsetY = this.height / 2 - modeButtonSize / 2;
        const offsetZ = this.depth / 2 + this.depth * 0.8 / 2 + 0.02;

        this.modeIconMesh.position.set(offsetX, offsetY, offsetZ);
        this.modeIconMesh.renderOrder = 20; // Render on top
        this.modeIconMesh.userData.isModeButton = true; // Also mark icon as mode button for click detection

        this.group.add(this.modeIconMesh);
    }

    createShape() {
        // Remove old mesh if exists
        if (this.mesh) {
            this.group.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        let geometry;
        const type = this.geometryType || 'box';

        switch (type) {
            case 'box':
                geometry = this.createBoxGeometry();
                break;
            case 'sphere':
                geometry = this.createSphereGeometry();
                break;
            case 'cylinder':
                geometry = this.createCylinderGeometry();
                break;
            case 'torus':
                geometry = this.createTorusGeometry();
                break;
            case 'cone':
                geometry = this.createConeGeometry();
                break;
            case 'pill':
                geometry = this.createPillGeometry();
                break;
            case 'hexagon':
                geometry = this.createHexagonGeometry();
                break;
            case 'diamond':
                geometry = this.createDiamondGeometry();
                break;
            case 'octahedron':
                geometry = this.createOctahedronGeometry();
                break;
            default:
                geometry = this.createBoxGeometry();
        }

        // Ensure gradientTexture exists
        if (!this.gradientTexture) {
            this.createGradientTexture();
        }

        // Create material with gradient texture
        const material = new THREE.MeshStandardMaterial({
            map: this.gradientTexture,
            color: 0xffffff,
            metalness: 0.4,
            roughness: 0.3,
            emissive: this.currentColor || this.colorRed,
            emissiveIntensity: 0.3,
            emissiveMap: this.gradientTexture
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.isInteractive = true;
        this.mesh.userData.control = this;

        this.group.add(this.mesh);
    }

    // Geometry creation methods
    createBoxGeometry() {
        const shape = new THREE.Shape();
        const w = this.width / 2;
        const h = this.height / 2;
        const br = this.bevelRadius || 0.15;
        shape.moveTo(-w + br, -h);
        shape.lineTo(w - br, -h);
        shape.quadraticCurveTo(w, -h, w, -h + br);
        shape.lineTo(w, h - br);
        shape.quadraticCurveTo(w, h, w - br, h);
        shape.lineTo(-w + br, h);
        shape.quadraticCurveTo(-w, h, -w, h - br);
        shape.lineTo(-w, -h + br);
        shape.quadraticCurveTo(-w, -h, -w + br, -h);
        return new THREE.ExtrudeGeometry(shape, {
            depth: this.depth,
            bevelEnabled: br > 0,
            bevelThickness: br * 0.3,
            bevelSize: br * 0.3,
            bevelSegments: Math.max(1, Math.floor(br * 10))
        });
    }

    createSphereGeometry() {
        const radius = Math.min(this.width, this.height) / 2;
        const segments = this.sphereSegments || 32;
        return new THREE.SphereGeometry(radius, segments, segments);
    }

    createCylinderGeometry() {
        const segments = this.cylinderSegments || 32;
        const geo = new THREE.CylinderGeometry(
            Math.min(this.width, this.height) / 2,
            Math.min(this.width, this.height) / 2,
            this.depth * 2,
            segments
        );
        geo.rotateX(Math.PI / 2);
        return geo;
    }

    createTorusGeometry() {
        const tubeThickness = this.torusTube || 0.3;
        return new THREE.TorusGeometry(
            Math.min(this.width, this.height) / 3,
            tubeThickness,
            16,
            32
        );
    }

    createConeGeometry() {
        const geo = new THREE.ConeGeometry(
            Math.min(this.width, this.height) / 2,
            this.depth * 3,
            32
        );
        geo.rotateX(Math.PI / 2);
        return geo;
    }

    createPillGeometry() {
        const pillShape = new THREE.Shape();
        const pw = this.width / 2 - this.height / 2;
        const pr = this.height / 2;
        pillShape.absarc(pw, 0, pr, -Math.PI / 2, Math.PI / 2, false);
        pillShape.absarc(-pw, 0, pr, Math.PI / 2, Math.PI * 1.5, false);
        return new THREE.ExtrudeGeometry(pillShape, {
            depth: this.depth,
            bevelEnabled: false
        });
    }

    createHexagonGeometry() {
        const hexShape = new THREE.Shape();
        const hexRadius = Math.min(this.width, this.height) / 2;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = hexRadius * Math.cos(angle);
            const y = hexRadius * Math.sin(angle);
            if (i === 0) hexShape.moveTo(x, y);
            else hexShape.lineTo(x, y);
        }
        hexShape.closePath();
        return new THREE.ExtrudeGeometry(hexShape, {
            depth: this.depth,
            bevelEnabled: false
        });
    }

    createDiamondGeometry() {
        const geo = new THREE.OctahedronGeometry(Math.min(this.width, this.height) / 2, 0);
        geo.scale(1, 0.6, 1);
        return geo;
    }

    createOctahedronGeometry() {
        return new THREE.OctahedronGeometry(Math.min(this.width, this.height) / 2, 0);
    }

    createSacredGeometry() {
        // Create Flower of Life pattern - use octahedron as sacred geometry shape
        // This creates a more geometric, sacred pattern
        const size = Math.min(this.width, this.height) / 2;

        // Create octahedron geometry (8-sided sacred shape)
        const geometry = new THREE.OctahedronGeometry(size, 0);

        // Alternative: Create torus knot for more complex sacred geometry
        // return new THREE.TorusKnotGeometry(size * 0.6, size * 0.2, 64, 8, 2, 3);

        return geometry;
    }

    createSacredTexture() {
        // Create SVG-based sacred geometry texture
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

        // Draw Flower of Life pattern
        const centerX = resolution / 2;
        const centerY = resolution / 2;
        const radius = resolution * 0.3;

        ctx.strokeStyle = this.isRed ? '#ff3333' : '#33ff33';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;

        // Central circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 6 surrounding circles (Flower of Life)
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Add outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;

        return texture;
    }

    createGradientTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const resolution = 512;
        canvas.width = resolution;
        canvas.height = resolution;

        // High DPI scaling
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const scaledResolution = resolution * pixelRatio;
        canvas.width = scaledResolution;
        canvas.height = scaledResolution;
        ctx.scale(pixelRatio, pixelRatio);

        // Create linear gradient
        const gradient = ctx.createLinearGradient(0, 0, resolution, resolution);
        const color1 = this.isRed ? '#ff3333' : '#33ff33';
        const color2 = this.isRed ? '#cc0000' : '#00cc00';
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, color1);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, resolution, resolution);

        // Add subtle pattern overlay
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
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

    createMeshLabel() {
        // Remove old label if exists
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

        // High DPI scaling
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const scaledResolution = resolution * pixelRatio;
        canvas.width = scaledResolution;
        canvas.height = scaledResolution;
        ctx.scale(pixelRatio, pixelRatio);

        // Draw label with glow effect
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${resolution * 0.18}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, resolution / 2, resolution / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;

        const labelGeometry = new THREE.PlaneGeometry(
            this.width * 0.7,
            this.height * 0.4
        );
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });

        this.labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
        this.labelMesh.position.z = this.depth / 2 + 0.02;
        this.labelMesh.renderOrder = 10;

        this.group.add(this.labelMesh);
    }

    createIcon() {
        // Remove old icon if exists
        if (this.iconMesh) {
            this.group.remove(this.iconMesh);
            this.iconMesh.geometry.dispose();
            this.iconMesh.material.dispose();
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const resolution = 256;
        canvas.width = resolution;
        canvas.height = resolution;

        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const scaledResolution = resolution * pixelRatio;
        canvas.width = scaledResolution;
        canvas.height = scaledResolution;
        ctx.scale(pixelRatio, pixelRatio);

        // Draw icon with glow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${resolution * 0.6}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, resolution / 2, resolution / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;

        const iconSize = this.height * this.iconSize;
        const iconGeometry = new THREE.PlaneGeometry(iconSize, iconSize);
        const iconMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });

        this.iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);

        // Position based on iconPosition
        let offsetX = 0, offsetY = 0;
        switch (this.iconPosition) {
            case 'left':
                offsetX = -this.width * 0.25;
                break;
            case 'right':
                offsetX = this.width * 0.25;
                break;
            case 'top':
                offsetY = this.height * 0.25;
                break;
            case 'bottom':
                offsetY = -this.height * 0.25;
                break;
            case 'center':
            default:
                offsetX = 0;
                offsetY = 0;
        }

        this.iconMesh.position.set(offsetX, offsetY, this.depth / 2 + 0.03);
        this.iconMesh.renderOrder = 15;
        this.group.add(this.iconMesh);
    }

    createLoadingSpinner() {
        // Remove old spinner if exists
        if (this.spinnerMesh) {
            this.group.remove(this.spinnerMesh);
            this.spinnerMesh.geometry.dispose();
            this.spinnerMesh.material.dispose();
        }

        // Create spinner ring
        const spinnerSize = this.height * 0.3;
        const spinnerGeometry = new THREE.TorusGeometry(spinnerSize, spinnerSize * 0.15, 8, 24, Math.PI * 1.5);
        const spinnerMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });

        this.spinnerMesh = new THREE.Mesh(spinnerGeometry, spinnerMaterial);
        this.spinnerMesh.position.z = this.depth / 2 + 0.04;
        this.spinnerMesh.renderOrder = 20;
        this.group.add(this.spinnerMesh);
    }

    createRipple(intersectionPoint) {
        if (!this.rippleEffect) return;

        // Create expanding circle at click point
        const rippleGeometry = new THREE.RingGeometry(0.01, 0.05, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
        rippleMesh.position.copy(intersectionPoint);
        rippleMesh.position.z = this.depth / 2 + 0.05;

        this.group.add(rippleMesh);

        // Animate ripple
        const ripple = {
            mesh: rippleMesh,
            startTime: Date.now(),
            duration: 600,
            maxRadius: Math.max(this.width, this.height) * 0.6
        };

        this.ripples.push(ripple);
    }

    loadSoundEffect() {
        if (!this.soundEffect) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            fetch(this.soundEffect)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.audioBuffer = audioBuffer;
                })
                .catch(error => {
                    console.warn('Failed to load sound effect:', error);
                });
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    playSound() {
        if (!this.audioContext || !this.audioBuffer) return;

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.audioBuffer;
            source.connect(this.audioContext.destination);
            source.start(0);
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    setLoading(isLoading) {
        this.loading = isLoading;

        if (isLoading && !this.spinnerMesh) {
            this.createLoadingSpinner();
        } else if (!isLoading && this.spinnerMesh) {
            this.group.remove(this.spinnerMesh);
            this.spinnerMesh.geometry.dispose();
            this.spinnerMesh.material.dispose();
            this.spinnerMesh = null;
        }
    }

    setIcon(newIcon) {
        this.icon = newIcon;
        if (this.icon) {
            this.createIcon();
        } else if (this.iconMesh) {
            this.group.remove(this.iconMesh);
            this.iconMesh.geometry.dispose();
            this.iconMesh.material.dispose();
            this.iconMesh = null;
        }
    }

    createGlow() {
        // Remove old glow if exists
        if (this.glowMesh) {
            this.group.remove(this.glowMesh);
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }

        if (!this.mesh || !this.mesh.geometry) return;

        // Create larger mesh for glow effect
        const glowGeometry = this.mesh.geometry.clone();
        glowGeometry.scale(1.15, 1.15, 1.15);

        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.currentColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });

        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.renderOrder = -1;
        this.group.add(this.glowMesh);
    }

    switchMode() {
        this.mode = (this.mode + 1) % this.modes.length;
        // Recreate textures and shape for new mode
        this.createGradientTexture();
        this.createShape();
        this.createGlow();
        // Update mode button to match new shape
        this.createModeButton();
        console.log(`Mode switched to: ${this.modes[this.mode]}`);
    }

    onMouseClick(event) {
        if (!this.isEnabled || !this.camera) return;

        const intersect = this.checkIntersection(this.camera, event);
        if (intersect) {
            // Create ripple effect at click point
            if (intersect.point) {
                this.createRipple(intersect.point);
            }

            // Check if mode button was clicked
            if (intersect.isModeButton || (intersect.object && intersect.object.userData && intersect.object.userData.isModeButton)) {
                this.switchMode();
                return;
            }

            // Check for double-click (use parent class logic)
            const currentTime = Date.now();
            const timeSinceLastClick = currentTime - this.lastClickTime;

            if (timeSinceLastClick < this.doubleClickDelay && this.lastClickTime > 0) {
                // Double-click detected - cancel pending single click
                if (this.clickTimeout) {
                    clearTimeout(this.clickTimeout);
                    this.clickTimeout = null;
                }
                this.handleDoubleClick();
                this.lastClickTime = 0;
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

    onClick() {
        // Don't process clicks if loading
        if (this.loading) return;

        // Play sound effect
        this.playSound();

        // Toggle color
        this.isRed = !this.isRed;
        this.currentColor = this.isRed ? this.colorRed : this.colorGreen;

        // Update gradient texture
        this.createGradientTexture();
        if (this.mesh.material) {
            this.mesh.material.map = this.gradientTexture;
            this.mesh.material.emissive.setHex(this.currentColor);
            this.mesh.material.emissiveIntensity = 0.6;
        }

        // Update glow
        if (this.glowMesh) {
            this.glowMesh.material.color.setHex(this.currentColor);
        }

        // Create particle effect
        if (this.particleEffect) {
            this.createParticleEffect();
        }

        // Animate button press
        this.targetScale = 0.85;
        setTimeout(() => {
            this.targetScale = 1.0;
        }, 200);
    }

    createParticleEffect() {
        // Create burst particle effect
        const particleCount = 15;
        const colors = this.isRed ? [0xff3333, 0xff6666, 0xff9999] : [0x33ff33, 0x66ff66, 0x99ff99];

        for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = new ParticleSystem(this.scene, [
                this.group.position.x,
                this.group.position.y,
                this.group.position.z
            ], {
                count: 1,
                color: color,
                size: 0.15,
                speed: 0.08,
                lifetime: 800
            });

            this.particleSystems.push(particle);
        }
    }

    onPress() {
        this.targetScale = 0.85;
    }

    onRelease() {
        this.targetScale = 1.0;
    }

    updateVisualState() {
        // Smooth scale animation
        this.currentScale += (this.targetScale - this.currentScale) * this.animationSpeed;
        this.group.scale.setScalar(this.currentScale);

        // Update emissive intensity and glow based on state
        if (this.mesh.material) {
            if (this.isPressed) {
                this.mesh.material.emissiveIntensity = 0.9;
                if (this.glowMesh) {
                    this.glowMesh.material.opacity = 0.5;
                }
            } else if (this.isHovered) {
                this.mesh.material.emissiveIntensity = 0.7;
                this.targetScale = this.hoverScale;
                if (this.glowMesh) {
                    this.glowMesh.material.opacity = 0.4;
                    // Animate glow pulse
                    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.3;
                    this.glowMesh.material.opacity = pulse;
                }
            } else {
                this.mesh.material.emissiveIntensity = 0.3;
                this.targetScale = 1.0;
                if (this.glowMesh) {
                    this.glowMesh.material.opacity = 0.2;
                }
            }
        }

        // Update particle systems
        this.particleSystems = this.particleSystems.filter(ps => {
            if (ps.update) {
                return ps.update();
            }
            return false;
        });
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

        // Update loading spinner rotation
        if (this.loading && this.spinnerMesh) {
            this.loadingRotation += 0.05;
            this.spinnerMesh.rotation.z = this.loadingRotation;
        }

        // Update ripple effects
        this.ripples = this.ripples.filter(ripple => {
            const elapsed = Date.now() - ripple.startTime;
            const progress = elapsed / ripple.duration;

            if (progress >= 1.0) {
                this.group.remove(ripple.mesh);
                ripple.mesh.geometry.dispose();
                ripple.mesh.material.dispose();
                return false;
            }

            // Expand ripple
            const currentRadius = ripple.maxRadius * progress;
            ripple.mesh.scale.set(currentRadius * 10, currentRadius * 10, 1);
            ripple.mesh.material.opacity = 0.8 * (1 - progress);

            return true;
        });

        // Pulse animation
        if (this.pulseAnimation && this.mesh) {
            const pulse = Math.sin(Date.now() * this.pulseSpeed) * this.pulseIntensity;
            const pulseScale = 1.0 + pulse;

            if (this.glowMesh) {
                this.glowMesh.scale.set(pulseScale, pulseScale, pulseScale);
                this.glowMesh.material.opacity = 0.3 + pulse;
            }
        }
    }

    setLabel(newLabel) {
        this.label = newLabel;
        this.createMeshLabel();
    }

    setMode(modeIndex) {
        if (modeIndex >= 0 && modeIndex < this.modes.length) {
            this.mode = modeIndex;
            this.createShape();
            this.createGlow();
        }
    }
}
