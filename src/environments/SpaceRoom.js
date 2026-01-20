import { BaseRoom } from './BaseRoom.js';
import * as THREE from 'three';

export class SpaceRoom extends BaseRoom {
    create() {
        super.create();
        
        // Create starfield
        const particleCount = 3000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color1 = new THREE.Color(0x8B5CF6); // Purple
        const color2 = new THREE.Color(0x6366F1); // Indigo
        const color3 = new THREE.Color(0x00D4FF); // Cyan
        const color4 = new THREE.Color(0xFFFFFF); // White
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random positions in large space
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = (Math.random() - 0.5) * 200;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
            
            // Random color between cosmic colors
            const rand = Math.random();
            let color;
            if (rand < 0.4) {
                color = new THREE.Color().lerpColors(color1, color2, Math.random());
            } else if (rand < 0.7) {
                color = new THREE.Color().lerpColors(color2, color3, Math.random());
            } else {
                color = new THREE.Color().lerpColors(color3, color4, Math.random());
            }
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Random sizes
            sizes[i] = Math.random() * 1.0 + 0.2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.renderOrder = -2;
        this.backgroundGroup.add(this.particles);
        
        // Store initial positions for rotation
        this.particlePositions = positions;
        
        // Add to scene
        this.scene.add(this.backgroundGroup);
    }
    
    activate() {
        super.activate();
        this.backgroundGroup.visible = true;
    }
    
    deactivate() {
        super.deactivate();
        this.backgroundGroup.visible = false;
    }
    
    update() {
        super.update();
        if (this.particles) {
            // Slow rotation animation for cosmic effect
            this.particles.rotation.y += 0.0005;
            this.particles.rotation.x += 0.0002;
        }
    }
}
