import { BaseControl3D } from '../core/BaseControl3D.js';
import { getHTMLOverlay } from '../utils/HTMLOverlay.js';
import * as THREE from 'three';

export class Chart3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            renderer: config.renderer || null,
            onClick: config.onClick || null
        });

        // Chart-specific properties
        this.chartType = config.chartType || 'line'; // 'line', 'bar', 'pie', 'doughnut'
        this.data = config.data || { labels: [], datasets: [] };
        this.width = config.width || 4.0;
        this.height = config.height || 3.0;
        this.depth = config.depth || 0.1;

        // Mode system: 3 different shapes
        this.mode = config.mode || 0;
        this.modes = ['box', 'sphere', 'sacred'];

        // Colors
        this.backgroundColor = config.backgroundColor || 0x1a1a2e;
        this.borderColor = config.borderColor || 0x4a4a6e;

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

        this.createChartPanel();
        this.createChart();
        this.updateVisualState();
    }

    createChartPanel() {
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
                geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
                break;
            case 'sacred':
                const size = Math.min(this.width, this.height) / 2;
                geometry = new THREE.OctahedronGeometry(size, 0);
                break;
        }

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

    getOverlayPosition() {
        // Calculate world position of the front face
        // Takes into account group position, rotation, and SCALE
        const zOffset = this.depth / 2 + 0.01; // Small offset from face
        const localPos = new THREE.Vector3(0, 0, zOffset);

        // Convert to world space
        this.group.updateMatrixWorld(true);
        return localPos.applyMatrix4(this.group.matrixWorld);
    }

    createChart() {
        const htmlOverlay = getHTMLOverlay();

        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.width = this.width * 100;
        canvas.height = this.height * 100;
        canvas.className = 'spatial-chart';
        canvas.style.width = `${this.width * 100}px`;
        canvas.style.height = `${this.height * 100}px`;

        const ctx = canvas.getContext('2d');
        this.renderChart(ctx, canvas.width, canvas.height);

        // Position at the front of the panel
        const position = this.getOverlayPosition();
        const rotation = this.group.rotation;

        // Create overlay
        htmlOverlay.createOverlay(`chart_${this.controlId}`, canvas, position, {
            className: 'spatial-chart',
            scale: [0.01, 0.01, 0.01],
            rotation: [rotation.x, rotation.y, rotation.z],
            styles: {
                opacity: '1'
            }
        });

        htmlOverlay.setVisible(`chart_${this.controlId}`, true);
        this.chartCanvas = canvas;
        this.chartContext = ctx;
    }

    renderChart(ctx, width, height) {
        // Clear canvas
        ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        ctx.fillRect(0, 0, width, height);

        // Draw chart based on type
        switch (this.chartType) {
            case 'line':
                this.renderLineChart(ctx, width, height);
                break;
            case 'bar':
                this.renderBarChart(ctx, width, height);
                break;
            case 'pie':
            case 'doughnut':
                this.renderPieChart(ctx, width, height);
                break;
            default:
                this.renderLineChart(ctx, width, height);
        }
    }

    renderLineChart(ctx, width, height) {
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Draw axes
        ctx.strokeStyle = '#6a6a8e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = '#3a3a5e';
        ctx.lineWidth = 1;
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding + (chartHeight / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw data
        if (this.data.labels && this.data.labels.length > 0 && this.data.datasets && this.data.datasets.length > 0) {
            const dataset = this.data.datasets[0];
            const values = dataset.data || [];
            const maxValue = Math.max(...values, 1);

            ctx.strokeStyle = dataset.borderColor || '#6bb6ff';
            ctx.fillStyle = dataset.backgroundColor || 'rgba(107, 182, 255, 0.2)';
            ctx.lineWidth = 3;

            ctx.beginPath();
            values.forEach((value, index) => {
                const x = padding + (chartWidth / (values.length - 1 || 1)) * index;
                const y = height - padding - (chartHeight * value / maxValue);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Fill area under line
            ctx.lineTo(width - padding, height - padding);
            ctx.lineTo(padding, height - padding);
            ctx.closePath();
            ctx.fill();
        }
    }

    renderBarChart(ctx, width, height) {
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Draw axes
        ctx.strokeStyle = '#6a6a8e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw bars
        if (this.data.labels && this.data.labels.length > 0 && this.data.datasets && this.data.datasets.length > 0) {
            const dataset = this.data.datasets[0];
            const values = dataset.data || [];
            const maxValue = Math.max(...values, 1);
            const barWidth = chartWidth / values.length * 0.8;
            const barSpacing = chartWidth / values.length * 0.2;

            values.forEach((value, index) => {
                const x = padding + (chartWidth / values.length) * index + barSpacing / 2;
                const barHeight = (chartHeight * value / maxValue);
                const y = height - padding - barHeight;

                ctx.fillStyle = dataset.backgroundColor || '#6bb6ff';
                ctx.fillRect(x, y, barWidth, barHeight);

                // Bar border
                ctx.strokeStyle = dataset.borderColor || '#4a9eff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, barWidth, barHeight);
            });
        }
    }

    renderPieChart(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;

        if (this.data.labels && this.data.labels.length > 0 && this.data.datasets && this.data.datasets.length > 0) {
            const dataset = this.data.datasets[0];
            const values = dataset.data || [];
            const total = values.reduce((sum, val) => sum + val, 0);

            if (total === 0) return;

            const colors = dataset.backgroundColor || [
                '#6bb6ff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf',
                '#ff8b94', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'
            ];

            let currentAngle = -Math.PI / 2; // Start at top

            values.forEach((value, index) => {
                const sliceAngle = (value / total) * Math.PI * 2;

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();

                ctx.fillStyle = colors[index % colors.length];
                ctx.fill();

                ctx.strokeStyle = '#1a1a2e';
                ctx.lineWidth = 2;
                ctx.stroke();

                currentAngle += sliceAngle;
            });

            // Draw hole for doughnut chart
            if (this.chartType === 'doughnut') {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
                ctx.fill();
            }
        }
    }

    updateChart(newData, chartType = null) {
        if (chartType) {
            this.chartType = chartType;
        }
        if (newData) {
            this.data = newData;
        }

        // Re-render chart
        if (this.chartCanvas && this.chartContext) {
            this.renderChart(this.chartContext, this.chartCanvas.width, this.chartCanvas.height);
        }
    }

    update() {
        // Smooth scale animation
        this.currentScale += (this.targetScale - this.currentScale) * this.animationSpeed;
        this.group.scale.setScalar(this.currentScale);
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
        const scale = this.group.getWorldScale(new THREE.Vector3()).multiplyScalar(0.01);

        htmlOverlay.updateTransform(`chart_${this.controlId}`, position, rotation, scale);
    }

    dispose() {
        // Remove HTML overlay
        const htmlOverlay = getHTMLOverlay();
        htmlOverlay.removeOverlay(`chart_${this.controlId}`);
        super.dispose();
    }
}
