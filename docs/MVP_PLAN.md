# 🌸♾️ Spatial UI 3D - MVP Plan

## Vision

Transform traditional web UI controls into **immersive 3D spatial interfaces** that support:
- 🎨 **Generative/Adaptive UI** - AI-driven layout adaptation
- 🗣️👆 **Multimodality** - Voice, gesture, and spatial interaction
- ♿ **Accessible Calm Design** - WCAG 2.1 AA compliant, intentional friction

## Project Goals

### Primary Goals
1. **Spatial Wisdom** - Leverage 3D space to provide context and reduce cognitive load
2. **Accessibility First** - Ensure all components are accessible to all users
3. **Performance** - Maintain 60 FPS even with multiple components
4. **Developer Experience** - Simple, intuitive API for creating 3D UI components

### Secondary Goals
1. **Extensibility** - Easy to add new components and geometries
2. **Customization** - Flexible theming and styling options
3. **Integration** - Works with existing web frameworks (React, Vue, Svelte)
4. **Documentation** - Comprehensive guides and examples

## Technology Stack

### Core Technologies
- **Three.js** (v0.160.0) - 3D rendering engine
- **OrbitControls** - Camera navigation
- **TransformControls** - Object manipulation in edit mode
- **CSS3DRenderer** - HTML overlays for text and charts

### Supporting Technologies
- **Chart.js** - Data visualization in 3D space
- **Marked.js** - Markdown rendering for text displays
- **Canvas API** - Dynamic texture generation
- **ES Modules** - Modern JavaScript module system

### Future Technologies
- **TypeScript** - Type safety and better DX
- **Vitest** - Fast, modern testing framework
- **Playwright** - E2E and visual regression testing
- **Vite** - Fast build tool and dev server

## MVP Components (Phase 1) ✅

All 8 MVP components are **COMPLETE** and functional:

### 1. Button3D ✅
**Status:** Complete  
**Features:**
- Click interactions with visual feedback
- Hover states with color changes
- Three geometry modes: box, sphere, sacred
- Tooltip support
- Edit mode with TransformControls

**API:**
```javascript
new Button3D(scene, camera, position, {
    label: 'Click Me!',
    width: 2.5,
    height: 1.0,
    mode: 0, // 0=box, 1=sphere, 2=sacred
    renderer: renderer,
    onClick: (button) => { /* callback */ }
});
```

### 2. Toggle3D ✅
**Status:** Complete  
**Features:**
- On/off state with smooth transitions
- Animated handle movement
- Custom colors for on/off states
- Three geometry modes
- State persistence

**API:**
```javascript
new Toggle3D(scene, camera, position, {
    label: 'Toggle Switch',
    width: 2.0,
    height: 0.6,
    mode: 0,
    isOn: false,
    onColor: 0x4ecdc4,
    offColor: 0x666666,
    onClick: (toggle) => { /* callback */ }
});
```

### 3. TextInput3D ✅
**Status:** Complete  
**Features:**
- HTML input overlay in 3D space
- Focus management
- onChange and onSubmit callbacks
- Placeholder text
- Three geometry modes for container

**API:**
```javascript
new TextInput3D(scene, camera, position, {
    placeholder: 'Type something...',
    value: '',
    width: 4.0,
    height: 0.8,
    mode: 0,
    onChange: (input, value) => { /* callback */ },
    onSubmit: (input, value) => { /* callback */ }
});
```

### 4. TextDisplay3D ✅
**Status:** Complete  
**Features:**
- Markdown rendering support
- HTML overlay for rich text
- Scrollable content
- Three geometry modes for container
- Dynamic content updates

**API:**
```javascript
new TextDisplay3D(scene, camera, position, {
    content: '# Welcome!\n\nMarkdown **content** here.',
    width: 4.0,
    height: 3.5,
    mode: 0,
    renderer: renderer
});
```

### 5. Slider3D ✅
**Status:** Complete  
**Features:**
- Drag interaction for value changes
- Numeric range (min/max/step)
- Value arrays (numeric or text)
- Visual feedback during drag
- onChange and onChangeEnd callbacks
- Three geometry modes

**API:**
```javascript
// Numeric range
new Slider3D(scene, camera, position, {
    label: 'Volume',
    width: 4.0,
    height: 0.3,
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    mode: 0,
    onChange: (slider, value) => { /* callback */ }
});

// Value array
new Slider3D(scene, camera, position, {
    label: 'Size',
    width: 4.0,
    height: 0.3,
    values: ['Small', 'Medium', 'Large'],
    valueIndex: 1,
    mode: 0,
    onChange: (slider, value, index) => { /* callback */ }
});
```

