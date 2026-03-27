# Amz Stow HeatMap

Userscript automation for the Amazon stow heat map page at `YYZ9`.

## What It Does

On page load, the script:

1. Clicks the `heat` control if it is present.
2. Selects floor `1` if it is not already selected.
3. Sets the grouping dropdown to `Aisle`.
4. Clicks `lockedNo` if that control is present.
5. Clicks the submit button.
6. Clicks the first map thumbnail.
7. Clicks the heat map toggle.
8. Makes tabs `tab_2` and `tab_3` visible.
9. Waits, then reloads the page and repeats.

The script only runs once per page load and guards against overlapping runs.

## Target Page

The userscript matches:

`https://stowmap-na.amazon.com/stowmap/loadFCAreaMap.htm?warehouseId=YYZ9`

## Config

```js
const CONFIG = {
  debug: false,
  defaultTimeoutMs: 15000,
  pollEveryMs: 200,
  stepDelayMs: 1000,
  loopEveryMs: 10000,
}
```

- `debug`: enables console logging.
- `defaultTimeoutMs`: maximum wait per selector lookup.
- `pollEveryMs`: selector polling interval.
- `stepDelayMs`: delay between workflow steps.
- `loopEveryMs`: wait before the page reloads for the next run.

## Notes

- The workflow waits for clickable, visible elements before clicking them.
- The heat map selector supports both `id="show-heat-map"` and `id=" show-heat-map"`.
- If an expected selector does not appear before timeout, the script logs the failure to the console.

## License

See `LICENSE`.
