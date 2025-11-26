export const PUMBLE_URL = {
	PROD: "app.pumble.com",
	STAGE: "app.stage.ops.pumble.com",
	DEV: "fe.pumble-dev.com",
};

/**
 * Pumble URL patterns for content script matching and validation
 */
export const PUMBLE_URL_PATTERNS = [
	`https://${PUMBLE_URL.PROD}/*`,
	`https://${PUMBLE_URL.STAGE}/*`,
	`https://\\*.${PUMBLE_URL.DEV}/*`,
];
