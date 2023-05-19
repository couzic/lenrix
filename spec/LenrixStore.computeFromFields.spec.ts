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

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{
         toggleFlag: void
         addToList: string
      }>()
      .updates(_ => ({
         toggleFlag: () => _.focusPath('flag').update(flag => !flag),
         addToList: name =>
            _.focusPath('todo', 'list').update(list => [...list, name])
      }))

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.computeFromFields()', () => {
   describe('from redux state', () => {
      let store: RootStore
      let state: State
      let computedState: State & { todoListLength: number | undefined }
      let computations: number
      let stateTransitions: number
      let computedStateTransitions: number
      const createComputedStore = (store: RootStore) =>
         store.computeFromFields(['todo'], {
            todoListLength: ({ todo }) => {
               ++computations
               return todo.list.length
            }
         })

      let computedStore: ReturnType<typeof createComputedStore>
      beforeEach(() => {
         computations = 0
         stateTransitions = 0
         computedStateTransitions = 0
         store = createRootStore()
         computedStore = createComputedStore(store)
         computedStore.state$.subscribe(s => {
            state = s.data
            ++stateTransitions
         })
         computedStore.state$.subscribe(s => {
            computedState = s.data
            ++computedStateTransitions
         })
      })

      it('initially has state in current state', () => {
         expect(computedStore.currentData.name).to.equal(initialState.name)
      })

      it('initially has state in state stream', () => {
         expect(state.name).to.equal(initialState.name)
      })

      it('initially emits normalized state only once', () => {
         expect(stateTransitions).to.equal(1)
      })

      it('initially has computed values in current computed state', () => {
         expect(computedStore.currentData.todoListLength).to.equal(
            initialState.todo.list.length
         )
         expect(computedStore.currentState.data.todoListLength).to.equal(
            initialState.todo.list.length
         )
         expect(computedStore.currentState.values.todoListLength).to.equal(
            initialState.todo.list.length
         )
      })

      it('initially has computed values in computed state stream', () => {
         expect(computedState.todoListLength).to.deep.equal(0)
      })

      it('initially computes initial values once only', () => {
         expect(computations).to.equal(1)
      })

      it('initially emits computed state only once', () => {
         expect(computedStateTransitions).to.equal(1)
      })

      it('does not compute values when unselected fields change', () => {
         computedStore.dispatch({ toggleFlag: undefined })
         expect(computations).to.equal(1)
      })

      it('recomputes values when selected fields change', () => {
         expect(computations).to.equal(1)
         computedStore.dispatch({ addToList: 'Bob' })
         expect(computations).to.equal(2)
         expect(stateTransitions).to.equal(2)
         expect(computedStateTransitions).to.equal(2)
      })

      // it('emits new state when updated even if no computation is triggered', () => {
      //    expect(stateTransitions).to.equal(1)
      //    computedStore.dispatch({ toggleFlag: undefined })
      //    expect(computations).to.equal(1)
      //    expect(stateTransitions).to.equal(2)
      //    expect(computedStateTransitions).to.equal(2)
      // })

      it('has access to light store with currentState', () => {
         const cs = store.computeFromFields(['flag'], {
            computed: (s, lightStore) => lightStore.currentData.todo
         })
         expect(cs.currentData.computed).to.equal(store.currentData.todo)
      })

      /////////////////////
      // RUNTIME CHECKS //
      ///////////////////

      // TODO unskip
      it.skip('throws error when dispatching action on light store', () => {
         expect(() =>
            store.computeFromFields(['flag'], {
               computed: (s, lightStore) => {
                  ;(lightStore as any).dispatch({ toggleFlag: undefined })
                  return {
                     computed: lightStore.currentData.todo
                  }
               }
            })
         ).to.throw()
      })

      // TODO unskip
      it.skip('throws error when computer does not return', () => {
         expect(() =>
            store.computeFromFields(['flag'], (() => {
               // Never return
            }) as any)
         ).to.throw()
      })
   })

   describe('from loaded fields', () => {
      let tata$: Subject<string>
      let rootStore: RootStore
      let loadFromName: (_: { name: string }) => Observable<'tata'>
      let computeFromResult: (_: 'tata') => string
      const createComputeFromLoadingStore = (
         rootStore: RootStore,
         loader: typeof loadFromName,
         computer: typeof computeFromResult
      ) =>
         rootStore
            .loadFromFields(['name'], {
               toto: loader
            })
            .computeFromFields(['toto'], {
               computedField: ({ toto }) => computer(toto)
            })
      let store: ReturnType<typeof createComputeFromLoadingStore>
      beforeEach(() => {
         tata$ = new Subject()
         loadFromName = stub().returns(tata$)
         computeFromResult = stub().returns('computedFieldValue')
         rootStore = createRootStore()
         store = createComputeFromLoadingStore(
            rootStore,
            loadFromName,
            computeFromResult
         )
      })
      it('is loading', () => {
         expect(store.currentStatus).to.equal('loading')
         expect(store.currentData.computedField).to.be.undefined
      })
      describe('when field loaded', () => {
         beforeEach(() => {
            tata$.next('tata')
         })
         it('computes field', () => {
            expect(computeFromResult).to.have.been.calledOnce
            expect(store.currentStatus).to.equal('loaded')
            expect(store.currentData.computedField).to.equal(
               'computedFieldValue'
            )
         })
      })
   })

   describe('downstream of a loaded field but not from it', () => {
      let tata$: Subject<'tata'>
      let rootStore: RootStore
      let loadFromName: (_: { name: string }) => Observable<'tata'>
      let computeFromResult: (_: { flag: boolean }) => string
      const createComputeFromLoadingStore = (
         rootStore: RootStore,
         loader: typeof loadFromName,
         compute: typeof computeFromResult
      ) =>
         rootStore
            .loadFromFields(['name'], { toto: loader })
            .computeFromFields(['flag'], { computedField: compute })
      let store: ReturnType<typeof createComputeFromLoadingStore>
      beforeEach(() => {
         tata$ = new Subject()
         loadFromName = stub().returns(tata$)
         computeFromResult = stub().returns('computedFieldValue')
         rootStore = createRootStore()
         store = createComputeFromLoadingStore(
            rootStore,
            loadFromName,
            computeFromResult
         )
      })
      it('is loading', () => {
         expect(store.currentStatus).to.equal('loading')
         expect(loadFromName).to.have.been.calledOnce
      })
      it('computes value immediately', () => {
         expect(computeFromResult).to.have.been.calledOnce
         expect(store.currentData.computedField).to.equal('computedFieldValue')
      })
      describe('when field loaded', () => {
         beforeEach(() => {
            tata$.next('tata')
         })
         it('computes field', () => {
            expect(store.currentStatus).to.equal('loaded')
            expect(store.currentData.computedField).to.equal(
               'computedFieldValue'
            )
         })
      })
   })
})

it('emits state when computing from loadable field', () => {
   const pokemonImgSrc$ = new Subject<string>()
   let state: any
   createStore({ pokemonName: 'pikachu' }, { logger: silentLoggerOptions })
      .loadFromFields(['pokemonName'], {
         pokemonImgSrc: ({ pokemonName }) => pokemonImgSrc$
      })
      .computeFromFields(['pokemonImgSrc'], {
         pokemonImgSrc2: ({ pokemonImgSrc }) => pokemonImgSrc
      })
      .state$.subscribe(_ => (state = _))
   expect(state.status).to.equal('loading')
   expect(state.loadableValues.pokemonImgSrc2.status).to.equal('loading')

   pokemonImgSrc$.next('src')
   expect(state.status).to.equal('loaded')
   expect(state.loadableValues.pokemonImgSrc2.value).to.equal('src')
})
