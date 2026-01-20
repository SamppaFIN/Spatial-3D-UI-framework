import { BaseControl3D } from '../core/BaseControl3D.js';
import { MarkdownRenderer } from '../utils/MarkdownRenderer.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';
import * as THREE from 'three';

export class TextDisplay3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null,
            onClick: config.onClick || null
        });

        // TextDisplay-specific properties
        this.content = config.content || '';
        this.width = config.width || 4.0;
        this.height = config.height || 3.0;
        this.depth = config.depth || 0.1;

        // Mode system: 3 different shapes
        this.mode = config.mode || 0;
        this.modes = ['box', 'sphere', 'sacred'];

        // Colors
        this.backgroundColor = config.backgroundColor || 0x1a1a2e;
        this.borderColor = config.borderColor || 0x4a4a6e;

        // NEW: Copy button
        this.copyButton = config.copyButton || false;
        this.copyButtonMesh = null;

        // NEW: Syntax highlighting
        this.syntaxHighlight = config.syntaxHighlight || null; // Language name

        // NEW: Search functionality
        this.searchable = config.searchable || false;
        this.searchTerm = '';
        this.searchMatches = [];

        // NEW: Style presets
        this.style = config.style || 'default'; // default, post-it, dialog, idea, board, message
        this.customClass = config.customClass || '';

        // Animation properties
        this.animationSpeed = 0.1;
        this.targetScale = 1.0;
        this.currentScale = 1.0;
        this.hoverScale = 1.02;

        if (this.group) {
            while (this.group.children.length > 0) {
                this.group.remove(this.group.children[0]);
            }
            this.create();
        }
    }

    create() {
        if (!this.modes || this.mode === undefined) {
            return;
        }

        this.createDisplayPanel();
        this.createContent();
        this.updateVisualState();
    }

    createDisplayPanel() {
        if (this.panelMesh) {
            this.group.remove(this.panelMesh);
            this.panelMesh.geometry.dispose();
            this.panelMesh.material.dispose();
        }

        let geometry;
        switch (this.modes[this.mode]) {
            case 'box':
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
                break;
            case 'sphere':
                // Use rounded box for sphere mode
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
                break;
            case 'sacred':
                // Use octahedron for sacred geometry
                const size = Math.min(this.width, this.height) / 2;
                geometry = new THREE.OctahedronGeometry(size, 0);
                break;
        }

        // Create gradient material
        const material = new THREE.MeshStandardMaterial({
            color: this.backgroundColor,
            metalness: 0.3,
            roughness: 0.7,
            emissive: this.borderColor,
            emissiveIntensity: 0.1
        });

        this.panelMesh = new THREE.Mesh(geometry, material);
        this.panelMesh.castShadow = true;
        this.panelMesh.receiveShadow = true;
        this.group.add(this.panelMesh);
    }

    createContent() {
        if (!this.content) return;

        // Use HTML overlay for markdown content
        const htmlOverlay = getHTMLOverlay();
        const htmlContent = MarkdownRenderer.render(this.content);

        // Create content element
        const contentElement = document.createElement('div');
        contentElement.className = `spatial-text-display ${this.style} ${this.customClass}`;
        contentElement.innerHTML = htmlContent;
        contentElement.style.width = `${this.width * 100}px`;
        contentElement.style.height = `${this.height * 100}px`;
        contentElement.style.overflow = 'auto';
        contentElement.style.padding = '20px';

        // Calculate correct position
        const position = this.getOverlayPosition();
        const rotation = this.group.rotation; // Initial rotation

        // Create overlay with small scale for CSS3DRenderer
        htmlOverlay.createOverlay(`textdisplay_${this.controlId}`, contentElement, position, {
            className: `spatial-text-display ${this.style} ${this.customClass}`,
            scale: [0.01, 0.01, 0.01],
            rotation: [rotation.x, rotation.y, rotation.z],
            styles: {
                opacity: '1'
            }
        });

        htmlOverlay.setVisible(`textdisplay_${this.controlId}`, true);
    }

    getOverlayPosition() {
        // Calculate world position of the front face
        // Takes into account group position, rotation, and SCALE
        const zOffset = this.depth / 2 + 0.02; // Small offset from face
        const localPos = new THREE.Vector3(0, 0, zOffset);

        // Convert to world space
        // Note: applyMatrix4 with matrixWorld would work, but manual composition allows partial update if needed
        // Assuming this.group.updateMatrixWorld() might not have been called yet if created in same frame
        this.group.updateMatrixWorld(true);
        return localPos.applyMatrix4(this.group.matrixWorld);
    }

    setContent(newContent) {
        this.content = newContent;
        // Update HTML overlay content
        const htmlOverlay = getHTMLOverlay();
        const htmlContent = MarkdownRenderer.render(newContent);
        htmlOverlay.updateContent(`textdisplay_${this.controlId}`, htmlContent);
    }

    setStyle(newStyle) {
        this.style = newStyle;
        const htmlOverlay = getHTMLOverlay();
        htmlOverlay.updateClass(`textdisplay_${this.controlId}`, `spatial-text-display ${this.style} ${this.customClass}`);
    }

    update() {
        // Smooth scale animation
        this.currentScale += (this.targetScale - this.currentScale) * this.animationSpeed;
        if (Math.abs(this.targetScale - this.currentScale) > 0.001) {
            this.group.scale.setScalar(this.currentScale);
        }

        // Always update visual state to sync overlay with potentially moving/scaling parent
        this.updateVisualState();
    }

    onHover() {
        super.onHover();
        this.targetScale = this.hoverScale;
    }

    onHoverLeave() {
        super.onHoverLeave();
        this.targetScale = 1.0;
    }

    updateVisualState() {
        super.updateVisualState();

        // precise update of overlay transform
        const htmlOverlay = getHTMLOverlay();

        // We must update matrix world to get accurate world position including scale
        this.group.updateMatrixWorld();

        const position = this.getOverlayPosition();
        const rotation = new THREE.Euler().setFromQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
        const scale = this.group.getWorldScale(new THREE.Vector3()).multiplyScalar(0.01); // 0.01 is base scale for CSS units

        htmlOverlay.updateTransform(`textdisplay_${this.controlId}`, position, rotation, scale);
    }

    dispose() {
        // Remove HTML overlay
        const htmlOverlay = getHTMLOverlay();
        htmlOverlay.removeOverlay(`textdisplay_${this.controlId}`);
        super.dispose();
    }
}
