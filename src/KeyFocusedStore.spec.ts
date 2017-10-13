import { expect } from 'chai'
import { initialState, State, TodoItem, TodoState } from '../test/State'
import { UnfocusedLens } from 'immutable-lens'
import { Store } from './Store'
import { createStore } from './createStore'

describe('KeyFocusedStore', () => {

   let rootStore: Store<State>
   let store: Store<TodoState>
   let rootState: State
   let state: TodoState
   let rootLens: UnfocusedLens<State>
   let lens: UnfocusedLens<TodoState>
   let rootStateTransitions: number
   let stateTransitions: number

   beforeEach(() => {
      rootStore = createStore(initialState)
      store = rootStore.focusOn('todo')
      rootLens = rootStore.lens
      lens = store.lens
      rootStateTransitions = 0
      stateTransitions = 0
      rootStore.state$.subscribe(newState => {
         rootState = newState
         ++rootStateTransitions
      })
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
   })

   it('has path', () => {
      expect(store.path).to.equal('root.todo')
   })

   it('holds initial state as state stream', () => {
      expect(state).to.equal(initialState.todo)
      expect(state).to.deep.equal(initialState.todo)
      expect(stateTransitions).to.equal(1)
   })

   it('does not trigger state transitions when unrelated slice of ParentState is updated', () => {
      rootStore.updateFields({ flag: value => !value })

      expect(rootStateTransitions).to.equal(2)
      expect(stateTransitions).to.equal(1)
   })

   it('has Lens', () => {
      const result = lens.updateFields({ count: (v) => v + 1 })(state)
      expect(result.count).to.equal(43)
   })

   ///////////
   // READ //
   /////////

   describe('.map()', () => {
      it('returns selected state Observable', () => {
         const count$ = store.map(state => state.count)
         let countValue = 0
         count$.subscribe(count => countValue = count)
         expect(countValue).to.equal(42)
      })
      it('returns Observables that do not emit when unrelated slice of state is updated', () => {
         const count$ = store.map(state => state.count)
         let transitions = 0
         count$.subscribe(() => ++transitions)

         store.setFieldValues({ input: 'New input value' })

         expect(transitions).to.equal(1)
      })
   })

   /////////////
   // UPDATE //
   ///////////

   describe('.reset()', () => {
      it('sets state to initialState', () => {
         store.setFieldValues({ count: 0 })
         store.reset()
         expect(state.count).to.equal(42)
      })

      it('does not trigger state transition when state already is initialState', () => {
         store.reset()
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.setValue()', () => {
      it('can set new state', () => {
         store.setValue({
            ...initialState.todo,
            count: 12
         })
         expect(state.count).to.equal(12)
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
            count: 21
         }))
         expect(state.count).to.equal(21)
      })

      it('does not trigger state transition when updater returns same state', () => {
         store.update(state => state)
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.setFieldValues()', () => {
      it('can set new field values', () => {
         store.setFieldValues({
            count: 24
         })
         expect(state.count).to.equal(24)
      })

      it('does not trigger state transition when same field value', () => {
         store.setFieldValues({
            count: state.count
         })
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.updateFields()', () => {
      it('can update fields', () => {
         store.updateFields({
            count: value => ++value
         })
         expect(state.count).to.equal(43)
      })

      it('does not trigger state transition when updaters return same value', () => {
         store.updateFields({
            count: value => value
         })
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.updateFieldValues()', () => {
      it('can update field values', () => {
         store.updateFieldValues(state => ({
            count: state.count + 1
         }))
         expect(state.count).to.equal(43)
      })

      it('does not trigger state transition when fields updater returns same value', () => {
         store.updateFieldValues(state => ({
            count: state.count
         }))
         expect(stateTransitions).to.equal(1)
      })
   })

   describe('.pipe()', () => {
      it('can pipe updaters', () => {
         const increment = lens.focusOn('count').update(value => ++value)
         store.pipe(
            increment,
            increment,
            increment
         )
         expect(state.count).to.equal(45)
         expect(stateTransitions).to.equal(2)
      })

      it('does not trigger state transitions when all updaters returns same value', () => {
         const identity = lens.focusOn('count').update(value => value)
         store.pipe(
            identity,
            identity,
            identity
         )
         expect(state.count).to.equal(42)
         expect(stateTransitions).to.equal(1)
      })
   })

   ////////////
   // FOCUS //
   //////////

   it('can focus on array field', () => {
      let todoList: TodoItem[] = []
      store.focusOn('list').state$.subscribe(value => todoList = value)
      expect(todoList).to.equal(state.list)
   })

   it('can focus on primitive field', () => {
      let count = 0
      store.focusOn('count').state$.subscribe(value => count = value)
      expect(count).to.equal(state.count)
   })

   it('can focus fields', () => {
      let slice: any = {}
      const fieldsStore = store.focusFields('input', 'count')
      fieldsStore.state$.subscribe(value => slice = value)
      expect(slice).to.deep.equal({ input: 'input', count: 42 })
      fieldsStore.setFieldValues({ input: 'sliced' })
      expect(slice).to.deep.equal({ input: 'sliced', count: 42 })
   })

   it('can focus with lens', () => {
      let count = 0
      store.focusWith(lens.focusOn('count')).state$.subscribe(value => count = value)
      expect(count).to.equal(state.count)
   })

   it('can recompose', () => {
      const recomposedStore = store.recompose({
         todoList: lens.focusOn('list')
      })
      recomposedStore.state$.subscribe(recomposedState => {
         expect(recomposedState).to.deep.equal({ todoList: state.list })
         expect(recomposedState.todoList).to.equal(state.list)
      })
   })

})
