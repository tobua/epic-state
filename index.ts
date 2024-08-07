import { batch, scheduleUpdate } from './batching'
import { list } from './data/list'
import { objectMap, objectSet } from './data/polyfill'
import { derive, isTracked, track } from './derive'
import { canPolyfill, canProxy, createBaseObject, isObject, log, newProxy } from './helper'
import { callPlugins, initializePlugins, plugin, removeAllPlugins } from './plugin'
import { run } from './run'
import type { AsRef, Listener, Operation, Path, Plugin, ProxyObject, ProxyState, RemoveListener, RootState } from './types'

export type { Plugin, RootState }
export { plugin, removeAllPlugins, list }
export { run, batch }

// Shared State, Map with links to all states created.
const proxyStateMap = new Map<ProxyObject, ProxyState>()
const refSet = new WeakSet()
const proxyCache = new WeakMap<object, ProxyObject>()
const versionHolder = [1, 1] as [number, number]

// proxy function renamed to state (proxy as hidden implementation detail).
// @ts-ignore TODO figure out if object will work as expected
export function state<T extends object, R extends object = undefined>(initialObject: T = {} as T, parent?: object, root?: R): T {
  let initialization = true
  if (!isObject(initialObject)) {
    log('Only objects can be made observable with state()', 'error')
  }
  if (!parent && Object.hasOwn(initialObject, 'parent')) {
    log('"parent" property is reserved on state objects to reference the parent', 'warning')
  }
  if (!root && Object.hasOwn(initialObject, 'root')) {
    log('"root" property is reserved on state objects to reference the root', 'warning')
  }

  const plugins = initializePlugins(initialObject)
  derive(initialObject)
  const found = proxyCache.get(initialObject) as T | undefined
  if (found) {
    return found
  }
  let version = versionHolder[0]
  const listeners = new Set<Listener>()
  const notifyUpdate = (operation: Operation, nextVersion = ++versionHolder[0]) => {
    if (version !== nextVersion) {
      version = nextVersion
      // biome-ignore lint/complexity/noForEach: Simple one-liner here.
      listeners.forEach((listener) => listener(operation, nextVersion))
    }
  }

  let checkVersion = versionHolder[1]

  const createPropListener =
    (prop: string | symbol): Listener =>
    (operation, nextVersion) => {
      const newOperation: Operation = [...operation]
      newOperation[1] = [prop, ...(newOperation[1] as Path)]
      notifyUpdate(newOperation, nextVersion)
    }
  const propProxyStates = new Map<string | symbol, readonly [ProxyState, RemoveListener?]>()
  const ensureVersion = (nextCheckVersion = ++versionHolder[1]) => {
    if (checkVersion !== nextCheckVersion && !listeners.size) {
      checkVersion = nextCheckVersion
      for (const [propProxyState] of propProxyStates) {
        // @ts-ignore TODO no tests are using this.
        const propVersion = propProxyState[1](nextCheckVersion)
        if (propVersion > version) {
          version = propVersion
        }
      }
    }
    return version
  }
  const addPropListener = (prop: string | symbol, propProxyState: ProxyState) => {
    if (process.env.NODE_ENV !== 'production' && propProxyStates.has(prop)) {
      throw new Error('prop listener already exists')
    }
    if (listeners.size) {
      const removePropListener = propProxyState[2](createPropListener(prop))
      propProxyStates.set(prop, [propProxyState, removePropListener])
    } else {
      propProxyStates.set(prop, [propProxyState])
    }
  }
  const removePropListener = (prop: string | symbol) => {
    const entry = propProxyStates.get(prop)
    if (entry) {
      propProxyStates.delete(prop)
      entry[1]?.()
    }
  }
  const addListener = (listener: Listener) => {
    listeners.add(listener)
    if (listeners.size === 1) {
      propProxyStates.forEach(([propProxyState, prevRemove], prop) => {
        if (process.env.NODE_ENV !== 'production' && prevRemove) {
          throw new Error('remove already exists')
        }
        const removeProxyListener = propProxyState[2](createPropListener(prop))
        propProxyStates.set(prop, [propProxyState, removeProxyListener])
      })
    }
    const removeListener = () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        propProxyStates.forEach(([propProxyState, removeProxyListener], prop) => {
          if (removeProxyListener) {
            removeProxyListener()
            propProxyStates.set(prop, [propProxyState])
          }
        })
      }
    }
    return removeListener
  }

  const baseObject = createBaseObject(initialObject)
  const handler: ProxyHandler<T> = {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Difficult to fix, central part of the application.
    get(target, property, receiver) {
      if (property === 'parent') {
        return parent // Parent access untracked.
      }
      if (property === 'root') {
        return root // Root access untracked.
      }
      if (property === 'plugin') {
        return undefined // Plugin cannot be accessed or tracked.
      }
      if (property === '_plugin') {
        return plugins // Internal plugin access.
      }

      const value = Reflect.get(target, property, receiver)

      if (!initialization && typeof value !== 'function') {
        notifyUpdate(['get', [property], value])
        // Only call plugins for leaf access.
        if (typeof value !== 'object') {
          callPlugins({ type: 'get', target: receiver, initial: true }, property, receiver ?? root, value)
        }
        track(root ?? receiver, property)
      }
      return value
    },
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Difficult to fix, central part of the application.
    set(target, property, value, receiver: object) {
      if (property === 'parent' || property === 'root' || (!initialization && property === 'plugin')) {
        log(`"${property}" is reserved an cannot be changed`, 'warning')
        return false
      }
      const hasPreviousValue = Reflect.has(target, property)
      const previousValue = Reflect.get(target, property, receiver) // Reflect skips other traps.
      if (
        hasPreviousValue &&
        (Object.is(previousValue, value) || (proxyCache.has(value) && Object.is(previousValue, proxyCache.get(value))))
      ) {
        return true
      }
      removePropListener(property)
      let nextValue = value
      if (value instanceof Promise) {
        value
          .then((result) => {
            // @ts-ignore NOTE custom but common pattern
            value.status = 'fulfilled'
            // @ts-ignore
            value.value = result
            notifyUpdate(['resolve', [property], result])
          })
          .catch((error) => {
            // @ts-ignore
            value.status = 'rejected'
            // @ts-ignore
            value.reason = error
            notifyUpdate(['reject', [property], error])
          })
      } else {
        if (initialization && typeof value === 'function' && value.requiresInitialization) {
          // Custom data structures.
          const { data, after } = value(state)
          nextValue = state(data, receiver, root ?? receiver)
          if (typeof after === 'function') {
            after(nextValue)
          }
        } else if (!proxyStateMap.has(value) && canProxy(value, refSet)) {
          nextValue = state(value, receiver, root ?? receiver)
        } else if (canPolyfill(value)) {
          // TODO Necessary that Map or Set cannot be root?
          if (value instanceof Map) {
            nextValue = objectMap(state, value, parent, root ?? receiver)
          } else {
            nextValue = objectSet(state, value, parent, root ?? receiver)
          }
        }
        const childProxyState = !refSet.has(nextValue) && proxyStateMap.get(nextValue)
        if (childProxyState) {
          addPropListener(property, childProxyState)
        }
      }
      Reflect.set(target, property, nextValue, receiver)
      if (!initialization) {
        isTracked(root ?? receiver, property) // Mark changed values as "dirty" before plugins (rerenders).
        notifyUpdate(['set', [property], value, previousValue])
        scheduleUpdate({ type: 'set', target: receiver, initial: true, property, parent: receiver ?? root, value, previousValue })
      }
      return true
    },
    deleteProperty(target, property) {
      const previousValue = Reflect.get(target, property)
      removePropListener(property)
      const deleted = Reflect.deleteProperty(target, property)
      if (deleted) {
        notifyUpdate(['delete', [property], previousValue])
        scheduleUpdate({ type: 'delete', target, initial: true, property, parent: proxyObject ?? root, previousValue })
      }
      return deleted
    },
  }
  const proxyObject = newProxy(baseObject, handler)
  proxyCache.set(initialObject, proxyObject)
  const proxyState: ProxyState = [baseObject, ensureVersion, addListener]
  proxyStateMap.set(proxyObject, proxyState)
  for (const key of Reflect.ownKeys(initialObject)) {
    const desc = Object.getOwnPropertyDescriptor(initialObject, key) as PropertyDescriptor
    if ('value' in desc) {
      proxyObject[key as keyof T] = initialObject[key as keyof T]
      // We need to delete desc.value because we already set it,
      // and delete desc.writable because we want to write it again.
      delete desc.value
      delete desc.writable
    }
    // This will recursively call the setter trap for any nested properties on the initialObject.
    Object.defineProperty(baseObject, key, desc)
  }
  initialization = false
  return proxyObject
}

