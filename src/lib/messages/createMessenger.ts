/** biome-ignore-all lint/suspicious/noExplicitAny: Needs to be this generic */
/** biome-ignore-all lint/suspicious/noConfusingVoidType: Needs to be this generic */

import { type Browser, browser } from "wxt/browser";

/**
 * Lightweight type-safe messenger for cross-browser extension communication
 * Uses WXT's browser API for Firefox, Chrome, Safari, Edge compatibility
 */

/**
 * Extract data type from protocol definition
 * Supports both function syntax: `methodName(data: T): R` and value syntax: `methodName: T`
 */
type GetDataType<T> = T extends (...args: infer Args) => any
	? Args["length"] extends 0 | 1
		? Args[0]
		: never
	: T;

/**
 * Extract return type from protocol definition
 * Supports both function syntax and value syntax (returns void for values)
 */
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : void;

/**
 * Handler function for a specific message type
 * Receives a message object with data, timestamp, and sender info
 */
type Handler<P, K extends keyof P> = (message: {
	data: GetDataType<P[K]>;
	timestamp: number;
	sender: Browser.runtime.MessageSender;
}) => void | Promise<void> | GetReturnType<P[K]> | Promise<GetReturnType<P[K]>>;

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
export const createMessenger = <P>() => {
	// Store handlers for each message type
	const handlers: Partial<Record<keyof P, Handler<P, any>>> = {};

	/**
	 * Sets up the single root browser listener that routes to registered handlers
	 */
	const setupRootListener = () => {
		// Only setup once
		if (browser.runtime.onMessage.hasListener(handleMessage)) return;

		browser.runtime.onMessage.addListener(handleMessage);
	};

	/**
	 * Root message handler
	 * Returns true to indicate async response via sendResponse callback
	 */
	const handleMessage = (
		msg: any,
		sender: Browser.runtime.MessageSender,
		sendResponse: (response?: any) => void,
	): true | void => {
		// Validate message format
		if (!msg?.type || typeof msg.type !== "string") return;

		// Find handler for this message type
		const handler = handlers[msg.type as keyof P];
		if (!handler) return;

		// Execute handler asynchronously and send response via callback
		(async () => {
			try {
				const res = await handler({
					data: msg.data,
					timestamp: msg.timestamp,
					sender,
				});
				sendResponse({ res });
			} catch (err) {
				sendResponse({ err: (err as Error).message });
			}
		})();

		// Return true to indicate we will send a response asynchronously
		return true;
	};

	/**
	 * Registers a handler for a specific message type
	 * @returns Cleanup function to remove the handler
	 */
	const onMessage = <K extends keyof P>(
		type: K,
		handler: Handler<P, K>,
	): (() => void) => {
		setupRootListener();
		handlers[type] = handler;

		return () => {
			delete handlers[type];
		};
	};

	/**
	 * Sends a message to the background script or a specific tab
	 */
	const sendMessage = async <K extends keyof P>(
		type: K,
		...args: GetDataType<P[K]> extends undefined
			? [data?: undefined, tabId?: number]
			: [data: GetDataType<P[K]>, tabId?: number]
	): Promise<GetReturnType<P[K]>> => {
		const data = args[0];
		const tabId = args[1];

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
	};

	return { onMessage, sendMessage };
};
