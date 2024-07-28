import { type Mock, expect, mock, test } from 'bun:test'
import { batch, state } from '../index'

// @ts-ignore Necessary to polyfill add not to fail.
global.window = {}
global.stateDisableBatching = false

const createLogPlugin =
  (currentMock: Mock<any>) =>
  (...configuration) => {
    let properties: string[]
    const traps = {
      get: (property: string) => {
        if (!properties || (properties ?? []).includes(property)) {
          currentMock('get', property)
        }
      },
      set: (property: string, _parent: object, value: any) => {
        if (!properties || (properties ?? []).includes(property)) {
          currentMock('set', property, value)
        }
      },
    }

    if (configuration[0] === 'initialize') {
      return traps
    }

    // TODO make sure properties is always initialized and only push.
    properties = configuration

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
