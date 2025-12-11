High-Value Tests (Start Here)

  1. Unit Tests for Core Logic

  These are fast, reliable, and protect your most critical code:

  - Color derivation (src/lib/color-derivation.ts)
    - Test computeAllColorsFromBase() with various input colors
    - Verify alpha transformations, lightness adjustments
    - Ensure derived properties match expected values
  - Import/Export (src/lib/import-export.ts)
    - Valid/invalid JSON handling
    - Schema validation
    - Backwards compatibility with old formats
  - Storage utilities (src/lib/storage.ts)
    - Mock chrome.storage.sync APIs
    - Test debouncing behavior
    - Verify error handling

  2. Integration Tests for State Management

  The heart of your extension - theme-state.ts:

  - Preset operations: create, save, load, delete, switch
  - Unsaved changes tracking
  - Reset behavior (with/without preset selected)
  - Theme detection auto-disable flow
  - Multi-tab sync (storage.onChanged listeners)

  3. Component Tests (SolidJS)

  Use @solidjs/testing-library:

  - Dialog system - confirm/input flows, validation
  - Dropdown - item clicks, keyboard navigation
  - PropertyControl - color picker changes, reset button
  - PresetManager - save/load/switch interactions

  4. E2E Tests (Playwright/Puppeteer)

  Most confidence for complex flows:

  - Install extension → open popup → create preset
  - Edit colors → verify live preview in Pumble tab
  - Switch presets → confirm unsaved changes dialog
  - Import/export round-trip
  - Multi-tab synchronization (open 2 tabs, change in one)

  Medium-Value Tests

  5. Message Protocol Tests

  - Type-safe message sending/receiving
  - Background script routing
  - Error handling when content script not loaded

  6. DOM Manipulation Tests

  - CSS injection/removal (dom-utils.ts)
  - Style tag management
  - Property application

  Lower Priority

  7. Snapshot Tests

  - Color derivation output (regression detection)
  - Export JSON format stability

  8. Visual Regression Tests

  - UI components (Percy, Chromatic)
  - Only if UI changes frequently

  Practical Testing Stack

  # Recommended tools
  vitest              # Unit/integration tests (fast, Vite-based)
  @solidjs/testing-library  # Component tests
  @testing-library/user-event
  @webext-core/fake-browser # Mock chrome.* APIs
  playwright          # E2E tests (full extension loading)

  What I'd Build First

  If you're starting from zero, this order maximizes confidence per effort:

  1. Color derivation unit tests (30 min) - Protects core logic
  2. State management integration tests (2 hours) - Catches preset bugs
  3. E2E happy path (1 hour) - "Create preset → edit → save → reload → still works"
  4. Dialog/Dropdown component tests (1 hour) - UI reliability

  This gives you ~80% confidence with ~4-5 hours of work.

---

## Implementation Progress

### ✅ Phase 1: Foundation (Completed)

**Testing Infrastructure**
- ✅ Vitest configuration with SolidJS support
- ✅ Chrome extension API mocks (`@webext-core/fake-browser`)
- ✅ Test setup file with global mocks
- ✅ Test utilities and helpers
- ✅ npm test scripts added to package.json

**Unit Tests - Color Derivation** (13 tests ✅)
- ✅ `computeDerivedColorsFromBase()` - various color formats
- ✅ Alpha transformations for nav text colors
- ✅ Lightness adjustments (darker/lighter variants)
- ✅ `getDerivedPropertyNamesForBase()` - property name lists
- ✅ Edge cases: white, black, transparent colors
- ✅ Consistency and integration tests
- **File:** `src/lib/color-derivation.test.ts`

**Unit Tests - Import/Export** (27 tests ✅)
- ✅ `getExportJson()` - JSON export with base properties
- ✅ `getScriptString()` - executable script generation
- ✅ `parseImportJSON()` - valid/invalid JSON, auto-derive colors
- ✅ `validateImport()` - error messages for invalid input
- ✅ Round-trip export → import data integrity
- ✅ Various color formats (hex, rgb, rgba, hsl)
- **File:** `src/lib/import-export.test.ts`

**Unit Tests - Storage** (38 tests ✅)
- ✅ Tweaks toggle (getTweaksOn/setTweaksOn)
- ✅ Working tweaks (get/set/save/clear)
- ✅ Selected preset management
- ✅ Preset CRUD operations (create, read, update, delete)
- ✅ Preset rename with selected preset update
- ✅ Error handling and edge cases
- ✅ Complex workflow integration tests
- **File:** `src/lib/storage.test.ts`

**Test Coverage Summary**
```
Test Files: 3 passed (3)
Tests:      78 passed (78)
Duration:   ~450ms
```

### ✅ Phase 2: Core Confidence (Completed - Partial)

**State Management Integration Tests** (26 tests ✅)
- ✅ `reloadState()` - Load from storage, apply to DOM, broadcast changes
- ✅ `loadPreset()` - Load preset into working state
- ✅ `savePreset()` - Save working state to selected preset
- ✅ `savePresetAs()` - Create new preset from working state
- ✅ `deletePreset()` - Delete preset and handle selection
- ✅ `setTweaksOn()` - Toggle tweaks on/off
- ✅ `resetWorkingTweaks()` - Clear working state
- ✅ `updateWorkingProperty()` - Update single property + derived colors
- ✅ `toggleWorkingProperty()` - Toggle enabled state for base + derived
- ✅ `importPreset()` - Import external preset data
- ✅ Unsaved changes detection (preset vs working state)
- ✅ Badge state updates based on tweaks/preset status
- ✅ DOM manipulation (apply/reset CSS properties)
- ✅ Multi-tab sync simulation (storage → reloadState)
- **File:** `src/entrypoints/content/theme-state.test.ts`

**Test Coverage Summary (Updated)**
```
Test Files: 4 passed (4)
Tests:      104 passed (104)
Duration:   ~500ms
```

### 🚧 Next Steps

**Phase 2: Remaining**
- [ ] E2E happy path test (Playwright/Puppeteer)

**Phase 3: UI Reliability**
- [ ] Dialog component tests
- [ ] Dropdown component tests
- [ ] PropertyControl tests

**Phase 4: Comprehensive Coverage**
- [ ] Remaining E2E flows
- [ ] Message protocol tests
- [ ] DOM manipulation tests