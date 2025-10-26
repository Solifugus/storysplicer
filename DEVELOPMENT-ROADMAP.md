# StorySplicer Development Roadmap

This document breaks down the StorySplicer implementation into manageable phases with clear checklists.

---

## Phase 1: Foundation & Database Layer ✅
**Goal**: Establish project structure, database schema, and core data models

### Checklist
- [x] Set up Node.js project structure with package.json
- [x] Configure PostgreSQL connection
- [x] Create database schema for:
  - [x] Worlds table
  - [x] Areas table (with triggers support)
  - [x] Characters table (all attributes from design)
  - [x] Items table
  - [x] Writing styles table
- [x] Implement database migration system
- [x] Create basic CRUD functions for each entity
- [x] Write unit tests for database layer
- [x] Document database schema and relationships

---

## Phase 2: MCP Server Core ✅
**Goal**: Build the Model Context Protocol server that controls all world state and actions

### Checklist
- [x] Set up MCP server architecture
- [x] Implement WebSocket handler for client connections
- [x] Create MCP tools for world queries:
  - [x] Get area details
  - [x] Get character details
  - [x] Get items in area
  - [x] Get characters in area
- [x] Create MCP tools for world actions:
  - [x] Move character between areas
  - [x] Pick up/drop items
  - [x] Character speech/actions
  - [x] Modify character state (nutrition, hydration, etc.)
- [x] Implement area trigger system
- [x] Add connection/authentication for player sessions
- [x] Write integration tests for MCP tools
- [x] Document MCP API

---

## Phase 3: Character Agent Controller ✅
**Goal**: Implement the cycle-based character processing system

### Checklist
- [x] Design agent controller architecture
- [x] Implement cycle timer (configurable interval)
- [x] Create character context window builder:
  - [x] Identity section
  - [x] Physical state section
  - [x] Inventory section
  - [x] Area context section
  - [x] Memory section
- [x] Integrate small LLM (3B) for minor characters
- [x] Integrate larger LLM for story characters
- [x] Implement LLM response parser (actions to MCP calls)
- [x] Add sleep/wake cycle logic (tiredness/alertness)
- [x] Implement memory management:
  - [x] Recent memory storage (3/5 items)
  - [x] Memory summarization
  - [x] Backstory elevation for major events
- [x] Create character action validation
- [x] Write tests for agent controller
- [x] Add performance monitoring and logging

---

## Phase 4: Basic Frontend (PWA) ✅
**Goal**: Create minimal viable player interface

### Checklist
- [x] Set up PWA structure (manifest, service worker)
- [x] Create HTML/CSS layout:
  - [x] Area image display
  - [x] Area description panel
  - [x] Character status panel
  - [x] Action input field
  - [x] Chat/activity log
- [x] Implement WebSocket MCP client
- [x] Add player authentication flow
- [x] Implement real-time area updates
- [x] Display other characters in area
- [x] Show items in area
- [x] Handle player input submission
- [x] Add offline capability
- [ ] Test on mobile devices
- [x] Create basic UI documentation

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
