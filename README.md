# Workflow Auto Runner

This userscript now runs your requested actions in a fixed order:

1. `document.querySelector("#submitButton button").click()`
2. `document.getElementsByClassName("view-thumb")[0].click()`
3. `document.getElementById("show-heat-map").click()`
4. Reveal tabs `#ui-id-2` and `#ui-id-3` by setting `style.display = "block"`

The full workflow waits 10 seconds after completion, then refreshes the page to start again.

## Tab visibility behavior

After the heat map button is clicked, the script reveals tabs `#ui-id-2` and `#ui-id-3` by setting:

- `document.getElementById("ui-id-2").style.display = "block"`
- `document.getElementById("ui-id-3").style.display = "block"`

This removes the need for session storage tab values and tab-selection prompts.

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

- `debug`: enable logs.
- `defaultTimeoutMs`: selector wait timeout.
- `pollEveryMs`: selector polling interval.
- `stepDelayMs`: delay between workflow steps.
- `loopEveryMs`: delay before the page refreshes to start the workflow again.

## Notes

- The script waits for each selector before clicking.
- It supports both `id="show-heat-map"` and `id=" show-heat-map"` to match your previous selector variation.

## License

See `LICENSE`.
