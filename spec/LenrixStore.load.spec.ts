import { expect } from 'chai'
import { Observable, Subject } from 'rxjs'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'

const createRootStore = (result$: Observable<'result'>) =>
   createStore({}, { logger: silentLoggerOptions }).load({
      result: result$
   })

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.load()', () => {
   let result$: Subject<'result'>
   let rootStore: RootStore
   beforeEach(() => {
      result$ = new Subject()
      rootStore = createRootStore(result$)
   })
   it('is initially loading', () => {
      const state = rootStore.currentState
      expect(state.status).to.equal('loading')
      expect(state.data.result).to.be.undefined
   })
   describe('when received result', () => {
      beforeEach(() => {
         result$.next('result')
      })
      it('is loaded', () => {
         const state = rootStore.currentState
         expect(state.status).to.equal('loaded')
         if (state.status === 'loaded') {
            const result: 'result' = state.data.result
         }
         expect(state.loadableValues.result.value).to.equal('result')
         expect(state.data.result).to.equal('result')
      })
   })
})
