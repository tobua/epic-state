import { render } from 'epic-jsx'
import { plugin, state } from 'epic-state'
import { connect } from 'epic-state/connect'
import { Exmpl } from 'exmpl'

plugin(connect) // Register global connect plugin for epic-jsx.

const Button = ({ children, onClick }) => (
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
    onClick={onClick}
  >
    {children}
  </button>
)

function SharedCounter({ initial }: { initial: number }) {
  this.state = state({ count: initial })

  return (
    <Button
      onClick={() => {
        this.state.count += 1
      }}
    >
      {this.state.count}
    </Button>
  )
}

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
    <>
      <Button onClick={root.increment}>
        Increment {root.count} {root.double}
      </Button>
      <p>Shared component state</p>
      {/* TODO if you go from top-to-bottom incrementing only the first will work. */}
      <SharedCounter initial={1} />
      <SharedCounter initial={2} />
      <SharedCounter initial={3} />
    </>
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
