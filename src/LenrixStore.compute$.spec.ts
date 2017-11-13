import 'rxjs/add/observable/never'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/delay'
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/toArray'

import { expect } from 'chai'
import { createLens } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'

import { ComputedStore } from './ComputedStore'
import { createStore } from './createStore'
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
   let rootStore: Store<State>
   let store: ComputedStore<State, ComputedValues>
   let state: State & ComputedValues
   let stateTransitions: number

   beforeEach(() => {
      rootStore = createStore(initialState)
      store = rootStore.compute$(
         state$ => state$
            .switchMap(state => isAvailable(state.name))
            .map(available => ({ available })),
         { available: true })
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
      const what = rootStore.compute$(state$ => state$.map(state => {
         ++executions
         return { whatever: 'computed' }
      }), { whatever: 'initial' })
      expect(what.currentState.whatever).to.equal('computed')
      expect(executions).to.equal(1)
   })

   it('holds initial values in state if Observable has not emitted yet', () => {
      const computed = rootStore.compute$(state$ => Observable.never(), { whatever: 'initial' })
      expect(computed.currentState.whatever).to.equal('initial')
   })

   it('has initial state without computed values if computer has not emitted yet', () => {
      const computed = rootStore.compute$(state$ => Observable.never<{ whatever: 'computed' }>())
      expect(computed.currentState.whatever).to.be.undefined
   })

   /////////////
   // UPDATE //
   ///////////

   it('can update normalized state', () => {
      store.setFieldValues({ name: 'Bob' })
      expect(state.name).to.equal('Bob')
   })

   it('can reset', () => {
      store.setFieldValues({
         name: 'Steve'
      })
      store.reset()
      expect(state.name).to.equal('')
      expect(state.available).to.equal(false)
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
      store.setFieldValues({
         name: 'Steve'
      })
      expect(state.available).to.equal(true)
      expect(stateTransitions).to.equal(3)
   })

   it('holds initial computed values in initial state', () => {
      const computedStore = rootStore.compute$(state$ => state$.mapTo({
         available: false
      }).delay(1), { available: true })
      expect(computedStore.currentState.available).to.equal(true)
   })

   it('computes values from initial normalized state') // TODO ???????

   describe('.focusPath() with computed values', () => {
      let focusedStore: ComputedStore<State['todo'], ComputedValues>
      let focusedState: State['todo'] & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.focusPath(['todo'], ['available'])
         focusedStateTransitions = 0
         focusedStore.state$.subscribe(state => {
            focusedState = state
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         rootStore.updateFields({
            flag: value => !value
         })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         expect(focusedState.available).to.equal(false)
         rootStore.setFieldValues({ name: 'Steve' })
         expect(focusedState.available).to.equal(true)
         expect(focusedStateTransitions).to.equal(2)
      })
   })

   describe('.focusFields() with computed values', () => {
      let focusedStore: ComputedStore<Pick<State, 'todo'>, ComputedValues>
      let focusedState: Pick<State, 'todo'> & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.focusFields(['todo'], ['available'])
         focusedStateTransitions = 0
         focusedStore.state$.subscribe(state => {
            focusedState = state
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         rootStore.updateFields({
            flag: value => !value
         })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         expect(focusedState.available).to.equal(false)
         rootStore.setFieldValues({ name: 'Steve' })
         expect(focusedState.available).to.equal(true)
         expect(focusedStateTransitions).to.equal(2)
      })
   })

   describe('.recompose() with computed values', () => {
      let focusedStore: ComputedStore<{ todoList: string[] }, ComputedValues>
      let focusedState: { todoList: string[] } & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.recompose({
            todoList: store.lens.focusPath('todo', 'list')
         }, ['available'])
         focusedStateTransitions = 0
         focusedStore.state$.subscribe(state => {
            focusedState = state
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         rootStore.updateFields({
            flag: value => !value
         })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         expect(state.available).to.equal(false)
         rootStore.setFieldValues({ name: 'Steve' })
         expect(focusedState.available).to.equal(true)
         expect(focusedStateTransitions).to.equal(2)
      })
   })

   /////////////////////
   // RUNTIME CHECKS //
   ///////////////////

   // it('throws error when computing values with higher order function', () => {
   //    expect(() => store.compute(state => () => null)).to.throw('compute() does not support higher order functions')
   // })

})
