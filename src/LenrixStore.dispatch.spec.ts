import { expect } from 'chai'

import { initialState } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

interface Actions {
   doThis: void
   doThat: void
}

const createRootStore = () =>
   createStore(initialState, {
      logger: silentLoggerOptions
   }).actionTypes<Actions>()

describe('LenrixStore.dispatch()', () => {
   let rootStore: ReturnType<typeof createRootStore>

   beforeEach(() => {
      rootStore = createRootStore()
   })

   it('throws error when dispatching two action types in same object', () => {
      expect(() =>
         rootStore.dispatch({ doThis: undefined, doThat: undefined })
      ).to.throw()
   })
})
