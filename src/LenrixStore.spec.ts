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

   // FOCUS //
   //////////

   // it('can focus path with spread keys', () => {
   //    const focused = store.focusPath('todo', 'list')
   //    expect(focused.currentState).to.equal(state.todo.list)
   // })
   //
   // it('can focus path with key array', () => {
   //    const focused = store.focusPath(['todo', 'list'])
   //    expect(focused.currentState).to.equal(state.todo.list)
   // })
   //
   // it('can focus path with computed values', () => {
   //    const focused = store.focusPath(['todo'], ['todoListLength'])
   //    expect(focused.currentState).to.deep.equal({
   //       ...state.todo,
   //       todoListLength: 3
   //    })
   // })
   //
   // it('can focus fields with spread keys', () => {
   //    const focused = store.focusFields('counter', 'flag')
   //    expect(focused.currentState).to.deep.equal({
   //       counter: state.counter,
   //       flag: state.flag
   //    })
   // })
   //
   // it('can focus fields with key array', () => {
   //    const focused = store.focusFields(['counter', 'flag'])
   //    expect(focused.currentState).to.deep.equal({
   //       counter: state.counter,
   //       flag: state.flag
   //    })
   // })
   //
   // it('can focus fields with computedValues', () => {
   //    const focused = store.focusFields(['counter', 'flag'], ['todoListLength'])
   //    expect(focused.currentState).to.deep.equal({
   //       counter: state.counter,
   //       flag: state.flag,
   //       todoListLength: 3
   //    })
   // })
   //
   // it('throws error when recomposing with function', () => {
   //    expect(() => store.recompose(() => null)).to.throw()
   // })
   //
   // it('can recompose', () => {
   //    const recomposed = store.recompose({
   //       todoList: lens.focusPath('todo', 'list')
   //    })
   //    expect(recomposed.currentState).to.deep.equal({ todoList: state.todo.list })
   //    expect(recomposed.currentState.todoList).to.deep.equal(state.todo.list)
   // })
   //
   // it('can recompose with computed values', () => {
   //    const recomposed = store.recompose({
   //       todoList: lens.focusPath('todo', 'list')
   //    }, ['todoListLength'])
   //    expect(recomposed.currentState).to.deep.equal({ todoList: state.todo.list, todoListLength: 3 })
   //    expect(recomposed.currentState.todoList).to.deep.equal(state.todo.list)
   // })
   //
   // describe('recomposed store', () => {
   //    let recomposedStore: Store<{ todoList: TodoItem[] }>
   //    let recomposedStateTransitions: number
   //
   //    beforeEach(() => {
   //       recomposedStore = store.recompose({
   //          todoList: todoListLens
   //       })
   //       recomposedStore.state$.subscribe(state => ++recomposedStateTransitions)
   //       recomposedStateTransitions = 0
   //    })
   //
   //    it('does not emit new state when unrelated slice of parent state changes', () => {
   //       store.updateFields({
   //          counter: c => c + 1
   //       })
   //       expect(recomposedStateTransitions).to.equal(0)
   //    })
   // })
   //
   // describe('recomposed computed store', () => {
   //    let recomposedStore: ComputedStore<{ todoList: TodoItem[] }, { todoListLength: number }>
   //    let recomposedStateTransitions: number
   //
   //    beforeEach(() => {
   //       recomposedStore = store.recompose({
   //          todoList: todoListLens
   //       }, ['todoListLength'])
   //       recomposedStore.state$.subscribe(state => ++recomposedStateTransitions)
   //       recomposedStateTransitions = 0
   //    })
   //
   //    it('does not emit new state when unrelated slice of parent state changes', () => {
   //       store.updateFields({
   //          counter: c => c + 1
   //       })
   //       expect(recomposedStateTransitions).to.equal(0)
   //    })
   // })


   /////////////
   // UPDATE //
   ///////////

   // describe('.reset()', () => {
   //    it('sets state to initial state', () => {
   //       store.setFieldValues({ counter: 0 })
   //       store.reset()
   //       expect(state).to.equal(initialState)
   //       expect(state).to.deep.equal(initialState)
   //    })
   //
   //    it('does not trigger state transition when already to initial state', () => {
   //       store.reset()
   //       expect(stateTransitions).to.equal(0)
   //    })
   // })
   //
   // describe('.setValue()', () => {
   //    it('can set new state', () => {
   //       store.setValue({
   //          ...initialState,
   //          counter: 12
   //       })
   //       expect(state.counter).to.equal(12)
   //    })
   //
   //    it('does not trigger state transition when same state', () => {
   //       store.setValue(state)
   //       expect(stateTransitions).to.equal(0)
   //    })
   // })
   //
   // describe('.update()', () => {
   //    it('can update state', () => {
   //       store.update(state => ({
   //          ...state,
   //          counter: 21
   //       }))
   //       expect(state.counter).to.equal(21)
   //    })
   //
   //    it('does not trigger state transition when updater returns same state', () => {
   //       store.update(state => state)
   //       expect(stateTransitions).to.equal(0)
   //    })
   // })
   //
   // describe('.setFieldValues()', () => {
   //    it('can set new field values', () => {
   //       store.setFieldValues({
   //          counter: 24
   //       })
   //       expect(state.counter).to.equal(24)
   //    })
   //
   //    it('does not trigger state transition when same field value', () => {
   //       store.setFieldValues({
   //          counter: state.counter
   //       })
   //       expect(stateTransitions).to.equal(0)
   //    })
   // })
   //
   // describe('.updateFields()', () => {
   //    it('can update fields', () => {
   //       store.updateFields({
   //          counter: value => ++value
   //       })
   //       expect(state.counter).to.equal(43)
   //    })
   //
   //    it('does not trigger state transition when updaters return same value', () => {
   //       store.updateFields({
   //          counter: value => value
   //       })
   //       expect(stateTransitions).to.equal(0)
   //    })
   // })
   //
   // describe('.updateFieldValues()', () => {
   //    it('can update field values', () => {
   //       store.updateFieldValues(state => ({
   //          counter: state.counter + 1
   //       }))
   //       expect(state.counter).to.equal(43)
   //    })
   //
   //    it('does not trigger state transition when fields updater returns same value', () => {
   //       store.updateFieldValues(state => ({
   //          counter: state.counter
   //       }))
   //       expect(stateTransitions).to.equal(0)
   //    })
   // })
   //
   // describe('.pipe()', () => {
   //    it('can pipe updaters', () => {
   //       const increment = lens.focusOn('counter').update(value => ++value)
   //       store.pipe(
   //          increment,
   //          increment,
   //          increment
   //       )
   //       expect(state.counter).to.equal(45)
   //       expect(stateTransitions).to.equal(1)
   //    })
   //
   //    it('does not trigger state transitions when all updaters returns same value', () => {
   //       const identity = lens.focusOn('counter').update(value => value)
   //       store.pipe(
   //          identity,
   //          identity,
   //          identity
   //       )
   //       expect(state.counter).to.equal(42)
   //       expect(stateTransitions).to.equal(0)
   //    })
   // })

   ////////////
   // FOCUS //
   //////////


   ////////////
   // FOCUS //
   //////////

   // it('can focus on array field', () => {
   //    let todoList: TodoItem[] = []
   //    store.focusOn('list').state$.subscribe(value => todoList = value)
   //    expect(todoList).to.equal(state.list)
   // })
   //
   // it('can focus on primitive field', () => {
   //    let count = 0
   //    store.focusOn('count').state$.subscribe(value => count = value)
   //    expect(count).to.equal(state.count)
   // })
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
