/**
 * Character Context Window Builder
 *
 * Builds the context window for each character cycle, including:
 * 1. Identity (name, age, gender, species, description, backstory)
 * 2. Physical state (hydration, nutrition, tiredness, alertness, damage)
 * 3. Inventory (what's in hands and pockets)
 * 4. Current area (description, exits, items, other characters)
 * 5. Memory (recent actions/reactions)
 */

import { Character, Area, Item } from '../db/models/index.js';

/**
 * Build complete context window for a character
 * @param {number} characterId - Character ID
 * @returns {Promise<Object>} Context window object
 */
export async function buildContextWindow(characterId) {
  const character = await Character.findById(characterId);
  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }

  // Get current area details
  let areaContext = null;
  if (character.current_area_id) {
    areaContext = await buildAreaContext(character.current_area_id, characterId);
  }

  // Get inventory
  const inventory = await Character.getInventory(characterId);

  return {
    identity: buildIdentityContext(character),
    physicalState: buildPhysicalStateContext(character),
    inventory: buildInventoryContext(inventory),
    location: areaContext,
    memory: buildMemoryContext(character),
  };
}

/**
 * Build identity section of context
 * @param {Object} character - Character object
 * @returns {Object} Identity context
 */
function buildIdentityContext(character) {
  return {
    name: character.name,
    species: character.species,
    gender: character.gender || 'unspecified',
    age: character.age || 'unknown',
    description: character.description || 'No description available',
    backstory: character.backstory || 'No backstory available',
    interests: character.interests || [],
    likes: character.likes || [],
    dislikes: character.dislikes || [],
    beliefs: character.beliefs || [],
    internalConflict: character.internal_conflict || 'None',
  };
}

/**
 * Build physical state section of context
 * @param {Object} character - Character object
 * @returns {Object} Physical state context
 */
function buildPhysicalStateContext(character) {
  const state = {
    nutrition: parseFloat(character.nutrition),
    hydration: parseFloat(character.hydration),
    tiredness: parseFloat(character.tiredness),
    alertness: parseFloat(character.alertness),
    damage: character.damage || [],
  };

  // Add interpretations
  const notes = [];

  if (state.nutrition < 30) {
    notes.push('Very hungry');
  } else if (state.nutrition < 60) {
    notes.push('Somewhat hungry');
  }

  if (state.hydration < 30) {
    notes.push('Very thirsty');
  } else if (state.hydration < 60) {
    notes.push('Somewhat thirsty');
  }

  if (state.tiredness > 80) {
    notes.push('Extremely tired');
  } else if (state.tiredness > 60) {
    notes.push('Tired');
  }

  if (state.alertness < 20) {
    notes.push('Asleep or barely conscious');
  } else if (state.alertness < 50) {
    notes.push('Drowsy');
  }

  if (state.damage.length > 0) {
    notes.push(`Injured: ${state.damage.map(d => `${d.part} (${d.type}, ${d.severity}%)`).join(', ')}`);
  }

  state.notes = notes;
  return state;
}

/**
 * Build inventory section of context
 * @param {Array} items - Array of item objects
 * @returns {Object} Inventory context
 */
function buildInventoryContext(items) {
  const inventory = {
    'right hand': null,
    'left hand': null,
    pockets: [],
  };

  for (const item of items) {
    if (item.held_location === 'right hand') {
      inventory['right hand'] = {
        name: item.name,
        description: item.description,
      };
    } else if (item.held_location === 'left hand') {
      inventory['left hand'] = {
        name: item.name,
        description: item.description,
      };
    } else {
      inventory.pockets.push({
        location: item.held_location,
        name: item.name,
        description: item.description,
      });
    }
  }

  return inventory;
}

/**
 * Build area section of context
 * @param {number} areaId - Area ID
 * @param {number} excludeCharacterId - Character ID to exclude (self)
 * @returns {Promise<Object>} Area context
 */
async function buildAreaContext(areaId, excludeCharacterId) {
  const area = await Area.findById(areaId);
  if (!area) {
    return null;
  }

  // Get other characters in the area
  const characters = await Area.getCharacters(areaId);
  const otherCharacters = characters
    .filter(c => c.id !== excludeCharacterId)
    .map(c => ({
      name: c.name,
      species: c.species,
      description: c.description,
    }));

  // Get items in the area
  const items = await Area.getItems(areaId);
  const visibleItems = items.map(i => ({
    name: i.name,
    description: i.description,
  }));

  return {
    name: area.name,
    description: area.description,
    temperature: parseFloat(area.temperature),
    exits: area.exits || {},
    characters: otherCharacters,
    items: visibleItems,
  };
}

/**
 * Build memory section of context
 * @param {Object} character - Character object
 * @returns {Array} Memory entries
 */
function buildMemoryContext(character) {
  const memory = character.memory || [];

  // Return most recent entries
  // Minor characters: last 3, Story characters: last 5
  const limit = character.character_class === 'story' ? 5 : 3;

  return memory.slice(-limit);
}

