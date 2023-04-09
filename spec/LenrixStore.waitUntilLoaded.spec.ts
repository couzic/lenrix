import { expect } from 'chai'
import { Observable, Subject, map } from 'rxjs'
import { stub } from 'sinon'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'

interface State {
   name: string
   todo: {
      input: string
      list: string[]
   }
   flag: boolean
}

const initialState: State = {
   name: '',
   todo: {
      input: '',
      list: []
   },
   flag: false
}

interface Result {
   toto: 'tata'
}

interface ChildResult {
   childResultField: 'childResultFieldValue'
}

const createRootStore = (
   loadFromName: (_: { name: string }) => Observable<Result>
) =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{ setName: string; setFlag: boolean }>()
      .updates(_ => ({
         setName: _.focusPath('name').setValue(),
         setFlag: _.focusPath('flag').setValue()
      }))
      .loadFromFields(['name'], loadFromName)

type RootStore = ReturnType<typeof createRootStore>

const createWaitingStore = (rootStore: RootStore) => rootStore.waitUntilLoaded()

type WaitingStore = ReturnType<typeof createWaitingStore>

describe('LenrixStore.waitUntilLoaded()', () => {
   let result$: Subject<Result>
   let rootStore: RootStore
   let loadFromName: (_: { name: string }) => Observable<Result>
   let waitingStore: WaitingStore
   beforeEach(() => {
      result$ = new Subject()
      loadFromName = stub().returns(result$)
      rootStore = createRootStore(loadFromName)
      waitingStore = createWaitingStore(rootStore)
   })
   it('is initially loading', () => {
      const data = rootStore.currentData
      expect(data.status).to.equal('loading')
      expect(data.state).to.deep.equal(rootStore.currentState)
   })
   describe('waiting store', () => {
      it('does not emit state', () => {
         waitingStore.data$.subscribe(() => {
            throw new Error('should not emit state')
         })
         waitingStore.state$.subscribe(() => {
            throw new Error('should not emit state')
         })
         const data = waitingStore.currentData
         if (data.status === 'initial') {
            const toto: undefined = data.state.toto
         }
         if (data.status === 'loading') {
            const toto: undefined = data.state.toto
         }
         if (data.status === 'loaded') {
            const toto: 'tata' = data.state.toto
         }
         if (data.status === 'error') {
            const toto: undefined = data.state.toto
            const e: Error = data.error
         }
         const state = waitingStore.currentState
         const tata: 'tata' | undefined = state.toto
         expect(tata).to.be.undefined
      })
      describe('when received result', () => {
         let emittedData: (typeof waitingStore)['currentData']
         let emittedState: (typeof waitingStore)['currentState']
         beforeEach(() => {
            result$.next({ toto: 'tata' })
         })
         it('emits loadable data', () => {
            waitingStore.data$.subscribe(data => {
               const tata: 'tata' = data.state.toto
               emittedData = data
            })
            expect(emittedData.state.toto).to.equal('tata')
            const data = waitingStore.currentData
            expect(data.status).to.equal('loaded')
            if (data.status === 'loaded') {
               const tata: 'tata' = data.state.toto
            }
            expect(data.state.toto).to.equal('tata')
         })
         it('emits state', () => {
            const state = waitingStore.currentState
            expect(state.toto).to.equal('tata')
            waitingStore.state$.subscribe(state => {
               const tata: 'tata' = state.toto
               emittedState = state
            })
            expect(emittedState.toto).to.equal('tata')
         })
      })
      describe('when child loading store created', () => {
         let childResult$: Subject<ChildResult>
         let childResultLoader: () => Observable<{ childResult: ChildResult }>
         const createChildLoadingStore = (
            waitingStore: WaitingStore,
            childResultLoader: any
         ) => waitingStore.loadFromFields(['toto'], childResultLoader)
         type ChildLoadingStore = ReturnType<typeof createChildLoadingStore>
         let childLoadingStore: ChildLoadingStore
         beforeEach(() => {
            childResult$ = new Subject()
            childResultLoader = stub().returns(
               childResult$.pipe(map(childResult => ({ childResult })))
            )
            childLoadingStore = createChildLoadingStore(
               waitingStore,
               childResultLoader
            )
         })
         it('does not load yet', () => {
            expect(rootStore.currentData.status).to.equal('loading')
            expect(waitingStore.currentData.status).to.equal('loading')
            expect(childLoadingStore.currentData.status).to.equal('loading')
            expect(childResultLoader).not.to.have.been.called
         })
         describe('when only waiting store result received', () => {
            beforeEach(() => {
               result$.next({ toto: 'tata' })
            })
            it('is loading', () => {
               expect(waitingStore.currentData.status).to.equal('loaded')
               expect(childLoadingStore.currentData.status).to.equal('loading')
            })
         })
         describe('when only child store result received', () => {
            beforeEach(() => {
               childResult$.next({ childResultField: 'childResultFieldValue' })
            })
            it('is still loading', () => {
               expect(rootStore.currentData.status).to.equal('loading')
               expect(childLoadingStore.currentData.status).to.equal('loading')
            })
         })
         describe('when both root and child store result received', () => {
            beforeEach(() => {
               result$.next({ toto: 'tata' })
               childResult$.next({ childResultField: 'childResultFieldValue' })
            })
            it('is loaded', () => {
               expect(childLoadingStore.currentData.status).to.equal('loaded')
            })
         })
      })
   })
})
