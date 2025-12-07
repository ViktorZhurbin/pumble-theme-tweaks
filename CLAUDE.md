# Instructions

## General

- when applying changes, make sure to update CLAUDE.md as needed

## SolidJS
- Use arrow functions to define components (NOT function notation)

## CSS

### General Rules
- **Never use `transition: all`** - always specify individual properties (e.g., `transition: background 0.2s ease, opacity 0.2s ease`)
- **Never set font-size in CSS** - use the Typography component with appropriate variants (`caption`, `default`, `body`, `title`, etc.)
- **Use px for all sizing/spacing** - only Typography component uses rem internally
- **Always use CSS variables** for colors - never use hard-coded hex, rgb, or rgba values
- **Always use HSL format** for all colors - `hsl(hue, saturation%, lightness%)`

### Color System
All colors are defined in `src/entrypoints/popup/styles.css` using HSL format for easy adjustment.

**Accent Colors:**
- `--color-accent-purple`: Primary purple (258, 70%, 55%)
- `--color-accent-purple-hover`: Hover state (258, 70%, 60%)
- `--color-accent-purple-light`: Lighter variant (258, 70%, 65%)
- `--color-accent-blue`: Blue accent (213, 70%, 60%)
- `--color-accent-teal`: Teal accent (172, 60%, 45%)
- `--color-accent-red`: Red accent (0, 80%, 60%)

**Semantic Colors:**
- `--color-primary`: Main brand color (purple)
- `--color-primary-hover`: Primary hover state
- `--color-error`: Error states (red)
- `--color-error-hover`: Error hover state

**Text Colors:**
- `--color-text-primary`: Main text (92% lightness)
- `--color-text-secondary`: Secondary text (85% lightness)
- `--color-text-tertiary`: Tertiary text (50% lightness)
- `--color-text-disabled`: Disabled text (30% lightness)
- `--color-text-placeholder`: Placeholder text (55% lightness)

**Border Colors:**
- `--color-border-subtle`: 4% white opacity
- `--color-border-light`: 8% white opacity
- `--color-border-medium`: 10% white opacity
- `--color-border-strong`: 12% white opacity

**Shadows:**
- `--shadow-sm`: Small shadow for subtle elevation
- `--shadow-md`: Medium shadow for cards
- `--shadow-lg`: Large shadow for modals
- `--shadow-purple`: Purple accent shadow
- `--shadow-purple-hover`: Purple hover shadow
- `--shadow-blue`: Blue accent shadow
- `--shadow-teal`: Teal accent shadow
- `--shadow-red`: Red accent shadow

**Overlays:**
- `--overlay-white-subtle`: 1.5% white
- `--overlay-white-light`: 6% white
- `--overlay-white-medium`: 8% white
- `--overlay-black-subtle`: 8% black
- `--overlay-black-medium`: 25% black

**Usage Examples:**
```css
/* ✓ CORRECT - use variables */
.button {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  box-shadow: var(--shadow-purple);
}

/* ✗ WRONG - hard-coded colors */
.button {
  background: #a78bfa;
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Typography Component
- Use `<Typography variant="caption">` for small text (0.8125rem)
- Use `<Typography>` or `<Typography variant="default">` for normal text (0.875rem)
- Use `<Typography variant="body">` for body text (1rem)
- Never pass `variant="default"` - it's the default value
- Wrap button text, labels, and UI text in Typography components

##

# Pumble Tweaks - Architecture

> Concise architectural reference for the Pumble Tweaks browser extension.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Structure](#architecture--structure)
3. [Key Files Reference](#key-files-reference)
4. [State Management](#state-management)
5. [Messaging System](#messaging-system)
6. [Component Patterns (SolidJS)](#component-patterns-solidjs)
7. [Styling](#styling)
8. [Build System](#build-system)
9. [Code Quality & Conventions](#code-quality--conventions)
10. [Quick Reference](#quick-reference)

---

## Project Overview

**Pumble Tweaks** is a browser extension that enables real-time customization of the Pumble web application's appearance through CSS color property modifications.

### What It Does
- Customizes CSS color properties in real-time
- Automatically derives related color variants (darker/lighter versions)
- **Preset-based color management** - save/load/switch between named color schemes
- **Global tweaks** - color values apply regardless of Pumble theme (color scheme)
- **Unsaved changes tracking** - visual indicator when working state differs from saved preset
- Master enable/disable toggle
- Import/export color configurations
- Multi-tab synchronization via browser storage sync
- Instant live preview with debounced persistence

### Tech Stack
- **Framework:** SolidJS
- **Language:** TypeScript
- **Extension Framework:** WXT (Vite-based cross-browser extension wrapper)
- **Styling:** Tailwind CSS + daisyUI components, CSS Modules with CSS custom properties
- **Color Manipulation:** colord
- **Code Quality:** Biome v2

---

## Architecture & Structure

### Three-Process Extension Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Popup Script   │────▶│ Background Script│────▶│ Content Script  │
│ (extension UI)  │◀────│   (router/badge) │◀────│  (Pumble page)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
      │                                                    │
      │                                                    │
      └────────────── Type-safe Messages ─────────────────┘
```

