import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

chai.use(sinonChai)
const { expect } = chai

interface Actions {
   clearTodoList: void
   resetCounter: void
}

describe('LenrixStore.updates()', () => {
   let rootStore: Store<{
      state: State
      computedValues: {}
      actions: Actions
      dependencies: {}
   }>

   beforeEach(() => {
      rootStore = createStore(initialState, { logger: silentLoggerOptions })
         .actionTypes<Actions>()
         .updates(_ => ({
            clearTodoList: () => _.focusPath('todo', 'list').setValue([]),
            resetCounter: () => state => ({ ...state, counter: 0 })
         }))
   })

   it('applies updates declared using no-lens object', () => {
      expect(rootStore.currentState.counter).to.equal(42)
      rootStore.dispatch({ resetCounter: undefined })
      expect(rootStore.currentState.counter).to.equal(0)
   })

   describe('on root store', () => {
      it('updates on dispatch', () => {
         rootStore.dispatch({ clearTodoList: undefined })

         expect(rootStore.currentState.todo.list).to.be.empty
      })

      it('root actions can be dispatched from path focused store', () => {
         rootStore.focusPath('todo').dispatch({ clearTodoList: undefined })
         expect(rootStore.currentState.todo.list).to.be.empty
      })
   })

   describe('on path-focused store', () => {
      let store: Store<{
         state: State['todo']
         computedValues: {}
         actions: Actions
         dependencies: {}
      }>
      beforeEach(() => {
         store = rootStore.focusPath('todo')
      })

      it('applies update registered on root store', () => {
         store.dispatch({ clearTodoList: undefined })

         expect(store.currentState.list).to.be.empty
      })

      it('applies update registered on focused store', () => {
         store
            .actionTypes<{ clearList: void }>()
            .updates(_ => ({
               clearList: () => _.focusPath('list').setValue([])
            }))
            .dispatch({ clearList: undefined })

         expect(store.currentState.list).to.be.empty
      })
   })

   describe('on fields-focused store', () => {
      let store: Store<{
         state: Pick<State, 'todo'>
         computedValues: {}
         actions: Actions
         dependencies: {}
      }>
      beforeEach(() => {
         store = rootStore.focusFields('todo')
      })

      it('applies update registered on root store', () => {
         store.dispatch({ clearTodoList: undefined })

         expect(store.currentState.todo.list).to.be.empty
      })

      it('applies update registered on focused store', () => {
         store
            .actionTypes<{ clearList: void }>()
            .updates(_ => ({
               clearList: () => _.focusPath('todo', 'list').setValue([])
            }))
            .dispatch({ clearList: undefined })

         expect(store.currentState.todo.list).to.be.empty
      })
   })

   describe('on recomposed store', () => {
      let store: Store<{
         state: { todoList: State['todo']['list'] }
         computedValues: {}
         actions: Actions
         dependencies: {}
      }>
      beforeEach(() => {
         store = rootStore.recompose(_ => ({
            todoList: _.focusPath('todo', 'list')
         }))
      })

      it('applies update registered on root store', () => {
         store.dispatch({ clearTodoList: undefined })

         expect(store.currentState.todoList).to.be.empty
      })

      it('applies update registered on recomposed store', () => {
         store
            .actionTypes<{ clearRecomposedTodoList: void }>()
            .updates(_ => ({
               clearRecomposedTodoList: () =>
                  _.focusPath('todoList').setValue([])
            }))
            .dispatch({ clearRecomposedTodoList: undefined })

         expect(store.currentState.todoList).to.be.empty
      })
   })

   it('throws error when registering a second updater for the same action type', () => {
      expect(() =>
         rootStore.updates(_ => ({
            clearTodoList: () => _.focusPath('todo', 'list').setValue([])
         }))
      ).to.throw('updater')
   })

   it('applies update even after previous update threw an error', () => {
      const store = createStore({ name: '' }, { logger: silentLoggerOptions })
         .actionTypes<{ setName: string }>()
         .updates(_ => ({
            setName: name => state => {
               if (name === 'Bob')
                  throw Error('Should be caught by lenrix store')
               else return { name }
            }
         }))

      store.dispatch({ setName: 'Bob' })
      store.dispatch({ setName: 'Steve' })

      expect(store.currentState.name).to.equal('Steve')
   })

   // it('catches error thrown by updater', () => {
   //    stub(console, 'log')

   //    const store = rootStore
   //       .actionTypes<{ setUserName: string }>()
   //       .updates(_ => ({
   //          setUserName: name =>
   //             _.focusPath('user').update(user => ({
   //                name,
   //                address: user!.address
   //             }))
   //       }))

   //    expect(() => store.dispatch({ setUserName: 'Bob' })).not.to.throw()
   //    expect(console.log).to.have.been.calledOnce
   //    ;(console.log as SinonStub).restore()
   // })
})
