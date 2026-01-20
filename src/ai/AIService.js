/**
 * AI Service Integration Layer
 * Provides unified interface for AI-powered features across components
 */
export class AIService {
    constructor(config = {}) {
        this.provider = config.provider || 'openai'; // 'openai', 'anthropic', 'local'
        this.apiKey = config.apiKey || null;
        this.baseURL = config.baseURL || this.getDefaultBaseURL();
        this.model = config.model || this.getDefaultModel();
        this.enabled = config.enabled !== false;
    }

    getDefaultBaseURL() {
        const urls = {
            openai: 'https://api.openai.com/v1',
            anthropic: 'https://api.anthropic.com/v1',
            local: 'http://localhost:11434/api' // Ollama default
        };
        return urls[this.provider] || urls.openai;
    }

    getDefaultModel() {
        const models = {
            openai: 'gpt-3.5-turbo',
            anthropic: 'claude-3-sonnet-20240229',
            local: 'llama2'
        };
        return models[this.provider] || models.openai;
    }

    /**
     * Generate text completion
     * @param {string} prompt - Input prompt
     * @param {Object} options - Generation options
     */
    async generateText(prompt, options = {}) {
        if (!this.enabled) {
            console.warn('AI Service is disabled');
            return null;
        }

        try {
            const response = await this.makeRequest('/chat/completions', {
                model: options.model || this.model,
                messages: [
                    { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: options.maxTokens || 150,
                temperature: options.temperature || 0.7
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('AI text generation failed:', error);
            return null;
        }
    }

    /**
     * Generate auto-complete suggestions
     * @param {string} context - Current input context
     * @param {Object} options - Suggestion options
     */
    async generateSuggestions(context, options = {}) {
        if (!this.enabled) return [];

        const prompt = `Given the following text context, suggest 3-5 relevant completions:\n\n"${context}"\n\nProvide only the suggestions, one per line.`;

        try {
            const response = await this.generateText(prompt, {
                systemPrompt: 'You are an autocomplete assistant. Provide concise, relevant suggestions.',
                maxTokens: 100,
                ...options
            });

            if (!response) return [];

            return response.split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .slice(0, 5);
        } catch (error) {
            console.error('AI suggestions failed:', error);
            return [];
        }
    }

    /**
     * Analyze sentiment of text
     * @param {string} text - Text to analyze
     */
    async analyzeSentiment(text) {
        if (!this.enabled) return { sentiment: 'neutral', confidence: 0 };

        const prompt = `Analyze the sentiment of the following text and respond with ONLY a JSON object containing "sentiment" (positive/negative/neutral) and "confidence" (0-1):\n\n"${text}"`;

        try {
            const response = await this.generateText(prompt, {
                systemPrompt: 'You are a sentiment analysis assistant. Respond only with valid JSON.',
                maxTokens: 50
            });

            if (!response) return { sentiment: 'neutral', confidence: 0 };

            const result = JSON.parse(response);
            return result;
        } catch (error) {
            console.error('Sentiment analysis failed:', error);
            return { sentiment: 'neutral', confidence: 0 };
        }
    }

    /**
     * Generate data insights from chart data
     * @param {Array} data - Chart data points
     * @param {Object} options - Analysis options
     */
    async generateInsights(data, options = {}) {
        if (!this.enabled) return [];

        const dataStr = JSON.stringify(data, null, 2);
        const prompt = `Analyze this data and provide 3-5 key insights:\n\n${dataStr}\n\nProvide insights as a numbered list.`;

        try {
            const response = await this.generateText(prompt, {
                systemPrompt: 'You are a data analyst. Provide clear, actionable insights.',
                maxTokens: 200,
                ...options
            });

            if (!response) return [];

            return response.split('\n')
                .filter(line => /^\d+\./.test(line.trim()))
                .map(line => line.replace(/^\d+\.\s*/, '').trim())
                .filter(insight => insight.length > 0);
        } catch (error) {
            console.error('Insight generation failed:', error);
            return [];
        }
    }

    /**
     * Transcribe speech to text (placeholder for Web Speech API or external service)
     * @param {Blob} audioBlob - Audio data
     */
    async transcribeSpeech(audioBlob) {
        if (!this.enabled) return '';

        // This would integrate with Web Speech API or external transcription service
        console.warn('Speech transcription not yet implemented');
        return '';
    }

    /**
     * Generate content for TextDisplay
     * @param {string} topic - Content topic
     * @param {Object} options - Generation options
     */
    async generateContent(topic, options = {}) {
        if (!this.enabled) return '';

        const prompt = `Write informative content about: ${topic}\n\nFormat: ${options.format || 'markdown'}\nLength: ${options.length || 'medium'}`;

        try {
            const response = await this.generateText(prompt, {
                systemPrompt: 'You are a content writer. Create clear, well-structured content.',
                maxTokens: options.maxTokens || 500,
                ...options
            });

            return response || '';
        } catch (error) {
            console.error('Content generation failed:', error);
            return '';
        }
    }

    /**
     * Make API request
     * @private
     */
    async makeRequest(endpoint, data) {
        const url = `${this.baseURL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.provider === 'openai' && this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        } else if (this.provider === 'anthropic' && this.apiKey) {
            headers['x-api-key'] = this.apiKey;
            headers['anthropic-version'] = '2023-06-01';
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Check if AI service is available
     */
    async isAvailable() {
        if (!this.enabled) return false;

        try {
            await this.generateText('test', { maxTokens: 5 });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Set API key
     */
    setAPIKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Enable/disable AI service
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Global AI service instance
export const aiService = new AIService({ enabled: false }); // Disabled by default
