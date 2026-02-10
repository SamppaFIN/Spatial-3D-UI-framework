/**
 * GameRenderer.js
 * Renders the RoguelikeGame state using spatial-ui-3d components.
 */
import { Oloid3D } from '../controls/Oloid3D.js';
import { Gomboc3D } from '../controls/Gomboc3D.js';
import * as THREE from 'three';

export class GameRenderer {
    constructor(scene, camera, game) {
        this.scene = scene;
        this.camera = camera;
        this.game = game;

        this.tileSize = 1.5; // Size of each grid tile in 3D space
        this.gridOffset = {
            x: -(game.width * 1.5) / 2,
            z: -(game.height * 1.5) / 2
        };

        this.entities = {}; // ID -> 3D Object map
        this.walls = [];
        this.floor = null;

        // Initialize
        this.initEnvironment();
        this.renderMap();

        // Subscribe to game updates
        this.game.subscribe((event, data) => this.handleGameUpdate(event, data));
    }

    initEnvironment() {
        // Add some ambient light if not present
        const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
    }

    get3DPosition(gridX, gridY) {
        return [
            this.gridOffset.x + (gridX * this.tileSize),
            0,
            this.gridOffset.z + (gridY * this.tileSize)
        ];
    }

    renderMap() {
        const map = this.game.state.map;
        const wallGeometry = new THREE.BoxGeometry(this.tileSize, this.tileSize, this.tileSize);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x8888ff,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.6
        });

        // Loop through map
        for (let y = 0; y < this.game.height; y++) {
            for (let x = 0; x < this.game.width; x++) {
                if (map[y][x] === 1) { // Wall
                    const mesh = new THREE.Mesh(wallGeometry, wallMaterial);
                    const pos = this.get3DPosition(x, y);
                    mesh.position.set(pos[0], this.tileSize / 2, pos[2]);
                    this.scene.add(mesh);
                    this.walls.push(mesh);
                } else {
                    // Start or floor markers could go here
                }
            }
        }

        // Create Floor Plane
        const floorGeo = new THREE.PlaneGeometry(
            this.game.width * this.tileSize,
            this.game.height * this.tileSize
        );
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x111122,
            side: THREE.DoubleSide,
            roughness: 0.8
        });
        this.floor = new THREE.Mesh(floorGeo, floorMat);
        this.floor.rotation.x = -Math.PI / 2;
        // Center floor
        this.floor.position.set(0, -0.1, 0);
        this.scene.add(this.floor);

        // Initial Entity Render
        this.updateEntities(this.game.state);
    }

    updateEntities(state) {
        // Render Goal
        if (state.goal && !this.entities['goal']) {
            const pos = this.get3DPosition(state.goal.x, state.goal.y);
            // Use Gomboc as goal
            const goal = new Gomboc3D(this.scene, this.camera, [pos[0], 0, pos[2]], {
                color: 0xffd700, // Gold
                materialType: 'metal',
                autoRotate: true
            });
            this.entities['goal'] = goal;
        }

        // Render Player (Olloid)
        const playerState = state.player;
        if (playerState) {
            let playerObj = this.entities[playerState.id];
            const targetPos = this.get3DPosition(playerState.x, playerState.y);

            if (!playerObj) {
                // Create new Player
                playerObj = new Oloid3D(this.scene, this.camera, [targetPos[0], 0, targetPos[2]], {
                    color: 0x00ffcc,
                    radius: 0.6,
                    materialType: 'neon',
                    wireframe: true
                });
                this.entities[playerState.id] = playerObj;
            } else {
                // Lerp to new position (smooth movement)
                const currentPos = playerObj.group.position;
                // Simple strict set for now, relying on high FPS render loop to smooth if we added lerping logic
                // But for 1-second tick, we might want to just snap or use a tween library.
                // For this MVP, we snap.
                playerObj.group.position.set(targetPos[0], 0, targetPos[2]);
            }

            // Update rotation logic if needed
        }
    }

    handleGameUpdate(event, data) {
        if (event === 'tick') {
            this.updateEntities(data);
        }
        if (event === 'game_over') {
            if (data.status === 'won') {
                alert("VICTORY! The Olloid has found the Gomboc!");
            }
        }
    }

    update() {
        // Animation loop for internal controls
        Object.values(this.entities).forEach(entity => {
            if (entity.update) entity.update();
        });
    }
}
