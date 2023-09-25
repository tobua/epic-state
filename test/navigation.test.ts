import { expect, test, vi } from 'vitest'
import { observe, state } from '../index'

const process = () =>
  new Promise((done) => {
    setTimeout(done, 1)
  })

test('Can navigate through state tree using the parent property.', async () => {
  const subscribeMock = vi.fn()
  const root = state({
    id: 1,
    nested: { id: 2, nested: { id: 3 } },
    alsoNested: { id: 4 },
    list: [1, 2],
  })

  observe(root, subscribeMock)

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
  expect(root.nested.nested.parent.parent.nested.nested.id).toBe(3)

  // Arrays are also proxied.
  expect(root.list.parent.list[1]).toBe(2)
})

// TODO test is children of arrays and sets on root or deeper also have parent (currently no).
