import { BaseControl3D } from '../core/BaseControl3D.js';
import * as THREE from 'three';

/**
 * LiquidStateContainer3D
 * A container that behaves like a fluid blob held together by surface tension.
 * Uses custom shaders for vertex displacement and fresnel effects.
 */
export class LiquidStateContainer3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        // Liquid properties
        this.color = config.color || 0x00aaff;
        this.highlightColor = config.highlightColor || 0xffffff;
        this.viscosity = config.viscosity || 0.5; // Controls wobble speed
        this.tension = config.tension || 0.5; // Controls displacement amount

        // State for animations
        this.time = 0;
        this.hoverIntensity = 0;

        // Re-create if needed to ensure properties are set
        if (this.group.children.length === 0) {
            this.create();
        }
    }

    create() {
        // Base geometry - a high-res sphere for smooth vertex displacement
        const geometry = new THREE.SphereGeometry(this.state.width / 2, 64, 64);

        // Custom Liquid Shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(this.color) },
                uHighlightColor: { value: new THREE.Color(this.highlightColor) },
                uHover: { value: 0 },
                uTension: { value: this.tension },
                uViscosity: { value: this.viscosity },
                uViewVector: { value: new THREE.Vector3(0, 0, 1) }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uHover;
                uniform float uTension;
                uniform float uViscosity;
                
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying float vDisplacement;

                // Simplex noise function (simplified)
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 = v - i + dot(i, C.xxx) ;
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute( permute( permute(
                                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                void main() {
                    vNormal = normal;
                    vec3 pos = position;
                    
                    // Liquid motion logic
                    float noiseFreq = 2.0;
                    float noiseAmp = 0.1 * uTension; // Base amplitude
                    
                    // More drastic movement when hovered
                    float hoverAmp = uHover * 0.15; 
                    
                    // Time factor modulated by viscosity
                    float speed = uTime * (0.5 + uViscosity);

                    // Calculate noise displacement
                    float noise = snoise(vec3(pos.x * noiseFreq + speed, pos.y * noiseFreq, pos.z * noiseFreq));
                    
                    // Apply displacement along normal
                    float displacement = noise * (noiseAmp + hoverAmp);
                    
                    // Add a "breathing" pulse
                    float pulse = sin(uTime * 2.0) * 0.02;
                    
                    vec3 newPos = pos + normal * (displacement + pulse);
                    
                    vDisplacement = displacement;
                    vViewPosition = (modelViewMatrix * vec4(newPos, 1.0)).xyz;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform vec3 uHighlightColor;
                uniform float uHover;
                
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                varying float vDisplacement;

                void main() {
                    // Normalize normal
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(-vViewPosition);
                    
                    // Fresnel effect (rim lighting)
                    float fresnel = pow(1.0 - dot(viewDir, normal), 3.0);
                    
                    // Liquid depth effect based on displacement
                    float depth = smoothstep(-0.1, 0.1, vDisplacement);
                    
                    // Mix colors
                    vec3 baseColor = uColor;
                    
                    // Add "inner glow" based on depth
                    vec3 depthColor = mix(baseColor * 0.8, baseColor * 1.2, depth);
                    
                    // Add rim light
                    vec3 finalColor = mix(depthColor, uHighlightColor, fresnel * 0.6);
                    
                    // Add hover highlight
                    finalColor += uHighlightColor * uHover * 0.3 * fresnel;

                    gl_FragColor = vec4(finalColor, 0.9); // Slight transparency
                }
            `,
            transparent: true,
            side: THREE.FrontSide // Optimization
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Add to group
        this.group.add(this.mesh);
    }

    update() {
        if (!this.mesh || !this.mesh.material.uniforms) return;

        // Update time
        this.time += 0.01;
        this.mesh.material.uniforms.uTime.value = this.time;

        // Update camera view vector for reflection calculations (optional enhancement)
        if (this.camera) {
            const viewDir = new THREE.Vector3();
            this.camera.getWorldDirection(viewDir);
            this.mesh.material.uniforms.uViewVector.value = viewDir;
        }

        // Smoothly interpolate hover state
        const targetHover = this.isHovered ? 1.0 : 0.0;
        this.hoverIntensity += (targetHover - this.hoverIntensity) * 0.1;
        this.mesh.material.uniforms.uHover.value = this.hoverIntensity;

        // Add subtle rotation
        this.mesh.rotation.x = Math.sin(this.time * 0.5) * 0.1;
        this.mesh.rotation.y = Math.cos(this.time * 0.3) * 0.1;
    }

    // Override interactions
    onHover() {
        super.onHover();
        // Maybe trigger a sound or ripple?
    }

    onClick() {
        super.onClick();
        // "Splash" effect?
        this.mesh.material.uniforms.uTension.value = 2.0; // Spike tension
        setTimeout(() => {
            this.mesh.material.uniforms.uTension.value = this.tension; // Reset
        }, 300);
    }
}
