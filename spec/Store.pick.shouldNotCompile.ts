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
store.pick(null)

// @ts-expect-error
store.pick(undefined)

// @ts-expect-error
store.pick({})

// @ts-expect-error
store.pick(() => 'counter')

// @ts-expect-error
store.pick('unknown')

// @ts-expect-error
todoListStore.pick('length')
