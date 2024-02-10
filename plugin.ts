import { Plugin, PluginActions } from './types'

const globalPlugins: PluginActions[] = []

export function initializePlugins(state: object & { plugin?: Plugin<any> | Plugin<any>[] }) {
  if (!state.plugin) {
    return
  }

  const plugins = Array.isArray(state.plugin) ? state.plugin : [state.plugin]
  // @ts-ignore
  state.plugin = plugins.map((item) => item('initialize', state))
}

export function callPlugins(
  type: keyof PluginActions,
  target: object & { plugin?: PluginActions[] },
  ...values: any[]
) {
  // TODO call parent plugins as well?
  // Current plugin.
  if (Object.hasOwn(target, 'plugin')) {
    target.plugin.forEach((item) => {
      if (item[type]) {
        item[type].call(this, ...values)
      }
    })
  }

  // Global plugins.
  globalPlugins.forEach((item) => {
    if (item[type]) {
      item[type].call(this, ...values)
    }
  })
}

export function plugin(item: PluginActions) {
  globalPlugins.push(item)
}
