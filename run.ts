import { plugin } from './plugin'

const runners: { observedProperties: Map<string, Function[]>; handler: Function }[] = []
const pluginRegistered = false
let runningHandler: { observedProperties: Map<string, Function[]>; handler: Function } | undefined

function runHandler(handler: Function, observedProperties: Map<string, Function[]>) {
  observedProperties.clear() // Reset before run to only track currently accessed properties.
  runningHandler = { observedProperties, handler }
  handler()
  runningHandler = undefined
}

function runHandlersObservingProperty(property: string) {
  runners.forEach((runner) => {
    const { observedProperties } = runner
    if (!observedProperties.has(property)) return
    const handlers = observedProperties.get(property)
    handlers.forEach((currentHandler) => {
      runHandler(currentHandler, observedProperties)
    })
  })
}

function observeProperty(property: string, handler: Function) {
  const { observedProperties } = runningHandler
  if (!observedProperties.has(property)) {
    observedProperties.set(property, [handler])
  } else {
    observedProperties.get(property)?.push(handler)
  }
}

export function run(handler: Function) {
  if (!pluginRegistered) {
    plugin({
      set: (property: string, value: any, previousValue: any) => {
        if (value === previousValue) return
        runHandlersObservingProperty(property)
        // TODO necessary to observe set actions in run()?
      },
      get: (property: string) => {
        if (!runningHandler) return // Not currently tracking.
        observeProperty(property, handler)
      },
      delete: (property: string) => {
        runHandlersObservingProperty(property)
      },
    })
  }

  const observedProperties = new Map<string, Function[]>()
  runHandler(handler, observedProperties)
  runners.push({ observedProperties, handler })
}
