import { Mock, expect, test, vi } from 'vitest'
import { state, type Plugin } from '../index'

const createLogPlugin = (mock: Mock) =>
  ((...configuration) => {
    let properties: string[]
    if (configuration[0] === 'initialize')
      return {
        get: (property: string) => mock('get', properties.includes(property)),
      }

    // TODO make sure properties is always initialized and only push.
    properties = configuration

    const initializePlugin = () => ({
      get: (property: string) => mock('get', properties.includes(property)),
    })

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
  expect(logMock).not.toHaveBeenCalled()

  // root.count = 2

  // expect(logMock).toHaveBeenCalled()

  const rootMultiple = state({ count: 2, plugin: [myLogPlugin('count'), myLogPlugin] })

  // @ts-expect-error Plugin not accessible anymore.
  expect(rootMultiple.plugin).toBe(undefined)
  expect(logMock).not.toHaveBeenCalled()
})

test('Can pass plugin at every stage during initialization.', () => {
  const logMock = vi.fn()
  const myLogPlugin = createLogPlugin(logMock)
  const root = state({ count: 1, nested: { count: 2, plugin: myLogPlugin } })

  // @ts-expect-error Plugin not accessible anymore.
  expect(root.nested.plugin).toBe(undefined)
  expect(logMock).not.toHaveBeenCalled()

  expect(() => {
    // @ts-expect-error Results in warning.
    root.plugin = () => {}
  }).toThrow()

  expect(() => {
    // @ts-expect-error Results in warning.
    root.nested.plugin = () => {}
  }).toThrow()
})
