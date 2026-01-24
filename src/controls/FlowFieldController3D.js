import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * FlowFieldController3D - GPGPU Particle Flow Field
 * 
 * High-performance particle system controlled by 3D vector flow fields.
 * Uses GPU computation for real-time simulation of thousands of particles.
 * 
 * @extends BaseControl3D
 */
export class FlowFieldController3D extends BaseControl3D {
    constructor(scene, camera, position, config = {}) {
        // Get renderer from scene (assume it's attached)
        const renderer = config.renderer || null;

        super(scene, camera, position, config);

        // Configuration
        this.renderer = renderer;
        this.particleCount = config.particleCount || 5000;
        this.fieldResolution = config.fieldResolution || 32;
        this.fieldStrength = config.fieldStrength || 1.0;
        this.particleSize = config.particleSize || 2.0;
        this.particleColor = config.particleColor || new THREE.Color(0x00ffff);
        this.velocityColorRange = config.velocityColorRange || [
            new THREE.Color(0x0088ff),
            new THREE.Color(0xff0088)
        ];
        this.showFieldLines = config.showFieldLines || false;
        this.preset = config.preset || 'vortex';
        this.onUpdate = config.onUpdate || null;

        // State
        this.attractors = [];
        this.gpuCompute = null;
        this.positionVariable = null;
        this.velocityVariable = null;
        this.particles = null;
        this.time = 0;

        // Only initialize if renderer is available
        if (this.renderer) {
            this.create();
        }
    }

    /**
     * Create the flow field controller components
     */
    create() {
        // Prevent execution if called from parent constructor before properties are set
        if (!this.velocityColorRange || !this.renderer) {
            return;
        }

        this.initGPGPU();
        this.createParticleGeometry();

        if (this.showFieldLines) {
            this.renderFieldLines();
        }
    }

    /**
     * Initialize GPGPU computation
     */
    initGPGPU() {
        const width = Math.ceil(Math.sqrt(this.particleCount));
        const height = width;

        // Create GPU computation renderer
        this.gpuCompute = new GPUComputationRenderer(width, height, this.renderer);

        // Position texture
        const dtPosition = this.gpuCompute.createTexture();
        this.fillPositionTexture(dtPosition);

        // Velocity texture
        const dtVelocity = this.gpuCompute.createTexture();
        this.fillVelocityTexture(dtVelocity);

        // Position variable (shader)
        this.positionVariable = this.gpuCompute.addVariable(
            'texturePosition',
            this.getPositionShader(),
            dtPosition
        );

        // Velocity variable (shader)
        this.velocityVariable = this.gpuCompute.addVariable(
            'textureVelocity',
            this.getVelocityShader(),
            dtVelocity
        );

        // Dependencies
        this.gpuCompute.setVariableDependencies(this.positionVariable, [
            this.positionVariable,
            this.velocityVariable
        ]);

        this.gpuCompute.setVariableDependencies(this.velocityVariable, [
            this.positionVariable,
            this.velocityVariable
        ]);

        // Uniforms
        this.positionVariable.material.uniforms.time = { value: 0.0 };
        this.positionVariable.material.uniforms.delta = { value: 0.0 };

        this.velocityVariable.material.uniforms.time = { value: 0.0 };
        this.velocityVariable.material.uniforms.delta = { value: 0.0 };
        this.velocityVariable.material.uniforms.preset = { value: this.getPresetValue() };
        // this.velocityVariable.material.uniforms.attractorCount = { value: 0 };
        // this.velocityVariable.material.uniforms.attractors = { value: new Float32Array(40) };

        // Initialize
        const error = this.gpuCompute.init();
        if (error !== null) {
            console.error('FlowFieldController3D: GPU Compute error', error);
        }
    }

