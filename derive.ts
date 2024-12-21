import { listGetters } from './helper'
import type { Getter, Property, Value } from './types'

const cache = new Map<Getter, Value>()

enum DependenciesState {
  New = 0, // Dependencies have not yet been tracked or need to be updated.
  Clean = 1, // No dependencies have been changed, can use cached result.
  Dirty = 2, // One or more dependencies have changed, result needs to be recalculated.
}

type DerivedFunction = () => Value

type Derived = DerivedFunction & {
  state: DependenciesState
}

// TODO use tuple map from plugins.
// References properties on properties that were accessed during the tracking state
// and therefore need to be updated.
// TODO is there a way to clean these up later when dependencies are no longer tracked?
// parent -> property -> derived[]
const dependencies = new Map<object, Map<Property, Set<Derived>>>()

let tracking: Derived | undefined
export const isTracking = () => tracking !== undefined

export const track = <U extends object>(parent: U, property: Property) => {
  if (!isTracking()) {
    return
  }
  if (!dependencies.has(parent)) {
    dependencies.set(parent, new Map())
  }

  const properties = dependencies.get(parent) as Map<Property, Set<Derived>>

  if (properties.has(property)) {
    const derivations = properties.get(property) as Set<Derived>
    derivations.add(tracking as Derived)
  } else {
    properties.set(property, new Set([tracking as Derived]))
  }
}

// TODO weird naming, used to set the state to dirty.
export const isTracked = <U extends object>(parent: U, property: Property) => {
  if (!dependencies.has(parent)) {
    return
  }
  const properties = dependencies.get(parent)
  if (!properties?.has(property)) {
    return
  }
  const derivations = properties.get(property) as Set<Derived>
  for (const derivation of derivations) {
    derivation.state = DependenciesState.Dirty
  }
}

export function derive<U extends object>(proxy: U) {
  const getters = listGetters(proxy) as { [K in keyof U]: U[K] }

  if (Object.keys(getters).length === 0) {
    return proxy
  }

  for (const [key, getter] of Object.entries(getters) as [string, Getter][]) {
    function derived() {
      // Result has been cached already and dependencies are clean.
      if (derived.state === DependenciesState.Clean && cache.has(derived)) {
        return cache.get(derived)
      }
      // Call getter for result while tracking dependencies accessed.
      tracking = derived
      const result = getter()
      tracking = undefined
      derived.state = DependenciesState.Clean
      cache.set(derived, result)
      return result
    }

    derived.state = DependenciesState.New

    // Replace getter with wrapper method intercepting access.
    Object.defineProperty(proxy, key, {
      get: derived,
      enumerable: true,
      configurable: true,
    })
  }

  return proxy
}
