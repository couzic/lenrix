import { expect } from 'chai'
import { Observable, Subject } from 'rxjs'
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

const createRootStore = (
   input$: Observable<string>,
   loadFromInput: (input: string) => Observable<'tata'>
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
      .loadFromStream(input$, { toto: loadFromInput })

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.loadFromStream()', () => {
   let tata$: Subject<'tata'>
   let rootStore: RootStore
   let input$: Subject<string>
   let loadFromInput: (input: string) => Observable<'tata'>
   beforeEach(() => {
      tata$ = new Subject()
      input$ = new Subject()
      loadFromInput = stub().returns(tata$)
      rootStore = createRootStore(input$, loadFromInput)
   })
   it('initially does not call loader', () => {
      const state = rootStore.currentState
      expect(state.data.toto).to.be.undefined
      expect(loadFromInput).not.to.have.been.called
   })
   // TODO ensure no double execution (share input$)
   describe('when input stream emits', () => {
      beforeEach(() => {
         input$.next('a')
      })
      it('loads', () => {
         const state = rootStore.currentState
         expect(state.status).to.equal('loading')
         expect(state.data.toto).to.be.undefined
         expect(loadFromInput).to.have.been.calledOnceWithExactly('a')
      })
      describe('when result loaded', () => {
         beforeEach(() => {
            tata$.next('tata')
         })
         it('is loaded', () => {
            const state = rootStore.currentState
            expect(state.status).to.equal('loaded')
            expect(state.data.toto).to.equal('tata')
         })
      })
   })
})
