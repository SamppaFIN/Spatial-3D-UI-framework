/**
 * Mock for three/addons/controls/TransformControls.js
 */
import { vi } from 'vitest';
import { Object3D } from '../__mocks__/three.js';

export class TransformControls extends Object3D {
    constructor(camera, domElement) {
        super();
        this.visible = false;
        this.enabled = false;
        this.camera = camera;
        this.domElement = domElement;
    }
    attach() { }
    detach() { }
    dispose() { }
    setMode() { }
    setSpace() { }
    setSize() { }
    addEventListener(event, cb) { this[`_on_${event}`] = cb; }
    removeEventListener() { }
    update() { }
}
