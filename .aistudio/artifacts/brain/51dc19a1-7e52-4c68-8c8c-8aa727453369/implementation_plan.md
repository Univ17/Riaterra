# Riaterra: Modular Refactoring, Pixel UI & Refined Boss Progression

A modern, maintainable refactoring of the Riaterra 2D sandbox adventure game, transforming the 1,000-line monolithic script into clean, typed modules with a high-performance canvas engine, responsive React & Tailwind overlays styled with authentic retro pixelated fonts (Terraria / OSRS aesthetic), localStorage save/autosave, and the precise boss progression.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> In accordance with your latest updates:
> - **Retro Pixelated Typography**: The entire UI (HUD, Hotbar, Inventory, Tooltips, Boss Bars, Damage Numbers, and Toast notifications) will use an authentic pixel font (such as `'Press Start 2P'` and `'Silkscreen'`, styled with pixelated text-shadows reminiscent of Terraria and Old School RuneScape).
> - **Precise Boss Progression & Drops**:
>   1. **Tier 1 (King Slime)**: Summoned by constructing an upside-down "T" out of Gold Ore. Defeating King Slime drops the **Slime Sword** (and Slime Gun) and unlocks Tier 2.
>   2. **Tier 2 (Big Bad Eye)**: Once King Slime is defeated, hunting zombies yields the **Occult Book**. Using the Occult Book summons the **Big Bad Eye**. Defeating the Big Bad Eye drops the coveted **Big Bad Sword**, raises maximum HP to 150, and unlocks Tier 3.
>   3. **Tier 3 (The Descendant)**: After the Big Bad Eye is defeated, **Golden Eyelets** spawn in the sky. Defeating Golden Eyelets yields **Ancient Artefacts**.
>   4. **Relic Crafting**: 3 Ancient Artefacts are crafted at the crafting bench into the **Relic** (Descendant Sigil).
>   5. **Final Boss**: Activating the Relic summons **The Descendant** (celestial boss with 8 orbiting swords that alternate every 15 seconds between Blue: ranged damage only, and Red: melee damage only).
> - **Audio Excluded**: Audio systems remain excluded as requested to keep the codebase lean and focused.

---

## 1. Overview & Core Concept

Riaterra's original 1,000-line script is refactored into a high-performance TypeScript engine with a clean separation of concerns.

### What This Refactoring Delivers:
1. **Uncluttered & Clean Codebase**: Separates simulation physics and world state from user interaction. Replaces brittle canvas UI math with modular React + Tailwind components.
2. **Terraria / OSRS Aesthetic**:
   - Pixelated font (`'Press Start 2P'` / `'Silkscreen'`) loaded directly into the app for crisp, blocky retro typography.
   - Pixel-perfect bordered item slots, tooltip cards, and boss health bars.
3. **Modular TypeScript Architecture**:
   - `types.ts`: Strict types for tiles, items, recipes, entities, projectiles, and save data.
   - `world.ts`: Layered terrain generation, cave noise, trees, berry bushes, and mining/placing operations.
   - `physics.ts`: AABB collision, one-way jump-through platforms, and knockback resolution.
   - `entities.ts`: Player mechanics (walk, jump, slime boots dash, wings flight) and enemy AI (Slimes, Zombies, Eyelets, King Slime, Big Bad Eye, The Descendant).
   - `items.ts`: Item definitions (Slime Sword, Big Bad Sword, Pickaxes, Relic, Potions) and crafting recipes.
   - `storage.ts`: Automatic and manual game saving and loading via browser `localStorage`.
   - `engine.ts`: 60 FPS fixed-timestep simulation runner and event dispatcher.
4. **Save, Autosave & Load**:
   - Persistent inventory, player stats, equipment unlocks, defeated boss progression flags, and world alterations.
   - Periodic autosave every 30 seconds and on boss defeats, with clear visual save toasts and manual Reset/Load controls.

---

## 2. User Experience & Visual Design

### Retro Pixelated Visual Theme
- **Fonts**: Pixel display face `'Press Start 2P'` / `'Silkscreen'` via Google Fonts with `text-shadow: 2px 2px #000`, matching classic Terraria and Old School RuneScape dialogs and item counts.
- **HUD**:
  - Pixel-bordered Red Health bar (`100/100`) with crisp high-contrast numbers.
  - Emerald Dash meter (`Dash [Shift]`) and Celestial Wings meter (`Wings / Inf Wings`).
  - Active kill counter.
- **Hotbar & Inventory**:
  - 10-slot Hotbar with slot numbers / Czech keybind markers (`+`, `ě`, `š`, etc.).
  - Backpack inventory modal (opened with `E` or `Tab`) with item counts, hover tooltips showing recipe ingredients, and drag-and-drop or click-to-swap item slots.
