import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

describe('LenrixStore when unfocused', () => {
   let store: Store<{
      state: State
      readonlyValues: {}
      actions: {}
      dependencies: {}
   }>
   let lens: UnfocusedLens<State>
   let state: State
   let stateTransitions: number

   beforeEach(() => {
      store = createStore(initialState, { logger: silentLoggerOptions })
      lens = store.localLens
      stateTransitions = 0
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
   })

   it('has path', () => {
      expect(store.path).to.equal('root')
   })

   it('holds initial state as current state', () => {
      expect(store.currentState).to.equal(initialState)
      expect(store.currentState).to.deep.equal(initialState)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.equal(initialState)
      expect(state).to.deep.equal(initialState)
   })

   it('emits new state when state is updated', () => {
      store
         .actionTypes<{ toggleFlag: void }>()
         .updates(_ => ({
            toggleFlag: () => _.focusPath('flag').update(flag => !flag)
         }))
         .dispatch({ toggleFlag: undefined })
      expect(stateTransitions).to.equal(2)
   })

   it('does not emit new state when an update does not change any value', () => {
      store
         .actionTypes<{ doNothing: void }>()
         .updates(_ => ({ doNothing: () => s => s }))
         .dispatch({ doNothing: undefined })
      expect(stateTransitions).to.equal(1)
   })
})
