import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredCssProperties } from "@/types/storage";
import { ThemeState } from "./theme-state";

// Mock dependencies
vi.mock("@/lib/storage");
vi.mock("./dom-utils");
vi.mock("../background/messenger");

// Import mocked modules
import { Storage } from "@/lib/storage";
import { Background } from "../background/messenger";
import { DomUtils } from "./dom-utils";

describe("ThemeState - Integration Tests", () => {
	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();

		// Setup default mock implementations
		vi.mocked(Storage.getTweaksOn).mockResolvedValue(true);
		vi.mocked(Storage.getWorkingTweaks).mockResolvedValue({
			cssProperties: {},
		});
		vi.mocked(Storage.getSelectedPreset).mockResolvedValue(null);
		vi.mocked(Storage.getAllPresets).mockResolvedValue({});

		vi.mocked(DomUtils.getCSSProperties).mockReturnValue({
			"--palette-secondary-main": "#000000",
			"--left-nav-text-high": "#ffffff",
			"--palette-primary-main": "#0066cc",
			"--background": "#ffffff",
		});

		vi.mocked(Background.sendMessage).mockResolvedValue(undefined as never);
	});

	describe("reloadState", () => {
		it("should load state from storage and update current state", async () => {
			// Arrange
			const mockPresets = {
				"Dark Theme": {
					name: "Dark Theme",
					cssProperties: {
						"--palette-secondary-main": { value: "#ff5733", enabled: true },
					},
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			};

			vi.mocked(Storage.getSelectedPreset).mockResolvedValue("Dark Theme");
			vi.mocked(Storage.getAllPresets).mockResolvedValue(mockPresets);

			// Act
			await ThemeState.reloadState();
			const state = ThemeState.getCurrentState();

			// Assert
			expect(state.tweaksOn).toBe(true);
			expect(state.selectedPreset).toBe("Dark Theme");
			expect(state.savedPresets).toEqual(mockPresets);
		});

		it("should reset DOM before applying tweaks", async () => {
			// Act
			await ThemeState.reloadState();

			// Assert
			expect(DomUtils.resetCSSTweaks).toHaveBeenCalledOnce();
		});

		it("should apply enabled CSS properties to DOM when tweaks are on", async () => {
			// Arrange
			vi.mocked(Storage.getWorkingTweaks).mockResolvedValue({
				cssProperties: {
					"--palette-secondary-main": { value: "#ff5733", enabled: true },
					"--left-nav-text-high": { value: "#ffffff", enabled: false },
				},
			});

			// Act
			await ThemeState.reloadState();

			// Assert - only enabled properties should be applied
			expect(DomUtils.applyCSSProperty).toHaveBeenCalledWith(
				"--palette-secondary-main",
				"#ff5733",
			);
			expect(DomUtils.applyCSSProperty).not.toHaveBeenCalledWith(
				"--left-nav-text-high",
				expect.anything(),
			);
		});

		it("should not apply CSS properties when tweaks are off", async () => {
			// Arrange
			vi.mocked(Storage.getTweaksOn).mockResolvedValue(false);
			vi.mocked(Storage.getWorkingTweaks).mockResolvedValue({
				cssProperties: {
					"--palette-secondary-main": { value: "#ff5733", enabled: true },
				},
			});

			// Act
			await ThemeState.reloadState();

			// Assert
			expect(DomUtils.applyCSSProperty).not.toHaveBeenCalled();
		});

		it("should broadcast state change to popup", async () => {
			// Arrange
			vi.mocked(Background.sendMessage).mockImplementation(
				async (method: string) => {
					if (method === "getTabId") return 123 as never;
					return undefined as never;
				},
			);

			// Act
			await ThemeState.reloadState();

			// Assert
			expect(Background.sendMessage).toHaveBeenCalledWith(
				"getTabId",
				undefined,
			);
			expect(Background.sendMessage).toHaveBeenCalledWith("stateChanged", {
				state: expect.any(Object),
				tabId: 123,
			});
		});

		it("should update badge based on state", async () => {
			// Act - No preset, no changes
			await ThemeState.reloadState();

			// Assert
			expect(Background.sendMessage).toHaveBeenCalledWith("updateBadge", {
				badgeState: "DEFAULT",
			});
		});

		it("should set badge to OFF when tweaks are disabled", async () => {
			// Arrange
			vi.mocked(Storage.getTweaksOn).mockResolvedValue(false);

			// Act
			await ThemeState.reloadState();

			// Assert
			expect(Background.sendMessage).toHaveBeenCalledWith("updateBadge", {
				badgeState: "OFF",
			});
		});
	});

	describe("loadPreset", () => {
		it("should load preset into working state", async () => {
			// Arrange
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};

			vi.mocked(Storage.getPreset).mockResolvedValue({
				name: "Dark Theme",
				cssProperties,
				createdAt: "2024-01-01",
				updatedAt: "2024-01-01",
			});

			// Act
			await ThemeState.loadPreset("Dark Theme");

			// Assert
			expect(Storage.setWorkingTweaks).toHaveBeenCalledWith(cssProperties);
			expect(Storage.setSelectedPreset).toHaveBeenCalledWith("Dark Theme");
		});

		it("should handle non-existent preset gracefully", async () => {
			// Arrange
			vi.mocked(Storage.getPreset).mockResolvedValue(undefined);

			// Act
			await ThemeState.loadPreset("Non Existent");

			// Assert - should not throw and not update storage
			expect(Storage.setWorkingTweaks).not.toHaveBeenCalled();
			expect(Storage.setSelectedPreset).not.toHaveBeenCalled();
		});
	});

	describe("savePreset", () => {
		it("should save working state to selected preset", async () => {
			// Arrange - First load a preset
			const mockPresets = {
				"Dark Theme": {
					name: "Dark Theme",
					cssProperties: {
						"--palette-secondary-main": { value: "#ff5733", enabled: true },
					},
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			};

			vi.mocked(Storage.getSelectedPreset).mockResolvedValue("Dark Theme");
			vi.mocked(Storage.getAllPresets).mockResolvedValue(mockPresets);

			await ThemeState.reloadState();

			// Act
			await ThemeState.savePreset();

			// Assert
			expect(Storage.updatePreset).toHaveBeenCalledWith(
				"Dark Theme",
				expect.any(Object),
			);
		});

		it("should not save when no preset is selected", async () => {
			// Arrange - No preset selected
			await ThemeState.reloadState();

			// Act
			await ThemeState.savePreset();

			// Assert
			expect(Storage.updatePreset).not.toHaveBeenCalled();
		});
	});

	describe("savePresetAs", () => {
		it("should create new preset with working state", async () => {
			// Arrange
			await ThemeState.reloadState();

			// Act
			await ThemeState.savePresetAs("New Preset");

			// Assert
			expect(Storage.createPreset).toHaveBeenCalledWith(
				"New Preset",
				expect.any(Object),
			);
			expect(Storage.setSelectedPreset).toHaveBeenCalledWith("New Preset");
		});
	});

	describe("deletePreset", () => {
		it("should delete preset from storage", async () => {
			// Act
			await ThemeState.deletePreset("Old Preset");

			// Assert
			expect(Storage.deletePreset).toHaveBeenCalledWith("Old Preset");
		});

		it("should deselect preset if currently selected preset is deleted", async () => {
			// Arrange - Select a preset first
			vi.mocked(Storage.getSelectedPreset).mockResolvedValue("My Preset");
			await ThemeState.reloadState();

			// Act
			await ThemeState.deletePreset("My Preset");

			// Assert
			expect(Storage.setSelectedPreset).toHaveBeenCalledWith(null);
		});

		it("should not deselect if different preset is deleted", async () => {
			// Arrange - Select a preset first
			vi.mocked(Storage.getSelectedPreset).mockResolvedValue("Preset A");
			await ThemeState.reloadState();

			// Clear previous calls
			vi.clearAllMocks();

			// Act
			await ThemeState.deletePreset("Preset B");

			// Assert
			expect(Storage.setSelectedPreset).not.toHaveBeenCalled();
		});
	});

	describe("setTweaksOn", () => {
		it("should update tweaks enabled state", async () => {
			// Act
			await ThemeState.setTweaksOn(false);

			// Assert
			expect(Storage.setTweaksOn).toHaveBeenCalledWith(false);
		});
	});

	describe("resetWorkingTweaks", () => {
		it("should clear working tweaks and deselect preset", async () => {
			// Act
			await ThemeState.resetWorkingTweaks();

			// Assert
			expect(Storage.clearWorkingTweaks).toHaveBeenCalledOnce();
			expect(Storage.setSelectedPreset).toHaveBeenCalledWith(null);
		});
	});

	describe("updateWorkingProperty", () => {
		it("should apply CSS property to DOM", () => {
			// Act
			ThemeState.updateWorkingProperty("--palette-secondary-main", "#ff5733");

			// Assert
			expect(DomUtils.applyManyCSSProperties).toHaveBeenCalledWith(
				expect.objectContaining({
					"--palette-secondary-main": "#ff5733",
				}),
			);
		});

		it("should apply derived colors to DOM", () => {
			// Act
			ThemeState.updateWorkingProperty("--palette-secondary-main", "#ff5733");

			// Assert - Should include base + derived properties
			expect(DomUtils.applyManyCSSProperties).toHaveBeenCalledWith(
				expect.objectContaining({
					"--palette-secondary-main": "#ff5733",
					"--palette-secondary-dark": expect.any(String),
					"--palette-secondary-light": expect.any(String),
				}),
			);
		});

		it("should save property to storage with debounce", () => {
			// Act
			ThemeState.updateWorkingProperty("--palette-secondary-main", "#ff5733");

			// Assert
			expect(Storage.saveWorkingPropertyDebounced).toHaveBeenCalledWith(
				"--palette-secondary-main",
				"#ff5733",
			);
		});
	});

	describe("toggleWorkingProperty", () => {
		it("should toggle property enabled state", async () => {
			// Arrange - Set up some working tweaks
			vi.mocked(Storage.getWorkingTweaks).mockResolvedValue({
				cssProperties: {
					"--palette-secondary-main": { value: "#ff5733", enabled: true },
				},
			});
			await ThemeState.reloadState();

			// Act
			await ThemeState.toggleWorkingProperty("--palette-secondary-main", false);

			// Assert
			expect(Storage.setWorkingTweaks).toHaveBeenCalledWith(
				expect.objectContaining({
					"--palette-secondary-main": expect.objectContaining({
						enabled: false,
					}),
				}),
			);
		});

		it("should toggle derived properties along with base", async () => {
			// Arrange
			vi.mocked(Storage.getWorkingTweaks).mockResolvedValue({
				cssProperties: {
					"--palette-secondary-main": { value: "#ff5733", enabled: true },
					"--palette-secondary-dark": { value: "#cc4422", enabled: true },
					"--palette-secondary-light": { value: "#ff8844", enabled: true },
				},
			});
			await ThemeState.reloadState();

			// Act
			await ThemeState.toggleWorkingProperty("--palette-secondary-main", false);

			// Assert - All derived properties should be disabled
			expect(Storage.setWorkingTweaks).toHaveBeenCalledWith(
				expect.objectContaining({
					"--palette-secondary-dark": expect.objectContaining({
						enabled: false,
					}),
					"--palette-secondary-light": expect.objectContaining({
						enabled: false,
					}),
				}),
			);
		});
	});

	describe("importPreset", () => {
		it("should set imported CSS properties as working tweaks", async () => {
			// Arrange
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#ff5733", enabled: true },
			};

			// Act
			await ThemeState.importPreset(cssProperties);

			// Assert
			expect(Storage.setWorkingTweaks).toHaveBeenCalledWith(cssProperties);
		});
	});

	describe("Unsaved changes detection", () => {
		it("should detect changes when working state differs from preset", async () => {
			// Arrange - Load a preset
			const mockPresets = {
				"Dark Theme": {
					name: "Dark Theme",
					cssProperties: {
						"--palette-secondary-main": { value: "#ff5733", enabled: true },
					},
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			};

			vi.mocked(Storage.getSelectedPreset).mockResolvedValue("Dark Theme");
			vi.mocked(Storage.getAllPresets).mockResolvedValue(mockPresets);
			vi.mocked(Storage.getWorkingTweaks).mockResolvedValue({
				cssProperties: {
					"--palette-secondary-main": { value: "#00ff00", enabled: true }, // Different value
				},
			});

			// Act
			await ThemeState.reloadState();
			const state = ThemeState.getCurrentState();

			// Assert
			expect(state.hasUnsavedChanges).toBe(true);
		});

		it("should not detect changes when working state matches preset", async () => {
			// Arrange - Create preset with ALL base properties to match working state
			const cssProperties: StoredCssProperties = {
				"--palette-secondary-main": { value: "#000000", enabled: true },
				"--left-nav-text-high": { value: "#ffffff", enabled: true },
				"--palette-primary-main": { value: "#0066cc", enabled: true },
				"--background": { value: "#ffffff", enabled: true },
			};

			const mockPresets = {
				"Dark Theme": {
					name: "Dark Theme",
					cssProperties,
					createdAt: "2024-01-01",
					updatedAt: "2024-01-01",
				},
			};

			vi.mocked(Storage.getSelectedPreset).mockResolvedValue("Dark Theme");
			vi.mocked(Storage.getAllPresets).mockResolvedValue(mockPresets);
			vi.mocked(Storage.getWorkingTweaks).mockResolvedValue({
				cssProperties,
			});

			// Act
			await ThemeState.reloadState();
			const state = ThemeState.getCurrentState();

			// Assert
			expect(state.hasUnsavedChanges).toBe(false);
		});

		it("should detect changes when no preset is selected and colors are modified", async () => {
			// Arrange - No preset, but working tweaks have values
			vi.mocked(Storage.getWorkingTweaks).mockResolvedValue({
				cssProperties: {
					"--palette-secondary-main": { value: "#ff5733", enabled: true },
				},
			});

			vi.mocked(DomUtils.getCSSProperties).mockReturnValue({
				"--palette-secondary-main": "#000000", // Different from working value
				"--left-nav-text-high": "#ffffff",
				"--palette-primary-main": "#0066cc",
				"--background": "#ffffff",
			});

			// Act
			await ThemeState.reloadState();
			const state = ThemeState.getCurrentState();

			// Assert
			expect(state.hasUnsavedChanges).toBe(true);
		});
	});
});