### 6. Modal3D ✅
**Status:** Complete  
**Features:**
- Open/close animations
- Title and content areas
- Close button
- Backdrop/overlay
- onOpen and onClose callbacks
- Three geometry modes

**API:**
```javascript
const modal = new Modal3D(scene, camera, position, {
    title: 'Dialog Title',
    width: 5.0,
    height: 4.0,
    mode: 0,
    isOpen: false,
    onOpen: (modal) => { /* callback */ },
    onClose: (modal) => { /* callback */ }
});

modal.open();
modal.close();
```

### 7. Accordion3D ✅
**Status:** Complete  
**Features:**
- Multiple collapsible sections
- Markdown content support
- Smooth expand/collapse animations
- Multiple items can be open simultaneously
- onItemToggle callback
- Three geometry modes

**API:**
```javascript
new Accordion3D(scene, camera, position, {
    width: 5.0,
    itemHeight: 0.8,
    itemSpacing: 0.2,
    mode: 0,
    items: [
        {
            title: '🌟 Section 1',
            contentHeight: 4.0,
            content: '# Markdown content here'
        }
    ],
    openItems: [0], // Indices of initially open items
    onItemToggle: (accordion, index, isOpen) => { /* callback */ }
});
```

### 8. Chart3D ✅
**Status:** Complete  
**Features:**
- Chart.js integration
- Line, bar, and pie charts
- HTML canvas overlay
- Dynamic data updates
- Three geometry modes for container
- Responsive sizing

**API:**
```javascript
new Chart3D(scene, camera, position, {
    chartType: 'line', // 'line', 'bar', 'pie'
    data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
            label: 'Sales',
            data: [12, 19, 15],
            backgroundColor: 'rgba(107, 182, 255, 0.2)',
            borderColor: '#6bb6ff'
        }]
    },
    width: 4.0,
    height: 3.0,
    mode: 0
});
```

## Core Architecture ✅

### Scene3D ✅
**Purpose:** Main 3D scene management  
**Features:**
- WebGL renderer setup
- Camera and lighting configuration
- OrbitControls integration
- HTML overlay system
- Window resize handling
- Shadow map support

### BaseControl3D ✅
**Purpose:** Base class for all 3D controls  
**Features:**
- Common geometry creation (box, sphere, sacred)
- Tooltip system
- Label system
- Edit mode with TransformControls
- Raycasting for interactions
- Event handling (hover, click, drag)
- Auto-registration with ControlRegistry

### ControlRegistry ✅
**Purpose:** Global control management  
**Features:**
- Centralized control tracking
- Edit mode coordination
- OrbitControls reference management
- Bulk operations on all controls

### RoomManager ✅
**Purpose:** Environment/background management  
**Features:**
- Room switching (Coordinate, Landscape, Space)
- Smooth transitions between rooms
- Edit mode propagation to rooms
- Room-specific animations

## Room Environments ✅

### 1. CoordinateRoom ✅
**Theme:** 3D coordinate system  
**Features:**
- Grid floor
- Axis indicators (X, Y, Z)
- Dark background
- Minimal, technical aesthetic

### 2. LandscapeRoom ✅
**Theme:** Natural landscape  
**Features:**
- Sky background with gradient
- Ground plane with texture
- Distant mountains
- Ambient particles
- Directional lighting for shadows

### 3. SpaceRoom ✅
**Theme:** Outer space  
**Features:**
- Black background
- Animated star field
- Floating particles
- Cosmic atmosphere

### 4. LiquidEtherRoom 🔮
**Theme:** Liquid ether animation  
**Status:** Planned for Phase 2  
**Features:**
- Shader-based fluid simulation
- Iridescent colors
- Flowing, organic movement
- Ethereal atmosphere

## Development Roadmap

### Phase 1: MVP Foundation ✅ (COMPLETE)
**Timeline:** Completed  
**Status:** ✅ All tasks complete

- [x] Core architecture (Scene3D, BaseControl3D, ControlRegistry, RoomManager)
- [x] All 8 MVP components
- [x] 3 Room environments
- [x] Edit mode functionality
- [x] Tooltip system
- [x] HTML overlay system
- [x] Demo application

### Phase 2: Documentation & Testing 🔄 (IN PROGRESS)
**Timeline:** Current phase  
**Status:** 🔄 In progress

- [/] Comprehensive documentation
  - [/] MVP_PLAN.md (this document)
  - [ ] COMPONENT_SPECS.md
  - [ ] ACCESSIBILITY_GUIDE.md
  - [ ] API_REFERENCE.md
