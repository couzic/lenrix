import { expect } from 'chai'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'

interface Actions {
   changeString: string
   changeNumber: number
}

const createRootStore = () =>
   createStore(
      { s: '', n: 0 },
      {
         logger: silentLoggerOptions
      }
   )
      .actionTypes<Actions>()
      .updates(_ => ({
         changeString: _.focusPath('s').setValue(),
         changeNumber: _.focusPath('n').setValue()
      }))

describe('LenrixStore.dispatch()', () => {
   let rootStore: ReturnType<typeof createRootStore>

   beforeEach(() => {
      rootStore = createRootStore()
   })

   it('accepts multiple actions in single dispatch call', () => {
      rootStore.dispatch({ changeString: 'other', changeNumber: 123 })
      expect(rootStore.currentState).to.deep.equal({ s: 'other', n: 123 })
   })
})
