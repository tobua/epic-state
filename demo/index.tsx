import { createRoot } from 'react-dom/client'
import { Exmpl } from 'exmpl'
import { state } from 'epic-state'
import { connect } from 'epic-state/react'

const root = state({
  count: 1,
  increment() {
    root.count += 1
  },
  plugin: connect,
})

const Counter = () => {
  return (
    <div>
      <h2>Bug: React component not connected when building for production.</h2>
      <p>Count: {root.count}</p>
      <button onClick={root.increment}>Increment</button>
    </div>
  )
}

createRoot(document.body).render(
  <Exmpl title="epic-state Demo" npm="epic-state" github="tobua/epic-state">
    <Counter />
  </Exmpl>,
)
