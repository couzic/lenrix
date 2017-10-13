import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'
import { initialState, State } from '../test/State'
import { Store } from './Store'
import { createStore } from './createStore'

describe('RootStore', () => {

   let store: Store<State>
   let lens: UnfocusedLens<State>
   let state: State
   let stateTransitions: number

   beforeEach(() => {
      store = createStore(initialState)
      lens = store.lens
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
      stateTransitions = 1
   })

   it('has path', () => {
      expect(store.path).to.equal('root')
   })

   it('holds initial state as state stream', () => {
      expect(state).to.equal(initialState)
      expect(state).to.deep.equal(initialState)
      expect(stateTransitions).to.equal(1)
   })

   it('has Lens', () => {
      const result = lens.updateFields({ counter: (v) => v + 1 })(state)
      expect(result.counter).to.equal(43)
   })

   it('does not trigger state transitions when an update does not change any value', () => {
      store.updateFields({ flag: value => value })

      expect(stateTransitions).to.equal(1)
   })

   ///////////
   // READ //
   /////////

   describe('.map()', () => {
      it('returns selected state Observable', () => {
         const counter$ = store.map(state => state.counter)
         let counterValue = 0
         counter$.subscribe(counter => counterValue = counter)
         expect(counterValue).to.equal(42)
      })
      it('returns Observables that do not emit when unrelated slice of state is updated', () => {
         const counter$ = store.map(state => state.counter)
         let transitions = 0
         counter$.subscribe(() => ++transitions)

         store.updateFields({ flag: value => !value })

         expect(transitions).to.equal(1)
      })
   })

   /////////////
   // UPDATE //
   ///////////

   describe('.reset()', () => {
      it('sets state to initial state', () => {
         store.setFieldValues({ counter: 0 })
         store.reset()
         expect(state).to.equal(initialState)
         expect(state).to.deep.equal(initialState)
      })

      it('does not trigger state transition when already to initial state', () => {
         store.reset()
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.setValue()', () => {
      it('can set new state', () => {
         store.setValue({
            ...initialState,
            counter: 12
         })
         expect(state.counter).to.equal(12)
      })

      it('does not trigger state transition when same state', () => {
         store.setValue(state)
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.update()', () => {
      it('can update state', () => {
         store.update(state => ({
            ...state,
            counter: 21
         }))
         expect(state.counter).to.equal(21)
      })

      it('does not trigger state transition when updater returns same state', () => {
         store.update(state => state)
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.setFieldValues()', () => {
      it('can set new field values', () => {
         store.setFieldValues({
            counter: 24
         })
         expect(state.counter).to.equal(24)
      })

      it('does not trigger state transition when same field value', () => {
         store.setFieldValues({
            counter: state.counter
         })
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.updateFields()', () => {
      it('can update fields', () => {
         store.updateFields({
            counter: value => ++value
         })
         expect(state.counter).to.equal(43)
      })

      it('does not trigger state transition when updaters return same value', () => {
         store.updateFields({
            counter: value => value
         })
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.updateFieldValues()', () => {
      it('can update field values', () => {
         store.updateFieldValues(state => ({
            counter: state.counter + 1
         }))
         expect(state.counter).to.equal(43)
      })

      it('does not trigger state transition when fields updater returns same value', () => {
         store.updateFieldValues(state => ({
            counter: state.counter
         }))
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.pipe()', () => {
      it('can pipe updaters', () => {
         const increment = lens.focusOn('counter').update(value => ++value)
         store.pipe(
            increment,
            increment,
            increment
         )
         expect(state.counter).to.equal(45)
         expect(stateTransitions).to.equal(2)
      })

      it('does not trigger state transitions when all updaters returns same value', () => {
         const identity = lens.focusOn('counter').update(value => value)
         store.pipe(
            identity,
            identity,
            identity
         )
         expect(state.counter).to.equal(42)
         expect(stateTransitions).to.equal(1)
      })
   })

   ////////////
   // FOCUS //
   //////////

   it('can focus on field', () => {
      let counter = 0
      store.focusOn('counter').state$.subscribe(value => counter = value)
      expect(counter).to.equal(42)
   })

   it('can focus fields', () => {
      let slice: any = {}
      const fieldsStore = store.focusFields('counter', 'flag')
      fieldsStore.state$.subscribe(value => slice = value)
      expect(slice).to.deep.equal({ counter: 42, flag: false })
      fieldsStore.setFieldValues({ flag: true })
      expect(slice).to.deep.equal({ counter: 42, flag: true })
   })

   it('can focus with lens', () => {
      let counter = 0
      store.focusWith(lens.focusOn('counter')).state$.subscribe(value => counter = value)
      expect(counter).to.equal(42)
   })

   it('can recompose', () => {
      const recomposedStore = store.recompose({
         todoList: lens.focusPath('todo', 'list')
      })
      recomposedStore.state$.subscribe(recomposedState => {
         expect(recomposedState).to.deep.equal({ todoList: state.todo.list })
         expect(recomposedState.todoList).to.equal(state.todo.list)
      })
   })

})
