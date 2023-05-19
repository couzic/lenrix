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

interface ChildResult {
   childResultField: 'childResultFieldValue'
}

const createRootStore = (
   loadFromName: (_: { name: string }) => Observable<'tata'>
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
      .loadFromFields(['name'], {
         toto: loadFromName
      })

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.loadFromFields()', () => {
   let tata$: Subject<'tata'>
   let rootStore: RootStore
   let loadFromName: (_: { name: string }) => Observable<'tata'>
   beforeEach(() => {
      tata$ = new Subject()
      loadFromName = stub().returns(tata$)
      rootStore = createRootStore(loadFromName)
   })
   it('is initially loading', () => {
      const state = rootStore.currentState
      expect(state.status).to.equal('loading')
      expect(state.data).to.deep.equal(rootStore.currentState.data)
      expect(state.loadableValues.toto).to.deep.equal({
         status: 'loading',
         value: undefined,
         error: undefined
      })
   })
   describe('when received result', () => {
      beforeEach(() => {
         tata$.next('tata')
      })
      it('is loaded', () => {
         const state = rootStore.currentState
         expect(state.status).to.equal('loaded')
         if (state.status === 'loaded') {
            const toto: 'tata' = state.data.toto
         }
         expect(state.loadableValues.toto.value).to.equal('tata')
         expect(state.data.toto).to.equal('tata')
      })
      describe('when root state changes', () => {
         beforeEach(() => {
            rootStore.dispatch({ setTodoInput: 'todo input value' })
         })
         it('updates data', () => {
            const data = rootStore.currentData
            expect(data.todo.input).to.equal('todo input value')
            const state = rootStore.currentState
            expect(state.status).to.equal('loaded')
            if (state.status === 'loaded') {
               expect(state.data.toto).to.equal('tata')
            }
         })
      })
      describe('when another unrelated part of the state is updated', () => {
         beforeEach(() => {
            rootStore.dispatch({ setFlag: true })
         })
         it('does NOT load data again', () => {
            const data = rootStore.currentData
            expect(data.flag).to.be.true
            const state = rootStore.currentState
            expect(state.status).to.equal('loaded')
            expect(state.data.toto).to.equal('tata')
            expect(loadFromName).to.have.been.calledOnce
         })
      })
   })
   it('handles error', () => {
      const store = createStore(initialState, {
         logger: silentLoggerOptions
      }).loadFromFields(['name'], {
         toto: ({ name }) =>
            of('tata' as const).pipe(
               map(_ => {
                  throw new Error('failed with name ' + name)
               })
            )
      })
      const state = store.currentState
      expect(state.status).to.equal('error')
      if (state.status === 'error') {
         const errors: Error[] = state.errors
      }
      if (state.errors) {
         const errors: Error[] = state.errors
      }
      expect(state.errors[0]).to.be.instanceOf(Error)
      expect(state.loadableValues.toto.error).to.be.instanceOf(Error)
      expect(state.loadableValues.toto.status).to.equal('error')
   })
   describe('when parallel loading store created', () => {
      let childResult$: Subject<ChildResult>
      const createChildLoadingStore = (rootStore: RootStore) =>
         rootStore.loadFromFields(['todo'], {
            childResult: ({ todo }) => childResult$
         })
      type ChildLoadingStore = ReturnType<typeof createChildLoadingStore>
      let childLoadingStore: ChildLoadingStore
      beforeEach(() => {
         childResult$ = new Subject()
         childLoadingStore = createChildLoadingStore(rootStore)
      })
      it('has loading status', () => {
         expect(rootStore.currentState.status).to.equal('loading')
         expect(childLoadingStore.currentState.status).to.equal('loading')
      })
      describe('when only root store result received', () => {
         beforeEach(() => {
            tata$.next('tata')
         })
         it('is still loading', () => {
            expect(childLoadingStore.currentState.status).to.equal('loading')
         })
      })
      describe('when only child store result received', () => {
         beforeEach(() => {
            childResult$.next({ childResultField: 'childResultFieldValue' })
         })
         it('is still loading', () => {
            expect(rootStore.currentState.status).to.equal('loading')
            expect(childLoadingStore.currentState.status).to.equal('loading')
         })
      })
      describe('when both root and child store result received', () => {
         beforeEach(() => {
            tata$.next('tata')
            childResult$.next({ childResultField: 'childResultFieldValue' })
         })
         it('is loaded', () => {
            expect(childLoadingStore.currentState.status).to.equal('loaded')
         })
      })
   })
   describe('when sequence loading store created', () => {
      let child$: Subject<'childResultFieldValue'>
      let loadFromResult: (_: {
         toto: 'tata'
      }) => Observable<'childResultFieldValue'>
      const createChildLoadingStore = (
         rootStore: RootStore,
         loader: typeof loadFromResult
      ) => rootStore.loadFromFields(['toto'], { childResultField: loader })
      type ChildLoadingStore = ReturnType<typeof createChildLoadingStore>
      let childLoadingStore: ChildLoadingStore
      beforeEach(() => {
         child$ = new Subject()
         loadFromResult = stub().returns(child$)
         childLoadingStore = createChildLoadingStore(rootStore, loadFromResult)
      })
      it('is loading', () => {
         expect(rootStore.currentState.status).to.equal('loading')
         expect(childLoadingStore.currentState.status).to.equal('loading')
      })
      it('does not call child loaded just yet', () => {
         expect(loadFromResult).not.to.have.been.called
      })
      describe('when root store result received', () => {
         beforeEach(() => {
            tata$.next('tata')
         })
         it('calls loader', () => {
            expect(loadFromResult).to.have.been.called
         })
         it('is still loading', () => {
            expect(childLoadingStore.currentState.status).to.equal('loading')
         })
         describe('when child store result received', () => {
            beforeEach(() => {
               child$.next('childResultFieldValue')
            })
            it('is loaded', () => {
               expect(childLoadingStore.currentState.status).to.equal('loaded')
               expect(
                  childLoadingStore.currentState.data.childResultField
               ).to.equal('childResultFieldValue')
            })
         })
      })
   })
})

it('loads from loading field', () => {
   const pokemon$ = new Subject<any>()
   const evolvesFrom$ = new Subject<any>()

   const store = createStore(
      { pokemonName: 'pikachu' },
      { logger: silentLoggerOptions }
   )
      .loadFromFields(['pokemonName'], {
         pokemon: ({ pokemonName }) => pokemon$
      })
      .loadFromFields(['pokemon'], {
         evolvesFrom: ({ pokemon }) => evolvesFrom$
      })

   let state: any
   store.state$.subscribe(_ => (state = _))
   expect(state).not.to.be.undefined

   pokemon$.next({ name: 'pikachu' })
   expect(state.data.pokemon.name).to.equal('pikachu')
   expect(store.currentStatus).to.equal('loading')

   evolvesFrom$.next({ name: 'pichu' })
   expect(state.data.evolvesFrom.name).to.equal('pichu')
   expect(store.currentStatus).to.equal('loaded')
})
