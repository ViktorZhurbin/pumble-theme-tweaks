import type { ThemeTweaks } from "@/types";

/**
 * Runtime state structure maintained by content script
 */
export interface RuntimeState {
	themeName: string | null;
	tweakModeOn: boolean;
	pickerValues: Record<string, string>;
	tweaks: ThemeTweaks | undefined;
}

/**
 * Message types for communication between popup, content script, and background
 */
export enum MessageType {
	UPDATE_PROPERTY = "UPDATE_PROPERTY",
	TOGGLE_TWEAKS = "TOGGLE_TWEAKS",
	RESET_TWEAKS = "RESET_TWEAKS",
	GET_STATE = "GET_STATE",
	STATE_CHANGED = "STATE_CHANGED",
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

export interface UpdateBadgeMessage {
	type: MessageType.UPDATE_BADGE;
	badgeOn: boolean;
	tabId?: number; // Required when called from popup, optional from content script
}

export interface TweaksStateChangedMessage {
	type: MessageType.STATE_CHANGED;
	state: RuntimeState;
}

export interface GetStateMessage {
	type: MessageType.GET_STATE;
}

export interface ToggleTweaksMessage {
	type: MessageType.TOGGLE_TWEAKS;
	enabled: boolean;
}

export interface ResetTweaksMessage {
	type: MessageType.RESET_TWEAKS;
}

export type Message =
	| UpdatePropertyMessage
	| UpdateBadgeMessage
	| TweaksStateChangedMessage
	| GetStateMessage
	| ToggleTweaksMessage
	| ResetTweaksMessage;
