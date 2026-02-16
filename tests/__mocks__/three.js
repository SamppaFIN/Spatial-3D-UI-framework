/**
 * Minimal Three.js mock for unit testing.
 * Provides stub classes so BaseControl3D and controls can be instantiated
 * without a real WebGL context.
 */
import { vi } from 'vitest';

// --- Vector / Math ---
export class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    set(x, y) { this.x = x; this.y = y; return this; }
    clone() { return new Vector2(this.x, this.y); }
}

export class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    clone() { return new Vector3(this.x, this.y, this.z); }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    toArray() { return [this.x, this.y, this.z]; }
    fromArray(arr) { this.x = arr[0]; this.y = arr[1]; this.z = arr[2]; return this; }
    lerpVectors(a, b, t) { this.x = a.x + (b.x - a.x) * t; this.y = a.y + (b.y - a.y) * t; this.z = a.z + (b.z - a.z) * t; return this; }
}

export class Euler {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    toArray() { return [this.x, this.y, this.z, 'XYZ']; }
    fromArray(arr) { this.x = arr[0]; this.y = arr[1]; this.z = arr[2]; return this; }
}

export class Color {
    constructor(c) { this.value = c; }
    set(c) { this.value = c; }
    clone() { return new Color(this.value); }
}

export class Box3 {
    constructor() { this.min = new Vector3(-1, -1, -1); this.max = new Vector3(1, 1, 1); }
    setFromObject() { return this; }
    getCenter(target) { target.set(0, 0, 0); return target; }
    getSize(target) { target.set(2, 2, 2); return target; }
}

// --- Object3D hierarchy ---
export class Object3D {
    constructor() {
        this.children = [];
        this.parent = null;
        this.position = new Vector3();
        this.rotation = new Euler();
        this.scale = new Vector3(1, 1, 1);
        this.visible = true;
        this.userData = {};
    }
    add(child) { this.children.push(child); child.parent = this; }
    remove(child) { this.children = this.children.filter(c => c !== child); child.parent = null; }
    traverse(callback) { callback(this); this.children.forEach(c => c.traverse ? c.traverse(callback) : callback(c)); }
}

export class Group extends Object3D {
    constructor() { super(); this.type = 'Group'; }
}

export class Mesh extends Object3D {
    constructor(geometry, material) {
        super();
        this.type = 'Mesh';
        this.geometry = geometry || { dispose: vi.fn() };
        this.material = material || { dispose: vi.fn(), color: new Color(0xffffff) };
    }
}

// --- Scene ---
export class Scene extends Object3D {
    constructor() { super(); this.background = null; this.fog = null; }
}

// --- Camera ---
export class PerspectiveCamera extends Object3D {
    constructor(fov = 75) {
        super();
        this.fov = fov;
        this.aspect = 1;
        this.near = 0.1;
        this.far = 1000;
    }
    lookAt() { }
    updateProjectionMatrix() { }
}

// --- Fog ---
export class Fog {
    constructor(color, near, far) { this.color = color; this.near = near; this.far = far; }
}

// --- Geometry stubs ---
export class BoxGeometry { dispose() { } }
export class SphereGeometry { dispose() { } }
export class IcosahedronGeometry { dispose() { } }
export class CylinderGeometry { dispose() { } }
export class PlaneGeometry { dispose() { } }

// --- Material stubs ---
export class MeshStandardMaterial {
    constructor(opts = {}) { Object.assign(this, { color: new Color(0xffffff), ...opts }); }
    dispose() { }
}
export class MeshBasicMaterial {
    constructor(opts = {}) { Object.assign(this, opts); }
    dispose() { }
}
export class MeshPhysicalMaterial {
    constructor(opts = {}) { Object.assign(this, opts); }
    dispose() { }
}

// --- Light stubs ---
export class AmbientLight extends Object3D { constructor() { super(); } }
export class DirectionalLight extends Object3D { constructor() { super(); } }
export class PointLight extends Object3D { constructor() { super(); } }

// --- Raycaster ---
export class Raycaster {
    constructor() { this._intersects = []; }
    setFromCamera() { }
    intersectObjects() { return this._intersects; }
}

// --- Texture / loader stubs ---
export class TextureLoader {
    load(url, cb) { const t = { image: {} }; if (cb) cb(t); return t; }
}

// --- WebGLRenderer stub ---
export class WebGLRenderer {
    constructor() {
        this.domElement = document.createElement('canvas');
        this.shadowMap = { enabled: false };
    }
    setSize() { }
    setPixelRatio() { }
    render() { }
    dispose() { }
}

export default {
    Vector2, Vector3, Euler, Color, Box3,
    Object3D, Group, Mesh, Scene,
    PerspectiveCamera, Fog,
    BoxGeometry, SphereGeometry, IcosahedronGeometry, CylinderGeometry, PlaneGeometry,
    MeshStandardMaterial, MeshBasicMaterial, MeshPhysicalMaterial,
    AmbientLight, DirectionalLight, PointLight,
    Raycaster, TextureLoader, WebGLRenderer
};