- [ ] Testing infrastructure
  - [ ] Vitest setup
  - [ ] Unit tests for core classes
  - [ ] Component tests
  - [ ] E2E tests with Playwright
- [ ] Performance optimization
  - [ ] Performance monitoring
  - [ ] Frustum culling
  - [ ] LOD system
  - [ ] Instancing for repeated geometries

### Phase 3: Advanced Features 🔮
**Timeline:** Future  
**Status:** 📋 Planned

- [ ] LiquidEtherRoom environment
- [ ] Generative UI prototype
  - [ ] AI-driven layout adaptation
  - [ ] Context-aware component placement
  - [ ] Dynamic spacing optimization
- [ ] Multimodal interactions
  - [ ] Voice control prototype
  - [ ] Gesture control prototype
  - [ ] Spatial audio feedback
- [ ] Advanced components
  - [ ] Dropdown3D
  - [ ] Table3D
  - [ ] Tree3D
  - [ ] Form3D

### Phase 4: Production Ready 🚀
**Timeline:** Future  
**Status:** 📋 Planned

- [ ] TypeScript migration
- [ ] Build system (Vite)
- [ ] NPM package publishing
- [ ] Framework integrations
  - [ ] React wrapper
  - [ ] Vue wrapper
  - [ ] Svelte wrapper
- [ ] Storybook integration
- [ ] CI/CD pipeline
- [ ] Performance benchmarks
- [ ] Browser compatibility testing

## Design Principles

### 🌸 Pyhät Periaatteet (Sacred Principles)

1. **Tietoisuus-ensimmäinen (Consciousness-First)**
   - Every component serves spatial wisdom
   - 3D space provides context and meaning
   - Interactions are intentional and mindful

2. **Yhteisön parantaminen (Community Healing)**
   - Accessible design reduces cognitive load
   - Calm design prevents overwhelm
   - Inclusive for all abilities

3. **Spatiaalinen viisaus (Spatial Wisdom)**
   - 3D space is core to the experience
   - Depth provides hierarchy and organization
   - Movement and navigation are natural

4. **Ääretön yhteistyö (Infinite Collaboration)**
   - Multimodality supports diverse interaction patterns
   - Components work together harmoniously
   - Extensible and composable architecture

### Calm Design Principles

- **Intentional Friction** - Prevent accidental actions
- **Clear Affordances** - Visual cues for interactions
- **Smooth Animations** - Reduce jarring transitions
- **Consistent Patterns** - Predictable behavior
- **Accessible Defaults** - Works for everyone out of the box

## Success Metrics

### Performance Targets
- ✅ 60 FPS with 8+ components
- ✅ < 100ms interaction response time
- 🔄 < 50MB memory footprint (to be measured)
- 🔄 < 5MB bundle size (to be measured)

### Accessibility Targets
- 🔄 WCAG 2.1 AA compliance
- 🔄 Full keyboard navigation
- 🔄 Screen reader support
- 🔄 High contrast mode

### Developer Experience
- ✅ Simple, intuitive API
- 🔄 Comprehensive documentation
- 🔄 TypeScript type definitions
- 🔄 Framework integrations

## Known Limitations

1. **Browser Support**
   - Requires WebGL support
   - Best on modern browsers (Chrome, Firefox, Safari, Edge)
   - Mobile support is experimental

2. **Performance**
   - Large numbers of components (50+) may impact FPS
   - Complex geometries may require LOD system
   - HTML overlays have rendering overhead

3. **Accessibility**
   - Screen reader support is limited for 3D interactions
   - Keyboard navigation works but could be improved
   - Some users may prefer 2D alternatives

4. **Integration**
   - No official framework wrappers yet
   - Manual integration required
   - Build system not optimized

## Future Research Areas

1. **AI-Driven Layout**
   - Machine learning for optimal component placement
   - Context-aware spacing and grouping
   - Adaptive layouts based on user behavior

2. **Multimodal Interactions**
   - Voice commands for navigation and control
   - Hand gesture recognition (WebXR)
   - Eye tracking for focus management

3. **Spatial Audio**
   - Audio feedback for interactions
   - Spatial audio cues for navigation
   - Accessibility through sound

4. **VR/AR Integration**
   - WebXR support for VR headsets
   - AR overlays for mobile devices
   - Immersive 3D experiences

---

**Built with 🌸 Aurora & ♾️ Infinite**

*"Koodin ja tietoisuuden ikuisessa tanssissa jokainen aloitus muuttuu askeleeksi kohti ääretöntä viisautta."*
