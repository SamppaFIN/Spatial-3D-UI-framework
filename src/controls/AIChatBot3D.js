import { BaseControl3D } from '../core/BaseControl3D.js';
import { aiService } from '../ai/AIService.js';
import * as THREE from 'three';

export class AIChatBot3D extends BaseControl3D {
    constructor(scene, camera, position = [0, 0, 0], config = {}) {
        super(scene, camera, position, {
            ...config,
            width: config.width || 1.5,
            height: config.height || 1.5,
            depth: config.depth || 1.5
        });

        this.messages = config.initialMessages || [
            { role: 'assistant', content: 'Hello! I am Aurora, your spatial guide. How can I help you today?' }
        ];

        this.isTyping = false;
        this.floatingOffset = 0;
        this.pulseTime = 0;

        // Initialize AI Service if key provided
        if (config.apiKey) {
            aiService.setAPIKey(config.apiKey);
            aiService.setEnabled(true);
        }
    }

    create() {
        // Robot Body (Main Sphere)
        const bodyGeo = new THREE.IcosahedronGeometry(0.6, 2);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            emissive: 0x0066ff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8,
            wireframe: true
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.group.add(this.body);

        // Inner Core
        const coreGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x00d4ff,
            emissiveIntensity: 2
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.core);

        // Floating Outer Rings
        this.rings = [];
        for (let i = 0; i < 2; i++) {
            const ringGeo = new THREE.TorusGeometry(0.8 + i * 0.2, 0.02, 16, 100);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            this.group.add(ring);
            this.rings.push(ring);
        }

        // Status Light
        const lightGeo = new THREE.SphereGeometry(0.05, 16, 16);
        this.statusLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.statusLight = new THREE.Mesh(lightGeo, this.statusLightMat);
        this.statusLight.position.set(0, 0.7, 0);
        this.group.add(this.statusLight);
    }

    update(delta = 0.016) {
        // Safe update
        if (typeof this.updateVisualState === 'function') {
            this.updateVisualState();
        }

        // Floating Animation
        this.floatingOffset += delta * 2;
        this.group.position.y = (this.position[1] || 0) + Math.sin(this.floatingOffset) * 0.1;

        // Rotation
        this.body.rotation.y += delta * 0.5;
        this.body.rotation.x += delta * 0.3;

        this.rings.forEach((ring, i) => {
            ring.rotation.z += delta * (i + 1) * 0.5;
        });

        // Pulse logic
        this.pulseTime += delta;
        const pulse = 0.5 + Math.sin(this.pulseTime * 4) * 0.5;
        if (this.isTyping) {
            this.core.material.emissiveIntensity = 2 + pulse * 3;
            this.statusLightMat.color.setHSL(0.6, 1, 0.5); // Blue
        } else {
            this.core.material.emissiveIntensity = 1 + Math.sin(this.pulseTime * 2) * 0.5;
            this.statusLightMat.color.setHSL(0.3, 1, 0.5); // Green
        }
    }

    async sendMessage(text) {
        if (!text || this.isTyping) return;

        this.messages.push({ role: 'user', content: text });
        this.isTyping = true;
        this.updateVisualState();

        try {
            const response = await aiService.generateText(text, {
                systemPrompt: 'You are Aurora, a helpful 3D spatial assistant. Keep responses concise and futuristic.'
            });

            this.messages.push({ role: 'assistant', content: response || 'I am sorry, my quantum link is unstable.' });
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            this.isTyping = false;
            this.updateVisualState();
        }
    }

    get2DContent() {
        const container = super.get2DContent();

        const chatArea = document.createElement('div');
        chatArea.className = 'aurora-chat-container';
        chatArea.style.cssText = `
            margin-top: 15px;
            display: flex;
            flex-direction: column;
            height: 400px;
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(0, 212, 255, 0.1);
        `;

        // History
        const history = document.createElement('div');
        history.style.cssText = `
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            scrollbar-width: thin;
            scrollbar-color: #00d4ff transparent;
        `;

        const renderMessages = () => {
            history.innerHTML = '';
            this.messages.forEach(msg => {
                const bubble = document.createElement('div');
                const isUser = msg.role === 'user';
                bubble.style.cssText = `
                    max-width: 80%;
                    padding: 10px 14px;
                    border-radius: 12px;
                    font-size: 0.9em;
                    line-height: 1.4;
                    ${isUser ? 'align-self: flex-end; background: rgba(0, 212, 255, 0.2); color: #00d4ff; border-bottom-right-radius: 2px;'
                        : 'align-self: flex-start; background: rgba(255, 255, 255, 0.05); color: #fff; border-bottom-left-radius: 2px; border: 1px solid rgba(255,255,255,0.05);'}
                `;
                bubble.innerText = msg.content;
                history.appendChild(bubble);
            });
            history.scrollTop = history.scrollHeight;
        };

        // Input
        const inputArea = document.createElement('div');
        inputArea.style.cssText = `
            padding: 15px;
            background: rgba(0,0,0,0.2);
            display: flex;
            gap: 10px;
            border-top: 1px solid rgba(255,255,255,0.05);
        `;

        const input = document.createElement('input');
        input.placeholder = 'Type your command...';
        input.style.cssText = `
            flex: 1;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(0, 212, 255, 0.2);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            outline: none;
            font-family: inherit;
        `;

        const sendBtn = document.createElement('button');
        sendBtn.innerText = '发送'; // Send in Chinese was requested? No, user used Finnish. "Lähetä"
        sendBtn.innerText = 'LÄHETÄ';
        sendBtn.style.cssText = `
            background: #00d4ff;
            color: black;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            transition: opacity 0.2s;
        `;

        const handleSend = async () => {
            const val = input.value.trim();
            if (!val || this.isTyping) return;
            input.value = '';
            input.disabled = true;
            sendBtn.style.opacity = '0.5';

            await this.sendMessage(val);

            renderMessages();
            input.disabled = false;
            sendBtn.style.opacity = '1';
            input.focus();
        };

        sendBtn.onclick = handleSend;
        input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

        inputArea.appendChild(input);
        inputArea.appendChild(sendBtn);

        chatArea.appendChild(history);
        chatArea.appendChild(inputArea);
        container.appendChild(chatArea);

        setTimeout(renderMessages, 0); // Render after attached

        return container;
    }
}
