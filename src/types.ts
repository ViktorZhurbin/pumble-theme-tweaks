/**
 * Configuration for a CSS property that can be customized
 */
export interface PropertyItem {
	label: string;
	propertyName: string;
}

/**
 * Theme tweaks stored in chrome.storage
 * Maps theme name to customized CSS properties
 */
export interface ThemeTweaks {
	[themeName: string]: {
		disabled: boolean;
		cssProperties: {
			[propertyName: string]: string;
		};
	};
}

/**
 * Storage data structure
 */
export interface StorageData {
	theme_tweaks?: ThemeTweaks;
}

/**
 * Message types for communication between popup, content script, and background
 */
export enum MessageType {
	UPDATE_PROPERTY = "UPDATE_PROPERTY",
	READ_PROPERTIES = "READ_PROPERTIES",
	GET_THEME = "GET_THEME",
	RESET_PROPERTIES = "RESET_PROPERTIES",
	UPDATE_BADGE = "UPDATE_BADGE",
}

/**
 * Message payloads
 */
export interface UpdatePropertyMessage {
	type: MessageType.UPDATE_PROPERTY;
	propertyName: string;
	value: string;
}

export interface ReadPropertiesMessage {
	type: MessageType.READ_PROPERTIES;
}

export interface GetThemeMessage {
	type: MessageType.GET_THEME;
}

export interface ResetPropertiesMessage {
	type: MessageType.RESET_PROPERTIES;
}

export interface UpdateBadgeMessage {
	type: MessageType.UPDATE_BADGE;
	badgeOn: boolean;
}

export type Message =
	| UpdatePropertyMessage
	| ReadPropertiesMessage
	| GetThemeMessage
	| ResetPropertiesMessage
	| UpdateBadgeMessage;
