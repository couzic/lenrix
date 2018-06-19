import { expect } from 'chai'

import { initialState } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{
         incrementCounter: void
      }>()
      .updates(_ => ({
         incrementCounter: () =>
            _.focusPath('counter').update(count => count + 1)
      }))

describe('LenrixStore.filter()', () => {
   describe('when predicate tests state', () => {
      const createFilteredStore = () =>
         createRootStore().filter(({ counter }) => counter > 43)
      let store: ReturnType<typeof createFilteredStore>

      beforeEach(() => {
         store = createFilteredStore()
      })

      it('prevents data flow when predicate is false', () => {
         expect(store.currentState.counter).to.equal(42)

         store.dispatch({ incrementCounter: undefined })

         expect(store.currentState.counter).to.equal(42)
      })

      it('allows data flow when predicate is true', () => {
         expect(store.currentState.counter).to.equal(42)

         store.dispatch({ incrementCounter: undefined })
         store.dispatch({ incrementCounter: undefined })

         expect(store.currentState.counter).to.equal(44)
      })
   })

   describe('when predicate tests computed value', () => {
      const createFilteredStore = () =>
         createRootStore()
            .compute(({ counter }) => ({ negativeCounter: -counter }))
            .filter(({ negativeCounter }) => negativeCounter < -43)
      let store: ReturnType<typeof createFilteredStore>

      beforeEach(() => {
         store = createFilteredStore()
      })

      it('prevents data flow when predicate is false', () => {
         expect(store.currentComputedState.negativeCounter).to.equal(-42)

         store.dispatch({ incrementCounter: undefined })

         expect(store.currentComputedState.negativeCounter).to.equal(-42)
      })

      it('allows data flow when predicate is true', () => {
         expect(store.currentComputedState.negativeCounter).to.equal(-42)

         store.dispatch({ incrementCounter: undefined })
         store.dispatch({ incrementCounter: undefined })

         expect(store.currentComputedState.negativeCounter).to.equal(-44)
      })
   })
})
