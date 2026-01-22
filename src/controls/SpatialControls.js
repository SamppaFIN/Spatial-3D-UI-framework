import * as THREE from 'three';
import { AudioHaptics } from '../utils/AudioHaptics.js';

/**
 * SpatialControls - Game-like navigation for 3D UI
 * 
 * Controls:
 * - WASD / Arrows: Move camera (fly mode)
 * - Q / E: Up / Down
 * - Right Mouse Drag: Look around
 * - Left Mouse Click: Select object
 * - Double Click: Focus (fly to object)
 */
export class SpatialControls {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.domElement = domElement;
        this.scene = scene;

        // Configuration
        this.moveSpeed = 10.0; // Increased from 2.0
        this.lookSpeed = 0.002;
        this.enableDamping = true;
        this.dampingFactor = 0.05;
        this.minDistance = 0.5; // Stop before hitting object
        this.focusDuration = 1.0; // Seconds

        // Hover / Pop State
        this.hoveredObject = null;
        this.hoverOriginalPos = new THREE.Vector3();
        this.hoverPopDistance = 0.2; // How much it pops towards camera

        // Audio
        this.audio = new AudioHaptics(camera);

        // State
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        this.velocity = new THREE.Vector3();
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.isFocusing = false; // Is currently animating to target?
        this.focusTarget = null;
        this.focusStartPos = new THREE.Vector3();
        this.focusStartTime = 0;

        // Selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedObject = null;
        this.hoveredObject = null;

        // Orientation (Euler)
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.euler.setFromQuaternion(camera.quaternion);

        // Passive Affordance: Cursor Flashlight
        this.cursorLight = new THREE.PointLight(0xaaccff, 0, 10); // Start off, Blue-ish tint
        this.cursorLight.castShadow = true;
        this.scene.add(this.cursorLight);

