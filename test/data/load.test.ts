import { expect, test } from 'bun:test'
import { load, state } from '../../index'
import { wait } from '../helper'

global.stateDisableBatching = true

test('load: empty load initialized properly.', async () => {
  const root = state({
    emptyLoad: load(() => Promise.resolve({ error: false })),
    loadWithError: load(() => Promise.resolve({ error: true })),
    loadWithData: load(() => Promise.resolve({ error: false, data: 'Hello world' })),
    loadWithoutData: load(() => Promise.resolve({ error: false })),
  })

  expect(root.emptyLoad.loading).toBe(true)
  expect(root.emptyLoad.error).toBe(false)
  expect(root.emptyLoad.data).not.toBeDefined()
  expect(root.loadWithError.loading).toBe(true)
  expect(root.loadWithError.error).toBe(false)
  expect(root.loadWithError.data).not.toBeDefined()
  expect(root.loadWithData.loading).toBe(true)
  expect(root.loadWithData.error).toBe(false)
  expect(root.loadWithData.data).not.toBeDefined()
  expect(root.loadWithoutData.loading).toBe(true)
  expect(root.loadWithoutData.error).toBe(false)
  expect(root.loadWithoutData.data).not.toBeDefined()

  await wait(0.1)

  expect(root.emptyLoad.loading).toBe(false)
  expect(root.loadWithError.error).toBe(true)
  expect(root.loadWithData.error).toBe(false)
  expect(root.loadWithData.loading).toBe(false)
  expect(root.loadWithData.data).toBe('Hello world')
  expect(root.loadWithoutData.error).toBe(true)
})
