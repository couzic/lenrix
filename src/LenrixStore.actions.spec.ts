import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

describe('LenrixStore actions', () => {

   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let rootStore: Store<{
      state: State
      computedValues: {}
      actions: { clearTodoList: void }
      dependencies: {}
   }>

   beforeEach(() => {
      rootStore = createStore(initialState)
         .actionTypes<{
            clearTodoList: void
         }>()
         .actionHandlers(_ => ({
            clearTodoList: () => _.focusPath('todo', 'list').setValue([]),
         }))
   })

   describe('on root store', () => {
      it('applies registered handler on dispatch', () => {
         rootStore.dispatch({ type: 'clearTodoList' })

         expect(rootStore.currentState.todo.list).to.be.empty
      })

      it('root actions can be dispatched from path focused store', () => {
         rootStore
            .focusPath('todo')
            .dispatch({ type: 'clearTodoList' })
         expect(rootStore.currentState.todo.list).to.be.empty
      })
   })

   describe('on path-focused store', () => {
      let store: Store<any>
      beforeEach(() => {
         store = rootStore.focusPath('todo')
      })

      it('applies handler registered on root store', () => {
         store.dispatch({ type: 'clearTodoList' })

         expect(store.currentState.list).to.be.empty
      })

      it('applies handler registered on focused store', () => {
         store
            .actionTypes<{ clearList: void }>()
            .actionHandlers(_ => ({ clearList: () => _.focusPath('list').setValue([]) }))
            .dispatch({ type: 'clearList' })

         expect(store.currentState.list).to.be.empty
      })
   })

   describe('on fields-focused store', () => {
      let store: Store<any>
      beforeEach(() => {
         store = rootStore.focusFields('todo')
      })

      it('applies handler registered on root store', () => {
         store.dispatch({ type: 'clearTodoList' })

         expect(store.currentState.todo.list).to.be.empty
      })

      it('applies handler registered on focused store', () => {
         store
            .actionTypes<{ clearList: void }>()
            .actionHandlers(_ => ({ clearList: () => _.focusPath('todo', 'list').setValue([]) }))
            .dispatch({ type: 'clearList' })

         expect(store.currentState.todo.list).to.be.empty
      })
   })

   describe('on recomposed store', () => {
      let store: Store<any>
      beforeEach(() => {
         store = rootStore.recompose(_ => ({
            todoList: _.focusPath('todo', 'list')
         }))
      })

      it('applies handler registered on root store', () => {
         store.dispatch({ type: 'clearTodoList' })

         expect(store.currentState.todoList).to.be.empty
      })

      it('applies handler registered on recomposed store', () => {
         store
            .actionTypes<{ clearRecomposedTodoList: void }>()
            .actionHandlers(_ => ({ clearRecomposedTodoList: () => _.focusPath('todoList').setValue([]) }))
            .dispatch({ type: 'clearRecomposedTodoList' })

         expect(store.currentState.todoList).to.be.empty
      })
   })

})