    /**
     * Fill position texture with random initial positions
     */
    fillPositionTexture(texture) {
        const data = texture.image.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = (Math.random() - 0.5) * 20;     // x
            data[i + 1] = (Math.random() - 0.5) * 20; // y
            data[i + 2] = (Math.random() - 0.5) * 20; // z
            data[i + 3] = 1.0;                        // w
        }
    }

    /**
     * Fill velocity texture with random initial velocities
     */
    fillVelocityTexture(texture) {
        const data = texture.image.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = (Math.random() - 0.5) * 0.1;     // vx
            data[i + 1] = (Math.random() - 0.5) * 0.1; // vy
            data[i + 2] = (Math.random() - 0.5) * 0.1; // vz
            data[i + 3] = 0.0;                         // speed
        }
    }

    /**
     * Get position update shader
     */
    getPositionShader() {
        return `
            uniform float time;
            uniform float delta;

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 tmpPos = texture2D(texturePosition, uv);
                vec3 position = tmpPos.xyz;
                
                vec4 tmpVel = texture2D(textureVelocity, uv);
                vec3 velocity = tmpVel.xyz;
                
                // Update position
                position += velocity * delta;
                
                // Boundary wrapping
                float bound = 10.0;
                if (position.x < -bound) position.x = bound;
                if (position.x > bound) position.x = -bound;
                if (position.y < -bound) position.y = bound;
                if (position.y > bound) position.y = -bound;
                if (position.z < -bound) position.z = bound;
                if (position.z > bound) position.z = -bound;
                
                gl_FragColor = vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get velocity update shader
     */
    getVelocityShader() {
        return `
            uniform float time;
            uniform float delta;
            uniform int preset;
            // Attractors removed for debugging

            vec3 vortexField(vec3 p) {
                float angle = atan(p.z, p.x);
                float radius = length(p.xz);
                
                return vec3(
                    -sin(angle) * radius * 0.5,
                    sin(p.y * 3.14159) * 0.3,
                    cos(angle) * radius * 0.5
                );
            }

            vec3 waveField(vec3 p) {
                return vec3(
                    sin(p.y * 3.14159 * 2.0) * 0.5,
                    cos(p.x * 3.14159 * 2.0) * 0.5,
                    sin(p.z * 3.14159 * 2.0) * 0.5
                );
            }

            vec3 turbulenceField(vec3 p) {
                float t = time * 0.5;
                return vec3(
                    sin(p.x * 0.5 + t) * cos(p.y * 0.3),
                    cos(p.y * 0.5 + t) * sin(p.z * 0.3),
                    sin(p.z * 0.5 + t) * cos(p.x * 0.3)
                ) * 0.5;
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 tmpPos = texture2D(texturePosition, uv);
                vec3 position = tmpPos.xyz;
                
                vec4 tmpVel = texture2D(textureVelocity, uv);
                vec3 velocity = tmpVel.xyz;
                
                // Flow field influence based on preset
                vec3 flowForce = vec3(0.0);
                
                if (preset == 0) {
                    flowForce = vortexField(position * 0.1);
                } else if (preset == 1) {
                    flowForce = waveField(position * 0.1);
                } else {
                    flowForce = turbulenceField(position * 0.1);
                }
                
                // Attractors loop removed for debugging
                vec3 attractorForce = vec3(0.0);
                
                // Apply forces
                velocity += flowForce * 0.5 * delta;
                velocity += attractorForce * 0.1 * delta;
                
                // Damping
                velocity *= 0.98;
                
                // Speed limit
                float speed = length(velocity);
                if (speed > 2.0) {
                    velocity = normalize(velocity) * 2.0;
                    speed = 2.0;
                }
                
                gl_FragColor = vec4(velocity, speed);
            }
        `;
    }

    /**
     * Create particle geometry and material
     */
    createParticleGeometry() {
        const width = Math.ceil(Math.sqrt(this.particleCount));
        const geometry = new THREE.BufferGeometry();

        // Positions (will be updated from GPU texture)
        const positions = new Float32Array(this.particleCount * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // UVs for texture lookup
        const uvs = new Float32Array(this.particleCount * 2);
        for (let i = 0; i < this.particleCount; i++) {
            const x = (i % width) / width;
            const y = Math.floor(i / width) / width;
            uvs[i * 2] = x;
            uvs[i * 2 + 1] = y;
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        // Shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                texturePosition: { value: null },
                textureVelocity: { value: null },
                particleSize: { value: this.particleSize },
                colorLow: { value: this.velocityColorRange[0] },
                colorHigh: { value: this.velocityColorRange[1] }
            },
            vertexShader: this.getParticleVertexShader(),
            fragmentShader: this.getParticleFragmentShader(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.group.add(this.particles);
    }

    /**
     * Get particle vertex shader
     */
    getParticleVertexShader() {
        return `
            uniform sampler2D texturePosition;
            uniform sampler2D textureVelocity;
            uniform float particleSize;

            attribute vec2 uv;

            varying vec3 vColor;
            varying float vSpeed;

            uniform vec3 colorLow;
            uniform vec3 colorHigh;

            void main() {
                vec4 posData = texture2D(texturePosition, uv);
                vec4 velData = texture2D(textureVelocity, uv);
                
                vec3 pos = posData.xyz;
                float speed = velData.w;
                
                vSpeed = speed;
                
                // Color based on speed
                vColor = mix(colorLow, colorHigh, clamp(speed / 2.0, 0.0, 1.0));
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = particleSize * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
    }

    /**
     * Get particle fragment shader
     */
    getParticleFragmentShader() {
        return `
            varying vec3 vColor;
            varying float vSpeed;

            void main() {
                // Circular particle shape
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                if (dist > 0.5) discard;
                
                // Glow effect
                float alpha = 1.0 - (dist * 2.0);
                alpha = pow(alpha, 2.0);
                
                gl_FragColor = vec4(vColor, alpha * 0.8);
            }
        `;
    }

    /**
     * Get preset value for shader
     */
    getPresetValue() {
        switch (this.preset) {
            case 'vortex': return 0;
            case 'wave': return 1;
            case 'turbulence': return 2;
            default: return 0;
        }
    }

    /**
     * Set flow field preset
     */
    setPreset(preset) {
        this.preset = preset;
        if (this.velocityVariable) {
            this.velocityVariable.material.uniforms.preset.value = this.getPresetValue();
        }
    }

    /**
     * Add attractor/repulsor
     */
    addAttractor(position, strength = 1.0) {
        if (this.attractors.length >= 10) {
            console.warn('FlowFieldController3D: Maximum 10 attractors');
            return;
        }

        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: strength > 0 ? 0x00ff00 : 0xff0000,
            emissive: strength > 0 ? 0x00ff00 : 0xff0000,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.userData.isAttractor = true;
        mesh.userData.strength = strength;

        this.attractors.push(mesh);
        this.group.add(mesh);

        this.updateAttractorUniforms();
    }

    /**
     * Remove attractor
     */
    removeAttractor(index) {
        if (index >= 0 && index < this.attractors.length) {
            const attractor = this.attractors[index];
            this.group.remove(attractor);
            this.attractors.splice(index, 1);
            this.updateAttractorUniforms();
        }
    }

    /**
     * Update attractor uniforms
     */
    updateAttractorUniforms() {
        if (!this.velocityVariable) return;

        const attractorData = new Float32Array(40);
        this.attractors.forEach((attractor, i) => {
            const idx = i * 4;
            attractorData[idx] = attractor.position.x;
            attractorData[idx + 1] = attractor.position.y;
            attractorData[idx + 2] = attractor.position.z;
            attractorData[idx + 3] = attractor.userData.strength;
        });

        this.velocityVariable.material.uniforms.attractors.value = attractorData;
        this.velocityVariable.material.uniforms.attractorCount.value = this.attractors.length;
    }

    /**
     * Update method called each frame
     */
    update(delta = 0.016) {
        if (!this.gpuCompute || !this.particles) return;

        this.time += delta;

        // Update uniforms
        this.positionVariable.material.uniforms.time.value = this.time;
        this.positionVariable.material.uniforms.delta.value = delta;
        this.velocityVariable.material.uniforms.time.value = this.time;
        this.velocityVariable.material.uniforms.delta.value = delta;

        // Compute
        this.gpuCompute.compute();

        // Update particle positions from GPU texture
        this.particles.material.uniforms.texturePosition.value =
            this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
        this.particles.material.uniforms.textureVelocity.value =
            this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;

        // Callback
        if (this.onUpdate) {
            this.onUpdate({
                count: this.particleCount,
                attractors: this.attractors.length,
                time: this.time
            });
        }
    }

    /**
     * Render field lines (visualization)
     */
    renderFieldLines() {
        // TODO: Implement field line visualization
        // This would create line geometry showing the vector field
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.gpuCompute) {
            // Dispose GPU computation resources
            this.positionVariable = null;
            this.velocityVariable = null;
            this.gpuCompute = null;
        }

        // Dispose attractors
        this.attractors.forEach(attractor => {
            attractor.geometry?.dispose();
            attractor.material?.dispose();
        });

        // Call parent dispose
        super.dispose();
    }
}
