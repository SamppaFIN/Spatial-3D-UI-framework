import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * HoloMap3D - Holographic Globe Visualization
 * 
 * A sci-fi style 3D globe for visualizing geospatial data.
 * Features:
 * - Holographic shader with scanlines and fresnel glow
 * - Latitude/Longitude marker system
 * - Interactive rotation and zoom
 * - "Data flow" connection arcs
 * 
 * @extends BaseControl3D
 */
export class HoloMap3D extends BaseControl3D {
    constructor(scene, camera, position, config = {}) {
        // Must allow config overrides before super
        const defaults = {
            radius: 5,
            gridColor: 0x00ffff, // Cyan
            glowColor: 0x0088ff, // Blue
            mapTexture: null, // Optional texture path
            showScanlines: true,
            autoRotate: true,
            rotationSpeed: 0.001,
            markers: []
        };

        const finalConfig = { ...defaults, ...config };

        super(scene, camera, position, finalConfig);

        this.radius = finalConfig.radius;
        this.gridColor = new THREE.Color(finalConfig.gridColor);
        this.glowColor = new THREE.Color(finalConfig.glowColor);
        this.autoRotate = finalConfig.autoRotate;
        this.rotationSpeed = finalConfig.rotationSpeed;

        // State
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };

        // Components
        this.globeGroup = new THREE.Group(); // Holds all globe parts
        this.baseSphere = null;
        this.gridSphere = null;
        this.glowSphere = null;
        this.markerGroup = new THREE.Group();
        this.connectionGroup = new THREE.Group();

        // Shader Uniforms
        this.uniforms = {
            time: { value: 0 },
            scanColor: { value: this.gridColor },
            glowColor: { value: this.glowColor },
            scanSpeed: { value: 2.0 },
            scanDensity: { value: 10.0 }
        };

        this.create();
        this.setupInteraction();

        // Add initial markers if provided
        if (finalConfig.markers && finalConfig.markers.length > 0) {
            finalConfig.markers.forEach(m => this.addMarker(m.lat, m.lon, m.data));
        }
    }

    create() {
        // Initialization check
        if (!this.globeGroup) return;

        this.group.add(this.globeGroup);
        this.createBaseSphere();
        if (this.config.showScanlines) {
            this.createHoloSphere();
        }
        this.createAtmosphereGlow();

        // Add container groups
        this.globeGroup.add(this.markerGroup);
        this.globeGroup.add(this.connectionGroup);

        // Initial rotation
        this.globeGroup.rotation.y = -Math.PI / 2;
    }

    /**
     * Create the solid inner sphere (handles basic map texture)
     */
    createBaseSphere() {
        const geometry = new THREE.SphereGeometry(this.radius * 0.99, 64, 64);

        // Use texture if provided, otherwise simple standard material
        const material = new THREE.MeshPhongMaterial({
            color: 0x001133,
            emissive: 0x000510,
            shininess: 50,
            transparent: true,
            opacity: 0.9
        });

        if (this.config.mapTexture) {
            new THREE.TextureLoader().load(this.config.mapTexture, (tex) => {
                material.map = tex;
                material.emissiveMap = tex;
                material.emissiveIntensity = 0.2;
                material.needsUpdate = true;
            });
        }

        this.baseSphere = new THREE.Mesh(geometry, material);
        this.globeGroup.add(this.baseSphere);
    }

    /**
     * Create the holographic outer shell with custom shader
     */
    createHoloSphere() {
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            uniform float time;
            uniform vec3 scanColor;
            uniform float scanSpeed;
            uniform float scanDensity;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                // Fresnel effect
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                float fresnel = dot(normal, viewDir);
                fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
                fresnel = pow(fresnel, 2.0);

                // Grid pattern
                float gridX = step(0.98, fract(vUv.x * 60.0)); // Vertical lines
                float gridY = step(0.98, fract(vUv.y * 30.0)); // Horizontal lines
                float grid = max(gridX, gridY);

                // Scanline effect
                float scan = sin(vUv.y * scanDensity - time * scanSpeed);
                scan = smoothstep(0.4, 0.6, scan);
                
                // Combine effects
                vec3 color = scanColor;
                float alpha = (grid * 0.3) + (scan * 0.1) + (fresnel * 0.5);
                
                // Boost alpha at edges
                alpha = clamp(alpha, 0.0, 1.0);

                gl_FragColor = vec4(color, alpha);
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false, // Important for transparency overlap
            blending: THREE.AdditiveBlending
        });

        this.gridSphere = new THREE.Mesh(geometry, material);
        this.globeGroup.add(this.gridSphere);
    }

    /**
     * Create outer atmosphere glow
     */
    createAtmosphereGlow() {
        const geometry = new THREE.SphereGeometry(this.radius * 1.1, 64, 64);

        const vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 glowColor;
            varying vec3 vNormal;

            void main() {
                float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                gl_FragColor = vec4(glowColor, intensity * 0.5);
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: this.glowColor }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.glowSphere = new THREE.Mesh(geometry, material);
        this.globeGroup.add(this.glowSphere);
    }

    /**
     * Add a marker to the globe
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {any} data - User data associated with marker
     */
    addMarker(lat, lon, data = {}) {
        const pos = this.latLonToVector3(lat, lon, this.radius);

        // Create marker mesh (simple glowing sphere for now)
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff3366 }); // Pinkish red
        const marker = new THREE.Mesh(geometry, material);

        marker.position.copy(pos);
        marker.userData = data;

        // Align marker to surface normal?
        marker.lookAt(new THREE.Vector3(0, 0, 0));

        this.markerGroup.add(marker);

        // Add a "stick" connecting to surface if desired?
        // For holographic look, floating points are cool.

        return marker;
    }

    /**
     * Helper: Convert Lat/Lon to 3D Position
     */
    latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));

        return new THREE.Vector3(x, y, z);
    }

    setupInteraction() {
        // Drag to rotate logic would go here
        // For now, simpler auto-rotate and mouse interaction hooks
    }

    update(time) {
        // Update shader uniforms
        this.uniforms.time.value = time * 0.001;

        // Auto-rotation with inertia
        if (this.autoRotate && !this.isDragging) {
            this.globeGroup.rotation.y += this.rotationSpeed;
        }

        // Pulse markers?
        const scale = 1.0 + Math.sin(time * 0.005) * 0.2;
        this.markerGroup.children.forEach(m => {
            m.scale.setScalar(scale);
        });
    }

    dispose() {
        // Cleanup geometries and materials
        if (this.baseSphere) {
            this.baseSphere.geometry.dispose();
            this.baseSphere.material.dispose();
        }
        if (this.gridSphere) {
            this.gridSphere.geometry.dispose();
            this.gridSphere.material.dispose();
        }
        if (this.glowSphere) {
            this.glowSphere.geometry.dispose();
            this.glowSphere.material.dispose();
        }

        super.dispose();
    }
}
