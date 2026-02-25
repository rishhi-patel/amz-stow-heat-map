# Workflow Auto Runner

This userscript now runs your requested actions in a fixed order:

1. `document.querySelector("#submitButton button").click()`
2. `document.getElementsByClassName("view-thumb")[0].click()`
3. `document.getElementById("show-heat-map").click()`
4. Click one tab based on session value (`ui-id-1` / `ui-id-2` / `ui-id-3`)

The full workflow waits 10 seconds after completion, then refreshes the page to start again.

## Session-based tab click

The script reads session storage key `tab`.

- `tab = "1"` → click `#ui-id-1`
- `tab = "2"` → click `#ui-id-2`
- `tab = "3"` → click `#ui-id-3`

If `tab` is missing or not `1/2/3`, the tab step is skipped.

## Config

```js
const CONFIG = {
  debug: false,
  defaultTimeoutMs: 15000,
  pollEveryMs: 200,
  stepDelayMs: 1000,
  loopEveryMs: 10000,
  sessionTabKey: "tab",
}
```

- `debug`: enable logs.
- `defaultTimeoutMs`: selector wait timeout.
- `pollEveryMs`: selector polling interval.
- `stepDelayMs`: delay between workflow steps.
- `loopEveryMs`: delay before the page refreshes to start the workflow again.
- `sessionTabKey`: session storage key used for the tab value.

## Notes

- The script waits for each selector before clicking.
- It supports both `id="show-heat-map"` and `id=" show-heat-map"` to match your previous selector variation.

## License

See `LICENSE`.
