import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

describe('LenrixStore.actionHandlers()', () => {

   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let rootStore: Store<{ state: State }>

   beforeEach(() => {
      rootStore = createStore(initialState)
   })

   it('applies registered handler on dispatch', () => {
      const store = rootStore
         .actionTypes<{
            clearTodoList: null
         }>()
         .actionHandlers(_ => ({
            clearTodoList: () => _.focusPath('todo', 'list').setValue([]),
         }))

      store.actions.clearTodoList(null)

      expect(store.currentState.todo.list).to.be.empty
   })

})
