export const BLOCK_TYPES = {
    // Normal Colors
    'R': { color: 0xff0044, points: 100, hp: 1, emissiveIntensity: 0.5 }, // Neon Red
    'O': { color: 0xffaa00, points: 150, hp: 1, emissiveIntensity: 0.5 }, // Vivid Orange
    'Y': { color: 0xffff00, points: 200, hp: 1, emissiveIntensity: 0.5 }, // Electric Yellow
    'G': { color: 0x00ff88, points: 100, hp: 1, emissiveIntensity: 0.5 }, // Neon Green
    'B': { color: 0x00d4ff, points: 100, hp: 1, emissiveIntensity: 0.5 }, // Cyber Blue
    'P': { color: 0xcc00ff, points: 250, hp: 1, emissiveIntensity: 0.5 }, // Proton Purple
    'W': { color: 0xffffff, points: 50, hp: 1, emissiveIntensity: 0.2 },  // Stark White

    // Special Types
    'T': { color: 0x888888, points: 500, hp: 3, metalness: 0.8 }, // Titan (Hard)
    'I': { color: 0x222222, points: 0, hp: Infinity, metalness: 1.0, roughness: 0.1 }, // Indestructible
    'X': { color: 0x00d4ff, points: 400, hp: 1, transparent: true, opacity: 0.2 }, // Ghost
    'N': { color: 0xffffff, points: 1000, hp: 2, emissive: 0xffffff, pulse: true }, // Nova

    // New Vibrant / Neon variants
    'C': { color: 0x00ffff, points: 300, hp: 1, emissive: 0x00ffff }, // Cyan Flare
    'M': { color: 0xff00ff, points: 300, hp: 1, emissive: 0xff00ff }, // Magenta Flash
    'L': { color: 0x88ff00, points: 300, hp: 1, emissive: 0x88ff00 }, // Lime Glow
};

export const MONSTER_TYPES = [
    { type: 'SWARMER', geo: 'Torus', color: 0xff00ff, behavior: 'random' },
    { type: 'STALKER', geo: 'Sphere', color: 0xff0044, behavior: 'follow' },
    { type: 'GLITCH', geo: 'Dodecahedron', color: 0x00ff88, behavior: 'teleport' }
];

export const KRAKOUT_LEVELS = [
    // 1-5
    { name: "NEON START", layout: [['R', 'G', 'B', 'R', 'G', 'B'], ['C', 'M', 'L', 'C', 'M', 'L'], ['Y', 'Y', 'Y', 'Y', 'Y', 'Y']] },
    { name: "DIAMOND", layout: [[null, null, 'P', 'P', null, null], [null, 'P', 'T', 'T', 'P', null], ['P', 'T', 'W', 'W', 'T', 'P'], [null, 'P', 'T', 'T', 'P', null], [null, null, 'P', 'P', null, null]] },
    { name: "CYBER TUNNEL", layout: [['I', 'C', 'C', 'C', 'C', 'I'], ['I', 'M', null, null, 'M', 'I'], ['I', 'L', null, null, 'L', 'I'], ['I', 'C', 'C', 'C', 'C', 'I']] },
    { name: "X-FACTOR", layout: [['R', null, null, null, null, 'B'], [null, 'O', null, null, 'G', null], [null, null, 'Y', 'Y', null, null], [null, 'P', null, null, 'W', null], ['T', null, null, null, null, 'R']] },
    { name: "RAINBOW DASH", layout: [['R', 'O', 'Y', 'G', 'B', 'P'], ['C', 'M', 'L', 'C', 'M', 'L'], ['W', 'W', 'W', 'W', 'W', 'W']] },

    // 6-10
    { name: "THE WALL", layout: [['T', 'T', 'T', 'T', 'T', 'T'], ['I', 'I', 'I', 'I', 'I', 'I'], ['W', 'W', 'W', 'W', 'W', 'W']] },
    { name: "HOURGLASS", layout: [['P', 'P', 'P', 'P', 'P', 'P'], [null, 'Y', 'Y', 'Y', 'Y', null], [null, null, 'O', 'O', null, null], [null, 'Y', 'Y', 'Y', 'Y', null], ['P', 'P', 'P', 'P', 'P', 'P']] },
    { name: "PILLARS", layout: [['I', 'B', 'I', 'R', 'I', 'G'], ['I', 'B', 'I', 'R', 'I', 'G'], ['I', 'B', 'I', 'R', 'I', 'G'], ['I', 'B', 'I', 'R', 'I', 'G']] },
    { name: "GHOST PHANTOM", layout: [['X', 'X', 'X', 'X', 'X', 'X'], ['X', 'I', 'X', 'X', 'I', 'X'], ['X', 'X', 'N', 'N', 'X', 'X']] },
    { name: "FINAL BLOCKADE", layout: [['I', 'I', 'I', 'I', 'I', 'I'], ['I', 'T', 'T', 'T', 'T', 'I'], ['I', 'T', 'I', 'I', 'T', 'I'], ['I', 'T', 'T', 'T', 'T', 'I'], ['I', 'I', 'I', 'I', 'I', 'I']] },

    // ... (rest of 30 levels would follow similar pattern with new colors C, M, L)
];
// Helper to fill empty levels for now to avoid crashes if user clears all 10
while (KRAKOUT_LEVELS.length < 30) {
    KRAKOUT_LEVELS.push({
        name: `SECTOR ${KRAKOUT_LEVELS.length + 1}`,
        layout: [['C', 'M', 'L', 'C', 'M', 'L'], [null, 'N', 'N', 'N', null], ['I', 'T', 'T', 'T', 'T', 'I']]
    });
}
