import { expect } from 'chai'
import { initialState, State } from '../test/State'
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

   describe('.cherryPick()', () => {
      it('throws error when given a function', () => {
         expect(() => store.cherryPick(() => null)).to.throw()
      })
      it('extracts field by Lens', () => {
         const extracted$ = store.cherryPick({ todoList: todoListLens })
         extracted$.subscribe(extracted => {
            expect(extracted).to.deep.equal({ todoList: state.todo.list })
            expect(extracted.todoList).to.equal(state.todo.list)
         })
      })
      it('returns Observables that do not emit when non-extracted slices are updated', () => {
         const todoList$ = store.cherryPick({
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
      const focused = store.focusPath('todo', 'list')
      expect(focused.currentState).to.equal(state.todo.list)
   })
})
