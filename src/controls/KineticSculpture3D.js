import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';
import { ControlRegistry } from '../core/ControlRegistry.js';

/**
 * KineticSculpture3D - Gesture-controlled morphing sphere
 * 
 * A single amorphous 3D object that represents application state.
 * Responds to gestures:
 * - Squeeze (scale down) → increase volume/value
 * - Rotate → scrub through time
 * - Stretch (pull apart) → open settings
 * 
 * Features:
 * - Simplex noise-based morphing
 * - Gesture recognition
 * - Living animation
 * - State mapping
 * 
 * @extends BaseControl3D
 */
export class KineticSculpture3D extends BaseControl3D {
    /**
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {THREE.Camera} camera - The Three.js camera
     * @param {Array<number>} position - [x, y, z] position
     * @param {Object} config - Configuration object
     * @param {number} config.radius - Sphere radius (default: 2)
     * @param {number} config.detail - Icosahedron detail level (default: 2)
     * @param {number} config.noiseStrength - Noise deformation strength (default: 0.3)
     * @param {Function} config.onVolumeChange - Callback when volume changes
     * @param {Function} config.onTimeChange - Callback when time changes
     * @param {Function} config.onSettingsOpen - Callback when settings open
     */
    constructor(scene, camera, position, config = {}) {
        // Prevent create() from running during super()
        const _deferInit = true;

        super(scene, camera, position, config);

        // Geometry parameters
        this.radius = config.radius || 2;
        this.detail = config.detail || 2;
        this.noiseStrength = config.noiseStrength || 0.3;

        // State
        this.currentScale = 1.0;
        this.currentRotation = new THREE.Euler(0, 0, 0);
        this.stretchAmount = 0;
        this.baseScale = new THREE.Vector3(1, 1, 1);

        // Interaction
        this.isDragging = false;
        this.dragStartPosition = new THREE.Vector3();
        this.dragStartScale = 1.0;
        this.dragStartRotation = new THREE.Euler(0, 0, 0);
        this.lastGesture = 'idle';

        // Callbacks
        this.onVolumeChange = config.onVolumeChange || ((vol) => { });
        this.onTimeChange = config.onTimeChange || ((time) => { });
        this.onSettingsOpen = config.onSettingsOpen || (() => { });

        // Mesh
        this.sculptureMesh = null;
        this.sculptureMaterial = null;

        // Animation
        this.animationTime = 0;

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
     * Internal create method
     */
    _createInternal() {
        console.log('KineticSculpture3D: Creating sculpture');
        this.group = new THREE.Group();
        this.group.position.set(...this.position);

        // Create the morphing sphere
        this.createSculpture();

        this.scene.add(this.group);
    }

    /**
     * Create the kinetic sculpture with Simplex noise shader
     */
    createSculpture() {
        // Create icosahedron geometry
        const geometry = new THREE.IcosahedronGeometry(this.radius, this.detail);

        // Create shader material with Simplex noise
        this.sculptureMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uNoiseStrength: { value: this.noiseStrength },
                uBaseColor: { value: new THREE.Color(0x3080ff) },
                uGlowColor: { value: new THREE.Color(0x00ffff) },
                uGestureState: { value: 0 } // 0=idle, 1=squeeze, 2=rotate, 3=stretch
            },
            vertexShader: `
                uniform float uTime;
                uniform float uNoiseStrength;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vNoise;

                // Simplex 3D Noise -- Fixed for WebGL 1 (No Overloading)
                // Source: https://github.com/ashima/webgl-noise
                vec3 mod289_v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289_v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289_v4(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);

                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);

                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;

                    i = mod289_v3(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;

                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);

                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);

                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);

                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));

                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);

                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;

                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }

                void main() {
                    vPosition = position;
                    
                    // Add noise-based deformation
                    vec3 pos = position;
                    float noise = snoise(pos * 0.5 + uTime * 0.2);
                    vNoise = noise;
                    pos += normal * noise * uNoiseStrength;
                    
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uBaseColor;
                uniform vec3 uGlowColor;
                uniform float uGestureState;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying float vNoise;

                void main() {
                    // Fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - dot(vNormal, viewDirection), 3.0);
                    
                    // Base color with noise variation
                    vec3 color = mix(uBaseColor, uGlowColor, vNoise * 0.5 + 0.5);
                    
                    // Add fresnel glow
                    color += uGlowColor * fresnel * 0.5;
                    
                    // Gesture-based color shift
                    if (uGestureState == 1.0) {
                        // Squeeze - red tint
                        color = mix(color, vec3(1.0, 0.3, 0.3), 0.3);
                    } else if (uGestureState == 2.0) {
                        // Rotate - green tint
                        color = mix(color, vec3(0.3, 1.0, 0.3), 0.3);
                    } else if (uGestureState == 3.0) {
                        // Stretch - yellow tint
                        color = mix(color, vec3(1.0, 1.0, 0.3), 0.3);
                    }
                    
                    gl_FragColor = vec4(color, 0.9);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.sculptureMesh = new THREE.Mesh(geometry, this.sculptureMaterial);
        this.sculptureMesh.userData.isKineticSculpture = true;
        this.group.add(this.sculptureMesh);
    }

    /**
     * Start dragging interaction
     * @param {THREE.Vector3} worldPosition - Start position in world space
     */
    startDrag(worldPosition) {
        this.isDragging = true;
        this.dragStartPosition.copy(worldPosition);
        this.dragStartScale = this.currentScale;
        this.dragStartRotation.copy(this.currentRotation);
    }

    /**
     * Update drag interaction
     * @param {THREE.Vector3} worldPosition - Current position in world space
     */
    updateDrag(worldPosition) {
        if (!this.isDragging) return;

        const delta = new THREE.Vector3().subVectors(worldPosition, this.dragStartPosition);

        // Recognize gesture based on drag delta
        this.recognizeGesture(delta);
    }

    /**
     * End dragging interaction
     */
    endDrag() {
        this.isDragging = false;
        this.lastGesture = 'idle';
        this.sculptureMaterial.uniforms.uGestureState.value = 0;
    }

    /**
     * Recognize gesture from drag delta
     * @param {THREE.Vector3} delta - Drag delta vector
     */
    recognizeGesture(delta) {
        const deltaLength = delta.length();

        // Squeeze detection (drag towards center)
        if (delta.y < -0.5 && deltaLength > 0.5) {
            this.currentScale = Math.max(0.5, this.dragStartScale - deltaLength * 0.2);
            const volume = this.mapScaleToVolume(this.currentScale);
            this.onVolumeChange(volume);
            this.lastGesture = 'squeeze';
            this.sculptureMaterial.uniforms.uGestureState.value = 1;
            this.sculptureMesh.scale.setScalar(this.currentScale);
        }
        // Rotation detection (horizontal drag)
        else if (Math.abs(delta.x) > 0.5 && Math.abs(delta.y) < 0.3) {
            const rotationDelta = delta.x * 0.01;
            this.currentRotation.y = this.dragStartRotation.y + rotationDelta;
            const time = this.mapRotationToTime(this.currentRotation.y);
            this.onTimeChange(time);
            this.lastGesture = 'rotate';
            this.sculptureMaterial.uniforms.uGestureState.value = 2;
            this.sculptureMesh.rotation.copy(this.currentRotation);
        }
        // Stretch detection (drag away from center)
        else if (delta.y > 0.5 && deltaLength > 0.5) {
            this.stretchAmount = deltaLength * 0.2;
            this.currentScale = Math.min(1.5, this.dragStartScale + this.stretchAmount);

            if (this.stretchAmount > 0.5) {
                this.onSettingsOpen();
                this.lastGesture = 'stretch';
                this.sculptureMaterial.uniforms.uGestureState.value = 3;
            }

            this.sculptureMesh.scale.setScalar(this.currentScale);
        }
    }

    /**
     * Map scale to volume (0-100)
     * @param {number} scale - Current scale
     * @returns {number} Volume value
     */
    mapScaleToVolume(scale) {
        // Inverse mapping: smaller scale = higher volume
        return Math.round((1 - scale) * 100);
    }

    /**
     * Map rotation to time (0-100)
     * @param {number} rotation - Current Y rotation in radians
     * @returns {number} Time value
     */
    mapRotationToTime(rotation) {
        // Normalize rotation to 0-100
        const normalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        return Math.round((normalized / (Math.PI * 2)) * 100);
    }

    /**
     * Update animation loop
     */
    update() {
        if (!this.sculptureMaterial) return;

        // Update time uniform for living animation
        this.animationTime += 0.016; // ~60fps
        this.sculptureMaterial.uniforms.uTime.value = this.animationTime;

        // Smooth scale animation when not dragging
        if (!this.isDragging) {
            const targetScale = 1.0;
            this.currentScale += (targetScale - this.currentScale) * 0.05;
            this.sculptureMesh.scale.setScalar(this.currentScale);

            // Reset gesture state
            this.sculptureMaterial.uniforms.uGestureState.value = 0;
        }

        // Gentle idle rotation
        if (!this.isDragging && this.lastGesture === 'idle') {
            this.sculptureMesh.rotation.y += 0.005;
        }
    }

    /**
     * Get current gesture
     * @returns {string} Current gesture name
     */
    getCurrentGesture() {
        return this.lastGesture;
    }

    /**
     * Clean up resources
     */
    dispose() {
        ControlRegistry.unregister(this);

        if (this.sculptureMesh) {
            this.sculptureMesh.geometry.dispose();
            this.sculptureMaterial.dispose();
        }

        this.scene.remove(this.group);
    }
}
