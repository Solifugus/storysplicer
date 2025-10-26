/**
 * WritingStyle model - defines narrative style for world/series
 */

import { query } from '../index.js';

export class WritingStyle {
  /**
   * Create a new writing style
   * @param {Object} data - Writing style data
   * @returns {Promise<Object>} Created writing style
   */
  static async create(data) {
    const {
      world_id,
      tone = 'reflective',
      narrative_voice = 'third-person limited',
      tense = 'past',
      sentence_complexity = 'medium',
      dialogue_style = 'naturalistic',
      theme_keywords = [],
      conflict_density = 'moderate',
      pacing_model = 'rising',
      moral_ambiguity = 'balanced',
      descriptive_depth = 'moderate',
      emotional_realism = 'high',
      language_register = 'neutral-to-technical',
      prose_format_rules = []
    } = data;

    const result = await query(
      `INSERT INTO writing_styles (
        world_id, tone, narrative_voice, tense, sentence_complexity,
        dialogue_style, theme_keywords, conflict_density, pacing_model,
        moral_ambiguity, descriptive_depth, emotional_realism,
        language_register, prose_format_rules
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        world_id, tone, narrative_voice, tense, sentence_complexity,
        dialogue_style, theme_keywords, conflict_density, pacing_model,
        moral_ambiguity, descriptive_depth, emotional_realism,
        language_register, prose_format_rules
      ]
    );

    return result.rows[0];
  }

  /**
   * Find a writing style by ID
   * @param {number} id - Writing style ID
   * @returns {Promise<Object|null>} Writing style or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM writing_styles WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find writing style by world ID
   * @param {number} world_id - World ID
   * @returns {Promise<Object|null>} Writing style or null
   */
  static async findByWorldId(world_id) {
    const result = await query(
      'SELECT * FROM writing_styles WHERE world_id = $1 LIMIT 1',
      [world_id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update a writing style
   * @param {number} id - Writing style ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated writing style or null
   */
  static async update(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const simpleFields = [
      'tone', 'narrative_voice', 'tense', 'sentence_complexity',
      'dialogue_style', 'conflict_density', 'pacing_model',
      'moral_ambiguity', 'descriptive_depth', 'emotional_realism',
      'language_register'
    ];

    for (const field of simpleFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    }

    // Array fields
    const arrayFields = ['theme_keywords', 'prose_format_rules'];
    for (const field of arrayFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return await WritingStyle.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE writing_styles SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a writing style
   * @param {number} id - Writing style ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    const result = await query(
      'DELETE FROM writing_styles WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}
