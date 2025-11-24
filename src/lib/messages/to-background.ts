import { createMessageAction } from "./action-creator";
import type { RuntimeState } from "./types";

/**
 * Messages sent FROM content script or popup TO background script
 * Broadcast messages to the background service worker
 */

export const ToBackground = {
	/**
	 * Updates the extension badge
	 * tabId is optional - auto-detected from sender if not provided
	 */
	updateBadge: createMessageAction<{
		badgeOn: boolean;
		tabId?: number;
	}>("UPDATE_BADGE"),

	/**
	 * Broadcasts full state change to popup and other listeners
	 */
	stateChanged: createMessageAction<{
		state: RuntimeState;
	}>("STATE_CHANGED"),
};
