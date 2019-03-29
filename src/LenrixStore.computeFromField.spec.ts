import { expect } from 'chai'

import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

interface State {
   name: string
}

const initialState: State = { name: 'Bob' }

const createTestStore = () =>
   createStore(initialState, { logger: silentLoggerOptions }).computeFromField(
      'name',
      name => ({ nameLength: name.length })
   )

type TestStore = ReturnType<typeof createTestStore>

describe('LenrixStore.computeFromField()', () => {
   let store: TestStore
   beforeEach(() => {
      store = createTestStore()
   })

   it('initially has computed value in current state', () => {
      expect(store.currentState.nameLength).to.equal(initialState.name.length)
   })
})
