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

// Picking null key @shouldNotCompile
store.pick(null)

// Picking undefined key @shouldNotCompile
store.pick(undefined)

// Picking object key @shouldNotCompile
store.pick({})

// Picking function key @shouldNotCompile
store.pick(() => 'counter')

// Picking unknown key @shouldNotCompile
store.pick('unknown')

// Picking keys on array-focused store @shouldNotCompile
todoListStore.pick('length')
