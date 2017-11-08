import { expect } from 'chai'
import { initialState, State } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'
import { UnfocusedLens } from 'immutable-lens'

type PickedState = Pick<State, 'counter' | 'todo'>

describe('LenrixStore.focusFields()', () => {

   let rootStore: Store<State>
   let store: Store<PickedState>
   let rootState: State
   let state: PickedState
   let rootLens: UnfocusedLens<State>
   let lens: UnfocusedLens<PickedState>
   let rootStateTransitions: number
   let stateTransitions: number

   const initialPickedState: PickedState = {
      counter: initialState.counter,
      todo: initialState.todo
   }

   beforeEach(() => {
      rootStore = createStore(initialState)
      store = rootStore.focusFields('counter', 'todo')
      rootLens = rootStore.lens
      lens = store.lens
      rootStore.state$.subscribe(newState => {
         rootState = newState
         ++rootStateTransitions
      })
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
      rootStateTransitions = 0
      stateTransitions = 0
   })

   it('has path', () => {
      expect(store.path).to.equal('root.pick(counter,todo)')
   })

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal(initialPickedState)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal(initialPickedState)
   })

   ////////////////////////
   // STATE TRANSITIONS //
   //////////////////////

   it('does not emit new state when an update does not change any value', () => {
      store.updateFields({ counter: value => value })
      expect(stateTransitions).to.equal(0)
   })

   it('does not emit new state when an unrelated slice of parent state changes', () => {
      rootStore.updateFields({ flag: value => !value })
      expect(stateTransitions).to.equal(0)
   })

   ///////////
   // READ //
   /////////

   /////////////
   // UPDATE //
   ///////////

   describe('.reset()', () => {
      it('sets state to initialState', () => {
         store.setFieldValues({ counter: 0 })
         store.reset()
         expect(state.counter).to.equal(42)
      })

      it('does not emit new state when already in initial state', () => {
         rootStore.reset()
         store.reset()
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.setValue()', () => {
      it('can set new state', () => {
         const newState = {
            todo: initialState.todo,
            counter: 12
         }
         store.setValue(newState)
         expect(stateTransitions).to.equal(1)
         expect(state).to.deep.equal(newState)
         expect(state.todo).to.equal(initialState.todo)
         expect(state.todo).to.deep.equal(initialState.todo)
      })

      it('does not emit new state when same state', () => {
         store.setValue(state)
         expect(stateTransitions).to.equal(0)
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
         expect(stateTransitions).to.equal(0)
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
         expect(stateTransitions).to.equal(0)
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
         expect(stateTransitions).to.equal(0)
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
         expect(stateTransitions).to.equal(0)
      })

      it('throws when updating unknown field', () => {
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
         expect(stateTransitions).to.equal(1)
      })

      it('does not trigger state transitions when all updaters returns same value', () => {
         const identity = lens.focusPath('counter').update(value => value)
         store.pipe(
            identity,
            identity,
            identity
         )
         expect(state.counter).to.equal(42)
         expect(stateTransitions).to.equal(0)
      })
   })

})
