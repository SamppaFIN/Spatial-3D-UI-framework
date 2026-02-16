# 🌌 Spatial UI 3D Framework

> **Next-generation 3D user interface library for immersive web experiences**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-green.svg)](https://threejs.org/)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://samppafin.github.io/Spatial-3D-UI-framework/)

## 🚀 Overview

Spatial UI 3D is a comprehensive framework for building stunning 3D user interfaces in the browser. With **26+ interactive components**, smooth animations, and a focus on spatial design, it enables developers to create immersive experiences that go beyond traditional 2D interfaces.

**[🎮 Live Demo](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/)** | **[📚 Documentation](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/)** | **[🎯 Component Playground](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/demos/component-playground.html)**

---

## 🤖 LLM Complete Takeover Guide

**This section contains everything an AI agent needs to fully understand, use, and extend this library.** Read this section first before touching any code.

### 🏛️ Architecture Overview

```
spatial-ui-3d/
├── src/
│   ├── core/                    # 🧠 Framework foundation
│   │   ├── BaseControl3D.js     # Base class for ALL controls (1126 lines)
│   │   ├── Scene3D.js           # Scene, camera, renderer, lights setup
│   │   ├── ControlRegistry.js   # Singleton registry for all controls
│   │   ├── RoomManager.js       # Environment/room switching
│   │   ├── SpatialLayout.js     # Ergonomic 3D UI placement (zones)
│   │   └── ThemeManager.js      # Global theming system (5 themes)
│   │
│   ├── controls/                # 🎮 35 component files
│   │   ├── Button3D.js          # Interactive buttons (3 geometry modes)
│   │   ├── Toggle3D.js          # On/off switches
│   │   ├── Slider3D.js          # Numeric & value-array sliders
│   │   ├── TextInput3D.js       # 3D text input with HTML overlay
│   │   ├── TextDisplay3D.js     # Markdown renderer in 3D space
│   │   ├── Modal3D.js           # Modal dialogs
│   │   ├── Accordion3D.js       # Collapsible sections
│   │   ├── Chart3D.js           # Chart.js integration in 3D
│   │   ├── VolumetricCard3D.js  # Holographic cards
│   │   ├── HaloCard3D.js        # Glowing halo cards
│   │   ├── PortalCard3D.js      # Portal-style cards
│   │   ├── MagneticCard3D.js    # Magnetic attraction cards
│   │   ├── AIPortal3D.js        # AI-themed portal
│   │   ├── RadialMenu3D.js      # Circular radial menus
│   │   ├── DataVolume3D.js      # Volumetric data displays
│   │   ├── NetworkGraph3D.js    # 3D network visualizations
│   │   ├── HoloMap3D.js         # Holographic maps
│   │   ├── EchoInteraction3D.js # Echo-based interactions
│   │   ├── HapticHorizon3D.js   # Haptic feedback simulation
│   │   ├── KineticSculpture3D.js# Animated kinetic sculptures
│   │   ├── IKManipulator3D.js   # Inverse kinematics
│   │   ├── FlowFieldController3D.js # Flow field controllers
│   │   ├── Oloid3D.js           # Oloid geometric sculpture
│   │   ├── Gomboc3D.js          # Gömböc mathematical body
│   │   ├── MeissnerBody3D.js    # Meissner body of constant width
│   │   ├── Sphericon3D.js       # Sphericon geometry
│   │   ├── ReuleauxTriangle3D.js# Reuleaux triangle body
│   │   ├── SpatialScrubber3D.js # Timeline scrubber
│   │   ├── TimeRibbon3D.js      # Time-based ribbon
│   │   ├── ChronoLens3D.js      # Temporal lens
│   │   ├── LiquidStateContainer3D.js # Liquid simulation
│   │   ├── GestureLoom3D.js     # Gesture weaving
│   │   ├── AIChatBot3D.js       # AI chatbot component
│   │   └── SpatialControls.js   # Touch/spatial controls
│   │
│   ├── effects/
│   │   └── ShaderEffects.js     # GLSL shaders (glow, hologram, etc.)
│   │
│   ├── environments/            # 🌍 Room backgrounds
│   │   ├── BaseRoom.js          # Environment base class
│   │   ├── SpaceRoom.js         # Starfield space
│   │   ├── LandscapeRoom.js     # Mountain landscape
│   │   ├── CoordinateRoom.js    # 3D coordinate grid
│   │   ├── CoordinatePlane.js   # Grid plane helper
│   │   ├── SpatialEnvironment.js# Spatial environment manager
│   │   └── StarfieldBackground.js # Animated starfield
│   │
│   ├── utils/                   # 🔧 Helper utilities
│   │   ├── HTMLOverlay.js       # 2D HTML layer over 3D canvas
│   │   ├── MarkdownRenderer.js  # Markdown → HTML converter
│   │   ├── ButtonFactory.js     # Button generation helpers
│   │   ├── GeometryFactory.js   # Geometry creation helpers
│   │   ├── MaterialFactory.js   # Material creation helpers
│   │   ├── ParticleSystem.js    # Particle effects
│   │   └── AudioHaptics.js      # Sound/haptic feedback
│   │
│   ├── ai/                      # 🧠 AI integration
│   │   ├── AIService.js         # OpenAI API connector
│   │   └── SemanticGhost.js     # Semantic visualization
│   │
│   ├── game/                    # 🎮 Game modules
│   ├── generative/              # 🎲 Generative layout engine
│   └── main.js                  # Full demo entry point
│
├── showcase/                    # 🎪 Live demo website
│   ├── index.html               # Showcase hub (78KB)
│   ├── components/              # 26 individual component pages
│   ├── demos/                   # 50+ narrative demo experiences
│   ├── docs/                    # HTML documentation
│   ├── scripts/                 # mobile-controls.js, etc.
│   └── styles/                  # showcase.css, responsive.css
│
├── docs/                        # 📚 Markdown documentation
│   ├── COMPONENT_SPECS.md       # Full API specs for all controls
│   ├── LLM_GUIDE.md             # Original LLM guide
│   ├── GENERATIVE_UI_GUIDE.md   # Layout engine guide
│   ├── UI_DESIGN_STANDARDS.md   # Design standards
│   ├── DEMO_REDESIGN_PLAN.md    # Demo redesign notes
│   └── MVP_PLAN.md              # MVP plan
│
├── tests/                       # 🧪 Playwright tests
├── package.json                 # npm config (http-server only)
├── USAGE.md                     # Usage guide with code examples
├── CONTRIBUTING.md              # Contribution guidelines
├── CHANGELOG.md                 # Version history
└── LICENSE                      # MIT
```

### 🧠 Core Concepts You MUST Understand

#### 1. BaseControl3D — The Blueprint (Most Important File)

**File:** `src/core/BaseControl3D.js` (1126 lines)

Every interactive component inherits from `BaseControl3D`. It provides:

| System | What It Does |
|--------|-------------|
| **State** | Key-value store via `this.state`, updated with `this.set(key, value)` |
| **Events** | `on(event, cb)`, `off(event, cb)`, `emit(event, data)` |
| **Raycasting** | Automatic hit-testing for `hover`, `click`, `press`, `release` |
| **HTML Overlays** | Tooltip and label system anchored to 3D objects |
| **Camera Focus** | `focusCamera()` smoothly flies camera to the control |
| **Edit Mode** | `setEditMode(true)` adds TransformControls for positioning |
| **2D Overlay** | `open2DOverlay()` shows detailed HTML panel for editing properties |
| **Serialization** | `toJSON()` / `fromJSON()` for saving/loading state |
| **AI Labels** | `updateLabelWithAI()` generates labels via OpenAI API |

**Constructor signature:**
```javascript
new BaseControl3D(scene, camera, position = [0, 0, 0], config = {})
```

**Critical pattern — every control follows this lifecycle:**
```javascript
constructor(scene, camera, position, config) {
    super(scene, camera, position, config);  // Sets up group, state, events
    this.create();  // Build your 3D mesh
}
create() {
    // Build THREE.js geometry + material → this.mesh
    // Add to this.group (already in scene)
}
update(delta) {
    // Called every frame — animate, lerp, etc.
}
onStateChange(key, value, oldValue) {
    // React to state changes (e.g., color, label, isOn)
}
dispose() {
    // Clean up geometry, materials, event listeners
}
```

#### 2. Scene3D — Scene Setup

**File:** `src/core/Scene3D.js` (108 lines)

Creates a complete Three.js environment:
- `THREE.PerspectiveCamera` (55° FOV)
- `THREE.WebGLRenderer` with antialiasing + shadows
- `OrbitControls` with damping
- `HTMLOverlay` system for 2D elements on top of 3D
- Ambient + directional lighting

```javascript
const canvas = document.getElementById('canvas');
const scene3D = new Scene3D(canvas);
const scene = scene3D.getScene();       // THREE.Scene
const camera = scene3D.getCamera();     // THREE.PerspectiveCamera
const renderer = scene3D.getRenderer(); // THREE.WebGLRenderer
const controls = scene3D.getControls(); // OrbitControls
```

#### 3. ControlRegistry — Global Management

**File:** `src/core/ControlRegistry.js` (83 lines)

Singleton that tracks all controls:
```javascript
ControlRegistry.register(control);       // Auto-called by BaseControl3D
ControlRegistry.unregister(control);
ControlRegistry.setEditMode(true);       // Enable gizmos on ALL controls
ControlRegistry.setOrbitControls(ctrl);  // Link orbit controls
ControlRegistry.getAll();                // Get all controls array
```

#### 4. ThemeManager — Global Theming

**File:** `src/core/ThemeManager.js` (276 lines)

5 built-in themes: `cosmic`, `aurora`, `midnight`, `nature`, `cyberpunk`

```javascript
import { themeManager } from './core/ThemeManager.js';

themeManager.setTheme('cyberpunk');
themeManager.getColor('primary');       // Returns hex number
themeManager.getThreeColor('accent');   // Returns THREE.Color
themeManager.createMaterial('primary'); // Returns THREE.MeshStandardMaterial
themeManager.applyToScene(scene);       // Set background color
themeManager.applyToDOM();              // Apply CSS variables
themeManager.onChange(theme => { ... }); // Listen to changes
themeManager.addTheme('custom', { primary: 0xff0000, ... }); // Add custom
```

#### 5. SpatialLayout — Ergonomic Placement

**File:** `src/core/SpatialLayout.js` (124 lines)

3 spatial zones for VR/AR-style placement:

| Zone | Distance | Use |
|------|----------|-----|
| `direct` | 0.4m | Hand reach (small controls) |
| `primary` | 1.5m | Focus area (main UI) |
| `peripheral` | 4.0m | Background/ambient |

Supports `world`, `body`, and `billboard` anchoring with deadzone and spring physics.

### 📋 Complete Component Reference

#### How to Instantiate ANY Component

```javascript
// All controls follow the SAME pattern:
const control = new ComponentName(scene, camera, [x, y, z], {
    // Common config:
    label: 'My Label',
    width: 2.5,
    height: 1.0,
    mode: 0,              // 0=box, 1=sphere, 2=sacred geometry
    renderer: renderer,   // Required for HTML overlays/tooltips
    tooltip: {
        content: '**Markdown** tooltip text',
        position: 'top',  // 'top', 'bottom', 'left', 'right'
        offset: [0, 1.5, 0]
    },
    // Component-specific props...
});
```

#### Component Quick Reference Table

| Component | Import Path | Key Config | Events |
|-----------|-------------|-----------|--------|
| **Button3D** | `./src/controls/Button3D.js` | `label`, `width`, `height`, `mode` | `onClick(button)` |
| **Toggle3D** | `./src/controls/Toggle3D.js` | `isOn`, `onColor`, `offColor` | `onClick(toggle)` |
| **Slider3D** | `./src/controls/Slider3D.js` | `min`, `max`, `step`, `value` OR `values[]`, `valueIndex` | `onChange(slider, value)`, `onChangeEnd` |
| **TextInput3D** | `./src/controls/TextInput3D.js` | `placeholder`, `value` | `onChange(input, value)`, `onSubmit(input, value)` |
| **TextDisplay3D** | `./src/controls/TextDisplay3D.js` | `content` (markdown) | — |
| **Modal3D** | `./src/controls/Modal3D.js` | `title`, `isOpen` | `onOpen(modal)`, `onClose(modal)` |
| **Accordion3D** | `./src/controls/Accordion3D.js` | `items[]`, `openItems[]` | `onItemToggle(accordion, index, isOpen)` |
| **Chart3D** | `./src/controls/Chart3D.js` | `chartType`, `data`, `options` | — |
| **RadialMenu3D** | `./src/controls/RadialMenu3D.js` | `items[{label, icon, action}]` | per-item `action()` |
| **VolumetricCard3D** | `./src/controls/VolumetricCard3D.js` | `title`, `content` | — |
| **HaloCard3D** | `./src/controls/HaloCard3D.js` | `title`, `content` | — |
| **PortalCard3D** | `./src/controls/PortalCard3D.js` | `title`, `content` | — |
| **MagneticCard3D** | `./src/controls/MagneticCard3D.js` | `title`, `content` | — |
| **AIPortal3D** | `./src/controls/AIPortal3D.js` | `title` | — |
| **DataVolume3D** | `./src/controls/DataVolume3D.js` | `data` | — |
| **NetworkGraph3D** | `./src/controls/NetworkGraph3D.js` | `nodes[]`, `edges[]` | — |
| **HoloMap3D** | `./src/controls/HoloMap3D.js` | `data` | — |
| **EchoInteraction3D** | `./src/controls/EchoInteraction3D.js` | — | — |
| **HapticHorizon3D** | `./src/controls/HapticHorizon3D.js` | — | — |
| **KineticSculpture3D** | `./src/controls/KineticSculpture3D.js` | `particleCount`, `animationSpeed` | — |
| **IKManipulator3D** | `./src/controls/IKManipulator3D.js` | — | — |
| **FlowFieldController3D** | `./src/controls/FlowFieldController3D.js` | — | — |
| **Oloid3D** | `./src/controls/Oloid3D.js` | — | — |
| **Gomboc3D** | `./src/controls/Gomboc3D.js` | — | — |
| **MeissnerBody3D** | `./src/controls/MeissnerBody3D.js` | — | — |
| **Sphericon3D** | `./src/controls/Sphericon3D.js` | — | — |
| **ReuleauxTriangle3D** | `./src/controls/ReuleauxTriangle3D.js` | — | — |
| **SpatialScrubber3D** | `./src/controls/SpatialScrubber3D.js` | — | — |
| **TimeRibbon3D** | `./src/controls/TimeRibbon3D.js` | — | — |
| **ChronoLens3D** | `./src/controls/ChronoLens3D.js` | — | — |
| **LiquidStateContainer3D** | `./src/controls/LiquidStateContainer3D.js` | — | — |
| **GestureLoom3D** | `./src/controls/GestureLoom3D.js` | — | — |
| **AIChatBot3D** | `./src/controls/AIChatBot3D.js` | — | — |

### 🎨 Geometry Modes (All Controls)

Every control supports 3 geometry modes via `mode` config:

| Mode | Value | Shape | Best For |
|------|-------|-------|----------|
| Box | `0` | Rectangular/sharp | Professional UIs, dashboards |
| Sphere | `1` | Rounded/organic | Friendly, playful UIs |
| Sacred | `2` | Octahedron/tetrahedron | Mystical/futuristic UIs |

### 🔧 Utility Systems

| Utility | File | Purpose |
|---------|------|---------|
| HTMLOverlay | `src/utils/HTMLOverlay.js` | Projects HTML elements over 3D canvas |
| MarkdownRenderer | `src/utils/MarkdownRenderer.js` | Converts markdown to styled HTML |
| GeometryFactory | `src/utils/GeometryFactory.js` | Creates rounded boxes, sacred geometry |
| MaterialFactory | `src/utils/MaterialFactory.js` | Creates themed materials |
| ButtonFactory | `src/utils/ButtonFactory.js` | Generates button meshes |
| ParticleSystem | `src/utils/ParticleSystem.js` | Particle burst effects |
| AudioHaptics | `src/utils/AudioHaptics.js` | Sound/vibration feedback |

### 🌍 Environment System

| Room | File | Description |
|------|------|-------------|
| Space | `src/environments/SpaceRoom.js` | Animated starfield (default) |
| Landscape | `src/environments/LandscapeRoom.js` | Mountains with procedural terrain |
| Coordinate | `src/environments/CoordinateRoom.js` | 3D grid coordinate system |

```javascript
const roomManager = new RoomManager(scene, camera);
roomManager.initialize();              // Creates Space room by default
roomManager.switchRoom('landscape');   // Switch room
roomManager.update();                  // Call in animation loop
```

### 🤖 AI Integration

| Module | File | Description |
|--------|------|-------------|
| AIService | `src/ai/AIService.js` | OpenAI API connector for label generation |
| SemanticGhost | `src/ai/SemanticGhost.js` | Semantic data visualization entity |

### ⚡ Step-by-Step: Creating a New Component

```javascript
// 1. Create file: src/controls/MyWidget3D.js
import { BaseControl3D } from '../core/BaseControl3D.js';
import * as THREE from 'three';

export class MyWidget3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, config);
        
        // Custom properties
        this.color = config.color || 0x00d4ff;
        this.intensity = config.intensity || 1.0;
        
        // Build the 3D mesh
        this.create();
    }

    create() {
        // Clear previous mesh if re-creating
        if (this.mesh) {
            this.group.remove(this.mesh);
        }
        
        // Build geometry + material
        const geo = new THREE.IcosahedronGeometry(1, 2);
        const mat = new THREE.MeshStandardMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.85,
            metalness: 0.3,
            roughness: 0.4
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.group.add(this.mesh);
    }

    update(delta) {
        // Called every frame — animate here
        if (this.mesh) {
            this.mesh.rotation.y += 0.01;
        }
        // Smooth hover scale
        if (this.isHovered) {
            this.group.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
        } else {
            this.group.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }
    }

    onStateChange(key, value, oldValue) {
        if (key === 'color' && this.mesh) {
            this.mesh.material.color.set(value);
            this.mesh.material.emissive.set(value);
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

### 🌸 Design Aesthetic ("Aurora" Style)

When building with this framework, follow these principles:

1. **Vibrant Hues** — Cyan `#00d4ff`, Purple `#cc00ff`, Magenta `#ff00d4`
2. **Glassmorphism** — `transparent: true`, `opacity: 0.8`, `metalness: 0.3`
3. **Emissive Glow** — Always set `emissive` + `emissiveIntensity: 0.2-0.5`
4. **Rounded Geometry** — Use `GeometryFactory` for rounded boxes
5. **Micro-Animations** — Scale on hover (lerp to 1.1), smooth transitions
6. **Dark Backgrounds** — Default scene color `0x0a0a0f`

### 📐 Common Import Map

```javascript
// Three.js (CDN — no npm needed)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// OR if using importmap:
// <script type="importmap">
// {
//   "imports": {
//     "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
//     "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
//   }
// }
// </script>

// Core
import { Scene3D } from './src/core/Scene3D.js';
import { ControlRegistry } from './src/core/ControlRegistry.js';
import { RoomManager } from './src/core/RoomManager.js';
import { SpatialLayout } from './src/core/SpatialLayout.js';
import { themeManager } from './src/core/ThemeManager.js';

// Controls (import what you need)
import { Button3D } from './src/controls/Button3D.js';
import { Toggle3D } from './src/controls/Toggle3D.js';
import { Slider3D } from './src/controls/Slider3D.js';
import { TextInput3D } from './src/controls/TextInput3D.js';
import { TextDisplay3D } from './src/controls/TextDisplay3D.js';
import { Modal3D } from './src/controls/Modal3D.js';
import { Chart3D } from './src/controls/Chart3D.js';
// ... etc.
```

### 🚀 Full Minimal Page Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Spatial UI App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0f; overflow: hidden; }
        #canvas { width: 100vw; height: 100vh; display: block; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>

    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
        }
    }
    </script>

    <script type="module">
        import { Scene3D } from './src/core/Scene3D.js';
        import { ControlRegistry } from './src/core/ControlRegistry.js';
        import { Button3D } from './src/controls/Button3D.js';
        import { Toggle3D } from './src/controls/Toggle3D.js';
        import { Slider3D } from './src/controls/Slider3D.js';

        // 1. Initialize scene
        const canvas = document.getElementById('canvas');
        const scene3D = new Scene3D(canvas);
        const scene = scene3D.getScene();
        const camera = scene3D.getCamera();
        const renderer = scene3D.getRenderer();
        const controls = scene3D.getControls();

        // 2. Wire up ControlRegistry
        ControlRegistry.setOrbitControls(controls);

        // 3. Create components
        const button = new Button3D(scene, camera, [0, 1, 0], {
            label: 'Hello World!',
            width: 2.5,
            height: 1.0,
            mode: 0,
            renderer: renderer,
            onClick: (btn) => console.log('Clicked!')
        });

        const toggle = new Toggle3D(scene, camera, [-3, 0, 0], {
            label: 'Feature Toggle',
            isOn: false,
            renderer: renderer,
            onClick: (t) => console.log('Toggle:', t.isOn)
        });

        const slider = new Slider3D(scene, camera, [3, 0, 0], {
            label: 'Volume',
            min: 0, max: 100, value: 50, step: 5,
            renderer: renderer,
            onChange: (s, v) => console.log('Value:', v)
        });

        // 4. Animation loop
        const allControls = [button, toggle, slider];
        function animate() {
            requestAnimationFrame(animate);
            allControls.forEach(c => c.update());
            scene3D.render();
        }
        animate();
    </script>
