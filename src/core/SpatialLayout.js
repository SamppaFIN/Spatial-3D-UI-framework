import * as THREE from 'three';

/**
 * SpatialLayout - Manages ergonomic placement of UI elements in 3D space.
 */
export class SpatialLayout {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.objects = []; // { mesh, zone, anchor, offset, smoothFactor }

        // Configuration for Zones
        this.zones = {
            direct: { distance: 0.4, scale: 0.2, height: -0.1 },  // Hand reach
            primary: { distance: 1.5, scale: 1.0, height: 0.0 },  // Focus
            peripheral: { distance: 4.0, scale: 3.0, height: 0.5 } // Background
        };
    }

    /**
     * Adds an object to a specific spatial zone.
     * @param {THREE.Object3D} object - The object to place.
     * @param {string} zoneType - 'direct', 'primary', or 'peripheral'.
     * @param {string} anchorType - 'world', 'body', or 'billboard'.
     */
    add(object, zoneType = 'primary', anchorType = 'world') {
        const zone = this.zones[zoneType] || this.zones.primary;

        // Set initial scale and position based on zone
        object.scale.setScalar(zone.scale);

        // Initial positioning (relative to current camera look)
        // We will refine this in the update loop for body-locked items
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0; // Flatten to horizon by default
        forward.normalize();

        const pos = this.camera.position.clone()
            .add(forward.multiplyScalar(zone.distance));
        pos.y += zone.height;

        if (anchorType === 'world') {
            object.position.copy(pos);
            object.lookAt(this.camera.position);
            this.scene.add(object);
        } else if (anchorType === 'body') {
            this.scene.add(object);
            // Verify object is in scene before tracking
        }

        this.objects.push({
            mesh: object,
            zone: zone,
            anchor: anchorType,
            // Store the "ideal" offset relative to camera for body-locking
            relativeOffset: new THREE.Vector3(0, zone.height, -zone.distance),
            currentVelocity: new THREE.Vector3()
        });
    }

    update(time, deltaTime) {
        // Handle Body-Locked (Tag-along) behavior
        this.objects.forEach(item => {
            if (item.anchor === 'body' || item.anchor === 'billboard') {
                this.updateBodyLocked(item, deltaTime);
            }

            if (item.anchor === 'billboard') {
                item.mesh.lookAt(this.camera.position);
            }
        });
    }

    updateBodyLocked(item, deltaTime) {
        // Calculate ideal position based on camera's current transform

        // 1. Get Camera Forward direction (flattened for comfort)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        // forward.y = 0; // Optional: Keep UI on horizon vs following gaze pitch
        forward.normalize();

        // 2. Deadzone Logic
        // Calculate angle between camera forward and direction to current object
        const toObject = new THREE.Vector3().subVectors(item.mesh.position, this.camera.position).normalize();

        // Handle edge case where object is at exact same position
        if (toObject.lengthSq() < 0.001) return;

        const angle = forward.angleTo(toObject);
        const deadzoneRad = THREE.MathUtils.degToRad(15); // 15 degree deadzone

        // Only update target if we are Looking Away from the object (outside deadzone)
        // OR if the object is too far/close (distance check - preventing drfit)
        const currentDist = item.mesh.position.distanceTo(this.camera.position);
        const desiredDist = item.zone.distance;
        const distDiff = Math.abs(currentDist - desiredDist);

        // We update if angle is large OR if distance is wrong (e.g. walking forward/back)
        if (angle > deadzoneRad || distDiff > 0.5) {
            // 3. Calculate target position (Where it SHOULD be)
            const targetPos = this.camera.position.clone()
                .add(forward.multiplyScalar(item.zone.distance));

            // Add height offset
            targetPos.y += item.zone.height;

            // 4. Lerp current position to target (Spring/Lag effect)
            // Use a stronger smooth factor when catching up, softer when settling
            const smoothTime = 0.3; // Slower/Heavier feel
            const factor = 1.0 - Math.pow(0.01, deltaTime / smoothTime);

            item.mesh.position.lerp(targetPos, factor);

            // Rotation: Lazy look-at for body-locked items
            if (item.anchor === 'body') {
                const targetQuat = new THREE.Quaternion();
                const lookMatrix = new THREE.Matrix4().lookAt(item.mesh.position, this.camera.position, new THREE.Vector3(0, 1, 0));
                targetQuat.setFromRotationMatrix(lookMatrix);
                item.mesh.quaternion.slerp(targetQuat, factor);
            }
        }
    }
}
