import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'

import { initialState, State, TodoState } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })

type RootStore = ReturnType<typeof createRootStore>

const createFocusedStore = (rootStore: RootStore) => rootStore.focusPath('todo')

type FocusedStore = ReturnType<typeof createFocusedStore>

describe('LenrixStore.focusPath()', () => {
   let rootStore: RootStore
   let store: FocusedStore
   let rootState: State
   let state: TodoState
   let rootLens: UnfocusedLens<State>
   let lens: UnfocusedLens<TodoState>
   let rootStateTransitions: number
   let stateTransitions: number

   beforeEach(() => {
      rootStore = createRootStore()
      store = createFocusedStore(rootStore)
      rootLens = rootStore.localLens
      lens = store.localLens
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

   it('has Lens', () => {
      const result = lens.updateFields({ count: v => v + 1 })(state)
      expect(result.count).to.equal(43)
   })

   xit('has path', () => {
      expect(store.path).to.equal('root.todo')
   })

   xit('has deep path', () => {
      expect(store.focusPath('input').path).to.equal('root.todo.input')
   })

   ////////////
   // STATE //
   //////////

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal(initialState.todo)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal(initialState.todo)
   })

   it('does not emit new state when unrelated slice of ParentState is updated', () => {
      rootStore
         .actionTypes<{ toggleFlag: void }>()
         .updates(_ => ({
            toggleFlag: () => _.focusPath('flag').update(flag => !flag)
         }))
         .dispatch({ toggleFlag: undefined })

      expect(rootStateTransitions).to.equal(2)
      expect(stateTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

   it('can focus path with spread keys', () => {
      const focused = rootStore.focusPath('todo', 'list')
      expect(focused.currentState).to.equal(initialState.todo.list)
   })

   it('can focus path with key array', () => {
      const focused = rootStore.focusPath(['todo', 'list'])
      expect(focused.currentState).to.equal(initialState.todo.list)
   })

   it('can focus path with computed values', () => {
      const focused = rootStore
         .computeFromFields(['todo'], ({ todo }) => ({
            todoListLength: todo.list.length
         }))
         .focusPath(['todo'], ['todoListLength'])
      expect(focused.currentState).to.deep.equal({
         ...initialState.todo,
         todoListLength: 3
      })
   })

   it('number-focused store emits new state when value changes', () => {
      const focused = store.focusPath('count')
      focused
         .actionTypes<{ incrementCount: void }>()
         .updates(_ => ({ incrementCount: () => _.update(val => val + 1) }))
         .dispatch({ incrementCount: undefined })
      expect(focused.currentState).to.equal(initialState.todo.count + 1)
   })

   it('array-focused store emits new state when value changes', () => {
      const focused = store.focusPath('list')
      focused
         .actionTypes<{ clearTodos: void }>()
         .updates(_ => ({ clearTodos: () => _.setValue([]) }))
         .dispatch({ clearTodos: undefined })
      expect(focused.currentState).to.be.empty
   })

   it('can store fields as readonly-values', () => {
      const focused = rootStore.focusPath(['todo'], ['counter'])

      expect(focused.currentState.counter).to.equal(
         rootStore.currentState.counter
      )
   })
})