</body>
</html>
```

### ⚠️ Critical Rules for LLMs

1. **Always use `type="module"`** in script tags — the framework is ESM
2. **Always include importmap** for Three.js and addons (or use CDN URLs)
3. **Always pass `renderer`** in config if you want tooltips/overlays to work
4. **Always call `ControlRegistry.setOrbitControls()`** before creating controls
5. **Always call `control.update()`** in the animation loop for animations
6. **Never use `.js` extension omission** — all imports MUST end with `.js`
7. **Position is an Array** `[x, y, z]`, NOT an object `{x, y, z}`
8. **Call `dispose()`** when removing controls to prevent WebGL memory leaks
9. **The framework has ZERO npm dependencies** — only Three.js via CDN/importmap
10. **File serving required** — use `npm start` (http-server on :3002) or any static server

### 🔍 Debugging Cheatsheet

| Problem | Solution |
|---------|----------|
| Nothing renders | Check `scene3D.add(control.mesh)` — but BaseControl3D auto-adds to scene |
| Tooltips don't show | Pass `renderer` in config |
| Controls don't respond to clicks | Ensure `setupEventListeners()` was called (auto in constructor) |
| Console errors on import | Check path is relative (`./src/...`) and ends with `.js` |
| CORS errors | Must serve via HTTP server, not `file://` protocol |
| Performance issues | Reduce particle counts, disable shadows: `renderer.shadowMap.enabled = false` |
| Camera won't move | Check `ControlRegistry.setOrbitControls(controls)` was called |

