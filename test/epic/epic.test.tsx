import '../setup-dom'
import { expect, test } from 'bun:test'
import { render, serializeElement } from 'epic-jsx/test'
import { plugin, removeAllPlugins, state } from '../../index'
import { connect } from '../../plugin/epic-jsx'

removeAllPlugins()

test('Getters will receive updated values in connected rendering methods.', async () => {
  plugin(connect)

  let renderCount = 0
  // @ts-expect-error TODO
  const root = state({
    count: 1,
    // @ts-expect-error TODO bind this to getters
    get double() {
      return root.count * 2
    },
    increment() {
      this.count += 1
    },
    // plugin: connect,
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

  expect(serializeElement()).toEqual('<body><p>count: 3 6</p></body>')
  // TODO unnecessary rerenders are happening.
  expect(renderCount).toBe(3)

  root.count = 3 // Ignored as value the same

  expect(serializeElement()).toEqual('<body><p>count: 3 6</p></body>')
  expect(renderCount).toBe(3)

  root.increment()

  expect(serializeElement()).toEqual('<body><p>count: 4 8</p></body>')
  expect(renderCount).toBe(4)
})