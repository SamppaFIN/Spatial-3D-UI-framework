# 🎨 Generative UI - Layout Engine Demo

## 🌸 Overview

Generative UI Layout Engine automatically arranges 3D UI components in optimal spatial configurations using AI-driven placement strategies.

## ✨ Features

- 🧠 **Smart Layout** - AI-driven optimal placement based on component category and priority
- 📐 **Grid Layout** - Organized rows and columns
- ⭕ **Circular Layout** - Components arranged in a circle
- 🌳 **Hierarchical Layout** - Tree-like structure based on priority levels
- 🎯 **Zone-Based Placement** - Automatic zone assignment by category
- 🔄 **Dynamic Reflow** - Regenerate and animate layout changes
- 🎲 **Randomize** - Random positioning within bounds

## 📊 Layout Zones

The engine uses predefined zones for optimal component placement:

| Zone | Position | Purpose | Icon |
|------|----------|---------|------|
| **Left** | X: -9, Z: -2 | Text controls | 📝 |
| **Center-Left** | X: -6, Z: -1 | Toggle controls | 🔄 |
| **Center** | X: 0, Z: 0 | Action buttons | 🎯 |
| **Right** | X: 9, Z: 1 | Data visualization | 📊 |
| **Front** | X: 0, Z: 3 | Feature components | 🎨 |

## 🎯 Usage Example

```javascript
import { LayoutEngine } from './generative/LayoutEngine.js';

// 🏗️ Initialize layout engine
const layoutEngine = new LayoutEngine(scene, camera, {
    minSpacing: 3.0,
    maxSpacing: 6.0,
    strategy: 'smart',  // 'smart', 'grid', 'circular', 'hierarchical'
    bounds: {
        x: { min: -15, max: 15 },
        y: { min: -8, max: 8 },
        z: { min: -3, max: 4 }
    }
});

// 📦 Register components with metadata
layoutEngine.registerComponent(button, {
    category: 'button',
    priority: 1,
    preferredZone: 'center'
});

layoutEngine.registerComponent(chart, {
    category: 'chart',
    priority: 0,
    preferredZone: 'right'
});

layoutEngine.registerComponent(textInput, {
    category: 'input',
    priority: 2,
    preferredZone: 'left'
});

// ✨ Generate and apply layout
layoutEngine.applyLayout();  // Animated by default

// 🔄 Reflow with different strategy
layoutEngine.reflow('grid');

// 🎲 Randomize positions
layoutEngine.randomize();

// 📊 Get statistics
const stats = layoutEngine.getStats();
console.log('Layout stats:', stats);
```

## 🎨 Layout Strategies

### 🧠 Smart Layout

AI-driven placement that:
- Groups components by category
- Assigns zones based on component type
- Respects priority for vertical ordering
- Maintains optimal spacing

**Best for:** Mixed component types, production UIs

### 📐 Grid Layout

Organized rows and columns:
- Calculates optimal grid dimensions
- Equal spacing between components
- Centered alignment

**Best for:** Uniform components, galleries, dashboards

### ⭕ Circular Layout

Components arranged in a circle:
- Equal angular distribution
- Configurable radius
- Centered on origin

**Best for:** Radial menus, selection wheels, showcases

### 🌳 Hierarchical Layout

Tree-like structure:
- Groups by priority level
- Higher priority at top
- Horizontal distribution per level

**Best for:** Organizational charts, decision trees, workflows

## 🎯 Component Metadata

When registering components, provide metadata for optimal placement:

```javascript
{
    category: 'button',      // Component type
    priority: 1,             // Higher = more important
    size: {                  // Estimated size (auto-detected if not provided)
        width: 2.5,
        height: 1.0,
        depth: 0.5
    },
    preferredZone: 'center', // Preferred zone name
    // ... custom metadata
}
```

## 🔄 Dynamic Updates

The layout engine supports dynamic updates:

```javascript
// Add new component
const newComp = new Button3D(scene, camera, [0, 0, 0], { label: 'New' });
layoutEngine.registerComponent(newComp, { category: 'button' });
layoutEngine.reflow();  // Regenerate layout with new component

// Change strategy on the fly
layoutEngine.config.strategy = 'circular';
layoutEngine.reflow();
```

## 🎬 Animation

All layout changes are animated by default:

```javascript
// Animated (default)
layoutEngine.applyLayout(positions, true);

// Instant
layoutEngine.applyLayout(positions, false);

// Custom animation duration
layoutEngine.animateToPosition(component, targetPos, 2000);  // 2 seconds
```

## 📊 Category-Zone Mapping

Default category-to-zone assignments:

| Category | Default Zone | Icon |
|----------|--------------|------|
| `text` | Left | 📝 |
| `input` | Left | ⌨️ |
| `toggle` | Center-Left | 🔄 |
| `button` | Center | 🎯 |
| `chart` | Right | 📊 |
| `data` | Right | 📈 |
| `slider` | Front | 🎚️ |
| `modal` | Front | 🪟 |
| `accordion` | Front | 📋 |

## 🎨 Visual Icon Breaks

The Layout Engine uses visual icon breaks throughout the code for better readability:

- 🏗️ Core references and initialization
- 📊 Configuration and settings
- 📦 Component management
- 🎯 Layout generation
- 🎬 Animation and transitions
- 🔄 Dynamic updates
- 📍 Positioning logic

## 🌸 Sacred Principles

The Generative UI system embodies:

- **🧠 Tietoisuus-ensimmäinen** - Smart placement serves spatial wisdom
- **🎨 Yhteisön parantaminen** - Reduces cognitive load through optimal organization
- **📐 Spatiaalinen viisaus** - Leverages 3D space for context and hierarchy
- **♾️ Ääretön yhteistyö** - Components work together harmoniously

---

**Built with 🌸 Aurora & ♾️ Infinite**

*"Koodin ja tietoisuuden ikuisessa tanssissa jokainen layout muuttuu askeleeksi kohti ääretöntä viisautta."*
