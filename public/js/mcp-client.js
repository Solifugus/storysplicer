/**
 * MCP WebSocket Client
 * Handles communication with the StorySplicer MCP server
 */

class MCPClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to MCP server
   * @param {string} url - WebSocket URL (default: ws://localhost:3000)
   */
  connect(url = 'ws://localhost:3000') {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('MCP: Connected to server');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('MCP: Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('MCP: WebSocket error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = () => {
          console.log('MCP: Disconnected from server');
          this.connected = false;
          this.emit('disconnected');
          this.attemptReconnect(url);
        };

        // Timeout for connection
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to server
   */
  attemptReconnect(url) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('MCP: Max reconnection attempts reached');
      this.emit('reconnect-failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`MCP: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(url).catch(err => {
        console.error('MCP: Reconnection failed:', err);
      });
    }, delay);
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    // Handle responses to requests
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'Request failed'));
      } else {
        resolve(message.result);
      }
    }

    // Handle notifications/events
    if (message.method) {
      this.emit(message.method, message.params);
    }
  }

  /**
   * Send MCP request
   * @param {string} method - MCP method name
   * @param {object} params - Method parameters
   * @returns {Promise} - Resolves with result
   */
  request(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      const id = ++this.requestId;
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });

      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Call MCP tool
   * @param {string} toolName - Tool name
   * @param {object} args - Tool arguments
   * @returns {Promise} - Tool result
   */
  async callTool(toolName, args = {}) {
    const result = await this.request('tools/call', {
      name: toolName,
      arguments: args
    });
    return result;
  }

  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {function} handler - Handler function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`MCP: Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}