### 📁 Key Files to Read First

In priority order:
1. `src/core/BaseControl3D.js` — The foundation class
2. `src/core/Scene3D.js` — Scene setup
3. `src/controls/Button3D.js` — Reference implementation of a control
4. `src/main.js` — Full demo showing all components together
5. `docs/COMPONENT_SPECS.md` — Detailed API for all controls

---

## ✨ Features

- 🎨 **26+ Interactive 3D Components** - From basic buttons to advanced geometric sculptures
- 🌊 **Smooth Animations** - Fluid transitions and responsive interactions
- 🎭 **10+ Narrative Demos** - Immersive themed experiences showcasing real-world applications
- 📊 **Data Visualization** - 3D charts, graphs, and volumetric displays
- 🎮 **Advanced Interactions** - Haptic feedback, kinetic sculptures, IK manipulation
- 🌐 **Zero Build Required** - Pure ES6 modules, works directly in modern browsers
- 📱 **Responsive Design** - Adapts to different screen sizes with mobile controls toggle
- ♿ **Accessibility Focused** - Built with inclusive design principles
- 🧪 **Playwright Testing** - Automated browser tests for console errors and mobile functionality

## 🎯 Component Categories

### 📦 Basic Controls (6)
- `Button3D` - Interactive 3D buttons with hover effects
- `Toggle3D` - Smooth on/off switches
- `Slider3D` - Value sliders with real-time feedback
- `TextInput3D` - 3D text input fields
- `TextDisplay3D` - Floating text displays
- `Modal3D` - 3D modal dialogs

