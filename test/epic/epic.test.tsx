import '../setup-dom'
import { beforeEach, expect, test } from 'bun:test'
import { render, serializeElement } from 'epic-jsx/test'
import { list, plugin, removeAllPlugins, set, setValue, state, toggle } from '../../index'
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

test('Children that have been removed will not be rerendered.', async () => {
  const root = state({ first: 1, second: 2 })

  plugin(connect)

  function Child() {
    // TODO still rerendered, but won't result in an error.
    return <p>child: {root.first}</p>
  }

  function Parent() {
    if (root.second > 2) {
      return <p>parent: {root.second}</p>
    }
    return (
      <div>
        parent: {root.second}
        <Child />
      </div>
    )
  }

  const { serialized } = render(<Parent />)

  expect(serialized).toContain('parent: 2')
  expect(serialized).toContain('child: 1')

  root.second += 1

  const newMarkup = serializeElement()

  expect(newMarkup).toContain('parent: 3')
  expect(newMarkup).not.toContain('child:')
})

test('Router setup connected to state is tracked appropriately.', async () => {
  const pages = {
    overview: () => <p>overview</p>,
    about: () => <p>about</p>,
    static: <p>static</p>,
    product: () => <p>product: {Router.parameters.id}</p>,
    productFromRouter: ({ router }: { router: { parameters: { id: number } } }) => <p>product: {router.parameters.id}</p>,
  }

  const Router = state({
    route: 'overview',
    parameters: {},
    go(route: string, parameters: Record<string | number, string | number> = {}) {
      Router.route = route
      Router.parameters = parameters
    },
    get Page() {
      const Component = pages[Router.route]

      if (typeof Component !== 'function') {
        return () => Component
      }

      return () => <Component router={Router} />
    },
  })

  plugin(connect)

  function App() {
    return <Router.Page />
  }

  const { serialized } = render(<App />)

  expect(serialized).toEqual('<body><p>overview</p></body>')

  Router.go('about')

  let newMarkup = serializeElement()

  expect(newMarkup).toEqual('<body><p>about</p></body>')
  expect(newMarkup).not.toEqual('<body><p>overview</p></body>')

  Router.go('product', { id: 1 })

  newMarkup = serializeElement()

  expect(newMarkup).toEqual('<body><p>product: 1</p></body>')
  expect(newMarkup).not.toEqual('<body><p>about</p></body>')

  Router.go('product', { id: 2 })

  newMarkup = serializeElement()

  expect(newMarkup).toEqual('<body><p>product: 2</p></body>')

  Router.go('productFromRouter', { id: 3 })

  newMarkup = serializeElement()

  expect(newMarkup).toEqual('<body><p>product: 3</p></body>')

  Router.go('productFromRouter', { id: 4 })

  newMarkup = serializeElement()

  expect(newMarkup).toEqual('<body><p>product: 4</p></body>')

  Router.go('static')

  newMarkup = serializeElement()

  expect(newMarkup).toEqual('<body><p>static</p></body>')
})

test('Changes to lists trigger a rerender.', async () => {
  const root = state({ count: 5, items: list((value: { id: number; name: string }) => ({ id: value.id, name: value.name }), []) })
  let renderCount = 0

  plugin(connect)

  function App() {
    renderCount += 1
    return (
      <div>
        {root.items.map((item) => (
          <p id={String(item.id)}>{item.name}</p>
        ))}
      </div>
    )
  }

  const { serialized } = render(<App />)

  expect(serialized).toContain('<body><div></div></body>')
  expect(renderCount).toBe(1)

  root.items.replace([
    { id: 0, name: 'First' },
    { id: 1, name: 'Second' },
  ])

  expect(serializeElement()).toContain('<body><div><p id="0">First</p><p id="1">Second</p></div></body>')
  expect(renderCount).toBe(2)

  root.items.add({ id: 2, name: 'Third' })

  expect(serializeElement()).toContain('<body><div><p id="0">First</p><p id="1">Second</p><p id="2">Third</p></div></body>')
  expect(renderCount).toBe(3)
})

test('Helpers for JSX value callbacks.', () => {
  const root = state({
    count: 1,
    active: false,
    name: '',
  })

  plugin(connect)

  function CutomButton({ value, onValue, ...props }) {
    return (
      <button onClick={() => onValue(value + 1)} {...props}>
        Increment
      </button>
    )
  }

  function App() {
    return (
      <div>
        <button id="toggle" onClick={toggle(root, 'active')}>
          Toggle
        </button>
        <input id="value" onChange={setValue(root, 'name')} />
        <CutomButton id="count" value={root.count} onValue={set(root, 'count')} />
      </div>
    )
  }

  const { serialized } = render(<App />)

  expect(serialized).toEqual(
    '<body><div><button id="toggle">Toggle</button><input id="value" /><button id="count">Increment</button></div></body>',
  )

  document.getElementById('toggle').click()
  const input = document.getElementById('value') as HTMLInputElement
  input.value = 'hello'
  input.dispatchEvent(new Event('change', { bubbles: true }))
  document.getElementById('count').click()

  expect(serializeElement()).toEqual(
    '<body><div><button id="toggle">Toggle</button><input id="value" /><button id="count">Increment</button></div></body>',
  )

  expect(root.count).toBe(2)
  expect(root.name).toBe('hello')
  expect(root.active).toBe(true)
})

test('Connect can be applied to local state and will not track global state.', async () => {
  let renderCount = 0
  const root = state({
    count: 1,
    innerCount: {
      count: 1,
      get triple() {
        return root.innerCount.count * 3
      },
      increment() {
        root.innerCount.count += 1
      },
      plugin: [connect],
      deepInnerCount: {
      count: 1,
      get quadruple() {
        return root.innerCount.deepInnerCount.count * 4
      },
      increment() {
        root.innerCount.deepInnerCount.count += 1
      },

    }
    },
    get double() {
      return root.count * 2
    },
    increment() {
      this.count += 1
    },
  })
  const secondRoot = state({
    count: 1,
    get double() {
      return secondRoot.count * 2
    },
    increment() {
      secondRoot.count += 1
    },
  })

  function Counter() {
    renderCount += 1
    return <p>{root.double} {root.innerCount.triple} {root.innerCount.deepInnerCount.quadruple} {secondRoot.double}</p>
  }

  const { serialized } = render(<Counter />)

  expect(serialized).toEqual('<body><p>2 3 4 2</p></body>')
  expect(renderCount).toBe(1)

  root.increment()

  // Untracked, top level.
  expect(serializeElement()).toEqual('<body><p>2 3 4 2</p></body>')
  expect(renderCount).toBe(1)

  root.innerCount.increment()

  // Tracked, lower level, pulls in previous top level change.
  expect(serializeElement()).toEqual('<body><p>4 6 4 2</p></body>')
  expect(renderCount).toBe(2)

  secondRoot.increment()

  // Untracked other root.
  expect(serializeElement()).toEqual('<body><p>4 6 4 2</p></body>')
  expect(renderCount).toBe(2)

  root.increment()

  // Untracked, top level.
  expect(serializeElement()).toEqual('<body><p>4 6 4 2</p></body>')
  expect(renderCount).toBe(2)

  root.innerCount.deepInnerCount.increment()

  // Tracked, below lower level tracked and pulls in previous changes.
  expect(serializeElement()).toEqual('<body><p>6 6 8 4</p></body>')
  expect(renderCount).toBe(3)
})