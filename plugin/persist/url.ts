import { log } from '../../helper'
import type { ConfigurablePlugin, Plugin, PluginActions, ProxyObject, Value } from '../../types'

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

function initializeUrl(state: ProxyObject, properties: string[]) {
  const queryParams = new URLSearchParams(window.location.search)

  // Override state with initial URL parameters.
  for (const [key, value] of queryParams.entries()) {
    if (Object.hasOwn(state, key) && key !== 'plugin' && (properties.length === 0 || properties.includes(key))) {
      // @ts-ignore
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

type Configuration = string[]

// Persist state to URL.
export const persistUrl: ConfigurablePlugin<Configuration> = (...configuration: Configuration | ['initialize', ProxyObject?]) => {
  let properties: Configuration = []

  const actions = {
    set: ({ property, value, previousValue }) => {
      if (typeof property === 'symbol') {
        log('Symbol properties ${property} cannot be added to the URL in persistUrl plugin', 'warning')
        return
      }
      if (value === previousValue || (properties.length !== 0 && !properties.includes(property))) {
        return
      }
      updateUrlParameter(property, value)
    },
  } as PluginActions

  if (configuration[0] === 'initialize') {
    if (!configuration[1]) {
      log('persistUrl plugin cannot be registered globally', 'warning')
    }
    initializeUrl(configuration[1] as ProxyObject, properties)
    return actions
  }

  properties = properties.concat((configuration as Configuration) ?? [])

  const configuredPlugin: Plugin = (...innerConfiguration: any) => {
    if (innerConfiguration[0] !== 'initialize') {
      log('persistUrl: Plugin has already been configured', 'warning')
    }

    initializeUrl(innerConfiguration[1] as any, properties)
    return actions
  }

  return configuredPlugin
}
