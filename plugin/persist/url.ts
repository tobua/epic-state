import { log } from '../../helper'
import type { Plugin, Value } from '../../types'

// Nested object values are not persisted.
const isTopLevelValue = (value: Value) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

function replaceUrl(queryParams: URLSearchParams) {
  const newUrl = `${window.location.origin}${window.location.pathname}?${queryParams.toString()}`
  window.history.replaceState({ page: 2 }, '', newUrl)
  // TODO replaceState will not work in tests, but is assigning href still necessary in browser?
  window.location.href = newUrl
}

function updateUrlParameter(property: string, value: Value) {
  const queryParams = new URLSearchParams(window.location.search)
  queryParams.set(property, value)
  replaceUrl(queryParams)
}

function initializeUrl(state: { [key: string]: Value }, properties: string[]) {
  const queryParams = new URLSearchParams(window.location.search)

  // Override state with initial URL parameters.
  for (const [key, value] of queryParams.entries()) {
    if (Object.hasOwn(state, key) && key !== 'plugin' && (properties.length === 0 || properties.includes(key))) {
      state[key] = typeof state[key] === 'number' ? Number(value) : value
    }
  }

  // Override URL parameters with initial state.
  for (const [key, value] of Object.entries(state)) {
    if (Object.hasOwn(state, key) && isTopLevelValue(value) && key !== 'plugin' && (properties.length === 0 || properties.includes(key))) {
      queryParams.set(key, value as string)
    }
  }

  replaceUrl(queryParams)
}

// Persist state to URL.
export const persistUrl: Plugin<string[]> = (...configuration) => {
  let properties: string[] = []

  const actions = {
    set: (property: string, _parent: object, value: Value, previousValue: Value) => {
      if (value === previousValue || (properties.length !== 0 && !properties.includes(property))) {
        return
      }
      updateUrlParameter(property, value)
    },
  }

  if (configuration[0] === 'initialize') {
    initializeUrl(configuration[1] as any, properties)
    return actions
  }

  properties = properties.concat(configuration ?? [])

  return (...innerConfiguration: any) => {
    if (innerConfiguration[0] !== 'initialize') {
      log('persistUrl: Plugin has already been configured', 'warning')
    }

    initializeUrl(innerConfiguration[1] as any, properties)
    return actions
  }
}