### 🎴 Cards & Displays (7)
- `VolumetricCard3D` - Holographic cards with depth
- `HaloCard3D` - Cards with glowing halo effects
- `PortalCard3D` - Portal-style card interfaces
- `MagneticCard3D` - Cards with magnetic attraction
- `AIPortal3D` - AI-themed portal interfaces
- `Accordion3D` - Expandable 3D accordions
- `RadialMenu3D` - Circular radial menus

### 📊 Data Visualization (4)
- `Chart3D` - 3D bar charts and graphs
- `DataVolume3D` - Volumetric data displays
- `NetworkGraph3D` - 3D network visualizations
- `HoloMap3D` - Holographic map displays

### 🎯 Advanced Interactions (6)
- `EchoInteraction3D` - Echo-based interactions
- `HapticHorizon3D` - Haptic feedback simulation
- `KineticSculpture3D` - Animated kinetic sculptures
- `IKManipulator3D` - Inverse kinematics manipulation
- `FlowFieldController3D` - Flow field controllers
- `Oloid3D` - Oloid geometric sculpture with interactive materials

### 🔬 Mathematical Bodies (4)
- `Gomboc3D` - Gömböc self-righting shape
- `MeissnerBody3D` - Meissner body of constant width
- `Sphericon3D` - Sphericon rolling geometry
- `ReuleauxTriangle3D` - Reuleaux triangle body of constant width

