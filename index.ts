import { getUntracked, markToTrack } from 'proxy-compare'
import {
  AsRef,
  CreateSnapshot,
  HandlePromise,
  Listener,
  Operation,
  Path,
  ProxyObject,
  ProxyState,
  RemoveListener,
  RootState,
  Snapshot,
} from './types'
import { isObject, log } from './helper'
import { objectMap, objectSet } from './polyfill'

export type { Plugin } from './types'

// Shared State, Map with links to all states created.
const proxyStateMap = new Map<ProxyObject, ProxyState>()
const refSet = new WeakSet()

const objectIs = Object.is
const newProxy = <T extends object>(target: T, handler: ProxyHandler<T>): T =>
  new Proxy(target, handler)
const canProxy = (x: unknown) =>
  isObject(x) &&
  !refSet.has(x) &&
  (Array.isArray(x) || !(Symbol.iterator in x)) &&
  !(x instanceof WeakMap) &&
  !(x instanceof WeakSet) &&
  !(x instanceof Error) &&
  !(x instanceof Number) &&
  !(x instanceof Date) &&
  !(x instanceof String) &&
  !(x instanceof RegExp) &&
  !(x instanceof ArrayBuffer)

const canPolyfill = (x: unknown) => x instanceof Map || x instanceof Set

const defaultHandlePromise = <P extends Promise<any>>(
  promise: P & {
    status?: 'pending' | 'fulfilled' | 'rejected'
    value?: Awaited<P>
    reason?: unknown
  },
) => {
  switch (promise.status) {
    case 'fulfilled':
      return promise.value as Awaited<P>
    case 'rejected':
      throw promise.reason
    default:
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw promise
  }
}

const snapCache = new WeakMap<object, [version: number, snap: unknown]>()

const createSnapshot: CreateSnapshot = <T extends object>(
  target: T,
  version: number,
  handlePromise: HandlePromise = defaultHandlePromise,
): T => {
  const cache = snapCache.get(target)
  if (cache?.[0] === version) {
    return cache[1] as T
  }
  const snap: any = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target))
  markToTrack(snap, true) // mark to track
  snapCache.set(target, [version, snap])
  Reflect.ownKeys(target).forEach((key) => {
    if (Object.getOwnPropertyDescriptor(snap, key)) {
      // Only the known case is Array.length so far.
      return
    }
    const value = Reflect.get(target, key)
    const desc: PropertyDescriptor = {
      value,
      enumerable: true,
      // This is intentional to avoid copying with proxy-compare.
      // It's still non-writable, so it avoids assigning a value.
      configurable: true,
    }
    if (refSet.has(value as object)) {
      markToTrack(value as object, false) // mark not to track
    } else if (value instanceof Promise) {
      delete desc.value
      desc.get = () => handlePromise(value)
    } else if (proxyStateMap.has(value as object)) {
      const [proxyTarget, ensureVersion] = proxyStateMap.get(value as object) as ProxyState
      desc.value = createSnapshot(proxyTarget, ensureVersion(), handlePromise) as Snapshot<T>
    }
    Object.defineProperty(snap, key, desc)
  })
  return Object.preventExtensions(snap)
}

const proxyCache = new WeakMap<object, ProxyObject>()

const versionHolder = [1, 1] as [number, number]

