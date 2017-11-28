import 'rxjs/add/operator/toArray'

import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State, TodoItem } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

describe('LenrixStore.pluck()', () => {

   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let store: Store<{
      state: State
      computedValues: { todoListLength: number }
      actions: { toggleFlag: void }
      dependencies: {}
   }>
   let state: State

   beforeEach(() => {
      store = createStore(initialState)
         .compute(state => ({ todoListLength: state.todo.list.length }))
         .actionTypes<{ toggleFlag: void }>()
         .actionHandlers(_ => ({ toggleFlag: () => _.focusPath('flag').update(flag => !flag) }))
      store.state$.subscribe(newState => state = newState)
   })

   it('can pluck field', () => {
      const counter$ = store.pluck('counter')
      let counterValue = 0
      counter$.subscribe(counter => counterValue = counter)
      expect(counterValue).to.equal(42)
   })

   it('can pluck path', () => {
      const list$ = store.pluck('todo', 'list')
      let list: TodoItem[] = []
      list$.subscribe(l => list = l)
      expect(list).to.equal(initialState.todo.list)
   })

   it('can pluck computed value', () => {
      let lengths
      store
         .pluck('todoListLength')
         .subscribe(l => lengths = l)
      expect(lengths).to.equal(3)
   })

   it('does not emit when updating unrelated slice of parent state', () => {
      const counter$ = store.pluck('counter')
      let transitions = 0
      counter$.subscribe(() => ++transitions)

      store.actions.toggleFlag(undefined)

      expect(transitions).to.equal(1)
   })

})
