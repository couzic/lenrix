import { expect } from 'chai'
import { Observable, Subject, map, of } from 'rxjs'
import { stub } from 'sinon'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'

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
      .actionTypes<{
         setName: string
         setFlag: boolean
         setTodoInput: string
      }>()
      .updates(_ => ({
         setName: _.focusPath('name').setValue(),
         setFlag: _.focusPath('flag').setValue(),
         setTodoInput: _.focusPath('todo', 'input').setValue()
      }))
      .loadFromFields(['name'], loadFromName)

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.loadFromFields()', () => {
   let result$: Subject<Result>
   let rootStore: RootStore
   let loadFromName: (_: { name: string }) => Observable<Result>
   beforeEach(() => {
      result$ = new Subject()
      loadFromName = stub().returns(result$)
      rootStore = createRootStore(loadFromName)
   })
   it('is initially loading', () => {
      const data = rootStore.currentData
      expect(data.status).to.equal('loading')
      expect(data.state).to.deep.equal(rootStore.currentState)
   })
   describe('when received result', () => {
      beforeEach(() => {
         result$.next({ toto: 'tata' })
      })
      it('is loaded', () => {
         const data = rootStore.currentData
         expect(data.status).to.equal('loaded')
         if (data.status === 'loaded') {
            const toto: 'tata' = data.state.toto
         }
         expect(data.state.toto).to.equal('tata')
      })
      describe('when root state changes', () => {
         beforeEach(() => {
            rootStore.dispatch({ setTodoInput: 'todo input value' })
         })
         it('updates state', () => {
            const state = rootStore.currentState
            expect(state.todo.input).to.equal('todo input value')
            const data = rootStore.currentData
            expect(data.status).to.equal('loaded')
            if (data.status === 'loaded') {
               expect(data.state.toto).to.equal('tata')
            }
         })
      })
      describe('when another unrelated part of the state is updated', () => {
         beforeEach(() => {
            rootStore.dispatch({ setFlag: true })
         })
         it('does NOT load data again', () => {
            const state = rootStore.currentState
            expect(state.flag).to.be.true
            const data = rootStore.currentData
            expect(data.status).to.equal('loaded')
            expect(data.state.toto).to.equal('tata')
            expect(loadFromName).to.have.been.calledOnce
         })
      })
   })
   it('handles error', () => {
      const store = createStore(initialState, {
         logger: silentLoggerOptions
      }).loadFromFields(['name'], ({ name }) =>
         of({ toto: 'tata' }).pipe(
            map((): { toto: 'tata' } => {
               throw new Error('failed with name ' + name)
            })
         )
      )
      const data = store.currentData
      expect(data.status).to.equal('error')
      if (data.status === 'error') {
         const e: Error = data.error
      }
      if (data.error) {
         const e: Error = data.error
      }
      expect(data.error).to.be.instanceOf(Error)
   })
   describe('when parallel loading store created', () => {
      let childResult$: Subject<ChildResult>
      const createChildLoadingStore = (rootStore: RootStore) =>
         rootStore.loadFromFields(['todo'], ({ todo }) =>
            childResult$.pipe(map(childResult => ({ childResult })))
         )
      type ChildLoadingStore = ReturnType<typeof createChildLoadingStore>
      let childLoadingStore: ChildLoadingStore
      beforeEach(() => {
         childResult$ = new Subject()
         childLoadingStore = createChildLoadingStore(rootStore)
      })
      it('has loading status', () => {
         expect(rootStore.currentData.status).to.equal('loading')
         expect(childLoadingStore.currentData.status).to.equal('loading')
      })
      describe('when only root store result received', () => {
         beforeEach(() => {
            result$.next({ toto: 'tata' })
         })
         it('is still loading', () => {
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
   describe('when sequence loading store created', () => {
      let childResult$: Subject<ChildResult>
      let loadFromResult: (_: { toto: 'tata' }) => Observable<ChildResult>
      const createChildLoadingStore = (
         rootStore: RootStore,
         loader: typeof loadFromResult
      ) => rootStore.loadFromFields(['toto'], loader)
      type ChildLoadingStore = ReturnType<typeof createChildLoadingStore>
      let childLoadingStore: ChildLoadingStore
      beforeEach(() => {
         childResult$ = new Subject()
         loadFromResult = stub().returns(childResult$)
         childLoadingStore = createChildLoadingStore(rootStore, loadFromResult)
      })
      it('is loading', () => {
         expect(rootStore.currentData.status).to.equal('loading')
         expect(childLoadingStore.currentData.status).to.equal('loading')
      })
      it('does not call child loaded just yet', () => {
         expect(loadFromResult).not.to.have.been.called
      })
      describe('when root store result received', () => {
         beforeEach(() => {
            result$.next({ toto: 'tata' })
         })
         it('calls loader', () => {
            expect(loadFromResult).to.have.been.called
         })
         it('is still loading', () => {
            expect(childLoadingStore.currentData.status).to.equal('loading')
         })
         describe('when child store result received', () => {
            beforeEach(() => {
               childResult$.next({ childResultField: 'childResultFieldValue' })
            })
            it('is loaded', () => {
               expect(childLoadingStore.currentData.status).to.equal('loaded')
               expect(childLoadingStore.currentState.childResultField).to.equal(
                  'childResultFieldValue'
               )
            })
         })
      })
   })
})
