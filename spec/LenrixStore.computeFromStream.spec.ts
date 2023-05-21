import { expect } from 'chai'
import { Observable, Subject } from 'rxjs'
import { stub } from 'sinon'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'

const createRootStore = (
   input$: Observable<string>,
   computeFromInput: (input: string) => 'result'
) =>
   createStore({}, { logger: silentLoggerOptions }).computeFromStream(input$, {
      computed: computeFromInput
   })

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.computeFromStream()', () => {
   let rootStore: RootStore
   let input$: Subject<string>
   let computeFromInput: (input: string) => 'result'
   beforeEach(() => {
      input$ = new Subject()
      computeFromInput = stub().returns('result')
      rootStore = createRootStore(input$, computeFromInput)
   })
   it('initially does not call computer', () => {
      const state = rootStore.currentState
      expect(state.status).to.equal('loading')
      expect(state.data.computed).to.be.undefined
      expect(computeFromInput).not.to.have.been.called
   })
   // TODO ensure no double execution (share input$)
   describe('when input stream emits', () => {
      beforeEach(() => {
         input$.next('a')
      })
      it('computes', () => {
         const state = rootStore.currentState
         expect(state.status).to.equal('loaded')
         expect(state.data.computed).to.equal('result')
      })
   })
})
