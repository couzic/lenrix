import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State, TodoItem } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

interface Actions {
   clearTodoList: void
   addTodo: TodoItem
}

describe('LenrixStore.action()', () => {
   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let rootStore: Store<{
      state: State
      readonlyValues: {}
      actions: Actions
      dependencies: {}
   }>

   beforeEach(() => {
      rootStore = createStore(initialState, { logger: silentLoggerOptions })
         .actionTypes<Actions>()
         .updates(_ => ({
            clearTodoList: () => _.focusPath('todo', 'list').setValue([]),
            addTodo: item =>
               _.focusPath('todo', 'list').update(list => [...list, item])
         }))
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
