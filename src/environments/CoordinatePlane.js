import * as THREE from 'three';

export class CoordinatePlane {
    constructor(scene, size = 100, divisions = 100) {
        this.scene = scene;
        this.grid = null;
        this.create(size, divisions);
    }

    create(size, divisions) {
        // Main Grid (Fine)
        const colorCenter = 0x00ffff; // Cyan center
        const colorGrid = 0x003366;   // Dark Blue lines

        this.grid = new THREE.GridHelper(size, divisions, colorCenter, colorGrid);

        // Make it transparent
        const material = this.grid.material;
        material.transparent = true;
        material.opacity = 0.3;
        material.depthWrite = false; // Don't block things behind it

        // Position slightly below zero to avoid z-fighting with floor elements
        this.grid.position.y = -2.0;

        this.scene.add(this.grid);

        // Secondary "Major" Grid (Larger squares)
        const majorGrid = new THREE.GridHelper(size, divisions / 10, 0x00ffff, 0x004488);
        majorGrid.position.y = -2.01;
        majorGrid.material.transparent = true;
        majorGrid.material.opacity = 0.5;
        this.scene.add(majorGrid);
    }
}
