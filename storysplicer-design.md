# StorySplicer Design

StorySplicer is a world simulation system designed to develop stories for book series and interactive role-playing experiences.

The world expands dynamically through AI to support the premises of the world design and the narratives that unfold within it.  
Each world is defined by a **world description**, a **writing style**, a set of **characters**, and a collection of **areas**.

---

## World Description

This section provides a textual overview of the world's nature, rules, and logic.  
It serves as the foundation for AI world generation.  
All world expansions and stories must remain consistent with the world description.

This includes species, empires, etc.

---

## Writing Style

The **writing style** defines the tone, voice, pacing, and structure of generated prose and dialogue.  
It guides both the *book narration* and the *interactive player experience*.

### Attributes
| Attribute | Description | Example / Default |
|------------|-------------|-------------------|
| **Tone** | Emotional flavor of narration. | `reflective`, `heroic`, `darkly humorous`, `realistic` |
| **Narrative Voice** | Point of view and perspective. | `third-person limited`, `third-person omniscient` |
| **Tense** | Preferred verb tense for prose. | `past` |
| **Sentence Complexity** | Average linguistic sophistication. | `medium` (5–15 words typical) |
| **Dialogue Style** | Level of realism vs stylization in speech. | `naturalistic` |
| **Theme Keywords** | Recurring motifs or conceptual anchors. | `exploration`, `identity`, `technology`, `survival` |
| **Conflict Density** | How often narrative conflict should occur. | `moderate` |
| **Pacing Model** | Rate of events per chapter. | `rising`, `episodic`, `steady` |
| **Moral Ambiguity** | Range of ethical clarity. | `balanced` |
| **Descriptive Depth** | How much environmental detail to include. | `moderate` |
| **Emotional Realism** | Strength of psychological portrayal. | `high` |
| **Language Register** | Formality level of diction. | `neutral to technical` |
| **Prose Format Rules** | Structural or stylistic constraints. | "No first-person introspection outside human characters." |

### Example Defaults for Sci-Fi World
```yaml
tone: reflective
narrative_voice: third-person limited
tense: past
sentence_complexity: medium
dialogue_style: naturalistic
theme_keywords: [exploration, technology, cultural-encounter, survival]
conflict_density: moderate
pacing_model: rising
moral_ambiguity: balanced
descriptive_depth: moderate
emotional_realism: high
language_register: neutral-to-technical
prose_format_rules: 
  - "No omniscient narrator unless explicitly authorized by the Narrator agent."
  - "Technology should be described through sensory detail, not exposition."
```

## Plots

There may be plots described at 3 levels: series, book, and chapter.
The narrator will work the story toward these plots through the world simulation, the characters, and their constraints.

Each series will be defined in a markdown file under the ~/series-design folder.
A series design file should include book sections, under which there are chapter sub-sections.
Anywhere there is {narrator discretion}, the narrator should fill in using its own AI creativity.
Anywhere there is {working} means it's not done and the series is not ready to begin execution.
Once complete, the narrator may begin the series.

The end result, eventually, will be each book in its own markdown file. When an ISBN number is entered for each (by a human administrator), the markdown file is converted into publishable forms for paper and ebook on Amazon.

## Time System

The world operates on cycle-based time, not real-time. Each cycle processes all awake characters sequentially.
Cycle duration depends on GPU processing speed (typically 2-10 seconds).
All three control modes operate simultaneously within this shared world time:
- Narrator controls story characters for plot advancement
- Players control their characters when connected
- Minor characters live autonomous lives continuously

## Characters

Each **character** represents an autonomous agent within the world simulation.  
StorySplicer continuously cycles through each character, orchestrating interactions with the world and other characters while awake else reducing tiredness each moment asleep.

Characters sleep, rest, or pause naturally based on biological and psychological factors, reducing computational load and maintaining narrative realism.

