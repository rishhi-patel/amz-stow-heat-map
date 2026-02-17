// ==UserScript==
// @name         Workflow Auto Runner (Next + Refresh)
// @namespace    local-automation
// @version      1.0.0
// @match        https://www.cognitoforms.com/HATCHBlue1/BlueCatalystApplications2026
// @grant        none
// ==/UserScript==

;(() => {
  "use strict"

  const CONFIG = {
    debug: true,
    defaultTimeoutMs: 15000,
  }

  // Edit this list to add/remove actions
  const WORKFLOW = [
    { type: "click", selector: "button[data-next], button.cog-button--next" },
    { type: "wait", ms: 5000 },
    { type: "reload" },
  ]

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const log = (...args) => {
    if (CONFIG.debug) console.log("[auto-workflow]", ...args)
  }

  const isVisible = (el) => {
    if (!el) return false
    const s = window.getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return (
      s.display !== "none" &&
      s.visibility !== "hidden" &&
      +s.opacity > 0 &&
      r.width > 0 &&
      r.height > 0
    )
  }

  async function waitForSelector(
    selector,
    timeoutMs = CONFIG.defaultTimeoutMs,
  ) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const nodes = [...document.querySelectorAll(selector)]
      const el = nodes.find((n) => isVisible(n) && !n.disabled)
      if (el) return el
      await sleep(200)
    }
    throw new Error(`Timeout waiting for selector: ${selector}`)
  }

  async function clickSelector(selector, timeoutMs) {
    const el = await waitForSelector(selector, timeoutMs)
    el.scrollIntoView({ block: "center", inline: "center" })
    el.click()
    log("clicked", selector)
  }

  async function clickText(
    selector,
    text,
    timeoutMs = CONFIG.defaultTimeoutMs,
  ) {
    const start = Date.now()
    const wanted = text.trim().toLowerCase()

    while (Date.now() - start < timeoutMs) {
      const nodes = [...document.querySelectorAll(selector)]
      const el = nodes.find((n) => {
        if (!isVisible(n) || n.disabled) return false
        const t = (n.textContent || n.innerText || "").trim().toLowerCase()
        return t === wanted || t.includes(wanted)
      })

      if (el) {
        el.scrollIntoView({ block: "center", inline: "center" })
        el.click()
        log("clicked by text", selector, text)
        return
      }

      await sleep(200)
    }

    throw new Error(`Timeout waiting text "${text}" in selector: ${selector}`)
  }

  async function fillInput(selector, value, timeoutMs) {
    const el = await waitForSelector(selector, timeoutMs)
    el.focus()
    el.value = value
    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.dispatchEvent(new Event("change", { bubbles: true }))
    log("filled", selector, value)
  }

  async function runStep(step) {
    switch (step.type) {
      case "wait":
        await sleep(step.ms || 0)
        return

      case "click":
        await clickSelector(step.selector, step.timeoutMs)
        return

      case "clickText":
        await clickText(step.selector, step.text, step.timeoutMs)
        return

      case "fill":
        await fillInput(step.selector, step.value ?? "", step.timeoutMs)
        return

      case "reload":
        if (step.delayMs) await sleep(step.delayMs)
        log("reloading page")
        location.reload()
        return

      case "run":
        if (typeof step.fn === "function") await step.fn()
        return

      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  async function runWorkflow() {
    try {
      for (const step of WORKFLOW) {
        await runStep(step)
      }
    } catch (err) {
      console.error("[auto-workflow] failed:", err)
    }
  }

  // avoid duplicate run in same page lifecycle
  if (window.__AUTO_WORKFLOW_RUNNING__) return
  window.__AUTO_WORKFLOW_RUNNING__ = true

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    void runWorkflow()
  } else {
    window.addEventListener("DOMContentLoaded", () => void runWorkflow(), {
      once: true,
    })
  }
})()
