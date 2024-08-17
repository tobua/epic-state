import './setup-dom'
import { type Mock, expect, mock, test } from 'bun:test'
import { type PluginActions, type Property, batch, state } from '../index'

global.stateDisableBatching = false

const createLogPlugin =
  (currentMock: Mock<any>) =>
  (...configuration: Property[] | ['initialize']) => {
    const filterProperties: Property[] | undefined = configuration[0] !== 'initialize' ? configuration : undefined
    const traps = {
      get: ({ property }) => {
        if (!filterProperties || filterProperties.includes(property)) {
          currentMock('get', property)
        }
      },
      set: ({ property, value }) => {
        if (!filterProperties || filterProperties.includes(property)) {
          currentMock('set', property, value)
        }
      },
    } as PluginActions

    if (configuration[0] === 'initialize') {
      return traps
    }

    return () => {
      return traps
    }
  }

test('Multiple immediate state changes are batched together.', () => {
  const logMock = mock()
  const myLogPlugin = createLogPlugin(logMock)

  const root = state({ count: 1, nested: { count: 2 }, plugin: myLogPlugin })

  expect(logMock.mock.calls.length).toBe(0)

  root.count = 2
  root.count = 3

  batch()

  expect(logMock.mock.calls.length).toBe(1)

  root.count = 4
  root.nested.count = 3

  batch()

  expect(logMock.mock.calls.length).toBe(3)
})
