import { expect, mock, test } from 'bun:test'
import { run, state } from '../index'

global.stateDisableBatching = true

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

  // TODO allow passing options to state for which values can be deleted.
  delete root.count

  expect(runMock).toHaveBeenCalledTimes(5)

  unregister()
})

test('Properties with the same name are tracked independently.', () => {
  const root = state({
    first: {
      count: 1,
    },
    second: {
      count: 2,
    },
    nested: {
      third: {
        count: 3,
      },
      fourth: {
        count: 4,
      },
    },
  })

  const firstHandler = () => root.first.count * 2
  const secondHandler = () => root.second.count * 2
  const thirdHandler = () => root.nested.third.count * 2
  const fourthHandler = () => root.nested.fourth.count * 2

  const firstRunMock = mock(firstHandler)
  const secondRunMock = mock(secondHandler)
  const thirdRunMock = mock(thirdHandler)
  const fourthRunMock = mock(fourthHandler)

  const unregisterFirst = run(firstRunMock)
  const unregisterSecond = run(secondRunMock)
  const unregisterThird = run(thirdRunMock)
  const unregisterFourth = run(fourthRunMock)

  expect(firstRunMock).toHaveBeenCalledTimes(1)
  expect(secondRunMock).toHaveBeenCalledTimes(1)
  expect(thirdRunMock).toHaveBeenCalledTimes(1)
  expect(fourthRunMock).toHaveBeenCalledTimes(1)

  // Reads should have no effect.
  expect(root.first.count).toBe(1)
  expect(root.second.count).toBe(2)
  expect(root.nested.third.count).toBe(3)

  expect(firstRunMock).toHaveBeenCalledTimes(1)
  expect(secondRunMock).toHaveBeenCalledTimes(1)
  expect(thirdRunMock).toHaveBeenCalledTimes(1)
  expect(fourthRunMock).toHaveBeenCalledTimes(1)

  root.first.count = 5

  expect(firstRunMock).toHaveBeenCalledTimes(2)
  expect(secondRunMock).toHaveBeenCalledTimes(1)
  expect(thirdRunMock).toHaveBeenCalledTimes(1)
  expect(fourthRunMock).toHaveBeenCalledTimes(1)

  root.second.count = 6

  expect(firstRunMock).toHaveBeenCalledTimes(2)
  expect(secondRunMock).toHaveBeenCalledTimes(2)
  expect(thirdRunMock).toHaveBeenCalledTimes(1)
  expect(fourthRunMock).toHaveBeenCalledTimes(1)

  root.nested.third.count = 7

  expect(firstRunMock).toHaveBeenCalledTimes(2)
  expect(secondRunMock).toHaveBeenCalledTimes(2)
  expect(thirdRunMock).toHaveBeenCalledTimes(2)
  expect(fourthRunMock).toHaveBeenCalledTimes(1)

  root.nested.fourth.count = 8

  expect(firstRunMock).toHaveBeenCalledTimes(2)
  expect(secondRunMock).toHaveBeenCalledTimes(2)
  expect(thirdRunMock).toHaveBeenCalledTimes(2)
  expect(fourthRunMock).toHaveBeenCalledTimes(2)

  unregisterFirst()
  unregisterSecond()
  unregisterThird()
  unregisterFourth()
})
