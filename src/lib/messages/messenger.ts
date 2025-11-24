/** biome-ignore-all lint/suspicious/noExplicitAny: Needs to be this generic */
/** biome-ignore-all lint/suspicious/noConfusingVoidType: Needs to be this generic */

import type { Runtime } from "webextension-polyfill";
import browser from "webextension-polyfill";

/**
 * Lightweight type-safe messenger for cross-browser extension communication
 * Uses webextension-polyfill for Firefox, Chrome, Safari, Edge compatibility
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
	sender: Runtime.MessageSender,
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

	/**
	 * Sets up the single root browser listener that routes to registered handlers
	 */
	function setupRootListener() {
		// Only setup once
		if (browser.runtime.onMessage.hasListener(handleMessage)) return;

		browser.runtime.onMessage.addListener(handleMessage);
	}

	/**
	 * Root message handler
	 */
	async function handleMessage(
		msg: any,
		sender: Runtime.MessageSender,
	): Promise<ResponseEnvelope | undefined> {
		// Validate message format
		if (!msg?.type || typeof msg.type !== "string") return undefined;

		// Find handler for this message type
		const handler = handlers[msg.type as keyof P];
		if (!handler) return undefined;

		// Execute handler and wrap result
		try {
			const res = await handler(msg, sender);
			return { res };
		} catch (err) {
			return { err: (err as Error).message };
		}
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
	async function sendMessage<K extends keyof P>(
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
		const response: ResponseEnvelope = tabId
			? await browser.tabs.sendMessage(tabId, message)
			: await browser.runtime.sendMessage(message);

		if (response?.err) {
			throw new Error(response.err);
		}

		return response?.res;
	}

	return { onMessage, sendMessage };
}
