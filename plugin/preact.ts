/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
import { options, Component, type VNode as PreactVNode } from 'preact'
import { type Plugin, TupleArrayMap } from '../types'
import { log } from '../helper'

// With preact you can set custom hooks for the render cycle: https://preactjs.com/guide/v10/options
// While the render hook isn't exposed it can still be added as '__r' and used to access
// the currently rendered component reliably.

const enum OptionsTypes {
  HOOK = '__h',
  DIFF = '__b',
  DIFFED = 'diffed',
  RENDER = '__r',
  CATCH_ERROR = '__e',
  UNMOUNT = 'unmount',
}

interface VNode<P = any> extends PreactVNode<P> {
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
  [OptionsTypes.CATCH_ERROR](error: any, vnode: VNode, oldVNode: VNode): void
  [OptionsTypes.UNMOUNT](vnode: VNode): void
}

type HookFn<T extends keyof OptionsType> = (
  old: OptionsType[T],
  ...a: Parameters<OptionsType[T]>
) => ReturnType<OptionsType[T]>

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

hook(OptionsTypes.CATCH_ERROR, (old, error, vnode, oldVNode) => {
  currentComponent = undefined
  if (old) {
    old(error, vnode, oldVNode)
  }
})

hook(OptionsTypes.DIFFED, (old, vnode) => {
  currentComponent = undefined
  if (old) {
    old(vnode)
  }
})

export const connect: Plugin<string[]> = (initialize) => {
  if (initialize !== 'initialize') {
    log('connect plugin cannot be configured', 'warning')
  }

  const observedProperties = new TupleArrayMap<object, string, Function>()

  return {
    set: (property: string, parent: object, value: any, previousValue: any) => {
      if (value === previousValue) return

      const components = observedProperties.get(parent, property)

      // Remove, as get will be tracked again during render.
      if (observedProperties.has(parent, property)) {
        observedProperties.delete(parent, property)
      }

      // Trigger rerender on components.
      components?.forEach((component) => component())
    },
    get: (property: string, parent: object) => {
      if (!currentComponent) return // Accessed outside a component.
      if (!currentComponent._updater) {
        log('Missing _updater on component', 'warning')
        return
      }

      // Register rerender on current component.
      if (!observedProperties.has(parent, property)) {
        // eslint-disable-next-line no-underscore-dangle
        observedProperties.add(parent, property, currentComponent._updater)
      } else {
        const components = observedProperties.get(parent, property)
        // eslint-disable-next-line no-underscore-dangle
        components?.push(currentComponent._updater)
      }
    },
  }
}
