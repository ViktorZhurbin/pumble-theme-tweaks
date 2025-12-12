# Pumble Tweaks - Development Guide

> Quick reference for AI assistants working on the Pumble Tweaks browser extension.

## Table of Contents

1. [Coding Rules & Conventions](#coding-rules--conventions)
   - [SolidJS](#solidjs-not-react)
   - [TypeScript & General](#typescript--general)
   - [Styling](#styling)
   - [Testing](#testing)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Key Files](#key-files)
5. [State Management](#state-management)
6. [User Flows](#user-flows)
7. [Messaging System](#messaging-system)
8. [Component Patterns (SolidJS)](#component-patterns-solidjs)
9. [Reusable Systems](#reusable-systems)
10. [Quick Reference](#quick-reference)

---

## Coding Rules & Conventions

### SolidJS (NOT React!)
- **Components run ONCE** - no re-renders, fine-grained reactivity
- Use arrow functions: `export const MyComponent = () => { ... }`
- Signals are functions: `loading()` not `loading`
- Use `class` not `className` in JSX
- Store updates via path notation: `setStore("path", "to", "property", value)`
- **createMemo**: Only for expensive computations - simple store access is already reactive
  - ✅ `const value = () => ctx.store.property` (reactive, no memo needed)
  - ❌ `const value = createMemo(() => ctx.store.property)` (unnecessary)
- **Naming conventions for functions**:
  - ✅ **"use" prefix for hooks** - Functions that call other hooks (context, signals, etc.) and/or return reactive accessors
    - `useThemeEditorContext()` - Context hook
    - `useWorkingTweak()` - Custom hook that returns reactive accessor
    - `useSelectedPreset()` - Custom hook that returns reactive accessor
    - `useBaseValue()` - Custom hook that calls other hooks and returns accessor
  - ✅ **No "use" prefix for pure helpers** - Functions with no hooks, no reactivity
    - `getBaseValue(...)` - Pure helper function (takes params, returns value)
    - `computeCssProperties(...)` - Pure utility function
  - 🔑 **Key rule**: If it calls hooks or returns an accessor `() => value`, use "use" prefix

### TypeScript & General
- No non-null assertions: `value?.property ?? fallback` not `value!.property`
- No `createElement` - use JSX only
- Use interfaces for props
- Always update CLAUDE.md when making architectural changes
- Run `npm run format` before committing (Biome)

### Styling
- **Primary**: Tailwind CSS + daisyUI classes
- **Never** use `transition: all` - specify properties: `transition: background 0.2s ease`
- Prefer Tailwind utilities over custom CSS

### Testing
After making changes to code:
- **ALWAYS run tests** `npm test`
- **Run type checking** `npm run compile`
- **Update CLAUDE.md** to make sure the docs are up to date

- Write tests for new features alongside implementation
- Update existing tests when modifying behavior
- Test utilities available in `src/test/test-utils.ts`
- Quick test commands:
  - `npm test` - Run all tests once
  - `npm run test:watch` - Run tests in watch mode
  - `npm run test:ui` - Open Vitest UI
  - `npm run test:coverage` - Generate coverage report

---

## Project Overview

**Pumble Tweaks** - Browser extension for real-time customization of Pumble web app colors.

### Features
- Real-time CSS color customization
- Auto-derived color variants (darker/lighter)
- **Preset-based management** - save/load/switch named color schemes
- **Global tweaks** - colors persist across Pumble theme changes
- **Unsaved changes tracking** - visual indicator for working state
- Master enable/disable toggle
- Import/export configurations
- Multi-tab synchronization
- Live preview with debounced persistence (500ms)

### Tech Stack
- **Framework:** SolidJS (fine-grained reactivity)
- **Language:** TypeScript
- **Build:** WXT (Vite-based extension framework)
- **Styling:** Tailwind CSS + daisyUI
- **Color:** colord
- **Quality:** Biome v2

---

## Architecture

### Three-Process Extension

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Popup Script   │────▶│ Background Script│────▶│ Content Script  │
│ (extension UI)  │◀────│   (router/badge) │◀────│  (Pumble page)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
      │                                                    │
      └────────────── Type-safe Messages ─────────────────┘
```

**Content Script** - Single source of truth
- Runs in Pumble page context
- Manages DOM manipulation and state
- Watches theme changes (MutationObserver)

**Popup Script** - User interface
- Extension UI with color pickers
- Sends commands, listens for state changes

**Background Script** - Message router
- Routes messages between popup/content
- Updates badge (ON/OFF)

### Core Patterns
- **Type-Safe Messaging**: `createMessenger<Protocol>()` for strongly-typed IPC
- **Single Source of Truth**: `ThemeState` in content script
- **Preset Storage**: Browser sync storage, debounced writes (500ms)

---

## Key Files

| File | Purpose | When to Modify |
|------|---------|----------------|
| `src/entrypoints/content/theme-state.ts` | Core state manager - DOM, storage, broadcasting | State logic, application |
| `src/entrypoints/content/theme-watcher.ts` | MutationObserver for theme detection | Theme detection |
| `src/entrypoints/content/dom-utils.ts` | DOM manipulation (CSS apply/reset) | CSS methods |
| `src/views/theme-editor/ThemeEditor.tsx` | Popup UI root | UI structure |
| `src/context/ThemeEditorContext.tsx` | SolidJS context provider | Shared UI state |
| `src/components/Dialog/` | Dialog system | Dialog behavior |
| `src/lib/storage.ts` | Storage facade | Storage operations |
| `src/lib/import-export.ts` | Import/export utilities | Import/export features |
| `src/lib/messages/createMessenger.ts` | Message factory | IPC infrastructure |
| `src/constants/properties.ts` | **Customizable CSS properties + derivation rules** | **Add/remove properties** |
| `src/lib/color-derivation.ts` | Color derivation utilities | Helper functions |

---

## State Management

### Runtime State (Content Script)
```typescript
interface RuntimeState {
  tweaksOn: boolean;                 // Master toggle
  workingTweaks: WorkingTweaks;      // Current unsaved state
  selectedPreset: string | null;     // Active preset
  savedPresets: StoredPresets;
  hasUnsavedChanges: boolean;        // Working ≠ saved?
}
```

### Key Concepts
- **Global Tweaks**: Colors NOT tied to Pumble theme - persist across theme switches
- **Working State**: Unsaved modifications with live preview
- **Presets**: Named snapshots for save/load/switch
- **Unsaved Changes**: Automatic tracking via comparison

### Technical Data Flow
- **Color Change**: Popup → Content applies CSS + derives colors → Broadcasts → Debounced write (500ms)
- **Save Preset**: Updates selected preset → `hasUnsavedChanges = false`
- **Load Preset**: Loads into working state → Applies to DOM → `hasUnsavedChanges = false`
- **Reset**: Context-aware (revert to preset OR clear to defaults)
- **Theme Detection**: Auto-disables tweaks when Pumble theme changes
- **Multi-Tab Sync**: Write to storage → All tabs receive `onChanged` → Re-apply

### Color Derivation Architecture

**Single Source of Truth**: `COLOR_PICKERS_MAP` in `src/constants/properties.ts` defines all properties and their derivation rules inline.

```typescript
type PropertyItem = {
  label: string;
  /** Storage key for the picker value (opaque base color) */
  id: string;
  /**
   * CSS properties to compute from this picker value.
   * ALWAYS defined - at minimum includes identity transform for the base property.
   */
  cssProperties: CssPropertyConfig[];
};

type CssPropertyConfig = {
  propertyName: string; // CSS property name
  derive: (baseColor: string) => string; // Transform function
};

export const COLOR_PICKERS_MAP: Record<string, PropertyItem> = {
  "--left-nav-text-high": {
    label: "Sidebar text",
    id: "--left-nav-text-high", // Storage key for opaque picker value
    cssProperties: [
      { propertyName: "--left-nav-hover", derive: (base) => colord(base).alpha(0.22).toRgbString() },
      { propertyName: "--left-nav-selected", derive: (base) => colord(base).alpha(0.34).toRgbString() },
      // Base property derives itself with alpha for actual CSS
      { propertyName: "--left-nav-text-high", derive: (base) => colord(base).alpha(0.87).toRgbString() },
      // ... more derived colors
    ]
  },
  "left-nav-content": {
    label: "Top & sidebar",
    id: "left-nav-content", // Storage key for opaque picker value
    cssProperties: [
      // Identity transform - picker value applied as-is
      { propertyName: "--palette-secondary-main", derive: (base) => base },
      // Plus derived variants
      { propertyName: "--palette-secondary-dark", derive: (base) => colord(base).darken(0.2).toRgbString() },
      { propertyName: "--palette-secondary-light", derive: (base) => colord(base).lighten(0.2).toRgbString() },
    ]
  }
};
```

**Key Concepts**:
- **Picker IDs = Storage Keys** (4 total): Opaque HEX colors stored in state/storage for color pickers ONLY
- **CSS Properties = Computed Values** (15 total): Always computed on-the-fly from picker values, applied to DOM
- **Storage Model**: Store ONLY picker values (opaque HEX) → Compute CSS properties when applying to DOM
- **Consistent Pattern**: ALL controls have `cssProperties` array:
  - **With transforms** (e.g., `--left-nav-text-high`): Applies alpha/color transformations
  - **Identity only** (e.g., `--background`): Picker value applied as-is via `(base) => base`
  - **Identity + derived** (e.g., `--palette-secondary-main`): Base as-is + darker/lighter variants

**Benefits**:
- **No format mismatches**: Working and saved states have identical structure (picker values only)
- **75% smaller storage**: 4 picker values vs 15 total CSS properties
- **Consistent architecture**: No conditional logic - ALL properties go through same derivation flow
- **Single source of truth**: Base picker values never diverge from presets
- **Simpler comparisons**: Direct HEX comparison for unsaved changes detection

**Utilities**: `src/lib/color-derivation.ts` provides helpers:
- `computeCssProperties(pickerId, pickerValue)` - Returns all CSS properties computed from picker value
- `getCssPropertyNames(pickerId)` - Returns list of all CSS property names for a picker

---

## User Flows

### 1. First-Time User Creates Preset
1. Opens extension → "No Preset Selected" + Pumble defaults
2. Adjusts colors → live preview + "Unsaved changes" indicator
3. Clicks "+ New" → clears working state
4. Clicks "Save As" → names preset → saved and selected

### 2. Switch Between Presets
1. Has "Dark Blue" selected + unsaved changes
2. Selects "High Contrast" from dropdown
3. Confirmation: "Unsaved changes - switch anyway?"
4. Confirms → loads High Contrast, unsaved lost

### 3. Edit and Save Existing Preset
1. Selects "Dark Blue" preset
2. Tweaks sidebar color → amber "Save Changes" dot appears
3. Clicks "Save Changes" → preset updated, dot disappears

### 4. Test Pumble Themes
1. Has custom colors applied (tweaks ON)
2. Switches Pumble theme (light → dark)
3. **Extension auto-disables tweaks** (badge: "OFF")
4. User sees actual Pumble theme
5. Re-enables tweaks → custom colors reapply

### 5. Context-Aware Reset
**Preset selected**: Reset reverts to saved preset values
**No preset**: Reset clears to Pumble defaults

Example:
- Loads "Dark Blue" preset (sidebar: #334455)
- Changes to #FF0000
- Clicks reset → reverts to #334455 (NOT Pumble default)

---

## Messaging System

Type-safe IPC using `createMessenger<Protocol>()`.

```typescript
// Protocol definition
interface ContentProtocol {
  updateProperty: { propertyName: string; value: string };
  getState: void;
}

// Usage
await ContentScript.sendMessage("updateProperty", { propertyName, value }, tabId);
```

**Message Flow**:
- Popup → Content: `ContentScript.sendMessage(method, data, tabId)`
- Content → Popup: `Background.sendMessage("stateChanged", { state, tabId })`
- Popup listens: `Background.onMessage("stateChanged", handler)`

---

## Component Patterns (SolidJS)

### Reactivity Model

| Concept | SolidJS | React |
|---------|---------|-------|
| **Component execution** | **Once** | Every update |
| **Re-rendering** | **No re-renders** | Full re-render |
| **Reactivity** | Property-level | Component-level |

### State Primitives
```typescript
// Signals
const [count, setCount] = createSignal(0);
count() // Access as function

// Stores
const [store, setStore] = createStore({ user: { name: "Alice" } });
setStore("user", "name", "Bob"); // Path notation

// Memos (use sparingly!)
const doubled = createMemo(() => count() * 2); // Only for expensive ops
const value = () => ctx.store.property; // ✅ Simple - no memo needed

// Context
const ctx = useThemeEditorContext();
// ctx.store (store), ctx.tabId() (signal), ctx.isReady() (signal)
```

### Custom Hooks (Reusable Logic)

**Custom hooks encapsulate logic that calls other hooks and/or returns reactive accessors:**

```typescript
// ✅ Custom hook that returns reactive accessor
function useWorkingTweak(propertyName: string) {
  const ctx = useThemeEditorContext();  // Calls context hook
  return () => ctx.store.workingTweaks?.cssProperties[propertyName];  // Returns accessor
}

// ✅ Custom hook that calls other hooks and returns accessor
function useBaseValue(propertyName: string) {
  const ctx = useThemeEditorContext();  // Calls context hook
  const tweakEntry = useWorkingTweak(propertyName);  // Calls another custom hook
  const selectedPreset = useSelectedPreset();  // Calls another custom hook

  // Returns accessor that recomputes on every access
  return () => {
    if (!ctx.store.selectedPreset) {
      return tweakEntry()?.initialValue ?? "";
    }
    return selectedPreset()?.cssProperties[propertyName]?.value
           ?? tweakEntry()?.initialValue
           ?? "";
  };
}

// ✅ Usage in component
const MyComponent = (props) => {
  const tweakEntry = useWorkingTweak(props.name);  // Hook at top level
  const baseValue = useBaseValue(props.name);  // Hook at top level

  return <div>{tweakEntry()?.value ?? baseValue()}</div>;
};
```

**Key Points:**
- ✅ Custom hooks can call other hooks freely (no React "rules of hooks" in SolidJS)
- ✅ Custom hooks should return accessors `() => value` for reactivity
- ✅ Call hooks at component top-level for best performance
- ✅ Accessor must recompute reactive dependencies on every call

### Common Patterns

```typescript
// ✅ Reactive accessor (no memo needed)
const isModified = () => {
  const entry = ctx.store.workingTweaks?.cssProperties[props.name];
  return entry?.value !== entry?.initialValue;
};

// ✅ Pure helper function (no hooks, no "use" prefix)
function getBaseValue(name, preset, presets, initial) {
  if (!preset) return initial;
  return presets[preset]?.cssProperties[name]?.value ?? initial;
}

// ✅ Combining both
const baseValue = () => getBaseValue(
  props.name,
  ctx.store.selectedPreset,
  ctx.store.savedPresets,
  entry()?.initialValue
);
```

### Context Pattern
```typescript
// Create context
const ThemeEditorContext = createContext<Value>();

// Provide
<ThemeEditorContext.Provider value={{ store, setStore, tabId, isReady }}>
  {props.children}
</ThemeEditorContext.Provider>

// Consume
const ctx = useThemeEditorContext();
```

---

## Reusable Systems

### Dialog System
Location: `src/components/Dialog/`

```typescript
const dialogs = useDialogs();

// Confirm
const ok = await dialogs.confirm({
  title: "Delete?",
  message: "Cannot undo",
  confirmText: "Delete",
  confirmType: "error"
});

// Input
const name = await dialogs.input({
  title: "Rename",
  placeholder: "Name",
  defaultValue: current,
  validate: (v) => v ? null : "Required"
});
```

### Notification System
Location: `src/components/notification/`

Fire-and-forget toast notifications with auto-dismiss (5s default). Bottom-right positioning, supports stacking.

```typescript
const notifications = useNotifications();

// Show notifications (auto-dismiss after 5 seconds)
notifications.success("Preset copied to clipboard!");
notifications.error("Failed to save preset");
notifications.info("Loading data...");
notifications.warning("Unsaved changes");

// Custom duration (milliseconds)
notifications.success("Message", 3000);
```

**Pattern**: Follows DialogProvider architecture (context provider + hook). Unlike dialogs, notifications are non-blocking and don't return promises.

### Dropdown Component
Location: `src/components/Dropdown/`

```typescript
<Dropdown
  trigger={{ content: "•••", class: "btn btn-sm" }}
  items={[
    { type: "item", label: "Edit", onClick: handleEdit },
    { type: "divider" },
    { type: "item", label: "Delete", onClick: handleDelete, variant: "error" }
  ]}
/>
```

---

## Quick Reference

### Commands
```bash
npm run dev       # Start dev server
npm run build     # Build extension
npm run format    # Format (Biome)
npm run compile   # Type-check
npm test.         # Run tests
```

### Critical Files
- **Add property + derivation**: `src/constants/properties.ts` (single source for both)
- **State logic**: `src/entrypoints/content/theme-state.ts`
- **UI root**: `src/views/theme-editor/ThemeEditor.tsx`
- **Storage**: `src/lib/storage.ts`
- **Color utils**: `src/lib/color-derivation.ts`

### Message Protocols
- `src/entrypoints/content/protocol.ts`
- `src/entrypoints/background/protocol.ts`
