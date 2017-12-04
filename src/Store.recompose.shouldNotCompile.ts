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

// Recomposing null @shouldNotCompile
store.recompose(null)

// Recomposing undefined @shouldNotCompile
store.recompose(undefined)

// Recomposing number @shouldNotCompile
store.recompose(42)

// Recomposing string @shouldNotCompile
store.recompose('counter')

// Recomposing array @shouldNotCompile
store.recompose([])

// Recomposing function @shouldNotCompile
store.recompose(() => null)

// Recomposing object @shouldNotCompile
store.recompose({})

// Recomposing with wrong source type Lens @shouldNotCompile
store.recompose(_ => ({ todoList: todoListStore.lens }))

// Recomposing with wrong source type Lens @shouldNotCompile
const recomposedStore = todoStore.recompose(_ => ({ todoList: todoLens.focusPath('list') }))