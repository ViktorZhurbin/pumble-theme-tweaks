# Architecture Refactor Plan

## Decisions Made ✅

1. **ThemeState lives in content script only** - Single source of truth per tab
2. **Popup gets runtime state from content script** - Not reconstructed from storage
3. **Hybrid messaging approach** - Custom messages for semantics, storage.onChanged for data sync
4. **Message naming:** `ToContentScript` and `ToBackground`
5. **Runtime state structure:** Complete (themeName, tweaksApplied, pickerValues, tweaks)
6. **Event names:** Semantic events (THEME_CHANGED, TWEAKS_STATE_CHANGED, TWEAKS_TOGGLED, PROPERTY_UPDATED)
7. **Storage listeners:** Content script only (broadcasts to popup via messages)
8. **Migration:** Incremental on separate branch, phase by phase
9. **theme-editor.service.ts:** Rename to theme-editor-ui.ts for UI helpers only
10. **Popup state management:** Use Solid's `createStore` as reactive view of content script state

## Current Problems

1. **Confusing bi-directional messaging** - `SendMessage` used by both popup and content script
2. **Duplicate state management** - Badge and tweaksOn managed separately
3. **No single source of truth** - Tweaks applied in multiple places
4. **Component pollution** - Event listeners inline in ThemeEditor.tsx

## Refactored Structure

### 1. Split Messaging by Direction

```
src/lib/messages/
├── to-content-script.ts  # FROM popup TO content script
├── to-background.ts      # FROM content/popup TO background
└── types.ts             # Shared message types
```

**to-content-script.ts** (called by popup):
```typescript
export const ContentScript = {
  updateProperty(tabId, propertyName, value),
  resetProperties(tabId),
  getProperties(tabId): Promise<Record<string, string>>,
  getTheme(tabId): Promise<string>,
};
```

**to-background.ts** (called by content script or popup):
```typescript
export const Background = {
  updateBadge(badgeOn, tabId?),
  notifyThemeChanged(newTheme, oldTheme),
};
```

### 2. Single Source of Truth: ThemeState

Create a centralized state manager that broadcasts changes:

```typescript
// src/lib/theme-state.ts
export const ThemeState = {
  // Called by content script when theme changes
  async applyForTheme(themeName: string) {
    const tweaks = await Storage.getTweaks(themeName);
    const shouldApply = TweakUtils.shouldApplyTweaks(tweaks);

    // 1. Apply CSS
    if (shouldApply) {
      for (const [key, value] of Object.entries(tweaks.cssProperties)) {
        DomUtils.applyCSSProperty(key, value);
      }
    } else {
      DomUtils.resetCSSTweaks();
    }

    // 2. Update badge
    Background.updateBadge(shouldApply);

    // 3. Broadcast state change
    Background.notifyStateChanged({
      themeName,
      tweaksApplied: shouldApply,
      tweaks,
    });
  },

  // Called by popup when toggling
  async toggle(themeName: string, enabled: boolean) {
    await Storage.setDisabled(themeName, !enabled);
    await this.applyForTheme(themeName);
  },

  // Called by popup when resetting
  async reset(themeName: string) {
    await Storage.deleteTweaks(themeName);
    await this.applyForTheme(themeName);
  },
};
```

### 3. Simplify ThemeEditor

**Before** (current):
- Manages own state with multiple signals
- Listens for THEME_CHANGED messages
- Calls service methods
- Handles badge updates

**After** (proposed):
- Uses `createStore` for reactive view of state
- Listens to STATE_CHANGED broadcasts
- Reacts to centralized state
- No business logic

