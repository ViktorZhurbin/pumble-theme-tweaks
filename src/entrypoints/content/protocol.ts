import type { RuntimeState } from "@/types/runtime";

/**
 * Messages that can be sent TO content scripts
 * (from popup or background)
 */
export interface ContentScriptProtocol {
	updateProperty(data: { propertyName: string; value: string }): void;
	toggleTweaks(data: { enabled: boolean }): void;
	toggleGlobal(data: { disabled: boolean }): void;
	resetTweaks(): void;
	getCurrentState(): RuntimeState;
}
