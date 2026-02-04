import { BaseControl3D } from '../core/BaseControl3D.js';
import { GeometryFactory } from '../utils/GeometryFactory.js';
import { MaterialFactory } from '../utils/MaterialFactory.js';
import * as THREE from 'three';

export class Toggle3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            width: config.width || 2.2,
            height: config.height || 0.9,
            depth: config.depth || 0.25,
            onColor: config.onColor || 0x4ecdc4,
            offColor: config.offColor || 0x444444,
            trackShape: config.trackShape || 'pill',
            trackMaterialType: config.trackMaterialType || 'glass',
            handleShape: config.handleShape || 'sphere',
            handleMaterialType: config.handleMaterialType || 'metal',
            isOn: config.isOn || false
        });

        // Toggle-specific properties
        this.isOn = this.get('isOn');
        this.handlePosition = this.isOn ? 1.0 : -1.0;
        this.currentHandlePosition = this.handlePosition;
        this.velocity = 0;
        this.tension = config.tension || 0.15;
        this.friction = config.friction || 0.82;
        this.currentScale = 1.0;
        this.scaleVelocity = 0;
    }

    create() {
        this.isOn = this.get('isOn');

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
        this.createHandle();
        this.createGlow();
        this.updateVisualState();
    }

    createTrack() {
        const shape = this.get('trackShape');
        const matType = this.get('trackMaterialType');

        const geoOptions = {
            width: this.get('width'),
            height: this.get('height'),
            depth: this.get('depth'),
            radius: this.get('height') / 2
        };
        const geometry = GeometryFactory.create(shape, geoOptions);

        const material = MaterialFactory.create(matType, {
            color: this.isOn ? this.get('onColor') : this.get('offColor'),
            opacity: matType === 'glass' ? 0.4 : 1.0,
            roughness: 0.2,
            metalness: 0.8
        });

        this.trackMesh = new THREE.Mesh(geometry, material);
        this.trackMesh.castShadow = true;
        this.trackMesh.receiveShadow = true;
        this.trackMesh.userData.isInteractive = true;
        this.trackMesh.userData.control = this;

        this.group.add(this.trackMesh);
    }

    createHandle() {
        const size = this.get('height') * 0.85;
        const shape = this.get('handleShape');
        const matType = this.get('handleMaterialType');

        const geoOptions = { width: size, height: size, depth: size, radius: size / 2 };
        const geometry = GeometryFactory.create(shape, geoOptions);

        const material = MaterialFactory.create(matType, {
            color: 0xffffff,
            emissive: this.isOn ? this.get('onColor') : 0x000000,
            emissiveIntensity: this.isOn ? 0.8 : 0.0,
            roughness: 0.1,
            metalness: 0.9
        });

        this.handleMesh = new THREE.Mesh(geometry, material);
        this.handleMesh.position.z = this.get('depth') / 2 + size / 4;
        this.handleMesh.castShadow = true;
        this.handleMesh.receiveShadow = true;
        this.handleMesh.userData.isInteractive = true;
        this.handleMesh.userData.control = this;

        this.group.add(this.handleMesh);
    }

    createGlow() {
        const geometry = GeometryFactory.create(this.get('trackShape'), {
            width: this.get('width') * 1.15,
            height: this.get('height') * 1.15,
            depth: 0.01,
            radius: this.get('height') / 2
        });
        const material = MaterialFactory.create('neon', {
            color: this.get('onColor'),
            intensity: 0.5
        });
        material.transparent = true;
        material.opacity = 0.2;

        this.glowMesh = new THREE.Mesh(geometry, material);
        this.glowMesh.position.z = -this.get('depth') / 2 - 0.05;
        this.glowMesh.visible = this.isOn;
        this.group.add(this.glowMesh);
    }

    toggle() {
        const newState = !this.get('isOn');
        this.set('isOn', newState);
        this.scaleVelocity = -0.05; // Kick animation
    }

    handleClick(intersect) {
        super.handleClick(intersect);
        this.toggle();
    }

    onStateChange(key, value, oldValue) {
        if (key === 'isOn') {
            this.isOn = value;
            this.updateVisualState();
        }

        const criticalKeys = ['width', 'height', 'depth', 'trackShape', 'trackMaterialType', 'handleShape', 'handleMaterialType', 'onColor', 'offColor'];
        if (criticalKeys.includes(key)) {
            this.create();
        }

        super.onStateChange(key, value, oldValue);
    }

    updateVisualState() {
        if (!this.trackMesh || !this.handleMesh) return;

        const onColor = this.get('onColor');
        const offColor = this.get('offColor');

        // Update Track
        if (this.get('trackMaterialType') === 'glass') {
            this.trackMesh.material.color.setHex(this.isOn ? onColor : 0x444444);
            this.trackMesh.material.opacity = this.isOn ? 0.6 : 0.3;
        } else {
            this.trackMesh.material.color.setHex(this.isOn ? onColor : offColor);
        }

        // Update Handle
        this.handleMesh.material.emissive.setHex(this.isOn ? onColor : 0x000000);
        this.handleMesh.material.emissiveIntensity = this.isOn ? 0.8 : 0.0;

        // Update Glow
        if (this.glowMesh) {
            this.glowMesh.visible = this.isOn;
            this.glowMesh.material.color.setHex(onColor);
        }
    }

    update() {
        const width = this.get('width');
        const height = this.get('height');
        const handleR = height * 0.4;

        // Spring Physics for Handle Position
        const trackRange = (width / 2 - handleR * 1.1);
        const targetX = this.isOn ? trackRange : -trackRange;

        const displacement = targetX - this.currentHandlePosition;
        this.velocity += displacement * this.tension;
        this.velocity *= this.friction;
        this.currentHandlePosition += this.velocity;

        if (this.handleMesh) {
            this.handleMesh.position.x = this.currentHandlePosition;
            // Roll effect
            if (this.get('handleShape') === 'sphere') {
                this.handleMesh.rotation.z = -this.currentHandlePosition * 3;
            }
        }

        // Spring Physics for Scale (Hover/Press)
        let targetScale = this.isHovered ? 1.05 : 1.0;
        if (this.isPressed) targetScale = 0.95;

        const scaleDiff = targetScale - this.currentScale;
        this.scaleVelocity += scaleDiff * 0.2;
        this.scaleVelocity *= 0.75;
        this.currentScale += this.scaleVelocity;

        this.group.scale.setScalar(this.currentScale);
    }

    get2DContent() {
        const container = super.get2DContent();

        const preview = document.createElement('div');
        preview.style.cssText = `
            margin-top: 20px;
            padding: 20px;
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        `;

        const statusText = document.createElement('div');
        statusText.style.cssText = 'font-weight: bold; font-size: 1.2em; transition: color 0.3s;';
        statusText.innerText = this.isOn ? 'STATUS: ACTIVE' : 'STATUS: INACTIVE';
        statusText.style.color = this.isOn ? '#4ecdc4' : '#ff3333';

        const switchBtn = document.createElement('div');
        switchBtn.style.cssText = `
            width: 80px;
            height: 40px;
            background: ${this.isOn ? '#4ecdc4' : '#444'};
            border-radius: 20px;
            position: relative;
            cursor: pointer;
            transition: background 0.3s;
        `;

        const knob = document.createElement('div');
        knob.style.cssText = `
            width: 32px;
            height: 32px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 4px;
            left: ${this.isOn ? '44px' : '4px'};
            transition: left 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            box-shadow: 0 2px 5px rgba(0,0,0,0.4);
        `;
        switchBtn.appendChild(knob);

        switchBtn.onclick = () => {
            this.toggle();
            statusText.innerText = this.isOn ? 'STATUS: ACTIVE' : 'STATUS: INACTIVE';
            statusText.style.color = this.isOn ? '#4ecdc4' : '#ff3333';
            switchBtn.style.background = this.isOn ? '#4ecdc4' : '#444';
            knob.style.left = this.isOn ? '44px' : '4px';
        };

        preview.appendChild(statusText);
        preview.appendChild(switchBtn);
        container.appendChild(preview);

        return container;
    }
}
