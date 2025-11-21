/**
 * Configuration for a CSS variable that can be customized
 */
export interface CSSVariableConfig {
	label: string;
	name: string;
}

/**
 * Theme presets stored in chrome.storage
 * Maps theme name to variable overrides
 */
export interface ThemePresets {
	[themeName: string]: {
		[varName: string]: string;
	};
}

/**
 * Storage data structure
 */
export interface StorageData {
	theme_presets?: ThemePresets;
}

/**
 * Message types for communication between popup, content script, and background
 */
export enum MessageType {
	UPDATE_VAR = "UPDATE_VAR",
	READ_VARS = "READ_VARS",
	GET_THEME = "GET_THEME",
	RESET_VARS = "RESET_VARS",
	UPDATE_BADGE = "UPDATE_BADGE",
}

/**
 * Message payloads
 */
export interface UpdateVarMessage {
	type: MessageType.UPDATE_VAR;
	varName: string;
	value: string;
}

export interface ReadVarsMessage {
	type: MessageType.READ_VARS;
	vars: string[];
}

export interface GetThemeMessage {
	type: MessageType.GET_THEME;
}

export interface ResetVarsMessage {
	type: MessageType.RESET_VARS;
}

export interface UpdateBadgeMessage {
	type: MessageType.UPDATE_BADGE;
	isOn: boolean;
}

export type Message =
	| UpdateVarMessage
	| ReadVarsMessage
	| GetThemeMessage
	| ResetVarsMessage
	| UpdateBadgeMessage;
