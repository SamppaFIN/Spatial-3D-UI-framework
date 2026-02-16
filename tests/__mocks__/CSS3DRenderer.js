/**
 * Mock for three/addons/renderers/CSS3DRenderer.js
 */
import { Object3D } from '../__mocks__/three.js';

export class CSS3DRenderer {
    constructor() {
        this.domElement = document.createElement('div');
    }
    setSize() { }
    render() { }
}

export class CSS3DObject extends Object3D {
    constructor(element) {
        super();
        this.element = element;
    }
}
