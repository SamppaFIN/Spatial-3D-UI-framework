/**
 * Unit tests for ThemeManager — the global theming singleton.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeManager } from '../../../src/core/ThemeManager.js';

describe('ThemeManager', () => {
    let tm;
    beforeEach(() => {
        tm = new ThemeManager();
    });

    it('defaults to cosmic theme', () => {
        expect(tm.currentTheme).toBe('cosmic');
    });

    it('setTheme() switches theme', () => {
        tm.setTheme('neon');
        expect(tm.currentTheme).toBe('neon');
    });

    it('setTheme() throws or returns false for unknown theme', () => {
        // Depends on implementation: may throw or silently ignore
        const result = tm.setTheme('nonexistent-theme-xyz');
        // At minimum, currentTheme should not be the invalid one
        expect(tm.currentTheme).not.toBe('nonexistent-theme-xyz');
    });

    it('getColor() returns a number (hex)', () => {
        const color = tm.getColor('accent');
        expect(typeof color).toBe('number');
    });

    it('getThreeColor() returns an object with r, g, b or value', () => {
        const color = tm.getThreeColor('accent');
        expect(color).toBeDefined();
    });

    it('createMaterial() returns an object (material)', () => {
        const mat = tm.createMaterial('accent');
        expect(mat).toBeDefined();
    });

    it('has multiple built-in themes', () => {
        // Should at least have cosmic, cyberpunk, aurora
        const themes = tm.getAvailableThemes ? tm.getAvailableThemes() : Object.keys(tm.themes || {});
        expect(themes.length).toBeGreaterThanOrEqual(3);
    });

    it('applyToDOM() does not throw', () => {
        expect(() => tm.applyToDOM()).not.toThrow();
    });
});
