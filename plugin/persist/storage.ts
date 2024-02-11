import { Plugin } from '../../types'
import { log } from '../../helper'

type Identifier = string | number

const identifiers = new Set<Identifier>()

function initializeStorage(state: object, properties: string[], identifier: string) {
  const defaultState = {}

  properties.forEach((property) => {
    defaultState[property] = state[property]
  })

  const existingStore = window.localStorage.getItem(identifier)
  const data = {}

  // Add existing state properties to the store.
  properties.forEach((property) => {
    data[property] = state[property]
  })

  if (existingStore) {
    // Read existing store and add to state.
    const existingData = JSON.parse(existingStore)
    Object.keys(existingData).forEach((key) => {
      if (properties.includes(key)) {
        state[key] = existingData[key]
      }
    })
    // Loaded data has precedence over defaults.
    Object.assign(data, existingData)
  }

  window.localStorage.setItem(identifier, JSON.stringify(data))
}

// Persist state to localStorage or sessionStorage.
export const persistStorage: Plugin<[{ id: Identifier; prefix?: string; properties: string[] }]> = (
  ...configuration
) => {
  const { id, prefix = 'epic-state-', properties = [] } = configuration[0]
  if (typeof id !== 'string' && typeof id !== 'number') {
    log('persistStorage: Missing identifier.', 'error')
  }

  const identifier = `${prefix}${id}`

  if (identifiers.has(identifier)) {
    log(
      `persistStorage: Persistence identifier "${identifier}" has already been used. Plugin will not work as expected!`,
      'warning',
    )
  }

  identifiers.add(identifier)

  const actions = {
    set: (property: string, value: any, previousValue: any) => {
      if (value === previousValue || (properties.length !== 0 && !properties.includes(property)))
        return
      const currentValues = JSON.parse(window.localStorage.getItem(identifier))
      currentValues[property] = value
      window.localStorage.setItem(identifier, JSON.stringify(currentValues))
    },
  }

  return (...innerConfiguration: any) => {
    if (innerConfiguration[0] !== 'initialize') {
      log('persistStorage: Plugin has already been configured', 'warning')
    }

    initializeStorage(innerConfiguration[1] as any, properties, identifier)
    return actions
  }
}
