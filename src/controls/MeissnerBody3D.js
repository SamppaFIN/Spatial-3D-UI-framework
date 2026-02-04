import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * MeissnerBody3D - 3D Surface of Constant Width
 * 
 * A Meissner body (Meissner tetrahedron) is a 3D solid of constant width,
 * derived from a Reuleaux tetrahedron by smoothing 3 of its 6 edges.
 * 
 * Construction:
 * 1. Start with Reuleaux tetrahedron (4 intersecting spheres)
 * 2. Smooth 3 edges that meet at a vertex (Type 1) or form a triangle (Type 2)
 * 3. Replace edges with spindle-shaped surfaces of rotation
 * 
 * @extends BaseControl3D
 */
export class MeissnerBody3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            radius: config.radius || 1.0,
            segments: config.segments || 48,
            type: config.type || 'vertex', // 'vertex' or 'triangle'
            color: config.color || 0xff6b9d,
            materialType: config.materialType || 'metal',
            autoRotate: config.autoRotate !== false,
            rotationSpeed: config.rotationSpeed || 0.003,
            wireframe: config.wireframe || false,
            showConstantWidth: config.showConstantWidth || false,
            onClick: config.onClick || null
        });

        this.radius = this.get('radius');
        this.segments = this.get('segments');
        this.type = this.get('type');
        this.autoRotate = this.get('autoRotate');
        this.rotationSpeed = this.get('rotationSpeed');
        this.wireframe = this.get('wireframe');
        this.showConstantWidth = this.get('showConstantWidth');

        this.rotationAngle = 0;
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

        const geometry = this.createMeissnerGeometry();
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

        if (this.showConstantWidth) {
            this.createConstantWidthIndicators();
        }

        this.createGlow();
    }

    createMeissnerGeometry() {
        /**
         * Simplified Meissner body construction:
         * 1. Create Reuleaux tetrahedron (4 intersecting spheres)
         * 2. Approximate edge smoothing with blended surfaces
         */

        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];

        const r = this.radius;
        const segments = this.segments;

        // Regular tetrahedron vertices (normalized)
        const sqrt3 = Math.sqrt(3);
        const sqrt6 = Math.sqrt(6);
        const tetraVerts = [
            new THREE.Vector3(0, sqrt6 / 3, 0),                    // Top
            new THREE.Vector3(-0.5, -sqrt6 / 6, sqrt3 / 2),       // Bottom-front
            new THREE.Vector3(-0.5, -sqrt6 / 6, -sqrt3 / 2),      // Bottom-back-left
            new THREE.Vector3(1, -sqrt6 / 6, 0)                    // Bottom-back-right
        ];

        // Scale to radius
        tetraVerts.forEach(v => v.multiplyScalar(r));

        // Create Reuleaux tetrahedron with edge smoothing
        // Sample points on sphere surfaces centered at each vertex
        for (let i = 0; i <= segments; i++) {
            const phi = (i / segments) * Math.PI; // Polar angle

            for (let j = 0; j <= segments; j++) {
                const theta = (j / segments) * Math.PI * 2; // Azimuthal angle

                // Sample direction
                const dir = new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta),
                    Math.cos(phi),
                    Math.sin(phi) * Math.sin(theta)
                );

                // Find closest point on Reuleaux tetrahedron surface
                let minDist = Infinity;
                let closestPoint = new THREE.Vector3();

                // Check distance to each sphere surface (centered at tetrahedron vertices)
                for (let k = 0; k < 4; k++) {
                    const center = tetraVerts[k];
                    const pointOnSphere = center.clone().add(dir.clone().multiplyScalar(r));

                    // Check if point is inside all other spheres (Reuleaux property)
                    let insideAll = true;
                    for (let m = 0; m < 4; m++) {
                        if (m !== k) {
                            const distToCenter = pointOnSphere.distanceTo(tetraVerts[m]);
                            if (distToCenter > r * 1.01) { // Slight tolerance
                                insideAll = false;
                                break;
                            }
                        }
                    }

                    if (insideAll) {
                        const dist = pointOnSphere.length();
                        if (dist < minDist) {
                            minDist = dist;
                            closestPoint.copy(pointOnSphere);
                        }
                    }
                }

                // If no valid point found, use average of sphere surfaces
                if (minDist === Infinity) {
                    closestPoint.set(0, 0, 0);
                    for (let k = 0; k < 4; k++) {
                        const center = tetraVerts[k];
                        const pointOnSphere = center.clone().add(dir.clone().multiplyScalar(r));
                        closestPoint.add(pointOnSphere);
                    }
                    closestPoint.divideScalar(4);
                }

                // Apply edge smoothing effect for Meissner body
                // Smooth specific edges based on type
                const smoothingFactor = this.calculateSmoothingFactor(closestPoint, tetraVerts);
                closestPoint.multiplyScalar(1 + smoothingFactor * 0.05);

                vertices.push(closestPoint.x, closestPoint.y, closestPoint.z);

                // Compute normal (normalized position)
                const normal = closestPoint.clone().normalize();
                normals.push(normal.x, normal.y, normal.z);

                // UV coordinates
                uvs.push(j / segments, i / segments);
            }
        }

        // Create faces
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j;
                const b = a + segments + 1;

                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }

    calculateSmoothingFactor(point, tetraVerts) {
        /**
         * Calculate smoothing factor based on proximity to edges
         * Type 'vertex': smooth 3 edges meeting at vertex 0
         * Type 'triangle': smooth 3 edges forming bottom triangle
         */

        const edges = this.type === 'vertex'
            ? [[0, 1], [0, 2], [0, 3]]  // Edges from top vertex
            : [[1, 2], [2, 3], [3, 1]]; // Edges of bottom triangle

        let maxSmoothness = 0;

        for (const [i, j] of edges) {
            const v1 = tetraVerts[i];
            const v2 = tetraVerts[j];

            // Distance to edge line
            const edgeDir = new THREE.Vector3().subVectors(v2, v1).normalize();
            const toPoint = new THREE.Vector3().subVectors(point, v1);
            const projection = toPoint.dot(edgeDir);
            const closestOnEdge = v1.clone().add(edgeDir.clone().multiplyScalar(projection));
            const distToEdge = point.distanceTo(closestOnEdge);

            // Smoothing decays with distance from edge
            const smoothness = Math.max(0, 1 - distToEdge / (this.radius * 0.3));
            maxSmoothness = Math.max(maxSmoothness, smoothness);
        }

        return maxSmoothness;
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
                    opacity: 0.7,
                    transmission: 0.9,
                    thickness: 0.5,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1
                });
            case 'metal':
                return new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.95,
                    roughness: 0.15,
                    emissive: color,
                    emissiveIntensity: 0.15
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

    createConstantWidthIndicators() {
        // Remove existing indicators
        if (this.widthIndicators) {
            this.widthIndicators.forEach(line => {
                this.group.remove(line);
                if (line.geometry) line.geometry.dispose();
                if (line.material) line.material.dispose();
            });
        }

        this.widthIndicators = [];

        // Create several indicator lines showing constant width
        const numIndicators = 6;
        const width = this.radius * 2;

        for (let i = 0; i < numIndicators; i++) {
            const angle = (i / numIndicators) * Math.PI * 2;
            const points = [];

            points.push(new THREE.Vector3(
                Math.cos(angle) * width / 2,
                Math.sin(angle) * width / 2,
                0
            ));
            points.push(new THREE.Vector3(
                -Math.cos(angle) * width / 2,
                -Math.sin(angle) * width / 2,
                0
            ));

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6,
                linewidth: 2
            });

            const line = new THREE.Line(geometry, material);
            line.rotation.y = angle;
            this.widthIndicators.push(line);
            this.group.add(line);
        }
    }

    createGlow() {
        const glowGeometry = this.createMeissnerGeometry();
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
        // Auto-rotation
        if (this.autoRotate) {
            this.rotationAngle += this.rotationSpeed;
            this.group.rotation.y = this.rotationAngle;
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
        const criticalKeys = ['radius', 'segments', 'type', 'color', 'materialType', 'wireframe', 'showConstantWidth'];
        if (criticalKeys.includes(key)) {
            this.create();
        }

        if (key === 'autoRotate') this.autoRotate = value;
        if (key === 'rotationSpeed') this.rotationSpeed = value;
        if (key === 'type') this.type = value;

        super.onStateChange(key, value, oldValue);
    }
}
