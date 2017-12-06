import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

describe('LenrixStore.cherryPick()', () => {

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
      store = createStore(initialState, { logger: silentLoggerOptions })
         .actionTypes<{ toggleFlag: void }>()
         .updates(_ => ({ toggleFlag: () => _.focusPath('flag').update(flag => !flag) }))
      store.state$.subscribe(newState => state = newState)
   })

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

      store.dispatch({ toggleFlag: undefined })

      expect(transitions).to.equal(1)
   })

})
