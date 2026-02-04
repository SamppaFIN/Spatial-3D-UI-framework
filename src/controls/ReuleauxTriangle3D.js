import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * ReuleauxTriangle3D - A curve of constant width
 * 
 * The Reuleaux triangle is formed by the intersection of three circles,
 * each centered at a vertex of an equilateral triangle with radius equal
 * to the side length. It has constant width in all directions and can
 * famously drill square holes.
 * 
 * @extends BaseControl3D
 */
export class ReuleauxTriangle3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            radius: config.radius || 1.0,
            thickness: config.thickness || 0.2,
            segments: config.segments || 64,
            color: config.color || 0xff6b9d,
            materialType: config.materialType || 'metal',
            autoRotate: config.autoRotate !== false,
            rotationSpeed: config.rotationSpeed || 0.005,
            showConstantWidth: config.showConstantWidth || false,
            wireframe: config.wireframe || false,
            extrusionType: config.extrusionType || 'flat', // 'flat' or 'revolve'
            onClick: config.onClick || null
        });

        this.radius = this.get('radius');
        this.thickness = this.get('thickness');
        this.segments = this.get('segments');
        this.autoRotate = this.get('autoRotate');
        this.rotationSpeed = this.get('rotationSpeed');
        this.showConstantWidth = this.get('showConstantWidth');
        this.wireframe = this.get('wireframe');
        this.extrusionType = this.get('extrusionType');

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

        const geometry = this.extrusionType === 'revolve'
            ? this.createReuleauxTetrahedron()
            : this.createReuleauxTriangleExtrusion();
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
            this.createWidthIndicators();
        }

        this.createGlow();
    }

    createReuleauxTriangleShape() {
        // Create the 2D Reuleaux triangle shape
        const shape = new THREE.Shape();
        const r = this.radius;
        const segs = this.segments;

        // Vertices of equilateral triangle
        const h = r * Math.sqrt(3) / 2; // height of equilateral triangle
        const v1 = new THREE.Vector2(0, 2 * h / 3);
        const v2 = new THREE.Vector2(-r / 2, -h / 3);
        const v3 = new THREE.Vector2(r / 2, -h / 3);

        // Start at first vertex
        shape.moveTo(v1.x, v1.y);

        // Arc from v1 to v2 (centered at v3)
        const segmentsPerArc = Math.floor(segs / 3);
        for (let i = 0; i <= segmentsPerArc; i++) {
            const t = i / segmentsPerArc;
            const angle1 = Math.atan2(v1.y - v3.y, v1.x - v3.x);
            const angle2 = Math.atan2(v2.y - v3.y, v2.x - v3.x);
            const angle = angle1 + (angle2 - angle1) * t;
            const x = v3.x + r * Math.cos(angle);
            const y = v3.y + r * Math.sin(angle);
            shape.lineTo(x, y);
        }

        // Arc from v2 to v3 (centered at v1)
        for (let i = 0; i <= segmentsPerArc; i++) {
            const t = i / segmentsPerArc;
            const angle1 = Math.atan2(v2.y - v1.y, v2.x - v1.x);
            const angle2 = Math.atan2(v3.y - v1.y, v3.x - v1.x);
            const angle = angle1 + (angle2 - angle1) * t;
            const x = v1.x + r * Math.cos(angle);
            const y = v1.y + r * Math.sin(angle);
            shape.lineTo(x, y);
        }

        // Arc from v3 to v1 (centered at v2)
        for (let i = 0; i <= segmentsPerArc; i++) {
            const t = i / segmentsPerArc;
            const angle1 = Math.atan2(v3.y - v2.y, v3.x - v2.x);
            const angle2 = Math.atan2(v1.y - v2.y, v1.x - v2.x);
            const angle = angle1 + (angle2 - angle1) * t;
            const x = v2.x + r * Math.cos(angle);
            const y = v2.y + r * Math.sin(angle);
            shape.lineTo(x, y);
        }

        return shape;
    }

    createReuleauxTriangleExtrusion() {
        const shape = this.createReuleauxTriangleShape();

        const extrudeSettings = {
            depth: this.thickness,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 3
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        return geometry;
    }

    createReuleauxTetrahedron() {
        // Simplified Reuleaux tetrahedron-like shape
        // (true Reuleaux tetrahedron is complex; this is an approximation)
        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];

        const r = this.radius;
        const segments = this.segments;

        // Create a spherical-like surface with tetrahedral symmetry
        // Using spherical coordinates with modifications
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;

            for (let j = 0; j <= segments / 2; j++) {
                const phi = (j / (segments / 2)) * Math.PI;

                // Spherical to Cartesian with slight modification for Reuleaux shape
                const baseX = Math.sin(phi) * Math.cos(theta);
                const baseY = Math.cos(phi);
                const baseZ = Math.sin(phi) * Math.sin(theta);

                // Apply tetrahedral distortion
                const tetraFactor = 1 + 0.15 * Math.sin(3 * theta) * Math.sin(2 * phi);

                const x = r * baseX * tetraFactor;
                const y = r * baseY * tetraFactor;
                const z = r * baseZ * tetraFactor;

                vertices.push(x, y, z);
                normals.push(baseX, baseY, baseZ);
                uvs.push(i / segments, j / (segments / 2));
            }
        }

        // Create faces
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments / 2; j++) {
                const a = i * (segments / 2 + 1) + j;
                const b = a + segments / 2 + 1;

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

    createWidthIndicators() {
        // Visual indicators showing constant width property
        if (this.widthIndicators) {
            this.widthIndicators.forEach(indicator => {
                this.group.remove(indicator);
                if (indicator.geometry) indicator.geometry.dispose();
                if (indicator.material) indicator.material.dispose();
            });
        }

        this.widthIndicators = [];

        const lineCount = 6;
        const width = this.radius * 2;

        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI;
            const points = [];
            points.push(new THREE.Vector3(
                Math.cos(angle) * width / 2,
                Math.sin(angle) * width / 2,
                this.thickness / 2 + 0.01
            ));
            points.push(new THREE.Vector3(
                -Math.cos(angle) * width / 2,
                -Math.sin(angle) * width / 2,
                this.thickness / 2 + 0.01
            ));

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6
            });

            const line = new THREE.Line(geometry, material);
            this.widthIndicators.push(line);
            this.group.add(line);
        }
    }

    createGlow() {
        const glowGeometry = this.extrusionType === 'revolve'
            ? this.createReuleauxTetrahedron()
            : this.createReuleauxTriangleExtrusion();
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

            // Rotate to show the constant width property
            if (this.extrusionType === 'flat') {
                this.group.rotation.z = this.rotationAngle;
            } else {
                this.group.rotation.x = this.rotationAngle * 0.5;
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
        const criticalKeys = ['radius', 'thickness', 'segments', 'color', 'materialType', 'wireframe', 'extrusionType', 'showConstantWidth'];
        if (criticalKeys.includes(key)) {
            this.create();
        }

        if (key === 'autoRotate') this.autoRotate = value;
        if (key === 'rotationSpeed') this.rotationSpeed = value;

        super.onStateChange(key, value, oldValue);
    }
}
