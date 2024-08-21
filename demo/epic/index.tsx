import { render } from 'epic-jsx'
import { plugin, state } from 'epic-state'
import { connect } from 'epic-state/connect'
import { Exmpl } from 'exmpl'

plugin(connect) // Register global connect plugin for epic-jsx.

const root = state({
  count: 1,
  get double() {
    return root.count * 2
  },
  increment: () => {
    root.count += 1
  },
})

function App() {
  return (
    <button
      type="button"
      style={{
        outline: 'none',
        border: 'none',
        padding: 20,
        background: '#FF002E',
        color: 'white',
        fontSize: '200%',
        borderRadius: 20,
        cursor: 'pointer',
      }}
      onClick={root.increment}
    >
      Increment {root.count} {root.double}
    </button>
  )
}

render(
  <Exmpl title="epic-state Demo" npm="epic-state" github="tobua/epic-state">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <App />
      <p>
        Uses <span style={{ fontWeight: 'bold' }}>epic-jsx</span> for rendering.
      </p>
    </div>
  </Exmpl>,
)
