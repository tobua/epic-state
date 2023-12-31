// @vitest-environment happy-dom

import { afterEach, expect, test } from 'vitest'
import { state } from '../index'
import { persistUrl } from '../plugin/persist/browser'

interface ExtendedLocation extends Location {
  searchParams: URLSearchParams
}

const { location } = window as unknown as { location: ExtendedLocation }

afterEach(() => {
  // Reset URL after each test.
  window.location.href = 'http://localhost:3000'
})

test('Initial state is added to the URL.', () => {
  const root = state({ page: 1, plugin: persistUrl })

  expect(root.page).toBe(1)
  expect(location.searchParams.get('page')).toBe('1')
  expect(location.pathname).toBe('/')
})

test('Existing pathname remains.', () => {
  location.href = 'http://localhost:3000/nested/page'
  const root = state({ page: 1, plugin: persistUrl })

  expect(root.page).toBe(1)
  expect(location.searchParams.get('page')).toBe('1')
  expect(location.pathname).toBe('/nested/page')
})

test('Initial state is overridden with state from URL if property is found on the state.', () => {
  location.href = 'http://localhost:3000/nested/page?page=0&count=10&missing=gone'
  const root = state({ page: 1, count: undefined, plugin: persistUrl })

  expect(root.page).toBe(0)
  expect(root.count).toBe('10')
  // @ts-expect-error
  expect(root.missing).toBe(undefined)

  expect(location.searchParams.get('page')).toBe('0')
  expect(location.searchParams.get('count')).toBe('10')
  expect(location.searchParams.get('missing')).toBe('gone') // Existing URL parameters remain untouched.
})

test('State updates are reflected in the URL.', () => {
  const root = state({ page: 1, plugin: persistUrl })

  expect(location.searchParams.get('page')).toBe('1')

  root.page = 2

  expect(location.searchParams.get('page')).toBe('2')
})

test('Only top-level values are persisted.', () => {
  const root = state({
    page: 1,
    count: '2',
    active: true,
    nested: { count: 1 },
    map: [1, 'false'],
    plugin: persistUrl,
  })

  expect(root.page).toBe(1)
  expect(location.searchParams.get('page')).toBe('1')
  expect(location.pathname).toBe('/')

  // Includes only page and not nested.
  expect(location.searchParams.toString()).toBe('page=1&count=2&active=true')
})

test('Can configure which properties should be persisted.', () => {
  location.href = 'http://localhost:3000/?first=3&second=4'
  const root = state({ first: 1, second: 2, plugin: persistUrl('second') })

  expect(root.first).toBe(1)
  expect(root.second).toBe(4)

  expect(location.searchParams.get('first')).toBe('3') // Ignored parameter remains untouched.
  expect(location.searchParams.get('second')).toBe('4')

  root.first = 5
  root.second = 6

  expect(location.searchParams.get('first')).toBe('3')
  expect(location.searchParams.get('second')).toBe('6')
})
