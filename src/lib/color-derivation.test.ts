import { colord } from "colord";
import { describe, expect, it } from "vitest";
import { ColorDerivation } from "./color-derivation";

describe("ColorDerivation", () => {
	describe("computeDerivedColorsFromBase", () => {
		it("should compute derived colors for --palette-secondary-main", () => {
			const baseColor = "#ff5733";
			const result = ColorDerivation.computeDerivedColorsFromBase(
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
			const result = ColorDerivation.computeDerivedColorsFromBase(
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

		it("should return empty object for properties without derived colors", () => {
			const baseColor = "#ff5733";
			const result = ColorDerivation.computeDerivedColorsFromBase(
				"--palette-primary-main",
				baseColor,
			);

			expect(result).toEqual({});
		});

		it("should handle various color formats", () => {
			const testCases = [
				{ color: "#ff5733" },
				{ color: "rgb(255, 87, 51)" },
				{ color: "rgba(255, 87, 51, 0.5)" },
				{ color: "hsl(12, 100%, 60%)" },
			];

			for (const { color } of testCases) {
				const result = ColorDerivation.computeDerivedColorsFromBase(
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
				const result = ColorDerivation.computeDerivedColorsFromBase(
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

			const result1 = ColorDerivation.computeDerivedColorsFromBase(
				"--palette-secondary-main",
				baseColor,
			);
			const result2 = ColorDerivation.computeDerivedColorsFromBase(
				"--palette-secondary-main",
				baseColor,
			);

			expect(result1).toEqual(result2);
		});
	});

	describe("getDerivedPropertyNamesForBase", () => {
		it("should return all derived property names for --palette-secondary-main", () => {
			const result = ColorDerivation.getDerivedPropertyNamesForBase(
				"--palette-secondary-main",
			);

			expect(result).toEqual([
				"--palette-secondary-dark",
				"--palette-secondary-light",
			]);
		});

		it("should return all derived property names for --left-nav-text-high", () => {
			const result = ColorDerivation.getDerivedPropertyNamesForBase(
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

		it("should return empty array for properties without derived colors", () => {
			const result = ColorDerivation.getDerivedPropertyNamesForBase(
				"--palette-primary-main",
			);

			expect(result).toEqual([]);
		});

		it("should return empty array for --background", () => {
			const result =
				ColorDerivation.getDerivedPropertyNamesForBase("--background");

			expect(result).toEqual([]);
		});

		it("should return correct count of derived properties", () => {
			const secondaryResult = ColorDerivation.getDerivedPropertyNamesForBase(
				"--palette-secondary-main",
			);
			expect(secondaryResult).toHaveLength(2);

			const navTextResult = ColorDerivation.getDerivedPropertyNamesForBase(
				"--left-nav-text-high",
			);
			expect(navTextResult).toHaveLength(5);
		});
	});

	describe("Integration: computeDerivedColorsFromBase + getDerivedPropertyNamesForBase", () => {
		it("should produce colors for all property names returned by getDerivedPropertyNamesForBase", () => {
			const baseColor = "#ff5733";
			const basePropertyName = "--palette-secondary-main";

			const propertyNames =
				ColorDerivation.getDerivedPropertyNamesForBase(basePropertyName);
			const colors = ColorDerivation.computeDerivedColorsFromBase(
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
				ColorDerivation.getDerivedPropertyNamesForBase(basePropertyName);
			const colors = ColorDerivation.computeDerivedColorsFromBase(
				basePropertyName,
				baseColor,
			);

			expect(Object.keys(colors).sort()).toEqual(propertyNames.sort());
		});
	});
});
