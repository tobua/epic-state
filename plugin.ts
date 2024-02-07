import { Plugin, PluginActions } from './types'

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
  // TODO call general and parent plugins as well.
  if (Object.hasOwn(target, 'plugin')) {
    target.plugin.forEach((item) => {
      if (item[type]) {
        item[type].call(this, ...values)
      }
    })
  }
}