```typescript
// ThemeEditor.tsx
import { createStore } from "solid-js/store";

export function ThemeEditor() {
  // Reactive view of runtime state
  const [state, setState] = createStore<RuntimeState>({
    themeName: null,
    tweaksApplied: false,
    pickerValues: {},
    tweaks: undefined,
  });

  onMount(async () => {
    const tabId = await initializeTab();
    const initialState = await ToContentScript.getCurrentState(tabId);
    setState(initialState);

    // Listen for state changes from content script
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === MessageType.TWEAKS_STATE_CHANGED) {
        setState(msg.state); // Fine-grained updates
      }
    });
  });

  const handleToggle = () => {
    ToContentScript.toggleTweaks(tabId(), !state.tweaksApplied);
  };

  const handleReset = () => {
    ToContentScript.resetTweaks(tabId());
  };

  const handleColorChange = (propertyName: string, value: string) => {
    // Optimistic update
    setState("pickerValues", propertyName, value);
    ToContentScript.updateProperty(tabId(), propertyName, value);
  };

  // Clean render - just displays state
  return (
    <div>
      <ThemeToggle checked={state.tweaksApplied} onChange={handleToggle} />
      <ColorPickers values={state.pickerValues} onChange={handleColorChange} />
      <ResetButton onClick={handleReset} />
    </div>
  );
}
```

### 4. Message Flow

**Theme Change Flow:**
```
[User switches theme in Pumble]
  ↓
[MutationObserver detects class change]
  ↓
[ThemeState.applyForTheme(newTheme)]
  ├─→ Applies CSS tweaks
  ├─→ Updates badge
  └─→ Broadcasts STATE_CHANGED
        ↓
      [Popup receives broadcast]
        ↓
      [Updates UI: themeName, tweaksOn, pickerValues]
```

**Toggle Flow:**
```
[User toggles in popup]
  ↓
[ThemeState.toggle(themeName, enabled)]
  ├─→ Saves to storage
  ├─→ Applies/removes CSS
  ├─→ Updates badge
  └─→ Broadcasts STATE_CHANGED
        ↓
      [Popup receives broadcast]
        ↓
      [UI updates automatically]
```

## Benefits

1. ✅ **Clear message direction** - No confusion about who sends what
2. ✅ **Single source of truth** - ThemeState manages all tweaks logic
3. ✅ **Automatic sync** - Badge and UI always match via broadcasts
4. ✅ **Simpler components** - ThemeEditor just displays state
5. ✅ **Easier testing** - All logic in ThemeState, not scattered
6. ✅ **No duplication** - One place applies tweaks, updates badge

## Migration Steps

1. Create `src/lib/messages/` with split messaging
2. Create `src/lib/theme-state.ts` with centralized logic
3. Update content script to use ThemeState
4. Update popup to listen to STATE_CHANGED broadcasts
5. Remove duplicate logic from theme-editor.service.ts
6. Clean up ThemeEditor.tsx

## Hybrid Messaging Strategy

### Use chrome.storage.onChanged for:
- ✅ Data synchronization (tweaks modified by popup)
- ✅ Automatic content script reactions to storage changes
- ✅ Cross-context data sync

### Use custom messages for:
- ✅ `THEME_CHANGED` - DOM mutation observer detects theme switch
- ✅ `TWEAKS_STATE_CHANGED` - Broadcast current runtime state to popup
- ✅ Semantic events with rich context

### Flow Example:
```
[Popup] Changes color
   ↓
[Storage] Property saved
   ↓
[storage.onChanged] Fires in content script
   ↓
[Content] Re-applies tweaks for current theme
   ↓
[Content] Broadcasts TWEAKS_STATE_CHANGED
   ↓
[Popup] Updates to match runtime state
```

---

## Implementation Roadmap

### Phase 1: Message Organization
**Goal:** Split messaging by direction and purpose

**Tasks:**
1. Create `src/lib/messages/to-content-script.ts`
   - Move popup → content script messages
   - `updateProperty()`, `resetProperties()`, `getTheme()`, `getCurrentState()`

2. Create `src/lib/messages/to-background.ts`
   - Move runtime broadcast messages
   - `updateBadge()`, `notifyThemeChanged()`, `notifyStateChanged()`

3. Update imports across codebase
   - Replace `SendMessage` with `ContentScript` or `Background`
   - Clear which direction messages flow

4. Remove old `src/lib/messaging.ts`

**Validation:** All messages have clear direction and purpose

---

### Phase 2: ThemeState (Content Script)
**Goal:** Single source of truth for theme state

