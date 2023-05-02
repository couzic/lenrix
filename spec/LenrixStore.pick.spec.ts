import { expect } from 'chai'
import { delay, of } from 'rxjs'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'
import { initialState } from './State'

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{ toggleFlag: void }>()
      .updates(_ => ({
         toggleFlag: () => _.focusPath('flag').update(flag => !flag)
      }))

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.pick()', () => {
   let store: RootStore

   beforeEach(() => {
      store = createRootStore()
   })

   it('picks fields from normalized state', () => {
      let picked = {} as any
      store.pick('counter').subscribe(value => (picked = value))
      expect(picked.state).to.deep.equal({ counter: 42 })
   })

   it('does not emit when updating unrelated slice of parent state', () => {
      const counter$ = store.pick('counter')
      let transitions = 0
      counter$.subscribe(() => ++transitions)

      store.dispatch({ toggleFlag: undefined })

      expect(transitions).to.equal(1)
   })

   describe('when picking values computed from loading fields', () => {
      const createComputingStore = (store: RootStore) =>
         store
            .loadFromFields(['counter'], ({ counter }) =>
               of({ loadedCounter: counter }).pipe(delay(1000))
            )
            .computeFromFields(['todo'], ({ todo }) => ({
               todoListLength: todo.list.length
            }))

      let computingStore: ReturnType<typeof createComputingStore>
      beforeEach(() => {
         computingStore = createComputingStore(store)
      })
      it('', () => {
         let picked = {} as any
         computingStore
            .pick('todoListLength')
            .subscribe(value => (picked = value))
         console.log(picked)
      })
   })
})
