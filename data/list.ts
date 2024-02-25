import type { state as State } from '../index'
import { RootState } from '../types'

// Augments an array with elements connected to parent.
export function list<T extends object, K>(template: (value: K) => T, initialValues: K[] = []) {
  type ExtendedInstance = { remove: () => void }
  type ExtendedList<A> = { add: (value: A) => void; replace: (values: A[]) => void; size: number }
  type InstancePartial<A> = A & Partial<ExtendedInstance>
  type Instance<A> = RootState<A & ExtendedInstance, any>

  function extendInstance(
    instance: InstancePartial<T>,
    data: InstancePartial<T>[] & Partial<ExtendedList<K>>,
  ) {
    instance.remove = function remove() {
      const indexToRemove = data.indexOf(instance)
      if (indexToRemove !== -1) {
        data.splice(indexToRemove, 1)
      }
    }
    return instance
  }

  function initializer(state: typeof State) {
    return {
      data: [],
      after: function createList(data: InstancePartial<T>[] & Partial<ExtendedList<K>>) {
        data.push(...initialValues.map((item) => extendInstance(state(template(item)), data)))
        data.add = (value: K) => {
          const newInstance = extendInstance(state(template(value)), data)
          data.push(newInstance)
        }
        data.replace = (values: K[]) => {
          const instances = values.map((value) => extendInstance(state(template(value)), data))
          data.splice(0, data.length, ...instances) // Inline replace array elements.
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
