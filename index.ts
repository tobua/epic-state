import { Renderer } from 'epic-jsx' // TODO import should be optional and not required, pass along with connect.
import { batch, scheduleUpdate } from './batching'
import { list } from './data/list'
import { load } from './data/load'
import { objectMap, objectSet } from './data/polyfill'
import { derive, isTracked, track } from './derive'
import { canPolyfill, canProxy, createBaseObject, isObject, isSetter, log, newProxy, set, toggle, updateProxyValues } from './helper'
import { callPlugins, initializePlugins, plugin, removeAllPlugins } from './plugin'
import { observe } from './plugin/observe'
import { run } from './run'
import {
  type AsRef,
  type ConfigurablePlugin,
  type ConfiguredPlugin,
  type Observation,
  type ObservationCallback,
  type Plugin,
  PluginAction,
  type PluginActions,
  type Property,
  type ProxyObject,
  type ProxyState,
  type RootState,
  type Value,
} from './types'

export type { Plugin, Property, Value, ConfigurablePlugin, ConfiguredPlugin, RootState, PluginActions, Observation, ObservationCallback }
export { plugin, removeAllPlugins, list, load, run, batch, observe, set, toggle }

// Shared State, Map with links to all states created.
const proxyStateMap = new Map<ProxyObject, ProxyState>()
const refSet = new WeakSet()
const renderStateMap = new Map<number, ProxyState>()

// proxy function renamed to state (proxy as hidden implementation detail).
// @ts-ignore TODO figure out if object will work as expected
export function state<T extends object, R extends object = undefined>(initialObject: T = {} as T, parent?: object, root?: R): T {
  if (Renderer.current?.id && renderStateMap.has(Renderer.current.id)) {
    return renderStateMap.get(Renderer.current.id) as T
  }

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

  derive(initialObject)

  let plugins: PluginActions[] = []
  const baseObject = createBaseObject(initialObject)
  const handler: ProxyHandler<T> = {
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
      if (property === 'addPlugin') {
        return (newPlugin: Plugin | PluginActions) =>
          plugins.push(typeof newPlugin === 'function' ? newPlugin('initialize', proxyObject) : newPlugin) // Add plugins after initialization.
      }

      const value = Reflect.get(target, property, receiver)

      if (!initialization && typeof value !== 'function') {
        callPlugins({
          type: PluginAction.Get,
          target: receiver,
          initial: true,
          property,
          parent: receiver ?? root,
          leaf: typeof value !== 'object',
          value,
        })
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

      const previousValue = Reflect.get(target, property, receiver) // Reflect skips other traps.
      if (value === previousValue) {
        // Skip unchanged values.
        return true
      }

      let nextValue = value
      if (value instanceof Promise) {
        value
          .then((result) => {
            // @ts-ignore NOTE custom but common pattern
            value.status = 'fulfilled'
            // @ts-ignore
            value.value = result
            // TODO schedule update PluginAction.Resolve property, result
          })
          .catch((error) => {
            // @ts-ignore
            value.status = 'rejected'
            // @ts-ignore
            value.reason = error
            // TODO schedule update PluginAction.Reject property, error
          })
      } else {
        if (initialization && typeof value === 'function' && value.requiresInitialization) {
          // Custom data structures.
          const { data, after } = value(state)
          nextValue = data
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
          // TODO what's child proxy state???
        }
      }
      // Call setters and getters on existing proxy.
      if (!initialization && typeof value === 'object' && typeof previousValue === 'object' && !Array.isArray(value)) {
        updateProxyValues(previousValue as unknown as ProxyObject, value)
        return true
      }
      if (previousValue === undefined && !isSetter(target, property)) {
        Object.defineProperty(target, property, {
          value: nextValue,
          writable: true,
          configurable: true,
        })
      } else {
        Reflect.set(target, property, nextValue, receiver)
      }
      if (!initialization) {
        isTracked(root ?? receiver, property) // Mark changed values as "dirty" before plugins (rerenders).
        scheduleUpdate({
          type: PluginAction.Set,
          target: receiver as ProxyObject,
          initial: true,
          property,
          parent: (receiver ?? root) as ProxyObject,
          value,
          previousValue,
          leaf: typeof value !== 'object',
        })
      }
      return true
    },
    deleteProperty(target, property) {
      const previousValue = Reflect.get(target, property)
      const deleted = Reflect.deleteProperty(target, property)
      if (deleted) {
        // TODO no receiver, no parent access?
        scheduleUpdate({
          type: PluginAction.Delete,
          target: target as ProxyObject,
          initial: true,
          property,
          parent: proxyObject ?? root,
          previousValue,
          leaf: typeof previousValue !== 'object',
        })
      }
      return deleted
    },
  }
  const proxyObject = newProxy(baseObject, handler)
  const proxyState: ProxyState = [baseObject]
  proxyStateMap.set(proxyObject, proxyState)
  if (Renderer.current?.id) {
    renderStateMap.set(Renderer.current.id, proxyObject)
  }
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
  // @ts-ignore
  plugins = initializePlugins(proxyObject, initialObject.plugin)
  initialization = false
  return proxyObject
}

export function ref<T extends object>(obj: T): T & AsRef {
  refSet.add(obj)
  return obj as T & AsRef
}

export function remove(proxyObject: unknown): boolean {
  if (proxyStateMap.has(proxyObject as ProxyObject)) {
    proxyStateMap.delete(proxyObject as ProxyObject)
    return true
  }

  return false
}
