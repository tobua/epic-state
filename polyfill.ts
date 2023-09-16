import { state } from './index'

type KeyValRecord<K, V> = [key: K, value: V]

type InternalProxyMap<K, V> = Map<K, V> & {
  data: KeyValRecord<K, V>[]
  toJSON: object
}

export function proxyMap<K, V>(entries?: Iterable<readonly [K, V]> | null): Map<K, V> {
  // Separate object referenced in methods, as type inference with this didn't work properly.
  const proxy = {
    data: Array.from(entries || []) as KeyValRecord<K, V>[],
    has(key) {
      return proxy.data.some((p) => p[0] === key)
    },
    set(key, value) {
      const record = proxy.data.find((p) => p[0] === key)
      if (record) {
        record[1] = value
      } else {
        proxy.data.push([key, value])
      }
      return this
    },
    get(key) {
      return proxy.data.find((p) => p[0] === key)?.[1]
    },
    delete(key) {
      const index = proxy.data.findIndex((p) => p[0] === key)
      if (index === -1) {
        return false
      }
      proxy.data.splice(index, 1)
      return true
    },
    clear() {
      proxy.data.splice(0)
    },
    get size() {
      return proxy.data.length
    },
    toJSON() {
      return new Map(proxy.data)
    },
    forEach(cb) {
      proxy.data.forEach((p) => {
        cb(p[1], p[0], this)
      })
    },
    keys() {
      return proxy.data.map((p) => p[0]).values()
    },
    values() {
      return proxy.data.map((p) => p[1]).values()
    },
    entries() {
      return new Map(proxy.data).entries()
    },
    get [Symbol.toStringTag]() {
      return 'Map'
    },
    [Symbol.iterator]() {
      return proxy.entries()
    },
  }

  const map: InternalProxyMap<K, V> = state(proxy)

  Object.defineProperties(map, {
    data: {
      enumerable: false,
    },
    size: {
      enumerable: false,
    },
    toJSON: {
      enumerable: false,
    },
  })
  Object.seal(map)

  return map as Map<K, V>
}

// properties that we don't want to expose to the end-user
type InternalProxySet<T> = Set<T> & {
  data: T[]
  toJSON: object
}

export function proxySet<T>(initialValues?: Iterable<T> | null): Set<T> {
  const proxy = {
    data: Array.from(new Set(initialValues)),
    has(value) {
      return proxy.data.indexOf(value) !== -1
    },
    add(value) {
      let hasProxy = false
      if (typeof value === 'object' && value !== null) {
        hasProxy = proxy.data.indexOf(state(value as T & object)) !== -1
      }
      if (proxy.data.indexOf(value) === -1 && !hasProxy) {
        proxy.data.push(value)
      }
      return this
    },
    delete(value) {
      const index = proxy.data.indexOf(value)
      if (index === -1) {
        return false
      }
      proxy.data.splice(index, 1)
      return true
    },
    clear() {
      proxy.data.splice(0)
    },
    get size() {
      return proxy.data.length
    },
    forEach(cb) {
      proxy.data.forEach((value) => {
        cb(value, value, this)
      })
    },
    get [Symbol.toStringTag]() {
      return 'Set'
    },
    toJSON() {
      return new Set(proxy.data)
    },
    [Symbol.iterator]() {
      return proxy.data[Symbol.iterator]()
    },
    values() {
      return proxy.data.values()
    },
    keys() {
      // for Set.keys is an alias for Set.values()
      return proxy.data.values()
    },
    entries() {
      // array.entries returns [index, value] while Set [value, value]
      return new Set(proxy.data).entries()
    },
  }

  const set: InternalProxySet<T> = state(proxy)

  Object.defineProperties(set, {
    data: {
      enumerable: false,
    },
    size: {
      enumerable: false,
    },
    toJSON: {
      enumerable: false,
    },
  })

  Object.seal(set)

  return set as Set<T>
}
