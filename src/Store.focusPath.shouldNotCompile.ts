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
const counterStore = store.focusPath('counter')
const todoStore = store.focusPath('todo')
const todoListStore = todoStore.focusPath('list')
const computingStore = store.compute(state => ({ whatever: 'whatever' }))

const lens = store.localLens
const todoLens = lens.focusPath('todo')

// Focusing on null key @shouldNotCompile
store.focusPath(null)

// Focusing on undefined key @shouldNotCompile
store.focusPath(undefined)

// Focusing on non-string key @shouldNotCompile
store.focusPath(42)

// Focusing on object key @shouldNotCompile
store.focusPath({})

// Focusing on function key @shouldNotCompile
store.focusPath(() => 'counter')

// Focusing on unknown key @shouldNotCompile
store.focusPath('unknown')

////////////////////////////////////////////////////////
// @shouldNotButDoesCompile - Require runtime checks //
//////////////////////////////////////////////////////

// Focusing key on array-focused store @shouldNotButDoesCompile
todoListStore.focusPath('length')

// Focusing path on primitive type while passing computed values @shouldNotButDoesCompile
computingStore.focusPath(['counter'], ['whatever'])

// Focusing path on array type while passing computed values @shouldNotButDoesCompile
computingStore.focusPath(['todo', 'list'], ['whatever'])
