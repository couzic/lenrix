import { expect } from 'chai'
import { createLens } from 'immutable-lens'
import 'rxjs/add/operator/mapTo'

import { initialState, State, TodoItem } from '../../test/State'
import { createStore } from '../createStore'
import { silentLoggerOptions } from '../logger/silentLoggerOptions'
import { Store } from '../Store'
import { makeTestClone } from './makeTestClone';

interface ComputedValues {
   todoListLength: number
   caret: 'up' | 'down'
}

describe('makeTestClone()', () => {

   describe('cloned root store', () => {
      let store: Store<{
         state: State
         computedValues: {}
         actions: {
            toggleFlag: void
         }
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .actionTypes<{ toggleFlag: void }>()
            .updates(_ => ({ toggleFlag: () => _.focusPath('flag').update(flag => !flag) }))
         clonedStore = makeTestClone(store)
      })

      it('has different reference', () => {
         expect(clonedStore).to.not.equal(store)
      })

      it('initially has same current state', () => {
         expect(clonedStore.currentState).to.deep.equal(store.currentState)
      })

      it(`initially has store's initial state, even when store state has changed`, () => {
         store.dispatch({ toggleFlag: undefined })
         clonedStore = makeTestClone(store)
         expect(clonedStore.currentState).to.deep.equal(initialState)
      })

   })

   describe('cloned path-focused store', () => {
      let store: Store<{
         state: State['todo']
         computedValues: {}
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions }).focusPath('todo')
         clonedStore = makeTestClone(store)
      })

      it('initially has same current state', () => {
         expect(clonedStore.currentState).to.deep.equal(store.currentState)
      })

   })

   describe('cloned path-focused (twice) store', () => {
      let store: Store<{
         state: State['todo']['list']
         computedValues: {}
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions }).focusPath('todo').focusPath('list')
         clonedStore = makeTestClone(store)
      })

      it('initially has same current state', () => {
         expect(clonedStore.currentState).to.deep.equal(store.currentState)
      })

   })

   describe('cloned fields-focused store', () => {
      let store: Store<{
         state: Pick<State, 'counter'>
         computedValues: {}
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions }).focusFields('counter')
         clonedStore = makeTestClone(store)
      })

      it('initially has same current state', () => {
         expect(clonedStore.currentState).to.deep.equal(store.currentState)
      })

   })

   describe('cloned recomposed store', () => {
      let store: Store<{
         state: { counter: number }
         computedValues: {}
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions }).recompose(_ => ({ counter: _.focusPath('counter') }))
         clonedStore = makeTestClone(store)
      })

      it('initially has same current state', () => {
         expect(clonedStore.currentState).to.deep.equal(store.currentState)
      })

   })

   describe('cloned store with updaters', () => {
      let store: Store<{
         state: State
         computedValues: {}
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .actionTypes<{ toggleFlag: void }>()
            .updates(_ => ({ toggleFlag: () => _.focusPath('flag').update(flag => !flag) }))
         clonedStore = makeTestClone(store)
      })

      it('updates state on dispatch', () => {
         expect(clonedStore.currentState.flag).to.equal(false)
         clonedStore.dispatch({ toggleFlag: undefined })
         expect(clonedStore.currentState.flag).to.equal(true)
      })

   })

   describe('cloned store with epics', () => {
      let store: Store<{
         state: State
         computedValues: {}
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .actionTypes<{ willToggleFlag: void, toggleFlag: void }>()
            .epics({ willToggleFlag: $ => $.mapTo({ toggleFlag: undefined }) })
            .updates(_ => ({ toggleFlag: () => _.focusPath('flag').update(flag => !flag) }))
         clonedStore = makeTestClone(store)
      })

      it('updates state on dispatch', () => {
         expect(clonedStore.currentState.flag).to.equal(false)
         clonedStore.dispatch({ willToggleFlag: undefined })
         expect(clonedStore.currentState.flag).to.equal(true)
      })

   })

   describe('cloned store with computed values', () => {
      let store: Store<{
         state: State
         computedValues: { todoListLength: number }
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .compute(state => ({
               todoListLength: state.todo.list.length
            }))
         clonedStore = makeTestClone(store)
      })

      it('has same computed value', () => {
         expect(clonedStore.currentComputedState.todoListLength).to.equal(store.currentComputedState.todoListLength)
      })

   })

   describe('cloned store with computedFrom() values', () => {
      let store: Store<{
         state: State
         computedValues: { todoListLength: number }
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .computeFrom(_ => ({
               todoList: _.focusPath('todo', 'list')
            }), ({ todoList }) => ({
               todoListLength: todoList.length
            }))
         clonedStore = makeTestClone(store)
      })

      it('has same computed value', () => {
         expect(clonedStore.currentComputedState.todoListLength).to.equal(store.currentComputedState.todoListLength)
      })

   })

   describe('cloned store with computedFromFields() values', () => {
      let store: Store<{
         state: State
         computedValues: { todoListLength: number }
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .computeFromFields(['todo'], ({ todo }) => ({
               todoListLength: todo.list.length
            }))
         clonedStore = makeTestClone(store)
      })

      it('has same computed value', () => {
         expect(clonedStore.currentComputedState.todoListLength).to.equal(store.currentComputedState.todoListLength)
      })
   })

   describe('cloned store with compute$() values', () => {
      let store: Store<{
         state: State
         computedValues: { todoListLength: number }
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .compute$(state$ => state$.map(state => ({
               todoListLength: state.todo.list.length
            })), { todoListLength: 0 })
         clonedStore = makeTestClone(store)
      })

      it('has same computed value', () => {
         expect(clonedStore.currentComputedState.todoListLength).to.equal(store.currentComputedState.todoListLength)
      })

   })

   describe('cloned store with computeFrom$() values', () => {
      let store: Store<{
         state: State
         computedValues: { todoListLength: number }
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .computeFrom$(
            _ => ({ todoList: _.focusPath('todo', 'list') }),
            selection$ => selection$.map(selection => ({
               todoListLength: selection.todoList.length
            })),
            { todoListLength: 0 })
         clonedStore = makeTestClone(store)
      })

      it('has same computed value', () => {
         expect(clonedStore.currentComputedState.todoListLength).to.equal(store.currentComputedState.todoListLength)
      })

   })

   describe('cloned store with computeFromFields$() values', () => {
      let store: Store<{
         state: State
         computedValues: { todoListLength: number }
         actions: {}
         dependencies: {}
      }>
      let clonedStore: typeof store

      beforeEach(() => {
         store = createStore(initialState, { logger: silentLoggerOptions })
            .computeFromFields$(
            ['todo'],
            selection$ => selection$.map(selection => ({
               todoListLength: selection.todo.list.length
            })),
            { todoListLength: 0 })
         clonedStore = makeTestClone(store)
      })

      it('has same computed value', () => {
         expect(clonedStore.currentComputedState.todoListLength).to.equal(store.currentComputedState.todoListLength)
      })

   })

   // describe('')

   // let store: Store<{
   //    state: State
   //    computedValues: ComputedValues
   //    actions: { toggleFlag: void, toggleOrder: void }
   //    dependencies: {}
   // }>

   // let clonedStore: typeof store

   // let state: State & ComputedValues
   // let stateTransitions: number

   // beforeEach(() => {
   //    store = createStore(initialState, { logger: silentLoggerOptions })
   //       .actionTypes<{
   //          toggleFlag: void
   //          toggleOrder: void
   //       }>()
   //       .updates(_ => ({
   //          toggleFlag: () => _.focusPath('flag').update(flag => !flag),
   //          toggleOrder: () => _.focusPath('sorting', 'order').update(order => order === 'descending' ? 'ascending' : 'descending')
   //       }))
   //       .compute(state => ({
   //          todoListLength: state.todo.list.length,
   //          caret: (state.sorting.order === 'ascending' ? 'up' : 'down') as 'up' | 'down'
   //       }))
   //    clonedStore = makeTestClone(store)
   //    stateTransitions = 0
   //    store.computedState$.subscribe(newState => {
   //       state = newState
   //       ++stateTransitions
   //    })
   // })

   // it('has different reference', () => {
   //    expect(clonedStore).to.not.equal(store)
   // })

   // it('has same initial state', () => {
   //    expect(clonedStore.currentState).to.deep.equal(store.currentState)
   // })

   // xit('can dispatch ', () => {
   //    expect(clonedStore.currentState.flag).to.equal(false)
   //    clonedStore.dispatch({ toggleFlag: undefined })
   //    expect(clonedStore.currentState.flag).to.equal(true)
   // })

})
