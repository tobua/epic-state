import { create } from 'logua'

export const log = create('epic-state', 'red')

export const isObject = (x: unknown): x is object => typeof x === 'object' && x !== null
