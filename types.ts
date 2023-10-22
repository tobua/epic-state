export type AnyFunction = (...args: any[]) => any

export type AsRef = { $$valtioRef: true }

export type ProxyObject = object & { root?: ProxyObject; parent?: ProxyObject }

export type Path = (string | symbol)[]

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

export type CreateSnapshot = <T extends object>(
  target: T,
  version: number,
  handlePromise?: HandlePromise,
) => T

export type RemoveListener = () => void
export type AddListener = (listener: Listener) => RemoveListener

export type ProxyState = readonly [
  target: object,
  ensureVersion: (nextCheckVersion?: number) => number,
  createSnapshot: CreateSnapshot,
  addListener: AddListener,
]

type ArrayElementType<E> = E extends (infer U)[] ? U : never
type SetElementType<E> = E extends Set<infer U> ? U : never
type MapElementType<E> = E extends Map<infer U, infer V> ? [U, V] : never

type ArrayWithParent<T, P, R> = {
  parent: P
  root: R
} & Array<T>

type SetWithParent<T, P, R> = {
  parent: P
  root: R
} & Set<T>

type MapWithParent<T, S, P, R> = {
  parent: P
  root: R
} & Map<T, S>

type ChildState<E, P, R> = E extends object
  ? {
      parent: P
      root: R
    } & (E extends Array<any>
      ? ArrayWithParent<ArrayElementType<E>, P, R>
      : E extends Set<any>
      ? SetWithParent<SetElementType<E>, P, R>
      : E extends Map<any, any>
      ? MapWithParent<MapElementType<E>[0], MapElementType<E>[1], P, R>
      : {
          [F in keyof Omit<E, 'plugin'>]: E[F] extends object
            ? ChildState<E[F], ChildState<E, P, R>, R>
            : E[F]
        })
  : E

export type RootState<T, R> = T extends Set<any>
  ? Set<SetElementType<T>>
  : {
      [K in keyof Omit<T, 'plugin'>]: ChildState<T[K], T, R extends unknown ? T : R>
    }

export type PluginTraps = {
  get?: (property: string) => void
  set?: (property: string) => void
}

export type Plugin<T extends any[]> = (...configuration: T) => Plugin<['initialize']> | PluginTraps
