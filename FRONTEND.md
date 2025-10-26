# StorySplicer Frontend (PWA)

Progressive Web App interface for StorySplicer world simulation.

## Features

- **Mobile-First Design**: Responsive layout optimized for phones and tablets
- **Real-Time Updates**: WebSocket connection to MCP server for live world state
- **Offline Capability**: Service worker caching for offline access
- **Player Controls**: Intuitive interface for movement, interaction, and inventory
- **Status Monitoring**: Real-time character health, nutrition, hydration display
- **Activity Log**: Scrolling feed of game events and actions

## Quick Start

### 1. Start the MCP Server

The frontend requires the MCP server to be running:

```bash
npm run mcp
```

This starts the WebSocket server on port 3000.

### 2. Start the Web Server

In a separate terminal:

```bash
npm run web
```

This serves the PWA on http://localhost:8080

### 3. Open in Browser

Navigate to http://localhost:8080 in your web browser.

### 4. Login

- Enter a character name that exists in your world
- Enter the world ID (default: 44 for test world)
- Click "Enter World"

## User Interface

### Login Screen
- **Character Name**: Name of the character you want to control
- **World ID**: ID of the world to join

### Game Screen

**Header**
- Current area name
- Logout button

**Area Display**
- Visual placeholder (expandable for area images)
- Area description
- Temperature and environment info

**Characters & Items**
- List of other characters in the area
- List of items you can interact with

**Character Status**
- Nutrition bar (food level)
- Hydration bar (water level)
- Alertness bar (awake/asleep)
- Tiredness bar (rest needed)
- Inventory display

**Activity Log**
- Scrolling feed of recent events
- Your actions and their results
- Other character actions you observe

**Action Input**
- Text input for commands
- Quick action buttons (Look, Wait, Inventory)

## Commands

### Movement
```
move north
move south
move east
move west
go north
```

### Speech
```
say hello everyone
speak I need help
```

### Items
```
pick up sword
take apple
get water bottle
drop sword
```

### Information
```
look
look around
inventory
inv
```

### Other
```
wait
```

## Technical Details

### Architecture

- **HTML/CSS/JavaScript**: Vanilla web technologies, no frameworks
- **WebSocket**: Real-time MCP communication
- **Service Worker**: Offline caching and PWA functionality
- **LocalStorage**: Session persistence (future)

### Files

```
public/
├── index.html           # Main HTML structure
├── manifest.json        # PWA manifest
├── service-worker.js    # Offline caching
├── css/
│   └── main.css        # All styles
├── js/
│   ├── mcp-client.js   # WebSocket MCP client
│   ├── game.js         # Game logic and state
│   └── app.js          # UI controller
└── images/
    └── icon.svg        # App icon
```

### MCP Integration

The frontend communicates with the MCP server using JSON-RPC 2.0 over WebSocket:

```javascript
// Example: Get character details
const result = await mcpClient.callTool('character_get', {
  character_id: 123
});
```

All MCP tools are accessible through the `MCPClient` class.

### State Management

Game state is managed by the `Game` class:
- Character state (health, position, inventory)
- Current area state (description, exits, characters, items)
- Periodic updates every 5 seconds
- Event-driven UI updates

## Installation as PWA

On mobile devices, you can install StorySplicer as an app:

**iOS (Safari)**
1. Tap the Share button
2. Tap "Add to Home Screen"
3. Tap "Add"

**Android (Chrome)**
1. Tap the menu (⋮)
2. Tap "Add to Home screen"
3. Tap "Add"

## Development

### Adding New Features

**New UI Elements**
1. Add HTML in `index.html`
2. Add styles in `css/main.css`
3. Add logic in `js/app.js`

**New Commands**
1. Update `executeAction()` in `js/game.js`
2. Add parsing logic for new command format

**New MCP Tools**
1. Call via `mcpClient.callTool(toolName, args)`
2. Handle results in game state

### Testing

Test on multiple devices and browsers:
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Android Chrome
- Tablet: iPad, Android tablets

### Debugging

**Console Logs**
- Open browser dev tools (F12)
- Check Console tab for errors
- Network tab shows WebSocket traffic

**Connection Issues**
- Verify MCP server is running on port 3000
- Check browser console for connection errors
- Look at connection status indicator (top right)

## Customization

### Theming

Colors are defined as CSS variables in `css/main.css`:

```css
:root {
  --color-bg: #1a1a1a;           /* Background */
  --color-surface: #2a2a2a;      /* Panels */
  --color-primary: #2563eb;      /* Accent */
  --color-text: #e5e5e5;         /* Text */
  /* ... more variables ... */
}
```

Change these to customize the app's appearance.

### Layout

The layout is mobile-first and responsive. Modify breakpoints in `css/main.css`:

```css
@media (min-width: 768px) {
  /* Tablet/desktop styles */
}
```

## Future Enhancements

- [ ] Area image generation/display
- [ ] Character avatar images
- [ ] Voice input for commands
- [ ] Haptic feedback on mobile
- [ ] Push notifications for events
- [ ] Multiplayer chat
- [ ] Map view
- [ ] Touch gestures for common actions
- [ ] Dark/light theme toggle
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)

## Troubleshooting

**"Failed to connect"**
- Ensure MCP server is running (`npm run mcp`)
- Check server is on port 3000
- Verify firewall isn't blocking connections

**"Character not found"**
- Verify character exists in the database
- Check world ID is correct
- Ensure character is in the specified world

**UI not updating**
- Check WebSocket connection status (top right indicator)
- Look for JavaScript errors in console
- Refresh the page

**Offline mode not working**
- Service worker requires HTTPS in production
- Check service worker registration in console
- Clear cache and reload

## Performance

- **Initial Load**: ~100KB (HTML, CSS, JS)
- **Cached**: Instant load when offline
- **WebSocket**: Minimal bandwidth, real-time updates
- **Memory**: <50MB typical usage
- **Battery**: Optimized for mobile devices

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## License

MIT
