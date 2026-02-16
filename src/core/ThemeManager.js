import * as THREE from 'three';

/**
 * Global Theme Manager for Spatial UI 3D
 * Provides consistent theming across all components
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = 'cosmic';
        this.themes = {
            cosmic: {
                name: 'Cosmic',
                primary: 0x4ecdc4,
                secondary: 0x6bb6ff,
                accent: 0xff6b9d,
                background: 0x0a0a0f,
                surface: 0x1a1a2e,
                text: 0xffffff,
                textSecondary: 0xcccccc,
                success: 0x48bb78,
                warning: 0xffaa00,
                error: 0xff6b6b,
                border: 0x4a4a6e
            },
            neon: {
                name: 'Neon',
                primary: 0xff00ff,
                secondary: 0x00ffff,
                accent: 0xffff00,
                background: 0x000000,
                surface: 0x0a0a0a,
                text: 0xffffff,
                textSecondary: 0xcccccc,
                success: 0x00ff00,
                warning: 0xffaa00,
                error: 0xff0000,
                border: 0x333333
            },
            nature: {
                name: 'Nature',
                primary: 0x48bb78,
                secondary: 0x8bc34a,
                accent: 0xffc107,
                background: 0x1a1a1a,
                surface: 0x2a2a2a,
                text: 0xffffff,
                textSecondary: 0xcccccc,
                success: 0x4caf50,
                warning: 0xff9800,
                error: 0xf44336,
                border: 0x4a4a4a
            },
            ocean: {
                name: 'Ocean',
                primary: 0x0077be,
                secondary: 0x00bcd4,
                accent: 0x26c6da,
                background: 0x001f3f,
                surface: 0x003366,
                text: 0xffffff,
                textSecondary: 0xb0e0e6,
                success: 0x00897b,
                warning: 0xffa726,
                error: 0xe53935,
                border: 0x004d7a
            },
            sunset: {
                name: 'Sunset',
                primary: 0xff6b6b,
                secondary: 0xffa07a,
                accent: 0xffd700,
                background: 0x2c1810,
                surface: 0x3d2418,
                text: 0xffffff,
                textSecondary: 0xf5deb3,
                success: 0x90ee90,
                warning: 0xffa500,
                error: 0xff4500,
                border: 0x5d3a1a
            },
            midnight: {
                name: 'Midnight',
                primary: 0x7b68ee,
                secondary: 0x9370db,
                accent: 0xba55d3,
                background: 0x0f0f23,
                surface: 0x1a1a3e,
                text: 0xffffff,
                textSecondary: 0xd8bfd8,
                success: 0x98fb98,
                warning: 0xffd700,
                error: 0xff69b4,
                border: 0x483d8b
            },
            highContrast: {
                name: 'High Contrast',
                primary: 0xffffff,
                secondary: 0xffff00,
                accent: 0x00ffff,
                background: 0x000000,
                surface: 0x111111,
                text: 0xffffff,
                textSecondary: 0xeeeeee,
                success: 0x00ff00,
                warning: 0xffff00,
                error: 0xff0000,
                border: 0xffffff
            },
            colorBlindSafe: {
                name: 'Color Blind Safe',
                primary: 0x0077bb,
                secondary: 0x33bbee,
                accent: 0xee7733,
                background: 0x0a0a14,
                surface: 0x1a1a2e,
                text: 0xffffff,
                textSecondary: 0xcccccc,
                success: 0x009988,
                warning: 0xee7733,
                error: 0xcc3311,
                border: 0x4a4a6e
            }
        };

        this.listeners = [];
    }

    /**
     * Get current theme
     */
    getTheme(themeName = null) {
        const name = themeName || this.currentTheme;
        return this.themes[name] || this.themes.cosmic;
    }

    /**
     * Set active theme
     */
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            this.notifyListeners(themeName);
            return true;
        }
        return false;
    }

    /**
     * Get color from current theme
     */
    getColor(colorName) {
        const theme = this.getTheme();
        return theme[colorName] || theme.primary;
    }

    /**
     * Get THREE.Color from current theme
     */
    getThreeColor(colorName) {
        return new THREE.Color(this.getColor(colorName));
    }

    /**
     * Register theme change listener
     */
    onChange(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of theme change
     */
    notifyListeners(themeName) {
        const theme = this.getTheme(themeName);
        this.listeners.forEach(callback => callback(theme, themeName));
    }

    /**
     * Add custom theme
     */
    addTheme(name, themeConfig) {
        this.themes[name] = {
            name: themeConfig.name || name,
            primary: themeConfig.primary || 0x4ecdc4,
            secondary: themeConfig.secondary || 0x6bb6ff,
            accent: themeConfig.accent || 0xff6b9d,
            background: themeConfig.background || 0x0a0a0f,
            surface: themeConfig.surface || 0x1a1a2e,
            text: themeConfig.text || 0xffffff,
            textSecondary: themeConfig.textSecondary || 0xcccccc,
            success: themeConfig.success || 0x48bb78,
            warning: themeConfig.warning || 0xffaa00,
            error: themeConfig.error || 0xff6b6b,
            border: themeConfig.border || 0x4a4a6e
        };
    }

    /**
     * Get all available themes
     */
    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            id: key,
            name: this.themes[key].name
        }));
    }

    /**
     * Apply theme to scene background
     */
    applyToScene(scene) {
        const theme = this.getTheme();
        scene.background = new THREE.Color(theme.background);

        // Update fog if exists
        if (scene.fog) {
            scene.fog.color = new THREE.Color(theme.background);
        }
    }

    /**
     * Create material with theme colors
     */
    createMaterial(colorName = 'primary', options = {}) {
        const color = this.getColor(colorName);

        return new THREE.MeshStandardMaterial({
            color: color,
            metalness: options.metalness || 0.4,
            roughness: options.roughness || 0.3,
            emissive: options.emissive !== undefined ? options.emissive : color,
            emissiveIntensity: options.emissiveIntensity || 0.3,
            ...options
        });
    }

    /**
     * Get gradient colors for current theme
     */
    getGradient(type = 'primary') {
        const theme = this.getTheme();

        const gradients = {
            primary: [theme.primary, theme.secondary],
            accent: [theme.accent, theme.primary],
            success: [theme.success, theme.primary],
            warning: [theme.warning, theme.accent],
            error: [theme.error, theme.accent],
            full: [theme.primary, theme.secondary, theme.accent]
        };

        return gradients[type] || gradients.primary;
    }

    /**
     * Convert hex color to CSS string
     */
    hexToCSS(hex) {
        const color = new THREE.Color(hex);
        return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
    }

    /**
     * Get CSS variables for current theme
     */
    getCSSVariables() {
        const theme = this.getTheme();
        return {
            '--theme-primary': this.hexToCSS(theme.primary),
            '--theme-secondary': this.hexToCSS(theme.secondary),
            '--theme-accent': this.hexToCSS(theme.accent),
            '--theme-background': this.hexToCSS(theme.background),
            '--theme-surface': this.hexToCSS(theme.surface),
            '--theme-text': this.hexToCSS(theme.text),
            '--theme-text-secondary': this.hexToCSS(theme.textSecondary),
            '--theme-success': this.hexToCSS(theme.success),
            '--theme-warning': this.hexToCSS(theme.warning),
            '--theme-error': this.hexToCSS(theme.error),
            '--theme-border': this.hexToCSS(theme.border)
        };
    }

    /**
     * Apply theme CSS variables to document
     */
    applyToDOM() {
        const variables = this.getCSSVariables();
        const root = document.documentElement;

        Object.entries(variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }
}

// Global theme manager instance
export const themeManager = new ThemeManager();
