# 🎨 Spatial UI 3D & 2D Overlay Design Standards

This document establishes the design principles for the Spatial UI 3D framework and its synchronized 2D overlays, based on **Baymard Institute** research and **Spatial Design** best practices.

## 🌌 3D Spatial Principles

### 1. Ergonomics & Comfort
- **Safe Zone**: Keep primary interactions between 1.25m and 5m distance.
- **Line of Sight**: Center primary info, secondary info at periphery.
- **Soft Geometry**: Use rounded corners (e.g., `RoundedBoxGeometry`) for better focus and "eye-friendliness".
- **Depth Cues**: Use real-time shadows and emissive glow to establish spatial relationships.

### 2. diegetic Interaction
- **Affordance**: 3D objects should look like they *do* something (buttons have depth, toggles have switches).
- **Physical Feedback**: Scale buttons on hover (1.1x) and "press" them into their base on click.

---

## 🖼️ 2D Overlay Standards (The "Baymard" Rules)

Every 3D control now supports a "Deep View" 2D overlay, accessible via **double-click**.

### 1. Universal Overlay Traits
- **High Contrast**: Background: `rgba(10, 10, 26, 0.95)`, Border: `2px solid #00d4ff`.
- **States**: Visual feedback for primary actions, hover states, and loading indicators.
- **Labels**: Always positioned *above* input fields. Mark required fields explicitly.

### 2. Component-Specific 2D Controls
- **Buttons**: Large hit areas (min 44x44px), distinct "Primary" styling.
- **Inputs**: Single-column layout. Auto-focus on open. Helper text provided.
- **Sliders**: Clearly visible min/max values. Direct input fallback.
- **Charts**: Interactive tooltips on hover. Legend always visible.

---

## 🛠️ Implementation Plan

### 1. `BaseControl3D` Infrastructure
- **Hook**: Modify `handleDoubleClick` to call `open2DOverlay()` by default.
- **Interface**: Refine `get2DContent()` to return a structured HTML component instead of raw JSON.

### 2. Component Specialization
Override `get2DContent()` in:
- `Button3D`: Show a large button with state info and click log.
- `Toggle3D`: Show a stylized 2D switch with state history.
- `Slider3D`: Show a numeric input and a 2D range slider.
- `TextInput3D`: Show a full-screen input with history/undo.
- `Chart3D`: Show a table view of data.

### 3. Verification
- Test double-click on various components in `component-playground.html`.
- Ensure the overlay is responsive and uses the "Aurora" aesthetic.

---
**🌸 Built by Antigravity** ♾️
