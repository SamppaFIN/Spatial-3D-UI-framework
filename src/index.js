/**
 * Spatial UI 3D — Barrel Export
 * 
 * Provides a single import point for all core classes and controls.
 *
 * Usage:
 *   import { Button3D, Scene3D, ThemeManager } from 'spatial-ui-3d';
 *
 * @module spatial-ui-3d
 */

// ── Core ───────────────────────────────────────────────────
export { BaseControl3D } from './core/BaseControl3D.js';
export { Scene3D } from './core/Scene3D.js';
export { ControlRegistry } from './core/ControlRegistry.js';
export { ThemeManager, themeManager } from './core/ThemeManager.js';
export { SpatialLayout } from './core/SpatialLayout.js';

// ── Controls ───────────────────────────────────────────────
export { Button3D } from './controls/Button3D.js';
export { Toggle3D } from './controls/Toggle3D.js';
export { Slider3D } from './controls/Slider3D.js';
export { Modal3D } from './controls/Modal3D.js';
export { Chart3D } from './controls/Chart3D.js';
export { TextDisplay3D } from './controls/TextDisplay3D.js';
export { TextInput3D } from './controls/TextInput3D.js';
export { HaloCard3D } from './controls/HaloCard3D.js';
export { RadialMenu3D } from './controls/RadialMenu3D.js';
export { Accordion3D } from './controls/Accordion3D.js';
export { DataVolume3D } from './controls/DataVolume3D.js';
export { NetworkGraph3D } from './controls/NetworkGraph3D.js';
export { HoloMap3D } from './controls/HoloMap3D.js';
export { VolumetricCard3D } from './controls/VolumetricCard3D.js';
export { MagneticCard3D } from './controls/MagneticCard3D.js';
export { PortalCard3D } from './controls/PortalCard3D.js';
export { KineticSculpture3D } from './controls/KineticSculpture3D.js';
export { TimeRibbon3D } from './controls/TimeRibbon3D.js';
export { SpatialScrubber3D } from './controls/SpatialScrubber3D.js';
export { ChronoLens3D } from './controls/ChronoLens3D.js';

// ── Sacred Geometry ────────────────────────────────────────
export { Oloid3D } from './controls/Oloid3D.js';
export { Gomboc3D } from './controls/Gomboc3D.js';
export { MeissnerBody3D } from './controls/MeissnerBody3D.js';
export { Sphericon3D } from './controls/Sphericon3D.js';
export { ReuleauxTriangle3D } from './controls/ReuleauxTriangle3D.js';

// ── Advanced / Experimental ────────────────────────────────
export { EchoInteraction3D } from './controls/EchoInteraction3D.js';
export { FlowFieldController3D } from './controls/FlowFieldController3D.js';
export { GestureLoom3D } from './controls/GestureLoom3D.js';
export { HapticHorizon3D } from './controls/HapticHorizon3D.js';
export { IKManipulator3D } from './controls/IKManipulator3D.js';
export { LiquidStateContainer3D } from './controls/LiquidStateContainer3D.js';

// ── AI ─────────────────────────────────────────────────────
export { AIChatBot3D } from './controls/AIChatBot3D.js';
export { AIPortal3D } from './controls/AIPortal3D.js';

// ── Utilities ──────────────────────────────────────────────
export { Logger, logger } from './utils/Logger.js';
