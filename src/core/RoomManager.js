import { CoordinateRoom } from '../environments/CoordinateRoom.js';
import { LandscapeRoom } from '../environments/LandscapeRoom.js';
import { SpaceRoom } from '../environments/SpaceRoom.js';

export class RoomManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.rooms = {};
        this.currentRoom = null;
        this.transitionDuration = 1000; // ms
        this.isEditMode = false; // Edit mode state
    }
    
    initialize() {
        // Create all room types
        this.rooms.coordinate = new CoordinateRoom(this.scene, this.camera);
        this.rooms.landscape = new LandscapeRoom(this.scene, this.camera);
        this.rooms.space = new SpaceRoom(this.scene, this.camera);
        
        // Create all rooms (but only activate one)
        Object.values(this.rooms).forEach(room => {
            room.create();
        });
        
        // Start with space room (default)
        this.switchRoom('space');
    }
    
    switchRoom(roomName) {
        if (!this.rooms[roomName]) {
            console.warn(`Room "${roomName}" not found`);
            return;
        }
        
        const newRoom = this.rooms[roomName];
        
        // If same room, do nothing
        if (this.currentRoom === newRoom) {
            return;
        }
        
        // Deactivate current room
        if (this.currentRoom) {
            this.currentRoom.deactivate();
        }
        
        // Activate new room
        newRoom.activate();
        this.currentRoom = newRoom;
        
        // Scene background is updated in main.js to avoid THREE import issues
        // This method just handles room activation/deactivation
    }
    
    update() {
        // Update current room animations
        if (this.currentRoom) {
            this.currentRoom.update();
        }
    }
    
    getCurrentRoom() {
        return this.currentRoom;
    }
    
    getRoomNames() {
        return Object.keys(this.rooms);
    }
    
    /**
     * Set edit mode state for the room
     * @param {boolean} enabled - Whether edit mode should be enabled
     * @returns {boolean} Current edit mode state
     */
    setEditMode(enabled) {
        this.isEditMode = enabled;
        return this.isEditMode;
    }
    
    /**
     * Get current edit mode state
     * @returns {boolean} Current edit mode state
     */
    getEditMode() {
        return this.isEditMode;
    }
}
