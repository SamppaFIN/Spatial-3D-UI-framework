import { BaseControl3D } from '../core/BaseControl3D.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';
import { MarkdownRenderer } from '../utils/MarkdownRenderer.js';
import * as THREE from 'three';

export class Accordion3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null
        });

        // Accordion-specific properties
        this.width = config.width || 5.0;
        this.itemHeight = config.itemHeight || 1.0;
        this.itemSpacing = config.itemSpacing || 0.2;
        this.depth = config.depth || 0.15;

        // Mode system: 3 different shapes
        this.mode = config.mode || 0;
        this.modes = ['box', 'sphere', 'sacred'];

        // Accordion items
        this.items = config.items || [];
        this.openItems = new Set(config.openItems || []);

        // Colors
        this.headerColor = config.headerColor || 0x2a2a3e;
        this.contentColor = config.contentColor || 0x1a1a2e;
        this.borderColor = config.borderColor || 0x6bb6ff;
        this.textColor = config.textColor || 0xffffff;

        // Animation properties
        this.animationSpeed = 0.25; // Increased speed for faster opening/closing

        // Item meshes
        this.itemMeshes = [];
        this.contentGroups = [];

        // Modals for each item
        this.itemModals = new Map(); // Map of itemIndex -> Modal3D

        // Callbacks
        this.onItemToggleCallback = config.onItemToggle || null;

        this.create();
    }

    create() {
        if (!this.modes || this.mode === undefined) {
            return;
        }

        // Clear existing items
        this.itemMeshes.forEach(item => {
            if (item.headerMesh) {
                this.group.remove(item.headerMesh);
                item.headerMesh.geometry.dispose();
                item.headerMesh.material.dispose();
            }
            if (item.titleMesh) {
                this.group.remove(item.titleMesh);
                item.titleMesh.geometry.dispose();
                item.titleMesh.material.dispose();
            }
            if (item.contentMesh) {
                this.group.remove(item.contentMesh);
                item.contentMesh.geometry.dispose();
                item.contentMesh.material.dispose();
            }
            if (item.contentGroup) {
                this.group.remove(item.contentGroup);
            }
        });
        this.itemMeshes = [];
        this.contentGroups = [];

        // Create items
        this.items.forEach((itemConfig, index) => {
            this.createItem(itemConfig, index);
        });

        this.updateVisualState();
    }

    calculateItemYPosition(index) {
        // Calculate cumulative Y position based on all previous items
        // Each item takes: header height + spacing + (if open) content height
        // Items stack DOWNWARD (negative Y), so we ADD heights to move down
        let yPosition = 0;
        for (let i = 0; i < index; i++) {
            const prevItem = this.itemMeshes[i];
            if (prevItem) {
                // Add header height (move down)
                yPosition -= this.itemHeight;
                // Add spacing (move down)
                yPosition -= this.itemSpacing;
                // Add content height if open (move down further)
                if (prevItem.currentContentHeight > 0.05) {
                    yPosition -= prevItem.currentContentHeight;
                }
            } else {
                // Fallback: use default calculation if item not created yet
                yPosition -= (this.itemHeight + this.itemSpacing);
            }
        }
        return yPosition;
    }

    createItem(itemConfig, index) {
        const isOpen = this.openItems.has(index);
        // Calculate Y position dynamically based on all previous items' heights
        const itemY = this.calculateItemYPosition(index);

        // Create header
        const headerGeometry = new THREE.BoxGeometry(this.width, this.itemHeight, this.depth);
        const headerMaterial = new THREE.MeshStandardMaterial({
            color: this.headerColor,
            metalness: 0.3,
            roughness: 0.4,
            emissive: this.borderColor,
            emissiveIntensity: 0.1
        });

        const headerMesh = new THREE.Mesh(headerGeometry, headerMaterial);
        headerMesh.position.set(0, itemY, 0);
        headerMesh.castShadow = true;
        headerMesh.receiveShadow = true;
        headerMesh.userData.isAccordionHeader = true;
        headerMesh.userData.itemIndex = index;
        headerMesh.userData.control = this;

        this.group.add(headerMesh);

        // Create header text
        const titleCanvas = document.createElement('canvas');
        titleCanvas.width = 512;
        titleCanvas.height = 128;
        const titleCtx = titleCanvas.getContext('2d');

        titleCtx.fillStyle = `#${this.textColor.toString(16).padStart(6, '0')}`;
        titleCtx.font = 'bold 32px Arial';
        titleCtx.textAlign = 'left';
        titleCtx.textBaseline = 'middle';
        titleCtx.fillText(itemConfig.title || `Item ${index + 1}`, 20, titleCanvas.height / 2);

        // Add expand/collapse indicator
        const indicator = isOpen ? '▼' : '▶';
        titleCtx.textAlign = 'right';
        titleCtx.fillText(indicator, titleCanvas.width - 20, titleCanvas.height / 2);

        const titleTexture = new THREE.CanvasTexture(titleCanvas);
        titleTexture.needsUpdate = true;
        titleTexture.minFilter = THREE.LinearFilter;
        titleTexture.magFilter = THREE.LinearFilter;

        const titleGeometry = new THREE.PlaneGeometry(this.width * 0.9, this.itemHeight * 0.6);
        const titleMaterial = new THREE.MeshBasicMaterial({
            map: titleTexture,
            transparent: true
        });

        const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
        titleMesh.position.set(0, itemY, this.depth / 2 + 0.01);
        // Make titleMesh clickable too (it's in front of headerMesh)
        titleMesh.userData.isAccordionHeader = true;
        titleMesh.userData.itemIndex = index;
        titleMesh.userData.control = this;

        this.group.add(titleMesh);

        // Create content area - minimal height (just enough space, ~20px)
        // HTMLOverlay will render on top with its own size
        const contentHeight = 0.05; // Minimal height (~20px in world units)
        const contentGeometry = new THREE.BoxGeometry(this.width * 0.95, contentHeight, this.depth * 0.8);
        const contentMaterial = new THREE.MeshStandardMaterial({
            color: this.contentColor,
            metalness: 0.2,
            roughness: 0.5,
            transparent: true,
            opacity: isOpen ? 1.0 : 0.0
        });

        const contentMesh = new THREE.Mesh(contentGeometry, contentMaterial);
        contentMesh.position.set(0, itemY - this.itemHeight / 2 - contentHeight / 2, 0);
        contentMesh.visible = isOpen;
        contentMesh.castShadow = true;
        contentMesh.receiveShadow = true;

        this.group.add(contentMesh);

        // Create content group for nested controls
        const contentGroup = new THREE.Group();
        contentGroup.position.set(0, itemY - this.itemHeight / 2 - contentHeight / 2, this.depth / 2 + 0.01);
        contentGroup.visible = isOpen;

        this.group.add(contentGroup);

        // Create text content overlay if content is provided
        let contentOverlayId = null;
        // Use configured contentHeight for HTMLOverlay size, or calculate from content
        const htmlContentHeight = itemConfig.contentHeight || 4.0; // Height for HTML content display

        if (itemConfig.content) {
            contentOverlayId = `accordion_content_${this.controlId}_${index}`;
            const htmlOverlay = getHTMLOverlay();
            const htmlContent = MarkdownRenderer.render(itemConfig.content);

            const contentElement = document.createElement('div');
            contentElement.className = 'spatial-text-display';
            contentElement.innerHTML = htmlContent;
            contentElement.style.width = `${this.width * 0.9 * 100}px`;
            contentElement.style.height = `${htmlContentHeight * 0.8 * 100}px`; // Use htmlContentHeight, not minimal contentHeight
            contentElement.style.overflow = 'auto';
            contentElement.style.padding = '15px';
            contentElement.style.fontSize = '14px';

            // Position content BELOW the header (expanding downward)
            // Content should fill the allocated htmlContentHeight space below the header
            const headerBottomY = itemY - this.itemHeight / 2;
            // Content center is BELOW header bottom by half the content height
            const contentCenterY = headerBottomY - htmlContentHeight / 2;

            // Calculate world position by adding group position to local position
            const worldPosition = new THREE.Vector3();
            this.group.getWorldPosition(worldPosition);

            const contentPosition = new THREE.Vector3(
                worldPosition.x,
                worldPosition.y + contentCenterY, // Content center below header
                worldPosition.z + this.depth / 2 + 0.02
            );

            htmlOverlay.createOverlay(contentOverlayId, contentElement, contentPosition, {
                className: 'spatial-text-display',
                scale: [0.01, 0.01, 0.01],
                styles: {
                    opacity: isOpen ? '1' : '0',
                    transition: 'opacity 0.3s ease-in-out'
                }
            });

            htmlOverlay.setVisible(contentOverlayId, isOpen);
        }

        // Store item data
        const itemData = {
            index,
            headerMesh,
            titleMesh,
            contentMesh,
            contentGroup,
            contentHeight, // Minimal height for contentMesh
            htmlContentHeight, // Height for HTMLOverlay
            targetContentHeight: isOpen ? htmlContentHeight : 0, // Use htmlContentHeight for animation
            currentContentHeight: isOpen ? htmlContentHeight : 0, // Use htmlContentHeight for animation
            isOpen,
            contentOverlayId,
            config: itemConfig
        };

        this.itemMeshes.push(itemData);
        this.contentGroups.push(contentGroup);
    }

    toggleItem(index) {
        if (index < 0 || index >= this.items.length) return;

        const item = this.itemMeshes[index];
        if (!item) return;

        const wasOpen = this.openItems.has(index);

        if (wasOpen) {
            this.openItems.delete(index);
            item.isOpen = false;
            item.targetContentHeight = 0;
        } else {
            // Close other items if single-open mode (optional)
            // For now, allow multiple items open
            this.openItems.add(index);
            item.isOpen = true;
            item.targetContentHeight = item.htmlContentHeight; // Use htmlContentHeight for animation
        }

        // Update header indicator
        this.updateItemHeader(index);

        // Update positions of all items below this one (they need to shift)
        this.updateItemPositions();

        if (this.onItemToggleCallback) {
            this.onItemToggleCallback(this, index, !wasOpen);
        }
    }

    updateItemPositions() {
        // Recalculate and update Y positions for all items
        // This ensures items shift down when items above them open
        this.itemMeshes.forEach((item, index) => {
            const newY = this.calculateItemYPosition(index);

            // Update header position
            item.headerMesh.position.y = newY;

            // Update title mesh position
            if (item.titleMesh) {
                item.titleMesh.position.y = newY;
            }

            // Content position will be updated in updateVisualState based on header position
        });
    }

    updateItemHeader(index) {
        const item = this.itemMeshes[index];
        if (!item) return;

        // Recreate title texture with updated indicator
        const titleCanvas = document.createElement('canvas');
        titleCanvas.width = 512;
        titleCanvas.height = 128;
        const titleCtx = titleCanvas.getContext('2d');

        titleCtx.fillStyle = `#${this.textColor.toString(16).padStart(6, '0')}`;
        titleCtx.font = 'bold 32px Arial';
        titleCtx.textAlign = 'left';
        titleCtx.textBaseline = 'middle';
        titleCtx.fillText(item.config.title || `Item ${index + 1}`, 20, titleCanvas.height / 2);

        const indicator = item.isOpen ? '▼' : '▶';
        titleCtx.textAlign = 'right';
        titleCtx.fillText(indicator, titleCanvas.width - 20, titleCanvas.height / 2);

        if (item.titleMesh && item.titleMesh.material) {
            item.titleMesh.material.map.dispose();
            const newTexture = new THREE.CanvasTexture(titleCanvas);
            newTexture.needsUpdate = true;
            newTexture.minFilter = THREE.LinearFilter;
            newTexture.magFilter = THREE.LinearFilter;
            item.titleMesh.material.map = newTexture;
        }
    }

    onMouseClick(event) {
        if (!this.isEnabled || !this.camera) return;

        const intersect = this.checkIntersection(this.camera, event);
        if (intersect && intersect.object.userData.isAccordionHeader) {
            const itemIndex = intersect.object.userData.itemIndex;
            if (itemIndex !== undefined) {
                this.toggleItem(itemIndex);
            }
        }

        // Call parent to enable double-click camera focus
        super.onMouseClick(event);
    }

    addContentToItem(itemIndex, control) {
        // Add a 3D control as content to an accordion item
        const item = this.itemMeshes[itemIndex];
        if (item && control && control.group) {
            item.contentGroup.add(control.group);
        }
    }

    removeContentFromItem(itemIndex, control) {
        // Remove a 3D control from accordion item content
        const item = this.itemMeshes[itemIndex];
        if (item && control && control.group && control.group.parent === item.contentGroup) {
            item.contentGroup.remove(control.group);
        }
    }

    updateVisualState() {
        // Animate content height for each item
        this.itemMeshes.forEach((item, index) => {
            const prevHeight = item.currentContentHeight;
            item.currentContentHeight += (item.targetContentHeight - item.currentContentHeight) * this.animationSpeed;

            // Check if animation is complete (within small threshold)
            const heightDiff = Math.abs(item.currentContentHeight - item.targetContentHeight);
            if (heightDiff < 0.01) {
                item.currentContentHeight = item.targetContentHeight; // Snap to target
            }
        });

        // Update item positions after heights are calculated (items shift based on open content above)
        this.updateItemPositions();

        // Now update visual properties based on positions and heights
        this.itemMeshes.forEach((item, index) => {
            // Update content mesh scale and position
            const shouldBeVisible = item.currentContentHeight > 0.05;

            if (item.contentMesh) {
                if (shouldBeVisible) {
                    // Animate scale and opacity smoothly when opening
                    const scaleY = item.contentHeight > 0 ? item.currentContentHeight / item.contentHeight : 0;
                    item.contentMesh.scale.y = scaleY;
                    // Position content BELOW header (content top at header bottom)
                    const headerBottomY = item.headerMesh.position.y - this.itemHeight / 2;
                    item.contentMesh.position.y = headerBottomY - item.currentContentHeight / 2;

                    // Update opacity smoothly (use htmlContentHeight for opacity calculation)
                    if (item.contentMesh.material) {
                        item.contentMesh.material.opacity = item.htmlContentHeight > 0
                            ? Math.min(1.0, item.currentContentHeight / item.htmlContentHeight)
                            : 0;
                    }
                    item.contentMesh.castShadow = true;
                    item.contentMesh.receiveShadow = true;
                } else {
                    // Completely hide when closed
                    item.contentMesh.scale.y = 0;
                    item.contentMesh.position.y = item.headerMesh.position.y - this.itemHeight / 2;
                    if (item.contentMesh.material) {
                        item.contentMesh.material.opacity = 0;
                    }
                    item.contentMesh.castShadow = false;
                    item.contentMesh.receiveShadow = false;
                }
                item.contentMesh.visible = shouldBeVisible;
            }

            // Update content group visibility and position
            if (item.contentGroup) {
                item.contentGroup.visible = shouldBeVisible;
                const headerBottomY = item.headerMesh.position.y - this.itemHeight / 2;
                const contentTopY = headerBottomY; // Content top at header bottom
                item.contentGroup.position.y = contentTopY - item.currentContentHeight / 2;
            }

            // Update text content overlay visibility and position
            if (item.contentOverlayId) {
                const htmlOverlay = getHTMLOverlay();
                const isVisible = item.currentContentHeight > 0.05; // Lower threshold
                htmlOverlay.setVisible(item.contentOverlayId, isVisible);

                // Update position - use world coordinates to align with content mesh
                // Calculate world position for proper HTML overlay alignment
                const worldPosition = new THREE.Vector3();
                this.group.getWorldPosition(worldPosition);

                const headerBottomY = item.headerMesh.position.y - this.itemHeight / 2;
                const contentCenterY = headerBottomY - item.currentContentHeight / 2;

                const contentPosition = new THREE.Vector3(
                    worldPosition.x,
                    worldPosition.y + contentCenterY, // Add local Y to world Y
                    worldPosition.z + this.depth / 2 + 0.02
                );
                htmlOverlay.updatePosition(item.contentOverlayId, contentPosition);

                const overlay = htmlOverlay.objects.get(item.contentOverlayId);
                if (overlay && overlay.element) {
                    const opacity = item.htmlContentHeight > 0
                        ? Math.min(1.0, item.currentContentHeight / item.htmlContentHeight)
                        : 0;
                    overlay.element.style.opacity = opacity.toString();

                    // Scale height based on animation progress
                    const heightScale = item.htmlContentHeight > 0
                        ? Math.max(0.01, item.currentContentHeight / item.htmlContentHeight)
                        : 0;
                    const originalHeight = item.htmlContentHeight * 0.8 * 100;
                    overlay.element.style.height = `${originalHeight * heightScale}px`;

                    // Update position - content center is BELOW header bottom
                    const headerBottomY = item.headerMesh.position.y - this.itemHeight / 2;
                    const currentHtmlHeight = item.htmlContentHeight * heightScale;
                    const contentCenterY = headerBottomY - currentHtmlHeight / 2;

                    const contentPosition = new THREE.Vector3(
                        this.group.position.x,
                        this.group.position.y + contentCenterY, // Add local Y to world Y
                        this.group.position.z + this.depth / 2 + 0.02
                    );
                    htmlOverlay.updatePosition(item.contentOverlayId, contentPosition);
                }
            }
        });
    }

    update() {
        this.updateVisualState();
    }

    getOpenItems() {
        return Array.from(this.openItems);
    }

    isItemOpen(index) {
        return this.openItems.has(index);
    }
}