1. **Content Script** (`src/entrypoints/content/`)
   - Runs in Pumble page context
   - Manages DOM manipulation and theme state
   - Single source of truth for runtime state
   - Watches for theme changes via MutationObserver

2. **Popup Script** (`src/entrypoints/popup/`)
   - Runs in extension UI context
   - Displays color picker interface
   - Sends commands to content script
   - Listens for state changes and updates reactively

3. **Background Script** (`src/entrypoints/background/`)
   - Runs in extension service worker context
   - Routes messages between popup and content
   - Updates extension badge (ON/OFF indicator)

### Folder Structure

```
src/
├── entrypoints/              # Extension entry points
│   ├── popup/                # Popup UI (color picker interface)
│   │   └── main.tsx
│   ├── content/              # Content script (injected into Pumble)
│   │   ├── index.ts          # Main content script entry
│   │   ├── protocol.ts       # Message types TO content script
│   │   ├── messenger.ts      # Message handler setup
│   │   ├── theme-state.ts    # Core state manager & DOM controller
│   │   ├── theme-watcher.ts  # MutationObserver for theme changes
│   │   └── dom-utils.ts      # DOM manipulation utilities
│   └── background/           # Background service worker
│       ├── index.ts          # Badge updates & message routing
│       ├── protocol.ts       # Message types FROM background
│       └── messenger.ts      # Message handler setup
├── components/               # SolidJS reusable components
│   ├── App.tsx              # Root component
│   ├── ThemeEditor/         # Main UI orchestrator
│   ├── Button/              # Reusable button component
│   ├── Checkbox/            # Toggle checkbox component
│   ├── Typography/          # Text component with variants
│   └── CopyButton/          # Base copy-to-clipboard component
├── lib/                     # Shared utilities
│   ├── messages/            # Type-safe messaging
│   ├── storage.ts           # Browser storage operations
│   ├── color-derivation.ts  # Derived color generation
│   ├── utils.ts             # debounce, wait helpers
│   ├── logger.ts            # Debug logging
│   ├── browser-utils.ts     # Browser API wrappers
│   └── url.ts               # URL utilities
├── types/                   # TypeScript interfaces
│   ├── tweaks.ts            # Color tweak data structures
│   └── runtime.ts           # Runtime state types
├── constants/               # Configuration
│   ├── properties.ts        # Customizable CSS properties
│   ├── derived-colors.ts    # Color derivation rules
│   └── pumble-urls.ts       # Target URLs
└── app/
    ├── index.tsx            # Popup HTML renderer
    └── shared.css           # Global styles & CSS variables
```

### Core Patterns

- **Type-Safe Messaging**: `createMessenger<Protocol>()` factory for strongly-typed communication between extension contexts
- **Single Source of Truth**: `ThemeState` class in content script owns runtime state, broadcasts changes to popup
- **Preset-Based Storage**: Browser sync storage with named presets (global tweaks independent of Pumble theme), debounced writes (500ms), unsaved changes tracking

---

## Key Files Reference

| File | Purpose | When to Modify |
|------|---------|----------------|
| `src/entrypoints/content/theme-state.ts` | Core state manager. Single instance controls all DOM changes, storage sync, and state broadcasting | Adding state logic, changing how tweaks are applied |
| `src/entrypoints/content/theme-watcher.ts` | MutationObserver watching for theme changes in DOM | Changing theme detection logic |
| `src/components/ThemeEditor/ThemeEditor.tsx` | Popup UI root. Initializes connection, syncs state, provides context | Changing popup UI structure or initialization |
| `src/lib/messages/createMessenger.ts` | Generic type-safe message handler factory | Changing message passing infrastructure |
| `src/lib/storage.ts` | Storage operations facade. Handles persistence, migration, CRUD | Adding storage operations or changing storage format |
| `src/constants/properties.ts` | Defines which CSS properties are customizable. Source of truth for property list | **Adding or removing customizable properties** |
| `src/constants/derived-colors.ts` | Registry mapping base colors to derived colors with computation functions | Adding automatic color derivations |
| `wxt.config.ts` | Extension manifest, permissions, URL patterns, dev server config | Changing browser permissions or target URLs |
| `tsconfig.json` | TypeScript + SolidJS JSX configuration | Changing TypeScript compiler settings |
| `biome.json` | Code quality (Biome formatter + linter for SolidJS) | Changing code style rules |

---

## State Management

**Runtime State** (lives in content script):
```typescript
interface RuntimeState {
  themeName: string | null;          // "wednesday_dark" | "picklejar_light" (display only)
  tweaksOn: boolean;                 // Master toggle for all tweaks
  workingTweaks: WorkingTweaks;      // Current working state (may have unsaved changes)
  selectedPreset: string | null;     // Currently selected preset (null = no preset)
  savedPresets: Record<string, PresetData>;  // All saved presets
  hasUnsavedChanges: boolean;        // Working state differs from selected preset?
}
```

