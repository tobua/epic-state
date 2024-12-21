import { type Observation, PluginAction, type Property } from '../types'

export const process = () => Promise.resolve() // NOTE processes observe() listeners.

export const wait = (time: number) => new Promise((done) => setTimeout(done, time * 1000))

export const removeProxyObject = (observation: Observation) => {
  const copy = [...observation]
  copy.splice(1, 1)
  return copy as unknown as [PluginAction, Property, any, any?]
}

export const setObservationsOnly = (values: Observation[]) => values.filter((observation) => observation[0] !== PluginAction.Get)
