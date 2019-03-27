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

describe('LenrixStore.action$()', () => {
   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let rootStore: Store<{
      state: State
      readonlyValues: {}
      actions: Actions
      dependencies: {}
   }>

   beforeEach(() => {
      rootStore = createStore(initialState, {
         logger: silentLoggerOptions
      }).actionTypes<Actions>()
   })

   it('emits disptached action', () => {
      const dispatchedActions = [] as any[]
      rootStore.action$.subscribe(action => dispatchedActions.push(action))
      rootStore.action('clearTodoList')()

      expect(dispatchedActions).to.deep.equal([
         {
            type: 'clearTodoList',
            payload: undefined
         }
      ])
   })

   describe('.ofType()', () => {
      let payloads: any[]
      beforeEach(() => {
         payloads = []
         rootStore.action$
            .ofType('addTodo')
            .subscribe(payload => payloads.push(payload))
      })

      it('rejects dispatched actions by type', () => {
         rootStore.action('clearTodoList')()

         expect(payloads).to.have.length(0)
      })

      it('filters dispatched actions by type', () => {
         const todo = { title: 'title', done: true }
         rootStore.action('addTodo')(todo)

         expect(payloads).to.deep.equal([todo])
      })
   })
})
