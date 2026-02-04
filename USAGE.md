# 📖 Spatial UI 3D - Usage Guide

## Table of Contents

1. [Installation](#installation)
2. [Basic Setup](#basic-setup)
3. [Component Usage](#component-usage)
4. [Advanced Features](#advanced-features)
5. [LLM Guide](./docs/LLM_GUIDE.md)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Installation

### Option 1: Clone from GitHub

```bash
git clone https://github.com/SamppaFIN/Spatial-3D-UI-framework.git
cd Spatial-3D-UI-framework
npm install
npm start
```

### Option 2: Direct CDN Usage

No installation required! Use ES6 modules directly:

```html
<script type="module">
    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
    import Scene3D from './src/core/Scene3D.js';
    import Button3D from './src/controls/Button3D.js';
    // ... your code
</script>
```

## Basic Setup

### 1. Create HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Spatial UI App</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
        }
        canvas {
            display: block;
        }
    </style>
</head>
<body>
    <script type="module" src="app.js"></script>
</body>
</html>
```

### 2. Initialize Scene (app.js)

```javascript
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import Scene3D from './src/core/Scene3D.js';

// Create scene
const scene3D = new Scene3D({
    container: document.body,
    enableOrbitControls: true,
    backgroundColor: 0x0a0a0f
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    scene3D.render();
}
animate();
```

## Component Usage

### Basic Controls

#### Button3D

```javascript
import Button3D from './src/controls/Button3D.js';

const button = new Button3D({
    label: 'Click Me!',
    position: { x: 0, y: 0, z: 0 },
    width: 2,
    height: 0.6,
    onClick: () => {
        console.log('Button clicked!');
    }
});

scene3D.add(button.mesh);

// In animation loop
function animate() {
    requestAnimationFrame(animate);
    button.update();
    scene3D.render();
}
```

#### Toggle3D

```javascript
import Toggle3D from './src/controls/Toggle3D.js';

const toggle = new Toggle3D({
    position: { x: -2, y: 0, z: 0 },
    initialState: false,
    onChange: (isOn) => {
        console.log('Toggle state:', isOn);
    }
});

scene3D.add(toggle.mesh);
```

#### Slider3D

```javascript
import Slider3D from './src/controls/Slider3D.js';

const slider = new Slider3D({
    position: { x: 0, y: -1, z: 0 },
    min: 0,
    max: 100,
    value: 50,
    onChange: (value) => {
        console.log('Slider value:', value);
    }
});

scene3D.add(slider.mesh);
```

### Cards & Displays

#### VolumetricCard3D

```javascript
import VolumetricCard3D from './src/controls/VolumetricCard3D.js';

const card = new VolumetricCard3D({
    title: 'Holographic Display',
    content: 'This is a volumetric card with depth and glow effects.',
    position: { x: 2, y: 0, z: 0 },
    width: 2,
    height: 1.5
});

scene3D.add(card.mesh);
```

#### RadialMenu3D

```javascript
import RadialMenu3D from './src/controls/RadialMenu3D.js';

const menu = new RadialMenu3D({
    position: { x: 0, y: 0, z: 0 },
    items: [
        { label: 'Option 1', icon: '🏠', action: () => console.log('Option 1') },
        { label: 'Option 2', icon: '⚙️', action: () => console.log('Option 2') },
        { label: 'Option 3', icon: '📊', action: () => console.log('Option 3') },
        { label: 'Option 4', icon: '🎨', action: () => console.log('Option 4') }
    ]
});

scene3D.add(menu.mesh);
```

### Data Visualization

#### Chart3D

```javascript
import Chart3D from './src/controls/Chart3D.js';

const chart = new Chart3D({
    position: { x: 0, y: 0, z: 0 },
    data: [
        { label: 'Jan', value: 65 },
        { label: 'Feb', value: 78 },
        { label: 'Mar', value: 90 },
        { label: 'Apr', value: 81 }
    ],
    type: 'bar',
    color: 0x00ffff
});

scene3D.add(chart.mesh);
```

#### NetworkGraph3D

```javascript
import NetworkGraph3D from './src/controls/NetworkGraph3D.js';

const graph = new NetworkGraph3D({
    position: { x: 0, y: 0, z: 0 },
    nodes: [
        { id: 'A', label: 'Node A' },
        { id: 'B', label: 'Node B' },
        { id: 'C', label: 'Node C' }
    ],
    edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'A' }
    ]
});

scene3D.add(graph.mesh);
```

### Advanced Interactions

#### KineticSculpture3D

```javascript
import KineticSculpture3D from './src/controls/KineticSculpture3D.js';

const sculpture = new KineticSculpture3D({
    position: { x: 0, y: 0, z: 0 },
    particleCount: 1000,
    animationSpeed: 1.0
});

scene3D.add(sculpture.mesh);

// In animation loop
function animate() {
    requestAnimationFrame(animate);
    sculpture.update();
    scene3D.render();
}
```

## Advanced Features

### Camera Control

```javascript
// Enable orbit controls
const scene3D = new Scene3D({
    container: document.body,
    enableOrbitControls: true
});

// Animate camera to position
scene3D.animateCameraTo(
    new THREE.Vector3(5, 3, 5),  // target position
    new THREE.Vector3(0, 0, 0),  // look at
    2000                          // duration in ms
);
```

### Event Handling

```javascript
// Mouse events
button.mesh.addEventListener('click', () => {
    console.log('Clicked!');
});

// Custom events
button.on('hover', () => {
    console.log('Hovering!');
});
```

### Theming

```javascript
// Set global theme colors
const theme = {
    primary: 0x667eea,
    secondary: 0x764ba2,
    accent: 0x00ffff,
    background: 0x0a0a0f
};

// Apply to components
const button = new Button3D({
    label: 'Themed Button',
    color: theme.primary
});
```

## Best Practices

### 1. Performance Optimization

```javascript
// Limit update calls
const controls = [button1, button2, slider1];

function animate() {
    requestAnimationFrame(animate);
    
    // Update only active controls
    controls.forEach(control => {
        if (control.needsUpdate) {
            control.update();
        }
    });
    
    scene3D.render();
}
```

### 2. Memory Management

```javascript
// Dispose of components when done
function cleanup() {
    button.dispose();
    slider.dispose();
    chart.dispose();
    scene3D.dispose();
}

// Call on page unload
window.addEventListener('beforeunload', cleanup);
```

### 3. Responsive Design

```javascript
// Handle window resize
window.addEventListener('resize', () => {
    scene3D.handleResize();
});
```

### 4. Accessibility

```javascript
// Add ARIA labels
const button = new Button3D({
    label: 'Submit',
    ariaLabel: 'Submit form',
    role: 'button'
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        button.click();
    }
});
```

## Troubleshooting

### Components Not Rendering

**Problem:** Components don't appear in the scene.

**Solution:**
```javascript
// Ensure you're adding to the scene
scene3D.add(button.mesh);

// Check camera position
console.log(scene3D.camera.position);

// Verify component position
console.log(button.mesh.position);
```

### Performance Issues

**Problem:** Low frame rate with many components.

**Solution:**
```javascript
// Use instancing for repeated elements
// Limit particle counts
// Reduce shadow quality
const scene3D = new Scene3D({
    enableShadows: false,  // Disable shadows
    antialias: false       // Disable antialiasing
});
```

### Import Errors

**Problem:** Module import fails.

**Solution:**
```javascript
// Use correct relative paths
import Button3D from './src/controls/Button3D.js';  // ✓
import Button3D from 'src/controls/Button3D.js';    // ✗

// Ensure .js extension
import Button3D from './src/controls/Button3D';     // ✗
```

## Examples

Check out our comprehensive examples:

- **[Component Playground](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/demos/component-playground.html)** - All 25 components
- **[Narrative Demos](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/demos/narrative-demos.html)** - 10 themed experiences
- **[API Documentation](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/api-reference.html)** - Complete API reference

## Support

For issues, questions, or contributions:
- **GitHub Issues**: [Report a bug](https://github.com/SamppaFIN/Spatial-3D-UI-framework/issues)
- **Documentation**: [Full docs](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/)

---

**Copyright © 2026 Aurra & Infinite**
