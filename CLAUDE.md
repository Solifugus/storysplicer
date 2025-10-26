# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StorySplicer is a world simulation system for developing stories for book series and interactive role-playing experiences. The world dynamically expands through AI to support narratives while maintaining consistency with the world design.

## Core Architecture Concepts

### Multi-Agent Simulation Model
The system operates on a **cycle-based time model** where all awake characters are processed sequentially each cycle (typically 2-10 seconds depending on GPU). Three control modes operate simultaneously:
- **Narrator**: Controls story characters for plot advancement
- **Players**: Control their characters when connected
- **Minor Characters**: Live autonomous lives continuously

### Character Agent System
Each character is an autonomous agent with its own LLM-powered behavior:
- **Minor characters**: Use small LLM model (3B parameters)
- **Story characters**: Use larger LLM model for richer behavior

Each cycle, a context window is assembled for each awake character containing:
1. Identity (name, age, gender, species, description, backstory)
2. Physical state (hydration, nutrition, tiredness, alertness, damage)
3. Inventory (what's in hands and pockets)
4. Current area (description, exits, items, other characters)
5. Memory (chronology of recent actions/reactions)

The character then interacts with the world via the MCP server based on LLM output.

### Memory Management
Character memory is hierarchical:
- **Recent memory**: Last 3 items for minor characters, 5 for story characters
- **Summarized history**: Older events are consolidated
- **Backstory integration**: Major events are elevated to the backstory

### Narrator Agent
Special orchestrator agent that:
- Drives story according to writing style guidelines
- May take control of any non-player-controlled character
- Expands the world dynamically as needed for plot
- Collects all text during chapter generation
- Revises and removes irrelevant details for final narration

### Technical Stack

**Frontend**:
- PWA using vanilla JS/HTML/CSS
- Communicates via MCP over WebSockets
- Real-time area visualization with descriptions, items, and character interactions

**Backend**:
- Node.js with minimal dependencies
- PostgreSQL for persistence
- Agentic Controller: Cycles through all non-sleeping, non-player-controlled characters
- MCP Server: Controls all world state, character actions, and area triggers

### World Structure

**World Definition** consists of:
- World description (rules, logic, species, empires)
- Writing style (tone, voice, pacing, narrative structure)
- Characters (autonomous agents)
- Areas (locations with triggers and state)

**Areas** include:
- Description, temperature, items, characters
- Triggers with conditions and reactions (modify items, exits, descriptions, temperature)

### Series/Book/Chapter Hierarchy
- Series designs live in `~/series-design` folder as markdown
- Books are broken into chapters
- `{narrator discretion}` markers indicate AI-driven creative fill-in
- `{working}` markers indicate incomplete content
- Final output: One markdown file per book, convertible to publishable formats when ISBN assigned

## Physical Simulation
Characters have physical needs and states:
- **Nutrition/Hydration**: Percentage-based
- **Tiredness/Alertness**: Controls sleep/wake cycles (0-100%)
- **Damage**: Tracked by body part with type and severity
- Sleep is enforced at 100% tiredness; alertness <20% indicates sleep

## Character Control
- `owner`: Indicates if player-controlled
- `character_class`: "story" or "minor" (determines LLM size)
- Narrator cannot control actively player-owned characters

## Writing Style System
The writing style defines prose generation with attributes like:
- Tone, narrative voice, tense
- Sentence complexity, dialogue style
- Theme keywords, conflict density
- Pacing model, moral ambiguity
- Descriptive depth, emotional realism
- Language register and prose format rules
