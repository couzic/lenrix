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

   it('has Lens', () => {
      const newList: TodoItem[] = []
      const result = store.lens.setFieldValues({ todoList: newList })(state)
      expect(result.todoList).to.equal(newList)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({ todoList: sourceState.todo.list })
      expect(state.todoList).to.equal(sourceState.todo.list)
   })

   /////////////
   // UPDATE //
   ///////////

   it('can set field values', () => {
      const newList: TodoItem[] = []
      store.setFieldValues({ todoList: newList })
      expect(state).to.deep.equal({ todoList: newList })
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('can set state', () => {
      const newList: TodoItem[] = []
      const newState: RecomposedState = { todoList: newList }
      store.setValue(newState)
      expect(state).to.deep.equal(newState)
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('can update fields', () => {
      const newList: TodoItem[] = []
      store.updateFields({ todoList: () => newList })
      expect(state).to.deep.equal({ todoList: newList })
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('can update state', () => {
      const newList: TodoItem[] = []
      store.update(() => ({ todoList: newList }))
      expect(state).to.deep.equal({ todoList: newList })
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('can pipe updaters', () => {
      const initialListLength = state.todoList.length
      const addTodo = store.lens.updateFields({
         todoList: list => [...list, { title: 'New Todo', done: false }]
      })
      store.pipe(
         addTodo,
         addTodo
      )
      expect(state.todoList.length).to.equal(initialListLength + 2)
      expect(stateTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

})
