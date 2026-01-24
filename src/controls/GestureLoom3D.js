import { BaseControl3D } from '../core/BaseControl3D.js';
import * as THREE from 'three';

/**
 * GestureLoom3D
 * A spatial interface for connecting nodes with "holographic threads".
 * Users can drag from one node to another to create connections (synapses).
 */
export class GestureLoom3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        this.nodes = [];
        this.connections = [];
        this.activeLine = null;
        this.startNode = null;

        // Config
        this.nodeColor = config.nodeColor || 0x00ffcc;
        this.lineColor = config.lineColor || 0xff00ff;
        this.nodeSize = config.nodeSize || 0.2;
        this.maxConnections = config.maxConnections || 99;

        // Groups
        this.nodesGroup = new THREE.Group();
        this.linesGroup = new THREE.Group();
        this.group.add(this.nodesGroup);
        this.group.add(this.linesGroup);

        // Raycaster for internal interaction
        this.loomRaycaster = new THREE.Raycaster();
    }

    create() {
        // No default mesh, it's a container
    }

    addNode(position = [0, 0, 0], data = {}) {
        const geometry = new THREE.SphereGeometry(this.nodeSize, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: this.nodeColor,
            emissive: this.nodeColor,
            emissiveIntensity: 0.5,
            shininess: 100
        });

        const node = new THREE.Mesh(geometry, material);
        if (Array.isArray(position)) {
            node.position.set(...position);
        } else {
            node.position.copy(position);
        }

        // Custom data
        node.userData = {
            isLoomNode: true,
            id: Math.random().toString(36).substr(2, 9),
            ...data
        };

        this.nodesGroup.add(node);
        this.nodes.push(node);
        return node;
    }

    // Override Raycasting to checking Nodes specifically
    // BaseControl3D.js checks interaction with `this.group.children`.
    // Since nodes are children, it should work, but we need specific logic for "Drag Start" vs "Drag End"

    onMouseDown(event) {
        if (!this.isEnabled || !this.camera) return;

        // Manually check intersection with nodes
        const intersect = this.checkNodeIntersection(event);

        if (intersect) {
            this.startNode = intersect.object;
            this.isDrawing = true;

            // Create temporary active line
            const geometry = new THREE.BufferGeometry().setFromPoints([
                this.startNode.position,
                this.startNode.position.clone() // End point (will follow mouse)
            ]);

            const material = new THREE.LineBasicMaterial({
                color: this.lineColor,
                opacity: 0.5,
                transparent: true,
                linewidth: 2
            });

            this.activeLine = new THREE.Line(geometry, material);
            this.linesGroup.add(this.activeLine);

            this.emit('drawStart', { node: this.startNode });
        }
    }

    onMouseMove(event) {
        super.onMouseMove(event);

        if (this.isDrawing && this.activeLine && this.startNode) {
            // Update line end position to follow mouse in 3D
            const mousePos = this.getMouse3D(event);

            if (mousePos) {
                const positions = this.activeLine.geometry.attributes.position.array;
                // Update 2nd point (indices 3, 4, 5)
                positions[3] = mousePos.x - this.group.position.x; // Local space
                positions[4] = mousePos.y - this.group.position.y;
                positions[5] = mousePos.z - this.group.position.z;
                this.activeLine.geometry.attributes.position.needsUpdate = true;
            }
        }
    }

    onMouseUp(event) {
        if (this.isDrawing) {
            // Check if we hit another node
            const intersect = this.checkNodeIntersection(event);

            if (intersect && intersect.object !== this.startNode) {
                // Complete connection
                this.createConnection(this.startNode, intersect.object);
                this.emit('connectionCreated', { from: this.startNode, to: intersect.object });
            }

            // Cleanup
            if (this.activeLine) {
                this.linesGroup.remove(this.activeLine);
                this.activeLine.geometry.dispose();
                this.activeLine.material.dispose();
                this.activeLine = null;
            }

            this.isDrawing = false;
            this.startNode = null;
        }
        super.onMouseUp(event);
    }

    createConnection(nodeA, nodeB) {
        // Prevent duplicates
        const exists = this.connections.find(c =>
            (c.from === nodeA && c.to === nodeB) || (c.from === nodeB && c.to === nodeA)
        );
        if (exists) return;

        // Create permanent line
        const geometry = new THREE.BufferGeometry().setFromPoints([
            nodeA.position,
            nodeB.position
        ]);

        const material = new THREE.LineBasicMaterial({
            color: this.lineColor,
            opacity: 0.8,
            transparent: true,
            linewidth: 2
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { from: nodeA, to: nodeB, pulse: 0 };

        this.linesGroup.add(line);
        this.connections.push({ line, from: nodeA, to: nodeB });

        // Trigger "pulse" animation
        this.triggerPulse(line);
    }

    triggerPulse(line) {
        // Add visual pulse particle/effect here
        // For now, simpler: we'll handle continuous pulses in update()
    }

    update() {
        // Animate pulses
        const time = Date.now() * 0.001;
        this.connections.forEach(conn => {
            // Visual effect: Pulse opacity or thickness
            conn.line.material.opacity = 0.5 + Math.sin(time * 5 + conn.line.id) * 0.3;
        });

        // Rotate nodes slightly
        this.nodes.forEach((node, i) => {
            // Idle breathing
            node.scale.setScalar(1.0 + Math.sin(time * 2 + i) * 0.1);
        });
    }

    // Creating this helper because checking intersection with specific nodes is cleaner
    // than generic checkIntersection
    checkNodeIntersection(event) {
        if (!this.camera) return null;

        const canvas = event.target?.closest('canvas') || document.querySelector('canvas');
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        this.loomRaycaster.setFromCamera(mouse, this.camera);
        const intersects = this.loomRaycaster.intersectObjects(this.nodesGroup.children, false);

        return intersects.length > 0 ? intersects[0] : null;
    }

    // Helper to get 3D position of mouse on a plane (usually z=0 or facing camera)
    getMouse3D(event) {
        if (!this.camera) return null;

        const canvas = event.target?.closest('canvas') || document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        this.loomRaycaster.setFromCamera(mouse, this.camera);

        // Create an imaginary plane at the depth of the start node facing the camera
        const planeZ = this.startNode ? this.startNode.position.z : 0;
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
        const target = new THREE.Vector3();

        this.loomRaycaster.ray.intersectPlane(plane, target);
        return target;
    }
}
