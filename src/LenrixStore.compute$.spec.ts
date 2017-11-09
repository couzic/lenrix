import 'rxjs/add/observable/of';
import 'rxjs/add/operator/switchMap';

import { expect } from 'chai';
import { createLens } from 'immutable-lens';
import { Observable } from 'rxjs/Observable';

import { ComputedStore } from './ComputedStore';
import { createStore } from './createStore';
import { Store } from './Store';

interface State {
   name: string
}

const initialState: State = {
   name: ''
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
         { available: false })
      stateTransitions = 0
      store.state$.subscribe(newState => {
         state = newState
         ++stateTransitions
      })
   })

   it('has path', () => {
      expect(store.path).to.equal('root.compute$(available)')
   })

   /////////////
   // UPDATE //
   ///////////

   it('can update normalized state', () => {
      store.update(state => ({ name: 'Bob' }))
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
         name: '',
         available: false
      })
      expect(stateTransitions).to.equal(1)
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({
         name: '',
         available: false
      })
      expect(stateTransitions).to.equal(1)
   })

   it('computes values when state changes', () => {
      store.setFieldValues({
         name: 'Steve'
      })
      expect(state.available).to.equal(true)
   })

   it('computes values from initial normalized state')

   // describe('.focusPath() with computed values', () => {
   //    let focusedStore: ComputedStore<State['sorting'], ComputedValues>
   //    let focusedState: State['sorting'] & ComputedValues
   //    let focusedStateTransitions: number

   //    beforeEach(() => {
   //       focusedStore = store.focusPath(['sorting'], ['todoListLength', 'caret'])
   //       focusedStateTransitions = 0
   //       focusedStore.state$.subscribe(state => {
   //          focusedState = state
   //          ++focusedStateTransitions
   //       })
   //    })

   //    it('does not emit new state when unrelated slice of parent state changes', () => {
   //       rootStore.updateFields({
   //          counter: c => c + 1
   //       })
   //       expect(focusedStateTransitions).to.equal(1)
   //    })

   //    it('emits new state when computed value needs to be recomputed from normalized state', () => {
   //       expect(focusedState.order).to.equal('ascending')
   //       expect(focusedState.caret).to.equal('up')
   //       focusedStore.setFieldValues({ order: 'descending' })
   //       expect(focusedState.caret).to.equal('down')
   //    })

   //    it('emits new state when value computed from parent normalized state is recomputed', () => {
   //       rootStore.update(todoListLens.setValue([]))
   //       expect(focusedState.todoListLength).to.equal(0)
   //    })
   // })

   // describe('.focusFields() with computed values', () => {
   //    let focusedStore: ComputedStore<Pick<State, 'sorting'>, ComputedValues>
   //    let focusedState: Pick<State, 'sorting'> & ComputedValues
   //    let focusedStateTransitions: number

   //    beforeEach(() => {
   //       focusedStore = store.focusFields(['sorting'], ['todoListLength', 'caret'])
   //       focusedStateTransitions = 0
   //       focusedStore.state$.subscribe(state => {
   //          focusedState = state
   //          ++focusedStateTransitions
   //       })
   //    })

   //    it('does not emit new state when unrelated slice of parent state changes', () => {
   //       rootStore.updateFields({
   //          flag: value => !value
   //       })
   //       expect(focusedStateTransitions).to.equal(1)
   //    })

   //    it('emits new state when computed value needs to be recomputed from normalized state', () => {
   //       expect(focusedState.sorting.order).to.equal('ascending')
   //       expect(focusedState.caret).to.equal('up')
   //       focusedStore.focusPath('sorting').setFieldValues({ order: 'descending' })
   //       expect(focusedState.caret).to.equal('down')
   //    })

   //    it('emits new state when value computed from parent normalized state is recomputed', () => {
   //       rootStore.update(todoListLens.setValue([]))
   //       expect(focusedState.todoListLength).to.equal(0)
   //    })
   // })

   // describe('.recompose() with computed values', () => {
   //    let focusedStore: ComputedStore<{ todoList: TodoItem[] }, ComputedValues>
   //    let focusedState: { todoList: TodoItem[] } & ComputedValues
   //    let focusedStateTransitions: number

   //    beforeEach(() => {
   //       focusedStore = store.recompose({
   //          todoList: store.lens.focusPath('todo', 'list')
   //       }, ['todoListLength', 'caret'])
   //       focusedStateTransitions = 0
   //       focusedStore.state$.subscribe(state => {
   //          focusedState = state
   //          ++focusedStateTransitions
   //       })
   //    })

   //    it('does not emit new state when unrelated slice of parent state changes', () => {
   //       rootStore.updateFields({
   //          flag: value => !value
   //       })
   //       expect(focusedStateTransitions).to.equal(1)
   //    })

   //    it('emits new state when computed value needs to be recomputed from normalized state', () => {
   //       focusedStore.setFieldValues({ todoList: [] })
   //       expect(focusedState.todoListLength).to.equal(0)
   //    })

   //    it('emits new state when value computed from parent normalized state is recomputed', () => {
   //       expect(state.sorting.order).to.equal('ascending')
   //       expect(state.caret).to.equal('up')
   //       rootStore.focusPath('sorting', 'order').setValue('descending')
   //       expect(focusedState.caret).to.equal('down')
   //    })
   // })

   /////////////////////
   // RUNTIME CHECKS //
   ///////////////////

   // it('throws error when computing values with higher order function', () => {
   //    expect(() => store.compute(state => () => null)).to.throw('compute() does not support higher order functions')
   // })

})