**Tasks:**
1. Create `src/content/theme-state.ts`
   ```typescript
   export const ThemeState = {
     // Runtime state
     private currentState: {
       themeName: string | null;
       tweaksApplied: boolean;
       pickerValues: Record<string, string>;
     };

     // Public API
     async applyForTheme(themeName: string): Promise<void>;
     async toggle(themeName: string, enabled: boolean): Promise<void>;
     async reset(themeName: string): Promise<void>;
     async updateProperty(themeName: string, prop: string, value: string): Promise<void>;
     getCurrentState(): ThemeStateSnapshot;
   }
   ```

2. Implement state management
   - Maintain `currentState` in memory
   - Update on all state changes
   - Broadcast `TWEAKS_STATE_CHANGED` after changes

3. Add storage listener
   ```typescript
   chrome.storage.onChanged.addListener((changes) => {
     if (changes.theme_tweaks) {
       // Re-apply tweaks for current theme
       const currentTheme = DomUtils.getCurrentTheme();
       if (currentTheme) {
         ThemeState.applyForTheme(currentTheme);
       }
     }
   });
   ```

**Validation:** ThemeState is the only place that applies tweaks to DOM

---

### Phase 3: Content Script Integration
**Goal:** Wire ThemeState into existing observers

**Tasks:**
1. Update `src/content/main.ts`
   - Remove direct `ThemeManager.applyTweaksAndUpdateBadge()` calls
   - Replace with `ThemeState.applyForTheme()`

2. Update theme change handler
   ```typescript
   ThemeManager.watchThemeChanges((newTheme, oldTheme) => {
     if (newTheme) {
       ThemeState.applyForTheme(newTheme);
     }
     Background.notifyThemeChanged(newTheme, oldTheme);
   });
   ```

3. Add message listeners for popup commands
   ```typescript
   chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
     switch (msg.type) {
       case MessageType.TOGGLE_TWEAKS:
         ThemeState.toggle(msg.themeName, msg.enabled);
         break;
       case MessageType.UPDATE_PROPERTY:
         ThemeState.updateProperty(msg.themeName, msg.propertyName, msg.value);
         break;
       case MessageType.GET_STATE:
         sendResponse(ThemeState.getCurrentState());
         break;
     }
   });
   ```

**Validation:** Content script reacts to both DOM changes and popup commands

---

### Phase 4: Popup Simplification
**Goal:** Popup becomes a pure UI component that displays runtime state

**Tasks:**
1. Remove business logic from `ThemeEditor.tsx`
   - Remove state reconstruction from storage
   - Remove direct storage writes
   - Keep only UI state and display logic

2. Add runtime state fetching
   ```typescript
   onMount(async () => {
     const tabId = await initializeTab();
     const state = await ContentScript.getCurrentState(tabId);

     setThemeName(state.themeName);
     setTweaksOn(state.tweaksApplied);
     setPickerValues(state.pickerValues);
   });
   ```

3. Add state change listener
   ```typescript
   chrome.runtime.onMessage.addListener((msg) => {
     if (msg.type === MessageType.TWEAKS_STATE_CHANGED) {
       setThemeName(msg.state.themeName);
       setTweaksOn(msg.state.tweaksApplied);
       setPickerValues(msg.state.pickerValues);
     }
   });
   ```

4. Update handlers to send commands
   ```typescript
   const handleToggle = (enabled: boolean) => {
     const tabId = tabId();
     const theme = themeName();
     ContentScript.toggleTweaks(tabId, theme, enabled);
     // State update will come via TWEAKS_STATE_CHANGED message
   };
   ```

5. Simplify `theme-editor.service.ts` or remove it
   - Most logic moves to ThemeState
   - Service might only need helper functions for UI

**Validation:** ThemeEditor is < 150 lines, mostly JSX

---

### Phase 5: Cleanup
**Goal:** Remove duplicate code and old patterns

**Tasks:**
1. Remove duplicate logic
   - Delete old `applyTweaksAndUpdateBadge` from theme-manager.ts
   - Remove storage writes from popup
   - Clean up unused message types

2. Update theme-manager.ts
   - Keep only `watchThemeChanges()` observer
   - Remove application logic (now in ThemeState)

3. Verify sync everywhere
   - Badge matches tweaksOn
   - Picker values match applied CSS
   - No stale state

