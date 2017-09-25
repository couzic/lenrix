import { expect } from 'chai'
import { initialState, State, TodoItem } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'

describe('RecomposedStore', () => {

   let sourceStore: Store<State>
   let sourceState: State
   let sourceStateTransitions: number

   type RecomposedState = {
      todoList: TodoItem[]
   }

   let store: Store<RecomposedState>
   let state: RecomposedState
   let stateTransitions: number

   beforeEach(() => {
      sourceStore = createStore(initialState)
      store = sourceStore.recompose({
         todoList: sourceStore.lens.focusOn('todo').focusOn('list')
      })
      sourceStore.state$.subscribe(newState => {
         sourceState = newState
         ++sourceStateTransitions
      })
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
      sourceStateTransitions = 0
      stateTransitions = 0
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({ todoList: sourceState.todo.list })
      expect(state.todoList).to.equal(sourceState.todo.list)
   })

   /////////////
   // UPDATE //
   ///////////

   it('sets field values', () => {
      const newList: TodoItem[] = []
      store.setFieldValues({ todoList: newList })
      expect(state).to.deep.equal({ todoList: newList })
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('sets state', () => {
      const newList: TodoItem[] = []
      const newState: RecomposedState = { todoList: newList }
      store.setValue(newState)
      expect(state).to.deep.equal(newState)
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('updates fields', () => {
      const newList: TodoItem[] = []
      store.updateFields({ todoList: () => newList })
      expect(state).to.deep.equal({ todoList: newList })
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('updates state', () => {
      const newList: TodoItem[] = []
      store.update(() => ({ todoList: newList }))
      expect(state).to.deep.equal({ todoList: newList })
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

})
