import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';
import { ControlRegistry } from '../core/ControlRegistry.js';

/**
 * HapticHorizon3D - Proximity-activated laser-line interface
 * 
 * A minimalist horizontal line that exists at wrist-level or scene bottom.
 * Invisible until activated by cursor proximity. Responds like a musical
 * instrument - distance controls intensity and audio frequency.
 * 
 * Features:
 * - Proximity-based activation
 * - Dynamic thickness and glow
 * - Audio feedback (frequency changes with position)
 * - Smooth animations
 * 
 * @extends BaseControl3D
 */
export class HapticHorizon3D extends BaseControl3D {
    /**
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {THREE.Camera} camera - The Three.js camera
     * @param {Array<number>} position - [x, y, z] position
     * @param {Object} config - Configuration object
     * @param {number} config.lineLength - Length of the line (default: 20)
     * @param {number} config.segments - Number of segments (default: 100)
     * @param {number} config.baseThickness - Base thickness when inactive (default: 0.02)
     * @param {number} config.maxThickness - Maximum thickness when active (default: 0.3)
     * @param {number} config.activationDistance - Distance to activate (default: 5)
     * @param {boolean} config.audioEnabled - Enable audio feedback (default: false)
     * @param {number} config.minFrequency - Minimum audio frequency (default: 200)
     * @param {number} config.maxFrequency - Maximum audio frequency (default: 2000)
     */
    constructor(scene, camera, position, config = {}) {
        // Initialize properties before super() call
        const tempConfig = {
            lineLength: config.lineLength || 20,
            segments: config.segments || 100,
            baseThickness: config.baseThickness || 0.02,
            maxThickness: config.maxThickness || 0.3,
            activationDistance: config.activationDistance || 5,
            audioEnabled: config.audioEnabled || false,
            minFrequency: config.minFrequency || 200,
            maxFrequency: config.maxFrequency || 2000
        };

        // Prevent create() from running during super()
        const _deferInit = true;

        super(scene, camera, position, config);

        // Assign properties after super()
        this.lineLength = tempConfig.lineLength;
        this.segments = tempConfig.segments;
        this.baseThickness = tempConfig.baseThickness;
        this.maxThickness = tempConfig.maxThickness;
        this.activationDistance = tempConfig.activationDistance;
        this.audioEnabled = tempConfig.audioEnabled;
        this.minFrequency = tempConfig.minFrequency;
        this.maxFrequency = tempConfig.maxFrequency;

        // Line mesh and material
        this.lineMesh = null;
        this.lineMaterial = null;

        // Cursor tracking
        this.cursorPosition = new THREE.Vector3();
        this.closestPointOnLine = new THREE.Vector3();
        this.currentProximity = 0; // 0 = far, 1 = very close

        // Audio context
        if (this.audioEnabled) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.oscillator = null;
            this.gainNode = null;
        }

        // Animation
        this.animatedThickness = this.baseThickness;
        this.animatedGlow = 0;

        // Now create the visual elements
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

        // Create the horizontal line
        this.createLine();

