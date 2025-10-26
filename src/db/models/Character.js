/**
 * Character model - represents autonomous agents in the world
 */

import { query } from '../index.js';

export class Character {
  /**
   * Create a new character
   * @param {Object} data - Character data
   * @returns {Promise<Object>} Created character
   */
  static async create(data) {
    const {
      world_id,
      name,
      description = '',
      species,
      gender,
      age,
      backstory = '',
      memory = [],
      likes = [],
      dislikes = [],
      interests = [],
      internal_conflict = '',
      beliefs = [],
      nutrition = 100.0,
      hydration = 100.0,
      damage = [],
      tiredness = 0.0,
      alertness = 100.0,
      current_area_id,
      owner_id = null,
      character_class = 'minor'
    } = data;

    const result = await query(
      `INSERT INTO characters (
        world_id, name, description, species, gender, age, backstory,
        memory, likes, dislikes, interests, internal_conflict, beliefs,
        nutrition, hydration, damage, tiredness, alertness,
        current_area_id, owner_id, character_class
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        world_id, name, description, species, gender, age, backstory,
        JSON.stringify(memory), likes, dislikes, interests, internal_conflict, beliefs,
        nutrition, hydration, JSON.stringify(damage), tiredness, alertness,
        current_area_id, owner_id, character_class
      ]
    );

    return result.rows[0];
  }

  /**
   * Find a character by ID
   * @param {number} id - Character ID
   * @returns {Promise<Object|null>} Character or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM characters WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all characters in a world
   * @param {number} world_id - World ID
   * @returns {Promise<Array>} Array of characters
   */
  static async findByWorldId(world_id) {
    const result = await query(
      'SELECT * FROM characters WHERE world_id = $1 ORDER BY id ASC',
      [world_id]
    );
    return result.rows;
  }

  /**
   * Find characters by area
   * @param {number} area_id - Area ID
   * @returns {Promise<Array>} Array of characters
   */
  static async findByAreaId(area_id) {
    const result = await query(
      'SELECT * FROM characters WHERE current_area_id = $1',
      [area_id]
    );
    return result.rows;
  }

  /**
   * Find awake characters (alertness >= 20%)
   * @param {number} world_id - World ID
   * @returns {Promise<Array>} Array of awake characters
   */
  static async findAwake(world_id) {
    const result = await query(
      'SELECT * FROM characters WHERE world_id = $1 AND alertness >= 20 ORDER BY character_class DESC, id ASC',
      [world_id]
    );
    return result.rows;
  }

  /**
   * Find characters available for AI control (not player-owned and awake)
   * @param {number} world_id - World ID
   * @returns {Promise<Array>} Array of AI-controllable characters
   */
  static async findAIControllable(world_id) {
    const result = await query(
      `SELECT * FROM characters
       WHERE world_id = $1
       AND owner_id IS NULL
       AND alertness >= 20
       ORDER BY character_class DESC, id ASC`,
      [world_id]
    );
    return result.rows;
  }

  /**
   * Update a character
   * @param {number} id - Character ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated character or null
   */
  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Simple fields
    const simpleFields = [
      'name', 'description', 'species', 'gender', 'age', 'backstory',
      'internal_conflict', 'nutrition', 'hydration', 'tiredness', 'alertness',
      'current_area_id', 'owner_id', 'character_class'
    ];

    for (const field of simpleFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    }

    // Array fields
    const arrayFields = ['likes', 'dislikes', 'interests', 'beliefs'];
    for (const field of arrayFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    }

    // JSON fields
    const jsonFields = ['memory', 'damage'];
    for (const field of jsonFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(JSON.stringify(data[field]));
      }
    }

    if (updates.length === 0) {
      return await Character.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE characters SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a character
   * @param {number} id - Character ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM characters WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Add a memory entry to character
   * @param {number} id - Character ID
   * @param {Object} memoryEntry - Memory entry to add
   * @param {number} maxRecent - Max recent memories (3 for minor, 5 for story)
   * @returns {Promise<Object|null>} Updated character
   */
  static async addMemory(id, memoryEntry, maxRecent = 5) {
    const character = await Character.findById(id);
    if (!character) return null;

    const memory = character.memory || [];
    memory.push({
      ...memoryEntry,
      timestamp: new Date().toISOString()
    });

    // Keep only recent memories, summarize older ones
    // This is simplified - actual implementation should summarize before truncating
    if (memory.length > maxRecent) {
      memory.shift(); // Remove oldest
    }

    return await Character.update(id, { memory });
  }

  /**
   * Get character's inventory items
   * @param {number} id - Character ID
   * @returns {Promise<Array>} Array of items
   */
  static async getInventory(id) {
    const result = await query(
      'SELECT * FROM items WHERE held_by_character_id = $1',
      [id]
    );
    return result.rows;
  }
}
