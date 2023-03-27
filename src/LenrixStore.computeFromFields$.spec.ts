import { expect } from 'chai'
import { createLens } from 'immutable-lens'
import { NEVER, of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'

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

interface ComputedValues {
   available: boolean
}

const isAvailable = (name: string) => of(name.length > 3)

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })
      .actionTypes<{ toggleFlag: void }>()
      .updates(_ => ({
         toggleFlag: () => _.focusPath('flag').update(flag => !flag)
      }))
      .actionTypes<{ setName: string }>()
      .updates(_ => ({
         setName: name => _.focusPath('name').setValue(name)
      }))

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore.computeFromFields$()', () => {
   const lens = createLens<State>()
   let rootStore: RootStore
   beforeEach(() => {
      rootStore = createRootStore()
   })

   describe('without initial values', () => {
      it('computed values are undefined if computer has not emitted yet', () => {
         const computed = rootStore.computeFromFields$(
            ['flag'],
            state$ => NEVER
         )
         expect(computed.currentState).to.deep.equal(initialState)
         expect((computed.currentState as any).whatever).to.be.undefined
      })

      it('computed values are defined if computer has emitted', () => {
         const computed = rootStore.computeFromFields$(['flag'], state$ =>
            of({ whatever: 'computed' })
         )
         expect(computed.currentState).to.deep.equal({
            ...initialState,
            whatever: 'computed'
         })
      })

      it('emits new state without waiting for new computed values', () => {
         const computingStore = rootStore.computeFromFields$(['name'], state$ =>
            state$.pipe(
               switchMap(state => isAvailable(state.name)),
               map(available => ({ available }))
            )
         )
         let computedStateTransitions = 0
         computingStore.state$.subscribe(() => ++computedStateTransitions)
         expect(computedStateTransitions).to.equal(1)
         computingStore.dispatch({ setName: 'Steve' })
         expect(computedStateTransitions).to.equal(3)
      })

      it('emits with new values from state before new computed values', () => {
         const computingStore = rootStore.computeFromFields$(['name'], state$ =>
            state$.pipe(
               switchMap(state => isAvailable(state.name)),
               map(available => ({ available }))
            )
         )
         const computedStates: any[] = []
         computingStore.state$.subscribe(newState =>
            computedStates.push(newState)
         )
         computingStore.dispatch({ setName: 'Steve' })
         expect(computedStates).to.have.length(3)
         expect(
            computedStates.map(({ name, available }) => ({ name, available }))
         ).to.deep.equal([
            { name: '', available: false },
            { name: 'Steve', available: false },
            { name: 'Steve', available: true }
         ])
      })
   })

   describe('with initial values', () => {
      let computedState: State & ComputedValues
      let computedStateTransitions: number
      const createComputingStore = (rootStore: RootStore) =>
         rootStore.computeFromFields$(
            ['name'],
            state$ =>
               state$.pipe(
                  switchMap(state => isAvailable(state.name)),
                  map(available => ({ available }))
               ),
            { available: true }
         )
      let store: ReturnType<typeof createComputingStore>

      beforeEach(() => {
         store = createComputingStore(rootStore)
         computedStateTransitions = 0
         store.state$.subscribe(newState => {
            computedState = newState
            ++computedStateTransitions
         })
      })

      it('computes initial state only once', () => {
         let executions = 0
         const what = rootStore.computeFromFields$(
            ['flag'],
            state$ =>
               state$.pipe(
                  map(state => {
                     ++executions
                     return { whatever: 'computed' }
                  })
               ),
            { whatever: 'initial' }
         )
         expect(what.currentState.whatever).to.equal('computed')
         expect(executions).to.equal(1)
      })

      it('holds initial values in state if Observable has not emitted yet', () => {
         const neverComputedStore = rootStore.computeFromFields$(
            ['flag'],
            state$ => NEVER,
            { whatever: 'initial' }
         )
         expect(neverComputedStore.currentState).to.deep.equal({
            ...initialState,
            whatever: 'initial'
         })
      })

      it('emits new state even if new values have not yet been computed', () => {
         let stateTransions = 0
         const neverComputedStore = rootStore.computeFromFields$(
            ['name'],
            state$ => NEVER,
            { whatever: 'initial' }
         )
         neverComputedStore.state$.subscribe(state => ++stateTransions)

         expect(stateTransions).to.equal(1)
      })

      it('computes values when state changes', () => {
         expect(computedState.available).to.equal(false)
         store.dispatch({ setName: 'Steve' })
         expect(computedState.available).to.equal(true)
      })

      it('emits new state without waiting for new computed values', () => {
         expect(computedStateTransitions).to.equal(1)
         store.dispatch({ setName: 'Steve' })
         expect(computedStateTransitions).to.equal(3)
      })
   })
})
