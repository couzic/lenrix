import 'rxjs/add/observable/never'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/delay'
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/toArray'

import { expect } from 'chai'
import { createLens } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'

import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

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

const isAvailable = (name: string) => Observable.of(name.length > 3)

describe('LenrixStore.compute$()', () => {

   const lens = createLens<State>()
   let rootStore: Store<{
      state: State
      computedValues: {}
      actions: { toggleFlag: void, setName: string }
      dependencies: {}
   }>
   beforeEach(() => {
      rootStore = createStore(initialState, { logger: silentLoggerOptions })
         .actionTypes<{ toggleFlag: void }>()
         .updates(_ => ({ toggleFlag: () => _.focusPath('flag').update(flag => !flag) }))
         .actionTypes<{ setName: string }>()
         .updates(_ => ({ setName: name => _.focusPath('name').setValue(name) }))
   })

   describe('without initial values', () => {

      it('computed values are undefined if computer has not emitted yet', () => {
         const computed = rootStore.compute$(state$ => Observable.never<{ whatever: 'computed' }>())
         expect(computed.currentComputedState.whatever).to.be.undefined
      })

      it('computed values are defined if computer has emitted', () => {
         const computed = rootStore.compute$(state$ => Observable.of({ whatever: 'computed' }))
         expect(computed.currentComputedState.whatever).to.equal('computed')
      })

   })

   describe('with initial values', () => {

      let store: Store<{
         state: State
         computedValues: ComputedValues
         actions: { toggleFlag: void, setName: string }
         dependencies: {}
      }>
      let state: State & ComputedValues
      let stateTransitions: number

      beforeEach(() => {
         store = rootStore.compute$(
            state$ => state$
               .switchMap(state => isAvailable(state.name))
               .map(available => ({ available })),
            { available: true })
         stateTransitions = 0
         store.computedState$.subscribe(newState => {
            state = newState
            ++stateTransitions
         })
      })

      it('has path', () => {
         expect(store.path).to.equal('root.compute$(available)')
      })

      it('computes initial state only once', () => {
         let executions = 0
         const what = rootStore.compute$(state$ => state$.map(state => {
            ++executions
            return { whatever: 'computed' }
         }), { whatever: 'initial' })
         expect(what.currentComputedState.whatever).to.equal('computed')
         expect(executions).to.equal(1)
      })

      it('holds initial values in state if Observable has not emitted yet', () => {
         const computed = rootStore.compute$(state$ => Observable.never(), { whatever: 'initial' })
         expect(computed.currentComputedState.whatever).to.equal('initial')
      })

      ////////////
      // STATE //
      //////////

      it('holds initial state as current state', () => {
         expect(store.currentComputedState).to.deep.equal({
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
         const computedStore = rootStore.compute$(state$ => state$.mapTo({
            available: false
         }).delay(1), { available: true })
         expect(computedStore.currentComputedState.available).to.equal(true)
      })

      it('emits new state even if new values have not yet been computed', () => {
         let stateTransions = 0
         const computed = rootStore.compute$(state$ => state$.delay(1).mapTo({
            value$: 'computed'
         }), { value$: 'initial' })
         computed.state$.subscribe(state => ++stateTransions)

         rootStore.dispatch({ toggleFlag: undefined })

         expect(stateTransions).to.equal(2)
      })

      it('computes values from initial normalized state') // TODO ???????

      describe('.focusPath() with computed values', () => {
         let focusedStore: Store<{
            state: State['todo']
            computedValues: ComputedValues
            actions: { toggleFlag: void, setName: string }
            dependencies: {}
         }>
         let focusedState: State['todo'] & ComputedValues
         let focusedStateTransitions: number

         beforeEach(() => {
            focusedStore = store.focusPath(['todo'], ['available'])
            focusedStateTransitions = 0
            focusedStore.computedState$.subscribe(state => {
               focusedState = state
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
         let focusedStore: Store<{
            state: Pick<State, 'todo'>
            computedValues: ComputedValues
            actions: { toggleFlag: void, setName: string }
            dependencies: {}
         }>
         let focusedState: Pick<State, 'todo'> & ComputedValues
         let focusedStateTransitions: number

         beforeEach(() => {
            focusedStore = store.focusFields(['todo'], ['available'])
            focusedStateTransitions = 0
            focusedStore.computedState$.subscribe(state => {
               focusedState = state
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
         let focusedStore: Store<{
            state: { todoList: string[] }
            computedValues: ComputedValues
            actions: { toggleFlag: void, setName: string }
            dependencies: {}
         }>
         let focusedState: { todoList: string[] } & ComputedValues
         let focusedStateTransitions: number

         beforeEach(() => {
            focusedStore = store.recompose(_ => ({
               todoList: _.focusPath('todo', 'list')
            }), ['available'])
            focusedStateTransitions = 0
            focusedStore.computedState$.subscribe(state => {
               focusedState = state
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
