import { Scene3D } from './core/Scene3D.js';
import { RoomManager } from './core/RoomManager.js';
import { Button3D } from './controls/Button3D.js';
import { Toggle3D } from './controls/Toggle3D.js';
import { TextDisplay3D } from './controls/TextDisplay3D.js';
import { TextInput3D } from './controls/TextInput3D.js';
import { Chart3D } from './controls/Chart3D.js';
import { Slider3D } from './controls/Slider3D.js';
import { Modal3D } from './controls/Modal3D.js';
import { Accordion3D } from './controls/Accordion3D.js';
import { ControlRegistry } from './core/ControlRegistry.js';
import * as THREE from 'three';

// Initialize application
const canvas = document.getElementById('canvas');
const scene3D = new Scene3D(canvas);
const scene = scene3D.getScene();
const camera = scene3D.getCamera();
const renderer = scene3D.getRenderer();
const orbitControls = scene3D.getControls();

// Initialize ControlRegistry with OrbitControls reference
ControlRegistry.setOrbitControls(orbitControls);

// Initialize Room Manager
const roomManager = new RoomManager(scene, camera);
roomManager.initialize();

// ============================================
// CONTROL LAYOUT ORGANIZATION
// ============================================
// Spacing: Minimum 3 units between objects
// Left Zone (X = -9, Z = -2): Text Controls (taemmas)
// Center-Left Zone (X = -6, Z = -1): Toggle Controls (keskellä taemmas)
// Center Zone (X = 0, Z = 0): Buttons & Edit Mode (keskellä)
// Right Zone (X = 9, Z = 1): Chart Visualizations (edempänä)
// New Components Zone (X = 0, Z = 3): Slider, Modal, Accordion (edempänä)
// ============================================

// ============================================
// LEFT ZONE: Text Controls (Z = -2, taemmas)
// ============================================
const TEXT_ZONE_X = -9; // Moved further left (3 units spacing)
const TEXT_ZONE_Z = -2; // Taemmas syvyydessä
const TEXT_SPACING = 4.5;

// Create Text Display for markdown content
const textDisplay = new TextDisplay3D(scene, camera, [TEXT_ZONE_X, 2.5, TEXT_ZONE_Z], {
    content: `# Welcome! 🌟

This is a **markdown display** control.

## Features:
- Supports *italic* and **bold* text
- Code blocks: \`code\`
- Emojis: ✨ 🎨 💫
- Links and more!

> "The future is spatial"`,
    width: 4.0,
    height: 3.5,
    mode: 0, // box
    renderer: renderer,
    tooltip: {
        content: '**Text Display** 📄\n\nShows markdown content in 3D space',
        position: 'right',
        offset: [2.5, 0, 0]
    }
});

// Create Text Input for data entry
const textInput = new TextInput3D(scene, camera, [TEXT_ZONE_X, -1.5, TEXT_ZONE_Z], {
    placeholder: 'Type something...',
    value: '',
    width: 4.0,
    height: 0.8,
    mode: 0, // box
    renderer: renderer,
    onChange: (input, value) => {
        console.log('Input changed:', value);
        // Update text display with input value
        textDisplay.setContent(`# Input Value\n\nYou typed: **${value}**`);
    },
    onSubmit: (input, value) => {
        console.log('Input submitted:', value);
    },
    tooltip: {
        content: '**Text Input** ⌨️\n\nClick to focus and type text',
        position: 'right',
        offset: [2.5, 0, 0]
    }
});

// ============================================
// CENTER-LEFT ZONE: Toggle Controls (Z = -1, keskellä taemmas)
// ============================================
const TOGGLE_ZONE_X = -6; // Moved further left (3 units spacing)
const TOGGLE_ZONE_Z = -1; // Keskellä taemmas
const TOGGLE_SPACING = 3;

// Create toggle controls with different geometries
const toggleBox = new Toggle3D(scene, camera, [TOGGLE_ZONE_X, 1.5, TOGGLE_ZONE_Z], {
    label: 'Box Toggle',
    width: 2.0,
    height: 0.6,
    mode: 0, // box
    isOn: false,
    renderer: renderer,
    tooltip: {
        content: '**Box Toggle** 📦\n\nToggle switch with box geometry',
        position: 'top',
        offset: [0, 1.2, 0]
    },
    onClick: (toggle) => {
        console.log('Box toggle:', toggle.isOn ? 'ON' : 'OFF');
    }
});

