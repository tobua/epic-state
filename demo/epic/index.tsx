import { render } from 'epic-jsx'
import { plugin, state } from 'epic-state'
import { connect } from 'epic-state/connect'

plugin(connect) // Register global connect plugin for epic-jsx.

const root = state({
  count: 1,
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
      onClick={() => {
        root.count += 1
      }}
    >
      Increment {root.count}
    </button>
  )
}

render(<App />)