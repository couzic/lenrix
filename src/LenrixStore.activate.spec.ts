import { expect } from 'chai'
import { SinonStub, stub } from 'sinon'

import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

const initialState = {}

const createTestStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
type TestStore = ReturnType<typeof createTestStore>

describe('LenrixStore.activate()', () => {
   let store: TestStore
   beforeEach(() => {
      store = createTestStore()
   })
   describe('given two registered activation callbacks', () => {
      let callback1: SinonStub
      let callback2: SinonStub
      beforeEach(() => {
         callback1 = stub()
         callback2 = stub()
         store.onActivate(callback1)
         store.onActivate(callback2)
      })
      it('does not call registered callbacks yet', () => {
         expect(callback1).not.to.have.been.called
         expect(callback2).not.to.have.been.called
      })
      describe('when store is activated', () => {
         beforeEach(() => {
            store.activate()
         })
         it('calls registered callbacks', () => {
            expect(callback1).to.have.been.calledOnceWithExactly(store)
            expect(callback2).to.have.been.calledOnceWithExactly(store)
         })
      })
   })
})
