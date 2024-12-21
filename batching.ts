import { log } from './helper'
import { callPlugins } from './plugin'
import type { CallPluginOptions } from './types'

declare global {
  var stateDisableBatching: boolean
}

const batching: { updates: CallPluginOptions[]; scheduler?: number } = {
  updates: [],
  scheduler: undefined,
}

export const scheduleUpdate = (update: CallPluginOptions) => {
  batching.updates.unshift(update) // Most recent update will be processed first, to allow filtering already applied changes.
  if (batching.scheduler === undefined) {
    batching.scheduler = schedule(process)
  }
}

// Process all batched updates.
const noDeadline = {
  didTimeout: false,
  timeRemaining() {
    return 99999
  },
}

export const batch = () => process(noDeadline)

function schedule(callback: IdleRequestCallback) {
  // NOTE if window isn't present and batching isn't explicitly enabled there will be no batching.
  if ((typeof window === 'undefined' && globalThis.stateDisableBatching !== false) || globalThis.stateDisableBatching === true) {
    callback(noDeadline)
    return
  }

  if (window.requestIdleCallback) {
    return window.requestIdleCallback(callback)
  }

  // requestIdleCallback polyfill (not supported in Safari)
  // https://github.com/pladaria/requestidlecallback-polyfill
  // See react scheduler for better implementation.
  window.requestIdleCallback =
    window.requestIdleCallback ||
    function idleCallbackPolyfill(innerCallback: IdleRequestCallback, _options?: IdleRequestOptions) {
      const start = Date.now()
      setTimeout(() => {
        innerCallback({
          didTimeout: false,
          timeRemaining() {
            return Math.max(0, 50 - (Date.now() - start))
          },
        })
      }, 1)
      return 0
    }

  window.cancelIdleCallback =
    window.cancelIdleCallback ||
    function cancelIdleCallbackPolyfill(id) {
      clearTimeout(id)
    }

  return schedule(callback)
}

function process(deadline: IdleDeadline) {
  if (batching.updates.length === 0) {
    log('Trying to batch empty updates')
    return
  }

  let shouldYield = false
  let maxTries = 500
  while (batching.updates.length > 0 && !shouldYield && maxTries > 0) {
    maxTries -= 1
    const update = batching.updates.shift()
    if (update) {
      callPlugins(update)
      // Filter out already applied updates.
      batching.updates = batching.updates.filter(
        (potentialUpdate) => potentialUpdate.property !== update.property || potentialUpdate.parent !== update.parent,
      )
    }
    // Yield current rendering cycle if out of time.
    shouldYield = deadline.timeRemaining() < 1
  }

  if (maxTries === 0) {
    log('Ran out of tries at process.', 'warning')
  }

  // Continuing to process in next iteration.
  if (batching.updates.length > 0) {
    schedule(process)
  }

  batching.scheduler = undefined
}
