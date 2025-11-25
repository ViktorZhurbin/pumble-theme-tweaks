import { createMessenger } from "@/lib/messages/createMessenger";
import type { ContentScriptProtocol } from "./protocol";

/**
 * Messenger for sending to/receiving from content scripts
 */
export const ContentScript = createMessenger<ContentScriptProtocol>();
