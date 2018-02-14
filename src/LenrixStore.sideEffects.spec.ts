import { expect } from 'chai'
import { createLens } from 'immutable-lens'

import { initialState, State } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

interface Actions {
   navigateTo: { url: string }
}

describe('LenrixStore.sideEffects()', () => {

   let rootStore: Store<{
      state: State
      computedValues: {}
      actions: Actions
      dependencies: {}
   }>

   beforeEach(() => {
      rootStore = createStore(initialState, { logger: silentLoggerOptions })
         .actionTypes<Actions>()
   })

   it('triggers side effect', () => {
      let flag = false
      const toggleFlag = () => flag = !flag
      rootStore.sideEffects({
         navigateTo: toggleFlag
      })

      rootStore.dispatch({ navigateTo: { url: 'whatever' } })

      expect(flag).to.equal(true)
   })

})
