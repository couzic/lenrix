import { expect } from 'chai'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'

export type State = {
   todo: {
      input: string
      list: TodoItem[]
      count: number
   }
}

export interface TodoItem {
   title: string
   done: boolean
}

export const initialState: State = {
   todo: {
      input: 'input',
      list: [
         { title: 'item0', done: false },
         { title: 'item1', done: false },
         { title: 'item2', done: false }
      ],
      count: 42
   }
}

interface Actions {
   clearTodoList: void
   addTodo: TodoItem
}

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<Actions>()
      .updates(_ => ({
         clearTodoList: () => _.focusPath('todo', 'list').setValue([]),
         addTodo: item =>
            _.focusPath('todo', 'list').update(list => [...list, item])
      }))

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.action()', () => {
   let rootStore: RootStore

   beforeEach(() => {
      rootStore = createRootStore()
   })

   it('dispatches action with void payload', () => {
      rootStore.action('clearTodoList')()

      expect(rootStore.currentState.todo.list).to.be.empty
   })

   it('dispatches defined payload', () => {
      const todoItem = { title: 'title', done: false }
      rootStore.action('addTodo')(todoItem)

      expect(rootStore.currentState.todo.list).to.have.length(4)
      expect(rootStore.currentState.todo.list[3]).to.equal(todoItem)
   })
})
