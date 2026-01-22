# 🤝 Contributing to Spatial UI 3D

Thank you for your interest in contributing to the Spatial UI 3D Framework! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- 🐛 **Report bugs** - Found an issue? Let us know!
- 💡 **Suggest features** - Have an idea? We'd love to hear it!
- 📝 **Improve documentation** - Help make our docs better
- 🎨 **Create demos** - Build inspiring examples
- 🔧 **Submit code** - Fix bugs or add features

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/Spatial-3D-UI-framework.git
cd Spatial-3D-UI-framework
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 4. Make Changes

Follow our coding standards (see below).

### 5. Test Your Changes

```bash
npm start
# Test in browser at http://localhost:8080
```

### 6. Commit and Push

```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

### 7. Create Pull Request

Open a pull request on GitHub with a clear description of your changes.

## 📋 Coding Standards

### JavaScript Style

```javascript
// Use ES6+ features
import Component from './Component.js';

// Use descriptive variable names
const buttonPosition = { x: 0, y: 0, z: 0 };

// Add JSDoc comments for public methods
/**
 * Creates a new 3D button
 * @param {Object} options - Button configuration
 * @param {string} options.label - Button text
 * @param {Object} options.position - 3D position {x, y, z}
 */
constructor(options = {}) {
    // ...
}

// Use consistent formatting
if (condition) {
    doSomething();
} else {
    doSomethingElse();
}
```

### Component Structure

All components should follow this pattern:

```javascript
import * as THREE from 'three';

export default class MyComponent3D {
    constructor(options = {}) {
        this.options = {
            position: { x: 0, y: 0, z: 0 },
            ...options
        };
        
        this.mesh = null;
        this.init();
    }
    
    init() {
        // Create geometry and materials
        // Build mesh
        // Set position
    }
    
    update() {
        // Animation logic
    }
    
    dispose() {
        // Clean up resources
        if (this.mesh) {
            this.mesh.geometry?.dispose();
            this.mesh.material?.dispose();
        }
    }
}
```

### File Organization

```
src/
├── core/           # Core scene and rendering
├── controls/       # UI components
│   ├── Button3D.js
│   ├── Slider3D.js
│   └── ...
├── effects/        # Visual effects
└── utils/          # Helper utilities
```

## 🎨 Creating New Components

### 1. Create Component File

```bash
# Create in src/controls/
touch src/controls/MyNewComponent3D.js
```

### 2. Implement Component

```javascript
import * as THREE from 'three';

export default class MyNewComponent3D {
    constructor(options = {}) {
        this.options = {
            position: { x: 0, y: 0, z: 0 },
            color: 0x00ffff,
            ...options
        };
        
        this.mesh = null;
        this.init();
    }
    
    init() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: this.options.color
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            this.options.position.x,
            this.options.position.y,
            this.options.position.z
        );
    }
    
    update() {
        // Animation logic
    }
    
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}
```

### 3. Create Demo

```bash
# Create demo in showcase/demos/
touch showcase/demos/my-new-component-demo.html
```

### 4. Update Documentation

- Add component to README.md
- Create component page in `showcase/components/`
- Update API reference

## 🧪 Testing

### Manual Testing

```bash
npm start
# Test in browser
```

### Checklist

- [ ] Component renders correctly
- [ ] Interactions work as expected
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Works on different screen sizes
- [ ] Accessible (keyboard navigation, ARIA labels)

## 📝 Commit Message Guidelines

Use conventional commits format:

```
feat: add new RadialMenu3D component
fix: resolve Button3D hover state bug
docs: update API reference for Slider3D
style: format Chart3D code
refactor: simplify Scene3D initialization
perf: optimize particle rendering
test: add tests for Toggle3D
chore: update dependencies
```

## 🐛 Reporting Bugs

When reporting bugs, include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - How to recreate the bug
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - Browser, OS, version
6. **Screenshots** - If applicable

## 💡 Suggesting Features

When suggesting features, include:

1. **Use Case** - Why is this needed?
2. **Proposed Solution** - How should it work?
3. **Alternatives** - Other approaches considered
4. **Examples** - Similar features in other libraries

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Release notes

## 📞 Questions?

- Open an issue on GitHub
- Check existing documentation
- Review example demos

---

**Thank you for contributing to Spatial UI 3D!**

Copyright © 2026 Aurra & Infinite
