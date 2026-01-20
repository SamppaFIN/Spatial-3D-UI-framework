import { BaseControl3D } from '../core/BaseControl3D.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';
import * as THREE from 'three';

export class Modal3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null
        });

        // Modal-specific properties
        this.title = config.title || 'Modal';
        this.width = config.width || 6.0;
        this.height = config.height || 4.0;
        this.depth = config.depth || 0.2;

        // Mode system: 3 different shapes
        this.mode = config.mode || 0;
        this.modes = ['box', 'sphere', 'sacred'];

        // NEW: Billboard mode
        this.billboardMode = config.billboardMode || 'none'; // 'none', 'y-axis', 'full'

        // Modal state
        this.isOpen = config.isOpen !== undefined ? config.isOpen : false;
        this.isAnimating = false;

        // Colors
        this.backgroundColor = config.backgroundColor || 0x1a1a2e;
        this.borderColor = config.borderColor || 0x6bb6ff;
        this.titleColor = config.titleColor || 0xffffff;

        // Animation properties
        this.animationSpeed = 0.15;
        this.targetScale = this.isOpen ? 1.0 : 0.0;
        this.currentScale = this.targetScale;
        this.targetOpacity = this.isOpen ? 1.0 : 0.0;
        this.currentOpacity = this.targetOpacity;

        // Backdrop
        this.backdropSize = config.backdropSize || 50;
        this.backdropOpacity = config.backdropOpacity || 0.7;

        // Content container for child controls
        this.contentGroup = new THREE.Group();
        this.contentGroup.position.set(0, -0.5, this.depth / 2 + 0.01);

        // HTML content overlay
        this.htmlContent = config.htmlContent || null;
        this.contentOverlayId = null;

        // Callbacks
        this.onOpenCallback = config.onOpen || null;
        this.onCloseCallback = config.onClose || null;

        // NEW: Draggable
        this.draggable = config.draggable || false;
        this.isDragging = false;
        this.dragOffset = new THREE.Vector3();

        // NEW: Resizable
        this.resizable = config.resizable || false;
        this.minWidth = config.minWidth || 3.0;
        this.maxWidth = config.maxWidth || 12.0;
        this.minHeight = config.minHeight || 2.0;
        this.maxHeight = config.maxHeight || 10.0;
        this.isResizing = false;

        // NEW: Minimizable
        this.minimizable = config.minimizable || false;
        this.isMinimized = false;
        this.minimizedHeight = 0.6;

        // NEW: Z-index for stacking
        this.zIndex = config.zIndex || 100;

        // Create backdrop
        this.createBackdrop();

        // Create modal
        this.create();

        // Update initial visibility
        this.updateVisibility();
    }

    create() {
        if (!this.modes || this.mode === undefined) {
            return;
        }

        this.createModal();
        this.createTitle();
        this.createCloseButton();
        this.updateVisualState();
    }

    createBackdrop() {
        if (this.backdropMesh) {
            this.group.remove(this.backdropMesh);
            this.backdropMesh.geometry.dispose();
            this.backdropMesh.material.dispose();
        }

        const geometry = new THREE.PlaneGeometry(this.backdropSize, this.backdropSize);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: this.backdropOpacity,
            side: THREE.DoubleSide
        });

        this.backdropMesh = new THREE.Mesh(geometry, material);
        this.backdropMesh.position.set(0, 0, -this.depth / 2 - 0.1);
        this.backdropMesh.rotation.x = Math.PI / 2;
        this.backdropMesh.renderOrder = 9998; // High priority, but behind modal
        this.backdropMesh.userData.isBackdrop = true;
        this.backdropMesh.userData.control = this;

        this.group.add(this.backdropMesh);
    }

    createModal() {
        if (this.modalMesh) {
            this.group.remove(this.modalMesh);
            this.modalMesh.geometry.dispose();
            this.modalMesh.material.dispose();
        }

        let geometry;
        switch (this.modes[this.mode]) {
            case 'box':
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
                break;
            case 'sphere':
                // Use rounded box approximation
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth, 8, 8, 1);
                break;
            case 'sacred':
                // Use octahedron-based shape
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
                break;
        }

        const material = new THREE.MeshStandardMaterial({
            color: this.backgroundColor,
            metalness: 0.2,
            roughness: 0.6,
            emissive: this.borderColor,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: this.currentOpacity
        });

        this.modalMesh = new THREE.Mesh(geometry, material);
        this.modalMesh.castShadow = true;
        this.modalMesh.receiveShadow = true;
        this.modalMesh.renderOrder = 9999; // Highest priority
        this.modalMesh.userData.isModal = true;
        this.modalMesh.userData.control = this;

        this.group.add(this.modalMesh);

        // Add content group
        this.group.add(this.contentGroup);
    }

    getContentPosition() {
        // Calculate world position for content (below title, centered)
        // Takes into account group position, rotation, and SCALE
        const startY = -0.3; // Offset below title
        const zOffset = this.depth / 2 + 0.02; // Small offset from face
        const localPos = new THREE.Vector3(0, startY, zOffset);

        // Convert to world space
        this.group.updateMatrixWorld(true);
        return localPos.applyMatrix4(this.group.matrixWorld);
    }

    createTitle() {
        if (this.titleMesh) {
            this.group.remove(this.titleMesh);
            this.titleMesh.geometry.dispose();
            this.titleMesh.material.dispose();
        }

        // Create title text texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `#${this.titleColor.toString(16).padStart(6, '0')}`;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.title, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const geometry = new THREE.PlaneGeometry(this.width * 0.8, 0.5);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: this.currentOpacity
        });

        this.titleMesh = new THREE.Mesh(geometry, material);
        this.titleMesh.renderOrder = 10000; // Above modal
        this.titleMesh.position.set(0, this.height / 2 - 0.5, this.depth / 2 + 0.01);

        this.group.add(this.titleMesh);
    }

    createCloseButton() {
        if (this.closeButtonMesh) {
            this.group.remove(this.closeButtonMesh);
            this.closeButtonMesh.geometry.dispose();
            this.closeButtonMesh.material.dispose();
        }

        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0xff6666,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: this.currentOpacity
        });

        this.closeButtonMesh = new THREE.Mesh(geometry, material);
        this.closeButtonMesh.renderOrder = 10000; // Above modal
        this.closeButtonMesh.position.set(
            this.width / 2 - 0.3,
            this.height / 2 - 0.3,
            this.depth / 2 + 0.05
        );
        this.closeButtonMesh.castShadow = true;
        this.closeButtonMesh.userData.isCloseButton = true;
        this.closeButtonMesh.userData.control = this;

        this.group.add(this.closeButtonMesh);
    }

    open() {
        if (this.isOpen || this.isAnimating) return;

        this.isOpen = true;
        this.isAnimating = true;
        this.targetScale = 1.0;
        this.targetOpacity = 1.0;

        // Create HTML content overlay if provided
        if (this.htmlContent) {
            this.createHTMLContent();
        }

        this.updateVisibility();

        if (this.onOpenCallback) {
            this.onOpenCallback(this);
        }
    }

    createHTMLContent() {
        if (!this.htmlContent) return;

        const htmlOverlay = getHTMLOverlay();
        this.contentOverlayId = `modal_content_${this.controlId}`;

        // Create content element
        const contentElement = document.createElement('div');
        contentElement.className = 'spatial-modal-content';
        contentElement.innerHTML = this.htmlContent;

        // Calculate content dimensions to fit without scrollbar
        // Use modal dimensions minus padding
        const padding = 0.3; // 3D units
        const titleHeight = 0.8; // Title takes this much space
        const contentWidth = (this.width - padding * 2) * 100; // Convert to pixels
        const contentHeight = (this.height - padding * 2 - titleHeight) * 100; // Subtract title height

        contentElement.style.width = `${contentWidth}px`;
        contentElement.style.height = 'auto'; // Auto height to fit content
        contentElement.style.maxHeight = `${contentHeight}px`; // But limit to modal size
        contentElement.style.overflow = 'hidden'; // Hide overflow instead of scrollbar
        contentElement.style.padding = '20px';
        contentElement.style.fontSize = '14px';
        contentElement.style.color = '#ffffff';
        contentElement.style.lineHeight = '1.6';
        contentElement.style.wordWrap = 'break-word';
        contentElement.style.overflowWrap = 'break-word';

        // Position content in modal (below title, centered)
        const contentPosition = this.getContentPosition();
        const rotation = this.group.rotation;

        htmlOverlay.createOverlay(this.contentOverlayId, contentElement, contentPosition, {
            className: 'spatial-modal-content',
            scale: [0.01, 0.01, 0.01],
            rotation: [rotation.x, rotation.y, rotation.z],
            styles: {
                opacity: '1',
                transition: 'opacity 0.3s ease-in-out'
            }
        });

        htmlOverlay.setVisible(this.contentOverlayId, true);
    }

    close() {
        if (!this.isOpen || this.isAnimating) return;

        this.isOpen = false;
        this.isAnimating = true;
        this.targetScale = 0.0;
        this.targetOpacity = 0.0;

        // Remove HTML content overlay
        if (this.contentOverlayId) {
            const htmlOverlay = getHTMLOverlay();
            htmlOverlay.removeOverlay(this.contentOverlayId);
            this.contentOverlayId = null;
        }

        if (this.onCloseCallback) {
            this.onCloseCallback(this);
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    updateVisibility() {
        const visible = this.isOpen || this.currentScale > 0.01;

        if (this.modalMesh) {
            this.modalMesh.visible = visible;
        }
        if (this.titleMesh) {
            this.titleMesh.visible = visible;
        }
        if (this.closeButtonMesh) {
            this.closeButtonMesh.visible = visible;
        }
        if (this.contentGroup) {
            this.contentGroup.visible = visible;
        }
        if (this.backdropMesh) {
            this.backdropMesh.visible = visible;
        }

        // Update HTML content visibility
        if (this.contentOverlayId) {
            const htmlOverlay = getHTMLOverlay();
            htmlOverlay.setVisible(this.contentOverlayId, visible);
        }
    }

    onMouseClick(event) {
        if (!this.isEnabled || !this.camera) return;

        const intersect = this.checkIntersection(this.camera, event);
        if (intersect) {
            // Check if close button was clicked
            if (intersect.object.userData.isCloseButton) {
                this.close();
                return;
            }

            // Check if backdrop was clicked (close modal)
            if (intersect.object.userData.isBackdrop) {
                this.close();
                return;
            }
        }
    }

    addContent(control) {
        // Add a 3D control as content to the modal
        if (control && control.group) {
            this.contentGroup.add(control.group);
        }
    }

    removeContent(control) {
        // Remove a 3D control from modal content
        if (control && control.group && control.group.parent === this.contentGroup) {
            this.contentGroup.remove(control.group);
        }
    }

    updateVisualState() {
        // Animate scale
        this.currentScale += (this.targetScale - this.currentScale) * this.animationSpeed;

        // Animate opacity
        this.currentOpacity += (this.targetOpacity - this.currentOpacity) * this.animationSpeed;

        // Apply scale to modal (not backdrop)
        if (this.modalMesh) {
            this.modalMesh.scale.set(this.currentScale, this.currentScale, this.currentScale);
        }
        if (this.titleMesh) {
            this.titleMesh.scale.set(this.currentScale, this.currentScale, 1);
        }
        if (this.closeButtonMesh) {
            this.closeButtonMesh.scale.set(this.currentScale, this.currentScale, this.currentScale);
        }
        if (this.contentGroup) {
            this.contentGroup.scale.set(this.currentScale, this.currentScale, 1);
        }

        // Update opacity
        if (this.modalMesh && this.modalMesh.material) {
            this.modalMesh.material.opacity = this.currentOpacity;
        }
        if (this.titleMesh && this.titleMesh.material) {
            this.titleMesh.material.opacity = this.currentOpacity;
        }
        if (this.closeButtonMesh && this.closeButtonMesh.material) {
            this.closeButtonMesh.material.opacity = this.currentOpacity;
        }
        if (this.backdropMesh && this.backdropMesh.material) {
            this.backdropMesh.material.opacity = this.currentOpacity * this.backdropOpacity;
        }

        // Update HTML content transform
        if (this.contentOverlayId) {
            const htmlOverlay = getHTMLOverlay();
            // We must update matrix world to get accurate world position including scale
            this.group.updateMatrixWorld();

            const position = this.getContentPosition();
            const rotation = new THREE.Euler().setFromQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
            const scale = this.group.getWorldScale(new THREE.Vector3()).multiplyScalar(0.01);

            // Apply visibility based on opacity threshold
            const visible = this.currentOpacity > 0.01;
            htmlOverlay.setVisible(this.contentOverlayId, visible);

            if (visible) {
                htmlOverlay.updateTransform(this.contentOverlayId, position, rotation, scale);
                // Also update opacity directly on element if needed, though CSS transition handles it well usually.
                // We kept the transition in CSS, but we can force it here if we wanted strictly JS animation.
                // For now, let's just stick to transform.
            }
        }

        // Check if animation is complete
        if (Math.abs(this.currentScale - this.targetScale) < 0.01) {
            this.isAnimating = false;
        }

        this.updateVisibility();
    }

    update() {
        // Billboarding logic
        if (this.billboardMode !== 'none' && this.camera) {
            if (this.billboardMode === 'full') {
                this.group.lookAt(this.camera.position);
            } else if (this.billboardMode === 'y-axis') {
                // Project camera position to same Y level as group
                const target = new THREE.Vector3(
                    this.camera.position.x,
                    this.group.position.y,
                    this.camera.position.z
                );
                this.group.lookAt(target);
            }
        }

        this.updateVisualState();
    }

    isModalOpen() {
        return this.isOpen;
    }
}