const toggleSphere = new Toggle3D(scene, camera, [TOGGLE_ZONE_X, 0, TOGGLE_ZONE_Z], {
    label: 'Sphere Toggle',
    width: 2.0,
    height: 0.6,
    mode: 1, // sphere
    isOn: true,
    renderer: renderer,
    tooltip: {
        content: '**Sphere Toggle** ⭕\n\nToggle switch with sphere geometry',
        position: 'top',
        offset: [0, 1.2, 0]
    },
    onClick: (toggle) => {
        console.log('Sphere toggle:', toggle.isOn ? 'ON' : 'OFF');
    }
});

const toggleSacred = new Toggle3D(scene, camera, [TOGGLE_ZONE_X, -1.5, TOGGLE_ZONE_Z], {
    label: 'Sacred Toggle',
    width: 2.0,
    height: 0.6,
    mode: 2, // sacred
    isOn: false,
    renderer: renderer,
    tooltip: {
        content: '**Sacred Toggle** ✨\n\nToggle switch with sacred geometry',
        position: 'top',
        offset: [0, 1.2, 0]
    },
    onClick: (toggle) => {
        console.log('Sacred toggle:', toggle.isOn ? 'ON' : 'OFF');
    }
});

// ============================================
// CENTER ZONE: Buttons & Edit Mode (Z = 0, keskellä)
// ============================================
const CENTER_ZONE_X = 0;
const CENTER_ZONE_Z = 0; // Keskellä, referenssitaso
const BUTTON_SPACING = 2.5;

// Create demo button with integrated mode switching
const demoButton = new Button3D(scene, camera, [CENTER_ZONE_X, 2, CENTER_ZONE_Z], {
    label: 'Click Me!',
    width: 2.5,
    height: 1.0,
    renderer: renderer,
    tooltip: {
        content: '**Click me!** :sparkles:\n\nThis button changes color when clicked :heart:',
        position: 'top',
        offset: [0, 1.5, 0]
    },
    onClick: (button) => {
        console.log('Button clicked!', button.isRed ? 'Now green!' : 'Now red!');
    }
});

// Create global edit mode toggle button
const editModeToggle = new Toggle3D(scene, camera, [CENTER_ZONE_X, -2, CENTER_ZONE_Z], {
    label: 'Edit Mode',
    width: 2.5,
    height: 0.7,
    mode: 0, // box
    isOn: false,
    renderer: renderer,
    onColor: 0xffaa00, // Orange when edit mode is ON
    offColor: 0x666666, // Gray when edit mode is OFF
    tooltip: {
        content: '**Edit Mode** ✏️\n\nToggle to show/hide transform handles on all objects',
        position: 'top',
        offset: [0, 1.5, 0]
    },
    onClick: (toggle) => {
        const isEditMode = toggle.isOn;
        // Set edit mode in RoomManager
        roomManager.setEditMode(isEditMode);
        // Set edit mode for all controls via ControlRegistry
        ControlRegistry.setEditMode(isEditMode);
        console.log('Edit mode:', isEditMode ? 'ON' : 'OFF');
    }
});

// ============================================
// RIGHT ZONE: Chart Visualizations (Z = 1, edempänä)
// ============================================
const CHART_ZONE_X = 9; // Moved further right (3 units spacing)
const CHART_ZONE_Z = 1; // Edempänä syvyydessä
const CHART_SPACING = 3.5;

// Create Chart for data visualization
const chart = new Chart3D(scene, camera, [CHART_ZONE_X, 2.5, CHART_ZONE_Z], {
    chartType: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Sales',
            data: [12, 19, 15, 25, 22, 30],
            backgroundColor: 'rgba(107, 182, 255, 0.2)',
            borderColor: '#6bb6ff'
        }]
    },
    width: 4.0,
    height: 3.0,
    mode: 0, // box
    renderer: renderer,
    tooltip: {
        content: '**Chart Display** 📊\n\nVisualizes data in various chart types',
        position: 'left',
        offset: [-2.5, 0, 0]
    }
});

