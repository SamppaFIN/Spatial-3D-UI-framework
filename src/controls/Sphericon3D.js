import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * Sphericon3D - A bicone cut and rejoined with a 90-degree rotation
 * 
 * The Sphericon is a developable surface that wobbles side-to-side while
 * rolling forward in a straight line. Its entire surface touches the ground
 * during one complete revolution.
 * 
 * @extends BaseControl3D
 */
export class Sphericon3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            radius: config.radius || 1.0,
            height: config.height || 2.0,
            segments: config.segments || 64,
            color: config.color || 0x44a3c9,
            materialType: config.materialType || 'metal',
            autoRotate: config.autoRotate !== false,
            rotationSpeed: config.rotationSpeed || 0.005,
            wobbleAnimation: config.wobbleAnimation !== false,
            wireframe: config.wireframe || false,
            onClick: config.onClick || null
        });

        this.radius = this.get('radius');
        this.height = this.get('height');
        this.segments = this.get('segments');
        this.autoRotate = this.get('autoRotate');
        this.rotationSpeed = this.get('rotationSpeed');
        this.wobbleAnimation = this.get('wobbleAnimation');
        this.wireframe = this.get('wireframe');

        this.rotationAngle = 0;
        this.wobbleAngle = 0;
        this.currentScale = 1.0;
        this.scaleVelocity = 0;

        this.create();
    }

    create() {
        // Clear existing geometry
        while (this.group.children.length > 0) {
            const child = this.group.children[0];
            this.group.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }

        const geometry = this.createSphericonGeometry();
        const material = this.createMaterial();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.isInteractive = true;
        this.mesh.userData.control = this;

        this.group.add(this.mesh);

        if (this.wireframe) {
            this.createWireframe(geometry);
        }

        this.createGlow();
    }

    createSphericonGeometry() {
        const radius = this.radius;
        const height = this.height;
        const segments = this.segments;

        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];

        // A Sphericon is made from a bicone (two cones joined at their bases)
        // that is cut in half and rejoined with a 90-degree rotation

        // Create the bicone first, then apply the cut and rotation
        const halfHeight = height / 2;

        // Top cone apex
        const topApex = new THREE.Vector3(0, halfHeight, 0);
        // Bottom cone apex  
        const bottomApex = new THREE.Vector3(0, -halfHeight, 0);

        // Create vertices for the bicone surface
        // We'll create it in parts that correspond to the cut sections

        // For each segment around the bicone
        for (let i = 0; i <= segments; i++) {
            const theta1 = (i / segments) * Math.PI * 2;
            const theta2 = ((i + 1) / segments) * Math.PI * 2;

            // Determine which half this segment belongs to (for the 90° rotation)
            const isFirstHalf = (theta1 < Math.PI);
            const rotationOffset = isFirstHalf ? 0 : Math.PI / 2; // 90 degrees for second half

            // Points on the base circle
            const x1 = radius * Math.cos(theta1 + rotationOffset);
            const z1 = radius * Math.sin(theta1 + rotationOffset);

            // Create triangles for top cone
            const basePoint1Top = new THREE.Vector3(x1, 0, z1);

            // Top cone triangle
            const baseIdx = vertices.length / 3;

            vertices.push(
                topApex.x, topApex.y, topApex.z,
                basePoint1Top.x, basePoint1Top.y, basePoint1Top.z
            );

            // Bottom cone triangle  
            vertices.push(
                bottomApex.x, bottomApex.y, bottomApex.z,
                basePoint1Top.x, basePoint1Top.y, basePoint1Top.z
            );

            // Calculate normals for the cone surfaces
            const edge1 = new THREE.Vector3().subVectors(basePoint1Top, topApex);
            const edge2 = new THREE.Vector3(
                -Math.sin(theta1 + rotationOffset),
                0,
                Math.cos(theta1 + rotationOffset)
            );
            const normalTop = new THREE.Vector3().crossVectors(edge2, edge1).normalize();

            const edge3 = new THREE.Vector3().subVectors(basePoint1Top, bottomApex);
            const normalBottom = new THREE.Vector3().crossVectors(edge3, edge2).normalize();

            // Add normals
            for (let j = 0; j < 2; j++) {
                normals.push(normalTop.x, normalTop.y, normalTop.z);
            }
            for (let j = 0; j < 2; j++) {
                normals.push(normalBottom.x, normalBottom.y, normalBottom.z);
            }

            // UVs
            const u = i / segments;
            uvs.push(u, 1, u, 0.5);
            uvs.push(u, 0, u, 0.5);
        }

        // Create quad strips around the surface
        for (let i = 0; i < segments; i++) {
            const baseIdx = i * 4;

            // Top cone triangles
            indices.push(
                baseIdx, baseIdx + 1, baseIdx + 5,
                baseIdx, baseIdx + 5, baseIdx + 4
            );

            // Bottom cone triangles
            indices.push(
                baseIdx + 2, baseIdx + 3, baseIdx + 7,
                baseIdx + 2, baseIdx + 7, baseIdx + 6
            );
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.center();

        return geometry;
    }

    createMaterial() {
        const color = this.get('color');
        const materialType = this.get('materialType');

        switch (materialType) {
            case 'glass':
                return new THREE.MeshPhysicalMaterial({
                    color: color,
                    metalness: 0.0,
                    roughness: 0.1,
                    transparent: true,
                    opacity: 0.6,
                    transmission: 0.9,
                    thickness: 0.5,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1
                });
            case 'metal':
                return new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.9,
                    roughness: 0.2,
                    emissive: color,
                    emissiveIntensity: 0.2
                });
            case 'neon':
                return new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.3,
                    roughness: 0.4,
                    emissive: color,
                    emissiveIntensity: 0.8,
                    transparent: true,
                    opacity: 0.9
                });
            default:
                return new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.5,
                    roughness: 0.5
                });
        }
    }

    createWireframe(geometry) {
        if (this.wireframeMesh) {
            this.group.remove(this.wireframeMesh);
            this.wireframeMesh.geometry.dispose();
            this.wireframeMesh.material.dispose();
        }

        const wireframeGeo = new THREE.WireframeGeometry(geometry);
        const wireframeMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            linewidth: 1
        });

        this.wireframeMesh = new THREE.LineSegments(wireframeGeo, wireframeMat);
        this.group.add(this.wireframeMesh);
    }

    createGlow() {
        const glowGeometry = this.createSphericonGeometry();
        glowGeometry.scale(1.05, 1.05, 1.05);

        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.get('color'),
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });

        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.visible = false;
        this.group.add(this.glowMesh);
    }

    toggleWireframe() {
        this.wireframe = !this.wireframe;
        this.set('wireframe', this.wireframe);

        if (this.wireframe && !this.wireframeMesh) {
            this.createWireframe(this.mesh.geometry);
        } else if (this.wireframeMesh) {
            this.wireframeMesh.visible = this.wireframe;
        }
    }

    handleClick(intersect) {
        super.handleClick(intersect);
        this.toggleWireframe();

        const onClick = this.get('onClick');
        if (onClick && typeof onClick === 'function') {
            onClick(this);
        }
    }

    onHoverChange(isHovered) {
        super.onHoverChange(isHovered);
        if (this.glowMesh) {
            this.glowMesh.visible = isHovered;
        }
        this.scaleVelocity = isHovered ? 0.05 : -0.05;
    }

    update() {
        if (this.autoRotate) {
            this.rotationAngle += this.rotationSpeed;

            if (this.wobbleAnimation) {
                // Sphericon wobbles side-to-side while rolling
                this.wobbleAngle = Math.sin(this.rotationAngle * 2) * 0.3;
                this.group.rotation.x = this.wobbleAngle;
                this.group.rotation.z = this.rotationAngle;
            } else {
                this.group.rotation.y = this.rotationAngle;
            }
        }

        // Scale animation on hover
        const targetScale = this.isHovered ? 1.1 : 1.0;
        const scaleDiff = targetScale - this.currentScale;
        this.scaleVelocity += scaleDiff * 0.1;
        this.scaleVelocity *= 0.8;
        this.currentScale += this.scaleVelocity;
        this.group.scale.setScalar(this.currentScale);

        super.update();
    }

    onStateChange(key, value, oldValue) {
        const criticalKeys = ['radius', 'height', 'segments', 'color', 'materialType', 'wireframe'];
        if (criticalKeys.includes(key)) {
            this.create();
        }

        if (key === 'autoRotate') this.autoRotate = value;
        if (key === 'rotationSpeed') this.rotationSpeed = value;
        if (key === 'wobbleAnimation') this.wobbleAnimation = value;

        super.onStateChange(key, value, oldValue);
    }
}
