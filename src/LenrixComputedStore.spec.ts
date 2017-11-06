import { expect } from 'chai'
import { initialState, State } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'
import { createLens } from 'immutable-lens'
import { ComputedStore } from './ComputedStore'

interface ComputedValues {
   todoListLength: number
}

describe('LenrixComputedStore', () => {

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

})
