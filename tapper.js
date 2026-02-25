// ==UserScript==
// @name         Workflow Auto Runner
// @namespace    local-automation
// @version      1.3.0
// @match        https://www.cognitoforms.com/HATCHBlue1/BlueCatalystApplications2026
// @grant        none
// ==/UserScript==

;(function () {
  "use strict"

  const CONFIG = {
    debug: false,
    defaultTimeoutMs: 15000,
    pollEveryMs: 200,
    stepDelayMs: 1000,
    sessionTabKey: "tab",
  }

  const SHOW_HEAT_MAP_SELECTOR = "#show-heat-map, [id=' show-heat-map']"

  const WORKFLOW = [
    { type: "click", selector: "#submitButton button" },
    { type: "click", selector: ".view-thumb" },
    { type: "click", selector: SHOW_HEAT_MAP_SELECTOR },
    { type: "run", fn: () => clickTabFromSessionOrPrompt() },
  ]

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  function log(...args) {
    if (CONFIG.debug) console.log("[auto-workflow]", ...args)
  }

  function isVisible(el) {
    if (!el) return false
    const style = window.getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      +style.opacity > 0 &&
      rect.width > 0 &&
      rect.height > 0
    )
  }

  async function waitForSelector(selector, timeoutMs = CONFIG.defaultTimeoutMs) {
    const start = Date.now()

    while (Date.now() - start < timeoutMs) {
      const elements = [...document.querySelectorAll(selector)]
      const found = elements.find((el) => isVisible(el) && !el.disabled)
      if (found) return found
      await sleep(CONFIG.pollEveryMs)
    }

    throw new Error(`Timeout waiting for selector: ${selector}`)
  }

  async function clickSelector(selector, timeoutMs) {
    const element = await waitForSelector(selector, timeoutMs)
    element.scrollIntoView({ block: "center", inline: "center" })
    element.click()
    log("clicked", selector)
  }

  function resolveTabValue() {
    const rawTab = sessionStorage.getItem(CONFIG.sessionTabKey)
    const tab = String(rawTab || "").trim()

    if (["1", "2", "3"].includes(tab)) {
      return tab
    }

    const promptValue = window.prompt("Enter tab value (1, 2, or 3):", "1")
    const normalized = String(promptValue || "").trim()

    if (!["1", "2", "3"].includes(normalized)) {
      throw new Error(`Invalid tab value: '${normalized || "(empty)"}'`)
    }

    sessionStorage.setItem(CONFIG.sessionTabKey, normalized)
    return normalized
  }

  async function clickTabFromSessionOrPrompt() {
    const tab = resolveTabValue()
    const tabSelector = `#ui-id-${tab}`
    await clickSelector(tabSelector)
  }

  async function runStep(step) {
    switch (step.type) {
      case "click":
        await clickSelector(step.selector, step.timeoutMs)
        break
      case "run":
        if (typeof step.fn === "function") await step.fn()
        break
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }

    await sleep(CONFIG.stepDelayMs)
  }

  async function runWorkflow() {
    try {
      for (const step of WORKFLOW) {
        await runStep(step)
      }
    } catch (error) {
      console.error("[auto-workflow] failed:", error)
    }
  }

  if (window.__AUTO_WORKFLOW_RUNNING__) return
  window.__AUTO_WORKFLOW_RUNNING__ = true

  if (document.readyState === "complete" || document.readyState === "interactive") {
    void runWorkflow()
  } else {
    window.addEventListener("DOMContentLoaded", () => void runWorkflow(), { once: true })
  }
})()
