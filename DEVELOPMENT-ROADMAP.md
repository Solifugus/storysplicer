# StorySplicer Development Roadmap

This document breaks down the StorySplicer implementation into manageable phases with clear checklists.

---

## Phase 1: Foundation & Database Layer
**Goal**: Establish project structure, database schema, and core data models

### Checklist
- [ ] Set up Node.js project structure with package.json
- [ ] Configure PostgreSQL connection
- [ ] Create database schema for:
  - [ ] Worlds table
  - [ ] Areas table (with triggers support)
  - [ ] Characters table (all attributes from design)
  - [ ] Items table
  - [ ] Writing styles table
- [ ] Implement database migration system
- [ ] Create basic CRUD functions for each entity
- [ ] Write unit tests for database layer
- [ ] Document database schema and relationships

---

## Phase 2: MCP Server Core
**Goal**: Build the Model Context Protocol server that controls all world state and actions

### Checklist
- [ ] Set up MCP server architecture
- [ ] Implement WebSocket handler for client connections
- [ ] Create MCP tools for world queries:
  - [ ] Get area details
  - [ ] Get character details
  - [ ] Get items in area
  - [ ] Get characters in area
- [ ] Create MCP tools for world actions:
  - [ ] Move character between areas
  - [ ] Pick up/drop items
  - [ ] Character speech/actions
  - [ ] Modify character state (nutrition, hydration, etc.)
- [ ] Implement area trigger system
- [ ] Add connection/authentication for player sessions
- [ ] Write integration tests for MCP tools
- [ ] Document MCP API

---

## Phase 3: Character Agent Controller
**Goal**: Implement the cycle-based character processing system

### Checklist
- [ ] Design agent controller architecture
- [ ] Implement cycle timer (configurable interval)
- [ ] Create character context window builder:
  - [ ] Identity section
  - [ ] Physical state section
  - [ ] Inventory section
  - [ ] Area context section
  - [ ] Memory section
- [ ] Integrate small LLM (3B) for minor characters
- [ ] Integrate larger LLM for story characters
- [ ] Implement LLM response parser (actions to MCP calls)
- [ ] Add sleep/wake cycle logic (tiredness/alertness)
- [ ] Implement memory management:
  - [ ] Recent memory storage (3/5 items)
  - [ ] Memory summarization
  - [ ] Backstory elevation for major events
- [ ] Create character action validation
- [ ] Write tests for agent controller
- [ ] Add performance monitoring and logging

---

## Phase 4: Basic Frontend (PWA)
**Goal**: Create minimal viable player interface

### Checklist
- [ ] Set up PWA structure (manifest, service worker)
- [ ] Create HTML/CSS layout:
  - [ ] Area image display
  - [ ] Area description panel
  - [ ] Character status panel
  - [ ] Action input field
  - [ ] Chat/activity log
- [ ] Implement WebSocket MCP client
- [ ] Add player authentication flow
- [ ] Implement real-time area updates
- [ ] Display other characters in area
- [ ] Show items in area
- [ ] Handle player input submission
- [ ] Add offline capability
- [ ] Test on mobile devices
- [ ] Create basic UI documentation

---

## Phase 5: Narrator Agent
**Goal**: Implement the special orchestrator agent for story generation

### Checklist
- [ ] Design narrator agent architecture
- [ ] Implement writing style configuration loader
- [ ] Create series/book/chapter markdown parser
- [ ] Build narrator context window (broader than character agents)
- [ ] Implement character control takeover logic
- [ ] Add plot tracking and goal-oriented behavior
- [ ] Implement world expansion capabilities:
  - [ ] Generate new areas on demand
  - [ ] Create new minor characters
  - [ ] Add items as needed
- [ ] Create chapter text collection system
- [ ] Implement relevance filtering for final narration
- [ ] Add revision/polishing pass for prose
- [ ] Build chapter completion detection
- [ ] Write tests for narrator agent
- [ ] Document narrator configuration

---

## Phase 6: Physical Simulation & Realism
**Goal**: Add physical needs, damage, and environmental effects

### Checklist
- [ ] Implement nutrition depletion over time
- [ ] Implement hydration depletion over time
- [ ] Add tiredness accumulation system
- [ ] Implement sleep mechanics (forced at 100% tiredness)
- [ ] Create damage system:
  - [ ] Apply damage to body parts
  - [ ] Track damage types and severity
  - [ ] Implement healing rates by species
- [ ] Add temperature effects on characters
- [ ] Implement item consumption (food/water)
- [ ] Add death/unconsciousness states
- [ ] Create emergency states (starvation, dehydration)
- [ ] Test all physical systems
- [ ] Balance parameters for playability

---

## Phase 7: Series Management System
**Goal**: Tools for creating and managing book series

### Checklist
- [ ] Create series design template structure
- [ ] Implement series file parser
- [ ] Add `{narrator discretion}` marker handling
- [ ] Add `{working}` marker validation
- [ ] Create series progress tracking
- [ ] Implement chapter-to-markdown output
- [ ] Add ISBN field and publishing workflow hooks
- [ ] Create series editor UI (optional admin tool)
- [ ] Build series validation tools
- [ ] Test complete series workflow
- [ ] Document series creation process

---

## Phase 8: Area Trigger System
**Goal**: Make areas dynamic and reactive

### Checklist
- [ ] Implement trigger condition evaluator
- [ ] Add trigger types:
  - [ ] Character enters area
  - [ ] Item picked up/dropped
  - [ ] Time-based triggers
  - [ ] Character speech keywords
  - [ ] Character state thresholds
- [ ] Implement trigger reactions:
  - [ ] Add/remove items
  - [ ] Add/remove exits
  - [ ] Modify area description
  - [ ] Modify temperature
  - [ ] Spawn characters
- [ ] Add trigger chaining
- [ ] Implement one-time vs repeatable triggers
- [ ] Create trigger debugging tools
- [ ] Write comprehensive trigger tests
- [ ] Document trigger system

---

## Phase 9: Advanced Features
**Goal**: Polish and enhance the experience

### Checklist
- [ ] Add area image generation (AI or manual)
- [ ] Implement character relationship tracking
- [ ] Add faction/reputation system
- [ ] Create save/load game states
- [ ] Implement time acceleration controls
- [ ] Add admin dashboard for world monitoring
- [ ] Create character creation wizard
- [ ] Implement inventory weight/capacity
- [ ] Add skill/ability system (if needed)
- [ ] Create tutorial/onboarding flow
- [ ] Add analytics and telemetry
- [ ] Performance optimization pass

---

## Phase 10: Testing & Polish
**Goal**: Production readiness

### Checklist
- [ ] Comprehensive integration testing
- [ ] Load testing (multiple concurrent players)
- [ ] Security audit
- [ ] Database optimization and indexing
- [ ] Error handling and recovery
- [ ] Logging and monitoring setup
- [ ] Backup and restore procedures
- [ ] Documentation completion
- [ ] User acceptance testing
- [ ] Bug fixes and refinements
- [ ] Deployment guide
- [ ] Production deployment

---

## Notes

- Each phase should be completed and tested before moving to the next
- Phases 1-3 are critical path and should be prioritized
- Phase 4 can be minimal initially and enhanced later
- Phases 5-8 can be developed in parallel once Phase 3 is complete
- Keep the design document updated as architecture decisions are made
- Regular commits with clear messages for each completed checklist item
