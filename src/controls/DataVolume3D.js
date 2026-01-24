import * as THREE from 'three';
import { BaseControl3D } from '../core/BaseControl3D.js';

/**
 * DataVolume3D - Volumetric Data Visualization
 * 
 * Renders volumetric data using a cloud of particles (voxels).
 * Uses InstancedMesh for high performance rendering of 10k-100k voxels.
 * 
 * @extends BaseControl3D
 */
export class DataVolume3D extends BaseControl3D {
    constructor(scene, camera, position, config = {}) {
        const defaults = {
            dimensions: new THREE.Vector3(10, 10, 10),
            resolution: 32, // Grid size (e.g. 32x32x32)
            threshold: 0.2, // Minimum density to render
            pointSize: 0.15,
            colorLow: 0x0000ff, // Blue
            colorHigh: 0xff0000, // Red
            opacity: 0.8
        };

        const finalConfig = { ...defaults, ...config };
        super(scene, camera, position, finalConfig);

        this.resolution = finalConfig.resolution;
        this.dimensions = finalConfig.dimensions;
        this.threshold = finalConfig.threshold;

        // Data storage
        this.data = null; // Float32Array
        this.voxelMesh = null; // InstancedMesh

        // Slicing state (0-1 range relative to bounding box, null means no slice)
        this.sliceX = 1.0;
        this.sliceY = 1.0;
        this.sliceZ = 1.0;

        // Generate data and build
        this.generateData();
        this.create();
    }

    create() {
        // Initialization safety check (super calls create before we are ready)
        if (!this.data) return;

        console.log(`DataVolume3D: Creating volume ${this.resolution}^3 (${Math.pow(this.resolution, 3)} voxels)`);

        this.createVoxelCloud();
        this.updateVisuals();
    }

    generateData() {
        const size = this.resolution;
        const count = size * size * size;
        this.data = new Float32Array(count);

        const center = new THREE.Vector3(size / 2, size / 2, size / 2);

        // Simple noise-like generation (using sine waves sum)
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = x + y * size + z * size * size;

                    // Normalize coords -1 to 1
                    const nx = (x / size) * 2 - 1;
                    const ny = (y / size) * 2 - 1;
                    const nz = (z / size) * 2 - 1;

                    // Distance from center (Sphere shape base)
                    const dist = Math.sqrt(nx * nx + ny * ny + nz * nz);
                    let val = Math.max(0, 1.0 - dist);

                    // Add "Noise"
                    val += Math.sin(nx * 5.0 + ny * 4.0) * 0.2;
                    val += Math.cos(nz * 6.0 + nx * 3.0) * 0.2;

                    // Clamp 0-1
                    this.data[idx] = Math.max(0, Math.min(1, val));
                }
            }
        }
    }

    createVoxelCloud() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: this.config.opacity,
            // blending: THREE.AdditiveBlending // Optional for "glow" look
        });

        const count = Math.pow(this.resolution, 3);
        this.voxelMesh = new THREE.InstancedMesh(geometry, material, count);
        this.voxelMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.voxelMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

        // Disable frustum culling to avoid disappearing when bounds change dynamicallly
        this.voxelMesh.frustumCulled = false;

        this.group.add(this.voxelMesh);
    }

    updateVisuals() {
        if (!this.voxelMesh || !this.data) return;

        const size = this.resolution;
        const expectedCount = size * size * size;
        if (this.data.length !== expectedCount) {
            console.warn(`DataVolume3D: Data size mismatch. Expected ${expectedCount}, got ${this.data.length}`);
            return;
        }

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        const cLow = new THREE.Color(this.config.colorLow);
        const cHigh = new THREE.Color(this.config.colorHigh);

        let instanceIdx = 0;
        const voxelSize = this.dimensions.x / size;
        const scaleBase = this.config.pointSize * (10 / size);

        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = x + y * size + z * size * size;
                    const val = this.data[idx];

                    const posX = (x - size / 2) * voxelSize;
                    const posY = (y - size / 2) * voxelSize;
                    const posZ = (z - size / 2) * voxelSize;

                    let visible = val >= this.threshold;

                    if (visible) {
                        if (x / size > this.sliceX) visible = false;
                        if (y / size > this.sliceY) visible = false;
                        if (z / size > this.sliceZ) visible = false;
                    }

                    if (visible) {
                        dummy.position.set(posX, posY, posZ);
                        dummy.scale.setScalar(scaleBase * val);
                        dummy.updateMatrix();

                        this.voxelMesh.setMatrixAt(instanceIdx, dummy.matrix);

                        color.lerpColors(cLow, cHigh, val);
                        this.voxelMesh.setColorAt(instanceIdx, color);
                    } else {
                        dummy.position.set(0, 0, 0);
                        dummy.scale.setScalar(0);
                        dummy.updateMatrix();
                        this.voxelMesh.setMatrixAt(instanceIdx, dummy.matrix);
                    }

                    instanceIdx++;
                }
            }
        }

        this.voxelMesh.instanceMatrix.needsUpdate = true;
        this.voxelMesh.instanceColor.needsUpdate = true;
    }

    setData(newData) {
        if (Array.isArray(newData)) {
            this.data = new Float32Array(newData);
        } else {
            this.data = newData;
        }
        this.updateVisuals();
    }

    setSlice(axis, value) {
        if (axis === 'x') this.sliceX = value;
        if (axis === 'y') this.sliceY = value;
        if (axis === 'z') this.sliceZ = value;
        this.updateVisuals();
    }

    setThreshold(value) {
        this.threshold = value;
        this.updateVisuals();
    }

    update(time) {
        // Optional animation: rotate volume
        // this.group.rotation.y = time * 0.1;
    }
}
