import { expect } from 'chai'
import { UnfocusedLens } from 'immutable-lens'
import { NEVER, Observable, of } from 'rxjs'
import { createStore } from '../src/createStore'
import { silentLoggerOptions } from '../src/logger/silentLoggerOptions'
import {
   State as ReduxState,
   TodoState as TodoData,
   initialState
} from './State'

const createRootStore = () =>
   createStore(initialState, { logger: silentLoggerOptions })

type RootStore = ReturnType<typeof createRootStore>

const createFocusedStore = (rootStore: RootStore) => rootStore.focusPath('todo')

type FocusedStore = ReturnType<typeof createFocusedStore>

describe('LenrixStore.focusPath()', () => {
   let rootStore: RootStore
   let store: FocusedStore
   let rootData: ReduxState
   let data: TodoData
   let rootLens: UnfocusedLens<ReduxState>
   let lens: UnfocusedLens<TodoData>
   let rootDataTransitions: number
   let dataTransitions: number

   beforeEach(() => {
      rootStore = createRootStore()
      store = createFocusedStore(rootStore)
      rootLens = rootStore.localLens
      lens = store.localLens
      rootDataTransitions = 0
      dataTransitions = 0
      rootStore.data$.subscribe(newData => {
         rootData = newData
         ++rootDataTransitions
      })
      store.data$.subscribe(newData => {
         data = newData
         ++dataTransitions
      })
   })

   it('has Lens', () => {
      const result = lens.updateFields({ count: v => v + 1 })(data)
      expect(result.count).to.equal(43)
   })

   xit('has path', () => {
      expect(store.path).to.equal('root.todo')
   })

   // xit('has deep path', () => {
   //    expect(store.focusPath('input').path).to.equal('root.todo.input')
   // })

   ////////////
   // STATE //
   //////////

   it('holds initial state as current state', () => {
      expect(store.currentState.reduxState).to.equal(initialState.todo)
      expect(store.currentState.data).to.deep.equal(initialState.todo)
      expect(store.currentData).to.deep.equal(initialState.todo)
   })

   it('holds initial state as state stream', () => {
      expect(data).to.deep.equal(initialState.todo)
   })

   it('does not emit new state when unrelated slice of ParentState is updated', () => {
      rootStore
         .actionTypes<{ toggleFlag: void }>()
         .updates(_ => ({
            toggleFlag: () => _.focusPath('flag').update(flag => !flag)
         }))
         .dispatch({ toggleFlag: undefined })

      expect(rootDataTransitions).to.equal(2)
      expect(dataTransitions).to.equal(1)
   })

   ////////////
   // FOCUS //
   //////////

   it('can focus path with spread keys', () => {
      const focused = rootStore.focusPath('a', 'b')
      expect(focused.currentData).to.deep.equal(initialState.a.b)
   })

   it('can focus path with key array', () => {
      const focused = rootStore.focusPath(['a', 'b'])
      expect(focused.currentState.reduxState).to.equal(initialState.a.b)
      expect(focused.currentState.data).to.deep.equal(initialState.a.b)
      expect(focused.currentData).to.deep.equal(initialState.a.b)
   })

   it('can focus path while passing down values', () => {
      const focused = rootStore
         .computeFromFields(['todo'], {
            todoListLength: ({ todo }) => todo.list.length
         })
         .focusPath(['todo'], ['todoListLength'])
      expect(focused.currentState.data).to.deep.equal({
         ...initialState.todo,
         todoListLength: 3
      })
   })

   it('can focus while passing down loaded values', () => {
      const store = createStore(
         { nested: { nestedField: 'some value' } },
         { logger: silentLoggerOptions }
      )
         .loadFromFields(['nested'], {
            loadedValue: ({ nested }) => of('some loaded value')
         })
         .focusPath(['nested'], ['loadedValue'])
      const state = store.currentState
      expect(state.status).to.equal('loaded')
      if (state.status === 'loaded') {
         const value: string = state.data.loadedValue
         expect(value).to.equal('some loaded value')
      }
   })

   it('passes down loadable values with keys present only when loaded', () => {
      const store = createStore(
         { nested: { nestedField: 'some value' } },
         { logger: silentLoggerOptions }
      )
         .loadFromFields(['nested'], {
            loadedValue: ({ nested }) =>
               NEVER as Observable<'some loaded value'>
         })
         .focusPath(['nested'], ['loadedValue'])
      const state = store.currentState
      expect(state.status).to.equal('loading')
      expect(state.data.loadedValue).to.be.undefined
   })
})
