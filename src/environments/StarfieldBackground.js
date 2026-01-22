import * as THREE from 'three';

export class StarfieldBackground {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.starCount = options.starCount || 10000;
        this.dustCount = options.dustCount || 2000;

        this.starMesh = null;
        this.dustMesh = null;

        // Generate texture once
        this.texture = this.generateSprite();

        this.createStars();
        this.createDust();
    }

    generateSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');

        // Radial gradient for soft glow
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    createStars() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.starCount * 3);
        const sizes = new Float32Array(this.starCount);
        const colors = new Float32Array(this.starCount * 3);
        const color = new THREE.Color();

        for (let i = 0; i < this.starCount; i++) {
            // Distant sphere
            const r = 500 + Math.random() * 800;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Small, distant stars
            sizes[i] = 0.5 + Math.random() * 1.5;

            // Subtle color tinting
            if (Math.random() > 0.8) {
                color.setHSL(0.6, 0.6, 0.9); // Blue-ish
            } else if (Math.random() > 0.9) {
                color.setHSL(0.1, 0.6, 0.9); // Yellow-ish
            } else {
                color.setScalar(0.9 + Math.random() * 0.1); // White
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1,
            map: this.texture,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        this.starMesh = new THREE.Points(geometry, material);
        this.scene.add(this.starMesh);
    }

    createDust() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.dustCount * 3);
        const sizes = new Float32Array(this.dustCount);
        const colors = new Float32Array(this.dustCount * 3);
        const color = new THREE.Color();

        for (let i = 0; i < this.dustCount; i++) {
            // Closer, filling the volume around the user
            // Use a box or sphere volume, but closer than stars
            const r = 20 + Math.random() * 200;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Larger, softer "dust" or "magic particles"
            sizes[i] = 2.0 + Math.random() * 3.0;

            // Magical tints
            color.setHSL(Math.random() * 0.1 + 0.55, 0.8, 0.7); // Light blues/purples

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1,
            map: this.texture,
            vertexColors: true,
            transparent: true,
            opacity: 0.4, // Fainter
            depthWrite: false,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        this.dustMesh = new THREE.Points(geometry, material);
        this.scene.add(this.dustMesh);
    }

    update(time) {
        // Deep stars rotate very slowly
        if (this.starMesh) {
            this.starMesh.rotation.y = time * 0.002;
            this.starMesh.rotation.x = Math.cos(time * 0.001) * 0.001;
        }

        // Dust floats with a bit more life
        if (this.dustMesh) {
            this.dustMesh.rotation.y = time * 0.005;
            this.dustMesh.rotation.x = Math.sin(time * 0.003) * 0.002;

            // Optional: breathing effect or slight oscillation
            // Scale pulse?
            // this.dustMesh.scale.setScalar(1 + Math.sin(time) * 0.01); 
        }
    }
}
