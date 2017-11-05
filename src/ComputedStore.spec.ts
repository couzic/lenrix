import { expect } from 'chai'
import { initialState, State } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'
import { createLens } from 'immutable-lens'

describe('ComputedStore', () => {

   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let store: Store<State>
   let state: State
   let stateTransitions: number

   beforeEach(() => {
      store = createStore(initialState)
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
      stateTransitions = 0
   })

   ///////////
   // READ //
   /////////

   it('has computed value in current state', () => {
      expect(stateTransitions).to.equal(0)
      const computedStore = store.compute(s => ({
         toto: 'Tata'
      }))
      expect(computedStore.currentState.toto).to.equal('Tata')
   })

})
