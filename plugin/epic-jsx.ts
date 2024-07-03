import { Renderer, getRoots } from 'epic-jsx'
import { log } from '../helper'
import { type PluginActions, TupleArrayMap } from '../types'

const observedProperties = new TupleArrayMap<object, string, Function>()

export const connect: PluginActions = {
  set: (property: string, parent: object, value: any, previousValue: any) => {
    if (value === previousValue) return

    const components = observedProperties.get(parent, property)

    // Remove, as get will be tracked again during render.
    if (observedProperties.has(parent, property)) {
      observedProperties.delete(parent, property)
    }

    // Trigger rerender on components.
    components?.forEach((component) => component())

    // TODO This will trigger a rerender, probably better to add an interface specific to this.
    getRoots()
  },
  get: (property: string, parent: object) => {
    if (!Renderer.current) return // Accessed outside a component.
    const { component } = Renderer.current
    if (!component || !component.rerender) {
      log('Cannot rerender epic-jsx component', 'warning')
      return
    }

    // Register rerender on current component.
    if (observedProperties.has(parent, property)) {
      const components = observedProperties.get(parent, property)
      // eslint-disable-next-line no-underscore-dangle
      components?.push(component.rerender)
    } else {
      // eslint-disable-next-line no-underscore-dangle
      observedProperties.add(parent, property, component.rerender)
    }
  },
}
