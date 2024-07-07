import './setup-dom'
import { expect, test } from 'bun:test'
import { render, serializeElement } from 'epic-jsx/test'
import { plugin, state } from '../index'
import { connect } from '../plugin/epic-jsx'

test('Component will rerender on state updates.', () => {
  const root = state({ count: 1 })

  expect(root.count).toBe(1)

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
