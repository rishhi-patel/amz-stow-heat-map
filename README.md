# Workflow Auto Runner

This userscript automates a fixed action sequence on the target Cognito page and repeats the full sequence every 10 seconds.

## Current action flow

The script runs these actions in order, with a **1 second wait after each action**:

1. Click `#submitButton button`
2. Click first `.view-thumb`
3. Click `#show-heat-map`
4. Click element id from `localStorage['ui-id-1']`
5. Click element id from `localStorage['ui-id-2']`
6. Click element id from `localStorage['ui-id-3']`

After step 6, the script waits 10 seconds and repeats from step 1.

## LocalStorage setup (required)

Before running, store the UI target ids in browser localStorage:

```js
localStorage.setItem("ui-id-1", "ui-id-1")
localStorage.setItem("ui-id-2", "ui-id-2")
localStorage.setItem("ui-id-3", "ui-id-3")
```

You can change the values to any valid element ids on the page.

## Config

```js
const CONFIG = {
  debug: false,
  defaultTimeoutMs: 15000,
  pollEveryMs: 200,
  repeatEveryMs: 10000,
}
```

- `repeatEveryMs` controls the interval between full workflow cycles.

## Step types supported by engine

- `wait`
- `click`
- `clickStoredId`
- `clickText`
- `fill`
- `reload`
- `run`

## License

See `LICENSE`.