**Validation:** `npm run build` succeeds, no TypeScript errors

---

## File Structure After Refactor

```
src/
├── lib/
│   ├── messages/
│   │   ├── to-content-script.ts  # Popup → Content
│   │   └── to-background.ts      # Any → Background
│   ├── storage.ts                # Storage operations only
│   ├── tweaks.ts                 # Utility functions (hasTweaks, shouldApply)
│   └── ...
├── content/
│   ├── theme-state.ts            # ⭐ NEW: Single source of truth
│   ├── main.ts                   # Initialize, wire up observers
│   └── ...
├── components/
│   └── ThemeEditor/
│       ├── ThemeEditor.tsx       # ⭐ SIMPLIFIED: Just UI
│       ├── theme-editor.service.ts # Maybe removed or minimal helpers
│       └── ...
└── background/
    └── badge.ts                  # Listen for badge updates
```

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Open popup, verify initial state matches page
- [ ] Toggle tweaks ON → badge turns ON, CSS applies
- [ ] Toggle tweaks OFF → badge turns OFF, CSS removes
- [ ] Change color → picker updates, CSS updates, storage saves
- [ ] Switch theme in Pumble → popup updates automatically
- [ ] Reset tweaks → badge OFF, colors reset, storage cleared
- [ ] Close/reopen popup → state persists correctly
- [ ] Multiple tabs → each has independent state

### Edge Cases
- [ ] Popup open while theme changes
- [ ] Storage quota exceeded
- [ ] Invalid theme name
- [ ] No tweaks saved for theme
- [ ] Rapid toggle clicking

---

## Migration Notes

### Breaking Changes
- None (internal refactor only)

### Data Migration
- No storage structure changes
- Existing saved tweaks work as-is

### Rollback Plan
- Keep old code in git history
- If issues found, revert commit range
- No user data affected

---

## Answered Questions

### 1. Message Naming
Split `SendMessage` into `ToContentScript` and `ToBackground`

---

### 2. Runtime State Structure
`ThemeState.getCurrentState()` returns:

```typescript
{
  themeName: string | null;
  tweaksApplied: boolean;
  pickerValues: Record<string, string>;
  tweaks: ThemeTweaks[string] | undefined;
}
```

---

### 3. Event Names
Custom messages naming:

- `THEME_CHANGED` ✅ (already exists)
- `TWEAKS_STATE_CHANGED` - Broadcast full state to popup
- `TWEAKS_TOGGLED` - Specific toggle event
- `PROPERTY_UPDATED` - Specific property change

---

### 4. Storage Listener Placement
Only content script listens to `chrome.storage.onChanged`.

---

### 5. Migration Strategy

On a separate branch:
- Phase 1 → Review → commit
- Phase 2 → Review → commit
- etc.

---

### 6. theme-editor.service.ts
What happens to this file?

Whatever feels more logical once we get there.

---

## Quick Reference: Key Architecture Changes

### Before Refactor
```
┌─────────────────────────────────────────────────────┐
│ Popup (ThemeEditor.tsx)                             │
│ - Manages tweaksOn state                            │
│ - Writes directly to Storage                        │
│ - Calls ThemeEditorService for business logic       │
│ - Listens to THEME_CHANGED messages                 │
└─────────────────────────────────────────────────────┘
                    ↕ (bi-directional)
┌─────────────────────────────────────────────────────┐
│ Content Script (main.ts)                            │
│ - Watches for theme changes via MutationObserver    │
│ - Calls ThemeManager.applyTweaksAndUpdateBadge()    │
│ - Sends THEME_CHANGED to runtime                    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Storage (chrome.storage.sync)                       │
│ - theme_tweaks object                               │
└─────────────────────────────────────────────────────┘
```

**Problems:**
- ❌ No single source of truth (popup and content both manage state)
- ❌ Badge and tweaksOn can get out of sync
- ❌ Duplicate logic in multiple places
- ❌ Confusing message flow (who sends what?)

---

