import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'
import { initialState, State } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'

describe('Store', () => {

   let store: Store<State>
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

   ///////////
   // READ //
   /////////

   it('can map state', () => {
      const counter$ = store.map(state => state.counter)
      let counterValue = 0
      counter$.subscribe(counter => counterValue = counter)
      expect(counterValue).to.equal(42)
   })

   it('can pluck field', () => {
      const counter$ = store.pluck('counter')
      let counterValue = 0
      counter$.subscribe(counter => counterValue = counter)
      expect(counterValue).to.equal(42)
   })

   it('can pick fields', () => {
      const counterPick$ = store.pick('counter')
      counterPick$.subscribe(counterPick => expect(counterPick).to.deep.equal({ counter: 42 }))
   })

   describe('when updating unrelated slice of State', () => {

      it('does not trigger .map() returned Observables to emit', () => {
         const counter$ = store.map(state => state.counter)
         let transitions = 0
         counter$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })

      it('does not trigger .pluck() returned Observables to emit', () => {
         const counter$ = store.pluck('counter')
         let transitions = 0
         counter$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })
   })

   it('.pick() returned Observables do not emit when updating omitted keys', () => {
      const counter$ = store.pick('counter')
      let transitions = 0
      counter$.subscribe(() => ++transitions)

      store.updateFields({ flag: value => !value })

      expect(transitions).to.equal(1)
   })
})
