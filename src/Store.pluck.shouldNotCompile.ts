import { Observable } from 'rxjs/Observable'

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
const todoStore = store.focusPath('todo')
const todoListStore = todoStore.focusPath('list')

const lens = store.localLens
const todoLens = lens.focusPath('todo')

// Plucking null key @shouldNotCompile
store.pluck(null)

// Plucking undefined key @shouldNotCompile
store.pluck(undefined)

// Plucking non-string primitive key @shouldNotCompile
store.pluck(42)

// Plucking object key @shouldNotCompile
store.pluck({})

// Plucking function key @shouldNotCompile
store.pluck(() => 'counter')

// Plucking unknown key @shouldNotCompile
store.pluck('unknown')

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Plucking key on array-focused store @shouldNotButDoesCompile
todoListStore.pluck('length')
