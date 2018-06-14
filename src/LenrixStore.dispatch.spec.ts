import { expect } from 'chai'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

interface Actions {
   doThis: void
   doThat: void
}

describe('LenrixStore.dispatch()', () => {
   let rootStore: Store<{
      state: State
      computedValues: {}
      actions: Actions
      dependencies: {}
   }>

   beforeEach(() => {
      rootStore = createStore(initialState, {
         logger: silentLoggerOptions
      }).actionTypes<Actions>()
   })

   it('throws error when dispatching two action types in same object', () => {
      expect(() =>
         rootStore.dispatch({ doThis: undefined, doThat: undefined })
      ).to.throw()
   })
})