### After Refactor
```
┌─────────────────────────────────────────────────────┐
│ Popup (ThemeEditor.tsx)                             │
│ - PURE UI: Displays state only                      │
│ - Sends commands via ToContentScript                │
│ - Listens to TWEAKS_STATE_CHANGED broadcasts        │
│ - No direct storage access                          │
└─────────────────────────────────────────────────────┘
          ↓ Commands              ↑ State broadcasts
┌─────────────────────────────────────────────────────┐
│ Content Script (ThemeState)                         │
│ ⭐ SINGLE SOURCE OF TRUTH                           │
│ - Maintains currentState in memory                  │
│ - Applies tweaks to DOM                             │
│ - Updates badge                                     │
│ - Listens to storage.onChanged (only listener!)     │
│ - Broadcasts state changes                          │
└─────────────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────────────┐
│ Storage (chrome.storage.sync)                       │
│ - theme_tweaks object                               │
└─────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Single source of truth (ThemeState in content script)
- ✅ Badge and tweaksOn always in sync
- ✅ No duplicate logic
- ✅ Clear unidirectional data flow
- ✅ Popup uses Solid's createStore for reactive view (fine-grained updates)

---

## Message Types Reference

### Messages TO Content Script (from Popup)
```typescript
// src/lib/messages/to-content-script.ts
export const ToContentScript = {
  // Get current runtime state
  async getCurrentState(tabId: number): Promise<RuntimeState>;

  // Update a single CSS property
  updateProperty(tabId: number, propertyName: string, value: string): void;

  // Reset all tweaks for current theme
  resetTweaks(tabId: number): void;

  // Toggle tweaks on/off
  toggleTweaks(tabId: number, enabled: boolean): void;

  // Get current theme name
  async getTheme(tabId: number): Promise<string | null>;

  // Get CSS property values
  async getProperties(tabId: number): Promise<Record<string, string>>;
};
```

### Messages TO Background (from Content or Popup)
```typescript
// src/lib/messages/to-background.ts
export const ToBackground = {
  // Update extension badge
  updateBadge(badgeOn: boolean, tabId?: number): void;

  // Broadcast theme changed (from content script)
  notifyThemeChanged(newTheme: string | null, oldTheme: string | null): void;

  // Broadcast state changed (from content script)
  notifyStateChanged(state: RuntimeState): void;
};
```

### Runtime State Structure
```typescript
interface RuntimeState {
  themeName: string | null;           // Current theme (e.g., "dark", "light")
  tweaksApplied: boolean;             // Are tweaks currently applied to DOM?
  pickerValues: Record<string, string>; // Current CSS property values
  tweaks: ThemeTweaks[string] | undefined; // Full tweaks object from storage
}
```

---

## Implementation Notes

### Phase 1: Message Organization
**Files to create:**
- `src/lib/messages/to-content-script.ts` - All popup → content messages
- `src/lib/messages/to-background.ts` - All broadcast messages

**Files to update:**
- All files importing `SendMessage` → update to `ToContentScript` or `ToBackground`

**Files to delete:**
- `src/lib/messaging.ts` (logic split into new files)

---

### Phase 2: ThemeState Creation
**File to create:**
- `src/content/theme-state.ts`

**Core responsibilities:**
```typescript
class ThemeStateManager {
  private currentState: RuntimeState = {
    themeName: null,
    tweaksApplied: false,
    pickerValues: {},
    tweaks: undefined,
  };

  // Called when theme changes or tweaks are modified
  async applyForTheme(themeName: string): Promise<void> {
    // 1. Load tweaks from storage
    // 2. Determine if should apply
    // 3. Apply/remove CSS from DOM
    // 4. Update badge
    // 5. Update currentState
    // 6. Broadcast TWEAKS_STATE_CHANGED
  }

  // Called by popup to toggle tweaks
  async toggle(enabled: boolean): Promise<void> {
    // 1. Get current theme
    // 2. Update storage (disabled flag)
    // 3. Re-apply for theme (will trigger storage.onChanged)
  }

  // Called by popup to reset tweaks
  async reset(): Promise<void> {
    // 1. Get current theme
    // 2. Delete from storage
    // 3. Re-apply for theme (will trigger storage.onChanged)
  }

