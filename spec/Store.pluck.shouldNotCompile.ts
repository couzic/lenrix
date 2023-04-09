import { createStore } from '../src/createStore'

type State = {
   counter: number
   todo: {
      input: string
      list: string[]
      count: number
   }
}

const state: State = {} as any

const store = createStore(state)
const todoStore = store.focusPath('todo')
const todoListStore = todoStore.focusPath('list')

// @ts-expect-error
store.pluck(null)

// @ts-expect-error
store.pluck(undefined)

// @ts-expect-error
store.pluck(42)

// @ts-expect-error
store.pluck({})

// @ts-expect-error
store.pluck(() => 'counter')

// @ts-expect-error
store.pluck('unknown')

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Plucking key on array-focused store @shouldNotButDoesCompile
todoListStore.pluck('length')
