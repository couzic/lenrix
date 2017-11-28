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

// Focusing unknown field @shouldNotCompile
store.focusFields('unknown')

// Focusing fields on arrayFocusedStore @shouldNotCompile
todoListStore.focusFields('length')