  // Called by popup to update property
  async updateProperty(propertyName: string, value: string): Promise<void> {
    // 1. Get current theme
    // 2. Save to storage
    // (storage.onChanged will trigger re-apply)
  }

  // Called by popup on mount
  getCurrentState(): RuntimeState {
    return { ...this.currentState };
  }
}
```

**Storage listener (content script only):**
```typescript
chrome.storage.onChanged.addListener((changes) => {
  if (changes.theme_tweaks) {
    const currentTheme = DomUtils.getCurrentTheme();
    if (currentTheme) {
      // Re-apply and broadcast
      ThemeState.applyForTheme(currentTheme);
    }
  }
});
```

---

### Phase 3: Content Script Integration
**Update `src/content/main.ts`:**
- Replace `ThemeManager.applyTweaksAndUpdateBadge()` → `ThemeState.applyForTheme()`
- Add message handlers for popup commands
- Wire up storage listener to ThemeState

**Theme change handler:**
```typescript
ThemeManager.watchThemeChanges((newTheme, oldTheme) => {
  DomUtils.resetCSSTweaks();
  if (newTheme) {
    ThemeState.applyForTheme(newTheme);
  }
  ToBackground.notifyThemeChanged(newTheme, oldTheme);
});
```

---

### Phase 4: Popup Simplification
**Update `src/components/ThemeEditor/ThemeEditor.tsx`:**

**Key change:** Use Solid's `createStore` for object state instead of multiple signals

**Before (current - multiple signals):**
```typescript
const [themeName, setThemeName] = createSignal<string | null>(null);
const [tweaksOn, setTweaksOn] = createSignal(false);
const [pickerValues, setPickerValues] = createSignal<Record<string, string>>({});

onMount(async () => {
  const tabId = await initializeTab();
  const theme = await initializeTheme(tabId);
  const [pickerValues, tweaks] = await loadThemeData(tabId, theme);

  setThemeName(theme);
  setPickerValues(pickerValues);
  setTweaksOn(TweakUtils.shouldApplyTweaks(tweaks));
});

const handleToggle = async () => {
  await ThemeEditorService.toggleTweaks(tabId(), themeName(), tweaksOn(), pickerValues());
};
```

**After (refactored - createStore as reactive view):**
```typescript
import { createStore } from "solid-js/store";

// Single store for all state (better for objects)
const [state, setState] = createStore<RuntimeState>({
  themeName: null,
  tweaksApplied: false,
  pickerValues: {},
  tweaks: undefined,
});

const [tabId, setTabId] = createSignal<number | null>(null);
const [loading, setLoading] = createSignal(true);
const [error, setError] = createSignal<string | null>(null);

