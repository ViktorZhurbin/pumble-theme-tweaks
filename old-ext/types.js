/**
 * @typedef {Object} ThemePreset
 * @property {string} [varName] - CSS variable value (e.g., "--palette-primary-main": "#ff0000")
 */

/**
 * @typedef {Object.<string, ThemePreset>} ThemePresets
 * All theme presets indexed by theme name
 */

/**
 * @typedef {Object} StorageData
 * @property {ThemePresets} [theme_presets] - All saved theme presets
 */

/**
 * @typedef {Object} CSSVariableConfig
 * @property {string} label - Display label for the variable
 * @property {string} name - CSS variable name (e.g., "--palette-primary-main")
 */

/**
 * @typedef {Object} Message
 * @property {string} type - Message type identifier
 */

/**
 * @typedef {Message & {varName: string, value: string}} UpdateVarMessage
 * @typedef {Message & {vars: string[]}} ReadVarsMessage
 * @typedef {Message & {vars: string[]}} ResetVarsMessage
 * @typedef {Message & {hasOverrides: boolean}} UpdateBadgeMessage
 */

export {};
