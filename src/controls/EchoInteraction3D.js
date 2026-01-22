import * as THREE from 'three';

/**
 * EchoInteraction3D - Ripple-based object discovery system
 * 
 * A minimalist interaction paradigm where users tap empty space to send out
 * a visual pulse that reveals nearby interactive objects by highlighting them.
 * 
 * Features:
 * - Expanding ripple effect from tap point
 * - Shader-based object highlighting
 * - Distance-based reveal timing
 * - Audio feedback (optional)
 * 
 * @class EchoInteraction3D
 */
export class EchoInteraction3D {
    /**
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {THREE.Camera} camera - The Three.js camera
     * @param {Object} config - Configuration object
     * @param {number} config.pulseSpeed - Speed of pulse expansion (units/sec, default: 10)
     * @param {number} config.maxRadius - Maximum pulse radius (default: 50)
     * @param {number} config.pulseWidth - Width of the pulse ring (default: 2.0)
     * @param {boolean} config.audioEnabled - Enable audio feedback (default: false)
     * @param {THREE.Color} config.glowColor - Color of the glow effect (default: cyan)
     */
    constructor(scene, camera, config = {}) {
        this.scene = scene;
        this.camera = camera;

        // Pulse parameters
        this.pulseCenter = new THREE.Vector3();
        this.pulseRadius = 0;
        this.pulseSpeed = config.pulseSpeed || 10;
        this.maxRadius = config.maxRadius || 50;
        this.pulseWidth = config.pulseWidth || 2.0;
        this.isPulsing = false;

        // Visual settings
        this.glowColor = new THREE.Color(config.glowColor !== undefined ? config.glowColor : 0x00ffff);
        this.glowIntensity = config.glowIntensity || 0.8;

        // Audio settings
        this.audioEnabled = config.audioEnabled || false;
        if (this.audioEnabled) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Tracked objects
        this.interactiveObjects = [];

        // Global uniforms (shared across all enhanced materials)
        this.globalUniforms = {
            uPulseCenter: { value: new THREE.Vector3() },
            uPulseRadius: { value: 0 },
            uPulseWidth: { value: this.pulseWidth },
            uGlowColor: { value: this.glowColor },
            uGlowIntensity: { value: this.glowIntensity }
        };

        // Raycaster for tap detection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Bind event handlers
        this.onMouseDown = this.handleMouseDown.bind(this);
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for tap/click detection
     */
    setupEventListeners() {
        const canvas = this.scene.userData.renderer?.domElement;
        if (canvas) {
            canvas.addEventListener('mousedown', this.onMouseDown);
        }
    }

    /**
     * Handle mouse down event to trigger pulse
     */
    handleMouseDown(event) {
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();

        // Convert to normalized device coordinates
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast to find 3D position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Use camera forward direction to place pulse in front of camera
        const distance = 10; // Distance from camera
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        const pulsePosition = new THREE.Vector3();
        pulsePosition.copy(this.camera.position).add(direction.multiplyScalar(distance));

        // Trigger the pulse
        this.triggerPulse(pulsePosition);
    }

    /**
     * Trigger a pulse from a specific position
     * @param {THREE.Vector3} position - Origin point of the pulse
     */
    triggerPulse(position) {
        if (this.isPulsing) return; // Prevent overlapping pulses

        this.pulseCenter.copy(position);
        this.pulseRadius = 0;
        this.isPulsing = true;

        // Update global uniforms
        this.globalUniforms.uPulseCenter.value.copy(position);

        // Play audio feedback
        if (this.audioEnabled) {
            this.playPulseSound();
        }

        // Animate the pulse
        this.animatePulse();
    }

    /**
     * Animate the pulse expansion
     */
    animatePulse() {
        const startTime = Date.now();
        const duration = (this.maxRadius / this.pulseSpeed) * 1000;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            this.pulseRadius = eased * this.maxRadius;

            // Update global uniform
            this.globalUniforms.uPulseRadius.value = this.pulseRadius;

            // Check for object hits
            this.checkObjectHits();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isPulsing = false;
                this.pulseRadius = 0;
                this.globalUniforms.uPulseRadius.value = 0;
            }
        };

