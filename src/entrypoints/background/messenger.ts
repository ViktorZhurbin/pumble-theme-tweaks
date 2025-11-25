import { createMessenger } from "@/lib/messages/createMessenger";
import type { BackgroundProtocol } from "./protocol";

/**
 * Messenger for sending to/receiving from background script
 */
export const Background = createMessenger<BackgroundProtocol>();
