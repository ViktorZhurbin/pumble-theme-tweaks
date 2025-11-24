/**
 * Ultra-simple message action creator
 * Combines message definition, sending, and type guards in one
 */

interface MessageActionWithTab<TPayload extends { tabId: number }> {
	(payload: TPayload): void;
	type: string;
	match(msg: unknown): msg is Omit<TPayload, "tabId"> & { type: string };
}

interface MessageActionBroadcast<TPayload> {
	(payload: TPayload): void;
	type: string;
	match(msg: unknown): msg is TPayload & { type: string };
}

interface MessageActionQuery<TPayload extends { tabId: number }, TResponse> {
	(payload: TPayload): Promise<TResponse>;
	type: string;
	match(msg: unknown): msg is Omit<TPayload, "tabId"> & { type: string };
}

/**
 * Creates a message action that sends to a specific tab
 * Auto-detects tabId and uses chrome.tabs.sendMessage
 *
 * @example
 * const updateProperty = createMessageAction<{
 *   tabId: number;
 *   propertyName: string;
 *   value: string;
 * }>("UPDATE_PROPERTY");
 *
 * Usage:
 * updateProperty({ tabId: 123, propertyName: "color", value: "#fff" });
 *
 * In handler:
 * if (updateProperty.match(msg)) {
 *   console.log(msg.propertyName, msg.value);
 * }
 */
export function createMessageAction<TPayload extends { tabId: number }>(
	type: string,
): MessageActionWithTab<TPayload>;

/**
 * Creates a message action that broadcasts to runtime
 * Uses chrome.runtime.sendMessage
 */
export function createMessageAction<TPayload>(
	type: string,
): MessageActionBroadcast<TPayload>;

/**
 * Creates a message action that expects a response
 * Uses chrome.tabs.sendMessage with callback
 */
export function createMessageAction<
	TPayload extends { tabId: number },
	TResponse = unknown,
>(
	type: string,
	options: { expectResponse: true },
): MessageActionQuery<TPayload, TResponse>;

export function createMessageAction(
	type: string,
	options?: { expectResponse?: boolean },
	// biome-ignore lint/suspicious/noExplicitAny: Generic implementation for overloads
): any {
	// biome-ignore lint/suspicious/noExplicitAny: Generic payload type
	function action(payload: any): void | Promise<unknown> {
		const { tabId, ...messagePayload } = payload;
		const message = { type, ...messagePayload };

		// Query message (expects response)
		if (options?.expectResponse && tabId !== undefined) {
			return new Promise((resolve, reject) => {
				// biome-ignore lint/suspicious/noExplicitAny: Chrome API response
				chrome.tabs.sendMessage(tabId, message, (response: any) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						resolve(response);
					}
				});
			});
		}

		// Tab message (fire-and-forget)
		if (tabId !== undefined) {
			chrome.tabs.sendMessage(tabId, message);
			return;
		}

		// Broadcast message
		chrome.runtime.sendMessage(message);
	}

	action.type = type;
	action.match = (msg: unknown): msg is any => {
		return (
			typeof msg === "object" &&
			msg !== null &&
			"type" in msg &&
			(msg as any).type === type
		);
	};

	return action;
}
