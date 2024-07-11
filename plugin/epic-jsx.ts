import { Renderer, getRoots } from 'epic-jsx'
import { log } from '../helper'
import { type Plugin, TupleArrayMap, type Value } from '../types'

export const connect: Plugin<string[]> = (initialize) => {
  if (initialize !== 'initialize') {
    log('connect plugin cannot be configured', 'warning')
  }

  const observedProperties = new TupleArrayMap<object, string, () => void>()

  return {
    set: (property: string, parent: object, value: Value, previousValue: Value) => {
      if (value === previousValue) {
        return
      }

      const components = observedProperties.get(parent, property)

      // Remove, as get will be tracked again during render.
      if (observedProperties.has(parent, property)) {
        observedProperties.delete(parent, property)
      }

      // Trigger rerender on components.
      if (components) {
        for (const component of components) {
          component()
        }
      }

      // TODO This will trigger a rerender, probably better to add an interface specific to this.
      getRoots()
    },
    get: (property: string, parent: object) => {
      if (!Renderer.current) {
        return // Accessed outside a component.
      }
      const { component } = Renderer.current
      if (!component?.rerender) {
        log('Cannot rerender epic-jsx component', 'warning')
        return
      }

      // Register rerender on current component.
      if (observedProperties.has(parent, property)) {
        const components = observedProperties.get(parent, property)
        if (!components?.includes(component.rerender)) {
          components?.push(component.rerender)
        }
      } else if (!observedProperties.has(parent, property)) {
        observedProperties.add(parent, property, component.rerender)
      }
    },
  }
}
