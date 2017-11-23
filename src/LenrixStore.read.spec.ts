import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

describe('LenrixStore', () => {

   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let store: Store<{ state: State }>
   let state: State

   beforeEach(() => {
      store = createStore(initialState)
      store.state$.subscribe(newState => state = newState)
   })

   describe('.pluck()', () => {
      it('can pluck field', () => {
         const counter$ = store.pluck('counter')
         let counterValue = 0
         counter$.subscribe(counter => counterValue = counter)
         expect(counterValue).to.equal(42)
      })

      // it('can pluck path', () => { // TODO Implement
      //    const list$ = store.pluck('todo', 'list')
      //    let list: TodoItem[] = []
      //    list$.subscribe(l => list = l)
      //    expect(list).to.equal(initialState.todo.list)
      // })

      it('does not emit when updating unrelated slice of parent state', () => {
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
         let counterPick = {} as any
         counterPick$.subscribe(value => counterPick = value)
         expect(counterPick).to.deep.equal({ counter: 42 })
      })

      it('does not emit when updating unrelated slice of parent state', () => {
         const counter$ = store.pick('counter')
         let transitions = 0
         counter$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })
   })

   describe('.cherryPick()', () => {
      it('throws error when given a function', () => {
         expect(() => store.cherryPick(() => null)).to.throw('does not accept functions as arguments')
      })

      it('extracts field by Lens', () => {
         const extracted$ = store.cherryPick({ todoList: todoListLens })
         extracted$.subscribe(extracted => {
            expect(extracted).to.deep.equal({ todoList: state.todo.list })
            expect(extracted.todoList).to.equal(state.todo.list)
         })
      })

      it('does not emit when updating unrelated slice of parent state', () => {
         const todoList$ = store.cherryPick({
            todoList: todoListLens
         })
         let transitions = 0
         todoList$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })
   })

})
