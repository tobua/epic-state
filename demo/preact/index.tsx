import { render } from 'preact'
import { Exmpl } from 'exmpl'
import { state } from 'epic-state'
import { connect } from 'epic-state/preact'

// NOTE demo will fail if two versions of preact are bundled, run "bun uninstall preact" in the demo.

const root = state({
  count: 1,
  increment() {
    root.count += 1
  },
  nested: {
    count: 2,
    double() {
      root.nested.count *= 2
    },
  },
  plugin: connect,
})

const Counter = () => {
  return (
    <div>
      <p>Count: {root.count}</p>
      <button onClick={root.increment}>Increment</button>
    </div>
  )
}

const SecondCounter = () => {
  return (
    <div>
      <p>Count: {root.nested.count}</p>
      <button onClick={root.nested.double}>Increment</button>
    </div>
  )
}

render(
  <Exmpl title="epic-state Demo" npm="epic-state" github="tobua/epic-state">
    <Counter />
    <SecondCounter />
  </Exmpl>,
  document.body,
)
