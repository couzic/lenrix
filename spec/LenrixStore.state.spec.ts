import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'
import { initialState, State } from './State'

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })

type RootStore = ReturnType<typeof createRootStore>

describe('LenrixStore when unfocused', () => {
   let store: RootStore
   let lens: UnfocusedLens<State>
   let state: State
   let stateTransitions: number

   beforeEach(() => {
      store = createRootStore()
      lens = store.localLens
      stateTransitions = 0
      store.state$.subscribe(newState => {
         state = newState.reduxState
         ++stateTransitions
      })
   })

   it('has path', () => {
      expect(store.path).to.equal('root')
   })

   it('holds initial state as current state', () => {
      expect(store.currentState.errors).to.be.empty
      expect(store.currentState.status).to.equal('loaded')
      expect(store.currentState.values).to.deep.equal({})
      expect(store.currentState.loadableValues).to.deep.equal({})
      expect(store.currentState.reduxState).to.deep.equal(initialState)
      expect(store.currentState.data).to.deep.equal(initialState)
      expect(store.currentData).to.deep.equal(initialState)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.equal(initialState)
      expect(state).to.deep.equal(initialState)
   })

   it('emits new state when state is updated', () => {
      store
         .actionTypes<{ toggleFlag: void }>()
         .updates(_ => ({
            toggleFlag: () => _.focusPath('flag').update(flag => !flag)
         }))
         .dispatch({ toggleFlag: undefined })
      expect(stateTransitions).to.equal(2)
   })

   it('does not emit new state when an update does not change any value', () => {
      store
         .actionTypes<{ doNothing: void }>()
         .updates(_ => ({ doNothing: () => s => s }))
         .dispatch({ doNothing: undefined })
      expect(stateTransitions).to.equal(1)
   })
})

describe('Lenrix store with computed value', () => {
   const createStoreWithComputedValue = () =>
      createStore(
         { fieldState: 'fieldState' },
         { logger: silentLoggerOptions }
      ).computeFromFields(['fieldState'], { computed: () => 'computed' })
   let store: ReturnType<typeof createStoreWithComputedValue>
   beforeEach(() => {
      store = createStoreWithComputedValue()
   })
   it('has computed value in current state', () => {
      expect(store.currentData).to.deep.equal({
         fieldState: 'fieldState',
         computed: 'computed'
      })
   })
   it('has computed value in state steam', () => {
      let lastState: any
      store.state$.subscribe(state => (lastState = state))
      expect(lastState.data).to.deep.equal({
         fieldState: 'fieldState',
         computed: 'computed'
      })
   })
})
