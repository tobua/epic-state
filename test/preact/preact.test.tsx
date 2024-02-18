/* eslint-disable react/react-in-jsx-scope */
import '../setup-dom'
// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react'
import { expect, test } from 'bun:test'
import { render, act } from '@testing-library/preact'
import { state } from '../../index'
import { connect } from '../../plugin/preact'

// NOTE placing tsconfig in this folder with preact extensions didn't work.

test('Can render a preact app and extend JSX elements (required for preact).', () => {
  const { getByText } = render(<p>test</p>)
  // screen.debug()
  // console.log(serializeElement())
  const paragraph = getByText('test')
  expect(paragraph.tagName).toBe('P')
})

test('Plugin traps will rerender the component when the state changes.', async () => {
  let renderCount = 0
  const root = state({
    count: 1,
    increment() {
      root.count += 1
    },
    plugin: connect,
  })
  function Counter() {
    renderCount += 1
    return <p>count: {root.count}</p>
  }
  const { getByText } = render(<Counter />)
  let paragraph = getByText('count: 1')
  expect(paragraph.textContent).toBe('count: 1')
  expect(renderCount).toBe(1)

  act(() => {
    root.count = 2
  })

  root.increment()

  paragraph = getByText('count: 2')
  expect(paragraph.textContent).toBe('count: 2')
  expect(renderCount).toBe(2)

  act(() => {
    root.count = 2 // Ignored as value the same
  })

  expect(renderCount).toBe(2)
})
