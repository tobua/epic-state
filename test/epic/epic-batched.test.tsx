import '../setup-dom'
import { beforeEach, expect, test } from 'bun:test'
import type { Component } from 'epic-jsx'
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

test('Component state is only initialized once.', () => {
  const Components = {}
  let initializationCount = 0
  const getState = (count: number) => ({
    count,
    empty: ++initializationCount,
  })

  plugin(connect)

  function Id(this: Component<ReturnType<typeof getState>>, { initial, ...props }) {
    this.state = state(() => getState(initial))
    Components[initial] = this
    // @ts-expect-error
    const notString: string = this.state.count
    return <p {...props}>{notString}</p>
  }

  function App(this: Component) {
    return (
      <div>
        <Id initial={1} />
        <Id initial={2} />
        <Id initial={3} />
      </div>
    )
  }

  const { serialized } = render(<App />)

  expect(serialized).toEqual('<body><div><p>1</p><p>2</p><p>3</p></div></body>')
  expect(initializationCount).toBe(3)

  Components[1].rerender()
  Components[2].rerender()
  Components[3].rerender()

  expect(serializeElement()).toEqual('<body><div><p>1</p><p>2</p><p>3</p></div></body>')
  expect(initializationCount).toBe(3)
})
