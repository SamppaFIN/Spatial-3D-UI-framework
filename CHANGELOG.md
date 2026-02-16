# 📋 Changelog

All notable changes to the Spatial UI 3D Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-16

### 📚 Documentation Overhaul

#### Added
- **Comprehensive LLM Takeover Guide** in README.md — complete instructions for AI agents to understand, use, and extend the framework
  - Full architecture tree with file descriptions
  - BaseControl3D lifecycle documentation
  - Complete component reference table (35 controls)
  - Step-by-step new component creation guide
  - Import map and full page template
  - 10 critical rules for LLMs
  - Debugging cheatsheet
  - Reading priority list
- **4 New Mathematical Body Components** since v1.0
  - Gömböc3D - Self-righting shape
  - MeissnerBody3D - Meissner body of constant width
  - Sphericon3D - Sphericon rolling geometry
  - ReuleauxTriangle3D - Reuleaux triangle body
- **5 New Experimental Components** since v1.0
  - ChronoLens3D - Temporal lens
  - LiquidStateContainer3D - Liquid simulation
  - GestureLoom3D - Gesture weaving
  - AIChatBot3D - AI chatbot component
  - Oloid3D - Oloid geometric sculpture

#### Changed
- Updated CONTRIBUTING.md with correct port (3002) and BaseControl3D patterns
- Updated LLM_GUIDE.md to reference comprehensive README guide
- Updated component count from 25 to 26+ across documentation

---

## [1.0.0] - 2026-01-22

### 🎉 Initial Release

#### Added
- **25 Interactive 3D Components** across 5 categories
  - 6 Basic Controls (Button3D, Toggle3D, Slider3D, TextInput3D, TextDisplay3D, Modal3D)
  - 7 Cards & Displays (VolumetricCard3D, HaloCard3D, PortalCard3D, MagneticCard3D, AIPortal3D, Accordion3D, RadialMenu3D)
  - 4 Data Visualization (Chart3D, DataVolume3D, NetworkGraph3D, HoloMap3D)
  - 5 Advanced Interactions (EchoInteraction3D, HapticHorizon3D, KineticSculpture3D, IKManipulator3D, FlowFieldController3D)
  - 2 Experimental (SpatialScrubber3D, TimeRibbon3D)

- **10 Narrative Demos** showcasing components in themed contexts:
  - 🚀 Space Station Control Center
  - 🏛️ Virtual Museum Gallery
  - 🌊 Underwater Research Lab
  - ⚡ Cyberpunk Hacker Terminal
  - ✨ Magic Spell Workshop
  - ⏰ Time Traveler's Dashboard
  - 👽 Alien Communication Hub
  - 🎸 Virtual Concert Stage
  - ⚛️ Quantum Computer Lab
  - 💭 Dream Architect Studio

- **Component Playground** - Interactive showcase of all 25 controls in one demo
- **Comprehensive Documentation**
  - Getting Started Guide
  - API Reference
  - Architecture Overview
  - Accessibility Guide
  - Usage Guide
  - Contributing Guidelines

- **GitHub Pages Deployment** - Live showcase website
- **Core Systems**
  - Scene3D - 3D scene management
  - Camera controls with smooth transitions
  - Event handling system
  - Shader effects library

#### Technical Details
- Built with Three.js v0.160.0
- ES6 module architecture
- Zero build step required
- WebGL-based rendering
- Responsive design support

---

**Copyright © 2026 Aurra & Infinite**