- **Boss Health Bar**:
  - Distinctive boss banner at bottom-center showing boss name (e.g. `Slime King`, `Big Bad Eye`, `The Descendant — Melee Only`), bordered HP bar, and numeric health.
- **Debug Drawer**:
  - Easily toggleable pixelated cheat menu to spawn bosses, grant swords/guns/wings, or heal instantly.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Typography** | Pixelated Google Font (`'Press Start 2P'` / `'Silkscreen'`) | Recreates the authentic OSRS and Terraria retro gaming feel with sharp pixel readability across all resolutions. | Generic browser sans-serif or blurry canvas bitmap fonts. |
| **Boss Drops** | King Slime drops Slime Sword; Big Bad Eye drops Big Bad Sword | Provides distinct weapon upgrades that make each boss fight rewarding and purposeful. | Random drop rates or generic weapon crafting. |
| **UI Implementation** | React + Tailwind Overlays | Replaces raw canvas drawing calls with maintainable, responsive, accessible components. | Canvas-only rendering (difficult to style and maintain). |
| **Audio** | Omitted | Excluded as explicitly requested by user. | Synthesized audio. |
| **Persistence** | `localStorage` with versioned schema | Zero backend required, instant autosaving every 30s and after boss victories, survives browser reloads. | Ephemeral memory-only state. |

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              React App                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    GameCanvas Component                          │  │
│  │   - Fixed 60FPS tick update loop                                 │  │
│  │   - Canvas 2D render pipeline (tiles, camera, player, entities)  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │            React Pixel UI Overlay Layer (Press Start 2P)         │  │
│  │   - Hud (HealthBar, FlightMeter, DashMeter, KillCounter)         │  │
│  │   - Hotbar (10 slots with key indicators & count badges)         │  │
│  │   - InventoryModal (Backpack, Drag-and-Drop, Crafting Station)   │  │
│  │   - BossHealthBar (King Slime, Big Bad Eye, The Descendant)      │  │
│  │   - DebugPanel (Boss summoners, item unlocks, god mode)          │  │
│  │   - SaveControls (Manual Save, Load, Autosave indicator)        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                   │                                    │
│             State & Event Bus / Modular Engine Core                    │
│                                   ▼                                    │
│  ┌───────────────┬────────────────┬───────────────┬────────────────┐  │
│  │  world.ts     │  entities.ts   │  physics.ts   │  items.ts      │  │
│  │  - Terrain gen│  - Player      │  - AABB coll. │  - Item defs   │  │
│  │  - Gold T-test│  - King Slime  │  - Platforms  │  - Slime Sword │  │
│  │  - Cave noise │  - Big Bad Eye │  - Gravity    │  - Big Bad Swrd│  │
│  │  - Tiles/Ore  │  - Descendant  │  - Movement   │  - Relic       │  │
│  └───────────────┴────────────────┴───────────────┴────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  storage.ts                                                     │  │
│  │  - Game state serialization (player, inventory, boss flags)     │  │
│  │  - Autosave loop & Manual Save / Restore / New Game             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### File Structure Plan:
- `src/game/types.ts`: All core types, items, recipes, enemy definitions, and save format.
- `src/game/constants.ts`: World sizes, tile dimensions, textures, base stats.
- `src/game/world.ts`: Noise generation, procedural terrain, block mining, placing, gold "T" detector.
- `src/game/physics.ts`: AABB collision, step-back resolution, one-way platform dropping.
- `src/game/entities.ts`: King Slime, Big Bad Eye, Descendant, Golden Eyelets, zombies, slimes, bullets, particle debris.
- `src/game/items.ts`: Items catalog (including Slime Sword, Big Bad Sword, and Relic) and recipe definitions.
- `src/game/storage.ts`: Save, load, autosave, and reset methods.
- `src/game/engine.ts`: Game loop coordinator, input handling, and camera logic.
- `src/components/GameCanvas.tsx`: Renders the canvas and handles viewport resizing.
- `src/components/Hud.tsx`: Player HP, wings flight bar, dash cooldown, kill count.
- `src/components/Hotbar.tsx`: 10-slot hotbar with active selection and Czech/number key labels.
- `src/components/InventoryModal.tsx`: Modern drag-and-drop backpack and crafting bench.
- `src/components/BossBar.tsx`: Boss health bar with phase announcements.
- `src/components/DebugPanel.tsx`: Collapsible debug console.
- `src/components/SaveBar.tsx`: Save indicator and quick-save/load triggers.

---

## Plan Status
- Plan revised with retro pixelated typography and Big Bad Sword loot.
- Ready for user review and approval before executing code changes.
