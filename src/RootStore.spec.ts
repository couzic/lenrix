import { expect } from 'chai'
import { Lens } from 'immutable-lens'
import { initialState, State } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'

describe('Store', () => {

   let store: Store<State>
   let lens: Lens<State, State>
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

   it('holds initial state as state stream', () => {
      expect(state).to.equal(initialState)
      expect(state).to.deep.equal(initialState)
      expect(stateTransitions).to.equal(1)
   })

   it('holds Lens', () => {
      const result = lens.updateFields({ counter: (v) => v + 1 })(state)
      expect(result.counter).to.equal(43)
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

   it('can select field', () => {
      const counter$ = store.select('counter')
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

      it('does not trigger .select() returned Observables to emit', () => {
         const counter$ = store.select('counter')
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

   /////////////
   // UPDATE //
   ///////////

   describe('setValue()', () => {
      it('can set new state', () => {
         store.setValue({
            ...initialState,
            counter: 12
         })
         expect(state.counter).to.equal(12)
      })

      it('does not trigger state transition when same state', () => {
         store.setValue(state)
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('update()', () => {
      it('can update state', () => {
         store.update(state => ({
            ...state,
            counter: 21
         }))
         expect(state.counter).to.equal(21)
      })

      it('does not trigger state transition when updater returns same state', () => {
         store.update(state => state)
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('setFieldValues', () => {
      it('can set new field values', () => {
         store.setFieldValues({
            counter: 24
         })
         expect(state.counter).to.equal(24)
      })

      it('does not trigger state transition when same field value', () => {
         store.setFieldValues({
            counter: state.counter
         })
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('updateFields', () => {
      it('can update fields', () => {
         store.updateFields({
            counter: value => ++value
         })
         expect(state.counter).to.equal(43)
      })

      it('does not trigger state transition when updaters return same value', () => {
         store.updateFields({
            counter: value => value
         })
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('pipe()', () => {
      it('can pipe updaters', () => {
         const increment = lens.focusOn('counter').update(value => ++value)
         store.pipe(
            increment,
            increment,
            increment
         )
         expect(state.counter).to.equal(45)
         expect(stateTransitions).to.equal(2)
      })

      it('does not trigger state transitions when all updaters returns same value', () => {
         const identity = lens.focusOn('counter').update(value => value)
         store.pipe(
            identity,
            identity,
            identity
         )
         expect(state.counter).to.equal(42)
         expect(stateTransitions).to.equal(1)
      })
   })

   ////////////////////
   // FOCUSED STORE //
   //////////////////

   xit('can focus on field', () => {
      const result = store.focusOn('counter')
      expect(result).to.equal(42)
   })

})
