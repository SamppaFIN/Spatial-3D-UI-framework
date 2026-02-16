/**
 * Unit tests for BaseControl3D — the foundational class of the Spatial UI 3D framework.
 * Tests cover: constructor validation, static enums, static sanitizeHTML,
 * state management, event system, serialization, and lifecycle.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseControl3D } from '../../../src/core/BaseControl3D.js';
import { ControlRegistry } from '../../../src/core/ControlRegistry.js';
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';

// Helpers
function makeScene() { return new Scene(); }
function makeCamera() { return new PerspectiveCamera(); }
function makeRenderer() { return new WebGLRenderer(); }
function makeControl(overrides = {}) {
    const scene = makeScene();
    const camera = makeCamera();
    return new BaseControl3D(scene, camera, [0, 1, 2], { renderer: makeRenderer(), ...overrides });
}

// ─── Static Members ────────────────────────────────────────
describe('BaseControl3D.MODE', () => {
    it('has BOX, SPHERE, and SACRED enum values', () => {
        expect(BaseControl3D.MODE.BOX).toBe(0);
        expect(BaseControl3D.MODE.SPHERE).toBe(1);
        expect(BaseControl3D.MODE.SACRED).toBe(2);
    });

    it('is frozen (immutable)', () => {
        expect(Object.isFrozen(BaseControl3D.MODE)).toBe(true);
        expect(() => { BaseControl3D.MODE.BOX = 99; }).toThrow();
    });
});

describe('BaseControl3D.sanitizeHTML', () => {
    it('escapes < and > to prevent tag injection', () => {
        expect(BaseControl3D.sanitizeHTML('<script>alert(1)</script>')).toBe(
            '&lt;script&gt;alert(1)&lt;/script&gt;'
        );
    });

    it('escapes quotes and ampersands', () => {
        expect(BaseControl3D.sanitizeHTML('"hello" & \'world\'')).toBe(
            '&quot;hello&quot; &amp; &#039;world&#039;'
        );
    });

    it('returns the string unchanged if no special chars', () => {
        expect(BaseControl3D.sanitizeHTML('Hello World')).toBe('Hello World');
    });

    it('coerces non-string input to string', () => {
        expect(BaseControl3D.sanitizeHTML(42)).toBe('42');
        expect(BaseControl3D.sanitizeHTML(null)).toBe('null');
    });
});

// ─── Constructor Validation ────────────────────────────────
describe('BaseControl3D constructor validation', () => {
    it('throws Error when scene is missing', () => {
        expect(() => new BaseControl3D(null, makeCamera())).toThrow('scene is required');
    });

    it('throws Error when camera is missing', () => {
        expect(() => new BaseControl3D(makeScene(), null)).toThrow('camera is required');
    });

    it('throws TypeError for non-array position', () => {
        expect(() => new BaseControl3D(makeScene(), makeCamera(), 'not-array')).toThrow(TypeError);
    });

    it('throws TypeError for position with non-numbers', () => {
        expect(() => new BaseControl3D(makeScene(), makeCamera(), [0, 'a', 0])).toThrow(TypeError);
    });

    it('throws TypeError for position with NaN', () => {
        expect(() => new BaseControl3D(makeScene(), makeCamera(), [0, NaN, 0])).toThrow(TypeError);
    });

    it('throws TypeError for position with too few elements', () => {
        expect(() => new BaseControl3D(makeScene(), makeCamera(), [0, 0])).toThrow(TypeError);
    });

    it('throws TypeError when config is an array', () => {
        expect(() => new BaseControl3D(makeScene(), makeCamera(), [0, 0, 0], [1, 2])).toThrow(TypeError);
    });

    it('throws TypeError when config is null', () => {
        expect(() => new BaseControl3D(makeScene(), makeCamera(), [0, 0, 0], null)).toThrow(TypeError);
    });

    it('succeeds with valid arguments', () => {
        const ctrl = makeControl();
        expect(ctrl).toBeInstanceOf(BaseControl3D);
    });
});

// ─── Constructor Setup ─────────────────────────────────────
describe('BaseControl3D constructor behavior', () => {
    let ctrl;
    afterEach(() => { if (ctrl) { ctrl.dispose(); ctrl = null; } });

    it('sets position on the group', () => {
        ctrl = makeControl();
        expect(ctrl.group.position.x).toBe(0);
        expect(ctrl.group.position.y).toBe(1);
        expect(ctrl.group.position.z).toBe(2);
    });

    it('registers itself with ControlRegistry', () => {
        ctrl = makeControl();
        const all = ControlRegistry.getAll();
        expect(all).toContain(ctrl);
    });

    it('adds group to scene', () => {
        const scene = makeScene();
        ctrl = new BaseControl3D(scene, makeCamera(), [0, 0, 0], { renderer: makeRenderer() });
        expect(scene.children).toContain(ctrl.group);
    });

    it('initializes state from config', () => {
        ctrl = new BaseControl3D(makeScene(), makeCamera(), [0, 0, 0], {
            renderer: makeRenderer(),
            width: 2,
            height: 3,
            label: 'Test'
        });
        expect(ctrl.state.width).toBe(2);
        expect(ctrl.state.height).toBe(3);
        expect(ctrl.state.label).toBe('Test');
    });
});

// ─── State Management ──────────────────────────────────────
describe('BaseControl3D state (get/set)', () => {
    let ctrl;
    afterEach(() => { if (ctrl) { ctrl.dispose(); ctrl = null; } });

    it('set() updates the state', () => {
        ctrl = makeControl();
        ctrl.set('width', 5);
        expect(ctrl.get('width')).toBe(5);
    });

    it('set() does not emit when value is unchanged', () => {
        ctrl = makeControl();
        const cb = vi.fn();
        ctrl.on('change', cb);
        ctrl.set('width', ctrl.get('width')); // same value
        expect(cb).not.toHaveBeenCalled();
    });

    it('set() emits change event', () => {
        ctrl = makeControl();
        const cb = vi.fn();
        ctrl.on('change', cb);
        ctrl.set('width', 99);
        expect(cb).toHaveBeenCalledWith(
            expect.objectContaining({ key: 'width', value: 99, oldValue: expect.any(Number) }),
            ctrl
        );
    });

    it('set() with silent option does not emit', () => {
        ctrl = makeControl();
        const cb = vi.fn();
        ctrl.on('change', cb);
        ctrl.set('width', 42, { silent: true });
        expect(cb).not.toHaveBeenCalled();
        expect(ctrl.get('width')).toBe(42); // but value IS updated
    });
});

// ─── Event System ──────────────────────────────────────────
describe('BaseControl3D events (on/off/emit)', () => {
    let ctrl;
    afterEach(() => { if (ctrl) { ctrl.dispose(); ctrl = null; } });

    it('on() registers and emit() fires callbacks', () => {
        ctrl = makeControl();
        const cb = vi.fn();
        ctrl.on('test', cb);
        ctrl.emit('test', { foo: 1 });
        expect(cb).toHaveBeenCalledWith({ foo: 1 }, ctrl);
    });

    it('off() removes a specific callback', () => {
        ctrl = makeControl();
        const cb = vi.fn();
        ctrl.on('test', cb);
        ctrl.off('test', cb);
        ctrl.emit('test');
        expect(cb).not.toHaveBeenCalled();
    });

    it('emit() fires legacy onClickCallback', () => {
        const cb = vi.fn();
        ctrl = new BaseControl3D(makeScene(), makeCamera(), [0, 0, 0], {
            renderer: makeRenderer(),
            onClick: cb
        });
        ctrl.emit('click');
        expect(cb).toHaveBeenCalledWith(ctrl);
    });

    it('supports multiple listeners on same event', () => {
        ctrl = makeControl();
        const cb1 = vi.fn();
        const cb2 = vi.fn();
        ctrl.on('test', cb1);
        ctrl.on('test', cb2);
        ctrl.emit('test');
        expect(cb1).toHaveBeenCalled();
        expect(cb2).toHaveBeenCalled();
    });
});

// ─── Serialization ─────────────────────────────────────────
describe('BaseControl3D serialization', () => {
    let ctrl;
    afterEach(() => { if (ctrl) { ctrl.dispose(); ctrl = null; } });

    it('toJSON() returns id, type, position, rotation, scale, state', () => {
        ctrl = makeControl();
        const json = ctrl.toJSON();
        expect(json).toHaveProperty('id');
        expect(json.type).toBe('BaseControl3D');
        expect(json.position).toEqual([0, 1, 2]);
        expect(json).toHaveProperty('rotation');
        expect(json).toHaveProperty('scale');
        expect(json).toHaveProperty('state');
    });

    it('fromJSON() restores position', () => {
        ctrl = makeControl();
        ctrl.fromJSON({ position: [5, 6, 7] });
        expect(ctrl.group.position.x).toBe(5);
        expect(ctrl.group.position.y).toBe(6);
        expect(ctrl.group.position.z).toBe(7);
    });
});

// ─── Lifecycle ─────────────────────────────────────────────
describe('BaseControl3D dispose', () => {
    it('removes from ControlRegistry', () => {
        const ctrl = makeControl();
        expect(ControlRegistry.getAll()).toContain(ctrl);
        ctrl.dispose();
        expect(ControlRegistry.getAll()).not.toContain(ctrl);
    });

    it('removes group from scene', () => {
        const scene = makeScene();
        const ctrl = new BaseControl3D(scene, makeCamera(), [0, 0, 0], { renderer: makeRenderer() });
        ctrl.dispose();
        expect(scene.children).not.toContain(ctrl.group);
    });
});

// ─── Enable/Disable ───────────────────────────────────────
describe('BaseControl3D enable/disable', () => {
    let ctrl;
    afterEach(() => { if (ctrl) { ctrl.dispose(); ctrl = null; } });

    it('setEnabled(false) disables interaction', () => {
        ctrl = makeControl();
        ctrl.setEnabled(false);
        expect(ctrl.isEnabled).toBe(false);
    });

    it('setEnabled(true) re-enables interaction', () => {
        ctrl = makeControl();
        ctrl.setEnabled(false);
        ctrl.setEnabled(true);
        expect(ctrl.isEnabled).toBe(true);
    });
});
