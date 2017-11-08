import { expect } from 'chai'
import { initialState, State, TodoState } from '../test/State'
import { UnfocusedLens } from 'immutable-lens'
import { Store } from './Store'
import { createStore } from './createStore'

describe('LenrixStore.focusPath()', () => {

   let rootStore: Store<State>
   let store: Store<TodoState>
   let rootState: State
   let state: TodoState
   let rootLens: UnfocusedLens<State>
   let lens: UnfocusedLens<TodoState>
   let rootStateTransitions: number
   let stateTransitions: number

   beforeEach(() => {
      rootStore = createStore(initialState)
      store = rootStore.focusPath('todo')
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

   xit('has path', () => {
      expect(store.path).to.equal('root.todo')
   })

   xit('has deep path', () => {
      expect(store.focusOn('input').path).to.equal('root.todo.input')
   })

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal(initialState.todo)
      expect(stateTransitions).to.equal(0)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal(initialState.todo)
      expect(stateTransitions).to.equal(0)
   })

   it('does not trigger state transitions when unrelated slice of ParentState is updated', () => {
      rootStore.updateFields({ flag: value => !value })

      expect(rootStateTransitions).to.equal(1)
      expect(stateTransitions).to.equal(0)
   })

   it('has Lens', () => {
      const result = lens.updateFields({ count: (v) => v + 1 })(state)
      expect(result.count).to.equal(43)
   })

   ///////////
   // READ //
   /////////

   /////////////
   // UPDATE //
   ///////////

   describe('.reset()', () => {
      it('sets state to initialState', () => {
         store.setFieldValues({ count: 0 })
         store.reset()
         expect(state.count).to.equal(42)
      })

      it('does not trigger state transition when state already is initialState', () => {
         store.reset()
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.setValue()', () => {
      it('can set new state', () => {
         store.setValue({
            ...initialState.todo,
            count: 12
         })
         expect(state.count).to.equal(12)
      })

      it('does not trigger state transition when same state', () => {
         store.setValue(state)
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.update()', () => {
      it('can update state', () => {
         store.update(state => ({
            ...state,
            count: 21
         }))
         expect(state.count).to.equal(21)
      })

      it('does not trigger state transition when updater returns same state', () => {
         store.update(state => state)
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.setFieldValues()', () => {
      it('can set new field values', () => {
         store.setFieldValues({
            count: 24
         })
         expect(state.count).to.equal(24)
      })

      it('does not trigger state transition when same field value', () => {
         store.setFieldValues({
            count: state.count
         })
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.updateFields()', () => {
      it('can update fields', () => {
         store.updateFields({
            count: value => ++value
         })
         expect(state.count).to.equal(43)
      })

      it('does not trigger state transition when updaters return same value', () => {
         store.updateFields({
            count: value => value
         })
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.updateFieldValues()', () => {
      it('can update field values', () => {
         store.updateFieldValues(state => ({
            count: state.count + 1
         }))
         expect(state.count).to.equal(43)
      })

      it('does not trigger state transition when fields updater returns same value', () => {
         store.updateFieldValues(state => ({
            count: state.count
         }))
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.pipe()', () => {
      it('can pipe updaters', () => {
         const increment = lens.focusOn('count').update(value => ++value)
         store.pipe(
            increment,
            increment,
            increment
         )
         expect(state.count).to.equal(45)
         expect(stateTransitions).to.equal(1)
      })

      it('does not trigger state transitions when all updaters returns same value', () => {
         const identity = lens.focusOn('count').update(value => value)
         store.pipe(
            identity,
            identity,
            identity
         )
         expect(state.count).to.equal(42)
         expect(stateTransitions).to.equal(0)
      })
   })

})
