import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State, TodoItem } from '../test/State'
import { createStore } from './createStore'
import { Store } from './Store'

describe('LenrixStore', () => {

   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let store: Store<{
      state: State
      computedValues: {}
      actions: { toggleFlag: void }
      dependencies: {}
   }>
   let state: State

   beforeEach(() => {
      store = createStore(initialState)
         .actionTypes<{ toggleFlag: void }>()
         .actionHandlers(_ => ({ toggleFlag: () => _.focusPath('flag').update(flag => !flag) }))
      store.state$.subscribe(newState => state = newState)
   })

   describe('.pluck()', () => {
      it('can pluck field', () => {
         const counter$ = store.pluck('counter')
         let counterValue = 0
         counter$.subscribe(counter => counterValue = counter)
         expect(counterValue).to.equal(42)
      })

      it('can pluck path', () => {
         const list$ = store.pluck('todo', 'list')
         let list: TodoItem[] = []
         list$.subscribe(l => list = l)
         expect(list).to.equal(initialState.todo.list)
      })

      it('does not emit when updating unrelated slice of parent state', () => {
         const counter$ = store.pluck('counter')
         let transitions = 0
         counter$.subscribe(() => ++transitions)

         store.actions.toggleFlag(undefined)

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

         store.actions.toggleFlag(undefined)

         expect(transitions).to.equal(1)
      })
   })

   describe('.cherryPick()', () => {
      it('throws error when given a higher order function', () => {
         expect(() => store.cherryPick(() => () => null)).to.throw('does not accept')
      })

      it('extracts field by Lens', () => {
         const extracted$ = store.cherryPick(_ => ({ todoList: _.focusPath('todo', 'list') }))
         extracted$.subscribe(extracted => {
            expect(extracted).to.deep.equal({ todoList: state.todo.list })
            expect(extracted.todoList).to.equal(state.todo.list)
         })
      })

      it('does not emit when updating unrelated slice of parent state', () => {
         const todoList$ = store.cherryPick(_ => ({ todoList: _.focusPath('todo', 'list') }))
         let transitions = 0
         todoList$.subscribe(() => ++transitions)

         store.actions.toggleFlag(undefined)

         expect(transitions).to.equal(1)
      })
   })

})
