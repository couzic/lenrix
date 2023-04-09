import { expect } from 'chai'

import { initialState, TodoItem } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

interface Actions {
   clearTodoList: void
   addTodo: TodoItem
}

const createRootStore = () =>
   createStore(initialState, {
      logger: silentLoggerOptions
   }).actionTypes<Actions>()

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.action$()', () => {
   let rootStore: RootStore

   beforeEach(() => {
      rootStore = createRootStore()
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
