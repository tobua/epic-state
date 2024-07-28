import { expect, mock, test } from 'bun:test'
import { type RootState, observe, state } from '../index'
import { process } from './helper'

global.stateDisableBatching = true

test('Can navigate through state tree using the parent property.', async () => {
  const subscribeMock = mock()
  const initialObject = {
    id: 1,
    nested: { id: 2, nested: { id: 3 } },
    alsoNested: { id: 4 },
    list: [1, 2],
  }
  // Custom properties are only accessible when typed accordinly to avoid confusion when working with regular state.
  const root = state(initialObject) as RootState<typeof initialObject, typeof initialObject>

  observe(subscribeMock, root)

  expect(root.id).toBe(1)
  // @ts-expect-error
  expect(root.parent).toBe(undefined)

  const nestedParent = root.nested.parent
  expect(nestedParent.id).toBe(1)
  // @ts-expect-error
  expect(nestedParent.missing).toBe(undefined)

  await process()

  expect(subscribeMock.mock.calls.length).toBe(1)
  expect(subscribeMock.mock.calls[0][0].length).toBe(4)

  expect(subscribeMock.mock.calls[0][0][2][1]).toEqual(['id'])
  expect(subscribeMock.mock.calls[0][0][3][1]).toEqual(['missing'])

  expect(root.nested.nested.parent.parent.id).toBe(1)
  expect(root.nested.nested.parent.id).toBe(2)
  expect(root.nested.nested.parent.parent.nested.nested.id).toBe(3)

  // Arrays are also proxied.
  expect(root.list.parent.list[1]).toBe(2)
})

test('Root property attached to any state object pointing to the root state.', () => {
  const initialObject = {
    id: 1,
    nested: { id: 2, nested: { id: 3 } },
    alsoNested: { id: 4 },
    list: [1, 2],
    map: new Map<string, string>([['hello', 'world']]),
    set: new Set(['hello', 'world']),
  }
  const root = state(initialObject) as RootState<typeof initialObject, typeof initialObject>

  // @ts-expect-error
  expect(root.root).toBe(undefined)
  // @ts-expect-error
  expect(root.parent).toBe(undefined)

  const nestedRoot = root.nested.root
  expect(nestedRoot.id).toBe(1)
  // @ts-expect-error
  expect(nestedRoot.missing).toBe(undefined)

  expect(root.nested.nested.root.id).toBe(1)
  expect(root.nested.nested.root.nested.nested.id).toBe(3)

  // Special objects are also proxied.
  expect(root.list.root.list[1]).toBe(2)
  expect(root.map.root.id).toBe(1)
  expect(root.set.root.id).toBe(1)
})

// TODO test is children of arrays and sets on root or deeper also have parent (currently no).
