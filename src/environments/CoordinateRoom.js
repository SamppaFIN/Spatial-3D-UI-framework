import { BaseRoom } from './BaseRoom.js';
import * as THREE from 'three';

export class CoordinateRoom extends BaseRoom {
    create() {
        super.create();
        
        const size = 20;
        const divisions = 20;
        
        // Create grid helpers for each plane
        const gridXY = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
        gridXY.rotation.x = Math.PI / 2;
        gridXY.position.y = -size / 2;
        gridXY.renderOrder = -1;
        this.backgroundGroup.add(gridXY);
        
        const gridXZ = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
        gridXZ.position.y = 0;
        gridXZ.renderOrder = -1;
        this.backgroundGroup.add(gridXZ);
        
        const gridYZ = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
        gridYZ.rotation.z = Math.PI / 2;
        gridYZ.position.x = -size / 2;
        gridYZ.renderOrder = -1;
        this.backgroundGroup.add(gridYZ);
        
        // Create axes with colored lines
        const xAxisLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(size, 0, 0)
            ]),
            new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 })
        );
        xAxisLine.renderOrder = -1;
        this.backgroundGroup.add(xAxisLine);
        
        const yAxisLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, size, 0)
            ]),
            new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 })
        );
        yAxisLine.renderOrder = -1;
        this.backgroundGroup.add(yAxisLine);
        
        const zAxisLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, size)
            ]),
            new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 })
        );
        zAxisLine.renderOrder = -1;
        this.backgroundGroup.add(zAxisLine);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(size);
        axesHelper.renderOrder = -1;
        this.backgroundGroup.add(axesHelper);
        
        // Add to scene
        this.scene.add(this.backgroundGroup);
    }
    
    activate() {
        super.activate();
        this.backgroundGroup.visible = true;
    }
    
    deactivate() {
        super.deactivate();
        this.backgroundGroup.visible = false;
    }
}
