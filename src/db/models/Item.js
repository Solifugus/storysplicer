/**
 * Item model - represents objects in the world
 */

import { query } from '../index.js';

export class Item {
  /**
   * Create a new item
   * @param {Object} data - Item data
   * @returns {Promise<Object>} Created item
   */
  static async create({
    world_id,
    name,
    description = '',
    properties = {},
    current_area_id = null,
    held_by_character_id = null,
    held_location = null
  }) {
    const result = await query(
      `INSERT INTO items (world_id, name, description, properties, current_area_id, held_by_character_id, held_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [world_id, name, description, JSON.stringify(properties), current_area_id, held_by_character_id, held_location]
    );
    return result.rows[0];
  }

  /**
   * Find an item by ID
   * @param {number} id - Item ID
   * @returns {Promise<Object|null>} Item or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all items in a world
   * @param {number} world_id - World ID
   * @returns {Promise<Array>} Array of items
   */
  static async findByWorldId(world_id) {
    const result = await query(
      'SELECT * FROM items WHERE world_id = $1 ORDER BY id ASC',
      [world_id]
    );
    return result.rows;
  }

  /**
   * Find items in an area
   * @param {number} area_id - Area ID
   * @returns {Promise<Array>} Array of items
   */
  static async findByAreaId(area_id) {
    const result = await query(
      'SELECT * FROM items WHERE current_area_id = $1',
      [area_id]
    );
    return result.rows;
  }

  /**
   * Find items held by a character
   * @param {number} character_id - Character ID
   * @returns {Promise<Array>} Array of items
   */
  static async findByCharacterId(character_id) {
    const result = await query(
      'SELECT * FROM items WHERE held_by_character_id = $1 ORDER BY held_location',
      [character_id]
    );
    return result.rows;
  }

  /**
   * Update an item
   * @param {number} id - Item ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated item or null
   */
  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const simpleFields = ['name', 'description', 'current_area_id', 'held_by_character_id', 'held_location'];
    for (const field of simpleFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    }

    if (data.properties !== undefined) {
      updates.push(`properties = $${paramCount++}`);
      values.push(JSON.stringify(data.properties));
    }

    if (updates.length === 0) {
      return await Item.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE items SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete an item
   * @param {number} id - Item ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM items WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Move item to an area (drop it)
   * @param {number} id - Item ID
   * @param {number} area_id - Area ID
   * @returns {Promise<Object|null>} Updated item
   */
  static async moveToArea(id, area_id) {
    return await Item.update(id, {
      current_area_id: area_id,
      held_by_character_id: null,
      held_location: null
    });
  }

  /**
   * Give item to character
   * @param {number} id - Item ID
   * @param {number} character_id - Character ID
   * @param {string} location - Held location (e.g., 'right hand')
   * @returns {Promise<Object|null>} Updated item
   */
  static async giveToCharacter(id, character_id, location) {
    return await Item.update(id, {
      current_area_id: null,
      held_by_character_id: character_id,
      held_location: location
    });
  }
}
