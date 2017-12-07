// import { expect } from 'chai'
// import { createLens } from 'immutable-lens'

// import { createStore } from './createStore'
// import { silentLoggerOptions } from './logger/silentLoggerOptions'
// import { Store } from './Store'

// interface State {
//    name: string
//    todo: {
//       input: string
//       list: string[]
//    }
//    flag: boolean
// }

// const initialState: State = {
//    name: '',
//    todo: {
//       input: '',
//       list: []
//    },
//    flag: false
// }

// describe('LenrixStore.computeFromFields()', () => {

//    const lens = createLens<State>()
//    let store: Store<{
//       state: State
//       computedValues: {}
//       actions: { toggleFlag: void }
//       dependencies: {}
//    }>
//    let computedStore: Store<{
//       state: State
//       computedValues: { todoListLength: number }
//       actions: { toggleFlag: void }
//       dependencies: {}
//    }>
//    let state: State
//    let stateTransitions: number

//    beforeEach(() => {
//       store = createStore(initialState, { logger: silentLoggerOptions })
//          .actionTypes<{ toggleFlag: void }>()
//          .updates(_ => ({ toggleFlag: () => _.focusPath('flag').update(flag => !flag) }))
//       computedStore = store.computeFromFields(['name', 'todo'], selection => ({
//          todoListLength: selection.todo.list.length
//       }))
//    })

//    it('computes values', () => {
//       expect(computedStore.currentComputedState.todoListLength).to.equal(initialState.todo.list.length)
//    })

//    it('does not compute values when unselected fields change', () => {
//       let stateTransitions = 0
//       computedStore.state$.subscribe(() => ++stateTransitions)
//       expect(stateTransitions).to.equal(1)

//       computedStore.dispatch({ toggleFlag: undefined })

//       expect(stateTransitions).to.equal(1)
//    })

// })
