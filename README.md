# epic-state

<img align="right" src="https://github.com/tobua/epic-state/raw/main/logo.svg" width="30%" alt="State Logo" />

Reactive state management for frontend libraries.

- Reactive values, actions and derived states
- Local and global plugins
- Navigatable state-tree structure
- Built-in TypeScript types
- Automatic [`epic-jsx`](https://github.com/tobua/epic-jsx) and Preact integration without component wrapper
- Map, Set support

## Usage

Any root state has to be created from an object while the returned Proxy can be used like regular JavaScript values.

```ts
import { state } from 'epic-state'

const root = state({
  count: 1,
  nested: { count: 2 },
  increment: () => {
    root.count *= 2
  },
  get double() {
    return root.count * 2
  },
})
```

To connect the state to automatically rerender [`epic-jsx`](https://github.com/tobua/epic-jsx) components accessing the state add the following.

```jsx
import { state, plugin } from 'epic-state'
import { connect } from 'epic-state/connect'
import { render } from 'epic-jsx'

plugin(connect) // Register global connect plugin for epic-jsx.

const root = state({
  count: 1,
})

render(
  <button
    onClick={() => {
      root.count += 1
    }}
  >
    Increment {root.count}
  </button>,
)
```

## Observer

Using the observe method it's possible to receive notifications to state access or changes anywhere.

```ts
import { state, observe } from 'epic-state'
// TODO export observer type.
const myObserver = (action) => console.log(`Log: ${action}`)

const root = state({ count: 1 })
observe(myObserver)
// 'get' Action
const value = root.count // => Log: ['get', ['count'], 1]
// 'set' Action
root.count = 2 // => Log: ['get', ['count'], 2, 1]
// 'delete' Action
delete root.count // => Log: ['delete', ['count'], 2]
```

## Data Structures

Using the observe method it's possible to receive notifications to state access or changes anywhere.

```ts
import { state, list } from 'epic-state'

const task = (name: string) => ({ name, done: false })
const root = state({ tasks: list(task, ['First Task', 'Second Task']) })

```

## Plugins

Plugins - much like an observer - receive updates to the state but plugins can also be applied locally and defined for specific actions.

```ts
import { state, plugin } from 'epic-state'
import { connect } from 'epic-state/connect' // For epic-jsx
import { connect } from 'epic-state/preact' // For Preact
import { persistUrl } from 'epic-state/persist'

// Register plugin globally to any state updates.
plugin(connect)
// Add plugin to a local state.
const root = state({ count: 1, plugin: [connect] })
// Connect with configuration.
const root = state({ count: 1, page: 0, user: '123', plugin: [persistUrl('page', 'user')] })
```

## Build Your Own Plugin

Having access to state actions it's possible to encapsulate functionality as a plugin without the need for any changes to the regularly used code.

```ts
import { type Plugin, PluginActions } from 'epic-state'

function myConfigurableLogPlugin(...configuration: string[]): Plugin {
  let properties: string[] = []
  const isPropertyIgnored = () => properties.length !== 0 && !properties.includes(property)

  const actions = {
    get: ({ property, value }) =>
      !isPropertyIgnored(property) && console.log(`GET: ${property} as ${value}`),
    set: ({ property, value, previousValue }) => {
      if (value === previousValue || isPropertyIgnored(property)) return
      console.log(`SET: ${property} as ${value} from ${previousValue}`)
    },
    delete: ({ property }) =>
      !isPropertyIgnored(property) && console.log(`DELETE: ${property}`),
  } as PluginActions

  // Called last by the library when a plugin is added to the state.
  if (configuration[0] === 'initialize') {
    return actions
  }

  properties = properties.concat(configuration ?? [])

  return (...innerConfiguration: any) => {
    // Plugin should only be configured once.
    if (innerConfiguration[0] !== 'initialize') {
      console.error('Plugin has already been configured')
    }
    return actions
  }
}
```
