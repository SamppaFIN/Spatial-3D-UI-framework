import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

export class RadialMenu3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);

        // Configuration
        this.radius = config.radius || 2.0;
        this.innerRadius = config.innerRadius || 0.5;
        this.sectorColor = config.sectorColor || 0x333333;
        this.activeColor = config.activeColor || 0xff0000;
        this.hoverColor = config.hoverColor || 0xffffff;
        this.hoverZPop = config.hoverZPop || 0.3;
        this.gap = config.gap || 0.05; // Gap between sectors in radians
        this.depth = config.depth || 0.1;

        this.items = config.items || [];
        // items: [{ label, icon, action, color }]

        this.sectors = []; // Stores sector mesh data
        this.activeIndex = -1;

        if (this.group) {
            // Clear any existing children from BaseControl3D init if needed, 
            // but create() is called by BaseControl3D constructor, so we are good.
        }

        // Re-run create if needed or if data changed, but BaseControl3D calls create() in constructor.
        // However, we set properties AFTER super(), so create() in super() might run with defaults.
        // Let's manually call cleanup and create to be safe, or just relying on create() call inside constructor if properties were available?
        // Properties were NOT available during super(). So we must clear and create here.

        this.cleanup();
        this.create();
    }

    cleanup() {
        while (this.group.children.length > 0) {
            const child = this.group.children[0];
            this.group.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        }
        this.sectors = [];
    }

    create() {
        if (!this.items || this.items.length === 0) return;

        const count = this.items.length;
        const totalAngle = Math.PI * 2;
        const anglePerSector = totalAngle / count;

        // Effective angle per sector minus gap
        const effectiveAngle = anglePerSector - this.gap;

        this.items.forEach((item, index) => {
            const startAngle = index * anglePerSector + this.gap / 2;
            const endAngle = startAngle + effectiveAngle;

            // Create Sector Mesh
            const sectorMesh = this.createSectorMesh(startAngle, endAngle, item.color);
            sectorMesh.userData.index = index;
            sectorMesh.userData.item = item;

            this.group.add(sectorMesh);

            // Create Content (Icon/Label)
            const midAngle = (startAngle + endAngle) / 2;
            const contentRadius = (this.radius + this.innerRadius) / 2;
            const cx = Math.cos(midAngle) * contentRadius;
            const cy = Math.sin(midAngle) * contentRadius;

            const contentMesh = this.createContentMesh(item, cx, cy);
            if (contentMesh) {
                // contentMesh.position.set(cx, cy, this.depth + 0.02); // Positioned in createContentMesh
                sectorMesh.add(contentMesh); // Attach to sector so it moves with it
            }

            this.sectors.push({
                mesh: sectorMesh,
                baseZ: 0,
                index: index
            });
        });
    }

    createSectorMesh(start, end, itemColor) {
        const shape = new THREE.Shape();

        // Draw sector shape
        shape.absarc(0, 0, this.radius, start, end, false);
        shape.absarc(0, 0, this.innerRadius, end, start, true); // Go back inner
        shape.closePath();

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: this.depth,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 3,
            steps: 1
        });

        const color = itemColor || this.sectorColor;

        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.2,
            side: THREE.FrontSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.isInteractive = true; // For Raycaster
        mesh.userData.control = this;
        return mesh;
    }

    createContentMesh(item, x, y) {
        // Simple text label for now
        if (!item.label) return null;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128; // Wide aspect

        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(item.label, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const geo = new THREE.PlaneGeometry(1.0, 0.5);
        const mesh = new THREE.Mesh(geo, mat);

        mesh.position.set(x, y, this.depth + 0.05);
        mesh.rotation.z = 0; // Keep text horizontal? Or rotate: Math.atan2(y, x) - Math.PI/2;
        // Often horizontal is better for readability unless many items

        // Determine text rotation: if we want text UP right always?
        // Or aligned with sector?
        // Let's align with sector for radial feel, but readable.
        // Actually for now strictly horizontal is safest for MVP.

        return mesh;
    }

    // Override base class interaction
    onMouseMove(event) {
        if (!this.isEnabled || !this.camera) return;
        const intersect = this.checkIntersection(this.camera, event);

        let hoveredIndex = -1;
        if (intersect && intersect.object.userData.index !== undefined) {
            hoveredIndex = intersect.object.userData.index;
        }

        this.activeIndex = hoveredIndex;
        this.updateVisuals();
    }

    updateVisuals() {
        this.sectors.forEach((sector, i) => {
            const isHovered = (i === this.activeIndex);
            const targetZ = isHovered ? this.hoverZPop : 0;
            const targetScale = isHovered ? 1.05 : 1.0;
            const targetColor = isHovered ? this.hoverColor : (sector.mesh.userData.item.color || this.sectorColor);

            // Lerp Z (manual quick lerp for now, or just set)
            // Ideally use animation loop. 
            // For MVP let's just use simple lerp in an update() method called from main loop?
            // BaseControl doesn't enforce update().
            // We can just set it directly or use GSAP if available. 
            // Let's minimal lerp here in requestAnimationFrame? No, that's messy inside a class.
            // Let's assume the user calls update() or we hook into scene.

            // Direct set for responsiveness first
            sector.mesh.position.z = targetZ;
            sector.mesh.material.color.setHex(isHovered ? 0xffffff : targetColor); // Highlight white
            sector.mesh.material.emissive.setHex(isHovered ? 0x444444 : 0x000000);
        });
    }

    onClick() {
        if (this.activeIndex !== -1) {
            const item = this.items[this.activeIndex];
            if (item.action) item.action();
            console.log(`Radial Click: ${item.label}`);

            // Pulse effect?
        }
    }

    // Add update method for smooth animation if user loop calls it
    update() {
        // Implement smooth lerp here if called
        this.sectors.forEach((sector, i) => {
            const isHovered = (i === this.activeIndex);
            const targetZ = isHovered ? this.hoverZPop : 0;
            // Simple lerp
            sector.mesh.position.z += (targetZ - sector.mesh.position.z) * 0.2;
        });
    }
}
