import { expect } from 'chai'
import { Observable, Subject, map, of } from 'rxjs'
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
      const data = rootStore.currentLoadableData
      expect(data.status).to.equal('loading')
      expect(data.state).to.deep.equal(rootStore.currentState)
   })
   describe('when received result', () => {
      beforeEach(() => {
         result$.next({ toto: 'tata' })
      })
      it('is loaded', () => {
         const data = rootStore.currentLoadableData
         expect(data.status).to.equal('loaded')
         if (data.status === 'loaded') {
            const v: 'tata' = data.state.toto
         }
         expect(data.state.toto).to.equal('tata')
      })
      describe('when root state changes', () => {
         beforeEach(() => {
            rootStore.dispatch({ setName: 'some other name' })
         })
         it('updates state', () => {
            const state = rootStore.currentState
            expect(state.name).to.equal('some other name')
            const data = rootStore.currentLoadableData
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
            const data = rootStore.currentLoadableData
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
      const data = store.currentLoadableData
      expect(data.status).to.equal('error')
      if (data.status === 'error') {
         const e: Error = data.error
      }
      if (data.error) {
         const e: Error = data.error
      }
      expect(data.error).to.be.instanceOf(Error)
   })
})
