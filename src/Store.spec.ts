import {expect} from 'chai'
import {createStore, Store} from './Store'
import {Lens} from 'immutable-lens'
import 'rxjs/add/operator/toPromise'

describe('Store', () => {

   interface State {
      counter: number
      uselessField: string
   }

   const initialState: State = {
      counter: 42,
      uselessField: 'whatever'
   }

   let store: Store<State>
   let state: State
   let lens: Lens<State, State>

   beforeEach(() => {
      store = createStore(initialState)
      store.state$.subscribe(newState => state = newState)
      lens = store.lens
   })

   it('holds initial state as current state', () => {
      expect(store.currentState).to.equal(initialState)
      expect(store.currentState).to.deep.equal(initialState)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.equal(initialState)
      expect(state).to.deep.equal(initialState)
   })

   it('holds Lens', () => {
      const result = lens.updateFields({counter: (v) => v + 1})(state)
      expect(result.counter).to.equal(43)
   })

   ///////////
   // READ //
   /////////

   it('can select field', () => {
      const counter$ = store.select('counter')
      counter$.subscribe(counter => expect(counter).to.equal(42))
   })

   it('can pick fields', () => {
      const counterPick$ = store.pick('counter')
      counterPick$.subscribe(counterPick => expect(counterPick).to.deep.equal({counter: 42}))
   })

   /////////////
   // UPDATE //
   ///////////

   it('can set new state', () => {
      store.setValue({
         ...initialState,
         counter: 12
      })
      expect(state.counter).to.equal(12)
   })

   ////////////////////
   // FOCUSED STORE //
   //////////////////

   it('can focus on field', () => {
      const result = store.focusOn('counter').currentState
      expect(result).to.equal(42)
   })

})