        this.scene.add(this.group);
    }

    /**
     * Create the horizontal laser line
     */
    createLine() {
        // Create a horizontal curve
        const points = [];
        const halfLength = this.lineLength / 2;

        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            const x = (t - 0.5) * this.lineLength;
            points.push(new THREE.Vector3(x, 0, 0));
        }

        const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0);

        // Create tube geometry
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            this.segments,
            this.baseThickness,
            8,
            false
        );

        // Create shader material with proximity-based glow
        this.lineMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uCursorPosition: { value: new THREE.Vector3() },
                uActivationDistance: { value: this.activationDistance },
                uProximity: { value: 0 },
                uBaseColor: { value: new THREE.Color(0x00ffff) },
                uGlowColor: { value: new THREE.Color(0x00ffff) },
                uTime: { value: 0 }
            },
            vertexShader: `
                uniform vec3 uCursorPosition;
                uniform float uActivationDistance;
                varying float vDistanceToCursor;
                varying vec3 vNormal;

                void main() {
                    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    vDistanceToCursor = distance(worldPos, uCursorPosition);
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uActivationDistance;
                uniform float uProximity;
                uniform vec3 uBaseColor;
                uniform vec3 uGlowColor;
                uniform float uTime;
                varying float vDistanceToCursor;
                varying vec3 vNormal;

                void main() {
                    // Calculate proximity effect
                    float proximity = 1.0 - clamp(vDistanceToCursor / uActivationDistance, 0.0, 1.0);
                    proximity = pow(proximity, 2.0); // Sharpen the falloff

                    // Base color with glow
                    vec3 color = mix(uBaseColor * 0.1, uGlowColor, proximity);
                    
                    // Add emissive glow
                    float emissive = proximity * 2.0;
                    color += uGlowColor * emissive;

                    // Subtle pulse animation
                    float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
                    color *= pulse;

                    // Fade based on overall proximity
                    float alpha = 0.05 + proximity * 0.95;

                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.lineMesh = new THREE.Mesh(tubeGeometry, this.lineMaterial);
        this.lineMesh.userData.isHapticHorizon = true;
        this.group.add(this.lineMesh);
    }

    /**
     * Update cursor position for proximity detection
     * @param {THREE.Vector3} worldPosition - Cursor position in world space
     */
    updateCursorPosition(worldPosition) {
        this.cursorPosition.copy(worldPosition);

        // Find closest point on line
        const lineStart = new THREE.Vector3(-this.lineLength / 2, 0, 0);
        const lineEnd = new THREE.Vector3(this.lineLength / 2, 0, 0);
        lineStart.applyMatrix4(this.group.matrixWorld);
        lineEnd.applyMatrix4(this.group.matrixWorld);

        // Project cursor onto line
        const lineDir = new THREE.Vector3().subVectors(lineEnd, lineStart).normalize();
        const cursorToStart = new THREE.Vector3().subVectors(worldPosition, lineStart);
        const projection = cursorToStart.dot(lineDir);
        const clampedProjection = Math.max(0, Math.min(this.lineLength, projection));

        this.closestPointOnLine.copy(lineStart).add(lineDir.multiplyScalar(clampedProjection));

        // Calculate proximity (0 = far, 1 = very close)
        const distance = worldPosition.distanceTo(this.closestPointOnLine);
        this.currentProximity = 1 - Math.min(distance / this.activationDistance, 1);

        // Update shader uniforms
        if (this.lineMaterial) {
            this.lineMaterial.uniforms.uCursorPosition.value.copy(worldPosition);
            this.lineMaterial.uniforms.uProximity.value = this.currentProximity;
        }

        // Update audio
        if (this.audioEnabled && this.currentProximity > 0.1) {
            this.updateAudio();
        } else if (this.oscillator) {
            this.stopAudio();
        }
    }

    /**
     * Update audio feedback based on cursor position
     */
    updateAudio() {
        if (!this.audioContext) return;

        // Calculate position along line (0 = left, 1 = right)
        const lineStart = new THREE.Vector3(-this.lineLength / 2, 0, 0);
        lineStart.applyMatrix4(this.group.matrixWorld);
        const distanceAlongLine = this.closestPointOnLine.distanceTo(lineStart);
        const normalizedPosition = distanceAlongLine / this.lineLength;

        // Map position to frequency
        const frequency = this.minFrequency + (this.maxFrequency - this.minFrequency) * normalizedPosition;

        // Map proximity to volume
        const volume = this.currentProximity * 0.3; // Max volume 0.3

        if (!this.oscillator) {
            // Create oscillator and gain node
            this.oscillator = this.audioContext.createOscillator();
            this.gainNode = this.audioContext.createGain();

            this.oscillator.type = 'sine';
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            this.oscillator.start();
        }

        // Update frequency and volume
        this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }

    /**
     * Stop audio playback
     */
    stopAudio() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
            this.gainNode = null;
        }
    }

    /**
     * Update animation loop
     */
    update() {
        if (!this.lineMaterial) return;

        // Update time uniform for pulse animation
        this.lineMaterial.uniforms.uTime.value = Date.now() * 0.001;

        // Smooth thickness animation
        const targetThickness = this.baseThickness + (this.maxThickness - this.baseThickness) * this.currentProximity;
        this.animatedThickness += (targetThickness - this.animatedThickness) * 0.1;

        // Update line scale based on proximity
        if (this.lineMesh) {
            const scale = 1 + this.currentProximity * 2;
            this.lineMesh.scale.set(1, scale, scale);
        }
    }

    /**
     * Enable or disable audio
     * @param {boolean} enabled - Whether audio should be enabled
     */
    setAudioEnabled(enabled) {
        this.audioEnabled = enabled;

        if (!enabled && this.oscillator) {
            this.stopAudio();
        }

        if (enabled && !this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        ControlRegistry.unregister(this);

        // Stop audio
        this.stopAudio();
        if (this.audioContext) {
            this.audioContext.close();
        }

        // Dispose geometries and materials
        if (this.lineMesh) {
            this.lineMesh.geometry.dispose();
            this.lineMaterial.dispose();
        }

        this.scene.remove(this.group);
    }
}
