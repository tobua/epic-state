import { plugin } from './plugin'
import { type ObservedProperties, type PluginActions, type Property, type ProxyObject, type RerenderMethod, TupleArrayMap } from './types'

const runners: { observedProperties: ObservedProperties; handler: RerenderMethod }[] = []
let pluginRegistered: (() => void) | undefined
let runningHandler: { observedProperties: ObservedProperties; handler: RerenderMethod } | undefined

function runHandler(handler: RerenderMethod, observedProperties: ObservedProperties) {
  observedProperties.clear() // Reset before run to only track currently accessed properties.
  runningHandler = { observedProperties, handler }
  handler()
  runningHandler = undefined
}

function runHandlersObservingProperty(property: Property, parent: ProxyObject) {
  for (const runner of runners) {
    const { observedProperties } = runner
    if (!observedProperties.has(parent, property)) {
      continue
    }
    const handlers = observedProperties.get(parent, property)
    if (handlers) {
      for (const currentHandler of handlers) {
        runHandler(currentHandler, observedProperties)
      }
    }
  }
}

function observeProperty(property: Property, parent: ProxyObject) {
  if (!runningHandler) {
    return // Not currently tracking.
  }
  const { observedProperties, handler } = runningHandler
  observedProperties.add(parent, property, handler)
}

export function run(handler: RerenderMethod) {
  if (!pluginRegistered) {
    pluginRegistered = plugin({
      set: ({ property, parent, value, previousValue }) => {
        if (value === previousValue) {
          return
        }
        runHandlersObservingProperty(property, parent)
        // TODO necessary to observe set actions in run()?
      },
      get: ({ property, parent }) => {
        observeProperty(property, parent)
      },
      delete: ({ property, parent }) => {
        runHandlersObservingProperty(property, parent)
      },
    } as PluginActions)
  }

  const observedProperties = new TupleArrayMap<ProxyObject, Property, RerenderMethod>()
  runHandler(handler, observedProperties)
  runners.push({ observedProperties, handler })

  return function unregister() {
    const remainingRunners = runners.filter((runner) => runner.handler !== handler)
    runners.splice(0, runners.length, ...remainingRunners)
    if (remainingRunners.length === 0 && pluginRegistered) {
      pluginRegistered() // Unregister plugin.
      pluginRegistered = undefined
    }
  }
}
