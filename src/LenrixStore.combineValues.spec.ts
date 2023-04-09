import { expect } from 'chai'
import { Subject, of } from 'rxjs'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

interface State {
   flag: boolean
}

const initialState: State = {
   flag: false
}

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{ setFlag: boolean }>()
      .updates(_ => ({
         setFlag: _.focusPath('flag').setValue()
      }))

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.combineValues()', () => {
   let rootStore: RootStore

   beforeEach(() => {
      rootStore = createRootStore()
   })

   it('combines simple observable', () => {
      const store = rootStore.combineValues(of({ user: 'name' }))
      expect(store.currentState.user).to.equal('name')
   })

   it('combines delayed observable', () => {
      const subject = new Subject<{ user: string }>()
      const store = rootStore.combineValues(subject)
      let dataEmissions = 0
      let stateEmissions = 0
      store.data$.subscribe(data => {
         ++dataEmissions
         const user: string = data.state.user
      })
      expect(dataEmissions).to.equal(0)
      store.state$.subscribe(state => {
         ++stateEmissions
         const user: string = state.user
      })
      expect(stateEmissions).to.equal(0)

      const userFromData: string | undefined = store.currentData.state.user
      if (store.currentData.state.user !== undefined) {
         const user: string = store.currentData.state.user
      }
      // @ts-expect-error
      const userFromData_nonNullable: string = store.currentData.state.user
      expect(store.currentData.state.user).to.be.undefined

      const userFromState: string | undefined = store.currentState.user
      // @ts-expect-error
      const userFromState_nonNullable: string = store.currentState.user
      expect(store.currentState.user).to.be.undefined

      subject.next({ user: 'name' })
      expect(stateEmissions).to.equal(1)
      expect(store.currentData.state.user).to.equal('name')
      expect(store.currentState.user).to.equal('name')
   })
})
