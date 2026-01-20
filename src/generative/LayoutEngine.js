import * as THREE from 'three';

/**
 * 🎨 Generative UI Layout Engine
 * 
 * AI-driven layout adaptation system that automatically arranges
 * 3D UI components in optimal spatial configurations.
 * 
 * Features:
 * - 🧠 Smart component placement
 * - 📐 Automatic spacing optimization
 * - 🎯 Context-aware grouping
 * - ✨ Visual hierarchy management
 * - 🔄 Dynamic reflow on changes
 */

export class LayoutEngine {
    constructor(scene, camera, config = {}) {
        // 🏗️ Core references
        this.scene = scene;
        this.camera = camera;

        // 📊 Layout configuration
        this.config = {
            // 📐 Spacing rules
            minSpacing: config.minSpacing || 3.0,
            maxSpacing: config.maxSpacing || 6.0,
            groupSpacing: config.groupSpacing || 9.0,

            // 🎯 Layout bounds
            bounds: config.bounds || {
                x: { min: -15, max: 15 },
                y: { min: -8, max: 8 },
                z: { min: -3, max: 4 }
            },

            // 🎨 Layout strategies
            strategy: config.strategy || 'smart', // 'smart', 'grid', 'circular', 'hierarchical'

            // ✨ Visual preferences
            alignToGrid: config.alignToGrid !== false,
            respectDepth: config.respectDepth !== false,
            avoidOverlap: config.avoidOverlap !== false
        };

        // 📦 Managed components
        this.components = [];
        this.groups = new Map(); // Category -> components

        // 🎯 Layout zones
        this.zones = {
            left: { x: -9, z: -2, label: '📝 Text Zone' },
            centerLeft: { x: -6, z: -1, label: '🔄 Toggle Zone' },
            center: { x: 0, z: 0, label: '🎯 Action Zone' },
            right: { x: 9, z: 1, label: '📊 Data Zone' },
            front: { x: 0, z: 3, label: '🎨 Feature Zone' }
        };
    }

    // 🎯 Register a component for layout management
    registerComponent(component, metadata = {}) {
        const componentData = {
            component,
            metadata: {
                category: metadata.category || 'general',
                priority: metadata.priority || 0,
                size: metadata.size || this.estimateSize(component),
                preferredZone: metadata.preferredZone || null,
                ...metadata
            },
            bounds: null
        };

        this.components.push(componentData);

        // 🗂️ Add to category group
        const category = componentData.metadata.category;
        if (!this.groups.has(category)) {
            this.groups.set(category, []);
        }
        this.groups.get(category).push(componentData);

        return componentData;
    }

    // 📏 Estimate component size from its group
    estimateSize(component) {
        if (!component.group) return { width: 2, height: 1, depth: 0.5 };

        const box = new THREE.Box3().setFromObject(component.group);
        const size = new THREE.Vector3();
        box.getSize(size);

        return {
            width: size.x || 2,
            height: size.y || 1,
            depth: size.z || 0.5
        };
    }

    // 🎨 Generate optimal layout based on strategy
    generateLayout(strategy = null) {
        const layoutStrategy = strategy || this.config.strategy;

        console.log(`🎨 Generating ${layoutStrategy} layout for ${this.components.length} components...`);

        switch (layoutStrategy) {
            case 'smart':
                return this.generateSmartLayout();
            case 'grid':
                return this.generateGridLayout();
            case 'circular':
                return this.generateCircularLayout();
            case 'hierarchical':
                return this.generateHierarchicalLayout();
            default:
                return this.generateSmartLayout();
        }
    }

    // 🧠 Smart layout: AI-driven optimal placement
    generateSmartLayout() {
        const positions = [];

        // 📊 Sort by priority and category
        const sorted = [...this.components].sort((a, b) => {
            if (a.metadata.priority !== b.metadata.priority) {
                return b.metadata.priority - a.metadata.priority;
            }
            return a.metadata.category.localeCompare(b.metadata.category);
        });

        // 🎯 Assign zones based on category
        const categoryZones = {
            'text': 'left',
            'input': 'left',
            'toggle': 'centerLeft',
            'button': 'center',
            'chart': 'right',
            'data': 'right',
            'slider': 'front',
            'modal': 'front',
            'accordion': 'front'
        };

        // 📐 Place components in zones
        const zoneCounts = {};

        sorted.forEach((compData, index) => {
            const category = compData.metadata.category;
            const zoneName = compData.metadata.preferredZone || categoryZones[category] || 'center';
            const zone = this.zones[zoneName];

            if (!zoneCounts[zoneName]) zoneCounts[zoneName] = 0;

            // 📍 Calculate position within zone
            const yOffset = zoneCounts[zoneName] * (compData.metadata.size.height + this.config.minSpacing);
            const position = {
                x: zone.x,
                y: 4 - yOffset, // Start from top
                z: zone.z
            };

            positions.push(position);
            zoneCounts[zoneName]++;
        });

        return positions;
    }

