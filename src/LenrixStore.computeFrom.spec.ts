import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

interface State {
   name: string
   todo: {
      input: string
      list: string[]
   }
   flag: boolean
}

const initialState: State = {
   name: '',
   todo: {
      input: '',
      list: []
   },
   flag: false
}

describe('LenrixStore.computeFrom()', () => {

   const lens = createLens<State>()
   let store: Store<{
      state: State
      computedValues: {}
      actions: { toggleFlag: void, addToList: string }
      dependencies: {}
   }>
   let computedStore: Store<{
      state: State
      computedValues: { todoListLength: number }
      actions: { toggleFlag: void, addToList: string }
      dependencies: {}
   }>
   let state: State
   let computedState: State & { todoListLength: number }
   let computations: number
   let stateTransitions: number
   let computedStateTransitions: number

   beforeEach(() => {
      computations = 0
      stateTransitions = 0
      computedStateTransitions = 0
      store = createStore(initialState, { logger: silentLoggerOptions })
         .actionTypes<{
            toggleFlag: void
            addToList: string
         }>()
         .actionHandlers(_ => ({
            toggleFlag: () => _.focusPath('flag').update(flag => !flag),
            addToList: (name) => _.focusPath('todo', 'list').update(list => [...list, name])
         }))
      computedStore = store.computeFrom(_ => ({
         todoList: _.focusPath('todo', 'list')
      }), selection => {
         ++computations
         return {
            todoListLength: selection.todoList.length
         }
      })
      computedStore.state$.subscribe(s => {
         state = s
         ++stateTransitions
      })
      computedStore.computedState$.subscribe(s => {
         computedState = s
         ++computedStateTransitions
      })
   })

   it('initially has state in current state', () => {
      expect(computedStore.currentState).to.equal(initialState)
      expect(computedStore.currentState).to.deep.equal(initialState)
   })

   it('initially has state in state stream', () => {
      expect(state).to.equal(initialState)
      expect(state).to.deep.equal(initialState)
   })

   it('initially emits normalized state only once', () => {
      expect(stateTransitions).to.equal(1)
   })

   it('initially has computed values in current computed state', () => {
      expect(computedStore.currentComputedState.todoListLength).to.equal(initialState.todo.list.length)
   })

   it('initially has computed values in computed state stream', () => {
      expect(computedState.todoListLength).to.deep.equal(0)
   })

   it('initially computes initial values once only', () => {
      expect(computations).to.equal(1)
   })

   it('initially emits computed state only once', () => {
      expect(computedStateTransitions).to.equal(1)
   })

   it('does not compute values when unselected fields change', () => {
      computedStore.dispatch({ toggleFlag: undefined })
      expect(computations).to.equal(1)
   })

   it('recomputes values when selected fields change', () => {
      expect(computations).to.equal(1)
      computedStore.dispatch({ addToList: 'Bob' })
      expect(computations).to.equal(2)
   })

})
