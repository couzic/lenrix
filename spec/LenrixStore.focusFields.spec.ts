import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'
import { initialState, State } from './State'

type PickedState = Pick<State, 'counter' | 'todo'>

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })

type RootStore = ReturnType<typeof createRootStore>

const createFocusedStore = (rootStore: RootStore) =>
   rootStore.focusFields('counter', 'todo')

type FocusedStore = ReturnType<typeof createFocusedStore>

describe('LenrixStore.focusFields()', () => {
   let rootStore: RootStore
   let store: FocusedStore
   let rootState: State
   let state: PickedState
   let rootLens: UnfocusedLens<State>
   let lens: UnfocusedLens<PickedState>
   let rootStateTransitions: number
   let stateTransitions: number

   const initialPickedState: PickedState = {
      counter: initialState.counter,
      todo: initialState.todo
   }

   beforeEach(() => {
      rootStore = createRootStore()
      store = createFocusedStore(rootStore)
      rootLens = rootStore.localLens
      lens = store.localLens
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
      expect(store.path).to.equal('root.pick(counter,todo)')
   })

   ////////////
   // STATE //
   //////////

   it('holds initial state as current state', () => {
      expect(store.currentState).to.deep.equal(initialPickedState)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal(initialPickedState)
   })

   it('does not emit new state when an update does not change any value', () => {
      store
         .actionTypes<{ doNothing: void }>()
         .updates(_ => ({ doNothing: () => s => s }))
         .dispatch({ doNothing: undefined })
      expect(stateTransitions).to.equal(1)
   })

   it('does not emit new state when an unrelated slice of parent state changes', () => {
      rootStore
         .actionTypes<{ toggleFlag: void }>()
         .updates(_ => ({
            toggleFlag: () => _.focusPath('flag').update(flag => !flag)
         }))
         .dispatch({ toggleFlag: undefined })
      expect(stateTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

   it('can focus fields with spread keys', () => {
      const focused = rootStore.focusFields('counter', 'flag')
      expect(focused.currentState).to.deep.equal({
         counter: initialState.counter,
         flag: initialState.flag
      })
   })

   it('can focus fields with key array', () => {
      const focused = rootStore.focusFields(['counter', 'flag'])
      expect(focused.currentState).to.deep.equal({
         counter: initialState.counter,
         flag: initialState.flag
      })
   })

   it('can focus fields with computedValues', () => {
      const focused = rootStore
         .computeFromFields(['todo'], ({ todo }) => ({
            todoListLength: todo.list.length
         }))
         .focusFields(['counter', 'flag'], ['todoListLength'])
      expect(focused.currentState).to.deep.equal({
         counter: initialState.counter,
         flag: initialState.flag,
         todoListLength: 3
      })
   })

   it('can store fields as readonly-values', () => {
      const focused = rootStore.focusFields(['flag'], ['counter'])

      expect(focused.currentState.counter).to.equal(
         rootStore.currentState.counter
      )
   })
})
