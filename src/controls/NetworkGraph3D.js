import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * NetworkGraph3D - 3D Force-Directed Graph Visualization
 * 
 * Visualizes complex networks using a force-directed layout algorithm.
 * Uses InstancedMesh for high performance with large numbers of nodes.
 * 
 * @extends BaseControl3D
 */
export class NetworkGraph3D extends BaseControl3D {
    constructor(scene, camera, position, config = {}) {
        const defaults = {
            nodes: [], // { id, val, color }
            links: [], // { source, target } (ids)
            nodeColor: 0x00ffff, // Electric Cyan
            linkColor: 0xff00aa, // Neon Pink
            nodeSize: 0.8,
            linkWidth: 1.5,
            enablePhysics: true,
            repulsion: 150,
            linkDistance: 40,
            damping: 0.1
        };

        const finalConfig = { ...defaults, ...config };
        super(scene, camera, position, finalConfig);

        this.nodes = finalConfig.nodes || [];
        this.links = finalConfig.links || [];

        // Handle automatic generation if nodes are missing but nodeCount is provided
        if (this.nodes.length === 0 && finalConfig.nodeCount) {
            this.generateRandomGraph(finalConfig.nodeCount, finalConfig.connectionThreshold || 20);
        }

        // Physics parameters
        this.repulsion = finalConfig.repulsion;
        this.linkDistance = finalConfig.linkDistance;
        this.damping = finalConfig.damping;
        this.enablePhysics = finalConfig.enablePhysics;

        // Internal State
        this.nodePositions = []; // Float32Array or Array of Vector3
        this.nodeVelocities = [];
        this.nodeData = new Map(); // id -> node object

        // Visual Components
        this.nodeMesh = null; // InstancedMesh
        this.linkMesh = null; // LineSegments
        this.highlightMesh = null;

        // Initialize physics data
        this.initPhysics();

        // Create visual elements
        this.create();
    }

    create() {
        if (!this.nodePositions || !this.nodePositions.length) return;

        console.log('NetworkGraph3D: Creating visualizations for', this.nodes.length, 'nodes');

        // Container
        this.graphGroup = new THREE.Group();
        this.group.add(this.graphGroup);

        this.createNodes();
        this.createLinks();
    }

    initPhysics() {
        // Initialize positions randomly within a sphere
        this.nodePositions = this.nodes.map(() => {
            return new THREE.Vector3(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            );
        });

        this.nodeVelocities = this.nodes.map(() => new THREE.Vector3(0, 0, 0));

        // Map IDs to indices for fast lookup
        this.nodes.forEach((n, i) => {
            this.nodeData.set(n.id, { index: i, ...n });
        });

        // Resolve link indices
        this.processedLinks = this.links.map(link => {
            const sourceIndex = this.nodeData.get(link.source)?.index;
            const targetIndex = this.nodeData.get(link.target)?.index;
            if (sourceIndex !== undefined && targetIndex !== undefined) {
                return { source: sourceIndex, target: targetIndex };
            }
            return null;
        }).filter(l => l !== null);
    }

    createNodes() {
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        // Use MeshPhongMaterial or Emissive for "Glow" effect
        const nodeColor = this.config.nodeColor || this.config.color || 0x00ffff;
        const material = new THREE.MeshPhongMaterial({
            color: nodeColor,
            emissive: nodeColor,
            emissiveIntensity: 2.0,
            shininess: 100
        });

        this.nodeMesh = new THREE.InstancedMesh(geometry, material, this.nodes.length);
        this.nodeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.nodeMesh.frustumCulled = false; // Important for dynamic instances

        this.updateNodeVisuals();
        this.graphGroup.add(this.nodeMesh);
    }

