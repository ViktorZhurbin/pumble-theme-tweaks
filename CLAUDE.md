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
| `src/views/theme-editor/ThemeEditor.tsx` | Popup UI root. Initializes connection, syncs state, provides ThemeEditorContext | Changing popup UI structure or initialization |
| `src/views/theme-editor/helpers.ts` | Popup initialization helpers (getContentScriptState, initializeTab, injectContentScript) | Changing popup startup logic or error handling |
| `src/context/ThemeEditorContext.tsx` | SolidJS context providing shared state access (`store`, `setStore`, `tabId`, `isReady`) to all theme editor components | Adding or modifying shared UI state |
| `src/lib/messages/createMessenger.ts` | Generic type-safe message handler factory | Changing message passing infrastructure |
| `src/lib/storage.ts` | Storage operations facade. Handles persistence, migration, CRUD | Adding storage operations or changing storage format |
| `src/lib/import-export.ts` | Import/export utilities for color configurations | Adding import/export functionality |
| `src/lib/logger.ts` | Logging utility with dev/prod filtering | Debugging and monitoring |
| `src/lib/url.ts` | URL validation utilities (isPumbleUrl) | Validating Pumble URLs |
| `src/entrypoints/content/dom-utils.ts` | DOM manipulation (applyCSSProperty, resetCSSTweaks, getCurrentTheme) | Changing how CSS is applied or theme detection |
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
  savedPresets: Record<string, StoredPreset>;  // All saved presets
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
- Popup → Content Script: Direct via `ContentScript.sendMessage("method", data, tabId)`
  - Methods: `updateWorkingProperty`, `toggleWorkingProperty`, `loadPreset`, `savePreset`, `savePresetAs`, `deletePreset`, `renamePreset`, etc.
- Content Script → Popup: Broadcast via `Background.sendMessage("stateChanged", { state, tabId })`
- Popup listens via: `Background.onMessage("stateChanged", handler)`

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
- **Context** - Use `createContext` for prop drilling avoidance (see `src/context/ThemeEditorContext.tsx`)

**Context Pattern in This Project:**
```typescript
// Create context (src/context/ThemeEditorContext.tsx)
const ThemeEditorContext = createContext<ThemeEditorContextValue>();

// Provide context (src/views/theme-editor/ThemeEditor.tsx)
<ThemeEditorContext.Provider value={{ store, setStore, tabId, isReady }}>
  {props.children}
</ThemeEditorContext.Provider>

// Consume context in any child component
const { store, setStore, tabId, isReady } = useThemeEditorContext();
// Note: tabId and isReady are Accessor functions (signals), call with tabId(), isReady()
```

**Key Conventions:**
- Signals must be called as functions: `loading()` not `loading`
- Use `class` not `className` for JSX attributes
- Store updates via path notation, never direct mutation

---

## Styling

- **Primary**: Tailwind CSS + daisyUI component classes
- **CSS Modules**: Legacy approach, mostly removed (only `ColorPicker.module.css` remains)
- **CSS Variables**: Defined in `src/entrypoints/popup/styles.css` for root-level design tokens
- Always prefer Tailwind utility classes over custom CSS
- Specify individual transition properties (never `transition: all`)

---

## Reusable Component Systems

### Dialog System
Located in `src/components/dialog/`, provides:
- `useDialogs()` hook for confirm and input dialogs
- `<DialogProvider>` wrapper (used in App.tsx)
- Standardized dialog UI with `DialogWrapper`, `DialogHeader`, `DialogContent`, `DialogActions`

**Usage:**
```typescript
const dialogs = useDialogs();

// Confirm dialog
const confirmed = await dialogs.confirm({
  title: "Delete Preset?",
  message: "This action cannot be undone."
});

// Input dialog
const input = await dialogs.input({
  title: "Rename Preset",
  placeholder: "Enter new name",
  initialValue: currentName
});
```


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
- **DOM manipulation:** `src/entrypoints/content/dom-utils.ts`
- **Popup UI root:** `src/views/theme-editor/ThemeEditor.tsx`
- **Popup helpers:** `src/views/theme-editor/helpers.ts`
- **UI Context:** `src/context/ThemeEditorContext.tsx`
- **Dialog system:** `src/components/dialog/`
- **Storage operations:** `src/lib/storage.ts`
- **Import/Export:** `src/lib/import-export.ts`
- **Logger:** `src/lib/logger.ts`
- **Add properties:** `src/constants/properties.ts`
- **Add derivations:** `src/constants/derived-colors.ts`
- **Message protocols:** `src/entrypoints/*/protocol.ts`

### Directory Organization

```
src/
├── components/
│   ├── dialog/          # Dialog system (confirm, input dialogs)
│   ├── Dropdown/        # Dropdown select component
│   ├── icons/           # SVG icon components
│   └── App.tsx          # Root app component
├── context/             # SolidJS context providers
│   └── ThemeEditorContext.tsx
├── views/               # Feature-specific view components
│   └── theme-editor/    # Theme editor UI
│       ├── presets/     # Preset management components
│       ├── tweaks/      # Color picker and tweak components
│       └── helpers.ts   # Initialization and connection helpers
├── entrypoints/         # Extension entry points
│   ├── content/         # Content script (runs in Pumble page)
│   ├── popup/           # Popup UI entry point
│   └── background/      # Background service worker
├── lib/                 # Utility libraries and helpers
│   ├── messages/        # Message passing utilities
│   ├── storage.ts       # Browser storage facade
│   ├── import-export.ts # Config import/export
│   ├── logger.ts        # Logging utility
│   ├── url.ts           # URL utilities
│   └── utils.ts         # General utilities
├── constants/           # Configuration constants
│   ├── properties.ts    # Customizable CSS properties
│   ├── derived-colors.ts # Color derivation rules
│   └── pumble-urls.ts   # URL patterns
└── types/               # TypeScript type definitions
    ├── runtime.ts       # Runtime state types
    └── tweaks.ts        # Tweak and preset types
```

