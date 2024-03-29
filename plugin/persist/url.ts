import { Plugin } from '../../types'
import { log } from '../../helper'

// Nested object values are not persisted.
const isTopLevelValue = (value: any) =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

function replaceUrl(queryParams: URLSearchParams) {
  const newUrl = `${window.location.origin}${window.location.pathname}?${queryParams.toString()}`
  window.history.replaceState({ page: 2 }, '', newUrl)
  // TODO replaceState will not work in tests, but is assigning href still necessary in browser?
  window.location.href = newUrl
}

function updateUrlParameter(property: string, value: any) {
  const queryParams = new URLSearchParams(window.location.search)
  queryParams.set(property, value)
  replaceUrl(queryParams)
}

function initializeUrl(state: object, properties: string[]) {
  const queryParams = new URLSearchParams(window.location.search)

  // Override state with initial URL parameters.
  Array.from(queryParams.entries()).forEach(([key, value]) => {
    if (
      Object.hasOwn(state, key) &&
      key !== 'plugin' &&
      (properties.length === 0 || properties.includes(key))
    ) {
      state[key] = typeof state[key] === 'number' ? Number(value) : value
    }
  })

  // Override URL parameters with initial state.
  Object.entries(state).forEach(([key, value]) => {
    if (
      Object.hasOwn(state, key) &&
      isTopLevelValue(value) &&
      key !== 'plugin' &&
      (properties.length === 0 || properties.includes(key))
    ) {
      queryParams.set(key, value)
    }
  })

  replaceUrl(queryParams)
}

// Persist state to URL.
export const persistUrl: Plugin<string[]> = (...configuration) => {
  let properties: string[] = []

  const actions = {
    set: (property: string, parent: object, value: any, previousValue: any) => {
      if (value === previousValue || (properties.length !== 0 && !properties.includes(property)))
        return
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
