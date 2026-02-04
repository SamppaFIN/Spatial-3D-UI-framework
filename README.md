# 🌌 Spatial UI 3D Framework

> **Next-generation 3D user interface library for immersive web experiences**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-0.160.0-green.svg)](https://threejs.org/)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://samppafin.github.io/Spatial-3D-UI-framework/)

## 🚀 Overview

Spatial UI 3D is a comprehensive framework for building stunning 3D user interfaces in the browser. With **26 interactive components**, smooth animations, and a focus on spatial design, it enables developers to create immersive experiences that go beyond traditional 2D interfaces.

**[🎮 Live Demo](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/)** | **[📚 Documentation](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/)** | **[🎯 Component Playground](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/demos/component-playground.html)**

## ✨ Features

- 🎨 **26 Interactive 3D Components** - From basic buttons to advanced geometric sculptures
- 🌊 **Smooth Animations** - Fluid transitions and responsive interactions
- 🎭 **10+ Narrative Demos** - Immersive themed experiences showcasing real-world applications
- 📊 **Data Visualization** - 3D charts, graphs, and volumetric displays
- 🎮 **Advanced Interactions** - Haptic feedback, kinetic sculptures, IK manipulation
- 🌐 **Zero Build Required** - Pure ES6 modules, works directly in modern browsers
- 📱 **Responsive Design** - Adapts to different screen sizes and devices
- ♿ **Accessibility Focused** - Built with inclusive design principles

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

### 🧪 Experimental (2)
- `SpatialScrubber3D` - Spatial timeline scrubbers
- `TimeRibbon3D` - Time-based ribbon visualizations

## 🎬 Featured Demos

Explore our collection of **10 narrative demos**, each showcasing components in unique thematic contexts:

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

Visit `http://localhost:8080` to see the showcase.

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
    <script type="module">
        import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
        import Scene3D from './src/core/Scene3D.js';
        import Button3D from './src/controls/Button3D.js';

        // Create scene
        const scene3D = new Scene3D({
            container: document.body,
            enableOrbitControls: true
        });

        // Add a 3D button
        const button = new Button3D({
            label: 'Click Me!',
            position: { x: 0, y: 0, z: 0 },
            onClick: () => console.log('Button clicked!')
        });

        scene3D.add(button.mesh);

        // Start animation loop
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

- 📖 **[LLM Guide](./docs/LLM_GUIDE.md)** - **Must read for AI agents** 🤖
- 📖 **[Usage Guide](./USAGE.md)** - General usage and best practices
- 📍 **[Component Specs](./docs/COMPONENT_SPECS.md)** - Detailed properties for every control
- **[Getting Started Guide](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/getting-started.html)** - Installation and first steps
- **[API Reference](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/api-reference.html)** - Complete component API
- **[Architecture Overview](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/architecture.html)** - System design and patterns
- **[Accessibility Guide](https://samppafin.github.io/Spatial-3D-UI-framework/showcase/docs/accessibility.html)** - Inclusive design practices

## 🛠️ Technology Stack

- **[Three.js](https://threejs.org/)** v0.160.0 - 3D rendering engine
- **ES6 Modules** - Modern JavaScript architecture
- **WebGL** - Hardware-accelerated graphics
- **Pure JavaScript** - No framework dependencies

## 🌟 Use Cases

- **Data Dashboards** - Visualize complex data in 3D space
- **Virtual Showrooms** - Interactive product displays
- **Educational Tools** - Immersive learning experiences
- **Gaming Interfaces** - Next-gen game menus and HUDs
- **VR/AR Prototypes** - Spatial interface design
- **Creative Tools** - 3D content creation interfaces

## 📖 Project Structure

```
spatial-ui-3d/
├── src/
│   ├── core/           # Core scene and rendering
│   ├── controls/       # 25 interactive components
│   ├── effects/        # Visual effects and shaders
│   └── utils/          # Helper utilities
├── showcase/
│   ├── demos/          # Narrative demo experiences
│   ├── components/     # Component detail pages
│   └── docs/           # Documentation
├── index.html          # Redirect to showcase
└── README.md           # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Credits

**Copyright © 2026 Aurra & Infinite**

Developed with ❤️ for the future of spatial interfaces.

---

**[🌐 Live Showcase](https://samppafin.github.io/Spatial-3D-UI-framework/)** | **[📦 GitHub Repository](https://github.com/SamppaFIN/Spatial-3D-UI-framework)**
