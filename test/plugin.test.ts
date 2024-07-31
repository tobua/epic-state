import './setup-dom'
import { type Mock, expect, mock, test } from 'bun:test'
import { type Plugin, plugin, state } from '../index'

global.stateDisableBatching = true

const createLogPlugin =
  (currentMock: Mock<any>) =>
  (...configuration: string[] | ['initialize']): Plugin<string[]> => {
    const filterProperties: string[] | undefined = configuration[0] !== 'initialize' ? configuration : undefined
    const traps = {
      get: (property: string) => {
        if (!filterProperties || filterProperties.includes(property)) {
          currentMock('get', property)
        }
      },
      set: (property: string, _parent: object, value: any) => {
        if (!filterProperties || filterProperties.includes(property)) {
          currentMock('set', property, value)
        }
      },
    }

    if (configuration[0] === 'initialize') {
      currentMock('initialize')
      return traps
    }

    return () => {
      currentMock('initialize')
      return traps
    }
  }

test('Can create a plugin.', () => {
  const logMock = mock()
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
  const logMock = mock()
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
  const logMock = mock()
  const myLogPlugin = createLogPlugin(logMock)
  const root = state({ count: 1, nested: { count: 2, plugin: myLogPlugin } })

  // @ts-expect-error Plugin not accessible anymore.
  expect(root.nested.plugin).toBe(undefined)
  expect(logMock).toHaveBeenCalled()

  expect(() => {
    // @ts-expect-error Results in warning.
    root.plugin = () => null
  }).toThrow()

  expect(() => {
    // @ts-expect-error Results in warning.
    root.nested.plugin = () => null
  }).toThrow()
})

test('Plugins are initialized and traps accessed.', () => {
  const logMock = mock()
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
  const logMock = mock()
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

test('Plugins can be globally registered and will apply to any state.', () => {
  const logMock = mock()
  const myLogPlugin = {
    // TODO pass reference to accessed state also.
    get: (property: string) => {
      logMock('get', property)
    },
    set: (property: string, _parent: object, value: any) => {
      logMock('set', property, value)
    },
  }

  plugin(myLogPlugin)

  const root = state({ count: 1, nested: { count: 2 } })
  const secondRoot = state({ count: 3 })

  expect(logMock).not.toHaveBeenCalled()
  expect(logMock.mock.calls.length).toBe(0)

  expect(root.count).toBe(1)

  expect(logMock.mock.calls.length).toBe(1)
  expect(logMock.mock.calls[0]).toEqual(['get', 'count'])

  root.count = 2

  expect(logMock.mock.calls.length).toBe(2)
  expect(logMock.mock.calls[1]).toEqual(['set', 'count', 2])

  expect(root.nested.count).toBe(2)
  expect(logMock.mock.calls.length).toBe(3)
  expect(logMock.mock.calls[2]).toEqual(['get', 'count'])

  expect(secondRoot.count).toBe(3)

  expect(logMock.mock.calls.length).toBe(4)
  expect(logMock.mock.calls[3]).toEqual(['get', 'count'])
})

test('Plugins will be inherited by nested objects.', () => {
  const logMock = mock()
  const myLogPlugin = createLogPlugin(logMock)

  const root = state({ count: 1, plugin: myLogPlugin, nested: { count: 2 } })

  // @ts-expect-error Plugin not accessible anymore.
  expect(root.plugin).toBe(undefined)
  expect(logMock.mock.calls.length).toBe(1)

  root.count = 2
  root.nested.count = 4

  expect(logMock.mock.calls.length).toBe(3)
  expect(logMock.mock.calls[1][0]).toBe('set')
  expect(logMock.mock.calls[1][1]).toBe('count')
  expect(logMock.mock.calls[1][2]).toBe(2)
  expect(logMock.mock.calls[2][0]).toBe('set')
  expect(logMock.mock.calls[2][1]).toBe('count')
  expect(logMock.mock.calls[2][2]).toBe(4)
})

test('Log plugin will filter by properties.', () => {
  const logMock = mock()
  const myLogPlugin = createLogPlugin(logMock)('in')

  const root = state({ in: 1, out: 2, plugin: myLogPlugin })

  expect(logMock.mock.calls.length).toBe(1)
  root.out = 3
  expect(logMock.mock.calls.length).toBe(1)
  root.in = 2
  expect(logMock.mock.calls.length).toBe(2)
  expect(root.in).toBe(2)
  expect(root.out).toBe(3)
})
