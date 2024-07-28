import '../setup-dom'
import { beforeEach, expect, test } from 'bun:test'
import { render, serializeElement } from 'epic-jsx/test'
import { batch, plugin, removeAllPlugins, state } from '../../index'
import { connect } from '../../plugin/epic-jsx'

global.stateDisableBatching = false

document.body.innerHTML = '' // Necessary when running whole suite.

beforeEach(() => {
  removeAllPlugins()
})

test('Combinations of variously stacked components will not be rendered more than necessary.', async () => {
  plugin(connect)

  let renderCount = 0
  const root = state({
    count: 1,
    // TODO this self-reference will cause type issues in strict mode.
    get double() {
      return root.count * 2
    },
    increment() {
      this.count += 1
    },
  })

  function Counter() {
    renderCount += 1
    return (
      <p>
        count: {root.count} {root.double}
      </p>
    )
  }
  const { serialized } = render(<Counter />)

  expect(serialized).toEqual('<body><p>count: 1 2</p></body>')
  expect(renderCount).toBe(1)

  root.count = 2
  root.increment()
  batch()

  expect(serializeElement()).toEqual('<body><p>count: 3 6</p></body>')
  // No unnecessary rerenders due to batching.
  expect(renderCount).toBe(2)

  root.count = 3 // Ignored as value the same
  batch()

  expect(serializeElement()).toEqual('<body><p>count: 3 6</p></body>')
  expect(renderCount).toBe(2)

  root.increment()
  batch()

  expect(serializeElement()).toEqual('<body><p>count: 4 8</p></body>')
  expect(renderCount).toBe(3)
})
