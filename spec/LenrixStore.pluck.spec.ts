import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State, TodoItem } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .computeFromFields(['todo'], ({ todo }) => ({
         todoListLength: todo.list.length
      }))
      .actionTypes<{ toggleFlag: void }>()
      .updates(_ => ({
         toggleFlag: () => _.focusPath('flag').update(flag => !flag)
      }))

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.pluck()', () => {
   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let store: RootStore
   let state: State

   beforeEach(() => {
      store = createRootStore()
      store.state$.subscribe(newState => (state = newState))
   })

   it('can pluck field', () => {
      const counter$ = store.pluck('counter')
      let counterValue = 0
      counter$.subscribe(counter => (counterValue = counter))
      expect(counterValue).to.equal(42)
   })

   it('can pluck path', () => {
      const list$ = store.pluck('todo', 'list')
      let list: TodoItem[] = []
      list$.subscribe(l => (list = l))
      expect(list).to.equal(initialState.todo.list)
   })

   it('can pluck computed value', () => {
      let lengths: number | undefined
      store.pluck('todoListLength').subscribe(l => (lengths = l))
      expect(lengths).to.equal(3)
   })

   it('does not emit when updating unrelated slice of parent state', () => {
      const counter$ = store.pluck('counter')
      let transitions = 0
      counter$.subscribe(() => ++transitions)

      store.dispatch({ toggleFlag: undefined })

      expect(transitions).to.equal(1)
   })
})
