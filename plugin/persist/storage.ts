import { log } from '../../helper'
import type { Plugin, Value } from '../../types'

type Identifier = string | number

const identifiers = new Set<Identifier>()

function initializeStorage(state: { [key: string]: Value }, properties: string[], identifier: string) {
  const defaultState: { [key: string]: Value } = {}

  for (const property of properties) {
    defaultState[property] = state[property]
  }

  const existingStore = window.localStorage.getItem(identifier)
  const data: { [key: string]: Value } = {}

  // Add existing state properties to the store.
  for (const property of properties) {
    data[property] = state[property]
  }

  if (existingStore) {
    // Read existing store and add to state.
    const existingData = JSON.parse(existingStore)
    for (const key of Object.keys(existingData)) {
      if (properties.includes(key)) {
        state[key] = existingData[key]
      }
    }
    // Loaded data has precedence over defaults.
    Object.assign(data, existingData)
  }

  window.localStorage.setItem(identifier, JSON.stringify(data))
}

// Persist state to localStorage or sessionStorage.
export const persistStorage: Plugin<[{ id: Identifier; prefix?: string; properties: string[] }]> = (...configuration) => {
  const { id, prefix = 'epic-state-', properties = [] } = configuration[0]
  if (typeof id !== 'string' && typeof id !== 'number') {
    log('persistStorage: Missing identifier.', 'error')
  }

  const identifier = `${prefix}${id}`

  if (identifiers.has(identifier)) {
    log(`persistStorage: Persistence identifier "${identifier}" has already been used. Plugin will not work as expected!`, 'warning')
  }

  identifiers.add(identifier)

  const actions = {
    set: (property: string, _parent: object, value: Value, previousValue: Value) => {
      if (value === previousValue || (properties.length !== 0 && !properties.includes(property))) {
        return
      }
      const currentValues = JSON.parse(window.localStorage.getItem(identifier) ?? '{}')
      currentValues[property] = value
      window.localStorage.setItem(identifier, JSON.stringify(currentValues))
    },
  }

  return (...innerConfiguration: any) => {
    if (innerConfiguration[0] !== 'initialize') {
      log('persistStorage: Plugin has already been configured', 'warning')
    }

    initializeStorage(innerConfiguration[1] as object, properties, identifier)
    return actions
  }
}
