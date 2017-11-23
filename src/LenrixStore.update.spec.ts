import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

describe('LenrixStore', () => {

   let store: Store<{ state: State }>
   let state: State
   let lens: UnfocusedLens<State>
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

   describe('.reset()', () => {
      it('sets state to initialState', () => {
         store.setFieldValues({ counter: 0 })
         store.reset()
         expect(state.counter).to.equal(42)
      })

      it('does not emit new state when already in initial state', () => {
         store.reset()
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.setValue()', () => {
      it('can set new state', () => {
         const newState = {
            ...state,
            counter: state.counter + 1
         }
         store.setValue(newState)
         expect(state).to.deep.equal(newState)
         expect(state.todo).to.equal(initialState.todo)
         expect(state.todo).to.deep.equal(initialState.todo)
      })

      it('does not emit new state when same state', () => {
         store.setValue(state)
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.update()', () => {
      it('can update state', () => {
         store.update(state => ({
            ...state,
            counter: 21
         }))
         expect(state.counter).to.equal(21)
      })

      it('does not emit new state when updater returns same state', () => {
         store.update(state => state)
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.setFieldValues()', () => {
      it('can set new field values', () => {
         store.setFieldValues({
            counter: 24
         })
         expect(state.counter).to.equal(24)
      })

      it('does not emit new state when same field value', () => {
         store.setFieldValues({
            counter: state.counter
         })
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.updateFields()', () => {
      it('can update fields', () => {
         store.updateFields({
            counter: value => ++value
         })
         expect(state.counter).to.equal(43)
      })

      it('does not emit new state when updaters return same value', () => {
         store.updateFields({
            counter: value => value
         })
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.updateFieldValues()', () => {
      it('can update field values', () => {
         store.updateFieldValues(state => ({
            counter: state.counter + 1
         }))
         expect(state.counter).to.equal(43)
      })

      it('does not emit new state when fields updater returns same value', () => {
         store.updateFieldValues(state => ({
            counter: state.counter
         }))
         expect(stateTransitions).to.equal(1)
      })

      it.skip('throws when updating unknown field', () => {
         expect(() => store.updateFieldValues(state => ({
            unknown: 'unknown'
         }))).to.throw('unknown')
      })
   })

   describe('.pipe()', () => {
      it('can pipe updaters', () => {
         const increment = lens.focusPath('counter').update(value => ++value)
         store.pipe(
            increment,
            increment,
            increment
         )
         expect(state.counter).to.equal(45)
         expect(stateTransitions).to.equal(2)
      })

      it('does not emit new state when all updaters returns same value', () => {
         const identity = lens.focusPath('counter').update(value => value)
         store.pipe(
            identity,
            identity,
            identity
         )
         expect(state.counter).to.equal(42)
         expect(stateTransitions).to.equal(1)
      })
   })

})
