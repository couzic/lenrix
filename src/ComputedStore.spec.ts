import { expect } from 'chai'
import { initialState, State } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'
import { createLens } from 'immutable-lens'
import { ComputedStore } from './ComputedStore'

interface ComputedValues {
   todoListLength: number
}

describe('ComputedStore', () => {

   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let rootStore: Store<State>

   let store: ComputedStore<State, ComputedValues>
   let state: State & ComputedValues
   let stateTransitions: number

   beforeEach(() => {
      rootStore = createStore(initialState)
      store = rootStore.compute(state => ({
         todoListLength: state.todo.list.length
      }))
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
      stateTransitions = 0
   })

   it('has path', () => {
      expect(store.path).to.equal('root.compute(todoListLength)')
   })

   ///////////
   // READ //
   /////////

   it('holds computed value in current state', () => {
      expect(store.currentState).to.deep.equal({
         ...rootStore.currentState,
         todoListLength: rootStore.currentState.todo.list.length
      })
      expect(stateTransitions).to.equal(0)
   })

   it('recomputes value when state changes', () => {
      store.update(store.lens.focusPath('todo', 'list').setValue([]))
      expect(store.currentState.todoListLength).to.equal(0)
      expect(stateTransitions).to.equal(1)
   })

   it('can update normalized state', () => {
      store.update((state, computedValues) => state)
      store.update((state) => state)
   })

})
