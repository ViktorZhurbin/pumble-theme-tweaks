/**
 * Typed messengers for extension communication
 * Each messenger is bound to a specific protocol for type safety
 */

import { createMessenger } from "./messenger";
import type { BackgroundProtocol, ContentScriptProtocol } from "./protocol";

/**
 * Messenger for sending to/receiving from content scripts
 */
export const ContentScript = createMessenger<ContentScriptProtocol>();

/**
 * Messenger for sending to/receiving from background script
 */
export const Background = createMessenger<BackgroundProtocol>();

// Re-export types for convenience
export type { RuntimeState } from "./types";
