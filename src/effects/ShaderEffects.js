import * as THREE from 'three';

/**
 * Glassmorphism Effect System
 * Creates frosted glass effects with blur, transparency, and subtle reflections
 */
export class GlassmorphismEffect {
    constructor(options = {}) {
        this.blurAmount = options.blurAmount || 10;
        this.transparency = options.transparency || 0.7;
        this.tintColor = options.tintColor || 0xffffff;
        this.tintIntensity = options.tintIntensity || 0.1;
    }

    /**
     * Apply glassmorphism effect to a mesh
     * @param {THREE.Mesh} mesh - Target mesh
     * @param {Object} options - Effect options
     */
    apply(mesh, options = {}) {
        const blurAmount = options.blurAmount || this.blurAmount;
        const transparency = options.transparency || this.transparency;
        const tintColor = options.tintColor || this.tintColor;

        // Create frosted glass material
        const material = new THREE.MeshPhysicalMaterial({
            color: tintColor,
            metalness: 0.1,
            roughness: 0.1,
            transparent: true,
            opacity: transparency,
            transmission: 0.9, // Glass-like transmission
            thickness: 0.5,
            envMapIntensity: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            ior: 1.5, // Index of refraction for glass
        });

        // Apply material
        if (mesh.material) {
            mesh.material.dispose();
        }
        mesh.material = material;

        return material;
    }

    /**
     * Create a glassmorphic panel
     * @param {number} width - Panel width
     * @param {number} height - Panel height
     * @param {Object} options - Panel options
     */
    createPanel(width, height, options = {}) {
        const depth = options.depth || 0.1;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhysicalMaterial({
            color: options.tintColor || this.tintColor,
            metalness: 0.1,
            roughness: 0.1,
            transparent: true,
            opacity: options.transparency || this.transparency,
            transmission: 0.9,
            thickness: 0.5,
            envMapIntensity: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            ior: 1.5,
        });

        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
}

/**
 * Holographic Effect Shader
 */
export const HolographicShader = {
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            // Fresnel effect
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
            
            // Animated color shift
            float colorShift = sin(vPosition.y * 5.0 + time) * 0.5 + 0.5;
            vec3 color = mix(color1, color2, colorShift);
            color = mix(color, color3, fresnel);
            
            // Scanlines
            float scanline = sin(vPosition.y * 50.0 + time * 2.0) * 0.1 + 0.9;
            
            gl_FragColor = vec4(color * scanline, 0.8 + fresnel * 0.2);
        }
    `,

    uniforms: {
        time: { value: 0.0 },
        color1: { value: new THREE.Color(0x4ecdc4) },
        color2: { value: new THREE.Color(0x6bb6ff) },
        color3: { value: new THREE.Color(0xff6b9d) }
    }
};

/**
 * Neon Glow Shader
 */
export const NeonGlowShader = {
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform vec3 glowColor;
        uniform float glowIntensity;
        uniform float time;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            // Rim lighting effect
            vec3 viewDirection = normalize(-vPosition);
            float rim = 1.0 - max(dot(viewDirection, vNormal), 0.0);
            rim = pow(rim, 3.0);
            
            // Pulsing effect
            float pulse = sin(time * 2.0) * 0.2 + 0.8;
            
            vec3 glow = glowColor * rim * glowIntensity * pulse;
            
            gl_FragColor = vec4(glow, rim);
        }
    `,

    uniforms: {
        glowColor: { value: new THREE.Color(0x00ffff) },
        glowIntensity: { value: 2.0 },
        time: { value: 0.0 }
    }
};

/**
 * Energy Wave Shader
 */
export const EnergyWaveShader = {
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform float time;
        uniform vec3 waveColor;
        uniform float waveSpeed;
        uniform float waveFrequency;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            // Moving waves
            float wave1 = sin(vPosition.x * waveFrequency + time * waveSpeed) * 0.5 + 0.5;
            float wave2 = sin(vPosition.y * waveFrequency * 0.7 + time * waveSpeed * 1.3) * 0.5 + 0.5;
            
            float combined = (wave1 + wave2) * 0.5;
            
            vec3 color = waveColor * combined;
            float alpha = combined * 0.7;
            
            gl_FragColor = vec4(color, alpha);
        }
    `,

    uniforms: {
        time: { value: 0.0 },
        waveColor: { value: new THREE.Color(0x4ecdc4) },
        waveSpeed: { value: 1.0 },
        waveFrequency: { value: 5.0 }
    }
};

/**
 * Shader Effects Manager
 */
export class ShaderEffects {
    constructor() {
        this.effects = new Map();
    }

    /**
     * Apply holographic effect to mesh
     */
    applyHolographic(mesh) {
        const material = new THREE.ShaderMaterial({
            vertexShader: HolographicShader.vertexShader,
            fragmentShader: HolographicShader.fragmentShader,
            uniforms: THREE.UniformsUtils.clone(HolographicShader.uniforms),
            transparent: true,
            side: THREE.DoubleSide
        });

        if (mesh.material) {
            mesh.material.dispose();
        }
        mesh.material = material;

        this.effects.set(mesh.uuid, { type: 'holographic', material });
        return material;
    }

    /**
     * Apply neon glow effect to mesh
     */
    applyNeonGlow(mesh, color = 0x00ffff, intensity = 2.0) {
        const material = new THREE.ShaderMaterial({
            vertexShader: NeonGlowShader.vertexShader,
            fragmentShader: NeonGlowShader.fragmentShader,
            uniforms: {
                ...THREE.UniformsUtils.clone(NeonGlowShader.uniforms),
                glowColor: { value: new THREE.Color(color) },
                glowIntensity: { value: intensity }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        if (mesh.material) {
            mesh.material.dispose();
        }
        mesh.material = material;

        this.effects.set(mesh.uuid, { type: 'neonGlow', material });
        return material;
    }

    /**
     * Apply energy wave effect to mesh
     */
    applyEnergyWave(mesh, color = 0x4ecdc4) {
        const material = new THREE.ShaderMaterial({
            vertexShader: EnergyWaveShader.vertexShader,
            fragmentShader: EnergyWaveShader.fragmentShader,
            uniforms: {
                ...THREE.UniformsUtils.clone(EnergyWaveShader.uniforms),
                waveColor: { value: new THREE.Color(color) }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        if (mesh.material) {
            mesh.material.dispose();
        }
        mesh.material = material;

        this.effects.set(mesh.uuid, { type: 'energyWave', material });
        return material;
    }

    /**
     * Update all shader effects (call in animation loop)
     */
    update(deltaTime = 0.016) {
        const time = performance.now() * 0.001;

        this.effects.forEach((effect) => {
            if (effect.material && effect.material.uniforms && effect.material.uniforms.time) {
                effect.material.uniforms.time.value = time;
            }
        });
    }

    /**
     * Remove effect from mesh
     */
    removeEffect(mesh) {
        const effect = this.effects.get(mesh.uuid);
        if (effect && effect.material) {
            effect.material.dispose();
        }
        this.effects.delete(mesh.uuid);
    }

    /**
     * Dispose all effects
     */
    dispose() {
        this.effects.forEach((effect) => {
            if (effect.material) {
                effect.material.dispose();
            }
        });
        this.effects.clear();
    }
}