// Create additional charts for demonstration
const barChart = new Chart3D(scene, camera, [CHART_ZONE_X, -0.5, CHART_ZONE_Z], {
    chartType: 'bar',
    data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            label: 'Revenue',
            data: [45, 52, 48, 65],
            backgroundColor: '#4ecdc4',
            borderColor: '#2ea89e'
        }]
    },
    width: 3.5,
    height: 2.5,
    mode: 1, // sphere
    renderer: renderer,
    tooltip: {
        content: '**Bar Chart** 📊\n\nDisplays data as bars',
        position: 'left',
        offset: [-2.0, 0, 0]
    }
});

const pieChart = new Chart3D(scene, camera, [CHART_ZONE_X, -3.5, CHART_ZONE_Z], {
    chartType: 'pie',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green'],
        datasets: [{
            data: [30, 25, 20, 25],
            backgroundColor: ['#ff6b6b', '#6bb6ff', '#ffe66d', '#4ecdc4']
        }]
    },
    width: 3.0,
    height: 3.0,
    mode: 2, // sacred
    renderer: renderer,
    tooltip: {
        content: '**Pie Chart** 🥧\n\nShows proportions as slices',
        position: 'left',
        offset: [-2.0, 0, 0]
    }
});

// ============================================
// NEW COMPONENTS ZONE: Slider, Modal, Accordion (Z = 3, edempänä)
// ============================================
const NEW_COMPONENTS_ZONE_X = 0;
const NEW_COMPONENTS_ZONE_Z = 5; // Increased from 3 to 5 - bring sliders forward
const NEW_COMPONENTS_SPACING = 9; // Increased spacing (3 units minimum)

// Create Slider3D controls with different geometries
const sliderBox = new Slider3D(scene, camera, [NEW_COMPONENTS_ZONE_X - NEW_COMPONENTS_SPACING, 2, NEW_COMPONENTS_ZONE_Z], {
    label: 'Box Slider',
    width: 4.0,
    height: 0.3,
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    mode: 0, // box
    renderer: renderer,
    tooltip: {
        content: '**Box Slider** 🎚️\n\nDrag to change value',
        position: 'top',
        offset: [0, 1.0, 0]
    },
    onChange: (slider, value) => {
        console.log('Slider value:', value);
    },
    onChangeEnd: (slider, value) => {
        console.log('Slider value changed to:', value);
    }
});

// Create Slider3D with text/string values array
const sliderText = new Slider3D(scene, camera, [NEW_COMPONENTS_ZONE_X - NEW_COMPONENTS_SPACING, -2, NEW_COMPONENTS_ZONE_Z], {
    label: 'Text Values',
    width: 4.0,
    height: 0.3,
    values: ['Pieni', 'Keskikokoinen', 'Suuri', 'Erittäin suuri'],
    valueIndex: 1, // Start at "Keskikokoinen"
    mode: 1, // sphere
    renderer: renderer,
    tooltip: {
        content: '**Text Slider** 📝\n\nDrag to select from text options',
        position: 'top',
        offset: [0, 1.0, 0]
    },
    onChange: (slider, value, index) => {
        console.log('Text slider value:', value, 'at index:', index);
    }
});

// Create Modal3D
const modal = new Modal3D(scene, camera, [NEW_COMPONENTS_ZONE_X, 2, NEW_COMPONENTS_ZONE_Z], {
    title: 'Demo Modal',
    width: 5.0,
    height: 4.0,
    mode: 0, // box
    isOpen: false,
    renderer: renderer,
    onOpen: (modal) => {
        console.log('Modal opened');
    },
    onClose: (modal) => {
        console.log('Modal closed');
    }
});

// Create button to open modal
const openModalButton = new Button3D(scene, camera, [NEW_COMPONENTS_ZONE_X, 0, NEW_COMPONENTS_ZONE_Z], {
    label: 'Open Modal',
    width: 2.5,
    height: 0.8,
    renderer: renderer,
    tooltip: {
        content: '**Open Modal** 🪟\n\nClick to open modal dialog',
        position: 'top',
        offset: [0, 1.2, 0]
    },
    onClick: (button) => {
        modal.open();
    }
});

