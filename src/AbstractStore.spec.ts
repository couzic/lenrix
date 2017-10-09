import { expect } from 'chai'
import { initialState, State, TodoItem } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'
import { createLens } from 'immutable-lens'

describe('AbstractStore', () => {

   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let store: Store<State>
   let state: State
   let stateTransitions: number

   beforeEach(() => {
      store = createStore(initialState)
      stateTransitions = 0
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
   })

   ///////////
   // READ //
   /////////

   it('can pluck field', () => {
      const counter$ = store.pluck('counter')
      let counterValue = 0
      counter$.subscribe(counter => counterValue = counter)
      expect(counterValue).to.equal(42)
   })

   describe('when updating unrelated slice of State', () => {

      it('does not trigger .map() returned Observables to emit', () => {
         const counter$ = store.map(state => state.counter)
         let transitions = 0
         counter$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })

      it('does not trigger .pluck() returned Observables to emit', () => {
         const counter$ = store.pluck('counter')
         let transitions = 0
         counter$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })
   })

   describe('.pick()', () => {
      it('picks fields', () => {
         const counterPick$ = store.pick('counter')
         counterPick$.subscribe(counterPick => expect(counterPick).to.deep.equal({ counter: 42 }))
      })
      it('returns Observables that do not emit when omitted keys are updated', () => {
         const counter$ = store.pick('counter')
         let transitions = 0
         counter$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })
   })

   describe('.extract()', () => {
      it('throws error when given a function', () => {
         expect(() => store.extract(() => null)).to.throw()
      })
      it('extracts field by Lens', () => {
         const extracted$ = store.extract({ todoList: todoListLens })
         extracted$.subscribe(extracted => {
            expect(extracted).to.deep.equal({ todoList: state.todo.list })
            expect(extracted.todoList).to.equal(state.todo.list)
         })
      })
      it('returns Observables that do not emit when non-extracted slices are updated', () => {
         const todoList$ = store.extract({
            todoList: todoListLens
         })
         let transitions = 0
         todoList$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })
   })

   ////////////
   // FOCUS //
   //////////

   it('can focus path', () => {
      let todoList: TodoItem[] = []
      store.focusPath('todo', 'list').state$.subscribe(val => todoList = val)
      expect(todoList).to.equal(state.todo.list)
   })
})