/**
 * Format context window as a text prompt
 * @param {Object} context - Context window object
 * @returns {string} Formatted text prompt
 */
export function formatContextAsPrompt(context) {
  const parts = [];

  // Identity
  parts.push('## Your Identity');
  parts.push(`You are ${context.identity.name}, a ${context.identity.age}-year-old ${context.identity.gender} ${context.identity.species}.`);
  if (context.identity.description) {
    parts.push(`Description: ${context.identity.description}`);
  }
  if (context.identity.backstory) {
    parts.push(`Backstory: ${context.identity.backstory}`);
  }
  if (context.identity.interests.length > 0) {
    parts.push(`Interests: ${context.identity.interests.join(', ')}`);
  }
  if (context.identity.likes.length > 0) {
    parts.push(`You like: ${context.identity.likes.join(', ')}`);
  }
  if (context.identity.dislikes.length > 0) {
    parts.push(`You dislike: ${context.identity.dislikes.join(', ')}`);
  }
  if (context.identity.beliefs.length > 0) {
    parts.push(`Beliefs: ${context.identity.beliefs.join('; ')}`);
  }
  if (context.identity.internalConflict && context.identity.internalConflict !== 'None') {
    parts.push(`Internal conflict: ${context.identity.internalConflict}`);
  }

  // Physical State
  parts.push('\n## Your Physical State');
  parts.push(`Nutrition: ${context.physicalState.nutrition.toFixed(0)}%`);
  parts.push(`Hydration: ${context.physicalState.hydration.toFixed(0)}%`);
  parts.push(`Tiredness: ${context.physicalState.tiredness.toFixed(0)}%`);
  parts.push(`Alertness: ${context.physicalState.alertness.toFixed(0)}%`);
  if (context.physicalState.notes.length > 0) {
    parts.push(`Status: ${context.physicalState.notes.join(', ')}`);
  }

  // Inventory
  parts.push('\n## Your Inventory');
  if (context.inventory['right hand']) {
    parts.push(`Right hand: ${context.inventory['right hand'].name}`);
  } else {
    parts.push('Right hand: empty');
  }
  if (context.inventory['left hand']) {
    parts.push(`Left hand: ${context.inventory['left hand'].name}`);
  } else {
    parts.push('Left hand: empty');
  }
  if (context.inventory.pockets.length > 0) {
    parts.push(`Pockets: ${context.inventory.pockets.map(p => p.name).join(', ')}`);
  } else {
    parts.push('Pockets: empty');
  }

  // Location
  if (context.location) {
    parts.push('\n## Current Location');
    parts.push(`You are in: ${context.location.name}`);
    parts.push(context.location.description);
    parts.push(`Temperature: ${context.location.temperature.toFixed(1)}°C`);

    if (Object.keys(context.location.exits).length > 0) {
      const exitList = Object.entries(context.location.exits)
        .map(([dir, id]) => `${dir} (to area ${id})`)
        .join(', ');
      parts.push(`Exits: ${exitList}`);
    } else {
      parts.push('No visible exits');
    }

    if (context.location.characters.length > 0) {
      parts.push('\nOther characters here:');
      for (const char of context.location.characters) {
        parts.push(`- ${char.name} (${char.species}): ${char.description}`);
      }
    }

    if (context.location.items.length > 0) {
      parts.push('\nItems here:');
      for (const item of context.location.items) {
        parts.push(`- ${item.name}: ${item.description}`);
      }
    }
  } else {
    parts.push('\n## Current Location');
    parts.push('You are not currently in any specific location.');
  }

  // Memory
  if (context.memory.length > 0) {
    parts.push('\n## Recent Events');
    for (const entry of context.memory) {
      parts.push(`- ${entry.action} → ${entry.result}`);
    }
  }

  // Add instruction footer
  parts.push('\n---');
  parts.push('Based on the above information, output a single JSON action object (NO other text):');

  return parts.join('\n');
}

/**
 * Get system prompt for character behavior
 * @param {string} characterClass - 'minor' or 'story'
 * @returns {string} System prompt
 */
export function getSystemPrompt(characterClass) {
  const basePrompt = `You are an autonomous character in a living world simulation. You must respond ONLY with valid JSON.

Available actions (pick ONE):
- {"action": "move", "direction": "north/south/east/west"}
- {"action": "speak", "text": "what you want to say"}
- {"action": "pickup", "item": "item name"}
- {"action": "drop", "item": "item name"}
- {"action": "wait"}
- {"action": "sleep"}

CRITICAL RULES:
1. OUTPUT ONLY JSON - NO explanations, NO narrative text, NO greeting
2. Choose ONE action based on your character's needs and personality
3. Format: {"action": "...", ...other fields...}

Example outputs:
{"action": "wait"}
{"action": "speak", "text": "Hello, friend!"}
{"action": "move", "direction": "north"}`;

  if (characterClass === 'story') {
    return basePrompt + '\n\nYou are a story character - drive narrative forward with your actions.';
  } else {
    return basePrompt + '\n\nYou are a minor character - live your life naturally.';
  }
}
