/**
 * Simple authentication and session management for players
 *
 * This is a basic implementation. In production, you would want:
 * - Proper password hashing (bcrypt)
 * - JWT tokens or session cookies
 * - Database-backed session storage
 * - Rate limiting
 */

import { Character } from '../../db/models/index.js';

// In-memory session storage (would use Redis or database in production)
const sessions = new Map();

/**
 * Create a new player session
 * @param {string} playerId - Unique player identifier
 * @param {number} characterId - Character the player controls
 * @returns {string} Session token
 */
export function createSession(playerId, characterId) {
  const sessionToken = generateSessionToken();

  sessions.set(sessionToken, {
    playerId,
    characterId,
    createdAt: new Date(),
    lastActivity: new Date(),
  });

  return sessionToken;
}

/**
 * Validate a session token
 * @param {string} token - Session token
 * @returns {Object|null} Session data or null if invalid
 */
export function validateSession(token) {
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  // Update last activity
  session.lastActivity = new Date();

  // Check for session expiry (24 hours)
  const age = Date.now() - session.createdAt.getTime();
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  if (age > MAX_AGE) {
    sessions.delete(token);
    return null;
  }

  return session;
}

/**
 * End a session
 * @param {string} token - Session token
 */
export function endSession(token) {
  sessions.delete(token);
}

/**
 * Claim a character for a player
 * @param {string} playerId - Player identifier
 * @param {number} characterId - Character to claim
 * @returns {Promise<string>} Session token
 */
export async function claimCharacter(playerId, characterId) {
  const character = await Character.findById(characterId);

  if (!character) {
    throw new Error('Character not found');
  }

  if (character.owner_id && character.owner_id !== playerId) {
    throw new Error('Character is already claimed by another player');
  }

  // Assign character to player
  await Character.update(characterId, {
    owner_id: playerId,
  });

  // Create session
  return createSession(playerId, characterId);
}

/**
 * Release a character from player control
 * @param {number} characterId - Character to release
 */
export async function releaseCharacter(characterId) {
  await Character.update(characterId, {
    owner_id: null,
  });

  // End all sessions for this character
  for (const [token, session] of sessions.entries()) {
    if (session.characterId === characterId) {
      sessions.delete(token);
    }
  }
}

/**
 * Check if a player can control a character
 * @param {string} playerId - Player identifier
 * @param {number} characterId - Character ID
 * @returns {Promise<boolean>} Whether player can control character
 */
export async function canControlCharacter(playerId, characterId) {
  const character = await Character.findById(characterId);

  if (!character) {
    return false;
  }

  // Character must be owned by this player
  return character.owner_id === playerId;
}

/**
 * Generate a random session token
 * @returns {string} Session token
 */
function generateSessionToken() {
  // Simple token generation (use crypto.randomBytes in production)
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Clean up expired sessions (call periodically)
 */
export function cleanupSessions() {
  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  for (const [token, session] of sessions.entries()) {
    const age = now - session.createdAt.getTime();
    if (age > MAX_AGE) {
      sessions.delete(token);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);
