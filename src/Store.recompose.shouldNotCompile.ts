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
const todoStore = store.focusPath('todo')
const todoListStore = todoStore.focusPath('list')

const lens = store.localLens
const todoLens = lens.focusPath('todo')

// @ts-expect-error
store.recompose(null)

// @ts-expect-error
store.recompose(undefined)

// @ts-expect-error
store.recompose(42)

// @ts-expect-error
store.recompose('counter')

// @ts-expect-error
store.recompose([])

// @ts-expect-error
store.recompose(() => null)

// @ts-expect-error
store.recompose({})

// @ts-expect-error
store.recompose(_ => ({ todoList: todoListStore.lens }))

todoStore.recompose(_ => ({
   // @ts-expect-error
   todoList: todoLens.focusPath('list')
}))
