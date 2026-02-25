# Workflow Auto Runner

A configurable userscript that executes your own action list on the target page.

> The script no longer ships with a demo workflow. You should paste your real steps into `WORKFLOW` in `tapper.js`.

## What changed

- Workflow now asks for a tab ID once per page load/session and uses that ID for the tab click action.
- Selected tab ID is stored in `sessionStorage` (not local storage) via `autoWorkflowSelectedTabId`.
- Keeps 1-second gaps after each action and supports per-step content wait hooks.

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
  sessionTabIdKey: "autoWorkflowSelectedTabId",
}
```

- `debug`: set to `true` to print logs.
- `defaultTimeoutMs`: default wait timeout.
- `pollEveryMs`: polling interval for selector checks.
- `sessionTabIdKey`: session storage key used for selected tab ID.

## Workflow format

```js
const WORKFLOW = [
  { type: "click", selector: "#submitButton button" },
  { type: "wait", ms: 1000 },
  {
    type: "run",
    fn: async () => {
      const selector = `#${CSS.escape(selectedTabId)}`
      const element = document.querySelector(selector)
      if (!element) throw new Error(`Missing tab element: ${selector}`)
      element.click()
    },
  },
  { type: "wait", ms: 1000 },
  { type: "click", selector: "#show-heat-map" },
  { type: "wait", ms: 1000 },
]
```

## Tab ID prompt + session behavior

- On run, the script checks `sessionStorage` for `autoWorkflowSelectedTabId`.
- If missing, it prompts: **"Enter tab ID to select for this session:"**.
- The entered value is used in the tab-click step (`#<tabId>`) and saved only for the current browser tab session.
- To force re-prompt, clear session storage for this site or remove `autoWorkflowSelectedTabId` in DevTools.

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
