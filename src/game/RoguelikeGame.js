/**
 * RoguelikeGame.js
 * Core game logic for Olloid's Journey.
 * Decoupled from rendering to support future multiplayer/WebSocket integration.
 */

export class RoguelikeGame {
    constructor(config = {}) {
        this.width = config.width || 20;
        this.height = config.height || 20;
        this.tickRate = 1000; // 1 second cycle
        
        // Game State
        this.state = {
            tick: 0,
            map: [], // 2D array: 0=floor, 1=wall
            entities: {}, // ID -> Entity map
            player: null, // Reference to player entity
            goal: null, // Reference to goal position {x, y}
            status: 'playing', // playing, won, lost
            lastAction: null
        };

        this.observers = [];
        this.intervalId = null;
        this.pendingPlayerAction = null;

        this.initialize();
    }

    /**
     * Initialize map and entities
     */
    initialize() {
        this.generateMap();
        this.spawnPlayer();
        this.spawnGoal();
        this.startLoop();
    }

    /**
     * Generate a simple maze/map
     * 0 = Floor
     * 1 = Wall
     */
    generateMap() {
        this.state.map = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Borders are walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    row.push(1);
                } else {
                    // Random obstacles (10% chance)
                    row.push(Math.random() < 0.1 ? 1 : 0);
                }
            }
            this.state.map.push(row);
        }
    }

    spawnPlayer() {
        // Find a valid spot
        let position = this.findRandomFloor();
        
        const player = {
            id: 'player_1',
            type: 'olloid',
            x: position.x,
            y: position.y,
            rotation: 0
        };

        this.state.entities[player.id] = player;
        this.state.player = player;
    }

    spawnGoal() {
        let position = this.findRandomFloor();
        // Ensure not on player
        while (position.x === this.state.player.x && position.y === this.state.player.y) {
            position = this.findRandomFloor();
        }

        this.state.goal = position;
    }

    findRandomFloor() {
        let x, y;
        do {
            x = Math.floor(Math.random() * (this.width - 2)) + 1;
            y = Math.floor(Math.random() * (this.height - 2)) + 1;
        } while (this.state.map[y][x] !== 0);
        return { x, y };
    }

    /**
     * Start the 1-second game loop
     */
    startLoop() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.tick(), this.tickRate);
        console.log('Game loop started');
    }

    stopLoop() {
        if (this.intervalId) clearInterval(this.intervalId);
    }

    /**
     * Queue a player action to be executed on next tick
     */
    queueAction(action) {
        if (this.state.status !== 'playing') return;
        this.pendingPlayerAction = action;
        console.log('Action queued:', action);
    }

    /**
     * Main Game Cycle (1 second)
     */
    tick() {
        this.state.tick++;
        
        // Process Player Action
        if (this.pendingPlayerAction) {
            this.processAction(this.state.player, this.pendingPlayerAction);
            this.pendingPlayerAction = null;
        }

        // Check Win Condition
        if (this.state.player.x === this.state.goal.x && this.state.player.y === this.state.goal.y) {
            this.state.status = 'won';
            this.stopLoop();
            this.notifyObservers('game_over', { status: 'won' });
        }

        // Notify observers of state update
        this.notifyObservers('tick', this.state);
        console.log(`Tick ${this.state.tick}`);
    }

    processAction(entity, action) {
        let dx = 0;
        let dy = 0;

        switch (action) {
            case 'move_up': dy = -1; break;
            case 'move_down': dy = 1; break;
            case 'move_left': dx = -1; break;
            case 'move_right': dx = 1; break;
        }

        const newX = entity.x + dx;
        const newY = entity.y + dy;

        if (this.isValidMove(newX, newY)) {
            entity.x = newX;
            entity.y = newY;
            // Update rotation based on movement for visual flare
            if (dx === 1) entity.rotation = 90;
            if (dx === -1) entity.rotation = 270;
            if (dy === 1) entity.rotation = 180;
            if (dy === -1) entity.rotation = 0;
        }
    }

    isValidMove(x, y) {
        // Check bounds
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        // Check walls
        if (this.state.map[y][x] === 1) return false;
        return true;
    }

    // Observer Pattern
    subscribe(callback) {
        this.observers.push(callback);
    }

    notifyObservers(event, data) {
        this.observers.forEach(cb => cb(event, data));
    }
}
