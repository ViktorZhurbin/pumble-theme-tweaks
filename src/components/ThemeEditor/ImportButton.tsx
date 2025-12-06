import { colord } from "colord";
import { createSignal } from "solid-js";
import { Button } from "@/components/Button/Button";
import { Typography } from "@/components/Typography/Typography";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";
import styles from "./ImportButton.module.css";
import { useThemeEditorContext } from "./ThemeEditorContext";

const ERROR_MESSAGES = {
	EMPTY: "Please paste JSON with valid theme variables to import",
	INVALID_FORMAT:
		"Invalid theme format. Expected JSON object with property names and hex colors",
	GENERIC: "Failed to import theme colors",
};

export function ImportButton() {
	const ctx = useThemeEditorContext();
	const [showImport, setShowImport] = createSignal(false);
	const [importValue, setImportValue] = createSignal("");
	const [error, setError] = createSignal<string | null>(null);
	const [importing, setImporting] = createSignal(false);

	const disabled = () => !ctx.store.tweaksOn;

	const handleClick = () => {
		if (disabled()) return;
		setShowImport(true);
		setImportValue("");
		setError(null);
	};

	const handleCancel = () => {
		setShowImport(false);
		setImportValue("");
		setError(null);
	};

	const handleImport = async () => {
		const input = importValue().trim();

		// Validate empty input
		if (!input) {
			setError(ERROR_MESSAGES.EMPTY);
			return;
		}

		// Parse and validate
		const parsed = parseImportJSON(input);
		if (!parsed) {
			setError(ERROR_MESSAGES.INVALID_FORMAT);
			return;
		}

		// Validate at least one property
		if (Object.keys(parsed).length === 0) {
			setError(ERROR_MESSAGES.EMPTY);
			return;
		}

		setImporting(true);
		setError(null);

		try {
			const currentTabId = ctx.tabId();
			if (!currentTabId) {
				logger.warn("ImportButton: No tab ID available");
				return;
			}

			// Close modal and reset state
			setShowImport(false);
			setImportValue("");

			// Import by updating each property individually
			for (const [propertyName, value] of Object.entries(parsed)) {
				await ContentScript.sendMessage(
					"updateWorkingProperty",
					{ propertyName, value },
					currentTabId,
				);
			}

			logger.debug("ImportButton: Import successful", {
				count: Object.keys(parsed).length,
			});
		} catch (err) {
			setError(ERROR_MESSAGES.GENERIC);
			logger.error("ImportButton: Import failed", err);
		} finally {
			setImporting(false);
		}
	};

	return (
		<div class={styles.container}>
			{!showImport() ? (
				<Button
					variant="secondary"
					class={styles.importBtn}
					onClick={handleClick}
					disabled={disabled()}
					title={disabled() ? "Enable tweaks to import" : "Import theme colors"}
				>
					Import
				</Button>
			) : (
				<div class={styles.importContainer}>
					<textarea
						class={styles.textarea}
						placeholder='Paste theme JSON (e.g., {"--palette-primary-main":"#FF5733"})'
						value={importValue()}
						onInput={(e) => {
							setImportValue(e.currentTarget.value);
							setError(null);
						}}
						autofocus
					/>
					<div class={styles.buttons}>
						<Button
							variant="secondary"
							onClick={handleCancel}
							disabled={importing()}
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleImport}
							disabled={importing()}
						>
							{importing() ? "Importing..." : "Import"}
						</Button>
					</div>
					{error() && (
						<Typography variant="caption" class={styles.error}>
							{error()}
						</Typography>
					)}
				</div>
			)}
		</div>
	);
}

/**
 * Parses import JSON and validates structure
 * Returns object with property names → hex colors or null if invalid
 */
function parseImportJSON(input: string): Record<string, string> | null {
	try {
		const parsed = JSON.parse(input);

		// Validate it's an object
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return null;
		}

		for (const [key, value] of Object.entries(parsed)) {
			if (
				typeof key !== "string" ||
				typeof value !== "string" ||
				!colord(value).isValid()
			) {
				return null;
			}
		}

		return parsed as Record<string, string>;
	} catch {
		// JSON parse error
		return null;
	}
}
