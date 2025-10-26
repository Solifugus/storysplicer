/**
 * World model - represents a world simulation
 */

import { query } from '../index.js';

export class World {
  /**
   * Create a new world
   * @param {Object} data - World data
   * @returns {Promise<Object>} Created world
   */
  static async create({ name, description }) {
    const result = await query(
      `INSERT INTO worlds (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description]
    );
    return result.rows[0];
  }

  /**
   * Find a world by ID
   * @param {number} id - World ID
   * @returns {Promise<Object|null>} World or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM worlds WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all worlds
   * @returns {Promise<Array>} Array of worlds
   */
  static async findAll() {
    const result = await query('SELECT * FROM worlds ORDER BY id ASC');
    return result.rows;
  }

  /**
   * Update a world
   * @param {number} id - World ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated world or null
   */
  static async update(id, { name, description }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return await World.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE worlds SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a world
   * @param {number} id - World ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM worlds WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}