    // 📐 Grid layout: Organized rows and columns
    generateGridLayout() {
        const positions = [];
        const cols = Math.ceil(Math.sqrt(this.components.length));
        const spacing = this.config.minSpacing + 1;

        this.components.forEach((compData, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;

            positions.push({
                x: (col - cols / 2) * spacing,
                y: 4 - row * spacing,
                z: 0
            });
        });

        return positions;
    }

    // ⭕ Circular layout: Components arranged in a circle
    generateCircularLayout() {
        const positions = [];
        const radius = 8;
        const angleStep = (Math.PI * 2) / this.components.length;

        this.components.forEach((compData, index) => {
            const angle = index * angleStep;
            positions.push({
                x: Math.cos(angle) * radius,
                y: 0,
                z: Math.sin(angle) * radius
            });
        });

        return positions;
    }

    // 🌳 Hierarchical layout: Tree-like structure
    generateHierarchicalLayout() {
        const positions = [];
        const levels = new Map();

        // 📊 Group by priority (level)
        this.components.forEach(compData => {
            const level = compData.metadata.priority || 0;
            if (!levels.has(level)) levels.set(level, []);
            levels.get(level).push(compData);
        });

        // 📐 Arrange each level
        let currentY = 6;
        Array.from(levels.keys()).sort((a, b) => b - a).forEach(level => {
            const comps = levels.get(level);
            const spacing = this.config.minSpacing;
            const totalWidth = (comps.length - 1) * spacing;

            comps.forEach((compData, index) => {
                positions.push({
                    x: -totalWidth / 2 + index * spacing,
                    y: currentY,
                    z: 0
                });
            });

            currentY -= (this.config.minSpacing + 2);
        });

        return positions;
    }

    // 🎯 Apply generated layout to components
    applyLayout(positions = null, animated = true) {
        const layoutPositions = positions || this.generateLayout();

        if (layoutPositions.length !== this.components.length) {
            console.warn('⚠️ Position count mismatch!');
            return;
        }

        console.log(`✨ Applying layout to ${this.components.length} components...`);

        this.components.forEach((compData, index) => {
            const targetPos = layoutPositions[index];
            const component = compData.component;

            if (!component.group) return;

            if (animated) {
                // 🎬 Smooth animation to new position
                this.animateToPosition(component, targetPos);
            } else {
                // 📍 Instant positioning
                component.group.position.set(targetPos.x, targetPos.y, targetPos.z);

                // 🔄 Update tooltips and labels
                if (component.updateTooltipAndLabelPositions) {
                    component.updateTooltipAndLabelPositions();
                }
            }
        });
    }

    // 🎬 Animate component to target position
    animateToPosition(component, targetPos, duration = 1000) {
        if (!component.group) return;

        const startPos = component.group.position.clone();
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 🌊 Easing function (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // 📍 Interpolate position
            component.group.position.lerpVectors(startPos, new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z), eased);

            // 🔄 Update tooltips and labels
            if (component.updateTooltipAndLabelPositions) {
                component.updateTooltipAndLabelPositions();
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // 🔄 Reflow layout (regenerate and apply)
    reflow(strategy = null) {
        console.log('🔄 Reflowing layout...');
        const positions = this.generateLayout(strategy);
        this.applyLayout(positions, true);
    }

    // 🎲 Randomize positions within bounds
    randomize() {
        console.log('🎲 Randomizing positions...');
        const positions = this.components.map(() => ({
            x: this.config.bounds.x.min + Math.random() * (this.config.bounds.x.max - this.config.bounds.x.min),
            y: this.config.bounds.y.min + Math.random() * (this.config.bounds.y.max - this.config.bounds.y.min),
            z: this.config.bounds.z.min + Math.random() * (this.config.bounds.z.max - this.config.bounds.z.min)
        }));
        this.applyLayout(positions, true);
    }

    // 📊 Get layout statistics
    getStats() {
        const stats = {
            totalComponents: this.components.length,
            categories: {},
            zones: {}
        };

        // 📈 Count by category
        this.groups.forEach((comps, category) => {
            stats.categories[category] = comps.length;
        });

        // 📍 Count by zone
        Object.keys(this.zones).forEach(zoneName => {
            stats.zones[zoneName] = 0;
        });

        return stats;
    }
}
