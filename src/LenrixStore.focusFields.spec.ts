import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

type PickedState = Pick<State, 'counter' | 'todo'>

describe('LenrixStore.focusFields()', () => {

   let rootStore: Store<{ state: State }>
   let store: Store<{ state: PickedState }>
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
      rootStateTransitions = 0
      stateTransitions = 0
      rootStore.state$.subscribe(newState => {
         rootState = newState
         ++rootStateTransitions
      })
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
   })

   it('has path', () => {
      expect(store.path).to.equal('root.pick(counter,todo)')
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
      expect(store.currentState).to.deep.equal(initialPickedState)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal(initialPickedState)
   })

   it('does not emit new state when an update does not change any value', () => {
      store.updateFields({ counter: value => value })
      expect(stateTransitions).to.equal(1)
   })

   it('does not emit new state when an unrelated slice of parent state changes', () => {
      rootStore.updateFields({ flag: value => !value })
      expect(stateTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

   it('can focus fields with spread keys', () => {
      const focused = rootStore.focusFields('counter', 'flag')
      expect(focused.currentState).to.deep.equal({
         counter: initialState.counter,
         flag: initialState.flag
      })
   })

   it('can focus fields with key array', () => {
      const focused = rootStore.focusFields(['counter', 'flag'])
      expect(focused.currentState).to.deep.equal({
         counter: initialState.counter,
         flag: initialState.flag
      })
   })

   it('can focus fields with computedValues', () => {
      const focused = rootStore
         .compute(state => ({ todoListLength: state.todo.list.length }))
         .focusFields(['counter', 'flag'], ['todoListLength'])
      expect(focused.currentState).to.deep.equal({
         counter: initialState.counter,
         flag: initialState.flag,
         todoListLength: 3
      })
   })

})