### 🧪 Experimental (5)
- `SpatialScrubber3D` - Spatial timeline scrubbers
- `TimeRibbon3D` - Time-based ribbon visualizations
- `ChronoLens3D` - Temporal lens component
- `LiquidStateContainer3D` - Liquid simulation container
- `GestureLoom3D` - Gesture weaving interface

## 🎬 Featured Demos

Explore our collection of **10+ narrative demos**, each showcasing components in unique thematic contexts:

- 🚀 **Space Station Control Center** - Mission control with charts and toggles
- 🏛️ **Virtual Museum Gallery** - Art exhibition with volumetric cards
- 🌊 **Underwater Research Lab** - Marine biology research station
- ⚡ **Cyberpunk Hacker Terminal** - Neon-lit hacking interface
- ✨ **Magic Spell Workshop** - Fantasy spell crafting studio
- ⏰ **Time Traveler's Dashboard** - Temporal navigation controls
- 👽 **Alien Communication Hub** - First contact interface
- 🎸 **Virtual Concert Stage** - Live music control center
- ⚛️ **Quantum Computer Lab** - Quantum computing interface
- 💭 **Dream Architect Studio** - Surreal dream creation space

**[View All Demos →](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/demos/)**

## 🚀 Quick Start

### Installation

No build step required! Simply clone and serve:

