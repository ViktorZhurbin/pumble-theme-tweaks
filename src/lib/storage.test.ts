import { fakeBrowser } from "@webext-core/fake-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredCssProperties } from "@/types/storage";
import { Storage } from "./storage";

describe("Storage", () => {
	beforeEach(() => {
		// Clear storage before each test
		fakeBrowser.reset();
	});

	describe("getTweaksOn / setTweaksOn", () => {
		it("should default to true when not set", async () => {
			const result = await Storage.getTweaksOn();
			expect(result).toBe(true);
		});

		it("should save and retrieve tweaks on state", async () => {
			await Storage.setTweaksOn(false);
			const result = await Storage.getTweaksOn();
			expect(result).toBe(false);
		});

		it("should update tweaks on state", async () => {
			await Storage.setTweaksOn(false);
			await Storage.setTweaksOn(true);
			const result = await Storage.getTweaksOn();
			expect(result).toBe(true);
		});

		it("should handle storage errors gracefully", async () => {
			// Mock storage.sync.get to throw error
			vi.spyOn(fakeBrowser.storage.sync, "get").mockRejectedValueOnce(
				new Error("Storage error"),
			);

			// Should return default value (true) on error
			const result = await Storage.getTweaksOn();
			expect(result).toBe(true);
		});
	});

	describe("getWorkingTweaks / setWorkingTweaks", () => {
		it("should default to empty cssProperties when not set", async () => {
			const result = await Storage.getWorkingTweaks();
			expect(result).toEqual({ cssProperties: {} });
		});

		it("should save and retrieve working tweaks", async () => {
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};

			await Storage.setWorkingTweaks(cssProperties);
			const result = await Storage.getWorkingTweaks();

			expect(result.cssProperties).toEqual(cssProperties);
		});

		it("should overwrite existing working tweaks", async () => {
			const first: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};
			const second: StoredCssProperties = {
				"--left-nav-text-high": { value: "#ffffff", enabled: true },
			};

			await Storage.setWorkingTweaks(first);
			await Storage.setWorkingTweaks(second);

			const result = await Storage.getWorkingTweaks();
			expect(result.cssProperties).toEqual(second);
		});
	});

	describe("saveWorkingProperty", () => {
		it("should save a single property to working state", async () => {
			await Storage.saveWorkingProperty("--palette-secondary-main", "#ff5733");

			const result = await Storage.getWorkingTweaks();
			expect(result.cssProperties["--palette-secondary-main"]).toEqual({
				value: "#ff5733",
				enabled: true,
			});
		});

		it("should preserve existing properties when saving new one", async () => {
			await Storage.saveWorkingProperty("--palette-secondary-main", "#ff5733");
			await Storage.saveWorkingProperty("--left-nav-text-high", "#ffffff");

			const result = await Storage.getWorkingTweaks();
			expect(result.cssProperties["--palette-secondary-main"]).toEqual({
				value: "#ff5733",
				enabled: true,
			});
			expect(result.cssProperties["--left-nav-text-high"]).toEqual({
				value: "#ffffff",
				enabled: true,
			});
		});

		it("should update existing property value", async () => {
			await Storage.saveWorkingProperty("--palette-secondary-main", "#ff5733");
			await Storage.saveWorkingProperty("--palette-secondary-main", "#00ff00");

			const result = await Storage.getWorkingTweaks();
			expect(result.cssProperties["--palette-secondary-main"]?.value).toBe(
				"#00ff00",
			);
		});

		it("should preserve enabled state when updating value", async () => {
			// Set initial property
			await Storage.setWorkingTweaks({
				"--palette-secondary-main": { value: "#ff5733", enabled: false },
			});

			// Update value
			await Storage.saveWorkingProperty("--palette-secondary-main", "#00ff00");

			const result = await Storage.getWorkingTweaks();
			expect(result.cssProperties["--palette-secondary-main"]).toEqual({
				value: "#00ff00",
				enabled: false, // Should preserve enabled: false
			});
		});
	});

	describe("clearWorkingTweaks", () => {
		it("should clear all working tweaks", async () => {
			await Storage.setWorkingTweaks({
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			});

			await Storage.clearWorkingTweaks();

			const result = await Storage.getWorkingTweaks();
			expect(result.cssProperties).toEqual({});
		});
	});

	describe("getSelectedPreset / setSelectedPreset", () => {
		it("should default to null when not set", async () => {
			const result = await Storage.getSelectedPreset();
			expect(result).toBeNull();
		});

		it("should save and retrieve selected preset", async () => {
			await Storage.setSelectedPreset("Dark Theme");
			const result = await Storage.getSelectedPreset();
			expect(result).toBe("Dark Theme");
		});

		it("should update selected preset", async () => {
			await Storage.setSelectedPreset("Dark Theme");
			await Storage.setSelectedPreset("Light Theme");
			const result = await Storage.getSelectedPreset();
			expect(result).toBe("Light Theme");
		});

		it("should allow setting to null", async () => {
			await Storage.setSelectedPreset("Dark Theme");
			await Storage.setSelectedPreset(null);
			const result = await Storage.getSelectedPreset();
			expect(result).toBeNull();
		});
	});

	describe("getAllPresets / getPreset", () => {
		it("should default to empty object when no presets", async () => {
			const result = await Storage.getAllPresets();
			expect(result).toEqual({});
		});

		it("should retrieve all presets", async () => {
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};

			await Storage.createPreset("Dark Theme", cssProperties);

			const result = await Storage.getAllPresets();
			expect(result).toHaveProperty("Dark Theme");
			expect(result["Dark Theme"]?.cssProperties).toEqual(cssProperties);
		});

		it("should retrieve a single preset by name", async () => {
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};

			await Storage.createPreset("Dark Theme", cssProperties);

			const result = await Storage.getPreset("Dark Theme");
			expect(result?.name).toBe("Dark Theme");
			expect(result?.cssProperties).toEqual(cssProperties);
		});

		it("should return undefined for non-existent preset", async () => {
			const result = await Storage.getPreset("Non Existent");
			expect(result).toBeUndefined();
		});
	});

	describe("createPreset", () => {
		it("should create a new preset", async () => {
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};

			await Storage.createPreset("Dark Theme", cssProperties);

			const preset = await Storage.getPreset("Dark Theme");
			expect(preset?.name).toBe("Dark Theme");
			expect(preset?.cssProperties).toEqual(cssProperties);
			expect(preset?.createdAt).toBeDefined();
			expect(preset?.updatedAt).toBeDefined();
		});

		it("should throw error if preset already exists", async () => {
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};

			await Storage.createPreset("Dark Theme", cssProperties);

			await expect(
				Storage.createPreset("Dark Theme", cssProperties),
			).rejects.toThrow('Preset "Dark Theme" already exists');
		});

		it("should set createdAt and updatedAt timestamps", async () => {
			const beforeCreate = Date.now();

			await Storage.createPreset("Dark Theme", {});

			const preset = await Storage.getPreset("Dark Theme");
			const afterCreate = Date.now();

			expect(preset?.createdAt).toBeDefined();
			expect(preset?.updatedAt).toBeDefined();

			const createdAtTime = new Date(preset?.createdAt ?? "").getTime();
			expect(createdAtTime).toBeGreaterThanOrEqual(beforeCreate);
			expect(createdAtTime).toBeLessThanOrEqual(afterCreate);
		});
	});

	describe("updatePreset", () => {
		it("should update an existing preset", async () => {
			const initialProps: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};
			const updatedProps: StoredCssProperties = {
				"--palette-secondary-main": { value: "#00ff00", enabled: true },
			};

			await Storage.createPreset("Dark Theme", initialProps);
			await Storage.updatePreset("Dark Theme", updatedProps);

			const preset = await Storage.getPreset("Dark Theme");
			expect(preset?.cssProperties).toEqual(updatedProps);
		});

		it("should throw error if preset does not exist", async () => {
			await expect(Storage.updatePreset("Non Existent", {})).rejects.toThrow(
				'Preset "Non Existent" does not exist',
			);
		});

		it("should update updatedAt timestamp", async () => {
			await Storage.createPreset("Dark Theme", {});

			const beforeUpdate = Date.now();
			await Storage.updatePreset("Dark Theme", {});
			const afterUpdate = Date.now();

			const preset = await Storage.getPreset("Dark Theme");
			const updatedAtTime = new Date(preset?.updatedAt ?? "").getTime();
			expect(updatedAtTime).toBeGreaterThanOrEqual(beforeUpdate);
			expect(updatedAtTime).toBeLessThanOrEqual(afterUpdate);
		});

		it("should preserve createdAt timestamp", async () => {
			await Storage.createPreset("Dark Theme", {});
			const originalCreatedAt = (await Storage.getPreset("Dark Theme"))
				?.createdAt;

			await Storage.updatePreset("Dark Theme", {});

			const preset = await Storage.getPreset("Dark Theme");
			expect(preset?.createdAt).toBe(originalCreatedAt);
		});
	});

	describe("deletePreset", () => {
		it("should delete an existing preset", async () => {
			await Storage.createPreset("Dark Theme", {});

			await Storage.deletePreset("Dark Theme");

			const preset = await Storage.getPreset("Dark Theme");
			expect(preset).toBeUndefined();
		});

		it("should not throw error when deleting non-existent preset", async () => {
			await expect(
				Storage.deletePreset("Non Existent"),
			).resolves.toBeUndefined();
		});

		it("should preserve other presets when deleting one", async () => {
			await Storage.createPreset("Dark Theme", {});
			await Storage.createPreset("Light Theme", {});

			await Storage.deletePreset("Dark Theme");

			const allPresets = await Storage.getAllPresets();
			expect(allPresets).not.toHaveProperty("Dark Theme");
			expect(allPresets).toHaveProperty("Light Theme");
		});
	});

	describe("renamePreset", () => {
		it("should rename an existing preset", async () => {
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};

			await Storage.createPreset("Old Name", cssProperties);
			await Storage.renamePreset("Old Name", "New Name");

			const oldPreset = await Storage.getPreset("Old Name");
			const newPreset = await Storage.getPreset("New Name");

			expect(oldPreset).toBeUndefined();
			expect(newPreset?.name).toBe("New Name");
			expect(newPreset?.cssProperties).toEqual(cssProperties);
		});

		it("should throw error if source preset does not exist", async () => {
			await expect(
				Storage.renamePreset("Non Existent", "New Name"),
			).rejects.toThrow('Preset "Non Existent" does not exist');
		});

		it("should throw error if target preset already exists", async () => {
			await Storage.createPreset("Old Name", {});
			await Storage.createPreset("Existing Name", {});

			await expect(
				Storage.renamePreset("Old Name", "Existing Name"),
			).rejects.toThrow('Preset "Existing Name" already exists');
		});

		it("should update selected preset if renamed preset is selected", async () => {
			await Storage.createPreset("Old Name", {});
			await Storage.setSelectedPreset("Old Name");

			await Storage.renamePreset("Old Name", "New Name");

			const selectedPreset = await Storage.getSelectedPreset();
			expect(selectedPreset).toBe("New Name");
		});

		it("should not change selected preset if different preset is renamed", async () => {
			await Storage.createPreset("Preset A", {});
			await Storage.createPreset("Preset B", {});
			await Storage.setSelectedPreset("Preset A");

			await Storage.renamePreset("Preset B", "Preset C");

			const selectedPreset = await Storage.getSelectedPreset();
			expect(selectedPreset).toBe("Preset A");
		});

		it("should update updatedAt timestamp", async () => {
			await Storage.createPreset("Old Name", {});

			const beforeRename = Date.now();
			await Storage.renamePreset("Old Name", "New Name");
			const afterRename = Date.now();

			const preset = await Storage.getPreset("New Name");
			const updatedAtTime = new Date(preset?.updatedAt ?? "").getTime();
			expect(updatedAtTime).toBeGreaterThanOrEqual(beforeRename);
			expect(updatedAtTime).toBeLessThanOrEqual(afterRename);
		});
	});

	describe("Integration: Complex workflows", () => {
		it("should handle complete preset lifecycle", async () => {
			// Create preset
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};
			await Storage.createPreset("My Theme", cssProperties);

			// Select it
			await Storage.setSelectedPreset("My Theme");

			// Update it
			const updatedProps: StoredCssProperties = {
				"--palette-secondary-main": { value: "#00ff00", enabled: true },
			};
			await Storage.updatePreset("My Theme", updatedProps);

			// Verify update
			const preset = await Storage.getPreset("My Theme");
			expect(preset?.cssProperties).toEqual(updatedProps);

			// Rename it
			await Storage.renamePreset("My Theme", "My Theme v2");

			// Verify selected preset was updated
			const selected = await Storage.getSelectedPreset();
			expect(selected).toBe("My Theme v2");

			// Delete it
			await Storage.deletePreset("My Theme v2");

			// Verify it's gone
			const deleted = await Storage.getPreset("My Theme v2");
			expect(deleted).toBeUndefined();
		});

		it("should handle working tweaks and presets independently", async () => {
			// Set working tweaks
			const workingProps: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};
			await Storage.setWorkingTweaks(workingProps);

			// Create preset with different values
			const presetProps: StoredCssProperties = {
				"--palette-secondary-main": { value: "#00ff00", enabled: true },
			};
			await Storage.createPreset("My Preset", presetProps);

			// Verify they're independent
			const working = await Storage.getWorkingTweaks();
			const preset = await Storage.getPreset("My Preset");

			expect(working.cssProperties).toEqual(workingProps);
			expect(preset?.cssProperties).toEqual(presetProps);
		});
	});
});
