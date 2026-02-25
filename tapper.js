// ==UserScript==
// @name         Workflow Auto Runner
// @namespace    local-automation
// @version      1.1.0
// @match        https://www.cognitoforms.com/HATCHBlue1/BlueCatalystApplications2026
// @grant        none
// ==/UserScript==

;(() => {
  "use strict"

  const CONFIG = {
    debug: false,
    defaultTimeoutMs: 15000,
    pollEveryMs: 200,
  }

  const WORKFLOW = [
    { type: "click", selector: "#submitButton button" },
    { type: "wait", ms: 1000 },
    {
      type: "run",
      fn: async () => {
        const element = document.getElementsByClassName("view-thumb")[0]
        if (!element) throw new Error("Missing element: .view-thumb[0]")
        element.click()
      },
    },
    { type: "wait", ms: 1000 },
    { type: "click", selector: "#show-heat-map" },
    { type: "wait", ms: 1000 },
  ]

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const log = (...args) => {
    if (CONFIG.debug) console.log("[auto-workflow]", ...args)
  }

  const isVisible = (el) => {
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

  async function waitForStepContent(step, timing) {
    const key = timing === "before" ? "waitForSelectorBefore" : "waitForSelectorAfter"
    if (!step[key]) return

    const timeoutMs = step.waitTimeoutMs ?? step.timeoutMs ?? CONFIG.defaultTimeoutMs
    await waitForSelector(step[key], timeoutMs)
    log(`content ready (${timing})`, step[key])
  }

  async function clickSelector(selector, timeoutMs) {
    const element = await waitForSelector(selector, timeoutMs)
    element.scrollIntoView({ block: "center", inline: "center" })
    element.click()
    log("clicked", selector)
  }

  async function clickText(selector, text, timeoutMs = CONFIG.defaultTimeoutMs) {
    const start = Date.now()
    const wantedText = text.trim().toLowerCase()

    while (Date.now() - start < timeoutMs) {
      const elements = [...document.querySelectorAll(selector)]
      const found = elements.find((el) => {
        if (!isVisible(el) || el.disabled) return false
        const current = (el.textContent || el.innerText || "").trim().toLowerCase()
        return current === wantedText || current.includes(wantedText)
      })

      if (found) {
        found.scrollIntoView({ block: "center", inline: "center" })
        found.click()
        log("clicked by text", selector, text)
        return
      }

      await sleep(CONFIG.pollEveryMs)
    }

    throw new Error(`Timeout waiting text "${text}" in selector: ${selector}`)
  }

  async function fillInput(selector, value, timeoutMs) {
    const element = await waitForSelector(selector, timeoutMs)
    element.focus()
    element.value = value
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))
    log("filled", selector)
  }

  async function runStep(step) {
    await waitForStepContent(step, "before")

    switch (step.type) {
      case "wait":
        await sleep(step.ms || 0)
        break

      case "click":
        await clickSelector(step.selector, step.timeoutMs)
        break

      case "clickText":
        await clickText(step.selector, step.text, step.timeoutMs)
        break

      case "fill":
        await fillInput(step.selector, step.value ?? "", step.timeoutMs)
        break

      case "reload":
        if (step.delayMs) await sleep(step.delayMs)
        log("reloading page")
        location.reload()
        return

      case "run":
        if (typeof step.fn === "function") await step.fn()
        break

      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }

    await waitForStepContent(step, "after")
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
