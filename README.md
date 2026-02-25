# Workflow Auto Runner

A configurable userscript that executes your own action list on the target page.

> The script no longer ships with a demo workflow. You should paste your real steps into `WORKFLOW` in `tapper.js`.

## What changed

- Removed the hardcoded demo behavior.
- Disabled debug logs by default (`debug: false`).
- Added per-step content wait hooks so steps can wait for newly loaded page content.

## Quick setup

1. Install a userscript extension (Tampermonkey / Violentmonkey / Greasemonkey).
2. Create a new userscript and paste `tapper.js`.
3. Open `WORKFLOW` in `tapper.js` and add your action list.
4. Save and visit the page matched by `@match`.

## Core config

```js
const CONFIG = {
  debug: false,
  defaultTimeoutMs: 15000,
  pollEveryMs: 200,
}
```

- `debug`: set to `true` to print logs.
- `defaultTimeoutMs`: default wait timeout.
- `pollEveryMs`: polling interval for selector checks.

## Workflow format

```js
const WORKFLOW = [
  { type: "fill", selector: "input[name='Email']", value: "me@example.com" },
  { type: "click", selector: "button[data-next]" },
  {
    type: "clickText",
    selector: "button",
    text: "Submit",
    waitForSelectorAfter: ".submission-success",
  },
]
```

## Supported step types

- `wait`: `{ type: "wait", ms: 2000 }`
- `click`: `{ type: "click", selector: "button.save" }`
- `clickText`: `{ type: "clickText", selector: "button", text: "Continue" }`
- `fill`: `{ type: "fill", selector: "input[name='Name']", value: "Alex" }`
- `reload`: `{ type: "reload", delayMs: 1000 }`
- `run`: `{ type: "run", fn: async () => { /* custom logic */ } }`

## Waiting for page content in the last 2 steps

For steps that should execute only after new content has loaded, use:

- `waitForSelectorBefore`: waits **before** running that step.
- `waitForSelectorAfter`: waits **after** the step completes.
- `waitTimeoutMs`: optional timeout override for these waits.

Example where the last two steps wait for content:

```js
const WORKFLOW = [
  { type: "click", selector: "button[data-next]" },
  {
    type: "clickText",
    selector: "button",
    text: "Review",
    waitForSelectorBefore: ".review-panel-loaded",
  },
  {
    type: "clickText",
    selector: "button",
    text: "Submit",
    waitForSelectorBefore: ".submit-ready",
    waitForSelectorAfter: ".submission-success",
    waitTimeoutMs: 30000,
  },
]
```

## Notes

- If the workflow reloads the page, script execution will restart on the next load (single-run guard per page lifecycle still applies).
- Prefer stable selectors (`id`, `name`, `data-*`) for reliability.

## License

See `LICENSE`.
