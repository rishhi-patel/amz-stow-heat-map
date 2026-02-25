// ==UserScript==
// @name         Amz Stow HeatMap
// @namespace    local-automation
// @version      1.2.0
// @match        https://stowmap-na.amazon.com/stowmap/loadFCAreaMap.htm?warehouseId=YYZ9
// @grant        none
// ==/UserScript==

;(function () {
  "use strict"

  const CONFIG = {
    debug: false,
    defaultTimeoutMs: 15000,
    pollEveryMs: 200,
    stepDelayMs: 1000,
    loopEveryMs: 10000,
  }

  const SHOW_HEAT_MAP_SELECTOR = "#show-heat-map, [id=' show-heat-map']"

  const WORKFLOW = [
    { type: "run", fn: () => configureFirstStepOptions() },
    { type: "click", selector: "#submitButton button" },
    { type: "click", selector: ".view-thumb" },
    { type: "click", selector: SHOW_HEAT_MAP_SELECTOR },
    { type: "run", fn: () => showOtherTabs() },
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

  function showOtherTabs() {
    const tab2 = document.getElementById("tab_2")
    const tab3 = document.getElementById("tab_3")

    if (tab2) tab2.style.display = "block"
    if (tab3) tab3.style.display = "block"

    log("made tabs visible", { tab2: !!tab2, tab3: !!tab3 })
  }

  function configureFirstStepOptions() {
    const floorOne = document.querySelector('input[name="floor"][value="1"]')
    if (floorOne && !floorOne.checked) {
      floorOne.click()
      log("clicked floor 1")
    }

    const groupBinsSelect = document.getElementById("group-bins")
    const aisleOption = groupBinsSelect?.querySelector('option[value="Aisle"]')
    if (groupBinsSelect && aisleOption) {
      aisleOption.selected = true
      const changeEvent = new Event("change", { bubbles: true })
      groupBinsSelect.dispatchEvent(changeEvent)
      log("set group-bins to Aisle")
    }

    const lockedNoButton = document.getElementById("lockedNo")
    if (lockedNoButton) {
      lockedNoButton.click()
      log("clicked lockedNo")
    }
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

  let isWorkflowRunning = false

  async function runWorkflowThenRefresh() {
    if (isWorkflowRunning) {
      log("previous run still in progress, skipping this interval")
      return
    }

    isWorkflowRunning = true
    try {
      await runWorkflow()
      log("workflow complete, refreshing page soon")
      await sleep(CONFIG.loopEveryMs)
      window.location.reload()
    } finally {
      isWorkflowRunning = false
    }
  }

  function startWorkflowLoop() {
    void runWorkflowThenRefresh()
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    startWorkflowLoop()
  } else {
    window.addEventListener("DOMContentLoaded", () => startWorkflowLoop(), { once: true })
  }
})()
