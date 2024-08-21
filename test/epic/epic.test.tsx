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
    // biome-ignore lint/style/useNamingConvention: To be used as React component.
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
