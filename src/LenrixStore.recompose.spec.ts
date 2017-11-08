import { expect } from 'chai'
import { initialState, State, TodoItem } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'

describe('LenrixStore.recompose()', () => {

   let rootStore: Store<State>
   let rootState: State
   let rootStateTransitions: number

   type RecomposedState = {
      todoList: TodoItem[],
      flag: boolean
   }

   let store: Store<RecomposedState>
   let state: RecomposedState
   let stateTransitions: number

   beforeEach(() => {
      rootStore = createStore(initialState)
      store = rootStore.recompose({
         todoList: rootStore.lens.focusPath('todo', 'list'),
         flag: rootStore.lens.focusPath('flag')
      })
      rootStore.state$.subscribe(newState => {
         rootState = newState
         ++rootStateTransitions
      })
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
      rootStateTransitions = 0
      stateTransitions = 0
   })

   it('has path', () => {
      expect(store.path).to.equal('root.recomposed({todoList, flag})')
   })

   it('has Lens', () => {
      const newList: TodoItem[] = []
      const result = store.lens.setFieldValues({ todoList: newList })(state)
      expect(result.todoList).to.equal(newList)
   })

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal({ todoList: rootState.todo.list, flag: false })
      expect(store.currentState.todoList).to.equal(rootState.todo.list)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({ todoList: rootState.todo.list, flag: false })
      expect(state.todoList).to.equal(rootState.todo.list)
   })

   ////////////////////////
   // STATE TRANSITIONS //
   //////////////////////

   it('does not emit new state when unrelated slice of parent state is updated', () => {
      rootStore.updateFields({ counter: i => i + 1 })

      expect(rootStateTransitions).to.equal(1)
      expect(stateTransitions).to.equal(0)
   })

   ///////////
   // READ //
   /////////

   /////////////
   // UPDATE //
   ///////////

   describe('.reset()', () => {
      it('sets state to initial state', () => {
         store.setFieldValues({ flag: true })
         store.reset()
         expect(state.flag).to.equal(initialState.flag)
         expect(rootState).to.deep.equal(initialState)
      })

      it('does not trigger state transition on reset when already set to initial state', () => {
         store.reset()
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.setValue()', () => {
      it('can set new state', () => {
         const newState = {
            ...store.currentState,
            flag: !store.currentState.flag
         }
         store.setValue(newState)
         expect(state).to.deep.equal(newState)
      })

      it('does not emit new state when same state', () => {
         store.setValue(state)
         expect(stateTransitions).to.equal(0)
      })

      it('does not emit new state when same fields', () => {
         store.setValue({ ...store.currentState })
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.update()', () => {
      it('can update state', () => {
         const newList: TodoItem[] = []
         store.update(() => ({ todoList: newList, flag: false }))
         expect(state).to.deep.equal({ todoList: newList, flag: false })
         expect(state.todoList).to.equal(newList)
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.setFieldValues()', () => {
      it('can set field values', () => {
         const newList: TodoItem[] = []
         store.setFieldValues({ todoList: newList })
         expect(state).to.deep.equal({ todoList: newList, flag: false })
         expect(state.todoList).to.equal(newList)
         expect(stateTransitions).to.equal(1)
      })

      it('does not emit new state when previous and new values are the same', () => {
         store.setFieldValues({
            flag: state.flag,
            todoList: state.todoList
         })
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('.updateFields()', () => {
      it('can update fields', () => {
         const newList: TodoItem[] = []
         store.updateFields({ todoList: () => newList })
         expect(state).to.deep.equal({ todoList: newList, flag: false })
         expect(state.todoList).to.equal(newList)
         expect(stateTransitions).to.equal(1)
      })

      it('does not emit new state when previous and new values are the same', () => {
         store.updateFields({
            flag: value => value,
            todoList: value => value
         })
         expect(stateTransitions).to.equal(0)
      })
   })

   describe('updateFieldValues', () => {
      it('can update field values', () => {
         const newList: TodoItem[] = []
         store.updateFieldValues(state => ({ todoList: newList }))
         expect(state).to.deep.equal({ todoList: newList, flag: false })
         expect(state.todoList).to.equal(newList)
         expect(stateTransitions).to.equal(1)
      })

      it('does not emit new state when previous and new values are the same', () => {
         store.updateFieldValues(state => ({
            flag: state.flag,
            todoList: state.todoList
         }))
         expect(stateTransitions).to.equal(0)
      })
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

})
