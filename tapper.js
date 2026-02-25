// ==UserScript==
// @name         Workflow Auto Runner
// @namespace    local-automation
// @version      1.2.0
// @match        https://www.cognitoforms.com/HATCHBlue1/BlueCatalystApplications2026
// @grant        none
// ==/UserScript==

;(function () {
  "use strict"

  /***********************
   * CONFIG
   ***********************/
  const CONFIG = {
    debug: false,
    defaultTimeoutMs: 15000,
    pollEveryMs: 200,
    sessionTabKey: "tab",
  }

  const SHOW_HEAT_MAP_SELECTOR = "#show-heat-map, [id=' show-heat-map']"

  const WORKFLOW = [
    { type: "click", selector: "#submitButton button" },
    { type: "click", selector: ".view-thumb" },
    { type: "run", fn: () => clickTabFromSession() },
    { type: "click", selector: SHOW_HEAT_MAP_SELECTOR },
  ]

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  async function waitFor(
    predicateFn,
    timeoutMs = CONFIG.stepTimeoutMs,
    intervalMs = CONFIG.pollIntervalMs,
  ) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const val = predicateFn()
      if (val) return val
      await sleep(intervalMs)
    }
    throw new Error("Timeout waiting for condition.")
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
      return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
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

  async function clickTabFromSession() {
    const rawTab = sessionStorage.getItem(CONFIG.sessionTabKey)
    const tab = String(rawTab || "").trim()

    if (!["1", "2", "3"].includes(tab)) {
      log(`session tab key '${CONFIG.sessionTabKey}' missing/invalid`, rawTab)
      return
    }

    const tabSelector = `#ui-id-${tab}`
    await clickSelector(tabSelector)
  }

  async function runStep(step) {
    switch (step.type) {
      case "wait":
        await sleep(step.ms || 0)
        break

      case "click":
        await clickSelector(step.selector, step.timeoutMs)
        break

      case "run":
        if (typeof step.fn === "function") await step.fn()
        break

      // reload interrupts execution; this line won't execute in practice
      await sleep(1e9)
    }
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
