import { createStore } from './createStore'

type State = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const state = {} as State

const store = createStore(state)

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Recomposing function @shouldNotButDoesCompile
store.recompose(() => null) // TODO Implement runtime check

// Computing values with higher order function @shouldNotButDoesCompile
store.compute(state => () => null)
