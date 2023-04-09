import { expect } from 'chai'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'
import { initialState } from './State'

interface Actions {
   navigateTo: { url: string }
}

const createRootStore = () =>
   createStore(initialState, {
      logger: silentLoggerOptions
   }).actionTypes<Actions>()

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.sideEffects()', () => {
   let rootStore: RootStore

   beforeEach(() => {
      rootStore = createRootStore()
   })

   it('triggers side effect', () => {
      let flag = false
      const toggleFlag = () => (flag = !flag)
      rootStore.sideEffects({
         navigateTo: toggleFlag
      })

      rootStore.dispatch({ navigateTo: { url: 'whatever' } })

      expect(flag).to.equal(true)
   })

   it('has access to payload', () => {
      let gotUrl = ''
      rootStore.sideEffects({
         navigateTo: ({ url }) => (gotUrl = url)
      })

      rootStore.dispatch({ navigateTo: { url: 'url' } })

      expect(gotUrl).to.equal('url')
   })

   it('has readonly access to store', () => {
      rootStore.sideEffects({
         navigateTo: (payload, store) =>
            expect(store.currentState).to.deep.equal(rootStore.currentState)
      })
      rootStore.dispatch({ navigateTo: { url: 'url' } })
   })
})
