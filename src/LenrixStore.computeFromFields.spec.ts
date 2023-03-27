import { expect } from 'chai'

import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

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

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{
         toggleFlag: void
         addToList: string
      }>()
      .updates(_ => ({
         toggleFlag: () => _.focusPath('flag').update(flag => !flag),
         addToList: name =>
            _.focusPath('todo', 'list').update(list => [...list, name])
      }))

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.computeFromFields()', () => {
   let store: RootStore
   let state: State
   let computedState: State & { todoListLength: number }
   let computations: number
   let stateTransitions: number
   let computedStateTransitions: number
   const createComputedStore = (store: RootStore) =>
      store.computeFromFields(['name', 'todo'], ({ todo }) => {
         ++computations
         return {
            todoListLength: todo.list.length
         }
      })
   let computedStore: ReturnType<typeof createComputedStore>
   beforeEach(() => {
      computations = 0
      stateTransitions = 0
      computedStateTransitions = 0
      store = createRootStore()
      computedStore = createComputedStore(store)
      computedStore.state$.subscribe(s => {
         state = s
         ++stateTransitions
      })
      computedStore.state$.subscribe(s => {
         computedState = s
         ++computedStateTransitions
      })
   })

   it('initially has state in current state', () => {
      expect(computedStore.currentState.name).to.equal(initialState.name)
   })

   it('initially has state in state stream', () => {
      expect(state.name).to.equal(initialState.name)
   })

   it('initially emits normalized state only once', () => {
      expect(stateTransitions).to.equal(1)
   })

   it('initially has computed values in current computed state', () => {
      expect(computedStore.currentState.todoListLength).to.equal(
         initialState.todo.list.length
      )
   })

   it('initially has computed values in computed state stream', () => {
      expect(computedState.todoListLength).to.deep.equal(0)
   })

   it('initially computes initial values once only', () => {
      expect(computations).to.equal(1)
   })

   it('initially emits computed state only once', () => {
      expect(computedStateTransitions).to.equal(1)
   })

   it('does not compute values when unselected fields change', () => {
      computedStore.dispatch({ toggleFlag: undefined })
      expect(computations).to.equal(1)
   })

   it('recomputes values when selected fields change', () => {
      expect(computations).to.equal(1)
      computedStore.dispatch({ addToList: 'Bob' })
      expect(computations).to.equal(2)
      expect(stateTransitions).to.equal(2)
      expect(computedStateTransitions).to.equal(2)
   })

   it('emits new state when updated even if no computation is triggered', () => {
      expect(stateTransitions).to.equal(1)
      computedStore.dispatch({ toggleFlag: undefined })
      expect(computations).to.equal(1)
      expect(stateTransitions).to.equal(2)
      expect(computedStateTransitions).to.equal(2)
   })

   it('has access to light store with currentState', () => {
      const cs = store.computeFromFields(['flag'], (s, lightStore) => ({
         computed: lightStore.currentState.todo
      }))
      expect(cs.currentState.computed).to.equal(store.currentState.todo)
   })

   /////////////////////
   // RUNTIME CHECKS //
   ///////////////////

   it('throws error when computing values with higher order function', () => {
      expect(() => store.computeFromFields([], () => () => null)).to.throw(
         'does not accept higher order functions'
      )
   })

   it('throws error when dispatching action on light store', () => {
      expect(() =>
         store.computeFromFields(['flag'], (s, lightStore) => {
            ;(lightStore as any).dispatch({ toggleFlag: undefined })
            return {
               computed: lightStore.currentState.todo
            }
         })
      ).to.throw()
   })

   it('throws error when computer does not return', () => {
      expect(() =>
         store.computeFromFields(['flag'], (() => {
            // Never return
         }) as any)
      ).to.throw()
   })
})
