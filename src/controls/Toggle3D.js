import { BaseControl3D } from '../core/BaseControl3D.js';
import { GeometryFactory } from '../utils/GeometryFactory.js';
import { MaterialFactory } from '../utils/MaterialFactory.js';
import * as THREE from 'three';

export class Toggle3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null,
            onClick: config.onClick || null
        });

        // Toggle-specific properties
        this.label = config.label || 'Toggle';
        this.width = config.width || 2.0;
        this.height = config.height || 0.8; // Slightly thicker default
        this.depth = config.depth || 0.2;

        // Visual Configuration
        this.trackShape = config.trackShape || 'pill'; // pill, box, rounded, hexagon
        this.trackMaterialType = config.trackMaterialType || 'standard'; // standard, glass, metal, neon

        this.handleShape = config.handleShape || 'sphere'; // sphere, box, sacred, hexagon
        this.handleMaterialType = config.handleMaterialType || 'standard'; // standard, neon, matte

        // State System
        this.isOn = config.isOn || false;
        this.onColor = config.onColor || 0x3366ff;
        this.offColor = config.offColor || 0x444444;

        // Animation
        this.animationPreset = config.animationPreset || 'spring'; // slide, bounce, fade, spring

        // Spring Physics properties
        this.velocity = 0;
        this.tension = config.tension || 0.15; // Rigidity
        this.friction = config.friction || 0.85; // Damping

        this.handlePosition = this.isOn ? 1.0 : -1.0;
        this.currentHandlePosition = this.handlePosition;

        // Interactions
        this.currentScale = 1.0;
        this.targetScale = 1.0;
        this.scaleVelocity = 0; // Scale spring
        this.hoverScale = 1.05;

        if (this.group) {
            // Clean up existing children if rebuilding
            while (this.group.children.length > 0) {
                const child = this.group.children[0];
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
                this.group.remove(child);
            }
            this.create();
        }
    }

    create() {
        if (!this.trackShape) return; // Guard: Wait for full initialization
        this.createTrack();
        this.createHandle();
        this.createIcon(); // Ensure this is called
        this.createLabel();
        this.createGlow();
        this.updateVisualState(true); // Force initial update
    }

    createIcon() {
        if (this.iconMesh) {
            // If it exists, remove it from parent (handleMesh)
            if (this.iconMesh.parent) this.iconMesh.parent.remove(this.iconMesh);
            if (this.iconMesh.geometry) this.iconMesh.geometry.dispose();
            if (this.iconMesh.material) this.iconMesh.material.dispose();
            this.iconMesh = null;
        }

        if (!this.config.icon || this.config.icon === 'none') return;

        // Simple Geometric Icons or Textures
        // For portability, let's use CanvasTexture for icons
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;

        // Clear configuration
        ctx.clearRect(0, 0, 128, 128);

        ctx.strokeStyle = this.isOn ? '#333' : '#fff'; // Dark icon on bright handle (if on) or vice versa?
        // Actually handle is white when ON usually, and gray when OFF. 
        // Let's adapt based on handle color logic:
        // Handle ON = White/Color, Handle OFF = Gray
        // Better contrast:
        ctx.fillStyle = this.isOn ? this.config.onColor : '#fff'; // Use color for icon? Or interaction?

        ctx.strokeStyle = this.isOn ? '#ff0000' : '#ffffff'; // Debug colors
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const cx = 64;
        const cy = 64;

        if (this.config.icon === 'power') {
            // Power Symbol
            ctx.strokeStyle = this.isOn ? '#333' : '#fff';
            ctx.beginPath();
            ctx.arc(cx, cy, 35, -Math.PI * 0.25, Math.PI * 1.25);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, cy - 35);
            ctx.lineTo(cx, cy);
            ctx.stroke();
        } else if (this.config.icon === 'sun') {
            if (this.isOn) {
                // Moon
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(cx, cy, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(cx + 15, cy - 10, 25, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Sun
                ctx.fillStyle = '#ffdb4d'; // Sun color
                ctx.beginPath();
                ctx.arc(cx, cy, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffdb4d';
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const r1 = 28; const r2 = 40;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
                    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
                    ctx.stroke();
                }
            }
        } else if (this.config.icon === 'check') {
            if (this.isOn) {
                // Check
                ctx.strokeStyle = '#22cc22';
                ctx.beginPath();
                ctx.moveTo(34, 64);
                ctx.lineTo(54, 84);
                ctx.lineTo(94, 44);
                ctx.stroke();
            } else {
                // X
                ctx.strokeStyle = '#cc2222';
                ctx.beginPath();
                ctx.moveTo(40, 40);
                ctx.lineTo(88, 88);
                ctx.moveTo(88, 40);
                ctx.lineTo(40, 88);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide
        });

        // Icon size relative to handle
        const iconSize = this.height * 0.6;
        const geo = new THREE.PlaneGeometry(iconSize, iconSize);

        this.iconMesh = new THREE.Mesh(geo, mat);

        // Z-Positioning is critical!
        // Handle size z is 'this.depth + size/2'? No, handle is 3D object.
        // If handle is sphere, radius = height*0.4.
        // If handle is box, depth = size.

        const handleR = this.height * 0.4;
        let zOffset = handleR + 0.02; // Just outside sphere radius

        if (this.handleShape === 'box' || this.handleShape === 'cylinder') {
            zOffset = (this.height * 0.8) / 2 + 0.02; // Box half-depth
        }

        this.iconMesh.position.z = zOffset;

        // Add to handle so it moves/rotates with it
        this.handleMesh.add(this.iconMesh);
    }

    createTrack() {
        // 1. Geometry
        // Adjust geometry dimensions based on shape to fit bounding box
        let geoOptions = { width: this.width, height: this.height, depth: this.depth, radius: this.height / 2 };

        // Special case: GeometryFactory pill/capsule logic might differ
        // For 'pill', GeometryFactory expects width/height.
        const geometry = GeometryFactory.create(this.trackShape, geoOptions);

        // 2. Material
        let matOptions = {
            color: this.offColor,
            roughness: 0.4,
            metalness: 0.2
        };

        if (this.trackMaterialType === 'glass') {
            matOptions = {
                color: this.offColor,
                transmission: 0.95,
                opacity: 0.3,
                roughness: 0.1,
                thickness: 0.5
            };
        }

        const material = MaterialFactory.create(this.trackMaterialType, matOptions);

        this.trackMesh = new THREE.Mesh(geometry, material);
        this.trackMesh.castShadow = true;
        this.trackMesh.receiveShadow = true;
        this.trackMesh.userData.isInteractive = true;
        this.trackMesh.userData.control = this;

        // If pill/capsule from GeometryFactory creates flat shape, we might need rotation?
        // GeometryFactory 'pill' is extruded, so it has depth. Should be fine.

        this.group.add(this.trackMesh);
    }

    createHandle() {
        const size = this.height * 0.8; // Handle slightly smaller than track height

        // 1. Geometry
        let geoOptions = { width: size, height: size, depth: size, radius: size / 2 };
        const geometry = GeometryFactory.create(this.handleShape, geoOptions);

        // 2. Material
        const material = MaterialFactory.create(this.handleMaterialType, {
            color: this.isOn ? 0xffffff : 0xaaaaaa, // Handle is usually whiteish or colored
            emissive: this.isOn ? this.onColor : 0x000000,
            intensity: this.isOn ? 0.5 : 0.0,
            roughness: 0.2
        });

        this.handleMesh = new THREE.Mesh(geometry, material);
        this.handleMesh.position.z = this.depth / 2 + size / 2; // Sit on top/center
        this.handleMesh.castShadow = true;
        this.handleMesh.receiveShadow = true;
        this.handleMesh.userData.isInteractive = true;
        this.handleMesh.userData.control = this;

        this.group.add(this.handleMesh);
    }

    createLabel() {
        // Simple text label below
        // ... (Simplified version of previous implementation)
        // Ideally use TextDisplay3D but for self-contained control, keep simple canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 60px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const geo = new THREE.PlaneGeometry(2, 0.5);
        this.labelMesh = new THREE.Mesh(geo, mat);
        this.labelMesh.position.y = -this.height - 0.2;
        this.group.add(this.labelMesh);
    }

    createGlow() {
        // Optional glow backing
        const geo = GeometryFactory.create(this.trackShape, {
            width: this.width * 1.1, height: this.height * 1.1, depth: 0.01, radius: this.height / 2
        });
        const mat = MaterialFactory.create('neon', { color: this.onColor, intensity: 0 });
        this.glowMesh = new THREE.Mesh(geo, mat);
        this.glowMesh.position.z = -this.depth / 2 - 0.05;
        this.glowMesh.visible = false;
        this.group.add(this.glowMesh);
    }

    toggle() {
        this.isOn = !this.isOn;
        this.scaleVelocity = -0.05; // Kick
        this.createIcon(); // Update icon for new state
        this.updateVisualState();
    }

    updateVisualState(force = false) {
        // Target calculations
        const targetHandleX = this.isOn ? (this.width / 2 - this.height / 2) : -(this.width / 2 - this.height / 2);
        const targetColor = this.isOn ? this.onColor : this.offColor;

        // Animations handled in update() loop usually, 
        // but simple state props set here.

        if (this.glowMesh) {
            this.glowMesh.visible = this.isOn;
            if (this.isOn) {
                this.glowMesh.material.color.setHex(this.onColor);
                this.glowMesh.material.emissive.setHex(this.onColor);
            }
        }

        // Only swap material color if standard/matte. Glass usually stays constant color or slight tint.
        if (this.trackMaterialType !== 'glass' && this.trackMaterialType !== 'metal') {
            if (this.trackMesh) this.trackMesh.material.color.setHex(targetColor);
        } else if (this.trackMesh && this.trackMaterialType === 'glass') {
            // Tint glass
            this.trackMesh.material.color.setHex(this.isOn ? this.onColor : this.offColor);
        }

        // Handle Material
        if (this.handleMesh) {
            this.handleMesh.material.emissiveIntensity = this.isOn ? 0.8 : 0.0;
            this.handleMesh.material.emissive.setHex(this.isOn ? this.onColor : 0x000000);
        }
    }

    update() {
        // 1. Spring Physics for Handle
        const handleR = this.height * 0.4;
        const targetX = this.isOn ? (this.width / 2 - handleR * 1.2) : -(this.width / 2 - handleR * 1.2);

        const displacement = targetX - this.currentHandlePosition;
        const force = displacement * this.tension;

        this.velocity += force;
        this.velocity *= this.friction;
        this.currentHandlePosition += this.velocity;

        if (this.handleMesh) {
            this.handleMesh.position.x = this.currentHandlePosition;

            // Add subtle rotation based on velocity (rolling effect)
            if (this.handleShape === 'sphere' || this.handleShape === 'cylinder') {
                this.handleMesh.rotation.z = -this.currentHandlePosition * 2;
            }
        }

        // 2. Spring Physics for Scale
        this.targetScale = this.isHovered ? 1.05 : 1.0;
        if (this.isPressed) this.targetScale = 0.95;

        const scaleDiff = this.targetScale - this.currentScale;
        this.scaleVelocity += scaleDiff * 0.2; // stiffer spring for scale
        this.scaleVelocity *= 0.8; // higher damping
        this.currentScale += this.scaleVelocity;

        this.group.scale.setScalar(this.currentScale);
    }

    onMouseClick(event) {
        // console.log('Toggle3D Click:', this.label); 
        if (!this.isEnabled || !this.camera) return;

        const intersect = this.checkIntersection(this.camera, event);
        if (intersect) {
            console.log('Toggle3D: Click Intersected!', this.label);
            this.toggle();
            if (this.config.onClick) this.config.onClick(this.isOn);
        } else {
            // console.log('Toggle3D: Click Missed', this.getMousePosition(event, event.target));
        }
    }
}
