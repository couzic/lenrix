import { expect } from 'chai';
import { createLens } from 'immutable-lens';

import { initialState, State, TodoItem } from '../test/State';
import { ComputedStore } from './ComputedStore';
import { createStore } from './createStore';
import { Store } from './Store';

interface ComputedValues {
   todoListLength: number
   caret: 'up' | 'down'
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
         todoListLength: state.todo.list.length,
         caret: (state.sorting.order === 'ascending' ? 'up' : 'down') as 'up' | 'down'
      }))
      stateTransitions = 0
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
   })

   it('has path', () => {
      expect(store.path).to.equal('root.compute(todoListLength, caret)')
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

   it('can reset', () => {
      store.setFieldValues({
         counter: state.counter + 1
      })
      expect(state.counter).to.equal(43)
      expect(stateTransitions).to.equal(2)
      store.reset()
      expect(state.counter).to.equal(42)
      expect(stateTransitions).to.equal(3)
   })

   ////////////
   // STATE //
   //////////

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal({
         ...rootStore.currentState,
         todoListLength: rootStore.currentState.todo.list.length,
         caret: 'up'
      })
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({
         ...rootStore.currentState,
         todoListLength: rootStore.currentState.todo.list.length,
         caret: 'up'
      })
   })

   it('computes value when state changes', () => {
      expect(state.caret).to.equal('up')
      store.focusPath('sorting', 'order').setValue('descending')
      expect(state.caret).to.equal('down')
   })

   describe('.focusPath() with computed values', () => {
      let focusedStore: ComputedStore<State['sorting'], ComputedValues>
      let focusedState: State['sorting'] & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.focusPath(['sorting'], ['todoListLength', 'caret'])
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
      let focusedStore: ComputedStore<Pick<State, 'sorting'>, ComputedValues>
      let focusedState: Pick<State, 'sorting'> & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.focusFields(['sorting'], ['todoListLength', 'caret'])
         focusedStateTransitions = 0
         focusedStore.state$.subscribe(state => {
            focusedState = state
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         rootStore.updateFields({
            flag: value => !value
         })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when computed value needs to be recomputed from normalized state', () => {
         expect(focusedState.sorting.order).to.equal('ascending')
         expect(focusedState.caret).to.equal('up')
         focusedStore.focusPath('sorting').setFieldValues({ order: 'descending' })
         expect(focusedState.caret).to.equal('down')
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         rootStore.update(todoListLens.setValue([]))
         expect(focusedState.todoListLength).to.equal(0)
      })
   })

   describe('.recompose() with computed values', () => {
      let focusedStore: ComputedStore<{ todoList: TodoItem[] }, ComputedValues>
      let focusedState: { todoList: TodoItem[] } & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.recompose({
            todoList: store.lens.focusPath('todo', 'list')
         }, ['todoListLength', 'caret'])
         focusedStateTransitions = 0
         focusedStore.state$.subscribe(state => {
            focusedState = state
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         rootStore.updateFields({
            flag: value => !value
         })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when computed value needs to be recomputed from normalized state', () => {
         focusedStore.setFieldValues({ todoList: [] })
         expect(focusedState.todoListLength).to.equal(0)
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         expect(state.sorting.order).to.equal('ascending')
         expect(state.caret).to.equal('up')
         rootStore.focusPath('sorting', 'order').setValue('descending')
         expect(focusedState.caret).to.equal('down')
      })
   })

   /////////////////////
   // RUNTIME CHECKS //
   ///////////////////

   it('throws error when computing values with higher order function', () => {
      expect(() => store.compute(state => () => null)).to.throw('compute() does not support higher order functions')
   })

})