// Create Accordion3D (moved far right and down to avoid charts)
const accordion = new Accordion3D(scene, camera, [15, -4, NEW_COMPONENTS_ZONE_Z], {
    width: 5.0,
    itemHeight: 0.8,
    itemSpacing: 0.2,
    mode: 0, // box
    items: [
        {
            title: '🌟 Tervetuloa 3D-tilaan!',
            contentHeight: 4.0,
            content: `# Tervetuloa 3D-tilaan! 🌟

Tervetuloa **spatial-ui-3d** -kirjaston maailmaan! Tämä on iloinen ja interaktiivinen accordion-osio, joka esittelee 3D-kontrollien mahtavaa maailmaa.

## Ominaisuudet:
- ✨ **3D-kontrollit** spatiaalisessa tilassa
- 🎨 **Kauniit animaatiot** ja siirtymät
- 💫 **Interaktiivinen** käyttöliittymä
- 🎚️ **Sliderit** arvotauluilla
- 🪟 **Modaalit** 3D-dialogeina
- 📋 **Accordionit** collapsible-osioina

## Miksi 3D?

Kolmiulotteinen tila tarjoaa:
- **Spatiaalisen viisauden** - objektit ovat kontekstissa
- **Luonnollisen navigoinnin** - liikkuminen on intuitiivista
- **Visuaalista mielenkiintoa** - kauniimpi käyttökokemus

> "Tulevaisuus on spatiaalinen!" 🚀

**Aloita tutustumalla** muihin kontrollien osioihin!`
        },
        {
            title: '🎨 Luovuus ja Inspiraatio',
            contentHeight: 4.0,
            content: `# Luovuus ja Inspiraatio 🎨

Tässä osiossa voit löytää luovuutta ja inspiraatiota 3D-suunnitteluun!

## Luovia ideoita:

### 🎭 Geometriat
- **Box** - Klassinen suorakulmainen muoto
- **Sphere** - Pyöreä ja pehmeä
- **Sacred** - Pyhä geometria (octahedron, tetrahedron jne.)

### 🌈 Visuaaliset efektit
- **Gradientit** - Väri-siirtymät
- **Glow-efektit** - Hohtavat reunat
- **Partikkelit** - Dynamiikkaa interaktioihin
- **Animaatiot** - Sujuvat siirtymät

### ✨ Magiaa spatiaalisessa suunnittelussa
- **Z-syvyys** - Objektit eri tasoilla
- **Rotaatiot** - 3D-avaruudessa kiertäminen
- **Skaalaus** - Dynamiikkaa kokoon

**Muista**: Luovuus ei tunne rajoja! 💫

Kokeile erilaisia geometrioita ja efektejä löytääksesi oman tyylisi!`
        },
        {
            title: '🚀 Tulevaisuus ja Kehitys',
            contentHeight: 4.0,
            content: `# Tulevaisuus on täällä! 🚀

Tervetuloa tulevaisuuteen, jossa 3D-kontrollit ovat normaali osa web-sovelluksia!

## Mitä seuraavaksi?

### 🎯 Kehityssuunnitelmat
- **Generative UI** - AI-pohjainen layout-adaptaatio
- **Multimodality** - Ääni- ja eleohjaus
- **Accessibility** - WCAG 2.1 AA -taso
- **Performance** - Optimointi suuremmille projekteille

### 🔮 Kokeilut
- **Eri geometrioita** - Box, Sphere, Sacred
- **Arvotaulut** - Numerot ja tekstit sliderissa
- **Randomize** - Arvo objektien sijainnit
- **Edit Mode** - Siirrä objekteja TransformControls:lla

### 🌟 Spatiaalinen viisaus
- **Roomit** - Eri ympäristöt (Coordinate, Landscape, Space)
- **Tooltipit** - Hover-ohjeet markdownilla
- **Tuplaklikkaus** - Fokusoi objektiin
- **Layout-organisaatio** - Objektit eri alueisiin

## Teknologiapino

- **Three.js** - 3D-renderöinti
- **CSS3DRenderer** - HTML-overlayt
- **ES Modules** - Modulaarinen rakenne
- **Canvas API** - Dynaamiset tekstuurit

**Hyvää työskentelyä ja luovaa koodausta!** ✨🎉

> "Koodin ja tietoisuuden ikuisessa tanssissa jokainen aloitus muuttuu askeleeksi kohti ääretöntä viisautta." - Aurora & Infinite`
        }
    ],
    openItems: [0], // First item open by default
    renderer: renderer,
    tooltip: {
        content: '**Accordion** 📋\n\nClick headers to expand/collapse',
        position: 'left',
        offset: [-3.0, 0, 0]
    },
    onItemToggle: (accordion, index, isOpen) => {
        console.log(`Accordion item ${index} is now ${isOpen ? 'open' : 'closed'}`);
    }
});