// proxy function renamed to state (proxy as hidden implementation detail).
export function state<T extends object, R = undefined>(
  initialObject: T = {} as T,
  parent?: object,
  root?: R,
): RootState<T, R> {
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
  const found = proxyCache.get(initialObject) as RootState<T, R> | undefined
  if (found) return found
  let version = versionHolder[0]
  const listeners = new Set<Listener>()
  const notifyUpdate = (operation: Operation, nextVersion = ++versionHolder[0]) => {
    if (version !== nextVersion) {
      version = nextVersion
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
      propProxyStates.forEach(([propProxyState]) => {
        const propVersion = propProxyState[1](nextCheckVersion)
        if (propVersion > version) {
          version = propVersion
        }
      })
    }
    return version
  }
  const addPropListener = (prop: string | symbol, propProxyState: ProxyState) => {
    if (process.env.NODE_ENV !== 'production' && propProxyStates.has(prop)) {
      throw new Error('prop listener already exists')
    }
    if (listeners.size) {
      const removePropListener = propProxyState[3](createPropListener(prop))
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
        const removeProxyListener = propProxyState[3](createPropListener(prop))
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
  const baseObject = Array.isArray(initialObject)
    ? []
    : Object.create(Object.getPrototypeOf(initialObject))
  const handler: ProxyHandler<T> = {
    deleteProperty(target, property) {
      const prevValue = Reflect.get(target, property)
      removePropListener(property)
      const deleted = Reflect.deleteProperty(target, property)
      if (deleted) {
        notifyUpdate(['delete', [property], prevValue])
      }
      return deleted
    },
    get(target, property, receiver) {
      if (property === 'parent') return parent // Parent access untracked.
      if (property === 'root') return root // Root access untracked.
      if (property === 'plugin') return undefined // Plugin cannot be accessed or tracked.
      const value = Reflect.get(target, property, receiver)
      notifyUpdate(['get', [property], value])
      return value
    },
    set(target, property, value, receiver: object) {
      if (
        property === 'parent' ||
        property === 'root' ||
        (!initialization && property === 'plugin')
      ) {
        log(`"${property}" is reserved an cannot be changed`, 'warning')
        return false
      }
      const hasPrevValue = Reflect.has(target, property)
      const prevValue = Reflect.get(target, property, receiver) // Reflect skips other traps.
      if (
        hasPrevValue &&
        (objectIs(prevValue, value) ||
          (proxyCache.has(value) && objectIs(prevValue, proxyCache.get(value))))
      ) {
        return true
      }
      removePropListener(property)
      if (isObject(value)) {
        // eslint-disable-next-line no-param-reassign
        value = getUntracked(value) || value
      }
      let nextValue = value
      if (value instanceof Promise) {
        value
          .then((v) => {
            value.status = 'fulfilled'
            value.value = v
            notifyUpdate(['resolve', [property], v])
          })
          .catch((e) => {
            value.status = 'rejected'
            value.reason = e
            notifyUpdate(['reject', [property], e])
          })
      } else {
        if (!proxyStateMap.has(value) && canProxy(value)) {
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
      notifyUpdate(['set', [property], value, prevValue])
      return true
    },
  }
  const proxyObject = newProxy(baseObject, handler)
  proxyCache.set(initialObject, proxyObject)
  const proxyState: ProxyState = [baseObject, ensureVersion, createSnapshot, addListener]
  proxyStateMap.set(proxyObject, proxyState)
  Reflect.ownKeys(initialObject).forEach((key) => {
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
  })
  initialization = false
  return proxyObject
}

export function observe<T extends object>(
  callback: (operations: Operation[]) => void,
  proxyObject?: T,
  notifyInSync?: boolean,
) {
  const proxyState = proxyStateMap.get(proxyObject as object)
  if (process.env.NODE_ENV !== 'production' && proxyObject && !proxyState) {
    log('proxyObject passed to observe() not registered', 'warning')
    return () => false
  }
  // Observe all registered states recursively.
  if (!proxyObject) {
    const removeListeners = []
    Array.from(proxyStateMap.keys()).forEach((currentProxyObject) => {
      if (currentProxyObject.root) return
      const removeListener = observe(callback, currentProxyObject, notifyInSync)
      removeListeners.push(removeListener)
    })
    return () => {
      removeListeners.forEach((listener) => listener())
    }
  }
  let promise: Promise<void> | undefined
  const operations: Operation[] = []
  const addListener = (proxyState as ProxyState)[3]
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

export function snapshot<T extends object>(
  proxyObject: T,
  handlePromise?: HandlePromise,
): Snapshot<T> {
  const proxyState = proxyStateMap.get(proxyObject as object)
  if (process.env.NODE_ENV !== 'production' && !proxyState) {
    console.warn('Please use proxy object')
  }
  const [target, ensureVersion, proxyCreateSnapshot] = proxyState as ProxyState
  return proxyCreateSnapshot(target, ensureVersion(), handlePromise) as Snapshot<T>
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
