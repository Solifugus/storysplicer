#!/usr/bin/env node

/**
 * Character Agent Controller
 *
 * Cycle-based world simulation controller that:
 * 1. Loads LLM models for minor and story characters
 * 2. Processes all awake, AI-controlled characters each cycle
 * 3. Builds context windows for each character
 * 4. Gets actions from LLMs
 * 5. Executes actions via MCP
 * 6. Updates physical states
 */

import { Character } from '../db/models/index.js';
import { getLLMManager } from './llm.js';
import { buildContextWindow, formatContextAsPrompt, getSystemPrompt } from './context.js';
import { parseAction, executeAction, updatePhysicalState } from './actions.js';

// Configuration
const CYCLE_INTERVAL = parseInt(process.env.CYCLE_INTERVAL || '5000', 10); // 5 seconds default
const WORLD_ID = parseInt(process.env.WORLD_ID || '1', 10);

class AgentController {
  constructor() {
    this.llmManager = null;
    this.running = false;
    this.cycleCount = 0;
    this.lastCycleTime = Date.now();
    this.stats = {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      avgCycleTime: 0,
      charactersProcessed: 0,
    };
  }

  /**
   * Initialize the agent controller
   */
  async initialize() {
    console.log('='.repeat(60));
    console.log('StorySplicer Agent Controller');
    console.log('='.repeat(60));
    console.log(`World ID: ${WORLD_ID}`);
    console.log(`Cycle Interval: ${CYCLE_INTERVAL}ms`);
    console.log('');

    // Initialize LLM manager
    this.llmManager = getLLMManager();
    await this.llmManager.initialize();

    console.log('');
    console.log('Agent Controller initialized successfully');
    console.log('='.repeat(60));
  }

  /**
   * Start the cycle-based simulation
   */
  async start() {
    if (this.running) {
      console.warn('Agent Controller is already running');
      return;
    }

    this.running = true;
    this.lastCycleTime = Date.now();

    console.log('\nStarting simulation...\n');

    // Run first cycle immediately
    await this.runCycle();

    // Schedule subsequent cycles
    this.scheduleNextCycle();
  }

  /**
   * Stop the simulation
   */
  async stop() {
    if (!this.running) {
      return;
    }

    console.log('\nStopping simulation...');
    this.running = false;

    // Print final stats
    this.printStats();

    // Cleanup LLM manager
    await this.llmManager.dispose();

    console.log('Agent Controller stopped');
  }

  /**
   * Schedule the next cycle
   */
  scheduleNextCycle() {
    if (!this.running) {
      return;
    }

    setTimeout(async () => {
      await this.runCycle();
      this.scheduleNextCycle();
    }, CYCLE_INTERVAL);
  }

  /**
   * Run a single simulation cycle
   */
  async runCycle() {
    const cycleStartTime = Date.now();
    this.cycleCount++;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Cycle ${this.cycleCount} - ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(60));

    try {
      // Get all AI-controllable awake characters
      const characters = await Character.findAIControllable(WORLD_ID);

      console.log(`Processing ${characters.length} characters...`);

      if (characters.length === 0) {
        console.log('No awake AI characters to process');
        return;
      }

      // Calculate time since last cycle
      const now = Date.now();
      const secondsPassed = (now - this.lastCycleTime) / 1000;
      this.lastCycleTime = now;

      // Process each character
      for (const character of characters) {
        await this.processCharacter(character, secondsPassed);
        this.stats.charactersProcessed++;
      }

      // Calculate cycle time
      const cycleTime = Date.now() - cycleStartTime;
      this.stats.avgCycleTime =
        (this.stats.avgCycleTime * (this.cycleCount - 1) + cycleTime) / this.cycleCount;

      console.log(`\nCycle completed in ${cycleTime}ms`);
    } catch (error) {
      console.error('Error during cycle:', error);
    }
  }

  /**
   * Process a single character
   * @param {Object} character - Character object
   * @param {number} secondsPassed - Seconds since last cycle
   */
  async processCharacter(character, secondsPassed) {
    console.log(`\n[${character.name}] (${character.character_class})`);

    try {
      // Update physical state based on time passed
      await updatePhysicalState(character.id, secondsPassed);

      // Build context window
      const context = await buildContextWindow(character.id);
      const prompt = formatContextAsPrompt(context);

      // Get system prompt
      const systemPrompt = getSystemPrompt(character.character_class);

      // Generate action from LLM
      console.log(`  Generating action...`);
      const startTime = Date.now();

      const response = await this.llmManager.generate(
        character.character_class,
        systemPrompt,
        prompt,
        {
          temperature: 0.3, // Lower temperature for more focused JSON output
          maxTokens: 64, // Reduced since we only need short JSON
          stopStrings: ['}', '\n\n'], // Stop after JSON closes
        }
      );

      const genTime = Date.now() - startTime;
      console.log(`  Generated in ${genTime}ms`);

      // Parse action
      const action = parseAction(response);
      if (!action) {
        console.log(`  ✗ Failed to parse action`);
        this.stats.failedActions++;
        return;
      }

      // Execute action
      console.log(`  Executing: ${action.action}`);
      const result = await executeAction(character.id, action);

      if (result.success) {
        console.log(`  ✓ ${result.description}`);
        this.stats.successfulActions++;
      } else {
        console.log(`  ✗ ${result.error}`);
        this.stats.failedActions++;
      }

      this.stats.totalActions++;
    } catch (error) {
      console.error(`  Error processing ${character.name}:`, error.message);
      this.stats.failedActions++;
    }
  }

  /**
   * Print statistics
   */
  printStats() {
    console.log('\n' + '='.repeat(60));
    console.log('Statistics');
    console.log('='.repeat(60));
    console.log(`Total Cycles: ${this.cycleCount}`);
    console.log(`Total Actions: ${this.stats.totalActions}`);
    console.log(`Successful: ${this.stats.successfulActions}`);
    console.log(`Failed: ${this.stats.failedActions}`);
    console.log(`Characters Processed: ${this.stats.charactersProcessed}`);
    console.log(`Avg Cycle Time: ${this.stats.avgCycleTime.toFixed(1)}ms`);
    console.log(`Success Rate: ${(this.stats.successfulActions / this.stats.totalActions * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const controller = new AgentController();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nReceived SIGINT, shutting down...');
    await controller.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\nReceived SIGTERM, shutting down...');
    await controller.stop();
    process.exit(0);
  });

  try {
    await controller.initialize();
    await controller.start();
  } catch (error) {
    console.error('Fatal error:', error);
    await controller.stop();
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { AgentController };
