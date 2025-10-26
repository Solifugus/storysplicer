/**
 * LLM Manager for character agents
 *
 * Manages two models:
 * - Llama-3.2-3B-Instruct-uncensored for minor characters (~2.3GB VRAM with Q5_K_M)
 * - Qwen2-7B-Instruct for story characters (~5GB VRAM with Q5_K_M)
 *
 * Total VRAM: ~7.3GB (fits comfortably in RTX 3070 8GB)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');
const MODELS_DIR = join(PROJECT_ROOT, 'models');

// Model configurations with fallback paths
const MODELS = {
  minor: {
    name: 'Llama-3.2-3B-Instruct',
    // Try uncensored first, fall back to standard
    paths: [
      join(MODELS_DIR, 'llama-3.2-3b-instruct-uncensored.Q5_K_M.gguf'),
      join(MODELS_DIR, 'llama-3.2-3b-instruct.Q5_K_M.gguf'),
    ],
    contextSize: 1024, // Reduced from 2048 to save VRAM
    gpuLayers: 99, // Full offload to GPU
  },
  story: {
    name: 'Qwen2-7B-Instruct',
    paths: [
      join(MODELS_DIR, 'qwen2-7b-instruct.Q5_K_M.gguf'),
    ],
    contextSize: 2048, // Reduced from 4096 to save VRAM
    gpuLayers: 99, // Full offload to GPU
  },
};

class LLMManager {
  constructor() {
    this.llama = null;
    this.models = {
      minor: null,
      story: null,
    };
    this.initialized = false;
  }

  /**
   * Load a model with fallback paths
   * @param {string} modelType - 'minor' or 'story'
   * @returns {Promise<Object>} Loaded model
   */
  async loadModelWithFallback(modelType) {
    const config = MODELS[modelType];
    const paths = Array.isArray(config.paths) ? config.paths : [config.paths];

    let lastError = null;
    for (const path of paths) {
      try {
        console.log(`  Trying: ${path}`);
        const model = await this.llama.loadModel({
          modelPath: path,
          gpuLayers: config.gpuLayers,
        });
        console.log(`  Success!`);
        return model;
      } catch (error) {
        console.log(`  Not found or failed: ${error.message}`);
        lastError = error;
      }
    }

    // All paths failed
    console.error(`Failed to load ${config.name} from any of these paths:`);
    paths.forEach(p => console.error(`  - ${p}`));
    throw lastError || new Error(`No model found for ${modelType}`);
  }

  /**
   * Initialize the LLM manager (lazy-load models on first use)
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log('Initializing LLM Manager...');

    // Get llama instance
    this.llama = await getLlama();

    this.initialized = true;
    console.log('LLM Manager initialized (models will be loaded on-demand)');
    console.log(`Minor characters: ${MODELS.minor.name}`);
    console.log(`Story characters: ${MODELS.story.name}`);
  }

  /**
   * Ensure a model is loaded (lazy loading)
   * @param {string} modelType - 'minor' or 'story'
   */
  async ensureModelLoaded(modelType) {
    if (this.models[modelType]) {
      return; // Already loaded
    }

    console.log(`Loading ${MODELS[modelType].name}...`);
    this.models[modelType] = await this.loadModelWithFallback(modelType);
    console.log(`✓ Loaded ${MODELS[modelType].name}`);
  }

  /**
   * Generate a response from the appropriate model
   * @param {string} characterClass - 'minor' or 'story'
   * @param {string} systemPrompt - System prompt for the character
   * @param {string} userPrompt - User/context prompt
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated response
   */
  async generate(characterClass, systemPrompt, userPrompt, options = {}) {
    if (!this.initialized) {
      throw new Error('LLM Manager not initialized');
    }

    // Ensure model is loaded
    await this.ensureModelLoaded(characterClass);

    const model = this.models[characterClass];
    if (!model) {
      throw new Error(`Invalid character class: ${characterClass}`);
    }

    const config = MODELS[characterClass];

    // Create context
    const context = await model.createContext({
      contextSize: config.contextSize,
    });

    // Create session
    const session = new LlamaChatSession({
      contextSequence: context.getSequence(),
    });

    // Generate response
    const response = await session.prompt(userPrompt, {
      systemPrompt,
      temperature: options.temperature || 0.8,
      topP: options.topP || 0.95,
      maxTokens: options.maxTokens || 256,
      stopStrings: options.stopStrings || [],
    });

    // Clean up
    await context.dispose();

    return response;
  }

  /**
   * Stream a response from the appropriate model
   * @param {string} characterClass - 'minor' or 'story'
   * @param {string} systemPrompt - System prompt for the character
   * @param {string} userPrompt - User/context prompt
   * @param {Function} onToken - Callback for each token
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Full generated response
   */
  async generateStream(characterClass, systemPrompt, userPrompt, onToken, options = {}) {
    if (!this.initialized) {
      throw new Error('LLM Manager not initialized');
    }

    // Ensure model is loaded
    await this.ensureModelLoaded(characterClass);

    const model = this.models[characterClass];
    if (!model) {
      throw new Error(`Invalid character class: ${characterClass}`);
    }

    const config = MODELS[characterClass];

    // Create context
    const context = await model.createContext({
      contextSize: config.contextSize,
    });

    // Create session
    const session = new LlamaChatSession({
      contextSequence: context.getSequence(),
    });

    // Stream response
    let fullResponse = '';

    await session.prompt(userPrompt, {
      systemPrompt,
      temperature: options.temperature || 0.8,
      topP: options.topP || 0.95,
      maxTokens: options.maxTokens || 256,
      stopStrings: options.stopStrings || [],
      onTextChunk: (chunk) => {
        fullResponse += chunk;
        if (onToken) {
          onToken(chunk);
        }
      },
    });

    // Clean up
    await context.dispose();

    return fullResponse;
  }

  /**
   * Cleanup and dispose of models
   */
  async dispose() {
    console.log('Disposing LLM Manager...');

    if (this.models.minor) {
      await this.models.minor.dispose();
    }
    if (this.models.story) {
      await this.models.story.dispose();
    }
    if (this.llama) {
      await this.llama.dispose();
    }

    this.initialized = false;
    console.log('LLM Manager disposed');
  }
}

// Singleton instance
let llmManager = null;

/**
 * Get the LLM manager instance
 * @returns {LLMManager}
 */
export function getLLMManager() {
  if (!llmManager) {
    llmManager = new LLMManager();
  }
  return llmManager;
}

/**
 * Model information for reference
 */
export const MODEL_INFO = {
  minor: {
    name: MODELS.minor.name,
    contextSize: MODELS.minor.contextSize,
    estimatedVRAM: '~2.3GB (Q5_K_M)',
  },
  story: {
    name: MODELS.story.name,
    contextSize: MODELS.story.contextSize,
    estimatedVRAM: '~5GB (Q5_K_M)',
  },
};
