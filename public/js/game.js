/**
 * Game Logic and State Management
 */

class Game {
  constructor(mcpClient) {
    this.mcp = mcpClient;
    this.character = null;
    this.currentArea = null;
    this.sessionToken = null;
    this.updateInterval = null;
  }

  /**
   * Authenticate and claim character
   * @param {string} characterName - Character name to claim
   * @param {number} worldId - World ID
   */
  async login(characterName, worldId) {
    try {
      // Find character by name in world
      const characters = await this.mcp.callTool('character_list_awake', { world_id: worldId });

      const character = characters.content.find(c =>
        c.name.toLowerCase() === characterName.toLowerCase()
      );

      if (!character) {
        throw new Error(`Character "${characterName}" not found in world ${worldId}`);
      }

      // Claim character
      const result = await this.mcp.callTool('player_claim_character', {
        character_id: character.id
      });

      this.character = character;
      this.sessionToken = result.content.session_token;

      // Load character details
      await this.loadCharacter();

      // Load current area
      if (this.character.current_area_id) {
        await this.loadArea(this.character.current_area_id);
      }

      // Start update loop
      this.startUpdateLoop();

      return { success: true, character: this.character };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Load character details
   */
  async loadCharacter() {
    try {
      const result = await this.mcp.callTool('character_get', {
        character_id: this.character.id
      });

      this.character = result.content;
      this.emitUpdate('character', this.character);
    } catch (error) {
      console.error('Failed to load character:', error);
    }
  }

  /**
   * Load area details
   */
  async loadArea(areaId) {
    try {
      const result = await this.mcp.callTool('area_get', { area_id: areaId });
      this.currentArea = result.content;

      // Load characters in area
      const charactersResult = await this.mcp.callTool('area_get_characters', { area_id: areaId });
      this.currentArea.characters = charactersResult.content.filter(c => c.id !== this.character.id);

      // Load items in area
      const itemsResult = await this.mcp.callTool('area_get_items', { area_id: areaId });
      this.currentArea.items = itemsResult.content;

      this.emitUpdate('area', this.currentArea);
    } catch (error) {
      console.error('Failed to load area:', error);
    }
  }

  /**
   * Move character to new area
   */
  async move(direction) {
    try {
      if (!this.currentArea || !this.currentArea.exits) {
        throw new Error('No exits available');
      }

      const targetAreaId = this.currentArea.exits[direction.toLowerCase()];
      if (!targetAreaId) {
        throw new Error(`No exit in direction: ${direction}`);
      }

      await this.mcp.callTool('character_move', {
        character_id: this.character.id,
        area_id: targetAreaId
      });

      this.addLog(`You move ${direction}`);
      await this.loadArea(targetAreaId);
      await this.loadCharacter();
    } catch (error) {
      this.addLog(`Cannot move ${direction}: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Character speaks
   */
  async speak(text) {
    try {
      await this.mcp.callTool('character_speak', {
        character_id: this.character.id,
        text,
        action_type: 'speech'
      });

      this.addLog(`You say: "${text}"`);
      await this.loadCharacter();
    } catch (error) {
      this.addLog(`Failed to speak: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Pick up item
   */
  async pickup(itemName, location = 'right hand') {
    try {
      const item = this.currentArea.items.find(i =>
        i.name.toLowerCase().includes(itemName.toLowerCase())
      );

      if (!item) {
        throw new Error(`Item not found: ${itemName}`);
      }

      await this.mcp.callTool('item_pickup', {
        character_id: this.character.id,
        item_id: item.id,
        location
      });

      this.addLog(`You pick up ${item.name}`);
      await this.loadArea(this.currentArea.id);
      await this.loadCharacter();
    } catch (error) {
      this.addLog(`Failed to pick up: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Drop item
   */
  async drop(itemName) {
    try {
      // Get inventory
      const inventoryResult = await this.mcp.callTool('character_get_inventory', {
        character_id: this.character.id
      });

      const item = inventoryResult.content.find(i =>
        i.name.toLowerCase().includes(itemName.toLowerCase())
      );

      if (!item) {
        throw new Error(`You're not holding: ${itemName}`);
      }

      await this.mcp.callTool('item_drop', {
        character_id: this.character.id,
        item_id: item.id
      });

      this.addLog(`You drop ${item.name}`);
      await this.loadArea(this.currentArea.id);
      await this.loadCharacter();
    } catch (error) {
      this.addLog(`Failed to drop: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Get character inventory
   */
  async getInventory() {
    try {
      const result = await this.mcp.callTool('character_get_inventory', {
        character_id: this.character.id
      });

      return result.content;
    } catch (error) {
      console.error('Failed to get inventory:', error);
      return [];
    }
  }

  /**
   * Parse and execute player action
   */
  async executeAction(actionText) {
    const text = actionText.trim().toLowerCase();

    try {
      // Move commands
      if (text.startsWith('move ') || text.startsWith('go ')) {
        const direction = text.split(' ')[1];
        await this.move(direction);
        return;
      }

      // Speak commands
      if (text.startsWith('say ') || text.startsWith('speak ')) {
        const speech = actionText.substring(actionText.indexOf(' ') + 1);
        await this.speak(speech);
        return;
      }

      // Look command
      if (text === 'look' || text === 'look around') {
        await this.loadArea(this.currentArea.id);
        this.addLog('You look around carefully.');
        return;
      }

      // Inventory command
      if (text === 'inventory' || text === 'inv') {
        const inventory = await this.getInventory();
        if (inventory.length === 0) {
          this.addLog('Your inventory is empty.', 'system');
        } else {
          this.addLog(`You have: ${inventory.map(i => i.name).join(', ')}`, 'system');
        }
        return;
      }

      // Pickup commands
      if (text.startsWith('pick up ') || text.startsWith('take ') || text.startsWith('get ')) {
        const parts = text.split(' ');
        const itemName = parts.slice(parts[0] === 'pick' ? 2 : 1).join(' ');
        await this.pickup(itemName);
        return;
      }

      // Drop commands
      if (text.startsWith('drop ')) {
        const itemName = text.substring(5);
        await this.drop(itemName);
        return;
      }

      // Wait command
      if (text === 'wait') {
        this.addLog('You wait a moment.');
        return;
      }

      // Default: treat as speech
      await this.speak(actionText);
    } catch (error) {
      console.error('Action failed:', error);
      this.addLog(error.message, 'error');
    }
  }

  /**
   * Start periodic updates
   */
  startUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update every 5 seconds
    this.updateInterval = setInterval(async () => {
      if (this.character && this.currentArea) {
        await this.loadCharacter();
        await this.loadArea(this.currentArea.id);
      }
    }, 5000);
  }

  /**
   * Stop update loop
   */
  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Release character and logout
   */
  async logout() {
    try {
      this.stopUpdateLoop();

      if (this.sessionToken) {
        await this.mcp.callTool('player_release_character', {
          session_token: this.sessionToken
        });
      }

      this.character = null;
      this.currentArea = null;
      this.sessionToken = null;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Add log message
   */
  addLog(message, type = 'info') {
    this.emitUpdate('log', { message, type, timestamp: new Date() });
  }

  /**
   * Emit update event
   */
  emitUpdate(type, data) {
    const event = new CustomEvent('game-update', {
      detail: { type, data }
    });
    window.dispatchEvent(event);
  }
}
