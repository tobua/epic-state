import '../setup-dom'
import { beforeEach, expect, test } from 'bun:test'
import { render, serializeElement } from 'epic-jsx/test'
import { plugin, removeAllPlugins, state } from '../../index'
import { connect } from '../../plugin/epic-jsx'

global.stateDisableBatching = true

document.body.innerHTML = '' // Necessary when running whole suite.

beforeEach(() => {
  removeAllPlugins()
})

test('Derived values will receive updated values in connected rendering methods.', async () => {
  plugin(connect)

  let renderCount = 0
  const root = state({
    count: 1,
    get double() {
      return root.count * 2
    },
    increment() {
      this.count += 1
    },
  })

  function Counter() {
    renderCount += 1
    return <p>count: {root.double}</p>
  }
  const { serialized } = render(<Counter />)

  expect(serialized).toEqual('<body><p>count: 2</p></body>')
  expect(renderCount).toBe(1)

  root.increment()

  expect(renderCount).toBe(2)

  expect(serializeElement()).toEqual('<body><p>count: 4</p></body>')
  expect(renderCount).toBe(2)

  root.count = 3 // Ignored as value the same

  expect(serializeElement()).toEqual('<body><p>count: 6</p></body>')
  expect(renderCount).toBe(3)

  root.increment()

  expect(serializeElement()).toEqual('<body><p>count: 8</p></body>')
  expect(renderCount).toBe(4)
})

test('Component will rerender on state updates.', async () => {
  const root = state({ count: 1 })

  plugin(connect)

  function App() {
    return (
      <button
        type="button"
        onClick={() => {
          root.count += 1
        }}
      >
        Increment {root.count}
      </button>
    )
  }

  const { serialized } = render(<App />)

  expect(serialized).toContain('Increment 1')

  root.count += 1

  expect(root.count).toBe(2)
  expect(serializeElement()).toContain('Increment 2')

  root.count = 123

  expect(serializeElement()).toContain('Increment 123')
  expect(root.count).toBe(123)
})

test('No unnecessary rerenders are happening when multiple values are tracked.', async () => {
  const root = state({ first: 1, second: 2 })
  let renderCount = 0

  plugin(connect)

  function App() {
    renderCount += 1
    return (
      <div>
        count: {root.first} {root.second}
      </div>
    )
  }

  const { serialized } = render(<App />)

  expect(serialized).toContain('count: 1 2')
  expect(renderCount).toBe(1)

  root.first += 1
  root.second += 1

  expect(serializeElement()).toContain('count: 2 3')
  expect(renderCount).toBe(3) // One render too many.

  root.first += 1
  root.second += 1

  expect(serializeElement()).toContain('count: 3 4')
  expect(renderCount).toBe(5)
})

test('Child components will always render after any parents.', async () => {
  const root = state({ count: 1, childCount: 1, countBoth: 1 })
  const renderCounts = { parent: 0, child: 0 }

  plugin(connect)

  function Child() {
    renderCounts.child += 1
    return (
      <p>
        child: {root.childCount} {root.countBoth}
      </p>
    )
  }

  function Parent() {
    renderCounts.parent += 1
    return (
      <div>
        parent: {root.count} {root.countBoth}
        <Child />
      </div>
    )
  }

  const { serialized } = render(<Parent />)

  expect(serialized).toContain('parent: 1')
  expect(serialized).toContain('child: 1')

  expect(renderCounts).toEqual({ parent: 1, child: 1 })

  root.count += 1

  let newMarkup = serializeElement()

  expect(newMarkup).toContain('parent: 2')
  expect(newMarkup).toContain('child: 1')

  expect(renderCounts).toEqual({ parent: 2, child: 2 }) // TODO no need for child to rerender.

  root.childCount += 1

  newMarkup = serializeElement()

  expect(newMarkup).toContain('parent: 2')
  expect(newMarkup).toContain('child: 2')

  expect(renderCounts).toEqual({ parent: 2, child: 3 })

  root.countBoth += 1

  newMarkup = serializeElement()

  expect(newMarkup).toContain('parent: 2 2')
  expect(newMarkup).toContain('child: 2 2')

  expect(renderCounts).toEqual({ parent: 3, child: 5 }) // TODO child should only add one (epic-jsx fix), rerender argument.
})
