import { expect } from 'chai'
import { initialState, State, TodoItem, TodoState } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'
import { createLens } from 'immutable-lens'
import { ComputedStore } from './ComputedStore'

interface ComputedValues {
   todoListLength: number
}

describe('LenrixStore.focusFields()', () => {

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



   /////////////
   // UPDATE //
   ///////////



   ////////////
   // FOCUS //
   //////////

   //
   // it('can focus with lens', () => {
   //    let count = 0
   //    store.focusWith(lens.focusOn('count')).state$.subscribe(value => count = value)
   //    expect(count).to.equal(state.count)
   // })
   //
   // it('can recompose', () => {
   //    const recomposedStore = store.recompose({
   //       todoList: lens.focusOn('list')
   //    })
   //    recomposedStore.state$.subscribe(recomposedState => {
   //       expect(recomposedState).to.deep.equal({ todoList: state.list })
   //       expect(recomposedState.todoList).to.equal(state.list)
   //    })
   // })

   // it('can focus with lens', () => {
   //    let counter = 0
   //    store.focusWith(lens.focusOn('counter')).state$.subscribe(value => counter = value)
   //    expect(counter).to.equal(42)
   // })
   //
   // it('can recompose', () => {
   //    const recomposedStore = store.recompose({
   //       todoList: lens.focusPath('todo', 'list')
   //    })
   //    recomposedStore.state$.subscribe(recomposedState => {
   //       expect(recomposedState).to.deep.equal({ todoList: state.todo.list })
   //       expect(recomposedState.todoList).to.equal(state.todo.list)
   //    })
   // })
})
