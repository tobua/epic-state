import '../setup-dom'
import { beforeEach, expect, test } from 'bun:test'
import { state } from '../../index'
import { persistUrl } from '../../plugin/persist/browser'

interface ExtendedLocation extends Location {
  searchParams: URLSearchParams
}

const { location } = window as unknown as { location: ExtendedLocation }

beforeEach(() => {
  // Reset URL after each test.
  window.location.href = 'http://localhost:3000'
})

const searchParam = (name: string) => {
  const searchParams = new URLSearchParams(location.search)
  return searchParams.get(name)
}

test('Initial state is added to the URL.', () => {
  const root = state({ page: 1, plugin: persistUrl })

  expect(root.page).toBe(1)
  expect(searchParam('page')).toBe('1')
  expect(location.pathname).toBe('/')
})

test('Existing pathname remains.', () => {
  location.href = 'http://localhost:3000/nested/page'
  const root = state({ page: 1, plugin: persistUrl })

  expect(root.page).toBe(1)
  expect(searchParam('page')).toBe('1')
  expect(location.pathname).toBe('/nested/page')
})

test('Initial state is overridden with state from URL if property is found on the state.', () => {
  location.href = 'http://localhost:3000/nested/page?page=0&count=10&missing=gone'
  const initialObject = { page: 1, count: undefined, plugin: persistUrl }
  const root = state<Omit<typeof initialObject, 'count'> & { count?: string }>(initialObject)

  expect(root.page).toBe(0)
  expect(root.count).toBe('10')
  // @ts-expect-error
  expect(root.missing).toBe(undefined)

  expect(searchParam('page')).toBe('0')
  expect(searchParam('count')).toBe('10')
  expect(searchParam('missing')).toBe('gone') // Existing URL parameters remain untouched.
})

test('State updates are reflected in the URL.', () => {
  const root = state({ page: 1, plugin: persistUrl })

  expect(searchParam('page')).toBe('1')

  root.page = 2

  expect(searchParam('page')).toBe('2')
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
  expect(searchParam('page')).toBe('1')
  expect(location.pathname).toBe('/')

  // Includes only page and not nested.
  expect(location.search).toBe('?page=1&count=2&active=true')
})

test('Can configure which properties should be persisted.', () => {
  location.href = 'http://localhost:3000/?first=3&second=4'
  const root = state({ first: 1, second: 2, plugin: persistUrl('second') })

  expect(root.first).toBe(1)
  expect(root.second).toBe(4)

  expect(searchParam('first')).toBe('3') // Ignored parameter remains untouched.
  expect(searchParam('second')).toBe('4')

  root.first = 5
  root.second = 6

  expect(searchParam('first')).toBe('3')
  expect(searchParam('second')).toBe('6')
})

test('Can configure multiple properties to be persisted.', () => {
  location.href = 'http://localhost:3000/?first=3&second=4&third=5&fourth=6'
  const root = state({
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    plugin: persistUrl('second', 'fourth'),
  })

  expect(root.first).toBe(1)
  expect(root.second).toBe(4)
  expect(root.third).toBe(3)
  expect(root.fourth).toBe(6)

  expect(searchParam('first')).toBe('3') // Ignored parameter remains untouched.
  expect(searchParam('second')).toBe('4')
  expect(searchParam('third')).toBe('5')
  expect(searchParam('fourth')).toBe('6')

  root.first = 9
  root.second = 9
  root.third = 9
  root.fourth = 9

  expect(searchParam('first')).toBe('3')
  expect(searchParam('second')).toBe('9')
  expect(searchParam('third')).toBe('5')
  expect(searchParam('fourth')).toBe('9')
})
