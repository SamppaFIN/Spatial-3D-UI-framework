import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * IKManipulator3D - Inverse Kinematics Control
 * 
 * Direct manipulation of 3D skeletal models via draggable end effector handles.
 * Supports CCD and FABRIK IK solvers with joint constraints.
 * 
 * @extends BaseControl3D
 */
export class IKManipulator3D extends BaseControl3D {
    constructor(scene, camera, position, config = {}) {
        // Initialize properties before super()
        const bones = config.bones || [];
        const endEffectors = config.endEffectors || [];
        const solver = config.solver || 'CCD';
        const constraints = config.constraints || {};
        const iterations = config.iterations || 10;
        const tolerance = config.tolerance || 0.01;
        const showBones = config.showBones !== false;
        const handleRadius = config.handleRadius || 0.2;
        const onUpdate = config.onUpdate || null;

        super(scene, camera, position, config);

        // Assign to instance properties
        this.bones = bones;
        this.endEffectors = endEffectors;
        this.solver = solver;
        this.constraints = constraints;
        this.iterations = iterations;
        this.tolerance = tolerance;
        this.showBones = showBones;
        this.handleRadius = handleRadius;
        this.onUpdate = onUpdate;

        // State
        this.handles = [];
        this.boneLines = [];
        this.activeHandle = null;
        this.isDragging = false;

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

        // Create components
        this.create();

        // Setup interaction
        this.setupInteraction();
    }

    /**
     * Create the IK manipulator components
     */
    create() {
        if (!this.bones || this.bones.length === 0) {
            return;
        }

        this.createHandles();

        if (this.showBones) {
            this.updateBoneVisualization();
        }
    }

