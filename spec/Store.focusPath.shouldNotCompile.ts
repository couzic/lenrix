import { createStore } from './createStore'

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
const counterStore = store.focusPath('counter')
const todoStore = store.focusPath('todo')
const todoListStore = todoStore.focusPath('list')
const computingStore = store.computeFromField('counter', () => ({
   whatever: 'whatever'
}))

const lens = store.localLens
const todoLens = lens.focusPath('todo')

// @ts-expect-error
store.focusPath(null)

// @ts-expect-error
store.focusPath(undefined)

// @ts-expect-error
store.focusPath(42)

// @ts-expect-error
store.focusPath({})

// @ts-expect-error
store.focusPath(() => 'counter')

// @ts-expect-error
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