### Behavior Model
Each cycle, a context-window is put together for each awake character and run against its LLM model.
The context window is comprised of a consolidation of the following:
1. Name, age, gender, species, description, and backstory (does not need updating every cycle)
2. Any notable states of hydration, nutrition, tiredness, alertness, damage
3. What is in either or both hands
4. The area description + exits + items + other characters there.
5. Memory (chronology of recent actions/reactions)

First, all the minor characters are run against a small LLM model (3B parameters).
Second, all the story characters are run against a larger LLM model.
Thereby, each character agent interacts with the world and/or communicates with other characters using the MCP server.

### Character Attributes

**Identity**:
- `id`
- `name`
- `description`
- `species`
- `gender`
- `age`
- `backstory`

**Psychological**:
- `memory`
  Chronology of recent actions/reactions.
  This includes things said or done and what resulted.
  The last three items for minor characters else five items for story characters.
  Older than that is summarized.
  Major event summaries are added to the backstory.
- `likes`
- `dislikes`
- `interests`
  This may include one's job, mission, or anything that drives behavior.
- `internal_conflict`
- `beliefs`
  This may be beliefs but also misbeliefs. A good story revolves around misbeliefs ultimately being reconciled.

**Physical Condition**:
- `nutrition`: percentage
- `hydration`: percentage
- `damage[]`
  To indicate if a leg, arm, or whatever has damage, the type, and how severe.
  This should heal else go into the character description if permanent.
  - part: e.g. left arm, right leg, head
  - type: burn, cut, depression, etc.
  - severity: percentage (rate of healing depends on species)

**Rest Cycle**:
- `tiredness`: percentage 
  100% forces sleep; the lower the easier to wake.
- `alertness`: percentage
  Less than 20% is sleep, 0% being the deepest sleep.
    
**Location**:
- `current_area_id` 
  
**Inventory**:
- `items[]`: {'right hand':item_id, 'left hand':item_id, 'right pocket':..., etc.}
  Location + item, for example knife in right hand, key in pocket.
  The right and left hand are mandatory while the others can vary.

**Controllability**:
- `owner`: player_id
  Determines if a player may control this character or not.
- `character_class`: "story" | "minor" 
  Story characters use larger LLM; Narrator may take control of any except owned characters

This continuous character-driven simulation ensures the world evolves organically through the lives and interactions of its inhabitants, maintaining realism and narrative flow.

## Areas

Each area has the following attributes:
- name
- description
- temperature
- items
- characters
- triggers
  - condition: defines when triggered
  - reactions: defines what happens when it does
    - add/remove item
    - add/remove exit
    - modify description
    - modify temperature

## Technical Architecture

- Frontend
  - PWA applications using vanilla js/html/css.
  - Communication with the backend is via MCP over websockets.
  - At any moment a player is in an area.
  - A representative image is provided for the area.
  - The description is shown under the image, augmented by any notable cold/heat and any items in the area.
  - The player may type in whatever he/she wants to do.
  - The player may check his/her character's attributes. 
  - The player may disconnect/reconnect to his/her character.
  - The player may talk with other characters in the same area.
  
- Backend
  - Node.js (minimal dependencies)
  - PostgreSQL storage
  - Agentic Controller
    The agentic controller cycles through each character not sleeping or controlled by a player.
    The agent's context window is filled with currently essential details and its action/reaction acquired from its LLM model.
    The action/reaction is executed via the MCP server.
  - MCP server
    Controls access to all details and actions of the world and characters.
    Also controls triggers of areas in the world.
    
## Narrator 

The Narrator is a special agent whose job is to orchestrate the stories for each book series.
While narrating (generating a story), the narrator may take control of any and all relevant characters except for a player's character while the player is actively controlling it.
The narrator's job is to drive the story, according to the writing style, and also to expand the world as necessary or convenient to drive the story forward.
As the Narrator orchestrates the story of a chapter, it collects all text.  
When the actions involved in a chapter have all happened, the narrator then removes all text irrelevant to the story and then revises to make for good narration.
Relevance to the story includes what happens in the chapter but also where the story is being driven throughout the book and the book series.
