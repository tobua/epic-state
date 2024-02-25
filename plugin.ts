import { Plugin, PluginActions, Property } from './types'

const globalPlugins: PluginActions[] = []

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
export function callPlugins(
  { type, target, initial = false }: CallPluginOptions,
  ...values: [Property, object, ...any]
) {
  // Current plugin.
  if (target._plugin) {
    target._plugin.forEach((item) => {
      if (item[type]) {
        item[type].call(this, ...values)
      }
    })
  }

  // TODO make plugin inheritance configurable.
  // Recursively invoke plugins found on parents (which are inherited).
  if (target.parent) {
    callPlugins({ type, target: target.parent }, ...values)
  }

  if (!initial) return

  // Global plugins.
  globalPlugins.forEach((item) => {
    if (item[type]) {
      item[type].call(this, ...values)
    }
  })
}

export function plugin(item: PluginActions) {
  globalPlugins.push(item)

  return function removePlugin() {
    const remainingGlobalPlugins = globalPlugins.filter((currentPlugin) => item !== currentPlugin)
    globalPlugins.splice(0, globalPlugins.length, ...remainingGlobalPlugins)
  }
}
