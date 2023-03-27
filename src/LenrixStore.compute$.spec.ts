import { expect } from 'chai'
import { NEVER, of } from 'rxjs'
import { delay, map, mapTo, switchMap } from 'rxjs/operators'

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

describe('LenrixStore.compute$()', () => {
   let rootStore: RootStore
   beforeEach(() => {
      rootStore = createRootStore()
   })

   describe('without initial values', () => {
      it('computed values are undefined if computer has not emitted yet', () => {
         const computed = rootStore.compute$(state$ => NEVER) as any
         expect(computed.currentState.whatever).to.be.undefined
      })

      it('computed values are defined if computer has emitted', () => {
         const computed = rootStore.compute$(state$ =>
            of({ whatever: 'computed' })
         )
         expect(computed.currentState.whatever).to.equal('computed')
      })
   })

   describe('with initial values', () => {
      const createComputingStore = (rootStore: RootStore) =>
         rootStore.compute$(
            state$ =>
               state$.pipe(
                  switchMap(s => isAvailable(s.name)),
                  map(available => ({ available }))
               ),
            { available: true }
         )
      type ComputingStore = ReturnType<typeof createComputingStore>
      let store: ComputingStore
      let state: State & ComputedValues
      let stateTransitions: number

      beforeEach(() => {
         store = createComputingStore(rootStore)
         stateTransitions = 0
         store.state$.subscribe(newState => {
            state = newState
            ++stateTransitions
         })
      })

      it('has path', () => {
         expect(store.path).to.equal('root.compute$(available)')
      })

      it('computes initial state only once', () => {
         let executions = 0
         const what = rootStore.compute$(
            state$ =>
               state$.pipe(
                  map(s => {
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
         const computed = rootStore.compute$(state$ => NEVER, {
            whatever: 'initial'
         })
         expect(computed.currentState.whatever).to.equal('initial')
      })

      ////////////
      // STATE //
      //////////

      it('holds initial state as current state', () => {
         expect(store.currentState).to.deep.equal({
            ...initialState,
            available: false
         })
         expect(stateTransitions).to.equal(1)
      })

      it('holds initial state as state stream', () => {
         expect(state).to.deep.equal({
            ...initialState,
            available: false
         })
         expect(stateTransitions).to.equal(1)
      })

      it('computes values when state changes', () => {
         expect(state.available).to.equal(false)
         store.dispatch({ setName: 'Steve' })
         expect(state.available).to.equal(true)
         expect(stateTransitions).to.equal(3)
      })

      it('holds initial computed values in initial state', () => {
         const computedStore = rootStore.compute$(
            state$ =>
               state$.pipe(
                  mapTo({
                     available: false
                  }),
                  delay(1)
               ),
            { available: true }
         )
         expect(computedStore.currentState.available).to.equal(true)
      })

      it('emits new state even if new values have not yet been computed', () => {
         let stateTransions = 0
         const computed = rootStore.compute$(
            state$ =>
               state$.pipe(
                  delay(1),
                  mapTo({
                     value$: 'computed'
                  })
               ),
            { value$: 'initial' }
         )
         computed.state$.subscribe(s => ++stateTransions)

         rootStore.dispatch({ toggleFlag: undefined })

         expect(stateTransions).to.equal(2)
      })

      it('computes values from initial normalized state') // TODO ???????

      describe('.focusPath() with computed values', () => {
         const createFocusedStore = (store: ComputingStore) =>
            store.focusPath(['todo'], ['available'])
         let focusedStore: ReturnType<typeof createFocusedStore>
         let focusedState: State['todo'] & ComputedValues
         let focusedStateTransitions: number

         beforeEach(() => {
            focusedStore = createFocusedStore(store)
            focusedStateTransitions = 0
            focusedStore.state$.subscribe(s => {
               focusedState = s
               ++focusedStateTransitions
            })
         })

         it('does not emit new state when unrelated slice of parent state changes', () => {
            rootStore.dispatch({ toggleFlag: undefined })
            expect(focusedStateTransitions).to.equal(1)
         })

         it('emits new state when value computed from parent normalized state is recomputed', () => {
            expect(focusedState.available).to.equal(false)
            rootStore.dispatch({ setName: 'Steve' })
            expect(focusedState.available).to.equal(true)
            expect(focusedStateTransitions).to.equal(2)
         })
      })

      describe('.focusFields() with computed values', () => {
         const createFocusedStore = (store: ComputingStore) =>
            store.focusFields(['todo'], ['available'])
         let focusedStore: ReturnType<typeof createFocusedStore>
         let focusedState: Pick<State, 'todo'> & ComputedValues
         let focusedStateTransitions: number

         beforeEach(() => {
            focusedStore = createFocusedStore(store)
            focusedStateTransitions = 0
            focusedStore.state$.subscribe(s => {
               focusedState = s
               ++focusedStateTransitions
            })
         })

         it('does not emit new state when unrelated slice of parent state changes', () => {
            rootStore.dispatch({ toggleFlag: undefined })
            expect(focusedStateTransitions).to.equal(1)
         })

         it('emits new state when value computed from parent normalized state is recomputed', () => {
            expect(focusedState.available).to.equal(false)
            rootStore.dispatch({ setName: 'Steve' })
            expect(focusedState.available).to.equal(true)
            expect(focusedStateTransitions).to.equal(2)
         })
      })

      describe('.recompose() with computed values', () => {
         const createFocusedStore = (store: ComputingStore) =>
            store.recompose(
               _ => ({
                  todoList: _.focusPath('todo', 'list')
               }),
               ['available']
            )
         let focusedStore: ReturnType<typeof createFocusedStore>
         let focusedState: { todoList: string[] } & ComputedValues
         let focusedStateTransitions: number

         beforeEach(() => {
            focusedStore = createFocusedStore(store)
            focusedStateTransitions = 0
            focusedStore.state$.subscribe(s => {
               focusedState = s
               ++focusedStateTransitions
            })
         })

         it('does not emit new state when unrelated slice of parent state changes', () => {
            rootStore.dispatch({ toggleFlag: undefined })
            expect(focusedStateTransitions).to.equal(1)
         })

         it('emits new state when value computed from parent normalized state is recomputed', () => {
            expect(state.available).to.equal(false)
            rootStore.dispatch({ setName: 'Steve' })
            expect(focusedState.available).to.equal(true)
            expect(focusedStateTransitions).to.equal(2)
         })
      })
   })
})
