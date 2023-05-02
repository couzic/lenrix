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

interface Result {
   toto: 'tata'
}

interface ChildResult {
   childResultField: 'childResultFieldValue'
}

const createRootStore = (
   input$: Observable<string>,
   loadFromInput: (input: string) => Observable<Result>
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
      .loadFromStream(input$, loadFromInput)

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.loadFromStream()', () => {
   let result$: Subject<Result>
   let rootStore: RootStore
   let input$: Subject<string>
   let loadFromInput: (input: string) => Observable<Result>
   beforeEach(() => {
      result$ = new Subject()
      input$ = new Subject()
      loadFromInput = stub().returns(result$)
      rootStore = createRootStore(input$, loadFromInput)
   })
   it('initially does not call loader', () => {
      const data = rootStore.currentData
      expect(data.status).not.to.equal('loading')
      expect(data.state.toto).to.be.undefined
      expect(loadFromInput).not.to.have.been.called
   })
   describe('when input stream emits', () => {
      beforeEach(() => {
         input$.next('a')
      })
      it('loads', () => {
         const data = rootStore.currentData
         expect(data.status).to.equal('loading')
         expect(data.state.toto).to.be.undefined
         expect(loadFromInput).to.have.been.calledOnceWithExactly('a')
      })
      describe('when result loaded', () => {
         beforeEach(() => {
            result$.next({ toto: 'tata' })
         })
         it('is loaded', () => {
            const data = rootStore.currentData
            expect(data.status).to.equal('loaded')
            expect(data.state.toto).to.equal('tata')
         })
      })
   })
})
