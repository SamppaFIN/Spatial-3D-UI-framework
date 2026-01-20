import { BaseRoom } from './BaseRoom.js';
import * as THREE from 'three';

export class LandscapeRoom extends BaseRoom {
    create() {
        super.create();
        
        // Create sky gradient background using large sphere as skybox
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x87CEEB) }, // Sky blue
                bottomColor: { value: new THREE.Color(0xE0F6FF) }, // Light blue
                offset: { value: 0.4 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h + offset, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        sky.renderOrder = -10;
        this.backgroundGroup.add(sky);
        
        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x90EE90, // Light green grass
            roughness: 0.8,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -10;
        ground.receiveShadow = true;
        ground.renderOrder = -5;
        this.backgroundGroup.add(ground);
        
        // Create distant mountains using multiple planes with varying heights
        const mountainCount = 5;
        const mountainColors = [0x6B8E23, 0x556B2F, 0x4A5A2F, 0x3D4A1F, 0x2F3A15];
        
        for (let i = 0; i < mountainCount; i++) {
            const mountainHeight = 30 + Math.random() * 40;
            const mountainWidth = 40 + Math.random() * 30;
            const mountainGeometry = new THREE.PlaneGeometry(mountainWidth, mountainHeight, 1, 1);
            
            // Create mountain silhouette shape using vertices
            const positions = mountainGeometry.attributes.position.array;
            const midX = mountainWidth / 2;
            const peakY = mountainHeight;
            
            // Modify vertices to create mountain peak
            for (let j = 0; j < positions.length; j += 3) {
                const x = positions[j];
                const y = positions[j + 1];
                
                // Create peak shape
                if (Math.abs(x - midX) < mountainWidth * 0.1) {
                    positions[j + 1] = peakY;
                } else {
                    const distanceFromCenter = Math.abs(x - midX) / (mountainWidth / 2);
                    positions[j + 1] = peakY * (1 - distanceFromCenter * 0.7);
                }
            }
            mountainGeometry.attributes.position.needsUpdate = true;
            mountainGeometry.computeVertexNormals();
            
            const mountainMaterial = new THREE.MeshStandardMaterial({
                color: mountainColors[i % mountainColors.length],
                roughness: 0.9,
                metalness: 0.0,
                side: THREE.DoubleSide
            });
            
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            mountain.position.set(
                -80 + i * 35 + (Math.random() - 0.5) * 10,
                -10 + mountainHeight / 2,
                -120 - i * 5
            );
            mountain.rotation.y = (Math.random() - 0.5) * 0.2;
            mountain.renderOrder = -3;
            this.backgroundGroup.add(mountain);
        }
        
        // Add simple clouds using billboarded planes
        const cloudCount = 8;
        for (let i = 0; i < cloudCount; i++) {
            const cloudGeometry = new THREE.PlaneGeometry(15, 8, 1, 1);
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 150,
                20 + Math.random() * 30,
                -80 - Math.random() * 40
            );
            cloud.renderOrder = -2;
            this.backgroundGroup.add(cloud);
        }
        
        // Add ambient lighting for landscape
        const landscapeAmbient = new THREE.AmbientLight(0x87CEEB, 0.4);
        this.lights.push(landscapeAmbient);
        this.scene.add(landscapeAmbient);
        
        // Add directional light simulating sun
        const sunLight = new THREE.DirectionalLight(0xFFE87C, 0.8);
        sunLight.position.set(50, 50, 30);
        sunLight.castShadow = true;
        
        // Configure shadow camera for landscape
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.camera.near = 0.1;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.bias = -0.0001;
        
        this.lights.push(sunLight);
        this.scene.add(sunLight);
        
        // Add to scene
        this.scene.add(this.backgroundGroup);
    }
    
    activate() {
        super.activate();
        // Ensure background group is visible
        this.backgroundGroup.visible = true;
    }
    
    deactivate() {
        super.deactivate();
        // Hide background group when deactivated
        this.backgroundGroup.visible = false;
    }
    
    update() {
        super.update();
        // Optional: Add subtle cloud movement animation
        // Could be implemented here if needed
    }
}
