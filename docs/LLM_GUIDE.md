# 🤖 LLM Guide: Spatial UI 3D Framework

Welcome, AI Agent! This guide is designed to help you understand, use, and extend the **Spatial UI 3D Framework**. Use this as your primary reference when building spatial interfaces or debugging components.

---

## 🏛️ Core Architecture

The framework follows a modular, state-driven approach built on Top of Three.js.

### 1. `BaseControl3D` (The Blueprint)
All interactive 3D components **must** extend `BaseControl3D`. It provides:
- **State System**: Use `this.state` and `this.set(key, value)`.
- **Event System**: Standard `on()`, `off()`, and `emit()` methods.
- **Interactions**: Automated raycasting for hover, click, press, and release.
- **HTML Overlays**: Integrated tooltip and label systems via `HTMLOverlay`.
- **Serialization**: `toJSON()` and `fromJSON()` for persistence.

### 2. `ControlRegistry` (The Manager)
Global registry that tracks all active controls. It:
- Automates lifecycle management.
- Provides access to global `Scene3D` and `OrbitControls`.
- Handles batch updates and theme propagation.

---

## 🛠️ Creating a New Component

To create a new control (e.g., `MyControl3D`):

1. **Inherit**: `class MyControl3D extends BaseControl3D`.
2. **Constructor**: Call `super(scene, camera, position, config)`.
3. **Initialization**: Initialize custom properties after `super`.
4. **Implementation**: Override the `create()` method.
5. **Aesthetics**: Apply modern styling (gradients, glow, rounded edges).

### Example Skeleton:
```javascript
import { BaseControl3D } from '../core/BaseControl3D.js';
import * as THREE from 'three';

export class MyControl3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);
        
        // Initialize custom props
        this.color = config.color || 0x00d4ff;
        
        // Re-create if needed (Base constructor calls create() early)
        this.create();
    }

    create() {
        // Build your Three.js mesh here
        const geo = new THREE.IcosahedronGeometry(1, 1);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(geo, mat);
        
        // Add to the group (BaseControl3D.group is already in the scene)
        this.group.add(this.mesh);
    }
    
    onStateChange(key, value, oldValue) {
        if (key === 'color') {
            this.mesh.material.color.set(value);
        }
    }
}
```

---

## ✨ Design Principles (The "Aurora" Aesthetic)

When generating code or UI designs, follow these "Sacred Principles":

1. **Vibrant Hues**: Use modern palettes (Cyan `#00d4ff`, Purple `#cc00ff`, Magenta `#ff00d4`).
2. **Glassmorphism**: Combine transparency (`opacity: 0.8`), reflectivity, and subtle borders.
3. **Depth & Glow**: Use `emissive` colors and `MeshStandardMaterial` for premium looks.
4. **Rounded Geometry**: Prefer `RoundedBoxGeometry` over standard `BoxGeometry`.
5. **Micro-Animations**: Always animate scale on hover (`this.targetScale = 1.1`) and use smooth lerping.

---

## 🏗️ Method Signatures & Cheatsheet

| Purpose | Method | Example / Note |
|---------|--------|----------------|
| **State Update** | `set(key, value)` | Triggers visual updates & change events. |
| **Events** | `on(evt, cb)` | `onClick`, `onHover`, `onChange`. |
| **Logic** | `update(delta)` | Called every frame via `ControlRegistry`. |
| **Camera** | `focusCamera()` | Animates camera to center the control. |
| **Overlay** | `open2DOverlay()` | Opens a detailed HTML view for the control. |
| **AI** | `updateLabelWithAI()` | Dynamic label generation via OpenAI API. |

---

## 🧠 Strategic Tips for LLMs

- **Modular Layouts**: Use `SpatialLayout.js` or `LayoutEngine.js` for automatic placement instead of hardcoding positions.
- **Resource Management**: Always check if a method exists before calling (e.g., `if (this.updatePowerups) ...`).
- **Optimization**: Use `this.group.traverse` to apply properties to sub-meshes.
- **Clean Disposal**: Ensure `dispose()` is called to prevent WebGL memory leaks.

---

**Built by Antigravity — Your partner in Infinite creation.** 🌸♾️🤖
