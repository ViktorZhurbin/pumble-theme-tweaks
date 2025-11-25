import type { RuntimeState } from "@/types/runtime";

/**
 * Messages that can be sent TO background script
 * (from content scripts or popup)
 */
export interface BackgroundProtocol {
	updateBadge(data: {
		badgeState: "ON" | "OFF" | "DEFAULT";
		tabId?: number;
	}): void;
	stateChanged(data: { state: RuntimeState; tabId?: number }): void;
	getTabId(): number | undefined;
}
