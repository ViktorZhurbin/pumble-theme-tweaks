# Instructions

## General

- when applying changes, make sure to update CLAUDE.md as needed

## SolidJS
- Use arrow functions to define components (NOT function notation)

## CSS

### General Rules
- **Never use `transition: all`** - always specify individual properties (e.g., `transition: background 0.2s ease, opacity 0.2s ease`)
- Use Tailwind's and daisyUI classes

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