        animate();
    }

    /**
     * Check which objects are being hit by the pulse
     */
    checkObjectHits() {
        this.interactiveObjects.forEach(obj => {
            const distance = obj.mesh.position.distanceTo(this.pulseCenter);
            const pulseEdge = this.pulseRadius;

            // Check if pulse is passing through this object
            if (Math.abs(distance - pulseEdge) < this.pulseWidth) {
                if (!obj.wasHit) {
                    obj.wasHit = true;
                    this.onObjectRevealed(obj);
                }
            }

            // Reset hit flag when pulse passes
            if (distance < pulseEdge - this.pulseWidth) {
                obj.wasHit = false;
            }
        });
    }

    /**
     * Called when an object is revealed by the pulse
     * @param {Object} obj - The revealed object data
     */
    onObjectRevealed(obj) {
        // Trigger callback if provided
        if (obj.metadata.onReveal) {
            obj.metadata.onReveal(obj.mesh, obj.metadata);
        }

        // Play haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    /**
     * Register an object to be revealed by pulses
     * @param {THREE.Mesh} mesh - The mesh to register
     * @param {Object} metadata - Additional data about the object
     * @param {Function} metadata.onReveal - Callback when object is revealed
     */
    registerObject(mesh, metadata = {}) {
        // Store original material
        const originalMaterial = mesh.material;

        // Create enhanced material with pulse shader
        const enhancedMaterial = this.createPulseMaterial(originalMaterial);
        mesh.material = enhancedMaterial;

        // Add to tracked objects
        this.interactiveObjects.push({
            mesh,
            metadata,
            originalMaterial,
            enhancedMaterial,
            wasHit: false
        });
    }

    /**
     * Create a material with pulse effect shader
     * @param {THREE.Material} baseMaterial - Original material to enhance
     * @returns {THREE.ShaderMaterial} Enhanced material with pulse effect
     */
    createPulseMaterial(baseMaterial) {
        // Create shader material that incorporates pulse effect
        const material = new THREE.ShaderMaterial({
            uniforms: {
                ...this.globalUniforms,
                uBaseColor: { value: baseMaterial.color || new THREE.Color(0x808080) },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                varying vec3 vNormal;

                void main() {
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uPulseCenter;
                uniform float uPulseRadius;
                uniform float uPulseWidth;
                uniform vec3 uGlowColor;
                uniform float uGlowIntensity;
                uniform vec3 uBaseColor;

                varying vec3 vWorldPosition;
                varying vec3 vNormal;

                void main() {
                    // Calculate distance to pulse center
                    float distanceToCenter = distance(vWorldPosition, uPulseCenter);
                    float distanceToPulse = abs(distanceToCenter - uPulseRadius);

                    // Glow when pulse is nearby
                    float pulseEffect = 1.0 - smoothstep(0.0, uPulseWidth, distanceToPulse);
                    pulseEffect = pow(pulseEffect, 2.0); // Sharpen the effect

                    // Base color with simple lighting
                    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                    float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.5 + 0.5;
                    vec3 baseColor = uBaseColor * diffuse;

                    // Mix with glow color
                    vec3 finalColor = mix(baseColor, uGlowColor, pulseEffect * uGlowIntensity);
                    
                    // Add emissive glow
                    float emissive = pulseEffect * 2.0;
                    finalColor += uGlowColor * emissive;

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            transparent: baseMaterial.transparent || false,
            side: baseMaterial.side || THREE.FrontSide
        });

        return material;
    }

    /**
     * Play audio feedback for pulse
     */
    playPulseSound() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Descending tone
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);

        // Fade out
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * Update animation loop (call this in your render loop)
     */
    update() {
        // Update time uniform for any time-based effects
        this.interactiveObjects.forEach(obj => {
            if (obj.enhancedMaterial.uniforms.uTime) {
                obj.enhancedMaterial.uniforms.uTime.value = Date.now() * 0.001;
            }
        });
    }

    /**
     * Unregister an object
     * @param {THREE.Mesh} mesh - The mesh to unregister
     */
    unregisterObject(mesh) {
        const index = this.interactiveObjects.findIndex(obj => obj.mesh === mesh);
        if (index !== -1) {
            const obj = this.interactiveObjects[index];
            // Restore original material
            mesh.material = obj.originalMaterial;
            this.interactiveObjects.splice(index, 1);
        }
    }

    /**
     * Clean up resources
     */
    dispose() {
        // Remove event listeners
        const canvas = this.scene.userData.renderer?.domElement;
        if (canvas) {
            canvas.removeEventListener('mousedown', this.onMouseDown);
        }

        // Restore all materials
        this.interactiveObjects.forEach(obj => {
            obj.mesh.material = obj.originalMaterial;
            obj.enhancedMaterial.dispose();
        });

        this.interactiveObjects = [];

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
