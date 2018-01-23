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

describe('LenrixStore.computeFrom$()', () => {

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
         const computed = rootStore.computeFrom$(_ => ({
            flag: _.focusPath('flag')
         }), state$ => Observable.never<{ whatever: 'computed' }>())
         expect(computed.currentComputedState).to.deep.equal(initialState)
         expect(computed.currentComputedState.whatever).to.be.undefined
      })

      it('computed values are defined if computer has emitted', () => {
         const computed = rootStore.computeFrom$(_ => ({
            flag: _.focusPath('flag')
         }), state$ => Observable.of({ whatever: 'computed' }))
         expect(computed.currentComputedState).to.deep.equal({
            ...initialState,
            whatever: 'computed'
         })
      })

      it('emits new state without waiting for new computed values', () => {
         const computingStore = rootStore.computeFrom$(_ => ({
            flag: _.focusPath('flag')
         }), state$ => Observable.of({ whatever: 'computed' }))
         let computedStateTransitions = 0
         computingStore.computedState$.subscribe(newState => ++computedStateTransitions)
         expect(computedStateTransitions).to.equal(1)
         computingStore.dispatch({ toggleFlag: undefined })
         expect(computedStateTransitions).to.equal(3)
      })

   })

   describe('with initial values', () => {

      let store: Store<{
         state: State
         computedValues: ComputedValues
         actions: { toggleFlag: void, setName: string }
         dependencies: {}
      }>
      let computedState: State & ComputedValues
      let computedStateTransitions: number

      beforeEach(() => {
         store = rootStore.computeFrom$(_ => ({
            theName: _.focusPath('name')
         }),
            state$ => state$
               .switchMap(state => isAvailable(state.theName))
               .map(available => ({ available })),
            { available: true }
         )
         computedStateTransitions = 0
         store.computedState$.subscribe(newState => {
            computedState = newState
            ++computedStateTransitions
         })
      })

      it('computes initial state only once', () => {
         let executions = 0
         const what = rootStore.computeFrom$(_ => ({
            theName: _.focusPath('name')
         }), state$ => state$.map(state => {
            ++executions
            return { whatever: 'computed' }
         }), { whatever: 'initial' })
         expect(what.currentComputedState.whatever).to.equal('computed')
         expect(executions).to.equal(1)
      })

      it('holds initial values in state if Observable has not emitted yet', () => {
         const neverComputedStore = rootStore.computeFrom$(
            _ => ({ theName: _.focusPath('name') }),
            state$ => Observable.never(),
            { whatever: 'initial' })
         expect(neverComputedStore.currentComputedState).to.deep.equal({
            ...initialState,
            whatever: 'initial'
         })
      })

      it('emits new state even if new values have not yet been computed', () => {
         let stateTransions = 0
         const neverComputedStore = rootStore.computeFrom$(
            _ => ({ theName: _.focusPath('name') }),
            state$ => Observable.never(),
            { whatever: 'initial' })
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
