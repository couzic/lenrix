import { expect } from 'chai'
import { initialState, State, TodoItem } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'

describe('LenrixStore.recompose()', () => {

   let rootStore: Store<State>
   let rootState: State
   let rootStateTransitions: number

   interface RecomposedState {
      counter: number
      todoList: TodoItem[]
   }

   let store: Store<RecomposedState>
   let state: RecomposedState
   let stateTransitions: number

   beforeEach(() => {
      rootStore = createStore(initialState)
      store = rootStore.recompose({
         counter: rootStore.lens.focusPath('counter'),
         todoList: rootStore.lens.focusPath('todo', 'list')
      })
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
      expect(store.path).to.equal('root.recomposed({counter, todoList})')
   })

   it('has Lens', () => {
      const newList: TodoItem[] = []
      const result = store.lens.setFieldValues({ todoList: newList })(state)
      expect(result.todoList).to.equal(newList)
   })

   /////////////
   // UPDATE //
   ///////////

   it('can update', () => {
      store.update(state => ({
         ...state,
         counter: state.todoList.length
      }))
      expect(store.currentState.counter).to.equal(3)
      expect(stateTransitions).to.equal(2)
   })

   ////////////////////////
   // STATE TRANSITIONS //
   //////////////////////

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal({ counter: initialState.counter, todoList: initialState.todo.list })
      expect(store.currentState.todoList).to.equal(initialState.todo.list)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({ counter: initialState.counter, todoList: initialState.todo.list })
      expect(state.todoList).to.equal(initialState.todo.list)
   })

   it('does not emit new state when unrelated slice of parent state is updated', () => {
      rootStore.updateFields({ flag: value => !value })

      expect(rootStateTransitions).to.equal(2)
      expect(stateTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

   it('throws error when recomposing with function', () => {
      expect(() => rootStore.recompose(() => null)).to.throw()
   })

   it('can recompose with computed values', () => {
      const recomposed = rootStore
         .compute(state => ({ todoListLength: state.todo.list.length }))
         .recompose({
            todoList: rootStore.lens.focusPath('todo', 'list')
         }, ['todoListLength'])
      expect(recomposed.currentState).to.deep.equal({ todoList: initialState.todo.list, todoListLength: 3 })
      expect(recomposed.currentState.todoList).to.deep.equal(initialState.todo.list)
   })

})
