/** biome-ignore-all lint/suspicious/noExplicitAny: Needs to be this generic */
/** biome-ignore-all lint/suspicious/noConfusingVoidType: Needs to be this generic */

/**
 * Lightweight type-safe messenger for Chrome extension communication
 * Inspired by @webext-core/messaging but simplified and dependency-free
 */

/**
 * Protocol definition format
 * Keys are message types, values define data and optional response types
 */
type ProtocolShape = {
	data: any;
	response?: any;
};

/**
 * Handler function for a specific message type
 * Receives the message data and sender info, returns response (sync or async)
 */
type Handler<P, K extends keyof P> = (
	message: {
		data: P[K] extends ProtocolShape ? P[K]["data"] : any;
		timestamp: number;
	},
	sender: chrome.runtime.MessageSender,
) => P[K] extends ProtocolShape
	? P[K]["response"] extends undefined
		? void | Promise<void>
		: P[K]["response"] | Promise<P[K]["response"]>
	: void | Promise<any>;

/**
 * Internal message envelope format
 */
interface MessageEnvelope {
	type: string;
	data: any;
	timestamp: number;
}

/**
 * Response wrapper format
 */
interface ResponseEnvelope {
	res?: any;
	err?: string;
}

/**
 * Creates a type-safe messenger for a given protocol
 */
export function createMessenger<P>() {
	// Store handlers for each message type
	const handlers: Partial<Record<keyof P, Handler<P, any>>> = {};

	// Single root listener (lazy initialized)
	let rootListener:
		| ((
				msg: any,
				sender: chrome.runtime.MessageSender,
				sendResponse: (response: ResponseEnvelope) => void,
		  ) => boolean | void)
		| null = null;

	/**
	 * Sets up the single root Chrome listener that routes to registered handlers
	 */
	function setupRootListener() {
		if (rootListener) return;

		rootListener = (msg, sender, sendResponse) => {
			// Validate message format
			if (!msg?.type || typeof msg.type !== "string") return;

			// Find handler for this message type
			const handler = handlers[msg.type as keyof P];
			if (!handler) return;

			// Execute handler and wrap result
			Promise.resolve(handler(msg, sender))
				.then((res) => sendResponse({ res }))
				.catch((err) => sendResponse({ err: err.message }));

			return true; // Async response
		};

		chrome.runtime.onMessage.addListener(rootListener);
	}

	/**
	 * Registers a handler for a specific message type
	 * @returns Cleanup function to remove the handler
	 */
	function onMessage<K extends keyof P>(
		type: K,
		handler: Handler<P, K>,
	): () => void {
		setupRootListener();
		handlers[type] = handler;

		return () => {
			delete handlers[type];
		};
	}

	/**
	 * Sends a message to the background script or a specific tab
	 */
	function sendMessage<K extends keyof P>(
		type: K,
		data: P[K] extends ProtocolShape ? P[K]["data"] : any,
		tabId?: number,
	): Promise<P[K] extends ProtocolShape ? P[K]["response"] : any> {
		const message: MessageEnvelope = {
			type: type as string,
			data,
			timestamp: Date.now(),
		};

		// Send to specific tab or broadcast to background
		const promise: Promise<ResponseEnvelope> = tabId
			? chrome.tabs.sendMessage(tabId, message)
			: chrome.runtime.sendMessage(message);

		return promise.then(({ res, err }) => {
			if (err) throw new Error(err);
			return res;
		});
	}

	return { onMessage, sendMessage };
}
