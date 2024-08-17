import type { CallPluginOptions, Plugin, PluginActions, ProxyObject } from './types'

const globalPlugins: PluginActions[] = []

export function initializePlugins(state: ProxyObject, plugin: Plugin | Plugin[]) {
  if (!plugin) {
    return [] // Can also add plugins later using state.addPlugin(plugin)
  }

  const plugins = Array.isArray(plugin) ? plugin : [plugin]
  return plugins.map((item) => item('initialize', state))
}

// NOTE accessing values in here can also lead to recursive calls.
export function callPlugins({ type, target, initial = false, ...options }: CallPluginOptions) {
  // Current plugin.
  if (target._plugin) {
    for (const item of target._plugin) {
      const plugin = item[type]
      if (plugin && (item.all || options.leaf)) {
        // @ts-ignore Apply can also be used on arrow functions to override the this.
        plugin.call(item, options)
      }
    }
  }

  // TODO make plugin inheritance configurable.
  // Recursively invoke plugins found on parents (which are inherited).
  if (target.parent) {
    callPlugins({ type, target: target.parent, ...options })
  }

  if (!initial) {
    return
  }

  // Global plugins.
  for (const item of globalPlugins) {
    const plugin = item[type]
    if (plugin && (item.all || options.leaf)) {
      // @ts-ignore
      plugin.call(item, options)
    }
  }
}

// Register global plugin.
export function plugin(plugin: Plugin | PluginActions) {
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

// TODO destroy an existing state object and it's associated plugins.
