## Change tweaks toggle behavior a bit
Next to each color picker, show a badge indicating that color is different from the current Pumble theme default

If no colors stored:
- Hide Reset button
- Hide Tweaks ON/OFF checkbox

Rename the checkbox: "Turn tweaks ON/OFF for current theme".

Fix:
- When theme is changed, tweaks for that team should be ON or OFF depending on that theme's saved `disabled` state. The checkbox should reflect that correctly (or be hidden).

## Add Theme Name
Add the current theme name at the top as a title. It should be making it clear that color pickers and Reset button would only affect this theme

## Disable all tweaks
Add global state to basically disable extension. It would just remove custom properties from the app's html. Add a checkbox at the top of the popup to toggle it.

## Save and delete presets
- Add a button to Save preset
