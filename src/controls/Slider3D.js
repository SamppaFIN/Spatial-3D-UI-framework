import { BaseControl3D } from '../core/BaseControl3D.js';
import { ControlRegistry } from '../core/ControlRegistry.js';
import { GeometryFactory } from '../utils/GeometryFactory.js';
import { MaterialFactory } from '../utils/MaterialFactory.js';
import * as THREE from 'three';

export class Slider3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            width: config.width || 4.0,
            height: config.height || 0.35,
            depth: config.depth || 0.2,
            orientation: config.orientation || 'horizontal',
            trackShape: config.trackShape || 'pill',
            handleShape: config.handleShape || 'sphere',
            trackMaterialType: config.trackMaterialType || 'glass',
            handleMaterialType: config.handleMaterialType || 'metal',
            trackColor: config.trackColor || 0x444444,
            fillColor: config.fillColor || 0x00d4ff,
            handleColor: config.handleColor || 0xffffff,
            min: config.min !== undefined ? config.min : 0,
            max: config.max !== undefined ? config.max : 100,
            step: config.step !== undefined ? config.step : 1,
            value: config.value !== undefined ? config.value : (config.min || 0),
            values: config.values || null, // Array of discrete values
            valueIndex: config.valueIndex || 0,
            showValue: config.showValue !== false,
            tickMarks: config.tickMarks || false,
            tickInterval: config.tickInterval || 20,
            handleSize: config.handleSize || 0.5,
            zOffsetOnGrab: config.zOffsetOnGrab || 0.15,
            lookAtCamera: config.lookAtCamera !== false,
            magneticGrab: config.magneticGrab !== false,
            // Styling
            trackOpacity: config.trackOpacity || 0.35,
            fillOpacity: config.fillOpacity || 1.0,
            handleOpacity: config.handleOpacity || 1.0,
            glowColor: config.glowColor || null,
            glowIntensity: config.glowIntensity || 1.0,
            preset: config.preset || 'default'
        });

        // Local animation state
        this.currentHandlePos = 0;
        this.targetHandlePos = 0;
        this.velocity = 0;
        this.tension = config.tension || 0.15;
        this.friction = config.friction || 0.8;
        this.isDragging = false;
        this.zOffsetCurrent = 0;
        this.glowPulse = 0;
        this.currentScale = 1.0;

        // Initialize bound handlers for BaseControl3D compatibility
        this.boundOnMouseMove = this._onMouseMove;
        this.boundOnMouseUp = this._onMouseUp;

        this.syncValue();
        if (config.preset) this.applyPreset(config.preset, true);
        this.create();
    }

    applyPreset(name, silent = false) {
        const presets = {
            cyber: {
                trackColor: 0x110022, trackMaterialType: 'standard', trackOpacity: 0.8,
                fillColor: 0xff00ff, handleColor: 0x00d4ff, handleShape: 'box',
                glowColor: 0xff00ff, glowIntensity: 2.0, trackShape: 'box'
            },
            minimal: {
                trackColor: 0x444444, trackMaterialType: 'matte', trackOpacity: 0.2,
                fillColor: 0x888888, handleColor: 0xffffff, handleShape: 'sphere',
                handleSize: 0.3, width: 3.5, height: 0.15, tickMarks: false
            },
            industrial: {
                trackColor: 0x222222, trackMaterialType: 'metal', trackOpacity: 1.0,
                fillColor: 0xffaa00, handleColor: 0x777777, handleShape: 'cylinder',
                handleMaterialType: 'metal', trackShape: 'box'
            },
            glass: {
                trackMaterialType: 'glass', trackOpacity: 0.3,
                fillColor: 0x00d4ff, handleColor: 0xffffff, handleMaterialType: 'glass',
                handleShape: 'sphere', trackShape: 'pill'
            }
        };

        const settings = presets[name];
        if (settings) {
            Object.entries(settings).forEach(([k, v]) => this.set(k, v, { silent: true }));
            if (!silent) this.create();
        }
    }

    syncValue() {
        const values = this.get('values');
        if (values && Array.isArray(values)) {
            let idx = this.get('valueIndex');
            idx = Math.max(0, Math.min(values.length - 1, idx));
            this.set('valueIndex', idx, { silent: true });
            this.set('value', values[idx], { silent: true });
            this.targetHandlePos = this.valueToPosition(idx, 0, values.length - 1);
        } else {
            let val = this.get('value');
            val = Math.max(this.get('min'), Math.min(this.get('max'), val));
            this.set('value', val, { silent: true });
            this.targetHandlePos = this.valueToPosition(val, this.get('min'), this.get('max'));
        }
        this.currentHandlePos = this.targetHandlePos;
    }

    create() {
        // Clear group
        while (this.group.children.length > 0) {
            const child = this.group.children[0];
            this.group.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        }

        this.createTrack();
        this.createFill();
        this.createHandle();
        this.createTickMarks();
        this.createGlow();
        this.createValueDisplay();
        this.updateVisualState();
    }

    createIcon() {
        if (this.iconMesh) {
            if (this.iconMesh.parent) this.iconMesh.parent.remove(this.iconMesh);
            this.iconMesh.geometry.dispose();
            this.iconMesh.material.dispose();
            this.iconMesh = null;
        }

        if (!this.config.icon || this.config.icon === 'none') return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        ctx.clearRect(0, 0, 128, 128);

        // Styling
        ctx.strokeStyle = '#333';
        ctx.fillStyle = '#333';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Center
        const cx = 64;
        const cy = 64;

        if (this.config.icon === 'volume') {
            // Speaker icon
            ctx.beginPath();
            ctx.moveTo(34, 48);
            ctx.lineTo(48, 48);
            ctx.lineTo(74, 28);
            ctx.lineTo(74, 100);
            ctx.lineTo(48, 80);
            ctx.lineTo(34, 80);
            ctx.closePath();
            ctx.fill();
            // Waves
            ctx.beginPath();
            ctx.arc(76, 64, 20, -0.6, 0.6);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(76, 64, 34, -0.7, 0.7);
            ctx.stroke();

        } else if (this.config.icon === 'flame') {
            // Flame icon
            ctx.fillStyle = '#d9441e';
            ctx.beginPath();
            ctx.moveTo(64, 20);
            ctx.bezierCurveTo(30, 60, 40, 90, 64, 110);
            ctx.bezierCurveTo(90, 90, 100, 60, 64, 20);
            ctx.fill();

        } else if (this.config.icon === 'brightness') {
            // Sun
            ctx.fillStyle = '#ffdb4d';
            ctx.beginPath();
            ctx.arc(cx, cy, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffdb4d';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r1 = 34; const r2 = 46;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
                ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide
        });

        const iconSize = this.handleSize * 0.8;
        const geo = new THREE.PlaneGeometry(iconSize, iconSize);

        this.iconMesh = new THREE.Mesh(geo, mat);

        // Z-Positioning
        let zOffset = this.handleSize / 2 + 0.02; // Default for sphere radius

        if (this.handleShape === 'box' || this.handleShape === 'cylinder') {
            zOffset = this.handleDepth / 2 + 0.02;
        }

        this.iconMesh.position.z = zOffset;

        // If handle exists, add to it
        if (this.handleMesh) {
            this.handleMesh.add(this.iconMesh);
        }
    }

    createTickMarks() {
        if (!this.get('tickMarks')) return;

        const min = this.get('min');
        const max = this.get('max');
        const interval = this.get('tickInterval');
        const isVert = this.get('orientation') === 'vertical';
        const length = this.get('width');
        const height = this.get('height');

        const values = this.get('values');
        const count = values ? values.length : Math.floor((max - min) / interval) + 1;

        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.04, 0.15, 0.05);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
            const mesh = new THREE.Mesh(geo, mat);

            const val = values ? i : min + i * interval;
            const pos = values ? this.valueToPosition(i, 0, values.length - 1) : this.valueToPosition(val, min, max);

            if (isVert) {
                mesh.position.y = pos;
                mesh.position.x = height / 2 + 0.1;
                mesh.rotation.z = Math.PI / 2;
            } else {
                mesh.position.x = pos;
                mesh.position.y = -height / 2 - 0.15;
            }

            this.group.add(mesh);
        }
    }

    createGradientTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Safe colors
        const trackColor = this.trackColor !== undefined ? this.trackColor : 0x444444;
        const fillColor = this.fillColor !== undefined ? this.fillColor : 0x3366ff;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, `#${trackColor.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, `#${fillColor.toString(16).padStart(6, '0')}`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.gradientTexture = new THREE.CanvasTexture(canvas);
        this.gradientTexture.needsUpdate = true;
        this.gradientTexture.minFilter = THREE.LinearFilter;
        this.gradientTexture.magFilter = THREE.LinearFilter;
        this.gradientTexture.anisotropy = 16;
    }

    createTrack() {
        const shape = this.get('trackShape');
        const matType = this.get('trackMaterialType');
        const isVert = this.get('orientation') === 'vertical';
        const w = isVert ? this.get('height') : this.get('width');
        const h = isVert ? this.get('width') : this.get('height');

        const geoOptions = {
            width: w,
            height: h,
            depth: this.get('depth'),
            radius: Math.min(w, h) / 2
        };
        const geometry = GeometryFactory.create(shape, geoOptions);

        const material = MaterialFactory.create(matType, {
            color: this.get('trackColor'),
            opacity: this.get('trackOpacity'),
            roughness: 0.4, // Increased roughness to catch more light
            metalness: 0.3, // Reduced metalness to stop reflecting the black void
            // Add emissive for visibility in dark scenes
            emissive: this.get('trackColor'),
            emissiveIntensity: 0.6 * (this.get('trackOpacity') || 1.0),
            transparent: this.get('trackOpacity') < 1.0
        });

        this.trackMesh = new THREE.Mesh(geometry, material);
        this.trackMesh.castShadow = true;
        this.trackMesh.receiveShadow = true;
        this.trackMesh.userData.isInteractive = true;
        this.trackMesh.userData.control = this;

        this.group.add(this.trackMesh);

        // Add a dedicated light to the slider so it's always visible
        if (!this.light) {
            this.light = new THREE.PointLight(this.get('fillColor'), 0.8, 5);
            this.light.position.set(0, 0.5, 1);
            this.group.add(this.light);
        } else {
            this.light.color.setHex(this.get('fillColor'));
        }
    }

    createFill() {
        if (this.fillMesh) {
            this.group.remove(this.fillMesh);
            this.fillMesh.geometry.dispose();
            this.fillMesh.material.dispose();
        }

        const isVert = this.get('orientation') === 'vertical';
        const w = isVert ? this.get('height') * 0.95 : this.get('width');
        const h = isVert ? this.get('width') : this.get('height') * 0.95;

        const geometry = new THREE.BoxGeometry(w, h, this.get('depth') * 0.8);
        const material = new THREE.MeshStandardMaterial({
            color: this.get('fillColor'),
            metalness: 0.6,
            roughness: 0.2,
            emissive: this.get('fillColor'),
            emissiveIntensity: 0.8 // Increased from 0.4
        });

        this.fillMesh = new THREE.Mesh(geometry, material);
        this.group.add(this.fillMesh);
        this.updateFillState();
    }

    updateFillState() {
        if (!this.fillMesh) return;

        const val = this.get('value');
        const min = this.get('min');
        const max = this.get('max');
        const values = this.get('values');

        const ratio = values ? (this.get('valueIndex') / (values.length - 1)) : ((val - min) / (max - min));
        const isVert = this.get('orientation') === 'vertical';

        if (isVert) {
            this.fillMesh.scale.y = Math.max(0.001, ratio);
            this.fillMesh.scale.x = 1.0;
            const fullLen = this.get('width');
            this.fillMesh.position.y = -fullLen / 2 + (fullLen * ratio) / 2;
            this.fillMesh.position.x = 0;
        } else {
            this.fillMesh.scale.x = Math.max(0.001, ratio);
            this.fillMesh.scale.y = 1.0;
            const fullLen = this.get('width');
            this.fillMesh.position.x = -fullLen / 2 + (fullLen * ratio) / 2;
            this.fillMesh.position.y = 0;
        }
    }

    createHandle() {
        if (this.handleMesh) {
            this.group.remove(this.handleMesh);
            this.handleMesh.geometry.dispose();
            this.handleMesh.material.dispose();
        }

        const size = this.get('handleSize');
        const shape = this.get('handleShape');
        const matType = this.get('handleMaterialType');

        const geoOptions = { width: size, height: size, depth: size, radius: size / 2 };
        const geometry = GeometryFactory.create(shape, geoOptions);

        const material = MaterialFactory.create(matType, {
            color: this.get('handleColor'),
            emissive: this.get('handleColor'), // Use handle color for emissive
            emissiveIntensity: 0.5, // Brighter handle
            roughness: 0.1,
            metalness: 0.9
        });

        this.handleMesh = new THREE.Mesh(geometry, material);
        this.handleMesh.castShadow = true;
        this.handleMesh.receiveShadow = true;
        this.handleMesh.userData.isHandle = true;
        this.handleMesh.userData.isInteractive = true;
        this.handleMesh.userData.control = this;

        this.group.add(this.handleMesh);
    }

    createGlow() {
        if (this.glowMesh) {
            this.group.remove(this.glowMesh);
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }

        const size = this.get('handleSize') * 1.5;
        const geometry = new THREE.SphereGeometry(size / 2, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: this.get('glowColor') || this.get('fillColor'),
            transparent: true,
            opacity: 0.15 * this.get('glowIntensity'),
            side: THREE.DoubleSide
        });

        this.glowMesh = new THREE.Mesh(geometry, material);
        this.group.add(this.glowMesh);
    }

    createValueDisplay() {
        if (!this.get('showValue')) return;

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        this.valueTexture = new THREE.CanvasTexture(canvas);

        const geometry = new THREE.PlaneGeometry(0.8, 0.4);
        const material = new THREE.MeshBasicMaterial({
            map: this.valueTexture,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.valueMesh = new THREE.Mesh(geometry, material);
        this.valueMesh.raycast = () => { }; // Non-interactive
        this.group.add(this.valueMesh);
        this.updateValueDisplay();
    }

    updateValueDisplay() {
        if (!this.valueTexture || !this.get('showValue')) return;

        const canvas = this.valueTexture.image;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 10);
        ctx.fill();

        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#00d4ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const val = this.get('value');
        const text = typeof val === 'number' ? val.toFixed(1) : val.toString();
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        this.valueTexture.needsUpdate = true;
    }

    valueToPosition(value, min, max) {
        const range = max - min;
        const normalized = range === 0 ? 0 : (value - min) / range;
        const length = this.get('width');
        return -length / 2 + normalized * length;
    }

    positionToValue(position) {
        const length = this.get('width');
        const normalized = Math.max(0, Math.min(1, (position + length / 2) / length));

        const values = this.get('values');
        if (values && Array.isArray(values)) {
            return Math.round(normalized * (values.length - 1));
        }

        const min = this.get('min');
        const max = this.get('max');
        const step = this.get('step');
        let val = min + normalized * (max - min);
        if (step > 0) val = Math.round(val / step) * step;
        return Math.max(min, Math.min(max, val));
    }

    setValue(newValue) {
        const values = this.get('values');
        if (values && Array.isArray(values)) {
            this.set('valueIndex', newValue);
        } else {
            this.set('value', newValue);
        }
    }

    onStateChange(key, value, oldValue) {
        if (key === 'value' || key === 'valueIndex') {
            const values = this.get('values');
            if (values && Array.isArray(values)) {
                const idx = this.get('valueIndex');
                this.set('value', values[idx], { silent: true });
                this.targetHandlePos = this.valueToPosition(idx, 0, values.length - 1);
            } else {
                this.targetHandlePos = this.valueToPosition(value, this.get('min'), this.get('max'));
            }
            this.updateFillState();
            this.updateValueDisplay();
            this.emit('change', { key, value });
        }

        const criticalKeys = [
            'width', 'height', 'depth', 'trackShape', 'handleShape',
            'trackMaterialType', 'handleMaterialType', 'tickMarks',
            'values', 'min', 'max', 'trackColor', 'fillColor',
            'handleColor', 'trackOpacity', 'glowColor', 'glowIntensity'
        ];
        if (criticalKeys.includes(key)) {
            this.create();
        }

        if (key === 'preset') {
            this.applyPreset(value);
        }

        super.onStateChange(key, value, oldValue);
    }

    updateValueFromMouse(event) {
        const canvas = event.target?.closest('canvas') || document.querySelector('canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        this.raycaster.setFromCamera(mouse, this.camera);

        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, this.group.getWorldPosition(new THREE.Vector3()));

        const intersection = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(plane, intersection)) {
            this.group.worldToLocal(intersection);
            const pos = this.get('orientation') === 'vertical' ? intersection.y : intersection.x;
            const newValue = this.positionToValue(pos);
            this.setValue(newValue);
        }
    }

    onMouseDown(event) {
        if (!this.isEnabled || !this.camera) return;
        const intersect = this.checkIntersection(this.camera, event);

        if (intersect) {
            this.isPressed = true;
            this.isDragging = true;

            const orbitControls = ControlRegistry.orbitControls;
            if (orbitControls) orbitControls.enabled = false;

            document.addEventListener('mousemove', this.boundOnMouseMove);
            document.addEventListener('mouseup', this.boundOnMouseUp);

            this.updateValueFromMouse(event);
        }
    }

    onMouseMove(event) {
        if (!this.isEnabled || !this.camera) return;
        if (this.isDragging) {
            this.updateValueFromMouse(event);
        } else {
            super.onMouseMove(event);
        }
    }

    onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.isPressed = false;

            document.removeEventListener('mousemove', this.boundOnMouseMove);
            document.removeEventListener('mouseup', this.boundOnMouseUp);

            const orbitControls = ControlRegistry.orbitControls;
            if (orbitControls) orbitControls.enabled = true;
        }
    }

    updateVisualState() {
        if (!this.handleMesh) return;
        const isVert = this.get('orientation') === 'vertical';

        if (isVert) {
            this.handleMesh.position.y = this.currentHandlePos;
            this.handleMesh.position.x = 0;
        } else {
            this.handleMesh.position.x = this.currentHandlePos;
            this.handleMesh.position.y = 0;
        }

        this.handleMesh.position.z = (this.get('depth') / 2 + this.get('handleSize') / 4) + (this.zOffsetCurrent || 0);

        if (this.glowMesh) {
            this.glowMesh.position.copy(this.handleMesh.position);
            this.glowMesh.position.z -= 0.05;
            this.glowMesh.visible = this.isHovered || this.isDragging;
        }

        if (this.valueMesh) {
            this.valueMesh.position.copy(this.handleMesh.position);
            if (isVert) {
                this.valueMesh.position.x += (this.get('handleSize') + 0.2);
            } else {
                this.valueMesh.position.y += (this.get('handleSize') + 0.2);
            }

            if (this.get('lookAtCamera') && this.camera) {
                this.valueMesh.lookAt(this.camera.position);
            }
        }

        this.updateFillState();
    }

    update() {
        // Safe check for initialized state
        if (this.currentScale === undefined) this.currentScale = 1.0;
        if (this.currentHandlePos === undefined) this.currentHandlePos = 0;

        // Spring physics for handle movement
        const displacement = (this.targetHandlePos || 0) - this.currentHandlePos;
        const force = displacement * this.tension;
        this.velocity += force;
        this.velocity *= this.friction;
        this.currentHandlePos += this.velocity;

        // Depth feedback (Z-offset on grab)
        const targetZ = this.isDragging ? this.get('zOffsetOnGrab') : 0;
        this.zOffsetCurrent += (targetZ - this.zOffsetCurrent) * 0.15;

        // Glow pulse logic
        this.glowPulse += 0.05;
        if (this.glowMesh) {
            const baseGlow = (this.isHovered || this.isDragging) ? 0.3 : 0.1;
            const pulse = Math.sin(this.glowPulse) * 0.05;
            this.glowMesh.material.opacity = baseGlow + pulse;
            this.glowMesh.scale.setScalar(1 + pulse);
        }

        // Visual smoothing/kick on interaction
        let targetScale = this.isHovered ? 1.05 : 1.0;
        if (this.isPressed) targetScale = 0.92;

        this.currentScale += (targetScale - this.currentScale) * 0.2;
        this.group.scale.setScalar(this.currentScale);

        this.updateVisualState();
    }

    getNormalizedValue() {
        const values = this.get('values');
        if (values && Array.isArray(values)) {
            return this.get('valueIndex') / (values.length - 1);
        } else {
            const min = this.get('min');
            const max = this.get('max');
            return (this.get('value') - min) / (max - min);
        }
    }

    get2DContent() {
        const container = super.get2DContent();
        const isDiscrete = Array.isArray(this.get('values'));

        const preview = document.createElement('div');
        preview.style.cssText = `
            margin-top: 20px;
            padding: 20px;
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
        `;

        const val = this.get('value');
        const valueDisplay = document.createElement('div');
        valueDisplay.style.cssText = 'text-align: center; font-size: 1.8em; font-weight: bold; color: #00d4ff; font-family: monospace;';
        valueDisplay.innerText = typeof val === 'number' ? val.toFixed(1) : val;

        const rangeInput = document.createElement('input');
        rangeInput.type = 'range';

        if (isDiscrete) {
            rangeInput.min = 0;
            rangeInput.max = this.get('values').length - 1;
            rangeInput.step = 1;
            rangeInput.value = this.get('valueIndex');
        } else {
            rangeInput.min = this.get('min');
            rangeInput.max = this.get('max');
            rangeInput.step = this.get('step') || 0.1;
            rangeInput.value = val;
        }

        rangeInput.style.cssText = 'width: 100%; height: 6px; cursor: pointer; accent-color: #00d4ff;';

        rangeInput.oninput = (e) => {
            const numVal = parseFloat(e.target.value);
            this.setValue(numVal);
            const currentVal = this.get('value');
            valueDisplay.innerText = typeof currentVal === 'number' ? currentVal.toFixed(1) : currentVal;
        };

        preview.appendChild(valueDisplay);
        preview.appendChild(rangeInput);
        container.appendChild(preview);

        return container;
    }

    dispose() {
        document.removeEventListener('mousemove', this.boundOnMouseMove);
        document.removeEventListener('mouseup', this.boundOnMouseUp);
        super.dispose();
    }
}
