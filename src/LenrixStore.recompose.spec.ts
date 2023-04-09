import { expect } from 'chai'

import { initialState, State, TodoItem } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{ toggleFlag: void }>()
      .updates(_ => ({
         toggleFlag: () => _.focusPath('flag').update(flag => !flag)
      }))
type RootStore = ReturnType<typeof createRootStore>

const createRecomposedStore = (rootStore: RootStore) =>
   rootStore.recompose(_ => ({
      counter: rootStore.localLens.focusPath('counter'),
      todoList: rootStore.localLens.focusPath('todo', 'list')
   }))
type RecomposedStore = ReturnType<typeof createRecomposedStore>

describe('LenrixStore.recompose()', () => {
   let rootStore: RootStore
   let rootState: State
   let rootStateTransitions: number

   interface RecomposedState {
      counter: number
      todoList: TodoItem[]
   }

   let store: RecomposedStore
   let state: RecomposedState
   let stateTransitions: number

   beforeEach(() => {
      rootStore = createRootStore()
      store = createRecomposedStore(rootStore)
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
      const result = store.localLens.setFields({ todoList: newList })(state)
      expect(result.todoList).to.equal(newList)
   })

   ////////////////////////
   // STATE TRANSITIONS //
   //////////////////////

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal({
         counter: initialState.counter,
         todoList: initialState.todo.list
      })
      expect(store.currentState.todoList).to.equal(initialState.todo.list)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({
         counter: initialState.counter,
         todoList: initialState.todo.list
      })
      expect(state.todoList).to.equal(initialState.todo.list)
   })

   it('does not emit new state when unrelated slice of parent state changes', () => {
      rootStore.dispatch({ toggleFlag: undefined })

      expect(rootStateTransitions).to.equal(2)
      expect(stateTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

   it('throws error when recomposing with function', () => {
      expect(() => rootStore.recompose(() => () => null)).to.throw()
   })

   it('can recompose with computed values', () => {
      const recomposed = rootStore
         .computeFromFields(['todo'], ({ todo }) => ({
            todoListLength: todo.list.length
         }))
         .recompose(
            _ => ({
               todoList: _.focusPath('todo', 'list')
            }),
            ['todoListLength']
         )
      expect(recomposed.currentState).to.deep.equal({
         todoList: initialState.todo.list,
         todoListLength: 3
      })
      expect(recomposed.currentState.todoList).to.deep.equal(
         initialState.todo.list
      )
   })

   it('can store fields as readonly-values', () => {
      const focused = rootStore.recompose(
         _ => ({ todoList: _.focusPath('todo', 'list') }),
         ['counter']
      )

      expect(focused.currentState.counter).to.equal(
         rootStore.currentState.counter
      )
   })
})
