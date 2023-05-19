import { expect } from 'chai'
import { NEVER, Observable } from 'rxjs'
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
      let picked$ = store.pick('counter')
      picked$.subscribe(state => {
         picked = state
      })
      expect(picked.data).to.deep.equal({ counter: 42 })
   })

   it('does not emit when updating unrelated slice of parent state', () => {
      const counter$ = store.pick('counter')
      let transitions = 0
      counter$.subscribe(() => ++transitions)

      store.dispatch({ toggleFlag: undefined })

      expect(transitions).to.equal(1)
   })

   describe('when picking loading and computed fields', () => {
      let picked: any
      const createComputingStore = (store: RootStore) =>
         store
            .loadFromFields(['counter'], {
               loadedCounter: () => NEVER as Observable<{ counter: number }>
            })
            .computeFromFields(['todo'], {
               todoListLength: ({ todo }) => todo.list.length
            })

      let computingStore: ReturnType<typeof createComputingStore>
      beforeEach(() => {
         computingStore = createComputingStore(store)
         computingStore
            .pick('loadedCounter', 'todoListLength')
            .subscribe(value => {
               picked = value
            })
         store.action('toggleFlag')()
      })
      it('emits both', () => {
         expect(picked.data).to.deep.equal({
            todoListLength: 3,
            loadedCounter: undefined
         })
      })
   })
})
