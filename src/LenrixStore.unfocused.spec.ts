import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

describe('LenrixStore when unfocused', () => {

   let store: Store<{ state: State }>
   let lens: UnfocusedLens<State>
   let state: State
   let stateTransitions: number

   beforeEach(() => {
      store = createStore(initialState)
      lens = store.lens
      stateTransitions = 0
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
   })

   it('has path', () => {
      expect(store.path).to.equal('root')
   })

   /////////////
   // UPDATE //
   ///////////

   // it('can update', () => {
   //    store.update(state => ({
   //       ...state,
   //       counter: state.todo.list.length
   //    }))
   //    expect(store.currentState.counter).to.equal(3)
   //    expect(stateTransitions).to.equal(2)
   // })

   ////////////
   // STATE //
   //////////

   it('holds initial state as current state', () => {
      expect(store.currentState).to.equal(initialState)
      expect(store.currentState).to.deep.equal(initialState)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.equal(initialState)
      expect(state).to.deep.equal(initialState)
   })

   it('does not emit new state when an update does not change any value', () => {
      store.updateFields({ flag: value => value })
      expect(stateTransitions).to.equal(1)
   })

})
