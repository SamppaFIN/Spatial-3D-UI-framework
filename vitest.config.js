import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: [
            { find: 'three/addons/controls/TransformControls.js', replacement: path.resolve(__dirname, 'tests/__mocks__/TransformControls.js') },
            { find: 'three/addons/renderers/CSS3DRenderer.js', replacement: path.resolve(__dirname, 'tests/__mocks__/CSS3DRenderer.js') },
            { find: 'three', replacement: path.resolve(__dirname, 'tests/__mocks__/three.js') }
        ]
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/unit/**/*.test.js'],
        coverage: {
            provider: 'v8',
            include: ['src/core/**'],
            reporter: ['text', 'text-summary']
        }
    }
});
