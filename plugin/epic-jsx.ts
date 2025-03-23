import { type Component, Renderer, getRoots } from 'epic-jsx'
import { log } from '../helper'
import { type Plugin, type PluginActions, type Property, TupleArrayMap } from '../types'

const connections: TupleArrayMap<number, Property, Component>[] = []

export function debug() {
  const lines: string[] = []
  for (const [index, observedProperties] of connections.entries()) {
    const keys = observedProperties.list()
    let line = ''
    line += `connect() ${index} - `
    for (const key of keys) {
      line += `State #${key[0]}: `
      const properties = [...key[1].entries()]
      for (const property of properties) {
        line += `"${String(property[0])}"`
        const components = property[1]
        for (const component of components) {
          line += ` ${component.id} `
        }
      }
    }
    lines.push(line)
  }
  return lines.join('\n')
}

export const connect: Plugin = (initialize) => {
  if (initialize !== 'initialize') {
    log('connect plugin cannot be configured', 'warning')
  }

  const observedProperties = new TupleArrayMap<number, Property, Component>()

  connections.push(observedProperties)

  return {
    set: ({ property, parent: { _id: id }, value, previousValue }) => {
      if (value === previousValue) {
        return
      }

      const components = observedProperties.get(id, property)

      // Remove, as get will be tracked again during render.
      if (observedProperties.has(id, property)) {
        observedProperties.delete(id, property)
      }

      // Trigger rerender on components.
      const renderedComponents = new Set()
      if (components) {
        for (const component of components) {
          // Check if already rendered
          if (!renderedComponents.has(component.id)) {
            component.rerender()
            renderedComponents.add(component.id) // Mark as rendered
          }
        }
      }

      // TODO This will trigger a rerender, probably better to add an interface specific to this.
      getRoots()
    },
    get: ({ property, parent: { _id: id } }) => {
      if (!Renderer.current) {
        return // Accessed outside a component.
      }
      const { component } = Renderer.current
      if (!component?.rerender) {
        log('Cannot rerender epic-jsx component', 'warning')
        return
      }

      // Register rerender on current component.
      if (observedProperties.has(id, property)) {
        const components = observedProperties.get(id, property)
        const alreadyRegistered = components?.some((value) => value.id === component.id)
        if (!alreadyRegistered) {
          components?.push(component)
        }
      } else {
        observedProperties.add(id, property, component)
      }
    },
    delete: () => {
      // TODO remove observation and trigger rerender
    },
  } as PluginActions
}
