import {
	MessageType,
	type RuntimeState,
	type TweaksStateChangedMessage,
	type UpdateBadgeMessage,
} from "@/lib/messages/types";

/**
 * Messages sent FROM content script or popup TO background script
 * These are broadcast/notification messages to the background service worker
 */

/**
 * Notifies background script to update the badge
 * @param badgeOn - Whether the badge should show "ON"
 * @param tabId - Tab ID (required when called from popup, optional from content script)
 */
const updateBadge = (badgeOn: boolean, tabId?: number) => {
	chrome.runtime.sendMessage<UpdateBadgeMessage>({
		type: MessageType.UPDATE_BADGE,
		badgeOn,
		tabId,
	});
};

/**
 * Broadcasts full state change to popup and other listeners
 * @param state - The current runtime state
 */
const notifyStateChanged = (state: RuntimeState) => {
	chrome.runtime.sendMessage<TweaksStateChangedMessage>({
		type: MessageType.STATE_CHANGED,
		state,
	});
};

export const ToBackground = {
	updateBadge,
	notifyStateChanged,
};
