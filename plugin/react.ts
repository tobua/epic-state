import {
  // @ts-ignore-next-line
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as internals,
} from 'react'
import { Plugin } from '../types'
import { log } from '../helper'

// ReactCurrentOwner is the current component being rendered.
let currentOwner: Function
Object.defineProperty(internals.ReactCurrentOwner, 'current', {
  get() {
    return currentOwner
  },
  set(component) {
    // component is the FiberNode of the current component and null after the component has finished rendering.
    currentOwner = component
  },
})

// ReactCurrentDispatcher provides the hook api to access during the current render.
let currentDispatcher: { useReducer: (update: Function, initial: any) => [null, Function] }
Object.defineProperty(internals.ReactCurrentDispatcher, 'current', {
  get() {
    return currentDispatcher
  },
  set(nextDispatcher) {
    currentDispatcher = nextDispatcher
  },
})

export const connect: Plugin<string[]> = (initialize) => {
  if (initialize !== 'initialize') {
    log('connect plugin cannot be configured', 'warning')
  }

  const observedProperties = new Map<string, Function[]>()

  return {
    set: (property: string, value: any, previousValue: any) => {
      if (value === previousValue) return

      const components = observedProperties.get(property)
      components?.forEach((component) => {
        component()
      })

      if (observedProperties.has(property)) {
        observedProperties.delete(property)
      }
    },
    get: (property: string) => {
      if (!currentOwner) return // Accessed outside a React component.

      // Register rerender on current component.
      const [, forceUpdate] = currentDispatcher.useReducer((x: number) => x + 1, 0)

      if (!observedProperties.has(property)) {
        observedProperties.set(property, [forceUpdate])
      } else {
        const components = observedProperties.get(property)
        components?.push(forceUpdate)
      }
    },
  }
}
