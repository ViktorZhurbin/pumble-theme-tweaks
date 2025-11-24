import type { RuntimeState } from "./types";

/**
 * Messages that can be sent TO content scripts
 * (from popup or background)
 */
export interface ContentScriptProtocol {
	updateProperty: {
		data: { propertyName: string; value: string };
	};
	toggleTweaks: {
		data: { enabled: boolean };
	};
	toggleGlobal: {
		data: { disabled: boolean };
	};
	resetTweaks: {
		data: Record<string, never>;
	};
	getCurrentState: {
		data: Record<string, never>;
		response: RuntimeState;
	};
}

/**
 * Messages that can be sent TO background script
 * (from content scripts or popup)
 */
export interface BackgroundProtocol {
	updateBadge: {
		data: { badgeState: "ON" | "OFF" | "DEFAULT"; tabId?: number };
	};
	stateChanged: {
		data: { state: RuntimeState };
	};
}
