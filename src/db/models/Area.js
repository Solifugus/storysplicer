/**
 * Area model - represents locations in the world
 */

import { query } from '../index.js';

export class Area {
  /**
   * Create a new area
   * @param {Object} data - Area data
   * @returns {Promise<Object>} Created area
   */
  static async create({ world_id, name, description, temperature = 20.0, exits = {}, triggers = [] }) {
    const result = await query(
      `INSERT INTO areas (world_id, name, description, temperature, exits, triggers)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [world_id, name, description, temperature, JSON.stringify(exits), JSON.stringify(triggers)]
    );
    return result.rows[0];
  }

  /**
   * Find an area by ID
   * @param {number} id - Area ID
   * @returns {Promise<Object|null>} Area or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM areas WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all areas in a world
   * @param {number} world_id - World ID
   * @returns {Promise<Array>} Array of areas
   */
  static async findByWorldId(world_id) {
    const result = await query(
      'SELECT * FROM areas WHERE world_id = $1 ORDER BY id ASC',
      [world_id]
    );
    return result.rows;
  }

  /**
   * Update an area
   * @param {number} id - Area ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated area or null
   */
  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'description', 'temperature'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    }

    // Handle JSON fields separately
    if (data.exits !== undefined) {
      updates.push(`exits = $${paramCount++}`);
      values.push(JSON.stringify(data.exits));
    }
    if (data.triggers !== undefined) {
      updates.push(`triggers = $${paramCount++}`);
      values.push(JSON.stringify(data.triggers));
    }

    if (updates.length === 0) {
      return await Area.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE areas SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete an area
   * @param {number} id - Area ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM areas WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Get all characters in an area
   * @param {number} area_id - Area ID
   * @returns {Promise<Array>} Array of characters
   */
  static async getCharacters(area_id) {
    const result = await query(
      'SELECT * FROM characters WHERE current_area_id = $1',
      [area_id]
    );
    return result.rows;
  }

  /**
   * Get all items in an area
   * @param {number} area_id - Area ID
   * @returns {Promise<Array>} Array of items
   */
  static async getItems(area_id) {
    const result = await query(
      'SELECT * FROM items WHERE current_area_id = $1',
      [area_id]
    );
    return result.rows;
  }
}
