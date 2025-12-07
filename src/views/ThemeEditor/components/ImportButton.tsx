import { colord } from "colord";
import { createSignal } from "solid-js";
import { useInputDialog } from "@/components/Dialog";
import { useThemeEditorContext } from "@/context/ThemeEditorContext";
import { ContentScript } from "@/entrypoints/content/messenger";
import { logger } from "@/lib/logger";

const ERROR_MESSAGES = {
	EMPTY: "Please paste JSON with valid theme variables to import",
	INVALID_FORMAT:
		"Invalid theme format. Expected JSON object with property names and colors",
	GENERIC: "Failed to import theme colors",
};

export function ImportButton() {
	const ctx = useThemeEditorContext();
	const [importing, setImporting] = createSignal(false);

	const disabled = () => !ctx.store.tweaksOn;

	const importDialog = useInputDialog();

	const validate = (value: string) => {
		const input = value.trim();

		// Validate empty input
		if (!input) {
			return ERROR_MESSAGES.EMPTY;
		}

		// Parse and validate
		const parsed = parseImportJSON(input);
		if (!parsed) {
			return ERROR_MESSAGES.INVALID_FORMAT;
		}

		// Validate at least one property
		if (Object.keys(parsed).length === 0) {
			return ERROR_MESSAGES.EMPTY;
		}

		return null;
	};

	const handleImport = async (value: string) => {
		// already validated
		const parsed = parseImportJSON(value) as Record<string, string>;

		setImporting(true);

		try {
			const currentTabId = ctx.tabId();
			if (!currentTabId) {
				logger.warn("ImportButton: No tab ID available");
				return;
			}

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
			logger.error("ImportButton: Import failed", err);
		} finally {
			setImporting(false);
		}
	};

	const openImportDialog = () => {
		if (disabled()) return;

		importDialog.open({
			type: "textarea",
			title: "Import preset",
			placeholder:
				'Paste theme JSON (e.g., {"--palette-primary-main":"#FF5733"})',
			confirmText: importing() ? "Importing..." : "Import",
			onConfirm: handleImport,
			validate,
		});
	};

	return (
		<>
			<button
				class="btn btn-outline btn-wide"
				onClick={openImportDialog}
				disabled={disabled()}
				title={disabled() ? "Enable tweaks to import" : "Import theme colors"}
			>
				Import
			</button>

			{importDialog.Dialog()}
		</>
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
				delete parsed[key];
			}
		}

		return parsed as Record<string, string>;
	} catch {
		// JSON parse error
		return null;
	}
}
