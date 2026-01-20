# 🌸♾️ Component Specifications

Complete technical specifications for all Spatial UI 3D components.

## Table of Contents

- [Core Classes](#core-classes)
  - [BaseControl3D](#basecontrol3d)
  - [Scene3D](#scene3d)
  - [ControlRegistry](#controlregistry)
  - [RoomManager](#roommanager)
- [UI Components](#ui-components)
  - [Button3D](#button3d)
  - [Toggle3D](#toggle3d)
  - [Slider3D](#slider3d)
  - [TextInput3D](#textinput3d)
  - [TextDisplay3D](#textdisplay3d)
  - [Modal3D](#modal3d)
  - [Accordion3D](#accordion3d)
  - [Chart3D](#chart3d)
- [Geometry Modes](#geometry-modes)
- [Common Patterns](#common-patterns)

---

## Core Classes

### BaseControl3D

**Purpose:** Base class for all 3D UI controls. Provides common functionality for geometry creation, event handling, tooltips, and edit mode.

**Constructor:**
```javascript
new BaseControl3D(scene, camera, position, config)
```

**Parameters:**
- `scene` (THREE.Scene) - The Three.js scene
- `camera` (THREE.Camera) - The Three.js camera
- `position` (Array) - [x, y, z] position in 3D space
- `config` (Object) - Configuration options

**Config Options:**
```javascript
{
    renderer: THREE.WebGLRenderer,  // Required for HTML overlays
    tooltip: {
        content: String,            // Markdown content
        position: String,           // 'top', 'bottom', 'left', 'right'
        offset: [x, y, z]          // Custom offset from control
    },
    label: {
        content: String,            // Label text
        position: String,           // 'top', 'bottom', 'left', 'right'
        offset: [x, y, z]          // Custom offset from control
    }
}
```

**Methods:**

#### `create()`
Abstract method - must be implemented by subclasses.

#### `setupEventListeners()`
Sets up mouse and touch event listeners for interactions.

#### `onHover()`
Called when mouse enters the control. Shows tooltip.

#### `onHoverLeave()`
Called when mouse leaves the control. Hides tooltip.

#### `onClick()`
Called when control is clicked. Override in subclasses.

#### `onDoubleClick()`
Called when control is double-clicked. Focuses camera on control.

#### `focusCamera()`
Smoothly animates camera to focus on this control.

#### `setEditMode(enabled)`
Enables/disables edit mode with TransformControls.

#### `updateTooltipAndLabelPositions()`
Updates HTML overlay positions based on 3D position.

#### `dispose()`
Cleans up resources, removes from scene.

**Properties:**
- `group` (THREE.Group) - Main container for all 3D objects
- `isHovered` (Boolean) - Current hover state
- `isPressed` (Boolean) - Current press state
- `isEnabled` (Boolean) - Whether control is interactive
- `isEditMode` (Boolean) - Whether edit mode is active
- `controlId` (String) - Unique identifier

---

### Scene3D

**Purpose:** Main 3D scene management and initialization.

**Constructor:**
```javascript
new Scene3D(canvas)
```

**Parameters:**
- `canvas` (HTMLCanvasElement) - The canvas element for rendering

**Methods:**

#### `init()`
Initializes scene, camera, renderer, controls, and lighting.

#### `render()`
Renders the scene and HTML overlays.

#### `onWindowResize()`
Handles window resize events.

#### `getScene()` → THREE.Scene
Returns the Three.js scene.

#### `getCamera()` → THREE.Camera
Returns the Three.js camera.

#### `getRenderer()` → THREE.WebGLRenderer
Returns the Three.js renderer.

#### `getControls()` → OrbitControls
Returns the OrbitControls instance.

**Features:**
- WebGL renderer with antialiasing
- Perspective camera (55° FOV)
- OrbitControls with damping
- Ambient and directional lighting
- Shadow map support
- HTML overlay system

---

### ControlRegistry

**Purpose:** Global registry for managing all controls.

**Static Methods:**

#### `register(control)`
Registers a control with the registry.

#### `unregister(controlId)`
Unregisters a control by ID.

#### `getAll()` → Array
Returns all registered controls.

#### `setEditMode(enabled)`
Sets edit mode for all controls.

#### `setOrbitControls(controls)`
Sets the OrbitControls reference for coordination.

#### `getEditMode()` → Boolean
Returns current edit mode state.

---

### RoomManager

**Purpose:** Manages environment backgrounds and room switching.

**Constructor:**
```javascript
new RoomManager(scene, camera)
```

**Methods:**

#### `initialize()`
Initializes with default room (Space).

#### `switchRoom(roomName)`
Switches to a different room environment.
- `roomName` (String) - 'coordinate', 'landscape', or 'space'

#### `update()`
Updates current room animations.

#### `setEditMode(enabled)`
Propagates edit mode to current room.

**Available Rooms:**
- `coordinate` - 3D coordinate grid system
- `landscape` - Natural landscape with mountains
- `space` - Outer space with stars

---

## UI Components

### Button3D

**Purpose:** Interactive 3D button with click feedback and visual states.

**Constructor:**
```javascript
new Button3D(scene, camera, position, config)
```

**Config Options:**
```javascript
{
    label: 'Button Text',       // Button label
    width: 2.5,                 // Button width
    height: 1.0,                // Button height
    mode: 0,                    // 0=box, 1=sphere, 2=sacred
    renderer: renderer,         // Required for overlays
    onClick: (button) => {},    // Click callback
    tooltip: {
        content: 'Tooltip text',
        position: 'top',
        offset: [0, 1.5, 0]
    }
}
```

**Methods:**

#### `onClick()`
Triggered when button is clicked. Calls config.onClick callback.

#### `setLabel(newLabel)`
Updates button label text.

#### `setMode(modeIndex)`
Changes geometry mode (0=box, 1=sphere, 2=sacred).

**Visual States:**
- **Default:** Base color with subtle glow
- **Hover:** Brighter color, increased glow
- **Press:** Slight scale down, particle effect
- **Click:** Color change animation, particle burst

**Example:**
```javascript
const button = new Button3D(scene, camera, [0, 0, 0], {
    label: 'Click Me!',
    width: 2.5,
    height: 1.0,
    mode: 0,
    renderer: renderer,
    onClick: (btn) => {
        console.log('Button clicked!');
    }
});
```

---

### Toggle3D

**Purpose:** On/off switch control with animated state transitions.

**Constructor:**
```javascript
new Toggle3D(scene, camera, position, config)
```

**Config Options:**
```javascript
{
    label: 'Toggle Label',      // Toggle label
    width: 2.0,                 // Toggle width
    height: 0.6,                // Toggle height
    mode: 0,                    // 0=box, 1=sphere, 2=sacred
    isOn: false,                // Initial state
    onColor: 0x4ecdc4,          // Color when ON
    offColor: 0x666666,         // Color when OFF
    renderer: renderer,
    onClick: (toggle) => {},    // Click callback
    tooltip: { /* ... */ }
}
```

**Methods:**

#### `toggle()`
Toggles the on/off state.

#### `setOn(isOn)`
Sets the toggle state programmatically.

**Properties:**
- `isOn` (Boolean) - Current toggle state

**Visual Behavior:**
- Animated handle movement between positions
- Smooth color transition between on/off colors
- Glow effect when ON
- Scale animation on toggle

**Example:**
```javascript
const toggle = new Toggle3D(scene, camera, [0, 0, 0], {
    label: 'Dark Mode',
    width: 2.0,
    height: 0.6,
    mode: 0,
    isOn: false,
    onColor: 0x4ecdc4,
    offColor: 0x666666,
    renderer: renderer,
    onClick: (toggle) => {
        console.log('Toggle is now:', toggle.isOn ? 'ON' : 'OFF');
    }
});
```

---

### Slider3D

**Purpose:** Range slider or value selector with draggable handle.

**Constructor:**
```javascript
new Slider3D(scene, camera, position, config)
```

**Config Options (Numeric Range):**
```javascript
{
    label: 'Volume',
    width: 4.0,
    height: 0.3,
    min: 0,                     // Minimum value
    max: 100,                   // Maximum value
    step: 1,                    // Step increment
    value: 50,                  // Initial value
    mode: 0,
    renderer: renderer,
    onChange: (slider, value) => {},
    onChangeEnd: (slider, value) => {}
}
```

**Config Options (Value Array):**
```javascript
{
    label: 'Size',
    width: 4.0,
    height: 0.3,
    values: ['Small', 'Medium', 'Large'],  // Array of values
    valueIndex: 1,              // Initial index
    mode: 0,
    renderer: renderer,
    onChange: (slider, value, index) => {}
}
```

**Methods:**

#### `setValue(value)`
Sets slider value (for numeric range).

#### `setValueIndex(index)`
Sets slider value by index (for value arrays).

#### `getValue()` → Number|String
Returns current value.

**Properties:**
- `value` (Number|String) - Current value
- `valueIndex` (Number) - Current index (for value arrays)

**Interaction:**
- Click and drag handle to change value
- Visual feedback during drag
- Snap to step increments
- Label shows current value

**Example:**
```javascript
// Numeric slider
const volumeSlider = new Slider3D(scene, camera, [0, 0, 0], {
    label: 'Volume',
    min: 0,
    max: 100,
    step: 5,
    value: 50,
    onChange: (slider, value) => {
        console.log('Volume:', value);
    }
});

// Text value slider
const sizeSlider = new Slider3D(scene, camera, [0, 2, 0], {
    label: 'Size',
    values: ['Small', 'Medium', 'Large', 'Extra Large'],
    valueIndex: 1,
    onChange: (slider, value, index) => {
        console.log('Size:', value, 'at index:', index);
    }
});
```

---

### TextInput3D

**Purpose:** Text input field in 3D space using HTML overlay.

**Constructor:**
```javascript
new TextInput3D(scene, camera, position, config)
```

**Config Options:**
```javascript
{
    placeholder: 'Enter text...',
    value: '',                  // Initial value
    width: 4.0,
    height: 0.8,
    mode: 0,
    renderer: renderer,
    onChange: (input, value) => {},
    onSubmit: (input, value) => {},
    tooltip: { /* ... */ }
}
```

**Methods:**

#### `setValue(value)`
Sets input value programmatically.

#### `getValue()` → String
Returns current input value.

#### `focus()`
Focuses the input field.

#### `blur()`
Blurs the input field.

**Properties:**
- `value` (String) - Current input value
- `isFocused` (Boolean) - Focus state

**Events:**
- `onChange` - Triggered on every keystroke
- `onSubmit` - Triggered on Enter key press

**Example:**
```javascript
const textInput = new TextInput3D(scene, camera, [0, 0, 0], {
    placeholder: 'Enter your name...',
    value: '',
    width: 4.0,
    height: 0.8,
    onChange: (input, value) => {
        console.log('Input changed:', value);
    },
    onSubmit: (input, value) => {
        console.log('Submitted:', value);
    }
});
```

---

### TextDisplay3D

**Purpose:** Display formatted text and markdown in 3D space.

**Constructor:**
```javascript
new TextDisplay3D(scene, camera, position, config)
```

**Config Options:**
```javascript
{
    content: '# Title\n\nMarkdown **content**',
    width: 4.0,
    height: 3.5,
    mode: 0,
    renderer: renderer,
    tooltip: { /* ... */ }
}
```

**Methods:**

#### `setContent(content)`
Updates display content (supports markdown).

#### `getContent()` → String
Returns current content.

**Supported Markdown:**
- Headers (# ## ###)
- Bold (**text**)
- Italic (*text*)
- Code (`code`)
- Links
- Blockquotes (>)
- Lists
- Emojis

**Example:**
```javascript
const display = new TextDisplay3D(scene, camera, [0, 0, 0], {
    content: `# Welcome! 🌟
    
This is **bold** and *italic* text.

- List item 1
- List item 2

\`code example\`

> Quote text`,
    width: 4.0,
    height: 3.5
});

// Update content later
display.setContent('# New Content\n\nUpdated text!');
```

---

### Modal3D

**Purpose:** Modal dialog/overlay in 3D space.

**Constructor:**
```javascript
new Modal3D(scene, camera, position, config)
```

**Config Options:**
```javascript
{
    title: 'Modal Title',
    width: 5.0,
    height: 4.0,
    mode: 0,
    isOpen: false,              // Initial state
    renderer: renderer,
    onOpen: (modal) => {},
    onClose: (modal) => {},
    tooltip: { /* ... */ }
}
```

**Methods:**

#### `open()`
Opens the modal with animation.

#### `close()`
Closes the modal with animation.

#### `setContent(content)`
Updates modal content (markdown supported).

**Properties:**
- `isOpen` (Boolean) - Current open state

**Visual Behavior:**
- Fade in/out animation
- Scale animation on open/close
- Close button in top-right
- Backdrop overlay (optional)

**Example:**
```javascript
const modal = new Modal3D(scene, camera, [0, 0, 0], {
    title: 'Confirmation',
    width: 5.0,
    height: 4.0,
    isOpen: false,
    onOpen: () => console.log('Modal opened'),
    onClose: () => console.log('Modal closed')
});

// Open modal
modal.open();

// Update content
modal.setContent('# Are you sure?\n\nThis action cannot be undone.');

// Close modal
modal.close();
```

---

### Accordion3D

**Purpose:** Collapsible sections with expandable content.

**Constructor:**
```javascript
new Accordion3D(scene, camera, position, config)
```

**Config Options:**
```javascript
{
    width: 5.0,
    itemHeight: 0.8,            // Header height
    itemSpacing: 0.2,           // Space between items
    mode: 0,
    items: [
        {
            title: 'Section 1',
            contentHeight: 4.0,
            content: '# Markdown content'
        },
        // ... more items
    ],
    openItems: [0],             // Initially open item indices
    renderer: renderer,
    onItemToggle: (accordion, index, isOpen) => {},
    tooltip: { /* ... */ }
}
```

**Methods:**

#### `toggleItem(index)`
Toggles item at index.

#### `openItem(index)`
Opens item at index.

#### `closeItem(index)`
Closes item at index.

#### `setItemContent(index, content)`
Updates content for item at index.

**Properties:**
- `openItems` (Array) - Indices of currently open items

**Visual Behavior:**
- Smooth expand/collapse animations
- Multiple items can be open simultaneously
- Click header to toggle
- Markdown content support

**Example:**
```javascript
const accordion = new Accordion3D(scene, camera, [0, 0, 0], {
    width: 5.0,
    itemHeight: 0.8,
    items: [
        {
            title: '🌟 Getting Started',
            contentHeight: 4.0,
            content: '# Welcome!\n\nThis is the first section.'
        },
        {
            title: '📚 Documentation',
            contentHeight: 3.0,
            content: '# Docs\n\nRead the documentation here.'
        }
    ],
    openItems: [0],
    onItemToggle: (accordion, index, isOpen) => {
        console.log(`Item ${index} is now ${isOpen ? 'open' : 'closed'}`);
    }
});
```

---

### Chart3D

**Purpose:** Data visualization with Chart.js in 3D space.

**Constructor:**
```javascript
new Chart3D(scene, camera, position, config)
```

**Config Options:**
```javascript
{
    chartType: 'line',          // 'line', 'bar', 'pie', 'doughnut'
    data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
            label: 'Sales',
            data: [12, 19, 15],
            backgroundColor: 'rgba(107, 182, 255, 0.2)',
            borderColor: '#6bb6ff'
        }]
    },
    options: {},                // Chart.js options
    width: 4.0,
    height: 3.0,
    mode: 0,
    renderer: renderer,
    tooltip: { /* ... */ }
}
```

**Methods:**

#### `updateData(data)`
Updates chart data and re-renders.

#### `setChartType(type)`
Changes chart type ('line', 'bar', 'pie', etc.).

**Supported Chart Types:**
- Line
- Bar
- Pie
- Doughnut
- Radar
- Polar Area

**Example:**
```javascript
const chart = new Chart3D(scene, camera, [0, 0, 0], {
    chartType: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
            label: 'Revenue',
            data: [12, 19, 15, 25, 22],
            backgroundColor: 'rgba(107, 182, 255, 0.2)',
            borderColor: '#6bb6ff',
            borderWidth: 2
        }]
    },
    width: 4.0,
    height: 3.0
});

// Update data later
chart.updateData({
    labels: ['Jun', 'Jul', 'Aug'],
    datasets: [{
        label: 'Revenue',
        data: [30, 28, 35],
        backgroundColor: 'rgba(107, 182, 255, 0.2)',
        borderColor: '#6bb6ff'
    }]
});
```

---

## Geometry Modes

All components support three geometry modes:

### Mode 0: Box (Rectangular)
- Classic rectangular shape
- Sharp edges
- Professional appearance
- Best for: Buttons, inputs, displays

### Mode 1: Sphere (Rounded)
- Smooth, rounded shape
- Organic feel
- Friendly appearance
- Best for: Toggles, sliders, playful UIs

### Mode 2: Sacred (Sacred Geometry)
- Octahedron or tetrahedron
- Mystical appearance
- Unique aesthetic
- Best for: Special controls, spiritual UIs

**Switching Modes:**
```javascript
// Set mode in constructor
const button = new Button3D(scene, camera, [0, 0, 0], {
    mode: 2  // Sacred geometry
});

// Change mode later (if supported)
button.setMode(1);  // Switch to sphere
```

---

## Common Patterns

### Creating a Control
```javascript
const control = new ComponentName(scene, camera, position, config);
```

### Handling Events
```javascript
const button = new Button3D(scene, camera, [0, 0, 0], {
    onClick: (btn) => {
        console.log('Clicked!');
    }
});
```

### Adding Tooltips
```javascript
const control = new Button3D(scene, camera, [0, 0, 0], {
    tooltip: {
        content: '**Bold** and *italic* markdown',
        position: 'top',
        offset: [0, 1.5, 0]
    }
});
```

### Edit Mode
```javascript
// Enable edit mode globally
ControlRegistry.setEditMode(true);

// Enable for specific control
control.setEditMode(true);
```

### Updating in Animation Loop
```javascript
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    control.update();
    
    // Update tooltip positions
    control.updateTooltipAndLabelPositions();
    
    // Render
    scene3D.render();
}
```

### Cleanup
```javascript
// Dispose single control
control.dispose();

// Unregister from registry
ControlRegistry.unregister(control.controlId);
```

---

**Built with 🌸 Aurora & ♾️ Infinite**