**Storage Format** (`browser.storage.sync`):
```typescript
{
  working_tweaks: {                  // Active working state (current unsaved changes)
    cssProperties: { [propertyName]: { value, enabled } }
  },
  selected_preset: string | null,    // Selected preset name
  saved_presets: {                   // Named presets registry
    [presetName]: {
      name: string,
      cssProperties: { [propertyName]: { value, enabled } },
      createdAt: string,
      updatedAt: string
    }
  },
  tweaks_on: boolean,                // Global master switch
  last_update_tab_id: number         // For multi-tab sync coordination
}
```

**Key Concepts:**
- **Global Tweaks**: Color values are NOT tied to Pumble color theme - same colors apply regardless
- **Working State**: Current unsaved modifications being previewed in real-time
- **Presets**: Named snapshots of color configurations users can save/load/switch between
- **Unsaved Changes**: Tracked by comparing working state to selected preset

**Data Flows:**
- **Color Change**: Popup sends message → Content script applies CSS + derived colors → Updates working state → Broadcasts to popup → Debounced storage write (500ms)
- **Save Preset**: User clicks Save → Updates selected preset with current working state → Sets `hasUnsavedChanges = false`
- **Load Preset**: User selects preset → Loads preset values into working state → Applies to DOM → Sets `hasUnsavedChanges = false`
- **Reset**: User clicks Reset → Clears working state → Deselects preset → Removes all CSS overrides (shows Pumble defaults)
- **Theme Detection**: Page loads → Detects theme name for display → Does NOT reload tweaks (working state persists)
- **Multi-Tab Sync**: Change in Tab 1 → Write to `browser.storage.sync` → All tabs receive `onChanged` event → Re-apply working state

---

## Messaging System

Type-safe message passing between extension contexts using `createMessenger<Protocol>()` factory.

**Protocol Pattern:**
```typescript
// Define protocol interface
interface ContentProtocol {
  updateProperty: { propertyName: string; value: string; enabled: boolean };
  getState: void;
}

// Usage
const { sendMessage, onMessage } = createMessenger<ContentProtocol>();
await sendMessage("updateProperty", { propertyName, value, enabled });
```

**Message Flow:**
- Popup → Content Script: Direct via `sendToContent()`
- Content Script → Popup: Broadcast via background using `broadcast("stateChanged", runtimeState)`

---

## Component Patterns (SolidJS)

**Fine-Grained Reactivity** - Components run once, no re-renders:

| Concept | SolidJS | React |
|---------|---------|-------|
| **Component execution** | Runs **once** | Re-runs on every state change |
| **Re-rendering** | **No re-renders** | Full component re-render |
| **Reactivity** | Property-level tracking | Component-level tracking |

**State Primitives:**
- `createSignal` - Simple values: `const [count, setCount] = createSignal(0);` Access with `count()`
- `createStore` - Nested objects: `setStore("path", "to", "property", value);` Property-level reactivity
- `createMemo` - Derived values: `const doubled = createMemo(() => count() * 2);` Auto-updates on dependencies
- **Context** - Use `createContext` for prop drilling avoidance (see `ThemeEditor.tsx`)

**Key Conventions:**
- Signals must be called as functions: `loading()` not `loading`
- Use `class` not `className` for JSX attributes
- Store updates via path notation, never direct mutation

---

## Styling

- **CSS Modules**: Each component has `.module.css` with scoped styles
- **CSS Variables**: Defined in `src/entrypoints/popup/styles.css` (see color system above)
- Always use variables for colors, spacing, and design tokens


## Build System

**WXT Configuration** (`wxt.config.ts`): Defines extension manifest, permissions, and host URLs


## Code Quality & Conventions

**Critical Constraints:**

1. **No createElement** - Use JSX only: `<div>Content</div>` not `document.createElement("div")`
2. **No non-null assertions** - Use `tweaks?.disabled ?? false` not `tweaks!.disabled`
3. **Always call signals as functions** - `if (loading())` not `if (loading)`
4. **Use `class` not `className`** - `<div class={styles.container}>`
5. **Store updates** - Use path notation: `setStore("themeTweaks", "cssProperties", propertyName, "value", color)`

**Code Quality:**
- Run `npm run format` before committing (Biome formatter)
- Use interfaces for props, explicit return types for complex functions
- Use `as const` for literal type arrays


## Quick Reference

### Most Common Tasks

```bash
# Development
npm run dev              # Start dev server

# Code Quality
npm run format           # Format code before commit
npm run compile          # Type-check
```

### Key File Locations

- **State management:** `src/entrypoints/content/theme-state.ts`
- **Popup UI root:** `src/components/ThemeEditor/ThemeEditor.tsx`
- **Storage operations:** `src/lib/storage.ts`
- **Add properties:** `src/constants/properties.ts`
- **Add derivations:** `src/constants/derived-colors.ts`
- **Message protocols:** `src/entrypoints/*/protocol.ts`

