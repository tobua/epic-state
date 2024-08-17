import { log } from '../helper'
import { plugin } from '../plugin'
import { type Observation, type ObservationCallback, PluginAction, type PluginActions, type ProxyObject } from '../types'

export const observe = (callback?: ObservationCallback, state?: ProxyObject) => {
  const observations: Observation[] = []

  function instance(initialize: string): PluginActions {
    if (initialize !== 'initialize') {
      log('observe plugin cannot be configured', 'warning')
    }

    return {
      get: ({ property, parent, value }) => {
        const observation: Observation = [PluginAction.Get, parent, property, value]
        observations.push(observation)
        if (callback) {
          callback(observation)
        }
      },
      set: ({ property, parent, value, previousValue }) => {
        if (value === previousValue) {
          return
        }
        const observation: Observation = [PluginAction.Set, parent, property, value, previousValue]
        observations.push(observation)
        if (callback) {
          callback(observation)
        }
      },
      delete: ({ property, parent, previousValue }) => {
        const observation: Observation = [PluginAction.Delete, parent, property, previousValue]
        observations.push(observation)
        if (callback) {
          callback(observation)
        }
      },
    } as PluginActions
  }

  // Register local or global plugin.
  if (state) {
    state.addPlugin(instance)
  } else {
    plugin(instance)
  }

  return observations
}
