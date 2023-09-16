import { getUntracked, markToTrack } from 'proxy-compare'
import {
  AsRef,
  CreateSnapshot,
  HandlePromise,
  Listener,
  Op,
  Path,
  ProxyObject,
  ProxyState,
  RemoveListener,
  Snapshot,
} from './types'
import { isObject } from './helper'
import { proxyMap, proxySet } from './polyfill'

// Shared State, Map with links to all states created.
const proxyStateMap = new WeakMap<ProxyObject, ProxyState>()
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
  }
) => {
  switch (promise.status) {
    case 'fulfilled':
      return promise.value as Awaited<P>
    case 'rejected':
      throw promise.reason
    default:
      throw promise
  }
}

const snapCache = new WeakMap<object, [version: number, snap: unknown]>()

const createSnapshot: CreateSnapshot = <T extends object>(
  target: T,
  version: number,
  handlePromise: HandlePromise = defaultHandlePromise
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
      const [target, ensureVersion] = proxyStateMap.get(value as object) as ProxyState
      desc.value = createSnapshot(target, ensureVersion(), handlePromise) as Snapshot<T>
    }
    Object.defineProperty(snap, key, desc)
  })
  return Object.preventExtensions(snap)
}

const proxyCache = new WeakMap<object, ProxyObject>()

const versionHolder = [1, 1] as [number, number]

// proxy function renamed to state (proxy as hidden implementation detail).
export function state<T extends object>(initialObject: T = {} as T): T {
  if (!isObject(initialObject)) {
    throw new Error('object required')
  }
  const found = proxyCache.get(initialObject) as T | undefined
  if (found) {
    return found
  }
  let version = versionHolder[0]
  const listeners = new Set<Listener>()
  const notifyUpdate = (op: Op, nextVersion = ++versionHolder[0]) => {
    if (version !== nextVersion) {
      version = nextVersion
      listeners.forEach((listener) => listener(op, nextVersion))
    }
  }
  let checkVersion = versionHolder[1]
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
  const createPropListener =
    (prop: string | symbol): Listener =>
    (op, nextVersion) => {
      const newOp: Op = [...op]
      newOp[1] = [prop, ...(newOp[1] as Path)]
      notifyUpdate(newOp, nextVersion)
    }
  const propProxyStates = new Map<string | symbol, readonly [ProxyState, RemoveListener?]>()
  const addPropListener = (prop: string | symbol, propProxyState: ProxyState) => {
    if (process.env.NODE_ENV !== 'production' && propProxyStates.has(prop)) {
      throw new Error('prop listener already exists')
    }
    if (listeners.size) {
      const remove = propProxyState[3](createPropListener(prop))
      propProxyStates.set(prop, [propProxyState, remove])
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
        const remove = propProxyState[3](createPropListener(prop))
        propProxyStates.set(prop, [propProxyState, remove])
      })
    }
    const removeListener = () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        propProxyStates.forEach(([propProxyState, remove], prop) => {
          if (remove) {
            remove()
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
    deleteProperty(target: T, prop: string | symbol) {
      const prevValue = Reflect.get(target, prop)
      removePropListener(prop)
      const deleted = Reflect.deleteProperty(target, prop)
      if (deleted) {
        notifyUpdate(['delete', [prop], prevValue])
      }
      return deleted
    },
    set(target: T, prop: string | symbol, value: any, receiver: object) {
      const hasPrevValue = Reflect.has(target, prop)
      const prevValue = Reflect.get(target, prop, receiver)
      if (
        hasPrevValue &&
        (objectIs(prevValue, value) ||
          (proxyCache.has(value) && objectIs(prevValue, proxyCache.get(value))))
      ) {
        return true
      }
      removePropListener(prop)
      if (isObject(value)) {
        value = getUntracked(value) || value
      }
      let nextValue = value
      if (value instanceof Promise) {
        value
          .then((v) => {
            value.status = 'fulfilled'
            value.value = v
            notifyUpdate(['resolve', [prop], v])
          })
          .catch((e) => {
            value.status = 'rejected'
            value.reason = e
            notifyUpdate(['reject', [prop], e])
          })
      } else {
        if (!proxyStateMap.has(value) && canProxy(value)) {
          nextValue = state(value)
        } else if (canPolyfill(value)) {
          if (value instanceof Map) {
            nextValue = proxyMap(value)
          } else {
            nextValue = proxySet(value)
          }
        }
        const childProxyState = !refSet.has(nextValue) && proxyStateMap.get(nextValue)
        if (childProxyState) {
          addPropListener(prop, childProxyState)
        }
      }
      Reflect.set(target, prop, nextValue, receiver)
      notifyUpdate(['set', [prop], value, prevValue])
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
    Object.defineProperty(baseObject, key, desc)
  })
  return proxyObject
}

export function subscribe<T extends object>(
  proxyObject: T,
  callback: (ops: Op[]) => void,
  notifyInSync?: boolean
): () => void {
  const proxyState = proxyStateMap.get(proxyObject as object)
  if (process.env.NODE_ENV !== 'production' && !proxyState) {
    console.warn('Please use proxy object')
  }
  let promise: Promise<void> | undefined
  const ops: Op[] = []
  const addListener = (proxyState as ProxyState)[3]
  let isListenerActive = false
  const listener: Listener = (op) => {
    ops.push(op)
    if (notifyInSync) {
      callback(ops.splice(0))
      return
    }
    if (!promise) {
      promise = Promise.resolve().then(() => {
        promise = undefined
        if (isListenerActive) {
          callback(ops.splice(0))
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
  handlePromise?: HandlePromise
): Snapshot<T> {
  const proxyState = proxyStateMap.get(proxyObject as object)
  if (process.env.NODE_ENV !== 'production' && !proxyState) {
    console.warn('Please use proxy object')
  }
  const [target, ensureVersion, createSnapshot] = proxyState as ProxyState
  return createSnapshot(target, ensureVersion(), handlePromise) as Snapshot<T>
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
