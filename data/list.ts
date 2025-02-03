import { scheduleUpdate } from '../batching'
import { isTracked } from '../derive'
import type { state as State } from '../index'
import { PluginAction, type ProxyObject, type RootState } from '../types'

// Augments an array with elements connected to parent.
export function list<T extends object, K>(template: (value: K) => T, initialValues: K[] = []) {
  type ExtendedInstance = { remove: () => void }
  type ExtendedList<A> = {
    add: (value: A) => void
    replace: (values: A[]) => void
    size: number
    byId: (id: number) => T
    _leaf: true
    _register: (receiver: any, property: string) => void
  }
  type InstancePartial<A> = A & Partial<ExtendedInstance>
  type Instance<A> = RootState<A & ExtendedInstance, any>

  function extendInstance(instance: InstancePartial<T>, data: InstancePartial<T>[] & Partial<ExtendedList<K>>) {
    instance.remove = function remove() {
      const indexToRemove = data.indexOf(instance)
      if (indexToRemove !== -1) {
        data.splice(indexToRemove, 1)
      }
    }
    return instance
  }

  function initializer(state: typeof State) {
    const location = {} as { receiver: ProxyObject; property: string }
    const holder = [] as K[]

    function registerChange(value: any) {
      isTracked(location.receiver, location.property)
      scheduleUpdate({
        type: PluginAction.Set,
        target: location.receiver,
        initial: true,
        property: location.property,
        parent: location.receiver,
        value,
        previousValue: holder,
        leaf: true,
      })
    }
    return {
      data: holder,
      location,
      after: function createList(data: InstancePartial<T>[] & Partial<ExtendedList<K>>) {
        data.push(...initialValues.map((item) => extendInstance(state(template(item)), data)))
        data.add = (value: K) => {
          const newInstance = extendInstance(state(template(value)), data)
          data.push(newInstance)
          registerChange(value) // NOTE the exact value passed is relevant.
        }
        data.replace = (values: K[]) => {
          const instances = values.map((value) => extendInstance(state(template(value)), data))
          data.splice(0, data.length, ...instances) // Inline replace array elements.
          registerChange(values)
        }
        data.byId = (id: number) => {
          // @ts-ignore Id must be present on the object to use this.
          return data.find((item) => typeof item === 'object' && item.id === id) as T
        }
        data._leaf = true // Mark list itself as leaf for tracking.
        data._register = (receiver: ProxyObject, property: string) => {
          location.receiver = receiver
          location.property = property
        }
        Object.defineProperty(data, 'size', {
          get() {
            return data.length
          },
        })
      },
    }
  }

  // Will later be picked up by state() call.
  initializer.requiresInitialization = true

  // ALTERNATIVE: return initializer as unknown as ExtendedList<Instance<T>, T>
  // Errors with private type cannot be exported...
  // interface ExtendedList<A, B> extends Array<A> {
  //   add: (value: B) => void
  //   replace: (values: B[]) => void
  //   size: number
  // }

  // Only resulting type will be exposed outwardly.
  return initializer as unknown as Instance<T>[] & ExtendedList<K>
}
