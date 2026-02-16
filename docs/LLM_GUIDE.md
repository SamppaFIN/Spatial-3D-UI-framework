# 🤖 LLM Guide: Spatial UI 3D Framework

> **⚡ Quick Reference — For the complete guide, see the [README.md](../README.md) which contains the full LLM Takeover Guide.**

Welcome, AI Agent! This guide provides a quick-start reference for the **Spatial UI 3D Framework**. The comprehensive documentation (architecture, all components, templates, rules, debugging) is now in the README.

---

## 🏛️ Core Architecture

The framework follows a modular, state-driven approach built on top of Three.js.

### 1. `BaseControl3D` (The Blueprint)
All interactive 3D components **must** extend `BaseControl3D`. It provides:
- **State System**: Use `this.state` and `this.set(key, value)`.
- **Event System**: Standard `on()`, `off()`, and `emit()` methods.
- **Interactions**: Automated raycasting for hover, click, press, and release.
- **HTML Overlays**: Integrated tooltip and label systems via `HTMLOverlay`.
- **Camera Focus**: `focusCamera()` smoothly flies camera to the control.
- **Edit Mode**: `setEditMode(true)` adds TransformControls for positioning.
- **Serialization**: `toJSON()` and `fromJSON()` for persistence.
- **AI Labels**: `updateLabelWithAI()` for dynamic label generation via OpenAI API.

### 2. `ControlRegistry` (The Manager)
Global singleton that tracks all active controls. It:
- Automates lifecycle management.
- Provides access to global `OrbitControls`.
- Handles batch edit mode propagation.

### 3. `Scene3D` (The Stage)
Creates complete Three.js environment: camera, renderer, OrbitControls, lighting, and HTMLOverlay system.

### 4. `ThemeManager` (The Stylist)
5 built-in themes (`cosmic`, `aurora`, `midnight`, `nature`, `cyberpunk`) with custom theme support.

### 5. `SpatialLayout` (The Arranger)
Ergonomic placement with `direct`, `primary`, and `peripheral` zones for VR/AR-style UIs.

---

## 🛠️ Creating a New Component

```javascript
import { BaseControl3D } from '../core/BaseControl3D.js';
import * as THREE from 'three';

export class MyControl3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);
        this.color = config.color || 0x00d4ff;
        this.create();
    }

    create() {
        const geo = new THREE.IcosahedronGeometry(1, 1);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.85
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.group.add(this.mesh);
    }
    
    update() {
        // Called every frame — animate here
    }
    
    onStateChange(key, value, oldValue) {
        if (key === 'color') {
            this.mesh.material.color.set(value);
        }
    }
    
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        super.dispose();
    }
}
```

---

## ✨ Design Principles (The "Aurora" Aesthetic)

1. **Vibrant Hues**: Cyan `#00d4ff`, Purple `#cc00ff`, Magenta `#ff00d4`.
2. **Glassmorphism**: `transparent: true`, `opacity: 0.8`, `metalness: 0.3`.
3. **Depth & Glow**: Use `emissive` colors and `MeshStandardMaterial`.
4. **Rounded Geometry**: Prefer `GeometryFactory` rounded boxes.
5. **Micro-Animations**: Scale on hover (lerp to 1.1), smooth transitions.

---

## 🏗️ Method Signatures & Cheatsheet

| Purpose | Method | Example / Note |
|---------|--------|----------------|
| **State Update** | `set(key, value)` | Triggers visual updates & change events. |
| **Events** | `on(evt, cb)` | `onClick`, `onHover`, `onChange`. |
| **Logic** | `update(delta)` | Called every frame via animation loop. |
| **Camera** | `focusCamera()` | Animates camera to center the control. |
| **Overlay** | `open2DOverlay()` | Opens a detailed HTML view for the control. |
| **AI** | `updateLabelWithAI()` | Dynamic label generation via OpenAI API. |

---

## ⚠️ Critical Rules

1. Always use `type="module"` in script tags
2. Always include importmap for Three.js
3. Always pass `renderer` in config for tooltips
4. Always call `ControlRegistry.setOrbitControls()` first
5. Position is an Array `[x, y, z]`, NOT `{x, y, z}`
6. All imports MUST end with `.js`
7. Call `dispose()` to prevent memory leaks
8. Must serve via HTTP server (not `file://`)

---

## 🧠 Strategic Tips

- **Modular Layouts**: Use `SpatialLayout.js` or `LayoutEngine.js` for automatic placement.
- **Resource Management**: Always check if a method exists before calling.
- **Optimization**: Use `this.group.traverse` to apply properties to sub-meshes.
- **Clean Disposal**: Ensure `dispose()` is called to prevent WebGL memory leaks.

---

## 📖 Full Documentation

For the complete guide with all components, templates, and architecture details, see:
- **[README.md — LLM Complete Takeover Guide](../README.md#-llm-complete-takeover-guide)**
- **[Component Specs](./COMPONENT_SPECS.md)** — Detailed API for all controls
- **[Generative UI Guide](./GENERATIVE_UI_GUIDE.md)** — Layout engine docs
- **[Usage Guide](../USAGE.md)** — General usage examples

---

**Built by Antigravity — Your partner in Infinite creation.** 🌸♾️🤖
