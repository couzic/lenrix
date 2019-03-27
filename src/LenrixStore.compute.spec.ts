import { expect } from 'chai'

import { initialState, State, TodoItem } from '../test/State'
import { createStore } from './createStore'
import { silentLoggerOptions } from './logger/silentLoggerOptions'
import { Store } from './Store'

interface ComputedValues {
   todoListLength: number
   caret: 'up' | 'down'
}

describe('LenrixStore.compute()', () => {
   let rootStore: Store<{
      state: State
      readonlyValues: {}
      actions: { toggleFlag: void; toggleOrder: void }
      dependencies: {}
   }>

   let store: Store<{
      state: State
      readonlyValues: ComputedValues
      actions: { toggleFlag: void; toggleOrder: void }
      dependencies: {}
   }>

   let state: State & ComputedValues

   beforeEach(() => {
      rootStore = createStore(initialState, { logger: silentLoggerOptions })
         .actionTypes<{
            toggleFlag: void
            toggleOrder: void
         }>()
         .updates(_ => ({
            toggleFlag: () => _.focusPath('flag').update(flag => !flag),
            toggleOrder: () =>
               _.focusPath('sorting', 'order').update(
                  order => (order === 'descending' ? 'ascending' : 'descending')
               )
         }))
      store = rootStore.compute(s => ({
         todoListLength: s.todo.list.length,
         caret: (s.sorting.order === 'ascending' ? 'up' : 'down') as
            | 'up'
            | 'down'
      }))
      const st = store.compute(() => ({ toto: 'tata' }))
      store.computedState$.subscribe(newState => {
         state = newState
      })
   })

   // it('has path', () => {
   //    expect(store.path).to.equal('root.compute(todoListLength, caret)')
   // })

   it('computes initial state only once', () => {
      let executions = 0
      rootStore.compute(s => {
         ++executions
         return {
            whatever: 'whatever'
         }
      })
      expect(executions).to.equal(1)
   })

   ////////////
   // STATE //
   //////////

   it('holds initial state as current state', () => {
      expect(store.currentComputedState).to.deep.equal({
         ...rootStore.currentState,
         todoListLength: rootStore.currentState.todo.list.length,
         caret: 'up'
      })
   })

   it('holds initial state as state stream', () => {
      expect(state).to.deep.equal({
         ...rootStore.currentState,
         todoListLength: rootStore.currentState.todo.list.length,
         caret: 'up'
      })
   })

   it('computes value when state changes', () => {
      expect(state.caret).to.equal('up')
      store.dispatch({ toggleOrder: undefined })
      expect(state.caret).to.equal('down')
   })

   it('passes computed values to child compute() store', () => {
      const childStore = store.compute(s => ({
         computedOnChild: s.caret
      }))
      expect(childStore.currentComputedState.computedOnChild).to.equal(
         state.caret
      )
   })

   describe('.focusPath() with computed values', () => {
      let focusedStore: Store<{
         state: State['sorting']
         readonlyValues: ComputedValues
         actions: { toggleFlag: void; toggleOrder: void }
         dependencies: {}
      }>
      let focusedState: State['sorting'] & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.focusPath(
            ['sorting'],
            ['todoListLength', 'caret']
         )
         focusedStateTransitions = 0
         focusedStore.computedState$.subscribe(s => {
            focusedState = s
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         const storeWithUpdates = rootStore
            .actionTypes<{ incrementCounter: void }>()
            .updates(_ => ({
               incrementCounter: () =>
                  _.focusPath('counter').update(counter => counter + 1)
            }))
         storeWithUpdates.dispatch({ incrementCounter: undefined })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when computed value needs to be recomputed from normalized state', () => {
         expect(focusedState.order).to.equal('ascending')
         expect(focusedState.caret).to.equal('up')
         focusedStore.dispatch({ toggleOrder: undefined })
         expect(focusedState.caret).to.equal('down')
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         rootStore
            .actionTypes<{ clearTodoList: void }>()
            .updates(_ => ({
               clearTodoList: () => _.focusPath('todo', 'list').setValue([])
            }))
            .dispatch({ clearTodoList: undefined })
         expect(focusedState.todoListLength).to.equal(0)
      })
   })

   describe('.focusFields() with computed values', () => {
      let focusedStore: Store<{
         state: Pick<State, 'sorting'>
         readonlyValues: ComputedValues
         actions: { toggleFlag: void; toggleOrder: void }
         dependencies: {}
      }>
      let focusedState: Pick<State, 'sorting'> & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.focusFields(
            ['sorting'],
            ['todoListLength', 'caret']
         )
         focusedStateTransitions = 0
         focusedStore.computedState$.subscribe(s => {
            focusedState = s
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         rootStore.dispatch({ toggleFlag: undefined })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when computed value needs to be recomputed from normalized state', () => {
         expect(focusedState.sorting.order).to.equal('ascending')
         expect(focusedState.caret).to.equal('up')
         focusedStore.dispatch({ toggleOrder: undefined })
         expect(focusedState.caret).to.equal('down')
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         rootStore
            .actionTypes<{ clearTodoList: void }>()
            .updates(_ => ({
               clearTodoList: () => _.focusPath('todo', 'list').setValue([])
            }))
            .dispatch({ clearTodoList: undefined })
         expect(focusedState.todoListLength).to.equal(0)
      })
   })

   describe('.recompose() with computed values', () => {
      let focusedStore: Store<{
         state: { todoList: TodoItem[] }
         readonlyValues: ComputedValues
         actions: { toggleFlag: void; toggleOrder: void }
         dependencies: {}
      }>
      let focusedState: { todoList: TodoItem[] } & ComputedValues
      let focusedStateTransitions: number

      beforeEach(() => {
         focusedStore = store.recompose(
            _ => ({
               todoList: _.focusPath('todo', 'list')
            }),
            ['todoListLength', 'caret']
         )
         focusedStateTransitions = 0
         focusedStore.computedState$.subscribe(s => {
            focusedState = s
            ++focusedStateTransitions
         })
      })

      it('does not emit new state when unrelated slice of parent state changes', () => {
         rootStore.dispatch({ toggleFlag: undefined })
         expect(focusedStateTransitions).to.equal(1)
      })

      it('emits new state when computed value needs to be recomputed from normalized state', () => {
         focusedStore
            .actionTypes<{ clearTodoList: void }>()
            .updates(_ => ({
               clearTodoList: () => _.focusPath('todoList').setValue([])
            }))
            .dispatch({ clearTodoList: undefined })
         expect(focusedState.todoListLength).to.equal(0)
      })

      it('emits new state when value computed from parent normalized state is recomputed', () => {
         expect(state.sorting.order).to.equal('ascending')
         expect(state.caret).to.equal('up')
         focusedStore.dispatch({ toggleOrder: undefined })
         expect(focusedState.caret).to.equal('down')
      })
   })

   it('has access to light store with currentState', () => {
      const computedStore = store.compute((s, lightStore) => ({
         computed: lightStore!.currentState.todo // TODO Remove "!"
      }))
      expect(computedStore.currentComputedState.computed).to.equal(
         store.currentState.todo
      )
   })

   /////////////////////
   // RUNTIME CHECKS //
   ///////////////////

   it('throws error when computing values with higher order function', () => {
      expect(() => store.compute(() => () => null)).to.throw(
         'compute() does not accept higher order functions'
      )
   })

   it('throws error when computer does not return', () => {
      expect(() =>
         store.compute((() => {
            // Never return
         }) as any)
      ).to.throw()
   })
})
