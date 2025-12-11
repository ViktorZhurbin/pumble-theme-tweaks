import { colord } from "colord";
import { describe, expect, it } from "vitest";
import { ColorDerivation } from "./color-derivation";

describe("ColorDerivation", () => {
	describe("computeCssProperties", () => {
		it("should compute derived colors for --palette-secondary-main", () => {
			const baseColor = "#ff5733";
			const result = ColorDerivation.computeCssProperties(
				"--palette-secondary-main",
				baseColor,
			);

			expect(result).toHaveProperty("--palette-secondary-dark");
			expect(result).toHaveProperty("--palette-secondary-light");

			// Verify darker variant
			const expectedDark = colord(baseColor).darken(0.2).toRgbString();
			expect(result["--palette-secondary-dark"]).toBe(expectedDark);

			// Verify lighter variant
			const expectedLight = colord(baseColor).lighten(0.2).toRgbString();
			expect(result["--palette-secondary-light"]).toBe(expectedLight);
		});

		it("should compute derived colors with alpha for --left-nav-text-high", () => {
			const baseColor = "#ffffff";
			const result = ColorDerivation.computeCssProperties(
				"--left-nav-text-high",
				baseColor,
			);

			expect(result).toHaveProperty("--left-nav-hover");
			expect(result).toHaveProperty("--left-nav-selected");
			expect(result).toHaveProperty("--left-nav-icons");
			expect(result).toHaveProperty("--left-nav-text-medium");
			expect(result).toHaveProperty("--left-nav-text-high");

			// Verify alpha transformations
			expect(result["--left-nav-hover"]).toBe(
				colord(baseColor).alpha(0.22).toRgbString(),
			);
			expect(result["--left-nav-selected"]).toBe(
				colord(baseColor).alpha(0.34).toRgbString(),
			);
			expect(result["--left-nav-icons"]).toBe(
				colord(baseColor).alpha(0.74).toRgbString(),
			);
			expect(result["--left-nav-text-medium"]).toBe(
				colord(baseColor).alpha(0.8).toRgbString(),
			);
			expect(result["--left-nav-text-high"]).toBe(
				colord(baseColor).alpha(0.87).toRgbString(),
			);
		});

		it("should return identity for properties without transformations", () => {
			const baseColor = "#ff5733";
			const result = ColorDerivation.computeCssProperties(
				"--palette-primary-main",
				baseColor,
			);

			// Now includes identity transform
			expect(result).toEqual({ "--palette-primary-main": "#ff5733" });
		});

		it("should handle various color formats", () => {
			const testCases = [
				{ color: "#ff5733" },
				{ color: "rgb(255, 87, 51)" },
				{ color: "rgba(255, 87, 51, 0.5)" },
				{ color: "hsl(12, 100%, 60%)" },
			];

			for (const { color } of testCases) {
				const result = ColorDerivation.computeCssProperties(
					"--palette-secondary-main",
					color,
				);

				expect(result).toHaveProperty("--palette-secondary-dark");
				expect(result).toHaveProperty("--palette-secondary-light");
				expect(result["--palette-secondary-dark"]).toBeTruthy();
				expect(result["--palette-secondary-light"]).toBeTruthy();
			}
		});

		it("should handle edge case colors", () => {
			const edgeCases = [
				{ color: "#ffffff" },
				{ color: "#000000" },
				{ color: "rgba(0, 0, 0, 0)" },
			];

			for (const { color } of edgeCases) {
				const result = ColorDerivation.computeCssProperties(
					"--palette-secondary-main",
					color,
				);

				// Should not throw and should produce valid output
				expect(result).toBeDefined();
				expect(result["--palette-secondary-dark"]).toBeTruthy();
				expect(result["--palette-secondary-light"]).toBeTruthy();
			}
		});

		it("should produce consistent results for same input", () => {
			const baseColor = "#3498db";

			const result1 = ColorDerivation.computeCssProperties(
				"--palette-secondary-main",
				baseColor,
			);
			const result2 = ColorDerivation.computeCssProperties(
				"--palette-secondary-main",
				baseColor,
			);

			expect(result1).toEqual(result2);
		});
	});

	describe("getCssPropertyNames", () => {
		it("should return all CSS property names for --palette-secondary-main", () => {
			const result = ColorDerivation.getCssPropertyNames(
				"--palette-secondary-main",
			);

			// Now includes identity transform for the base property
			expect(result).toEqual([
				"--palette-secondary-main",
				"--palette-secondary-dark",
				"--palette-secondary-light",
			]);
		});

		it("should return all derived property names for --left-nav-text-high", () => {
			const result = ColorDerivation.getCssPropertyNames(
				"--left-nav-text-high",
			);

			expect(result).toEqual([
				"--left-nav-hover",
				"--left-nav-selected",
				"--left-nav-icons",
				"--left-nav-text-medium",
				"--left-nav-text-high",
			]);
		});

		it("should return identity for properties without transformations", () => {
			const result = ColorDerivation.getCssPropertyNames(
				"--palette-primary-main",
			);

			// Now includes identity transform
			expect(result).toEqual(["--palette-primary-main"]);
		});

		it("should return CSS property for --background (identity)", () => {
			const result = ColorDerivation.getCssPropertyNames("--background");

			// Now includes identity transform
			expect(result).toEqual(["--background"]);
		});

		it("should return correct count of CSS properties", () => {
			const secondaryResult = ColorDerivation.getCssPropertyNames(
				"--palette-secondary-main",
			);
			// Now 3: base (identity) + dark + light
			expect(secondaryResult).toHaveLength(3);

			const navTextResult = ColorDerivation.getCssPropertyNames(
				"--left-nav-text-high",
			);
			// Still 5: all with alpha transforms
			expect(navTextResult).toHaveLength(5);
		});
	});

	describe("Integration: computeCssProperties + getCssPropertyNames", () => {
		it("should produce colors for all property names returned by getCssPropertyNames", () => {
			const baseColor = "#ff5733";
			const basePropertyName = "--palette-secondary-main";

			const propertyNames =
				ColorDerivation.getCssPropertyNames(basePropertyName);
			const colors = ColorDerivation.computeCssProperties(
				basePropertyName,
				baseColor,
			);

			for (const propName of propertyNames) {
				expect(colors).toHaveProperty(propName);
				expect(colors[propName]).toBeTruthy();
			}
		});

		it("should have matching keys between property names and computed colors", () => {
			const baseColor = "#ffffff";
			const basePropertyName = "--left-nav-text-high";

			const propertyNames =
				ColorDerivation.getCssPropertyNames(basePropertyName);
			const colors = ColorDerivation.computeCssProperties(
				basePropertyName,
				baseColor,
			);

			expect(Object.keys(colors).sort()).toEqual(propertyNames.sort());
		});
	});
});
