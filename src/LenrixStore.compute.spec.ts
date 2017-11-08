import { expect } from 'chai'
import { initialState, State } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'
import { createLens } from 'immutable-lens'
import { ComputedStore } from './ComputedStore'

interface ComputedValues {
   todoListLength: number
}

describe('LenrixStore.compute()', () => {

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
      stateTransitions = 0
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
   })

   it('has path', () => {
      expect(store.path).to.equal('root.compute(todoListLength)')
   })

   /////////////
   // UPDATE //
   ///////////

   it('can update normalized state', () => {
      store.update(state => ({
         ...state,
         counter: state.todo.list.length
      }))
      expect(store.currentState.counter).to.equal(3)
      expect(stateTransitions).to.equal(2)
   })

   it('can update normalized state with computed values', () => {
      const { todoListLength } = store.currentState
      store.update(state => ({
         ...state,
         counter: todoListLength
      }))
      expect(store.currentState.counter).to.equal(3)
      expect(stateTransitions).to.equal(2)
   })

   ////////////
   // STATE //
   //////////

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal({
         ...rootStore.currentState,
         todoListLength: rootStore.currentState.todo.list.length
      })
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({
         ...rootStore.currentState,
         todoListLength: rootStore.currentState.todo.list.length
      })
   })

   describe('.focusPath() with computed values', () => {
      let focusedStore: ComputedStore<{ order: 'ascending' | 'descending' }, ComputedValues & { caret: 'up' | 'down' }>
      let focusedState: { order: 'ascending' | 'descending' } & ComputedValues & { caret: 'up' | 'down' }
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.focusPath(['sorting'], ['todoListLength']).compute(state => ({ caret: (state.order === 'ascending' ? 'up' : 'down') as 'up' | 'down' }))
         focusedStateTransitions = 0
         focusedStore.state$.subscribe(state => {
            focusedState = state
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         rootStore.updateFields({
            counter: c => c + 1
         })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when computed value needs to be recomputed from normalized state', () => {
         expect(focusedState.order).to.equal('ascending')
         expect(focusedState.caret).to.equal('up')
         focusedStore.setFieldValues({ order: 'descending' })
         expect(focusedState.caret).to.equal('down')
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         rootStore.update(todoListLens.setValue([]))
         expect(focusedState.todoListLength).to.equal(0)
      })
   })

   describe('.focusFields() with computed values', () => {
      it('START HERE', () => {
         throw Error()
      })
   })

   describe('.recompose() with computed values', () => {
   })

})
