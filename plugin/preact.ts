import { type Component, options, type VNode as preactNode } from 'preact'
import { log } from '../helper'
import { type Plugin, type PluginActions, type Property, type ProxyObject, TupleArrayMap } from '../types'

// With preact you can set custom hooks for the render cycle: https://preactjs.com/guide/v10/options
// While the render hook isn't exposed it can still be added as '__r' and used to access
// the currently rendered component reliably.

enum OptionsTypes {
  // biome-ignore lint/style/useNamingConvention: Preact default.
  HOOK = '__h',
  // biome-ignore lint/style/useNamingConvention: Preact default.
  DIFF = '__b',
  // biome-ignore lint/style/useNamingConvention: Preact default.
  DIFFED = 'diffed',
  // biome-ignore lint/style/useNamingConvention: Preact default.
  RENDER = '__r',
  // biome-ignore lint/style/useNamingConvention: Preact default.
  CATCH_ERROR = '__e',
  // biome-ignore lint/style/useNamingConvention: Preact default.
  UNMOUNT = 'unmount',
}

// biome-ignore lint/style/useNamingConvention: Will lead to infinite parsing when run with --write.
interface VNode<P = any> extends preactNode<P> {
  /** The component instance for this VNode */
  __c: AugmentedComponent
  /** The parent VNode */
  __?: VNode
  /** The DOM node for this VNode */
  __e?: Element | Text
  /** Props that had Signal values before diffing (used after diffing to subscribe) */
  __np?: Record<string, any> | null
}

interface AugmentedComponent extends Component<any, any> {
  __v: VNode
  _updater?: () => void
  _updateFlags: number
}

const HAS_PENDING_UPDATE = 1 << 0

function hook<T extends OptionsTypes>(hookName: T, hookFn: HookFn<T>) {
  // @ts-ignore-next-line private options hooks usage
  options[hookName] = hookFn.bind(null, options[hookName])
}

interface OptionsType {
  [OptionsTypes.HOOK](component: Component, index: number, type: number): void
  [OptionsTypes.DIFF](vnode: VNode): void
  [OptionsTypes.DIFFED](vnode: VNode): void
  [OptionsTypes.RENDER](vnode: VNode): void
  [OptionsTypes.CATCH_ERROR](error: any, vnode: VNode, oldNode: VNode): void
  [OptionsTypes.UNMOUNT](vnode: VNode): void
}

type HookFn<T extends keyof OptionsType> = (old: OptionsType[T], ...a: Parameters<OptionsType[T]>) => ReturnType<OptionsType[T]>

let currentComponent: AugmentedComponent | undefined

hook(OptionsTypes.RENDER, (old, vnode) => {
  const component = vnode.__c
  if (component) {
    component._updateFlags &= ~HAS_PENDING_UPDATE

    if (!component._updater) {
      component._updater = function forceUpdate() {
        component._updateFlags |= HAS_PENDING_UPDATE
        component.setState({})
      }
    }
  }

  currentComponent = component
  if (old) {
    // NOTE missing in original implementation, sometimes causes issues, probably due to order of registration.
    old(vnode)
  }
})

hook(OptionsTypes.CATCH_ERROR, (old, error, vnode, oldNode) => {
  currentComponent = undefined
  if (old) {
    old(error, vnode, oldNode)
  }
})

hook(OptionsTypes.DIFFED, (old, vnode) => {
  currentComponent = undefined
  if (old) {
    old(vnode)
  }
})

export const connect: Plugin = (initialize) => {
  if (initialize !== 'initialize') {
    log('connect plugin cannot be configured', 'warning')
  }

  const observedProperties = new TupleArrayMap<ProxyObject, Property, () => void>()

  return {
    set: ({ property, parent, value, previousValue }) => {
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
    },
    get: ({ property, parent }) => {
      if (!currentComponent) {
        return // Accessed outside a component.
      }
      if (!currentComponent._updater) {
        log('Missing _updater on component', 'warning')
        return
      }

      // Register rerender on current component.
      if (observedProperties.has(parent, property)) {
        const components = observedProperties.get(parent, property)

        if (!components?.includes(currentComponent._updater)) {
          components?.push(currentComponent._updater)
        }
      } else if (!observedProperties.has(parent, property)) {
        observedProperties.add(parent, property, currentComponent._updater)
      }
    },
  } as PluginActions
}
