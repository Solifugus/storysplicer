/**
 * Character Action Parser and Executor
 *
 * Parses LLM responses and executes character actions via MCP tools
 */

import { Character, Area, Item } from '../db/models/index.js';
import { handleCharacterTool } from '../mcp/tools/character.js';
import { handleItemTool } from '../mcp/tools/item.js';

/**
 * Parse LLM response to extract action
 * @param {string} response - LLM response text
 * @returns {Object|null} Parsed action object or null if invalid
 */
export function parseAction(response) {
  try {
    // Clean up response
    let cleaned = response.trim();

    // Add closing brace if missing (in case stop string cut it off)
    if (cleaned.startsWith('{') && !cleaned.endsWith('}')) {
      cleaned += '}';
    }

    // Try to find JSON in the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in response:', response);
      return null;
    }

    const action = JSON.parse(jsonMatch[0]);

    // Validate action has required fields
    if (!action.action) {
      console.warn('Action missing "action" field:', action);
      return null;
    }

    return action;
  } catch (error) {
    console.error('Failed to parse action:', error.message);
    console.error('Response was:', response);
    return null;
  }
}

/**
 * Execute a parsed action
 * @param {number} characterId - Character ID
 * @param {Object} action - Parsed action object
 * @returns {Promise<Object>} Execution result
 */
