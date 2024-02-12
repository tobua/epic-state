import './setup-dom'
import React from 'react'
import { expect, test } from 'bun:test'
import { act, render } from '@testing-library/react'
import { state } from '../index'
import { connect } from '../plugin/react'

test('Can render a react app.', () => {
  const { getByText } = render(<p>test</p>)
  const paragraph = getByText('test')
  expect(paragraph.tagName).toBe('P')
})

test('Plugin traps will rerender the component when the state changes.', () => {
  let renderCount = 0
  const root = state({ count: 1, plugin: connect })
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

  paragraph = getByText('count: 2')
  expect(paragraph.textContent).toBe('count: 2')
  expect(renderCount).toBe(2)

  act(() => {
    root.count = 2 // Ignored as value the same
  })

  expect(renderCount).toBe(2)
})
