/**
 * Area trigger system
 *
 * Triggers allow areas to react to events like:
 * - Character enters area
 * - Item picked up/dropped
 * - Time-based triggers
 * - Character speech with keywords
 *
 * Reactions can:
 * - Add/remove items
 * - Add/remove exits
 * - Modify area description
 * - Modify temperature
 */

import { Area, Item } from '../../db/models/index.js';

/**
 * Execute triggers for an area based on an event
 * @param {number} areaId - Area ID
 * @param {string} eventType - Type of event (character_enters, item_picked_up, etc.)
 * @param {Object} eventData - Event-specific data
 */
export async function executeTriggers(areaId, eventType, eventData = {}) {
  const area = await Area.findById(areaId);
  if (!area || !area.triggers || area.triggers.length === 0) {
    return;
  }

  const triggers = area.triggers;
  const matchedTriggers = [];

  // Find triggers that match this event
  for (const trigger of triggers) {
    if (shouldTriggerFire(trigger, eventType, eventData)) {
      matchedTriggers.push(trigger);
    }
  }

  // Execute reactions for matched triggers
  for (const trigger of matchedTriggers) {
    await executeReactions(areaId, trigger.reactions, eventData);

    // If trigger is one-time, remove it
    if (trigger.one_time) {
      const updatedTriggers = triggers.filter(t => t !== trigger);
      await Area.update(areaId, { triggers: updatedTriggers });
    }
  }
}

/**
 * Check if a trigger should fire based on event
 * @param {Object} trigger - Trigger configuration
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data
 * @returns {boolean} Whether trigger should fire
 */
function shouldTriggerFire(trigger, eventType, eventData) {
  const condition = trigger.condition;

  // Simple condition type matching
  if (typeof condition === 'string') {
    return condition === eventType;
  }

  // Complex condition object
  if (typeof condition === 'object') {
    // Check event type
    if (condition.type && condition.type !== eventType) {
      return false;
    }

    // Check for keyword matching in speech
    if (eventType === 'character_speech' && condition.keywords) {
      const text = (eventData.text || '').toLowerCase();
      const keywords = Array.isArray(condition.keywords)
        ? condition.keywords
        : [condition.keywords];

      return keywords.some(keyword => text.includes(keyword.toLowerCase()));
    }

    // Check for specific character
    if (condition.character_id && condition.character_id !== eventData.character_id) {
      return false;
    }

    // Check for specific item
    if (condition.item_id && condition.item_id !== eventData.item_id) {
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Execute reactions for a triggered event
 * @param {number} areaId - Area ID
 * @param {Array} reactions - Array of reaction objects
 * @param {Object} eventData - Event data for context
 */
async function executeReactions(areaId, reactions, eventData) {
  if (!reactions || reactions.length === 0) {
    return;
  }

  const area = await Area.findById(areaId);
  const updates = {};

  for (const reaction of reactions) {
    switch (reaction.type) {
      case 'add_item': {
        // Create a new item in this area
        if (reaction.item) {
          await Item.create({
            world_id: area.world_id,
            name: reaction.item.name,
            description: reaction.item.description || '',
            properties: reaction.item.properties || {},
            current_area_id: areaId,
          });
        }
        break;
      }

      case 'remove_item': {
        // Remove item from area
        if (reaction.item_id) {
          await Item.delete(reaction.item_id);
        }
        break;
      }

      case 'add_exit': {
        // Add a new exit
        if (reaction.direction && reaction.target_area_id) {
          const exits = { ...area.exits };
          exits[reaction.direction] = reaction.target_area_id;
          updates.exits = exits;
        }
        break;
      }

      case 'remove_exit': {
        // Remove an exit
        if (reaction.direction) {
          const exits = { ...area.exits };
          delete exits[reaction.direction];
          updates.exits = exits;
        }
        break;
      }

      case 'modify_description': {
        // Change area description
        if (reaction.new_description) {
          updates.description = reaction.new_description;
        } else if (reaction.append_description) {
          updates.description = area.description + '\n' + reaction.append_description;
        }
        break;
      }

      case 'modify_temperature': {
        // Change temperature
        if (reaction.temperature !== undefined) {
          updates.temperature = reaction.temperature;
        } else if (reaction.temperature_delta !== undefined) {
          updates.temperature = parseFloat(area.temperature) + reaction.temperature_delta;
        }
        break;
      }

      default:
        console.warn(`Unknown reaction type: ${reaction.type}`);
    }
  }

  // Apply any accumulated updates to the area
  if (Object.keys(updates).length > 0) {
    await Area.update(areaId, updates);
  }
}

/**
 * Create a simple trigger configuration
 * @param {string|Object} condition - Trigger condition
 * @param {Array} reactions - Array of reactions
 * @param {boolean} oneTime - Whether trigger fires only once
 * @returns {Object} Trigger configuration
 */
export function createTrigger(condition, reactions, oneTime = false) {
  return {
    condition,
    reactions,
    one_time: oneTime,
  };
}

/**
 * Example trigger configurations
 */
export const TRIGGER_EXAMPLES = {
  // Add item when character enters
  addItemOnEnter: createTrigger(
    'character_enters',
    [
      {
        type: 'add_item',
        item: {
          name: 'Mysterious Key',
          description: 'A old brass key',
          properties: { weight: 0.1 },
        },
      },
    ],
    true // one-time only
  ),

  // Open secret door when keyword spoken
  secretDoorKeyword: createTrigger(
    {
      type: 'character_speech',
      keywords: ['open sesame', 'reveal'],
    },
    [
      {
        type: 'add_exit',
        direction: 'secret',
        target_area_id: 42,
      },
      {
        type: 'append_description',
        append_description: '\nA secret passage has opened in the wall!',
      },
    ],
    true
  ),

  // Temperature drops when item picked up
  temperatureDropOnPickup: createTrigger(
    'item_picked_up',
    [
      {
        type: 'modify_temperature',
        temperature_delta: -5.0,
      },
    ]
  ),
};