// Store original positions for reset functionality
const originalPositions = new Map();
const originalRotations = new Map();

// Function to store original positions and rotations
function storeOriginalPositions() {
    const controls = ControlRegistry.getAll();
    controls.forEach(control => {
        if (control && control.group) {
            const key = control.controlId || control.group.uuid;
            originalPositions.set(key, control.group.position.clone());
            originalRotations.set(key, control.group.rotation.clone());
        }
    });
}

// Function to randomize all control positions and rotations
function randomizePositions() {
    const controls = ControlRegistry.getAll();
    const bounds = {
        x: { min: -12, max: 12 },
        y: { min: -8, max: 8 },
        z: { min: -3, max: 4 }
    };

    controls.forEach(control => {
        if (control && control.group) {
            // Randomize position
            const newX = bounds.x.min + Math.random() * (bounds.x.max - bounds.x.min);
            const newY = bounds.y.min + Math.random() * (bounds.y.max - bounds.y.min);
            const newZ = bounds.z.min + Math.random() * (bounds.z.max - bounds.z.min);

            control.group.position.set(newX, newY, newZ);

            // Randomize rotation (optional, can be subtle)
            const rotationAmount = Math.PI * 0.3; // Max 30 degrees
            control.group.rotation.x = (Math.random() - 0.5) * rotationAmount;
            control.group.rotation.y = (Math.random() - 0.5) * rotationAmount;
            control.group.rotation.z = (Math.random() - 0.5) * rotationAmount;

            // Update tooltip and label positions
            if (control.updateTooltipAndLabelPositions) {
                control.updateTooltipAndLabelPositions();
            }
        }
    });

    console.log('Positions randomized!');
}

// Store original positions on initialization
storeOriginalPositions();

// Randomize button removed per user request
// User found it confusing as it shuffled card positions unexpectedly
/*
// Create Randomize Positions button
const randomizeButton = new Button3D(scene, camera, [CENTER_ZONE_X, -4, CENTER_ZONE_Z], {
    label: '🎲 Randomize',
    width: 3.0,
    height: 0.9,
    renderer: renderer,
    tooltip: {
        content: '**Randomize Positions** 🎲\n\nClick to randomly arrange all objects',
        position: 'top',
        offset: [0, 1.5, 0]
    },
    onClick: (button) => {
        randomizePositions();
    }
});
*/


// Background switcher UI
const roomButtons = document.querySelectorAll('.room-btn');
roomButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const roomName = btn.dataset.room;
        roomManager.switchRoom(roomName);

        // Update scene background color directly here (avoid THREE import issue in RoomManager)
        if (roomName === 'coordinate') {
            scene.background = new THREE.Color(0x0a0a0f);
        } else if (roomName === 'landscape') {
            scene.background = new THREE.Color(0x87CEEB);
        } else if (roomName === 'space') {
            scene.background = new THREE.Color(0x000000);
        }

        // Update active state
        roomButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Set initial active button (space room is default)
document.querySelector('.room-btn[data-room="space"]').classList.add('active');

// FPS Counter
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    const delta = currentTime - lastTime;

    if (delta >= 1000) {
        fps = Math.round((frameCount * 1000) / delta);
        document.getElementById('fps-counter').textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastTime = currentTime;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update room animations
    roomManager.update();

    // Update 3D controls
    demoButton.update();
    toggleBox.update();
    toggleSphere.update();
    toggleSacred.update();
    editModeToggle.update();
    textDisplay.update();
    textInput.update();
    chart.update();
    barChart.update();
    pieChart.update();
    sliderBox.update();
    sliderText.update();
    modal.update();
    accordion.update();
    // randomizeButton.update(); // Removed - button no longer exists

    // Update tooltip and label positions for all controls
    ControlRegistry.getAll().forEach(control => {
        if (control && control.updateTooltipAndLabelPositions) {
            control.updateTooltipAndLabelPositions();
        }
    });

    // Update TransformControls for all controls in edit mode
    // Only update if edit mode is active to prevent issues
    if (ControlRegistry.getEditMode()) {
        ControlRegistry.getAll().forEach(control => {
            if (control && control.isEditMode && control.updateTransformControls) {
                try {
                    control.updateTransformControls();
                } catch (error) {
                    console.warn('Error updating TransformControls:', error);
                }
            }
        });
    }

    // Render scene
    scene3D.render();

    // Update FPS
    updateFPS();
}

animate();