```bash
git clone https://github.com/SamppaFIN/Spatial-3D-UI-framework.git
cd Spatial-3D-UI-framework
npm install
npm start
```

Visit `http://localhost:3002` to see the showcase.

### Basic Usage

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Spatial UI App</title>
    <style>
        body { margin: 0; overflow: hidden; }
        canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
        }
    }
    </script>
    <script type="module">
        import { Scene3D } from './src/core/Scene3D.js';
        import { ControlRegistry } from './src/core/ControlRegistry.js';
        import { Button3D } from './src/controls/Button3D.js';

        const canvas = document.getElementById('canvas');
        const scene3D = new Scene3D(canvas);
        const scene = scene3D.getScene();
        const camera = scene3D.getCamera();
        const renderer = scene3D.getRenderer();

        ControlRegistry.setOrbitControls(scene3D.getControls());

        const button = new Button3D(scene, camera, [0, 0, 0], {
            label: 'Click Me!',
            renderer: renderer,
            onClick: () => console.log('Button clicked!')
        });

        function animate() {
            requestAnimationFrame(animate);
            button.update();
            scene3D.render();
        }
        animate();
    </script>
</body>
</html>
```

## 📚 Documentation

- 📖 **[Usage Guide](./USAGE.md)** - General usage and best practices
- 📍 **[Component Specs](./docs/COMPONENT_SPECS.md)** - Detailed properties for every control
- 🎨 **[Generative UI Guide](./docs/GENERATIVE_UI_GUIDE.md)** - Layout engine documentation
- 📐 **[UI Design Standards](./docs/UI_DESIGN_STANDARDS.md)** - Design standards
- **[Getting Started Guide](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/getting-started.html)** - Installation and first steps
- **[API Reference](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/api-reference.html)** - Complete component API
- **[Architecture Overview](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/architecture.html)** - System design and patterns
- **[Accessibility Guide](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/accessibility.html)** - Inclusive design practices

## 🛠️ Technology Stack

- **[Three.js](https://threejs.org/)** v0.160.0 - 3D rendering engine
- **ES6 Modules** - Modern JavaScript architecture
- **WebGL** - Hardware-accelerated graphics
- **Pure JavaScript** - No framework dependencies
- **[Playwright](https://playwright.dev/)** - End-to-end browser testing

## 📱 Mobile Controls

All component demos include an automatic mobile controls toggle for viewports ≤768px:

- A floating action button (⚙️) appears in the bottom-right corner
- Clicking it reveals/hides the properties panel with a smooth slide-up animation
- The system uses `showcase/scripts/mobile-controls.js` and responsive CSS from `showcase/styles/responsive.css`

## 🧪 Testing

The project uses Playwright for automated browser testing:

```bash
# Install test dependencies
npm install -D @playwright/test
npx playwright install chromium

# Run all tests
npx playwright test

# Run only mobile tests
npx playwright test --project "Mobile Chrome"
```

Tests verify:
- **No console errors** on page load for all demo pages
- **No 404 errors** for CSS, JS, and other resources
- **Mobile toggle functionality** on mobile viewports

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Credits

**Copyright © 2026 Aurra & Infinite**

Developed with ❤️ for the future of spatial interfaces.

---

**[🌐 Live Showcase](https://samppafin.github.io/Spatial-3D-UI-framework/)** | **[📦 GitHub Repository](https://github.com/SamppaFIN/Spatial-3D-UI-framework)**
