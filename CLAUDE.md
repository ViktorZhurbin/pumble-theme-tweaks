# Instructions

## CSS
- **Never use `transition: all`** - always specify individual properties (e.g., `transition: background 0.2s ease, opacity 0.2s ease`)
- **Never set font-size in CSS** - use the Typography component with appropriate variants (`caption`, `default`, `body`, `title`, etc.)
- **Use px for all sizing/spacing** - only Typography component uses rem internally
- **Use CSS variables** for colors, spacing, and other design tokens (e.g., `var(--spacing-md)`, `var(--color-accent)`)

## Typography Component
- Use `<Typography variant="caption">` for small text (0.8125rem)
- Use `<Typography>` or `<Typography variant="default">` for normal text (0.875rem)
- Use `<Typography variant="body">` for body text (1rem)
- Never pass `variant="default"` - it's the default value
- Wrap button text, labels, and UI text in Typography components

##

# Pumble Tweaks - Architecture Documentation

> **Estimated Reading Time:** 15-20 minutes for full read, 2-3 minutes for quick reference

This document provides comprehensive architectural documentation for the Pumble Tweaks browser extension. It serves as persistent knowledge to avoid repetitive codebase exploration across sessions.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Structure](#architecture--structure)
3. [Key Files Reference](#key-files-reference)
4. [State Management & Data Flow](#state-management--data-flow)
5. [Messaging System](#messaging-system)
6. [Component Patterns (SolidJS)](#component-patterns-solidjs)
7. [Styling Conventions](#styling-conventions)
8. [Development Workflows](#development-workflows)
9. [Build System](#build-system)
10. [Important Implementation Details](#important-implementation-details)
11. [Code Quality & Conventions](#code-quality--conventions)
12. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Project Overview

**Pumble Tweaks** is a cross-browser extension that enables real-time customization of the Pumble web application's appearance through CSS color property modifications.

### What It Does
- Customizes 4 main CSS color properties (top bar, sidebar, create button, sidebar text)
- Automatically derives related color variants (darker/lighter versions)
- Per-theme customization (separate settings for dark/light themes)
- Global enable/disable toggle
- Import/export color configurations
- Instant live preview with browser storage sync

### Tech Stack
- **Framework:** SolidJS 1.9 (fine-grained reactivity, no virtual DOM)
- **Language:** TypeScript 5.9
- **Extension Framework:** WXT 0.20 (Vite-based cross-browser extension wrapper)
- **Styling:** CSS Modules with custom CSS variables
- **Color Manipulation:** colord 2.9
- **Code Quality:** Biome 2.3 (formatter + linter with SolidJS support)

### Browser Compatibility
- Chrome
- Firefox
- Safari
- Edge

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

### Core Architectural Patterns

#### 1. Type-Safe Messaging System
Generic `createMessenger<Protocol>()` factory creates strongly-typed message senders/receivers:

```typescript
// Define protocol interface
interface MyProtocol {
  updateProperty: { propertyName: string; value: string; enabled: boolean };
  getState: void;
}

// Create messenger
const { sendMessage, onMessage } = createMessenger<MyProtocol>();

// Type-safe usage
await sendMessage("updateProperty", {
  propertyName: "--top-bar-bg",
  value: "#ff0000",
  enabled: true
});
```

#### 2. Single Source of Truth
- `ThemeState` class in content script owns runtime state
- All state changes broadcast to popup and persist to browser.storage
- Popup listens and updates reactively

#### 3. Storage Architecture
- Browser sync storage persists per-theme customizations
- Format: `theme_tweaks[themeName].cssProperties[propertyName] = { value, enabled }`
- Debounced writes (500ms) for performance
- Automatic migration for backward compatibility

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

## State Management & Data Flow

### RuntimeState (Ground Truth)

The runtime state lives in the content script and represents the current state of tweaks applied to the page:

```typescript
interface RuntimeState {
  themeName: string | null;           // Current detected theme ("dark" | "light")
  themeTweaksOn: boolean;             // Extension active for this theme
  themeTweaks: ThemeTweaks;           // All properties with values + initial states
  isExtensionOff: boolean;            // Global master switch
}
```

### ThemeTweaks Structure

```typescript
interface ThemeTweaks {
  disabled: boolean;                   // Per-theme disable flag
  cssProperties: {
    [propertyName: string]: {
      value: string | null;            // User's custom color (null = not tweaked)
      initialValue: string;            // Original DOM color (for reset)
      enabled: boolean;                // Property-level toggle
    }
  }
}
```

### Storage Format (Persistent)

```typescript
// browser.storage.sync format
{
  theme_tweaks: {
    [themeName: string]: {
      disabled: boolean,
      cssProperties: {
        [propertyName: string]: {
          value: string,               // Only stores if customized
          enabled: boolean
        }
      }
    }
  },
  global_disabled: boolean
}
```

### Data Flow: Color Change

```
1. User adjusts color in popup ColorPicker
   ↓
2. Popup sends "updateProperty" message to content script
   await sendToContent({
     type: "updateProperty",
     data: { propertyName, value, enabled }
   })
   ↓
3. Content script ThemeState.updateProperty():
   - Applies CSS to DOM immediately (instant feedback)
   - Applies derived colors (darker/lighter variants)
   - Updates internal state
   - Broadcasts "stateChanged" back to popup
   - Debounces storage write (500ms delay)
   ↓
4. Storage write triggers browser.storage.onChanged listener
   ↓
5. Content script re-applies from storage to ensure sync
```

### Data Flow: Theme Detection

```
1. Page loads → content script runs
   ↓
2. DomUtils.getCurrentTheme() reads html element classes
   ↓
3. Looks for "dark" or "light" in class names
   ↓
4. Calls ThemeState.applyForTheme(themeName)
   ↓
5. Loads saved tweaks from storage for that theme
   ↓
6. Applies CSS properties to DOM
```

### Data Flow: Multi-Tab Sync

```
Tab 1: User changes color in popup
   ↓
Content script writes to browser.storage.sync
   ↓
browser.storage.onChanged fires in ALL tabs
   ↓
Content script in Tab 2 receives change event
   ↓
Tab 2 re-applies tweaks from storage
   ↓
All tabs now show the same colors
```

### State Update Example

```typescript
// In popup component
const handleColorChange = (propertyName: string, newColor: string) => {
  // Update local store optimistically
  setStore("themeTweaks", "cssProperties", propertyName, {
    value: newColor,
    enabled: true
  });

  // Send to content script for DOM update
  sendToContent({
    type: "updateProperty",
    data: { propertyName, value: newColor, enabled: true }
  });
};
```

---

## Messaging System

### How createMessenger Works

The `createMessenger` factory provides type-safe message passing between extension contexts (popup ↔ content ↔ background).

```typescript
// src/lib/messages/createMessenger.ts

// 1. Define protocol interface
interface ContentProtocol {
  updateProperty: { propertyName: string; value: string; enabled: boolean };
  getState: void;
  resetProperty: { propertyName: string };
}

// 2. Create messenger in popup
const { sendMessage } = createMessenger<ContentProtocol>();

// 3. Send type-safe messages
const response = await sendMessage("updateProperty", {
  propertyName: "--top-bar-bg",
  value: "#ff0000",
  enabled: true
});

// 4. Handle messages in content script
const { onMessage } = createMessenger<ContentProtocol>();

onMessage("updateProperty", async (data) => {
  const { propertyName, value, enabled } = data;
  themeState.updateProperty(propertyName, value, enabled);
  return { success: true };
});
```

### Protocol Pattern

Each entrypoint defines its protocol:

```typescript
// src/entrypoints/content/protocol.ts (messages TO content script)
export interface ContentScriptProtocol {
  getState: void;
  updateProperty: { propertyName: string; value: string; enabled: boolean };
  resetProperty: { propertyName: string };
  disableProperty: { propertyName: string };
  setDisabled: { disabled: boolean };
}

// src/entrypoints/background/protocol.ts (messages FROM background)
export interface BackgroundProtocol {
  stateChanged: RuntimeState;  // Broadcast from content → popup
}
```

### Message Flow

```
Popup → Content Script (direct)
  sendToContent("updateProperty", { ... })

Content Script → Popup (broadcast via background)
  broadcast("stateChanged", runtimeState)
  ↓
  Background receives and routes to all listening popups
```

### Example: Implementing a New Message Type

```typescript
// 1. Add to protocol interface
interface ContentScriptProtocol {
  // ... existing
  toggleAllProperties: { enabled: boolean };  // NEW
}

// 2. Implement handler in content script
onMessage("toggleAllProperties", async (data) => {
  const { enabled } = data;
  Object.keys(themeState.themeTweaks.cssProperties).forEach((propertyName) => {
    themeState.updateProperty(propertyName, null, enabled);
  });
  return { success: true };
});

// 3. Call from popup
await sendToContent({
  type: "toggleAllProperties",
  data: { enabled: false }
});
```

---

## Component Patterns (SolidJS)

### Fine-Grained Reactivity Principles

SolidJS uses fine-grained reactivity, which differs fundamentally from React:

| Concept | SolidJS | React |
|---------|---------|-------|
| **Component execution** | Runs **once** | Re-runs on every state change |
| **Re-rendering** | **No re-renders** | Full component re-render |
| **Reactivity** | Property-level tracking | Component-level tracking |
| **Updates** | Direct DOM updates | Virtual DOM diffing |

### When to Use What

#### createSignal - Simple State

Use for discrete, independent values:

```typescript
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// Update
setLoading(true);

// Access (tracks dependency)
if (loading()) {
  return <div>Loading...</div>;
}
```

#### createStore - Nested State

Use for object-shaped state with nested updates:

```typescript
const [store, setStore] = createStore({
  themeName: "dark",
  themeTweaks: {
    cssProperties: {
      "--top-bar-bg": { value: "#ff0000", enabled: true }
    }
  }
});

// Nested update (only updates specific property)
setStore("themeTweaks", "cssProperties", "--top-bar-bg", "value", "#00ff00");

// Access (tracks only accessed properties)
const topBarColor = store.themeTweaks.cssProperties["--top-bar-bg"].value;
```

#### createMemo - Derived Values

Use for computed values that depend on reactive sources:

```typescript
const isReady = createMemo(() => {
  return !loading() && error() === null && store.themeName !== null;
});

// Access (automatically updates when dependencies change)
if (isReady()) {
  // ...
}
```

### Context Usage Pattern

ThemeEditor uses context to avoid prop drilling:

```typescript
// src/components/ThemeEditor/ThemeEditorContext.tsx

// 1. Create context
const ThemeEditorContext = createContext<ThemeEditorContextValue>();

// 2. Provide context
<ThemeEditorContext.Provider value={{ tabId, store, setStore, isReady }}>
  <PickersContainer />
</ThemeEditorContext.Provider>

// 3. Consume context
const ColorPicker = (props: { propertyName: string }) => {
  const { store, setStore, tabId } = useThemeEditorContext();

  const handleChange = (newColor: string) => {
    setStore("themeTweaks", "cssProperties", props.propertyName, "value", newColor);
  };

  return (
    <input
      type="color"
      value={store.themeTweaks.cssProperties[props.propertyName].value}
      onInput={(e) => handleChange(e.currentTarget.value)}
    />
  );
};
```

### Component Example with Best Practices

```typescript
import { createSignal, createMemo } from "solid-js";
import styles from "./MyComponent.module.css";

interface MyComponentProps {
  initialCount: number;
}

const MyComponent = (props: MyComponentProps) => {
  // Component runs ONCE, this line executes ONCE
  console.log("Component mounted");

  // State
  const [count, setCount] = createSignal(props.initialCount);

  // Derived value (memoized)
  const doubled = createMemo(() => count() * 2);

  // Event handler (normal function, not recreated)
  const increment = () => setCount((prev) => prev + 1);

  // JSX returned ONCE, but reactive values auto-update DOM
  return (
    <div class={styles.container}>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};

export default MyComponent;
```

---

## Styling Conventions

### CSS Modules

Every component has a corresponding `.module.css` file:

```typescript
// Component.tsx
import styles from "./Component.module.css";

const Component = () => {
  return <div class={styles.container}>Content</div>;
};
```

```css
/* Component.module.css */
.container {
  padding: 16px;
  background-color: var(--color-bg-primary);
}
```

### CSS Variables System

Global CSS variables defined in `src/app/shared.css`:

```css
:root {
  /* Colors */
  --color-bg-primary: #1e1e1e;
  --color-bg-secondary: #2d2d2d;
  --color-text-primary: #ffffff;
  --color-text-secondary: #b3b3b3;
  --color-accent: #0066ff;
  --color-error: #ff4444;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  /* Typography */
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;

  /* Border */
  --radius-md: 6px;
}
```

### Dark Mode Compatibility

```css
/* Automatic dark mode support */
:root {
  color-scheme: light dark;
}

/* Use semantic variables, not hard-coded colors */
.button {
  background-color: var(--color-bg-primary);  /* ✓ Adapts to theme */
  color: #ffffff;                              /* ✗ Hard-coded */
}
```

### Example Component with Styling

```typescript
// Button.tsx
import { JSX } from "solid-js";
import styles from "./Button.module.css";

interface ButtonProps {
  variant?: "primary" | "secondary" | "error";
  onClick?: () => void;
  children: JSX.Element;
}

const Button = (props: ButtonProps) => {
  const variant = () => props.variant ?? "primary";

  return (
    <button
			type="button"
			class={`${styles.button} ${styles[variant]} ${local.class ?? ""}`}
		>
			<Typography variant="caption">{local.children}</Typography>
		</button>
  );
};

export default Button;
```

```css
/* Button.module.css */
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary {
  background-color: var(--color-accent);
  color: white;
}

.secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.error {
  background-color: var(--color-error);
  color: white;
}
```

---

## Development Workflows

### Common Development Tasks

```bash
# Start development server with hot reload
npm run dev              # Chrome (default)
npm run dev:firefox      # Firefox

# Type-check without build
npm run compile          # tsc --noEmit

# Format code (recommended before commit)
npm run format           # Biome formatter
```

> **Important:** Do NOT run `npm run build` during development. The dev server has hot reload and will automatically rebuild changes.

### How to Add a New Color Property

**Step 1:** Add to `src/constants/properties.ts`

```typescript
export const PROPERTIES = {
  // ... existing properties
  "--new-property": {
    label: "New Property Label",
    propertyName: "--new-property",
  },
};

// Update PROPERTY_NAMES array
export const PROPERTY_NAMES = [
  "--top-bar-bg",
  "--left-nav-bg",
  "--create-button-bg",
  "--left-nav-text-medium",
  "--new-property",  // Add here
] as const;
```

**Step 2:** Add derivations (if needed) in `src/constants/derived-colors.ts`

```typescript
export const DERIVED_COLORS_REGISTRY: DerivedColorsRegistry = {
  "--new-property": [
    {
      targetProperty: "--new-property-darker",
      deriveFn: (baseColor: string) => colord(baseColor).darken(0.1).toHex(),
    },
    {
      targetProperty: "--new-property-lighter",
      deriveFn: (baseColor: string) => colord(baseColor).lighten(0.1).toHex(),
    },
  ],
};
```

**Step 3:** Test changes

1. Save files (dev server auto-reloads extension)
2. Refresh Pumble page
3. Open extension popup
4. New property should appear in the color picker list

### How to Add a New Component

**Step 1:** Create component directory

```bash
mkdir src/components/MyComponent
touch src/components/MyComponent/MyComponent.tsx
touch src/components/MyComponent/MyComponent.module.css
touch src/components/MyComponent/index.ts
```

**Step 2:** Implement component

```typescript
// src/components/MyComponent/MyComponent.tsx
import styles from "./MyComponent.module.css";

interface MyComponentProps {
  title: string;
}

const MyComponent = (props: MyComponentProps) => {
  return (
    <div class={styles.container}>
      <h2>{props.title}</h2>
    </div>
  );
};

export default MyComponent;
```

```css
/* src/components/MyComponent/MyComponent.module.css */
.container {
  padding: var(--spacing-md);
}
```

```typescript
// src/components/MyComponent/index.ts
export { default } from "./MyComponent";
```

**Step 3:** Use component

```typescript
import MyComponent from "~/components/MyComponent";

const App = () => {
  return <MyComponent title="Hello" />;
};
```

### Debugging Tips

**Extension Debugging:**
1. Open Chrome DevTools → Extensions → Inspect views: "popup.html"
2. View console logs from popup script
3. Use breakpoints in Sources tab

**Content Script Debugging:**
1. Open DevTools on Pumble page (F12)
2. Content script logs appear in Console
3. Use `logger.debug()` for structured logging

**Storage Inspection:**
1. Chrome DevTools → Application → Storage → Extension Storage
2. View `theme_tweaks` and `global_disabled` keys

**Message Debugging:**
Add logging in messenger handlers:

```typescript
onMessage("updateProperty", async (data) => {
  console.log("Received updateProperty:", data);
  // ... handler logic
});
```

### Testing Changes

1. Save file (dev server auto-reloads extension)
2. Refresh Pumble page (if content script changed)
3. Close and reopen popup (if popup script changed)
4. Verify changes in UI
5. Check browser console for errors

---

## Build System

### WXT Configuration

`wxt.config.ts` defines extension manifest and build settings:

```typescript
export default defineConfig({
  modules: ["@wxt-dev/module-solid"],  // SolidJS support
  manifest: {
    name: "Pumble Tweaks",
    permissions: ["storage", "scripting"],  // Minimal required
    host_permissions: [
      "https://app.pumble.com/*",
      "https://app.stage.ops.pumble.com/*",
      "https://*.fe.pumble-dev.com/*",
    ],
  },
});
```

### Development vs Production Builds

| Feature | Development | Production |
|---------|-------------|------------|
| **Hot Reload** | ✓ Yes | ✗ No |
| **Source Maps** | ✓ Included | ✗ Not included |
| **Minification** | ✗ Disabled | ✓ Enabled |
| **Output** | `.output/` | `dist/` |

### Build Commands

```bash
# Production builds
npm run build           # Chrome
npm run build:firefox   # Firefox

# Create distribution archives
npm run zip             # Chrome .zip
npm run zip:firefox     # Firefox .xpi
```

### Extension Manifest Generation

WXT automatically generates `manifest.json` from `wxt.config.ts`:

```json
{
  "manifest_version": 3,
  "name": "Pumble Tweaks",
  "version": "1.0.0",
  "permissions": ["storage", "scripting"],
  "host_permissions": [
    "https://app.pumble.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Change Pumble theme colors"
  },
  "content_scripts": [{
    "matches": ["https://app.pumble.com/*"],
    "js": ["content.js"]
  }],
  "background": {
    "service_worker": "background.js"
  }
}
```

---

## Important Implementation Details

### Color Derivation System

Derived colors are automatically computed from base colors:

```typescript
// src/constants/derived-colors.ts
import { colord } from "colord";

export const DERIVED_COLORS_REGISTRY: DerivedColorsRegistry = {
  "--top-bar-bg": [
    {
      targetProperty: "--top-bar-bg-darker",
      deriveFn: (baseColor: string) => colord(baseColor).darken(0.1).toHex(),
    },
    {
      targetProperty: "--top-bar-bg-hover",
      deriveFn: (baseColor: string) => colord(baseColor).lighten(0.05).toHex(),
    },
  ],
};
```

**Usage in content script:**

```typescript
// When user changes --top-bar-bg to #0066ff
themeState.updateProperty("--top-bar-bg", "#0066ff", true);

// Automatically derives and applies:
// --top-bar-bg-darker: #0052cc (10% darker)
// --top-bar-bg-hover: #3385ff (5% lighter)
```

### URL Matching Patterns

Extension only runs on Pumble domains:

```typescript
// src/constants/pumble-urls.ts
export const PUMBLE_URLS = {
  PROD: "https://app.pumble.com",
  STAGE: "https://app.stage.ops.pumble.com",
  DEV: "https://*.fe.pumble-dev.com",
};
```

### Storage Migration Strategy

Storage format versioning for backward compatibility:

```typescript
// src/lib/storage.ts

// Old format (v1)
{ cssProperties: { "--top-bar-bg": "#ff0000" } }

// New format (v2)
{ cssProperties: { "--top-bar-bg": { value: "#ff0000", enabled: true } } }

// Migration function
function migrateStorage(data: any): ThemeTweaksStorage {
  if (typeof data.cssProperties["--top-bar-bg"] === "string") {
    // Migrate v1 → v2
    return {
      cssProperties: Object.fromEntries(
        Object.entries(data.cssProperties).map(([key, value]) => [
          key,
          { value: value as string, enabled: true }
        ])
      )
    };
  }
  return data;
}
```

### Debounced Updates Pattern

Avoid excessive storage writes during rapid changes:

```typescript
// src/lib/utils.ts
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Usage in theme-state.ts
const debouncedSave = debounce((tweaks: ThemeTweaks) => {
  storage.saveThemeTweaks(this.themeName, tweaks);
}, 500);  // Wait 500ms after last change
```

---

## Code Quality & Conventions

### Critical Constraints

> **Important:** The following constraints MUST be followed at all times:

1. **No createElement:** Use JSX only, never `document.createElement()`

```typescript
// ✗ WRONG
const div = document.createElement("div");

// ✓ CORRECT
const div = <div>Content</div>;
```

2. **No non-null assertions:** Handle optional types explicitly

```typescript
// ✗ WRONG
const value = tweaks!.disabled;

// ✓ CORRECT
const value = tweaks?.disabled ?? false;
```

3. **No npm run build during dev:** Dev server has hot reload

```bash
# ✗ WRONG (during development)
npm run build

# ✓ CORRECT
npm run dev  # Starts dev server with hot reload
```

### SolidJS-Specific Conventions

1. **Signal access:** Always call signals as functions

```typescript
// ✗ WRONG
if (loading) { ... }

// ✓ CORRECT
if (loading()) { ... }
```

2. **Store updates:** Use setStore with path notation

```typescript
// ✗ WRONG
store.themeTweaks.cssProperties["--top-bar-bg"].value = "#ff0000";

// ✓ CORRECT
setStore("themeTweaks", "cssProperties", "--top-bar-bg", "value", "#ff0000");
```

3. **JSX attributes:** Use `class` not `className`

```typescript
// ✗ WRONG
<div className={styles.container}>

// ✓ CORRECT
<div class={styles.container}>
```

### TypeScript Patterns

1. **Interface over type for props:**

```typescript
// ✓ CORRECT
interface ButtonProps {
  onClick: () => void;
  children: JSX.Element;
}
```

2. **Explicit return types for complex functions:**

```typescript
// ✓ CORRECT
function getThemeTweaks(themeName: string): ThemeTweaks | null {
  // ...
}
```

3. **Use const assertions for literal types:**

```typescript
// ✓ CORRECT
export const PROPERTY_NAMES = [
  "--top-bar-bg",
  "--left-nav-bg",
] as const;
```

### Biome Formatter/Linter

Run before committing:

```bash
npm run format  # Auto-formats all files
```

Configuration in `biome.json`:
- Tab indentation (2 spaces)
- Double quotes for strings
- Semicolons required
- SolidJS-specific linting rules enabled

---

## Common Pitfalls & Solutions

### 1. SolidJS Gotchas for React Developers

| Issue | Explanation | Solution |
|-------|-------------|----------|
| **Component runs once** | Unlike React, SolidJS components execute once, not on every state change | Don't put side effects outside reactive contexts |
| **Signals need parentheses** | `loading` vs `loading()` | Always call signals: `loading()` |
| **No dependency arrays** | SolidJS tracks dependencies automatically | Don't use React-style `useEffect([deps])` |
| **class vs className** | JSX attribute names differ | Use `class`, not `className` |

**Example:**

```typescript
// ✗ WRONG (React-style)
const [count, setCount] = createSignal(0);

useEffect(() => {
  console.log(count);  // Doesn't track dependency
}, [count]);

// ✓ CORRECT (SolidJS-style)
const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log(count());  // Tracks dependency automatically
});
```

### 2. Storage Sync Issues

**Problem:** State out of sync between tabs

**Cause:** Not listening to `browser.storage.onChanged`

**Solution:**

```typescript
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.theme_tweaks) {
    const newTweaks = changes.theme_tweaks.newValue;
    themeState.applyTweaks(newTweaks);
  }
});
```

### 3. Extension Lifecycle Considerations

**Problem:** Content script not running

**Possible causes:**
- Page loaded before extension installed
- URL doesn't match host_permissions
- Content script crashed

**Solutions:**
1. Refresh page after installing extension
2. Check `wxt.config.ts` host_permissions
3. Check browser console for errors

### 4. Message Passing Edge Cases

**Problem:** Message sent before content script ready

**Solution:** Check if content script exists before sending

```typescript
// src/components/ThemeEditor/ThemeEditor.helpers.ts
async function ensureContentScriptInjected(tabId: number) {
  try {
    await sendToContent({ type: "getState", data: undefined });
  } catch (error) {
    // Content script not ready, inject it
    await browser.scripting.executeScript({
      target: { tabId },
      files: ["content-scripts/content.js"],
    });
  }
}
```

### 5. Color Parsing Failures

**Problem:** Invalid color values crash the extension

**Solution:** Validate colors before applying

```typescript
import { colord } from "colord";

function isValidColor(color: string): boolean {
  return colord(color).isValid();
}

// Usage
if (isValidColor(userInput)) {
  themeState.updateProperty(propertyName, userInput, true);
} else {
  logger.error("Invalid color:", userInput);
}
```

### 6. Performance Issues with Rapid Updates

**Problem:** Too many storage writes during color picker drag

**Solution:** Use debounced updates (already implemented)

```typescript
// Debounce storage writes by 500ms
const debouncedSave = debounce(saveToStorage, 500);
```

---

## Quick Reference

### Most Common Tasks

```bash
# Development
npm run dev              # Start dev server

# Code Quality
npm run format           # Format code before commit
npm run compile          # Type-check

# Add new color property
# 1. Edit src/constants/properties.ts
# 2. Edit src/constants/derived-colors.ts (if needed)
# 3. Test in dev server
```

### Key File Locations

- **State management:** `src/entrypoints/content/theme-state.ts`
- **Popup UI root:** `src/components/ThemeEditor/ThemeEditor.tsx`
- **Storage operations:** `src/lib/storage.ts`
- **Add properties:** `src/constants/properties.ts`
- **Add derivations:** `src/constants/derived-colors.ts`
- **Message protocols:** `src/entrypoints/*/protocol.ts`

### When Things Break

1. **Check browser console** (F12) for errors
2. **Inspect extension storage** (DevTools → Application → Storage)
3. **Verify content script is running** (check console on Pumble page)
4. **Refresh page** after code changes
5. **Restart dev server** if hot reload fails

---

**Last Updated:** 2025-12-01

This documentation reflects the current architecture of Pumble Tweaks. When making significant architectural changes, please update this file to maintain accuracy across future Claude sessions.
