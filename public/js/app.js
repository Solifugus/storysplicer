/**
 * Main Application Controller
 */

// Initialize
const mcpClient = new MCPClient();
const game = new Game(mcpClient);

// UI Elements
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');
const logoutBtn = document.getElementById('logout-btn');
const actionForm = document.getElementById('action-form');
const actionText = document.getElementById('action-text');
const connectionStatus = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');
const statusDot = connectionStatus.querySelector('.status-dot');

// Login handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const worldId = parseInt(document.getElementById('world-id').value);

  if (!username || !worldId) {
    showLoginError('Please enter character name and world ID');
    return;
  }

  showLoginStatus('Connecting to world...', 'info');

  try {
    // Connect to MCP server
    await mcpClient.connect('ws://localhost:3000');

    // Login
    await game.login(username, worldId);

    // Switch to game screen
    loginScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    showLoginStatus('');
  } catch (error) {
    console.error('Login failed:', error);
    showLoginError(error.message);
  }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
  await game.logout();
  mcpClient.disconnect();

  gameScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');

  // Reset form
  loginForm.reset();
  showLoginStatus('');
});

// Action submission
actionForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const action = actionText.value.trim();
  if (!action) return;

  // Clear input
  actionText.value = '';

  // Execute action
  await game.executeAction(action);
});

// Quick action buttons
document.querySelectorAll('.btn-quick').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    actionText.value = action;
    actionForm.dispatchEvent(new Event('submit'));
  });
});

// Game updates handler
window.addEventListener('game-update', (e) => {
  const { type, data } = e.detail;

  switch (type) {
    case 'character':
      updateCharacterDisplay(data);
      break;
    case 'area':
      updateAreaDisplay(data);
      break;
    case 'log':
      addLogMessage(data);
      break;
  }
});

// MCP connection handlers
mcpClient.on('connected', () => {
  statusDot.classList.add('connected');
  statusText.textContent = 'Connected';
});

mcpClient.on('disconnected', () => {
  statusDot.classList.remove('connected');
  statusText.textContent = 'Disconnected';
  addLogMessage({ message: 'Lost connection to server', type: 'error' });
});

mcpClient.on('reconnect-failed', () => {
  statusText.textContent = 'Connection failed';
  addLogMessage({ message: 'Failed to reconnect to server', type: 'error' });
});

/**
 * Update character display
 */
function updateCharacterDisplay(character) {
  // Update status bars
  updateStatusBar('nutrition', character.nutrition);
  updateStatusBar('hydration', character.hydration);
  updateStatusBar('alertness', character.alertness);
  updateStatusBar('tiredness', character.tiredness);

  // Update inventory
  updateInventoryDisplay(character.inventory || []);
}

/**
 * Update status bar
 */
function updateStatusBar(name, value) {
  const bar = document.getElementById(`${name}-bar`);
  const valueEl = document.getElementById(`${name}-value`);

  if (bar && valueEl) {
    const percentage = parseFloat(value);
    bar.style.width = `${percentage}%`;
    valueEl.textContent = `${percentage.toFixed(0)}%`;

    // Color based on value
    if (percentage < 30) {
      bar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
    } else if (percentage < 60) {
      bar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
    } else {
      bar.style.background = 'linear-gradient(90deg, var(--color-primary) 0%, #7c3aed 100%)';
    }
  }
}

/**
 * Update inventory display
 */
function updateInventoryDisplay(inventory) {
  const container = document.getElementById('inventory-items');

  if (inventory.length === 0) {
    container.innerHTML = '<p class="empty-state">No items</p>';
    return;
  }

  container.innerHTML = inventory.map(item => `
    <div class="inventory-item">
      <strong>${item.name}</strong>
      ${item.held_location ? `<span class="item-location">(${item.held_location})</span>` : ''}
    </div>
  `).join('');
}

/**
 * Update area display
 */
function updateAreaDisplay(area) {
  // Area name
  document.getElementById('area-name').textContent = area.name;

  // Area description
  document.getElementById('area-desc').textContent = area.description;

  // Temperature
  const tempEl = document.getElementById('area-temperature');
  if (area.temperature !== null && area.temperature !== undefined) {
    tempEl.textContent = `Temperature: ${parseFloat(area.temperature).toFixed(1)}°C`;
  } else {
    tempEl.textContent = '';
  }

  // Characters
  updateCharactersList(area.characters || []);

  // Items
  updateItemsList(area.items || []);

  // Update visual (placeholder)
  const visual = document.getElementById('area-visual');
  // Could generate or load area image here
}

/**
 * Update characters list
 */
function updateCharactersList(characters) {
  const container = document.getElementById('characters-list');

  if (characters.length === 0) {
    container.innerHTML = '<p class="empty-state">No other characters</p>';
    return;
  }

  container.innerHTML = characters.map(char => `
    <div class="entity-item">
      <strong>${char.name}</strong> - ${char.species}
      ${char.description ? `<p>${char.description}</p>` : ''}
    </div>
  `).join('');
}

/**
 * Update items list
 */
function updateItemsList(items) {
  const container = document.getElementById('items-list');

  if (items.length === 0) {
    container.innerHTML = '<p class="empty-state">No items</p>';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="entity-item">
      <strong>${item.name}</strong>
      ${item.description ? `<p>${item.description}</p>` : ''}
    </div>
  `).join('');
}

/**
 * Add log message
 */
function addLogMessage(data) {
  const container = document.getElementById('log-messages');
  const message = document.createElement('div');
  message.className = `log-message ${data.type || 'info'}`;

  const time = data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '';
  message.innerHTML = `
    ${time ? `<span class="log-time">${time}</span> ` : ''}
    ${data.message}
  `;

  container.prepend(message);

  // Keep only last 50 messages
  while (container.children.length > 50) {
    container.removeChild(container.lastChild);
  }
}

/**
 * Show login status
 */
function showLoginStatus(message, type = 'info') {
  loginStatus.textContent = message;
  loginStatus.className = `status-message ${type}`;
}

/**
 * Show login error
 */
function showLoginError(message) {
  showLoginStatus(message, 'error');
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
