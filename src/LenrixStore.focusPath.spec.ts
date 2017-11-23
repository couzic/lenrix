import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'

import { initialState, State, TodoState } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

describe('LenrixStore.focusPath()', () => {

   let rootStore: Store<{ state: State }>
   let store: Store<{ state: TodoState }>
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

   it('has Lens', () => {
      const result = lens.updateFields({ count: (v) => v + 1 })(state)
      expect(result.count).to.equal(43)
   })

   xit('has path', () => {
      expect(store.path).to.equal('root.todo')
   })

   xit('has deep path', () => {
      expect(store.focusPath('input').path).to.equal('root.todo.input')
   })

   /////////////
   // UPDATE //
   ///////////

   it('can update', () => {
      store.update(state => ({
         ...state,
         count: state.list.length
      }))
      expect(store.currentState.count).to.equal(3)
      expect(stateTransitions).to.equal(2)
   })

   ////////////
   // STATE //
   //////////

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal(initialState.todo)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal(initialState.todo)
   })

   it('does not emit new state when unrelated slice of ParentState is updated', () => {
      rootStore.updateFields({ flag: value => !value })

      expect(rootStateTransitions).to.equal(2)
      expect(stateTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

   it('can focus path with spread keys', () => {
      const focused = rootStore.focusPath('todo', 'list')
      expect(focused.currentState).to.equal(initialState.todo.list)
   })

   it('can focus path with key array', () => {
      const focused = rootStore.focusPath(['todo', 'list'])
      expect(focused.currentState).to.equal(initialState.todo.list)
   })

   it('can focus path with computed values', () => {
      const focused = rootStore
         .compute(state => ({ todoListLength: state.todo.list.length }))
         .focusPath(['todo'], ['todoListLength'])
      expect(focused.currentState).to.deep.equal({
         ...initialState.todo,
         todoListLength: 3
      })
   })

   it('number-focused store emits new state when value changes', () => {
      const focused = store.focusPath('count')
      focused.update(value => value + 1)
      expect(focused.currentState).to.equal(initialState.todo.count + 1)
   })

   it('array-focused store emits new state when value changes', () => {
      const focused = store.focusPath('list')
      focused.setValue([])
      expect(focused.currentState).to.be.empty
   })

})