export async function executeAction(characterId, action) {
  const character = await Character.findById(characterId);
  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }

  try {
    switch (action.action) {
      case 'move':
        return await executeMoveAction(character, action);

      case 'speak':
        return await executeSpeakAction(character, action);

      case 'pickup':
        return await executePickupAction(character, action);

      case 'drop':
        return await executeDropAction(character, action);

      case 'wait':
        return await executeWaitAction(character, action);

      case 'sleep':
        return await executeSleepAction(character, action);

      default:
        console.warn(`Unknown action type: ${action.action}`);
        return {
          success: false,
          error: `Unknown action: ${action.action}`,
        };
    }
  } catch (error) {
    console.error(`Error executing action for ${character.name}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute move action
 */
async function executeMoveAction(character, action) {
  if (!action.direction) {
    return { success: false, error: 'Move action requires direction' };
  }

  if (!character.current_area_id) {
    return { success: false, error: 'Character is not in any area' };
  }

  const currentArea = await Area.findById(character.current_area_id);
  if (!currentArea) {
    return { success: false, error: 'Current area not found' };
  }

  const exits = currentArea.exits || {};
  const targetAreaId = exits[action.direction.toLowerCase()];

  if (!targetAreaId) {
    return {
      success: false,
      error: `No exit in direction: ${action.direction}`,
    };
  }

  // Execute move via MCP
  await handleCharacterTool('character_move', {
    character_id: character.id,
    area_id: targetAreaId,
  });

  return {
    success: true,
    action: 'move',
    direction: action.direction,
    from: character.current_area_id,
    to: targetAreaId,
    description: `${character.name} moved ${action.direction}`,
  };
}

/**
 * Execute speak action
 */
async function executeSpeakAction(character, action) {
  if (!action.text) {
    return { success: false, error: 'Speak action requires text' };
  }

  // Execute speak via MCP
  await handleCharacterTool('character_speak', {
    character_id: character.id,
    text: action.text,
    action_type: 'speech',
  });

  return {
    success: true,
    action: 'speak',
    text: action.text,
    description: `${character.name} says: "${action.text}"`,
  };
}

/**
 * Execute pickup action
 */
async function executePickupAction(character, action) {
  if (!action.item) {
    return { success: false, error: 'Pickup action requires item name' };
  }

  if (!character.current_area_id) {
    return { success: false, error: 'Character is not in any area' };
  }

  // Find the item in the current area
  const items = await Area.getItems(character.current_area_id);
  const item = items.find(i =>
    i.name.toLowerCase().includes(action.item.toLowerCase())
  );

  if (!item) {
    return {
      success: false,
      error: `Item not found: ${action.item}`,
    };
  }

  // Check if hands are free
  const inventory = await Character.getInventory(character.id);
  const rightHand = inventory.find(i => i.held_location === 'right hand');
  const leftHand = inventory.find(i => i.held_location === 'left hand');

  let location = null;
  if (!rightHand) {
    location = 'right hand';
  } else if (!leftHand) {
    location = 'left hand';
  } else {
    return {
      success: false,
      error: 'Both hands are full',
    };
  }

  // Execute pickup via MCP
  await handleItemTool('item_pickup', {
    character_id: character.id,
    item_id: item.id,
    location,
  });

  return {
    success: true,
    action: 'pickup',
    item: item.name,
    location,
    description: `${character.name} picked up ${item.name} in ${location}`,
  };
}

/**
 * Execute drop action
 */
async function executeDropAction(character, action) {
  if (!action.item) {
    return { success: false, error: 'Drop action requires item name' };
  }

  // Find the item in inventory
  const inventory = await Character.getInventory(character.id);
  const item = inventory.find(i =>
    i.name.toLowerCase().includes(action.item.toLowerCase())
  );

  if (!item) {
    return {
      success: false,
      error: `Not holding item: ${action.item}`,
    };
  }

  // Execute drop via MCP
  await handleItemTool('item_drop', {
    character_id: character.id,
    item_id: item.id,
  });

  return {
    success: true,
    action: 'drop',
    item: item.name,
    description: `${character.name} dropped ${item.name}`,
  };
}

/**
 * Execute wait action
 */
async function executeWaitAction(character, action) {
  // Just add a memory entry
  await Character.addMemory(
    character.id,
    {
      action: 'waited',
      result: 'time passed',
    },
    character.character_class === 'story' ? 5 : 3
  );

  return {
    success: true,
    action: 'wait',
    description: `${character.name} waits`,
  };
}

/**
 * Execute sleep action
 */
async function executeSleepAction(character, action) {
  // Set alertness to 0 (deep sleep)
  await handleCharacterTool('character_update_state', {
    character_id: character.id,
    alertness: 0,
  });

  return {
    success: true,
    action: 'sleep',
    description: `${character.name} goes to sleep`,
  };
}

/**
 * Update character physical state based on time passed
 * @param {number} characterId - Character ID
 * @param {number} secondsPassed - Seconds since last update
 */
export async function updatePhysicalState(characterId, secondsPassed) {
  const character = await Character.findById(characterId);
  if (!character) {
    return;
  }

  const updates = {};

  // Deplete nutrition (lose ~1% per 15 minutes)
  const nutritionLoss = (secondsPassed / 900) * 1.0;
  updates.nutrition = Math.max(0, parseFloat(character.nutrition) - nutritionLoss);

  // Deplete hydration (lose ~1% per 10 minutes)
  const hydrationLoss = (secondsPassed / 600) * 1.0;
  updates.hydration = Math.max(0, parseFloat(character.hydration) - hydrationLoss);

  // Handle tiredness and alertness
  if (parseFloat(character.alertness) < 20) {
    // Sleeping: reduce tiredness, increase alertness
    updates.tiredness = Math.max(0, parseFloat(character.tiredness) - (secondsPassed / 60) * 5);
    updates.alertness = Math.min(100, parseFloat(character.alertness) + (secondsPassed / 60) * 5);
  } else {
    // Awake: increase tiredness, maintain alertness
    updates.tiredness = Math.min(100, parseFloat(character.tiredness) + (secondsPassed / 600) * 1);

    // Force sleep at 100% tiredness
    if (updates.tiredness >= 100) {
      updates.alertness = 0;
    }
  }

  // Heal damage over time (very slowly)
  if (character.damage && character.damage.length > 0) {
    const damage = [...character.damage];
    for (const injury of damage) {
      injury.severity = Math.max(0, injury.severity - (secondsPassed / 3600) * 0.5);
    }
    // Remove healed injuries
    updates.damage = damage.filter(d => d.severity > 0);
  }

  await Character.update(characterId, updates);
}