        this.initEvents();
        console.log("SpatialControls: Initialized");
    }

    initEvents() {
        // Keyboard
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Mouse
        this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.domElement.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        this.domElement.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault()); // Block context menu
    }

    onKeyDown(event) {
        console.log("Key Down:", event.code); // Debug log (Uncommented)
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': this.keys.forward = true; break;
            case 'ArrowLeft':
            case 'KeyA': this.keys.left = true; break;
            case 'ArrowDown':
            case 'KeyS': this.keys.backward = true; break;
            case 'ArrowRight':
            case 'KeyD': this.keys.right = true; break;
            case 'KeyE': this.keys.up = true; break;
            case 'KeyQ': this.keys.down = true; break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': this.keys.forward = false; break;
            case 'ArrowLeft':
            case 'KeyA': this.keys.left = false; break;
            case 'ArrowDown':
            case 'KeyS': this.keys.backward = false; break;
            case 'ArrowRight':
            case 'KeyD': this.keys.right = false; break;
            case 'KeyE': this.keys.up = false; break;
            case 'KeyQ': this.keys.down = false; break;
        }
    }

    onMouseDown(event) {
        // Allow BOTH Left (0) and Right (2) to drag
        if (event.button === 0 || event.button === 2) {
            this.isDragging = true;
            this.dragButton = event.button; // Track button: 0=Pan, 2=Look
            this.domElement.style.cursor = 'grabbing';
            this.dragStartX = event.clientX;
            this.dragStartY = event.clientY;
        }
    }

    onMouseUp(event) {
        if (event.button === 0 || event.button === 2) {
            this.isDragging = false;
            this.dragButton = -1;
            this.domElement.style.cursor = 'default';

            // Check if it was a click (no movement)
            const dist = Math.sqrt(
                Math.pow(event.clientX - this.dragStartX, 2) +
                Math.pow(event.clientY - this.dragStartY, 2)
            );

            // Only treat as click if moved less than 5 pixels AND was Left Button
            if (dist < 5 && event.button === 0) {
                this.handleSelection(event);
            }
        }
    }

    onWheel(event) {
        event.preventDefault();

        // Infinite zoom: Adjust position along the forward vector
        // Normalizing deltaY to handle different mouse wheel speeds
        const delta = Math.sign(event.deltaY) * -1.0;
        const zoomSpeed = 2.0; // Adjust as needed for "feel"

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.camera.position.add(forward.multiplyScalar(delta * zoomSpeed));
    }

    onMouseMove(event) {
        // Handle Hover Pop
        this.checkHover(event);

        if (this.isDragging) {
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            if (this.dragButton === 2) {
                // Right Drag: Look (Rotate)
                this.euler.y -= movementX * this.lookSpeed;
                this.euler.x -= movementY * this.lookSpeed;
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
                this.camera.quaternion.setFromEuler(this.euler);
            } else if (this.dragButton === 0) {
                // Left Drag: Pan (Move 2D)
                // Move camera locally X and Y relative to view
                const panSpeed = 0.05; // Sensitivity
                const offset = new THREE.Vector3(-movementX * panSpeed, movementY * panSpeed, 0);
                offset.applyQuaternion(this.camera.quaternion);
                this.camera.position.add(offset);
            }
        }
    }

    checkHover(event) {
        // Don't hover while dragging/panning
        if (this.isDragging) return;

        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // Update Cursor Flashlight Position
        if (intersects.length > 0) {
            const hit = intersects[0];
            // Small offset along normal to prevent self-shadowing
            // If normal is undefined (e.g. Lines), just use point
            const offset = hit.face ? hit.face.normal.clone().multiplyScalar(0.5) : new THREE.Vector3(0, 0, 0);
            this.cursorLight.position.copy(hit.point).add(offset);
            this.cursorLight.intensity = 1.2;
        } else {
            this.cursorLight.intensity = 0;
        }

        const target = intersects.find(hit => hit.object.visible && hit.object.type === 'Mesh' && !hit.object.isPoints);

        if (target) {
            if (this.hoveredObject !== target.object) {
                this.resetHover(); // Reset prev

                // Set new
                this.hoveredObject = target.object;
                this.hoverOriginalPos.copy(this.hoveredObject.position);

                // Dynamic Z-Pop: Move towards camera local axis
                const direction = new THREE.Vector3().subVectors(this.camera.position, this.hoveredObject.position).normalize();
                this.hoveredObject.position.add(direction.multiplyScalar(this.hoverPopDistance));

                // Emissive Glow (Passive Affordance)
                if (this.hoveredObject.material && 'emissive' in this.hoveredObject.material) {
                    this.hoveredObject.userData.originalEmissive = this.hoveredObject.material.emissive.getHex();
                    this.hoveredObject.material.emissive.setHex(0x3333aa);
                }

                // Play hover sound
                this.audio.playHover(this.hoveredObject);

                // Cursor feedback
                this.domElement.style.cursor = 'pointer';
            }
        } else {
            this.resetHover();
        }
    }

    resetHover() {
        if (this.hoveredObject) {
            // Restore position
            this.hoveredObject.position.copy(this.hoverOriginalPos);

            // Restore Emissive
            if (this.hoveredObject.material && 'emissive' in this.hoveredObject.material) {
                if (this.hoveredObject.userData.originalEmissive !== undefined) {
                    this.hoveredObject.material.emissive.setHex(this.hoveredObject.userData.originalEmissive);
                }
            }

            this.hoveredObject = null;
            this.domElement.style.cursor = 'default';
        }
    }

    handleSelection(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Find intersections
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            // Filter out skyboxes etc
            const target = intersects.find(hit => hit.object.visible && hit.object.type === 'Mesh' && !hit.object.isPoints);

            if (target) {
                console.log('Clicked:', target.object);

                // Audio Feedback
                this.audio.playClick(target.object);

                if (this.selectedObject !== target.object) {
                    this.selectedObject = target.object;
                    console.log('Selected New:', this.selectedObject);
                    // Add selection feedback logic here (e.g. outline)

                    // Simple feedback: flash emissive
                    if (this.selectedObject.material && this.selectedObject.material.emissive) {
                        const oldEmissive = this.selectedObject.material.emissive.getHex();
                        this.selectedObject.material.emissive.setHex(0xffffff);
                        setTimeout(() => {
                            if (this.selectedObject) this.selectedObject.material.emissive.setHex(oldEmissive);
                        }, 200);
                    }
                }
            } else {
                console.log('No valid mesh target found (ignored points/lines)');
                this.selectedObject = null;
            }
        } else {
            console.log('No intersection');
            this.selectedObject = null;
        }
    }

    onDoubleClick(event) {
        // Re-use logic to get target, then focus
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const target = intersects.find(hit => hit.object.visible && hit.object.type === 'Mesh');

        if (target) {
            this.focusOn(target.object);
        }
    }

    focusOn(object) {
        this.isFocusing = true;
        this.focusStartPos.copy(this.camera.position);

        // Calculate desired position: front of object
        // Use object's world position + some offset
        const targetWorldPos = new THREE.Vector3();
        object.getWorldPosition(targetWorldPos);

        const direction = new THREE.Vector3().subVectors(this.camera.position, targetWorldPos).normalize();

        // Ensure we don't end up inside
        // Box3 check would be better, but simplified for now
        let distance = 2.0;
        if (object.geometry) {
            object.geometry.computeBoundingSphere();
            distance = (object.geometry.boundingSphere.radius || 1) * 3.0;
        }

        this.targetPos = targetWorldPos.clone().add(direction.multiplyScalar(distance));

        // Look at target during transition
        this.focusLookAt = targetWorldPos;
        this.focusStartTime = performance.now();
    }

    update(delta) {
        // debug log if keys pressed
        const moving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right || this.keys.up || this.keys.down;
        if (moving) {
            console.log("Moving:", this.keys, "Delta:", delta, "Speed:", this.moveSpeed * delta);
        }

        // 1. Handle Focus Animation
        if (this.isFocusing) {
            const now = performance.now();
            const elapsed = (now - this.focusStartTime) / 1000;
            const t = Math.min(elapsed / this.focusDuration, 1.0);

            // Ease out cubic
            const ease = 1 - Math.pow(1 - t, 3);

            this.camera.position.lerpVectors(this.focusStartPos, this.targetPos, ease);
            this.camera.lookAt(this.focusLookAt);

            // Update internal euler to match new look direction so it doesn't snap back
            if (t >= 1.0) {
                this.isFocusing = false;
                this.euler.setFromQuaternion(this.camera.quaternion);
            }
            return; // Skip manual movement while focusing
        }

        // 2. Handle Manual Movement
        this.velocity.set(0, 0, 0);

        if (this.keys.forward) this.velocity.z -= 1;
        if (this.keys.backward) this.velocity.z += 1;
        if (this.keys.left) this.velocity.x -= 1;
        if (this.keys.right) this.velocity.x += 1;
        if (this.keys.up) this.velocity.y += 1;
        if (this.keys.down) this.velocity.y -= 1;

        if (this.velocity.lengthSq() > 0) {
            this.velocity.normalize().multiplyScalar(this.moveSpeed * delta);
            // Apply rotation to velocity (move where we look)
            this.velocity.applyQuaternion(this.camera.quaternion);
            this.camera.position.add(this.velocity);
        }
    }
}
