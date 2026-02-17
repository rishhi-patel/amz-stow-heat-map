// ==UserScript==
// @name         Cognito Form Bot (Role per Tab via sessionStorage)
// @namespace    https://exocodelabs.tech/
// @version      1.0
// @description  Same script in multiple tabs; each tab chooses its own role using sessionStorage.
// @match        https://YOUR-DOMAIN-HERE/*
// @grant        none
// ==/UserScript==

;(function () {
  "use strict"

  /***********************
   * CONFIG
   ***********************/
  const CONFIG = {
    ROLE_KEY: "tm_role", // per-tab role
    nextButtonSelector: "button[data-next].cog-button--next",
    refreshDelayMs: 5000,
    pollIntervalMs: 200,
    stepTimeoutMs: 30000,
  }

  /***********************
   * UTILS
   ***********************/
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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
    const style = getComputedStyle(el)
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    )
      return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }

  function isClickable(el) {
    if (!el) return false
    if (el.disabled) return false
    if (el.getAttribute("aria-disabled") === "true") return false
    if (el.classList.contains("is-disabled")) return false
    return isVisible(el)
  }

  function humanClick(el) {
    const rect = el.getBoundingClientRect()
    const clientX = rect.left + rect.width / 2
    const clientY = rect.top + rect.height / 2

    ;["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(
      (type) => {
        el.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX,
            clientY,
          }),
        )
      },
    )
  }

  /***********************
   * ROLE HANDLING (PER TAB)
   ***********************/
  function normalizeRole(raw) {
    const r = (raw || "").trim().toLowerCase()
    if (["h", "heat", "heatmap"].includes(r)) return "heatmap"
    if (["a", "avail", "available"].includes(r)) return "available"
    return ""
  }

  function getRole() {
    return sessionStorage.getItem(CONFIG.ROLE_KEY) || ""
  }

  function setRole(role) {
    sessionStorage.setItem(CONFIG.ROLE_KEY, role)
    updateBadge(role)
    console.log("[TM] Role set to:", role)
  }

  function ensureRole() {
    let role = normalizeRole(getRole())
    if (!role) {
      role = normalizeRole(
        prompt("Set role for THIS TAB: heatmap / available", "heatmap"),
      )
      if (!role) throw new Error("No valid role set; stopping.")
      setRole(role)
    }
    return role
  }

  function installRoleHotkeys() {
    window.addEventListener("keydown", (e) => {
      if (!e.altKey) return
      if (e.key.toLowerCase() === "h") setRole("heatmap")
      if (e.key.toLowerCase() === "a") setRole("available")
    })
  }

  function updateBadge(role) {
    const id = "tm-role-badge"
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement("div")
      el.id = id
      el.style.cssText = `
        position: fixed; z-index: 999999;
        top: 10px; right: 10px;
        padding: 6px 10px;
        font: 12px/1.2 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial;
        border-radius: 8px;
        background: rgba(0,0,0,0.75);
        color: #fff;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      `
      document.documentElement.appendChild(el)
    }
    el.textContent = `TM Role: ${role || "unset"}  (Alt+H / Alt+A)`
  }

  /***********************
   * ROLE-SPECIFIC LOGIC
   ***********************/
  async function runHeatmap() {
    // Example placeholder:
    // If heatmap tab should NOT click/refresh, keep it passive.
    console.log("[TM] Heatmap role running (passive by default).")

    // Put your heatmap-only steps here (e.g., scrape DOM, log values, etc.)
  }

  async function runAvailable() {
    console.log("[TM] Available role running (active click+refresh loop).")

    while (true) {
      const btn = await waitFor(() => {
        const el = document.querySelector(CONFIG.nextButtonSelector)
        return isClickable(el) ? el : null
      })

      humanClick(btn)
      await sleep(CONFIG.refreshDelayMs)
      location.reload()

      // reload interrupts execution; this line won't execute in practice
      await sleep(1e9)
    }
  }

  /***********************
   * BOOTSTRAP
   ***********************/
  ;(async function main() {
    installRoleHotkeys()

    const role = ensureRole()
    updateBadge(role)

    if (role === "heatmap") return runHeatmap()
    if (role === "available") return runAvailable()

    throw new Error("Unexpected role: " + role)
  })().catch((e) => console.error("[TM] Error:", e))
})()
