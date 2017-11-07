import { expect } from 'chai'
import { initialState, State, TodoItem, TodoState } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'
import { createLens } from 'immutable-lens'
import { ComputedStore } from './ComputedStore'

interface ComputedValues {
   todoListLength: number
}

describe('LenrixStore', () => {

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

   it('has path', () => {
      expect(store.path).to.equal('root.compute(todoListLength)')
   })

   it('holds computed value in current state', () => {
      expect(store.currentState).to.deep.equal({
         ...rootStore.currentState,
         todoListLength: rootStore.currentState.todo.list.length
      })
      expect(stateTransitions).to.equal(0)
   })

   it('can update normalized state', () => {
      store.update(state => ({
         ...state,
         counter: state.todo.list.length
      }))
      expect(store.currentState.counter).to.equal(3)
      expect(stateTransitions).to.equal(1)
   })

   it('can update normalized state with computed values', () => {
      const { todoListLength } = store.currentState
      store.update(state => ({
         ...state,
         counter: todoListLength
      }))
      expect(store.currentState.counter).to.equal(3)
      expect(stateTransitions).to.equal(1)
   })

   it('recomputes value when state changes', () => {
      store.update(store.lens.focusPath('todo', 'list').setValue([]))
      expect(store.currentState.todoListLength).to.equal(0)
      expect(stateTransitions).to.equal(1)
   })

   it('can focus path with spread keys', () => {
      const focused = store.focusPath('todo', 'list')
      expect(focused.currentState).to.equal(state.todo.list)
   })

   it('can focus path with key array', () => {
      const focused = store.focusPath(['todo', 'list'])
      expect(focused.currentState).to.equal(state.todo.list)
   })

   it('can focus path with computed values', () => {
      const focused = store.focusPath(['todo'], ['todoListLength'])
      expect(focused.currentState).to.deep.equal({
         ...state.todo,
         todoListLength: 3
      })
   })

   describe('path-focused store', () => {
      let pathFocusedStore: Store<TodoState>
      let pathFocusedStateTransitions: number

      beforeEach(() => {
         pathFocusedStore = store.focusPath('todo')
         pathFocusedStore.state$.subscribe(state => ++pathFocusedStateTransitions)
         pathFocusedStateTransitions = 0
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         store.updateFields({
            counter: c => c + 1
         })
         expect(pathFocusedStateTransitions).to.equal(0)
      })
   })

   describe('path-focused computed store', () => {
      let pathFocusedStore: ComputedStore<TodoState, { todoListLength: number }>
      let pathFocusedStateTransitions: number

      beforeEach(() => {
         pathFocusedStore = store.focusPath(['todo'], ['todoListLength'])
         pathFocusedStore.state$.subscribe(state => ++pathFocusedStateTransitions)
         pathFocusedStateTransitions = 0
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         store.updateFields({
            counter: c => c + 1
         })
         expect(pathFocusedStateTransitions).to.equal(0)
      })
   })

   it('can focus fields with spread keys', () => {
      const focused = store.focusFields('counter', 'flag')
      expect(focused.currentState).to.deep.equal({
         counter: state.counter,
         flag: state.flag
      })
   })

   it('can focus fields with key array', () => {
      const focused = store.focusFields(['counter', 'flag'])
      expect(focused.currentState).to.deep.equal({
         counter: state.counter,
         flag: state.flag
      })
   })

   it('can focus fields with computedValues', () => {
      const focused = store.focusFields(['counter', 'flag'], ['todoListLength'])
      expect(focused.currentState).to.deep.equal({
         counter: state.counter,
         flag: state.flag,
         todoListLength: 3
      })
   })

   describe('fields-focused store', () => {
      let fieldsFocusedStore: Store<{ flag: boolean }>
      let fieldsFocusedStateTransitions: number

      beforeEach(() => {
         fieldsFocusedStore = store.focusFields('flag')
         fieldsFocusedStore.state$.subscribe(state => ++fieldsFocusedStateTransitions)
         fieldsFocusedStateTransitions = 0
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         store.updateFields({
            counter: c => c + 1
         })
         expect(fieldsFocusedStateTransitions).to.equal(0)
      })
   })

   describe('fields-focused computed store', () => {
      let fieldsFocusedStore: ComputedStore<{ flag: boolean }, { todoListLength: number }>
      let fieldsFocusedStateTransitions: number

      beforeEach(() => {
         fieldsFocusedStore = store.focusFields(['flag'], ['todoListLength'])
         fieldsFocusedStore.state$.subscribe(state => ++fieldsFocusedStateTransitions)
         fieldsFocusedStateTransitions = 0
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         store.updateFields({
            counter: c => c + 1
         })
         expect(fieldsFocusedStateTransitions).to.equal(0)
      })
   })

   it('throws error when recomposing with function', () => {
      expect(() => store.recompose(() => null)).to.throw()
   })

   it('can recompose', () => {
      const recomposed = store.recompose({
         todoList: lens.focusPath('todo', 'list')
      })
      expect(recomposed.currentState).to.deep.equal({ todoList: state.todo.list })
      expect(recomposed.currentState.todoList).to.deep.equal(state.todo.list)
   })

   it('can recompose with computed values', () => {
      const recomposed = store.recompose({
         todoList: lens.focusPath('todo', 'list')
      }, ['todoListLength'])
      expect(recomposed.currentState).to.deep.equal({ todoList: state.todo.list, todoListLength: 3 })
      expect(recomposed.currentState.todoList).to.deep.equal(state.todo.list)
   })

   describe('recomposed store', () => {
      let recomposedStore: Store<{ todoList: TodoItem[] }>
      let recomposedStateTransitions: number

      beforeEach(() => {
         recomposedStore = store.recompose({
            todoList: todoListLens
         })
         recomposedStore.state$.subscribe(state => ++recomposedStateTransitions)
         recomposedStateTransitions = 0
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         store.updateFields({
            counter: c => c + 1
         })
         expect(recomposedStateTransitions).to.equal(0)
      })
   })

   describe('recomposed computed store', () => {
      let recomposedStore: ComputedStore<{ todoList: TodoItem[] }, { todoListLength: number }>
      let recomposedStateTransitions: number

      beforeEach(() => {
         recomposedStore = store.recompose({
            todoList: todoListLens
         }, ['todoListLength'])
         recomposedStore.state$.subscribe(state => ++recomposedStateTransitions)
         recomposedStateTransitions = 0
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         store.updateFields({
            counter: c => c + 1
         })
         expect(recomposedStateTransitions).to.equal(0)
      })
   })
})
