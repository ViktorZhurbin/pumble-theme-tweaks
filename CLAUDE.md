# Pumble Tweaks - Development Guide

> Browser extension for real-time Pumble color customization. SolidJS + TypeScript + WXT.

## Critical Rules

### SolidJS (NOT React!)
- **Components run ONCE** - no re-renders, fine-grained reactivity
- Signals are functions: `loading()` not `loading`
- Use `class` not `className` in JSX
- Store updates: `setStore("path", "to", "property", value)`
- **createMemo**: Only for expensive ops - simple store access is already reactive
  - ✅ `const value = () => ctx.store.property` (no memo needed)
  - ❌ `const value = createMemo(() => ctx.store.property)` (unnecessary)
- **Naming**: "use" prefix for hooks (calls other hooks/returns accessor), NOT for pure helpers
  - ✅ `useWorkingTweak()` - calls hooks, returns accessor
  - ✅ `getBaseValue(...)` - pure function, takes params

### TypeScript & Styling
- No non-null assertions: `value?.property ?? fallback` not `value!.property`
- No `createElement` - JSX only
- Tailwind + daisyUI for styling
- **Never** `transition: all` - specify properties: `transition: background 0.2s ease`

### Remember
After making changes:
- Run `npm run format`
- After making changes in src/ folder, run `npm test` and `npm run compile`
- Review CLAUDE.md and update it if necessary

---

## Architecture

### Three-Process Extension
```
Popup (UI) ←→ Background (router) ←→ Content (state + DOM)
```

- **Content Script**: Single source of truth, manages state + DOM, watches Pumble theme changes
- **Popup Script**: UI with color pickers, sends commands
- **Background Script**: Routes messages, updates badge
- **IPC**: Type-safe via `createMessenger<Protocol>()`
- **Storage**: Browser sync storage, debounced writes (500ms)

### Core State (Content Script)
```typescript
interface RuntimeState {
  tweaksOn: boolean;
  workingTweaks: WorkingTweaks;      // Unsaved modifications
  selectedPreset: string | null;
  savedPresets: StoredPresets;
  hasUnsavedChanges: boolean;
}
```

**Data Flow**:
- Color change → Apply to DOM + derive colors → Broadcast → Debounced write (500ms)
- Theme detection → Auto-disable tweaks when Pumble theme changes
- Multi-tab sync → Storage change → All tabs re-apply

---

## Color Derivation (CRITICAL)

**Single source**: `COLOR_PICKERS_MAP` in `src/constants/properties.ts`

```typescript
export const COLOR_PICKERS_MAP: Record<string, PropertyItem> = {
  "--left-nav-text-high": {
    label: "Sidebar text",
    id: "--left-nav-text-high",  // Storage key (opaque HEX)
    cssProperties: [              // Computed on-the-fly
      { propertyName: "--left-nav-hover", derive: (base) => colord(base).alpha(0.22).toRgbString() },
      { propertyName: "--left-nav-text-high", derive: (base) => colord(base).alpha(0.87).toRgbString() },
    ]
  }
};
```

**Key Points**:
- Store ONLY picker values (4 opaque HEX) → Compute CSS properties (15 total) on-the-fly
- ALL controls have `cssProperties` array (identity and/or derived)
- Helpers in `src/lib/color-derivation.ts`:
  - `computeCssProperties(pickerId, pickerValue)` - Returns all CSS properties
  - `getCssPropertyNames(pickerId)` - Returns CSS property names

---

## SolidJS Patterns

### State Primitives
```typescript
const [count, setCount] = createSignal(0);
count() // Access as function

const [store, setStore] = createStore({ user: { name: "Alice" } });
setStore("user", "name", "Bob"); // Path notation

const ctx = useThemeEditorContext();
```

### Custom Hooks
```typescript
// Returns reactive accessor
function useWorkingTweak(propertyName: string) {
  const ctx = useThemeEditorContext();
  return () => ctx.store.workingTweaks?.cssProperties[propertyName];
}

// Pure helper (no hooks)
function getBaseValue(name, preset, presets, initial) {
  if (!preset) return initial;
  return presets[preset]?.cssProperties[name]?.value ?? initial;
}
```

**Rules**:
- Custom hooks can call other hooks freely (unlike React)
- Return accessors `() => value` for reactivity
- Call hooks at component top-level

---

## Key Files

| File | Purpose |
|------|---------|
| `src/constants/properties.ts` | **Color properties + derivation rules** |
| `src/entrypoints/content/theme-state.ts` | Core state manager |
| `src/entrypoints/content/dom-utils.ts` | DOM manipulation |
| `src/views/theme-editor/ThemeEditor.tsx` | Popup UI root |
| `src/context/ThemeEditorContext.tsx` | SolidJS context |
| `src/lib/storage.ts` | Storage facade |
| `src/lib/color-derivation.ts` | Color derivation utilities |
| `src/lib/import-export.ts` | Import/export |
| `src/entrypoints/content/protocol.ts` | Content IPC protocol |
| `src/entrypoints/background/protocol.ts` | Background IPC protocol |

---

## UI Patterns

### Two-Button Reset System
Each color row has TWO reset buttons:
1. **Reset to Default** (ResetIcon) → Pumble's original theme color (initialValue)
2. **Revert to Preset** (UndoIcon) → Last saved preset value (only visible with preset selected)

Plus header **Revert All** button → Discards all unsaved changes

### Dialog System
```typescript
const dialogs = useDialogs();
const ok = await dialogs.confirm({ title: "Delete?", confirmType: "error" });
const name = await dialogs.input({ title: "Rename", validate: (v) => v ? null : "Required" });
```

### Notifications
```typescript
const notifications = useNotifications();
notifications.success("Preset copied!");
notifications.error("Failed to save");
```

### Dropdown
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
npm test          # Run tests
```

### Message Flow
- Popup → Content: `ContentScript.sendMessage(method, data, tabId)`
- Content → Popup: `Background.sendMessage("stateChanged", { state, tabId })`
- Popup listens: `Background.onMessage("stateChanged", handler)`
