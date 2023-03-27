import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{ toggleFlag: void }>()
      .updates(_ => ({
         toggleFlag: () => _.focusPath('flag').update(flag => !flag)
      }))

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.pick()', () => {
   const lens = createLens<State>()
   const todoListLens = lens.focusPath('todo', 'list')

   let store: RootStore
   let state: State

   beforeEach(() => {
      store = createRootStore()
      store.state$.subscribe(newState => (state = newState))
      store.currentLoadableData.status
   })

   it('picks fields', () => {
      const counterPick$ = store.pick('counter')
      let counterPick = {} as any
      counterPick$.subscribe(value => (counterPick = value))
      expect(counterPick).to.deep.equal({ counter: 42 })
   })

   it('does not emit when updating unrelated slice of parent state', () => {
      const counter$ = store.pick('counter')
      let transitions = 0
      counter$.subscribe(() => ++transitions)

      store.dispatch({ toggleFlag: undefined })

      expect(transitions).to.equal(1)
   })
})
