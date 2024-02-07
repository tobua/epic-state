# How It Works

Calling `state(value: object)` on an object will wrap the object in a Proxy and return the wrapped state. For nested objects like `state({ nested: { count: 1 } })` the proxy will create another proxy wrapping `{ count: 1 }` as soon as the `nested` property is accessed.
