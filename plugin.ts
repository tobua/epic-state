import type { Plugin, PluginActions, Property } from './types'

const globalPlugins: (PluginActions | Plugin<['initialize']>)[] = []

export function initializePlugins(state: object & { plugin?: Plugin<any> | Plugin<any>[] }) {
  if (!state.plugin) {
    return undefined
  }

  const plugins = Array.isArray(state.plugin) ? state.plugin : [state.plugin]
  // @ts-ignore
  state.plugin = plugins.map((item) => item('initialize', state))

  return state.plugin
}

type CallPluginOptions = {
  type: keyof PluginActions
  // Use _plugin to access plugins internally (not exposed).
  target: object & { _plugin?: PluginActions[]; parent?: object }
  initial?: boolean
}

// NOTE accessing values in here can also lead to recursive calls.
export function callPlugins({ type, target, initial = false }: CallPluginOptions, ...values: [Property, object, any?, any?]) {
  // Current plugin.
  if (target._plugin) {
    for (const item of target._plugin) {
      const plugin = item[type]
      if (plugin) {
        // @ts-ignore Apply can also be used on arrow functions to override the this.
        plugin.apply(item, values)
      }
    }
  }

  // TODO make plugin inheritance configurable.
  // Recursively invoke plugins found on parents (which are inherited).
  if (target.parent) {
    callPlugins({ type, target: target.parent }, ...values)
  }

  if (!initial) {
    return
  }

  // Global plugins.
  for (const item of globalPlugins) {
    // @ts-ignore
    const plugin = item[type]
    if (plugin) {
      plugin.apply(item, values)
    }
  }
}

export function plugin(plugin: Plugin<any>) {
  const initializedPlugin = typeof plugin === 'function' ? plugin('initialize') : plugin
  globalPlugins.push(initializedPlugin)

  return function removePlugin() {
    const remainingGlobalPlugins = globalPlugins.filter((currentPlugin) => initializedPlugin !== currentPlugin)
    globalPlugins.splice(0, globalPlugins.length, ...remainingGlobalPlugins)
  }
}

export function removeAllPlugins() {
  globalPlugins.length = 0
}
