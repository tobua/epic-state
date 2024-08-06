import { Renderer, type Type, getRoots } from 'epic-jsx'
import { log } from '../helper'
import { type Plugin, type RerenderMethod, TupleArrayMap, type Value } from '../types'

export const connect: Plugin<string[]> = (initialize) => {
  if (initialize !== 'initialize') {
    log('connect plugin cannot be configured', 'warning')
  }

  const observedProperties = new TupleArrayMap<object, string, { rerender: RerenderMethod; type: Type }>()

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
      const renderedComponents = new Set()
      if (components) {
        for (const component of components) {
          // Check if already rendered
          if (!renderedComponents.has(component.type)) {
            component.rerender()
            renderedComponents.add(component.type) // Mark as rendered
          }
        }
      }

      // TODO This will trigger a rerender, probably better to add an interface specific to this.
      getRoots()
    },
    get: (property: string, parent: object) => {
      if (!Renderer.current) {
        return // Accessed outside a component.
      }
      const { component, type } = Renderer.current
      if (!component?.rerender) {
        log('Cannot rerender epic-jsx component', 'warning')
        return
      }

      // Register rerender on current component.
      if (observedProperties.has(parent, property)) {
        const components = observedProperties.get(parent, property)
        const alreadyRegistered = components?.some((value) => value.type === type)
        if (!alreadyRegistered) {
          components?.push({ rerender: component.rerender, type })
        }
      } else if (!observedProperties.has(parent, property)) {
        observedProperties.add(parent, property, { rerender: component.rerender, type })
      }
    },
  }
}
