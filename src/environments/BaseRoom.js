import * as THREE from 'three';

export class BaseRoom {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.backgroundGroup = new THREE.Group();
        this.lights = [];
        this.isActive = false;
    }
    
    create() {
        // Override in subclasses
        // Should add background elements to this.backgroundGroup
        // and add to scene: this.scene.add(this.backgroundGroup);
    }
    
    destroy() {
        // Remove background elements from scene
        if (this.backgroundGroup.parent) {
            this.scene.remove(this.backgroundGroup);
        }
        
        // Dispose geometries and materials
        this.backgroundGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                child.material?.dispose();
            }
        });
        
        // Remove lights
        this.lights.forEach(light => {
            this.scene.remove(light);
        });
        this.lights = [];
    }
    
    activate() {
        this.isActive = true;
        // Override in subclasses for activation logic
    }
    
    deactivate() {
        this.isActive = false;
        // Override in subclasses for deactivation logic
    }
    
    update() {
        // Override in subclasses for animations
    }
}
