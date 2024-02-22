import { expect, test, mock } from 'bun:test'
import { state, run } from '../index'

test('Object with values is converted to a proxy and state can be changed.', () => {
  const root = state({
    count: 1,
    outsideCount: 2,
    nested: {
      anotherCount: 3,
    },
    increment() {
      root.count += 1
    },
  })

  const handler = () => root.count * 2 + root.nested.anotherCount
  const runMock = mock(handler)

  const unregister = run(runMock)

  expect(runMock).toHaveBeenCalledTimes(1) // Runs once initially.
  expect(runMock.mock.calls[0].length).toBe(0)

  root.increment()

  expect(runMock).toHaveBeenCalledTimes(2)

  root.count += 1

  expect(runMock).toHaveBeenCalledTimes(3)

  root.count = 3 // Remains unchanged.

  expect(runMock).toHaveBeenCalledTimes(3)

  root.outsideCount = 3 // Not accessed in handler.

  expect(runMock).toHaveBeenCalledTimes(3)

  root.nested.anotherCount = 4 // Observed value.

  expect(runMock).toHaveBeenCalledTimes(4)

  // @ts-expect-error TODO allow passing options to state for which values can be deleted.
  delete root.count

  expect(runMock).toHaveBeenCalledTimes(5)

  unregister()
})
