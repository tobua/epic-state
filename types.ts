export type Value = any
export type Getter = () => Value
export type RerenderMethod = () => void
export type AnyFunction = (...args: any[]) => any
export type AsRef = { $$valtioRef: true }
export type ProxyObject = object & { root?: ProxyObject; parent?: ProxyObject }
export type Property = string | symbol
export type Path = Property[]

export type Operation =
  | [op: 'set', path: Path, value: unknown, prevValue: unknown]
  | [op: 'delete', path: Path, prevValue: unknown]
  | [op: 'resolve', path: Path, value: unknown]
  | [op: 'reject', path: Path, error: unknown]
  | [op: 'get', path: Path, value: unknown]

export type Listener = (operation: Operation, nextVersion: number) => void

export type Primitive = string | number | boolean | null | undefined | symbol | bigint

export type SnapshotIgnore =
  | Date
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>
  | AsRef
  | Error
  | RegExp
  | AnyFunction
  | Primitive

export type Snapshot<T> = T extends SnapshotIgnore
  ? T
  : T extends Promise<unknown>
    ? Awaited<T>
    : T extends object
      ? { readonly [K in keyof T]: Snapshot<T[K]> }
      : T

export type HandlePromise = <P extends Promise<any>>(promise: P) => Awaited<P>
export type RemoveListener = () => void
export type AddListener = (listener: Listener) => RemoveListener

export type ProxyState = readonly [target: object, ensureVersion: (nextCheckVersion?: number) => number, addListener: AddListener]

type ArrayElementType<E> = E extends (infer U)[] ? U : never
type SetElementType<E> = E extends Set<infer U> ? U : never
type MapElementType<E> = E extends Map<infer U, infer V> ? [U, V] : never

type ArrayWithParent<T, P, R> = {
  parent: P
  root: R
} & T[]

type SetWithParent<T, P, R> = {
  parent: P
  root: R
} & Set<T>

type MapWithParent<T, S, P, R> = {
  parent: P
  root: R
} & Map<T, S>

type ChildState<E, P, R> = E extends Function
  ? E
  : E extends object
    ? {
        parent: P
        root: R
      } & (E extends any[]
        ? ArrayWithParent<ArrayElementType<E>, P, R>
        : E extends Set<any>
          ? SetWithParent<SetElementType<E>, P, R>
          : E extends Map<any, any>
            ? MapWithParent<MapElementType<E>[0], MapElementType<E>[1], P, R>
            : {
                [F in keyof Omit<E, 'plugin'>]: E[F] extends object ? ChildState<E[F], ChildState<E, P, R>, R> : E[F]
              })
    : E

export type RootState<T, R> = T extends Set<any>
  ? Set<SetElementType<T>>
  : {
      [K in keyof Omit<T, 'plugin'>]: ChildState<T[K], T, R extends unknown ? T : R>
    }

export type PluginActions = {
  get?: (property: string, parent: object, value: any) => void
  set?: (property: string, parent: object, value: any, previousValue: any) => void
  delete?: (property: string, parent: object) => void
}

export type Plugin<T extends any[]> = ((...configuration: T) => Plugin<['initialize']>) | PluginActions

export type ObservedProperties = TupleArrayMap<object, string, RerenderMethod>

export class TupleArrayMap<A, B, C> {
  protected observedProperties: Map<A, Map<B, C[]>> = new Map()

  has(firstKey: A, secondKey: B): boolean {
    return !!(this.observedProperties.has(firstKey) && this.observedProperties.get(firstKey)?.has(secondKey))
  }

  get(firstKey: A, secondKey: B): C[] | undefined {
    return this.has(firstKey, secondKey) ? this.observedProperties.get(firstKey)?.get(secondKey) : undefined
  }

  add(firstKey: A, secondKey: B, value: C): void {
    if (!this.observedProperties.has(firstKey)) {
      this.observedProperties.set(firstKey, new Map<B, C[]>())
    }

    if (!this.observedProperties.get(firstKey)?.has(secondKey)) {
      this.observedProperties.get(firstKey)?.set(secondKey, [])
    }

    this.observedProperties.get(firstKey)?.get(secondKey)?.push(value)
  }

  delete(firstKey: A, secondKey: B): void {
    if (this.observedProperties.has(firstKey)) {
      const properties = this.observedProperties.get(firstKey)
      if (properties?.has(secondKey)) {
        properties.delete(secondKey)
      }
    }
  }

  clear() {
    this.observedProperties.clear()
  }
}
