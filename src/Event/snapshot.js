import { map } from './map.js'

export const snapshot = f => behavior => event => map (value => f (behavior.sample(event.t())) (value)) (event)
