import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { ComputedStore } from './'
import { createStore } from './createStore'
import { Store } from './Store'

interface State {
   name: string
   todo: {
      input: string
      list: string[]
   }
   flag: boolean
}

const initialState: State = {
   name: '',
   todo: {
      input: '',
      list: []
   },
   flag: false
}

describe('LenrixStore.computeFrom()', () => {

   const lens = createLens<State>()
   let store: Store<State>
   let computedStore: ComputedStore<State, { todoListLength: number }>
   let state: State
   let stateTransitions: number

   beforeEach(() => {
      store = createStore(initialState)
      computedStore = store.computeFrom({
         todoList: store.lens.focusPath('todo', 'list')
      }, selection => ({
         todoListLength: selection.todoList.length
      }))
   })

   it('computes values', () => {
      expect(computedStore.currentState.todoListLength).to.equal(initialState.todo.list.length)
   })

   it('does not compute values when unselected fields change', () => {
      let stateTransitions = 0
      computedStore.state$.subscribe(() => ++stateTransitions)
      expect(stateTransitions).to.equal(1)

      computedStore.updateFields({
         flag: value => !value
      })

      expect(stateTransitions).to.equal(1)
   })

})
