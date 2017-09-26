import { expect } from 'chai'
import { initialState, State, TodoItem } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'

describe('RecomposedStore', () => {

   let sourceStore: Store<State>
   let sourceState: State
   let sourceStateTransitions: number

   type RecomposedState = {
      todoList: TodoItem[],
      flag: boolean
   }

   let store: Store<RecomposedState>
   let state: RecomposedState
   let stateTransitions: number

   beforeEach(() => {
      sourceStore = createStore(initialState)
      store = sourceStore.recompose({
         todoList: sourceStore.lens.focusPath('todo', 'list'),
         flag: sourceStore.lens.focusOn('flag')
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
      expect(state).to.deep.equal({ todoList: sourceState.todo.list, flag: false })
      expect(state.todoList).to.equal(sourceState.todo.list)
   })

   it('does not trigger state transitions when unrelated slice of ParentState is updated', () => {
      sourceStore.updateFields({ counter: i => ++i })

      expect(sourceStateTransitions).to.equal(1)
      expect(stateTransitions).to.equal(0)
   })

   ///////////
   // READ //
   /////////

   describe('.map()', () => {
      it('returns selected state Observable', () => {
         const todoList$ = store.map(state => state.todoList)
         let todoList: TodoItem[] = []
         todoList$.subscribe(value => todoList = value)
         expect(todoList).to.equal(state.todoList)
      })
      it('returns Observables that do not emit when unrelated slice of state is updated', () => {
         const todoList$ = store.map(state => state.todoList)
         let transitions: number
         todoList$.subscribe(() => ++transitions)
         transitions = 0

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(0)
      })
   })

   /////////////
   // UPDATE //
   ///////////

   it('can set field values', () => {
      const newList: TodoItem[] = []
      store.setFieldValues({ todoList: newList })
      expect(state).to.deep.equal({ todoList: newList, flag: false })
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('can set state', () => {
      const newList: TodoItem[] = []
      const newState: RecomposedState = { todoList: newList, flag: false }
      store.setValue(newState)
      expect(state).to.deep.equal(newState)
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('can update fields', () => {
      const newList: TodoItem[] = []
      store.updateFields({ todoList: () => newList })
      expect(state).to.deep.equal({ todoList: newList, flag: false })
      expect(state.todoList).to.equal(newList)
      expect(stateTransitions).to.equal(1)
   })

   it('can update state', () => {
      const newList: TodoItem[] = []
      store.update(() => ({ todoList: newList, flag: false }))
      expect(state).to.deep.equal({ todoList: newList, flag: false })
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

   it('can focus on key', () => {
      let todoList: TodoItem[] = []
      store.focusOn('todoList').state$.subscribe(val => todoList = val)
      expect(todoList).to.equal(state.todoList)
   })

   it('can focus with lens', () => {
      let todoList: TodoItem[] = []
      store.focusWith(store.lens.focusOn('todoList')).state$.subscribe(val => todoList = val)
      expect(todoList).to.equal(state.todoList)
   })

   it('can recompose', () => {
      store
         .recompose({
            firstTodoItem: store.lens.focusOn('todoList').focusIndex(0)
         })
         .state$
         .subscribe(({ firstTodoItem }) => expect(firstTodoItem).to.equal(state.todoList[0]))
   })

})