    /**
     * Create draggable end effector handles
     */
    createHandles() {
        this.endEffectors.forEach((effector, index) => {
            const geometry = new THREE.SphereGeometry(this.handleRadius, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0xff6b9d,
                emissive: 0xff6b9d,
                emissiveIntensity: 0.3,
                metalness: 0.7,
                roughness: 0.3
            });

            const handle = new THREE.Mesh(geometry, material);
            handle.userData.effectorIndex = index;
            handle.userData.isIKHandle = true;

            // Position at bone tip
            const pos = new THREE.Vector3();
            effector.bone.getWorldPosition(pos);
            handle.position.copy(pos);

            this.handles.push(handle);
            this.group.add(handle);
        });
    }

    /**
     * Update bone visualization (wireframe)
     */
    updateBoneVisualization() {
        // Clear previous lines
        this.boneLines.forEach(line => this.group.remove(line));
        this.boneLines = [];

        // Create lines for each bone
        this.bones.forEach(bone => {
            if (!bone.parent || !bone.parent.isBone) return;

            const points = [];
            const parentPos = new THREE.Vector3();
            const bonePos = new THREE.Vector3();

            bone.parent.getWorldPosition(parentPos);
            bone.getWorldPosition(bonePos);

            points.push(parentPos, bonePos);

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                linewidth: 2
            });

            const line = new THREE.Line(geometry, material);
            this.boneLines.push(line);
            this.group.add(line);
        });
    }

    /**
     * Setup mouse/touch interaction
     */
    setupInteraction() {
        this.boundOnMouseDown = this.onMouseDown.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnMouseUp = this.onMouseUp.bind(this);

        window.addEventListener('mousedown', this.boundOnMouseDown);
        window.addEventListener('mousemove', this.boundOnMouseMove);
        window.addEventListener('mouseup', this.boundOnMouseUp);
    }

    /**
     * Handle mouse down - start dragging
     */
    onMouseDown(event) {
        if (!this.isEnabled) return;

        const canvas = event.target?.closest('canvas');
        if (!canvas) return;

        // Get mouse position
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast to check if handle was clicked
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.handles);

        if (intersects.length > 0) {
            this.activeHandle = intersects[0].object;
            this.isDragging = true;

            // Visual feedback
            this.activeHandle.material.emissiveIntensity = 0.8;
            document.body.style.cursor = 'grabbing';
        }
    }

    /**
     * Handle mouse move - update target position
     */
    onMouseMove(event) {
        if (!this.isDragging) return;

        const canvas = event.target?.closest('canvas');
        if (!canvas) return;

        // Get mouse position
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast to get world position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Intersect with drag plane
        const worldPoint = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.dragPlane, worldPoint);

        if (worldPoint) {
            // Update target position
            const effectorIndex = this.activeHandle.userData.effectorIndex;
            this.setTarget(effectorIndex, worldPoint);
        }
    }

    /**
     * Handle mouse up - stop dragging
     */
    onMouseUp(event) {
        if (this.isDragging && this.activeHandle) {
            this.isDragging = false;

            // Reset visual feedback
            this.activeHandle.material.emissiveIntensity = 0.3;
            this.activeHandle = null;
            document.body.style.cursor = 'default';
        }
    }

    /**
     * Set target position for end effector
     */
    setTarget(effectorIndex, targetPosition) {
        const effector = this.endEffectors[effectorIndex];
        if (!effector) return;

        // Build bone chain from root to end effector
        const chain = this.buildChain(effector.bone, effector.chainLength);

        // Solve IK
        if (this.solver === 'CCD') {
            this.solveCCD(chain, targetPosition);
        } else if (this.solver === 'FABRIK') {
            this.solveFABRIK(chain, targetPosition);
        }

        // Update handle position
        const handle = this.handles[effectorIndex];
        if (handle) {
            handle.position.copy(targetPosition);
        }

        // Update bone visualization
        if (this.showBones) {
            this.updateBoneVisualization();
        }

        // Trigger callback
        if (this.onUpdate) {
            this.onUpdate(chain, targetPosition);
        }
    }

    /**
     * Build bone chain from end effector to root
     */
    buildChain(endBone, chainLength) {
        const chain = [];
        let current = endBone;
        let count = 0;

        while (current && count < chainLength) {
            chain.unshift(current);
            current = current.parent?.isBone ? current.parent : null;
            count++;
        }

        return chain;
    }

    /**
     * CCD (Cyclic Coordinate Descent) IK Solver
     */
    solveCCD(chain, target) {
        if (chain.length === 0) return;

        for (let iter = 0; iter < this.iterations; iter++) {
            // Traverse from end to root
            for (let i = chain.length - 1; i >= 0; i--) {
                const bone = chain[i];
                const endEffector = chain[chain.length - 1];

                // Get world positions
                const bonePos = new THREE.Vector3();
                bone.getWorldPosition(bonePos);

                const effectorPos = new THREE.Vector3();
                endEffector.getWorldPosition(effectorPos);

                // Calculate vectors
                const toEffector = effectorPos.clone().sub(bonePos).normalize();
                const toTarget = target.clone().sub(bonePos).normalize();

                // Calculate rotation axis and angle
                const axis = new THREE.Vector3().crossVectors(toEffector, toTarget);
                const axisLength = axis.length();

                if (axisLength < 0.001) continue; // Vectors are parallel

                axis.normalize();
                const angle = Math.acos(THREE.MathUtils.clamp(toEffector.dot(toTarget), -1, 1));

                // Apply rotation in local space
                if (angle > 0.001) {
                    // Convert to local space
                    const worldToLocal = new THREE.Matrix4();
                    if (bone.parent) {
                        bone.parent.updateWorldMatrix(true, false);
                        worldToLocal.copy(bone.parent.matrixWorld).invert();
                    }

                    const localAxis = axis.clone().applyMatrix4(worldToLocal).normalize();
                    const rotation = new THREE.Quaternion().setFromAxisAngle(localAxis, angle);

                    bone.quaternion.multiply(rotation);
                    bone.updateMatrixWorld(true);

                    // Apply constraints
                    this.applyConstraints(bone);
                }
            }

            // Check if converged
            const effectorPos = new THREE.Vector3();
            chain[chain.length - 1].getWorldPosition(effectorPos);

            if (effectorPos.distanceTo(target) < this.tolerance) {
                break;
            }
        }
    }

    /**
     * FABRIK (Forward And Backward Reaching IK) Solver
     */
    solveFABRIK(chain, target) {
        if (chain.length === 0) return;

        // Store original positions
        const positions = chain.map(bone => {
            const pos = new THREE.Vector3();
            bone.getWorldPosition(pos);
            return pos;
        });

        // Store bone lengths
        const lengths = [];
        for (let i = 0; i < chain.length - 1; i++) {
            lengths.push(positions[i].distanceTo(positions[i + 1]));
        }

        const rootPos = positions[0].clone();

        for (let iter = 0; iter < this.iterations; iter++) {
            // Forward reaching (from end to root)
            positions[positions.length - 1].copy(target);

            for (let i = positions.length - 2; i >= 0; i--) {
                const direction = positions[i].clone().sub(positions[i + 1]).normalize();
                positions[i].copy(positions[i + 1]).add(direction.multiplyScalar(lengths[i]));
            }

            // Backward reaching (from root to end)
            positions[0].copy(rootPos);

            for (let i = 0; i < positions.length - 1; i++) {
                const direction = positions[i + 1].clone().sub(positions[i]).normalize();
                positions[i + 1].copy(positions[i]).add(direction.multiplyScalar(lengths[i]));
            }

            // Check convergence
            if (positions[positions.length - 1].distanceTo(target) < this.tolerance) {
                break;
            }
        }

        // Apply positions to bones
        this.applyPositionsToBones(chain, positions);
    }

    /**
     * Apply calculated positions to bone rotations
     */
    applyPositionsToBones(chain, positions) {
        for (let i = 0; i < chain.length - 1; i++) {
            const bone = chain[i];
            const nextBone = chain[i + 1];

            // Get current direction
            const currentDir = new THREE.Vector3();
            nextBone.getWorldPosition(currentDir);
            const bonePos = new THREE.Vector3();
            bone.getWorldPosition(bonePos);
            currentDir.sub(bonePos).normalize();

            // Get target direction
            const targetDir = positions[i + 1].clone().sub(positions[i]).normalize();

            // Calculate rotation
            const axis = new THREE.Vector3().crossVectors(currentDir, targetDir);
            const axisLength = axis.length();

            if (axisLength < 0.001) continue;

            axis.normalize();
            const angle = Math.acos(THREE.MathUtils.clamp(currentDir.dot(targetDir), -1, 1));

            // Apply rotation in local space
            const worldToLocal = new THREE.Matrix4();
            if (bone.parent) {
                bone.parent.updateWorldMatrix(true, false);
                worldToLocal.copy(bone.parent.matrixWorld).invert();
            }

            const localAxis = axis.clone().applyMatrix4(worldToLocal).normalize();
            const rotation = new THREE.Quaternion().setFromAxisAngle(localAxis, angle);

            bone.quaternion.multiply(rotation);
            bone.updateMatrixWorld(true);

            // Apply constraints
            this.applyConstraints(bone);
        }
    }

    /**
     * Apply joint constraints
     */
    applyConstraints(bone) {
        const constraint = this.constraints[bone.uuid];
        if (!constraint) return;

        switch (constraint.type) {
            case 'hinge':
                this.applyHingeConstraint(bone, constraint);
                break;
            case 'ball':
                this.applyBallConstraint(bone, constraint);
                break;
            case 'fixed':
                bone.quaternion.identity();
                break;
        }
    }

    /**
     * Apply hinge joint constraint (single axis rotation)
     */
    applyHingeConstraint(bone, constraint) {
        const euler = new THREE.Euler().setFromQuaternion(bone.quaternion, 'XYZ');

        // Determine which axis to constrain based on constraint.axis
        const axis = constraint.axis || new THREE.Vector3(0, 1, 0);

        if (Math.abs(axis.x) > 0.9) {
            euler.x = THREE.MathUtils.clamp(euler.x, constraint.minAngle, constraint.maxAngle);
        } else if (Math.abs(axis.y) > 0.9) {
            euler.y = THREE.MathUtils.clamp(euler.y, constraint.minAngle, constraint.maxAngle);
        } else if (Math.abs(axis.z) > 0.9) {
            euler.z = THREE.MathUtils.clamp(euler.z, constraint.minAngle, constraint.maxAngle);
        }

        bone.quaternion.setFromEuler(euler);
    }

    /**
     * Apply ball joint constraint (cone limit)
     */
    applyBallConstraint(bone, constraint) {
        const euler = new THREE.Euler().setFromQuaternion(bone.quaternion, 'XYZ');
        const maxAngle = constraint.maxAngle || Math.PI / 4;

        // Clamp each axis to max angle
        euler.x = THREE.MathUtils.clamp(euler.x, -maxAngle, maxAngle);
        euler.y = THREE.MathUtils.clamp(euler.y, -maxAngle, maxAngle);
        euler.z = THREE.MathUtils.clamp(euler.z, -maxAngle, maxAngle);

        bone.quaternion.setFromEuler(euler);
    }

    /**
     * Update method called each frame
     */
    update() {
        // Animate handles
        this.handles.forEach((handle, index) => {
            if (handle !== this.activeHandle) {
                const time = Date.now() * 0.001;
                handle.material.emissiveIntensity = 0.3 + Math.sin(time * 2 + index) * 0.1;
            }
        });
    }

    /**
     * Dispose of resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('mousedown', this.boundOnMouseDown);
        window.removeEventListener('mousemove', this.boundOnMouseMove);
        window.removeEventListener('mouseup', this.boundOnMouseUp);

        // Dispose bone lines
        this.boneLines.forEach(line => {
            line.geometry?.dispose();
            line.material?.dispose();
        });

        // Call parent dispose
        super.dispose();
    }
}