onMount(async () => {
  try {
    const currentTabId = await initializeTab();
    setTabId(currentTabId);

    // Get runtime state from content script (source of truth)
    const runtimeState = await ToContentScript.getCurrentState(currentTabId);
    setState(runtimeState); // ✨ One call updates entire state

    // Subscribe to state changes from content script
    const handleStateChange = (msg: Message) => {
      if (msg.type === MessageType.TWEAKS_STATE_CHANGED) {
        setState(msg.state); // ✨ Solid handles fine-grained updates
      }
    };

    chrome.runtime.onMessage.addListener(handleStateChange);
    onCleanup(() => chrome.runtime.onMessage.removeListener(handleStateChange));

    logger.info("ThemeEditor initialized", { state });
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
});

// Actions send commands (unidirectional flow)
const handleToggle = (enabled: boolean) => {
  const currentTabId = tabId();
  if (!currentTabId) return;

  ToContentScript.toggleTweaks(currentTabId, enabled);
  // State updates automatically via TWEAKS_STATE_CHANGED broadcast
};

const handleColorChange = (propertyName: string, value: string) => {
  const currentTabId = tabId();
  if (!currentTabId) return;

  // Optimistic update for responsive UI
  setState("pickerValues", propertyName, value);

  // Send to content script (will save and broadcast actual state)
  ToContentScript.updateProperty(currentTabId, propertyName, value);
};

const handleReset = () => {
  const currentTabId = tabId();
  if (!currentTabId) return;

  ToContentScript.resetTweaks(currentTabId);
  // State updates automatically via broadcast
};
```

**Why createStore over createSignal:**
- ✅ **Fine-grained reactivity** - Only changed properties trigger re-renders
- ✅ **Cleaner syntax** - `state.themeName` vs `themeName()`
- ✅ **Nested updates** - `setState("pickerValues", prop, value)`
- ✅ **Better for objects** - State is naturally an object
- ✅ **Single source** - One store instead of multiple signals

---

### Phase 5: Cleanup
**Files to update/simplify:**
- `src/lib/theme-manager.ts` - Keep only `watchThemeChanges()`
- `src/components/ThemeEditor/theme-editor.service.ts` → rename to `theme-editor-ui.ts`

**Files to review for deletion:**
- Any duplicate helper functions
- Unused message types
- Old storage access patterns

---

## Testing Checklist (Per Phase)

### After Phase 1 (Messages)
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] All imports updated

### After Phase 2 (ThemeState)
- [ ] ThemeState.applyForTheme() applies CSS correctly
- [ ] ThemeState.getCurrentState() returns accurate data
- [ ] storage.onChanged triggers re-apply

### After Phase 3 (Integration)
- [ ] Theme changes detected and applied
- [ ] Badge updates correctly
- [ ] Message handlers respond to popup commands

### After Phase 4 (Popup)
- [ ] Popup displays runtime state on open
- [ ] Toggle works (badge and UI sync)
- [ ] Color changes apply and persist
- [ ] Reset clears tweaks
- [ ] Theme switch updates popup

### After Phase 5 (Cleanup)
- [ ] No duplicate code
- [ ] All tests pass
- [ ] Extension works end-to-end

---

## Common Pitfalls to Avoid

1. **Don't forget to broadcast state changes**
   - Every operation that changes state must call `ToBackground.notifyStateChanged()`

2. **Don't use storage.onChanged in popup**
   - Only content script should listen to storage
   - Popup gets updates via custom messages

3. **Don't apply CSS in popup**
   - Only content script has DOM access
   - Popup sends commands, content script executes

4. **Don't reconstruct state from storage**
   - Always get runtime state via `ToContentScript.getCurrentState()`
   - Storage is persistence, not source of truth

5. **Don't forget tabId in messages**
   - Popup must pass tabId to content script
   - Background script uses it to update correct badge

---

## Context for Future Implementer

This refactor addresses architectural issues where state management was split between popup and content script, leading to sync problems. The core insight is:

**Content script is the authoritative source** because:
- It has direct DOM access (can verify what's actually applied)
- It detects theme changes via MutationObserver
- It's one instance per tab (popup can be closed/reopened)

**Popup is a reactive view layer** that:
- Uses Solid's `createStore` as a view of runtime state
- Sends commands to content script (unidirectional)
- Updates automatically via state broadcasts
- Leverages Solid's fine-grained reactivity

**Why createStore in popup:**
- It's still just a view (content script is source of truth)
- Provides better reactivity than multiple signals
- Allows optimistic updates for responsive UI
- Natural fit for object-based state
- Works with Solid DevTools

The hybrid messaging approach uses:
- `chrome.storage.onChanged` for automatic data propagation
- Custom messages for semantic events and state broadcasts

This creates a unidirectional data flow:
```
User action → Popup command → Content script → Storage →
storage.onChanged → Content script → State broadcast → Popup createStore update
```

**State flow diagram:**
```
┌──────────────────────────────────────────┐
│ Content Script (Source of Truth)         │
│ - Maintains currentState                 │
│ - Applies to DOM                         │
│ - Broadcasts changes                     │
└──────────────────────────────────────────┘
              ↓ TWEAKS_STATE_CHANGED
┌──────────────────────────────────────────┐
│ Popup (Reactive View)                    │
│ createStore({                            │
│   themeName, tweaksApplied, pickerValues │
│ })                                       │
│ - Displays state                         │
│ - Sends commands                         │
│ - Auto-updates on broadcasts             │
└──────────────────────────────────────────┘
              ↓ Commands (toggle, update, reset)
              ↑ (back to content script)
```

All decisions are documented above. Implementation should be done incrementally on a separate branch, with each phase committed separately for easy rollback if needed.
