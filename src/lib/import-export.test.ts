import { describe, expect, it } from "vitest";
import type { WorkingTweaks } from "@/types/tweaks";
import {
	getExportJson,
	getScriptString,
	parseImportJSON,
	validateImport,
} from "./import-export";

describe("Import/Export", () => {
	describe("getExportJson", () => {
		it("should export base properties as JSON", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: true,
					},
					"--left-nav-text-high": {
						value: "#ffffff",
						initialValue: "#e0e0e0",
						enabled: true,
					},
				},
			};

			const json = getExportJson(tweaks);
			const parsed = JSON.parse(json);

			expect(parsed).toHaveProperty("--palette-secondary-main", "#ff5733");
			expect(parsed).toHaveProperty("--left-nav-text-high", "#ffffff");
		});

		it("should use initialValue when property is disabled", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: false,
					},
				},
			};

			const json = getExportJson(tweaks);
			const parsed = JSON.parse(json);

			expect(parsed["--palette-secondary-main"]).toBe("#000000");
		});

		it("should use initialValue when value is null", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: null,
						initialValue: "#000000",
						enabled: true,
					},
				},
			};

			const json = getExportJson(tweaks);
			const parsed = JSON.parse(json);

			expect(parsed["--palette-secondary-main"]).toBe("#000000");
		});

		it("should produce valid JSON format", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: true,
					},
				},
			};

			const json = getExportJson(tweaks);

			expect(() => JSON.parse(json)).not.toThrow();
		});

		it("should handle empty tweaks", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {},
			};

			const json = getExportJson(tweaks);
			const parsed = JSON.parse(json);

			expect(parsed).toEqual({});
		});
	});

	describe("getScriptString", () => {
		it("should generate executable script with base properties", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: true,
					},
				},
			};

			const script = getScriptString(tweaks);

			expect(script).toContain("--palette-secondary-main");
			expect(script).toContain("#ff5733");
			expect(script).toContain("document.documentElement.style.setProperty");
		});

		it("should include derived colors in script", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: true,
					},
				},
			};

			const script = getScriptString(tweaks);

			// Should include base property
			expect(script).toContain("--palette-secondary-main");
			// Should include derived properties
			expect(script).toContain("--palette-secondary-dark");
			expect(script).toContain("--palette-secondary-light");
		});

		it("should wrap in IIFE (immediately invoked function expression)", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: true,
					},
				},
			};

			const script = getScriptString(tweaks);

			expect(script).toMatch(/^\(function\(\)/);
			expect(script).toMatch(/\)\(\)$/);
		});

		it("should use initialValue when property is disabled", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: false,
					},
				},
			};

			const script = getScriptString(tweaks);

			expect(script).toContain("#000000");
			expect(script).not.toContain("#ff5733");
		});
	});

	describe("parseImportJSON", () => {
		it("should parse valid JSON with base properties", () => {
			const input = JSON.stringify({
				"--palette-secondary-main": "#ff5733",
				"--left-nav-text-high": "#ffffff",
			});

			const result = parseImportJSON(input);

			expect(result).not.toBeNull();
			expect(result).toHaveProperty("--palette-secondary-main");
			expect(result?.["--palette-secondary-main"]).toEqual({
				value: "#ff5733",
				enabled: true,
			});
		});

		it("should auto-compute derived colors from base properties", () => {
			const input = JSON.stringify({
				"--palette-secondary-main": "#ff5733",
			});

			const result = parseImportJSON(input);

			expect(result).not.toBeNull();
			// Should have base property
			expect(result).toHaveProperty("--palette-secondary-main");
			// Should have derived properties
			expect(result).toHaveProperty("--palette-secondary-dark");
			expect(result).toHaveProperty("--palette-secondary-light");
			// All should be enabled
			expect(result?.["--palette-secondary-dark"]?.enabled).toBe(true);
		});

		it("should return null for invalid JSON", () => {
			const result = parseImportJSON("not valid json");

			expect(result).toBeNull();
		});

		it("should return null for non-object JSON", () => {
			const testCases = ['["array"]', '"string"', "123", "true", "null"];

			for (const input of testCases) {
				const result = parseImportJSON(input);
				expect(result).toBeNull();
			}
		});

		it("should ignore invalid color values", () => {
			const input = JSON.stringify({
				"--palette-secondary-main": "not-a-color",
				"--left-nav-text-high": "#ffffff",
			});

			const result = parseImportJSON(input);

			expect(result).not.toBeNull();
			// Should skip invalid color
			expect(result).not.toHaveProperty("--palette-secondary-main");
			// Should include valid color
			expect(result).toHaveProperty("--left-nav-text-high");
		});

		it("should ignore non-base properties in import", () => {
			const input = JSON.stringify({
				"--palette-secondary-main": "#ff5733",
				"--palette-secondary-dark": "#000000", // This is a derived property
				"--unknown-property": "#123456",
			});

			const result = parseImportJSON(input);

			expect(result).not.toBeNull();
			// Should import base property
			expect(result).toHaveProperty("--palette-secondary-main");
			// Derived property should be computed, not imported
			expect(result?.["--palette-secondary-dark"]?.value).not.toBe("#000000");
		});

		it("should handle various color formats", () => {
			const testCases = [
				{ format: "hex", color: "#ff5733" },
				{ format: "rgb", color: "rgb(255, 87, 51)" },
				{ format: "rgba", color: "rgba(255, 87, 51, 0.5)" },
				{ format: "hsl", color: "hsl(12, 100%, 60%)" },
			];

			for (const { color } of testCases) {
				const input = JSON.stringify({
					"--palette-secondary-main": color,
				});

				const result = parseImportJSON(input);

				expect(result).not.toBeNull();
				expect(result).toHaveProperty("--palette-secondary-main");
			}
		});

		it("should handle empty object", () => {
			const input = JSON.stringify({});

			const result = parseImportJSON(input);

			expect(result).toEqual({});
		});

		it("should validate colors using colord", () => {
			const input = JSON.stringify({
				"--palette-secondary-main": "#gggggg", // Invalid hex
			});

			const result = parseImportJSON(input);

			expect(result).toEqual({});
		});
	});

	describe("validateImport", () => {
		it("should return null for valid input", () => {
			const input = JSON.stringify({
				"--palette-secondary-main": "#ff5733",
			});

			const error = validateImport(input);

			expect(error).toBeNull();
		});

		it("should return error for empty input", () => {
			const error = validateImport("");

			expect(error).toBe(
				"Please paste JSON with valid theme variables to import",
			);
		});

		it("should return error for whitespace-only input", () => {
			const error = validateImport("   \n\t  ");

			expect(error).toBe(
				"Please paste JSON with valid theme variables to import",
			);
		});

		it("should return error for invalid JSON", () => {
			const error = validateImport("not valid json");

			expect(error).toBe(
				"Invalid theme format. Expected JSON object with property names and colors",
			);
		});

		it("should return error for JSON with no valid properties", () => {
			const input = JSON.stringify({
				"--unknown-property": "#123456",
			});

			const error = validateImport(input);

			expect(error).toBe(
				"Please paste JSON with valid theme variables to import",
			);
		});

		it("should return error for array JSON", () => {
			const error = validateImport('["array"]');

			expect(error).toBe(
				"Invalid theme format. Expected JSON object with property names and colors",
			);
		});

		it("should handle valid input with whitespace", () => {
			const input = `  ${JSON.stringify({
				"--palette-secondary-main": "#ff5733",
			})}  `;

			const error = validateImport(input);

			expect(error).toBeNull();
		});
	});

	describe("Integration: Export → Import round-trip", () => {
		it("should maintain data integrity through export/import cycle", () => {
			const originalTweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: true,
					},
					"--palette-primary-main": {
						value: "#00ff00",
						initialValue: "#cccccc",
						enabled: true,
					},
				},
			};

			// Export
			const exportedJson = getExportJson(originalTweaks);

			// Import
			const imported = parseImportJSON(exportedJson);

			expect(imported).not.toBeNull();
			// Base properties should match
			expect(imported?.["--palette-secondary-main"]?.value).toBe("#ff5733");
			expect(imported?.["--palette-primary-main"]?.value).toBe("#00ff00");
			// All should be enabled
			expect(imported?.["--palette-secondary-main"]?.enabled).toBe(true);
			expect(imported?.["--palette-primary-main"]?.enabled).toBe(true);
		});

		it("should validate exported JSON successfully", () => {
			const tweaks: WorkingTweaks = {
				cssProperties: {
					"--palette-secondary-main": {
						value: "#ff5733",
						initialValue: "#000000",
						enabled: true,
					},
				},
			};

			const exportedJson = getExportJson(tweaks);
			const error = validateImport(exportedJson);

			expect(error).toBeNull();
		});
	});
});
