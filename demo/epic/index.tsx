import { render } from 'epic-jsx'
import { list, plugin, set, state } from 'epic-state'
import { connect } from 'epic-state/connect'
import { Exmpl } from 'exmpl'

plugin(connect) // Register global connect plugin for epic-jsx.

const State = state({
  count: 1,
  get double() {
    return State.count * 2
  },
  increment: () => {
    State.count += 1
  },
  items: list((value: { name: string }) => value, []),
})

const Button = ({ children, onClick }) => (
  <button
    type="button"
    style={{
      outline: 'none',
      border: 'none',
      padding: 5,
      background: '#FF002E',
      color: 'white',
      fontSize: '120%',
      borderRadius: 10,
      cursor: 'pointer',
      minWidth: '100px',
    }}
    onClick={onClick}
  >
    {children}
  </button>
)

const Input = ({ onValue, ...props }) => {
  return (
    <input
      style={{
        outline: 'none',
        border: 'none',
        padding: 5,
        background: 'blue',
        color: 'white',
        fontSize: '120%',
        borderRadius: 10,
      }}
      // @ts-ignore
      onInput={(event) => onValue(event.target.value)}
      {...props}
    />
  )
}

function List() {
  this.state = state({
    name: '',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Input placeholder="Name" value={this.state.name} onValue={set(this.state, 'name')} />
        <Button
          onClick={() => {
            State.items.add({ name: this.state.name })
          }}
        >
          Add
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {State.items.map((item) => (
          <p>{item.name}</p>
        ))}
      </div>
    </div>
  )
}

function ItemsOnly() {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {State.items.map((item) => (
        <p>{item.name}</p>
      ))}
    </div>
  )
}

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

function App() {
  return (
    <>
      <Button onClick={State.increment}>
        Increment {State.count} {State.double}
      </Button>
      <p>Shared component state</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <SharedCounter initial={1} />
        <SharedCounter initial={2} />
        <SharedCounter initial={3} />
      </div>
      <p>List</p>
      <List />
      <ItemsOnly />
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
