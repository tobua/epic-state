import { listGetters } from './helper'
import type { Property } from './types'

const cache = new Map<Function, any>()

enum DependenciesState {
  new = 0, // Dependencies have not yet been tracked or need to be updated.
  clean = 1, // No dependencies have been changed, can use cached result.
  dirty = 2, // One or more dependencies have changed, result needs to be recalculated.
}

type Derived = Function & {
  state: DependenciesState
}

// References properties on properties that were accessed during the tracking state
// and therefore need to be updated.
// TODO is there a way to clean these up later when dependencies are no longer tracked?
// parent -> property -> derived[]
const dependencies = new Map<object, Map<Property, Set<Derived>>>()

let tracking: Derived
export const isTracking = () => tracking !== undefined

export const track = <U extends object>(parent: U, property: Property) => {
  if (!isTracking()) return
  if (!dependencies.has(parent)) {
    dependencies.set(parent, new Map())
  }

  const properties = dependencies.get(parent)

  if (properties.has(property)) {
    const derivations = properties.get(property)
    derivations.add(tracking)
  } else {
    properties.set(property, new Set([tracking]))
  }
}

export const isTracked = <U extends object>(parent: U, property: Property) => {
  if (!dependencies.has(parent)) return
  const properties = dependencies.get(parent)
  if (!properties.has(property)) return
  const derivations = properties.get(property)
  derivations.forEach((derivation) => {
    derivation.state = DependenciesState.dirty
  })
}

export function derive<U extends object>(proxy: U) {
  const getters = listGetters(proxy) as { [K in keyof U]: U[K] }

  if (!Object.keys(getters).length) return proxy

  Object.entries(getters).forEach(([key, getter]: [string, Function]) => {
    function derived() {
      // Result has been cached already and dependencies are clean.
      if (derived.state === DependenciesState.clean && cache.has(derived)) {
        return cache.get(derived)
      }
      // Call getter for result while tracking dependencies accessed.
      tracking = derived
      const result = getter()
      tracking = undefined
      derived.state = DependenciesState.clean
      cache.set(derived, result)
      return result
    }

    derived.state = DependenciesState.new

    // Replace getter with wrapper method intercepting access.
    Object.defineProperty(proxy, key, {
      get: derived,
      enumerable: true,
      configurable: true,
    })
  })

  return proxy
}
