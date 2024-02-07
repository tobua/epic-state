import { Mock, expect, test, vi } from 'vitest'
import { state, type Plugin } from '../index'

const createLogPlugin = (mock: Mock) =>
  ((...configuration) => {
    let properties: string[]
    const traps = {
      get: (property: string) => {
        if (!properties || (properties ?? []).includes(property)) {
          mock('get', property)
        }
      },
      set: (property: string, value: any) => {
        if (!properties || (properties ?? []).includes(property)) {
          mock('set', property, value)
        }
      },
    }

    if (configuration[0] === 'initialize') {
      mock('initialize')
      return traps
    }

    // TODO make sure properties is always initialized and only push.
    properties = configuration

    const initializePlugin = () => {
      mock('initialize')
      return traps
    }

    return initializePlugin
  }) as Plugin<string[]>

test('Can create a plugin.', () => {
  const logMock = vi.fn()
  const myLogPlugin = createLogPlugin(logMock)
  // Configuration
  const configured = myLogPlugin('count')
  const configuredMultiple = myLogPlugin('count', 'page')
  // @ts-expect-error Invalid parameter.
  myLogPlugin(123)

  expect(typeof configured).toBe('function')
  expect(typeof configuredMultiple).toBe('function')

  // Initialization
  const initializedEmpty = myLogPlugin('initialize')
  // @ts-expect-error
  const initializedConfigured = configuredMultiple('initialize')

  expect(typeof initializedEmpty).toBe('object')
  // @ts-expect-error Cannot be inferred properly and is only relevant internally.
  expect(typeof initializedEmpty.get).toBe('function')
  expect(typeof initializedConfigured).toBe('object')
  expect(typeof initializedConfigured.get).toBe('function')
})

test('Can pass one or more plugins to the state.', () => {
  const logMock = vi.fn()
  const myLogPlugin = createLogPlugin(logMock)

  const root = state({ count: 1, plugin: myLogPlugin })

  // @ts-expect-error Plugin not accessible anymore.
  expect(root.plugin).toBe(undefined)
  expect(logMock.mock.calls.length).toBe(1)

  root.count = 2

  expect(logMock.mock.calls.length).toBe(2)

  const rootMultiple = state({
    tracked: 1,
    untracked: 2,
    plugin: [myLogPlugin('tracked'), myLogPlugin],
  })

  // @ts-expect-error Plugin not accessible anymore.
  expect(rootMultiple.plugin).toBe(undefined)
  expect(logMock.mock.calls.length).toBe(4) // 2 times initialize.

  rootMultiple.tracked = 2

  expect(logMock.mock.calls.length).toBe(6)

  rootMultiple.untracked = 3 // Only calls second plugin instance.

  expect(logMock.mock.calls.length).toBe(7)
})

test('Can pass plugin at every stage during initialization.', () => {
  const logMock = vi.fn()
  const myLogPlugin = createLogPlugin(logMock)
  const root = state({ count: 1, nested: { count: 2, plugin: myLogPlugin } })

  // @ts-expect-error Plugin not accessible anymore.
  expect(root.nested.plugin).toBe(undefined)
  expect(logMock).toHaveBeenCalled()

  expect(() => {
    // @ts-expect-error Results in warning.
    root.plugin = () => {}
  }).toThrow()

  expect(() => {
    // @ts-expect-error Results in warning.
    root.nested.plugin = () => {}
  }).toThrow()
})

test('Plugins are initialized and traps accessed.', () => {
  const logMock = vi.fn()
  const myLogPlugin = createLogPlugin(logMock)

  const root = state({ count: 1, plugin: myLogPlugin })

  // @ts-expect-error Plugin not accessible anymore.
  expect(root.plugin).toBe(undefined)
  expect(logMock).toHaveBeenCalled()
  expect(logMock.mock.calls.length).toBe(1)

  root.count = 2

  expect(logMock.mock.calls.length).toBe(2)

  expect(logMock.mock.calls[1]).toEqual(['set', 'count', 2])

  const readCount = root.count

  expect(readCount).toBe(2)
  expect(logMock.mock.calls.length).toBe(3)
  expect(logMock.mock.calls[2]).toEqual(['get', 'count'])
})

test('Plugins also receive updates from nested states.', () => {
  const logMock = vi.fn()
  const myLogPlugin = createLogPlugin(logMock)

  const root = state({ count: 1, plugin: myLogPlugin })

  // @ts-expect-error Plugin not accessible anymore.
  expect(root.plugin).toBe(undefined)
  expect(logMock).toHaveBeenCalled()
  expect(logMock.mock.calls.length).toBe(1)

  root.count = 2

  expect(logMock.mock.calls.length).toBe(2)

  expect(logMock.mock.calls[1]).toEqual(['set', 'count', 2])

  const readCount = root.count

  expect(readCount).toBe(2)
  expect(logMock.mock.calls.length).toBe(3)
  expect(logMock.mock.calls[2]).toEqual(['get', 'count'])
})
