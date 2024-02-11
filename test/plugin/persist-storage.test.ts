// @vitest-environment happy-dom

import { afterEach, expect, test } from 'vitest'
import { state } from '../../index'
import { persistStorage } from '../../plugin/persist/browser'

afterEach(() => {
  window.localStorage.clear()
})

test('Initial state is added to the storage.', () => {
  const root = state({ count: 1, plugin: persistStorage({ id: 'basic', properties: ['count'] }) })
  const identifier = 'epic-state-basic'

  expect(root.count).toBe(1)

  let data = JSON.parse(window.localStorage.getItem(identifier) ?? '{}')
  expect(data.count).toBe(1)
  expect(Object.keys(data).length).toBe(1)

  root.count = 2

  data = JSON.parse(window.localStorage.getItem(identifier) ?? '{}')
  expect(data.count).toBe(2)
  expect(Object.keys(data).length).toBe(1)
})

test('Initial state is added to the URL.', () => {
  const root = state({
    count: 1,
    notPersisted: 2,
    persisted: 3,
    plugin: persistStorage({ id: 'extended', properties: ['count', 'persisted'] }),
  })
  const identifier = 'epic-state-extended'

  expect(root.count).toBe(1)
  expect(root.notPersisted).toBe(2)
  expect(root.persisted).toBe(3)

  let data = JSON.parse(window.localStorage.getItem(identifier) ?? '{}')
  expect(data.count).toBe(1)
  expect(data.persisted).toBe(3)
  expect(Object.keys(data)).toEqual(['count', 'persisted'])

  root.persisted = 6
  root.notPersisted = 7

  data = JSON.parse(window.localStorage.getItem(identifier) ?? '{}')
  expect(data.count).toBe(1)
  expect(data.notPersisted).toBe(undefined)
  expect(data.persisted).toBe(6)
  expect(Object.keys(data)).toEqual(['count', 'persisted'])
})

test('Initial state is added to the storage.', () => {
  const identifier = 'epic-state-load'
  window.localStorage.setItem(identifier, '{"available": 3}')
  const root = state({
    available: 2,
    missing: 3,
    plugin: persistStorage({ id: 'load', properties: ['available', 'missing'] }),
  })

  expect(root.available).toBe(3)
  expect(root.missing).toBe(3)

  let data = JSON.parse(window.localStorage.getItem(identifier) ?? '{}')
  expect(data.available).toBe(3)
  expect(data.missing).toBe(3)
  expect(Object.keys(data)).toEqual(['available', 'missing'])

  root.available = 4
  root.missing = 4

  data = JSON.parse(window.localStorage.getItem(identifier) ?? '{}')
  expect(data.available).toBe(4)
  expect(data.missing).toBe(4)
  expect(Object.keys(data)).toEqual(['available', 'missing'])
})
