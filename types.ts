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