export function observe<T extends object>(callback: (operations: Operation[]) => void, proxyObject?: T, notifyInSync?: boolean) {
  const proxyState = proxyStateMap.get(proxyObject as object)
  if (process.env.NODE_ENV !== 'production' && proxyObject && !proxyState) {
    log('proxyObject passed to observe() not registered', 'warning')
    return () => false
  }
  // Observe all registered states recursively.
  if (!proxyObject) {
    const removeListeners: (() => void)[] = []
    for (const currentProxyObject of proxyStateMap.keys()) {
      if (currentProxyObject.root) {
        continue
      }
      const removeListener = observe(callback, currentProxyObject, notifyInSync)
      removeListeners.push(removeListener)
    }
    return () => {
      // biome-ignore lint/complexity/noForEach: Simple one liner here.
      removeListeners.forEach((listener) => listener())
    }
  }
  let promise: Promise<void> | undefined
  const operations: Operation[] = []
  const addListener = (proxyState as ProxyState)[2]
  let isListenerActive = false
  const listener: Listener = (operation: Operation) => {
    operations.push(operation)
    if (notifyInSync) {
      callback(operations.splice(0))
      return
    }
    if (!promise) {
      promise = Promise.resolve().then(() => {
        promise = undefined
        if (isListenerActive) {
          callback(operations.splice(0))
        }
      })
    }
  }
  const removeListener = addListener(listener)
  isListenerActive = true
  return () => {
    isListenerActive = false
    removeListener()
  }
}

export function getVersion(proxyObject: unknown): number | undefined {
  const proxyState = proxyStateMap.get(proxyObject as object)
  return proxyState?.[1]()
}

export function ref<T extends object>(obj: T): T & AsRef {
  refSet.add(obj)
  return obj as T & AsRef
}

export function remove(proxyObject: unknown): boolean {
  if (proxyStateMap.has(proxyObject as object)) {
    proxyStateMap.delete(proxyObject as object)
    return true
  }

  return false
}