    createLinks() {
        // Use LineSegments for performance
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.processedLinks.length * 6); // 2 points * 3 coords

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const linkColor = this.config.linkColor || this.config.lineColor || 0xff00aa;
        const material = new THREE.LineBasicMaterial({
            color: linkColor,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.linkMesh = new THREE.LineSegments(geometry, material);
        this.linkMesh.frustumCulled = false; // Important for dynamic geometry
        this.graphGroup.add(this.linkMesh);
    }

    update(time, deltaTime) {
        if (this.enablePhysics) {
            this.stepPhysics(deltaTime || 0.016);
            this.updateNodeVisuals();
            this.updateLinkVisuals();
        }
    }

    stepPhysics(dt) {
        // Simple force-directed layout
        // 1. Repulsion (Nodes push apart)
        // 2. Attraction (Springs pull together)
        // 3. Center gravity (Keep graph centered)

        const force = new THREE.Vector3();
        const k = this.repulsion;
        const maxForce = 1000.0; // Safety cap

        // Reset forces? No, integrate directly into velocity

        // 1. Repulsion (N^2 complexity - optimize if needed)
        // For 100 nodes, 10,000 checks is fine.
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const p1 = this.nodePositions[i];
                const p2 = this.nodePositions[j];

                force.subVectors(p1, p2);
                const distSq = force.lengthSq();

                if (distSq > 0.1) {
                    const dist = Math.sqrt(distSq);
                    const f = k / distSq; // Coulomb

                    force.normalize().multiplyScalar(f * dt);

                    this.nodeVelocities[i].add(force);
                    this.nodeVelocities[j].sub(force);
                }
            }
        }

        // 2. Springs
        const springLen = this.linkDistance;
        const springStr = 0.5;

        this.processedLinks.forEach(link => {
            const i = link.source;
            const j = link.target;

            const p1 = this.nodePositions[i];
            const p2 = this.nodePositions[j];

            force.subVectors(p2, p1); // Vector from 1 to 2
            const dist = force.length();

            // Hooke's Law: F = k * (currentLen - restLen)
            const stretch = dist - springLen;
            const f = stretch * springStr * dt;

            force.normalize().multiplyScalar(f);

            this.nodeVelocities[i].add(force);
            this.nodeVelocities[j].sub(force);
        });

        // 3. Center Gravity & Integration
        const centerStr = 0.05;
        const maxVel = 50.0; // Limit speed

        this.nodePositions.forEach((pos, i) => {
            // Pull to center
            const centerForce = pos.clone().negate().multiplyScalar(centerStr * dt);
            this.nodeVelocities[i].add(centerForce);

            // Damping
            this.nodeVelocities[i].multiplyScalar(1.0 - this.damping);

            // Clamp velocity
            this.nodeVelocities[i].clampLength(0, maxVel);

            // Apply velocity
            pos.addScaledVector(this.nodeVelocities[i], dt);
        });
    }

    updateNodeVisuals() {
        if (!this.nodeMesh) return;
        const dummy = new THREE.Object3D();

        this.nodes.forEach((node, i) => {
            const pos = this.nodePositions[i];
            if (!pos) return;

            dummy.position.copy(pos);

            // Size based on value or default
            const scale = (node.val || 1) * this.config.nodeSize;
            dummy.scale.setScalar(scale);

            dummy.updateMatrix();
            this.nodeMesh.setMatrixAt(i, dummy.matrix);
        });

        if (this.nodeMesh && this.nodeMesh.instanceMatrix) {
            this.nodeMesh.instanceMatrix.needsUpdate = true;
        }
    }

    updateLinkVisuals() {
        if (!this.linkMesh) return;
        const positions = this.linkMesh.geometry.attributes.position.array;

        let idx = 0;
        this.processedLinks.forEach(link => {
            const s = this.nodePositions[link.source];
            const t = this.nodePositions[link.target];

            if (!s || !t) return;

            positions[idx++] = s.x;
            positions[idx++] = s.y;
            positions[idx++] = s.z;

            positions[idx++] = t.x;
            positions[idx++] = t.y;
            positions[idx++] = t.z;
        });

        this.linkMesh.geometry.attributes.position.needsUpdate = true;

        // Update bounding sphere for culling
        this.linkMesh.geometry.computeBoundingSphere();
    }

    /**
     * Generates a random set of nodes and connects them based on distance.
     */
    generateRandomGraph(count, threshold) {
        this.nodes = [];
        this.links = [];

        for (let i = 0; i < count; i++) {
            this.nodes.push({
                id: `node_${i}`,
                val: 0.5 + Math.random() * 1.0
            });
        }

        // Potential links (simple proximity-based generation if no links provided)
        // This is just to have something visible in demos that only provide nodeCount
        const tempPositions = this.nodes.map(() => new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40
        ));

        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                if (tempPositions[i].distanceTo(tempPositions[j]) < threshold) {
                    this.links.push({
                        source: this.nodes[i].id,
                        target: this.nodes[j].id
                    });
                }
            }
        }
    }

    // Add interaction methods later (raycasting InstancedMesh is tricky)
    getIntersectedNode(raycaster) {
        // Implement raycast against sphere bounding volumes manually
        // or check closest node to ray within threshold
    }
}
