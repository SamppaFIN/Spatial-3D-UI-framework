import * as THREE from 'three';
import { PortalCard3D } from './PortalCard3D.js';

/**
 * AIPortal3D - A dimensional gateway that transforms the entire environment.
 * Features a custom "Event Horizon" shader and traversal detection for world swapping.
 */
export class AIPortal3D extends PortalCard3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        // Configuration
        this.portalRadius = config.portalRadius || 2.0;
        this.distortionIntensity = config.distortionIntensity || 1.0;
        this.isTraversed = false;

        // Callbacks
        this.onTraverse = config.onTraverse || null;

        // Map content to label if provided
        if (config.content && !this.labelConfig) {
            this.labelConfig = {
                content: `### ${config.content}`,
                position: 'bottom',
                offset: [0, -1.5, 0] // Below portal
            };
        }

        this.setupEventHorizon();
    }

    setupEventHorizon() {
        // Event Horizon Shader
        // Creates a shimmering, distorted ring around the portal
        this.horizonMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uDistance: { value: 1.0 },
                uColor: { value: new THREE.Color(this.config.color || 0x00ccff) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                void main() {
                    vUv = uv;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uDistance;
                uniform vec3 uColor;
                varying vec2 vUv;
                
                void main() {
                    vec2 centeredUv = vUv - 0.5;
                    float dist = length(centeredUv);
                    
                    // Ripple effect
                    float ripple = sin(dist * 20.0 - uTime * 5.0) * 0.5 + 0.5;
                    
                    // Edge intensity based on camera distance
                    float edge = smoothstep(0.45, 0.5, dist);
                    float glow = 1.0 - smoothstep(0.3, 0.5, dist);
                    
                    // Noise-like shimmering
                    float shimmer = sin(centeredUv.x * 50.0 + uTime) * cos(centeredUv.y * 50.0 + uTime);
                    
                    vec3 finalColor = uColor + (glow * 0.5) + (shimmer * 0.1);
                    float alpha = edge * (1.0 / (uDistance + 0.1)) * ripple;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        // Add the horizon ring to the portal
        const ringGeo = new THREE.PlaneGeometry(this.width * 1.5, this.height * 1.5);
        this.horizonMesh = new THREE.Mesh(ringGeo, this.horizonMaterial);
        this.horizonMesh.position.z = -0.05; // Slightly behind the portal screen
        this.group.add(this.horizonMesh);
    }

    update() {
        super.update(); // Keep the PortalCard3D parallax logic

        if (!this.camera || !this.isEnabled) return;

        // 1. Update Shader Uniforms
        const distToCam = this.group.position.distanceTo(this.camera.position);
        this.horizonMaterial.uniforms.uTime.value += 0.01;
        this.horizonMaterial.uniforms.uDistance.value = distToCam;

        // 2. Traversal Detection
        // Check if camera cross the portal plane
        this.checkTraversal();
    }

    checkTraversal() {
        // Simple Z-crossing check relative to portal local space
        const localCamPos = this.group.worldToLocal(this.camera.position.clone());

        // If cam Z goes from positive to negative (or vice-versa)
        // We look for the moment it "slices" through
        const crossingThreshold = 0.5;

        if (Math.abs(localCamPos.z) < crossingThreshold && Math.abs(localCamPos.x) < this.width / 2 && Math.abs(localCamPos.y) < this.height / 2) {
            if (!this.isTraversed) {
                this.handleTraversal();
                this.isTraversed = true;
            }
        } else {
            // Reset state when far enough away to re-trigger
            if (Math.abs(localCamPos.z) > crossingThreshold * 2) {
                this.isTraversed = false;
            }
        }
    }

    handleTraversal() {
        console.log("次元上昇 (Dimensional Shift Triggered)");
        if (this.onTraverse) {
            this.onTraverse();
        }
    }
}
