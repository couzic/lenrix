// import 'rxjs/add/observable/never'
// import 'rxjs/add/observable/of'
// import 'rxjs/add/operator/delay'
// import 'rxjs/add/operator/mapTo'
// import 'rxjs/add/operator/switchMap'
// import 'rxjs/add/operator/toArray'

// import { expect } from 'chai'
// import { createLens } from 'immutable-lens'
// import { Observable } from 'rxjs/Observable'

// import { createStore } from './createStore'
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

// describe('LenrixStore.computeJoin$()', () => {

//    const lens = createLens<State>()
//    let rootStore: Store<State>

//    beforeEach(() => {
//       rootStore = createStore(initialState)
//    })

//    it('holds initial state as state stream', () => {
//       const computed = rootStore.computeJoin$(state$ => Observable.of({ value$: 'computed' }))
//       let state: State = {} as any
//       computed.state$.subscribe(value => state = value)
//       expect(state).to.deep.equal({
//          ...initialState,
//          value$: 'computed'
//       })
//    })

//    describe('without initial values', () => {

//       it('can reset', () => {
//          const computed = rootStore.computeJoin$(state$ => Observable.of({ value$: 'computed' }))
//          computed.setFieldValues({
//             name: 'Steve'
//          })
//          computed.reset()
//          expect(computed.currentState.name).to.equal('')
//       })

//       it('computed values are undefined if computer has not emitted yet', () => {
//          const computed = rootStore.computeJoin$(state$ => Observable.never<{ value$: 'never' }>())
//          expect(computed.currentState.value$).to.be.undefined
//       })

//       it('computed values are defined if computer has emitted', () => {
//          const computed = rootStore.computeJoin$(state$ => Observable.of({ value$: 'computed' }))
//          expect(computed.currentState.value$).to.equal('computed')
//       })

//       it('computes values from initial state only once', () => {
//          let executions = 0
//          const computed = rootStore.computeJoin$(state$ => state$.map(state => {
//             ++executions
//             return { value$: 'computed' }
//          }))
//          expect(computed.currentState.value$).to.equal('computed')
//          expect(executions).to.equal(1)
//       })

//       it('emits new state only after new values have been computed', () => {
//          let stateTransions = 0
//          const computed = rootStore.computeJoin$(state$ => state$.delay(1).mapTo({
//             value$: 'computed'
//          }))
//          computed.state$.subscribe(() => ++stateTransions)

//          rootStore.updateFields({ flag: value => !value })

//          expect(stateTransions).to.equal(1)
//       })

//    })

//    describe('with initial values', () => {

//       it('can reset', () => {
//          const computed = rootStore.computeJoin$(state$ => Observable.of({ value$: 'computed' }), { value$: 'initial' })
//          computed.setFieldValues({
//             name: 'Steve'
//          })
//          computed.reset()
//          expect(computed.currentState.name).to.equal('')
//       })

//       it('holds initial values in state if Observable has not emitted yet', () => {
//          const computed = rootStore.computeJoin$(state$ => Observable.never(), { value$: 'initial' })
//          expect(computed.currentState.value$).to.equal('initial')
//       })

//       it('holds computed values if computer has emitted', () => {
//          const computed = rootStore.computeJoin$(state$ => Observable.of({ value$: 'computed' }), { value$: 'initial' })
//          expect(computed.currentState.value$).to.equal('computed')
//       })

//       it('computes values from initial state only once', () => {
//          let executions = 0
//          const computed = rootStore.computeJoin$(state$ => state$.map(state => {
//             ++executions
//             return { value$: 'computed' }
//          }), { value$: 'initial' })
//          expect(computed.currentState.value$).to.equal('computed')
//          expect(executions).to.equal(1)
//       })

//       it('emits new state only after new values have been computed', () => {
//          let stateTransions = 0
//          const computed = rootStore.computeJoin$(state$ => state$.delay(1).mapTo({
//             value$: 'computed'
//          }), { value$: 'initial' })
//          computed.state$.subscribe(() => ++stateTransions)

//          rootStore.updateFields({ flag: value => !value })

//          expect(stateTransions).to.equal(1)
//       })

//    })

//    // it('has path', () => {
//    //    expect(store.path).to.equal('root.compute$(available)')
//    // })

//    /////////////
//    // UPDATE //
//    ///////////

//    ////////////
//    // STATE //
//    //////////

//    // describe('.focusPath() with computed values', () => {
//    //    let focusedStore: ComputedStore<State['todo'], ComputedValues>
//    //    let focusedState: State['todo'] & ComputedValues
//    //    let focusedStateTransitions: number

//    //    beforeEach(() => {
//    //       focusedStore = store.focusPath(['todo'], ['available'])
//    //       focusedStateTransitions = 0
//    //       focusedStore.state$.subscribe(state => {
//    //          focusedState = state
//    //          ++focusedStateTransitions
//    //       })
//    //    })

//    //    it('does not emit new state when unrelated slice of parent state changes', () => {
//    //       rootStore.updateFields({
//    //          flag: value => !value
//    //       })
//    //       expect(focusedStateTransitions).to.equal(1)
//    //    })

//    //    it('emits new state when value computed from parent normalized state is recomputed', () => {
//    //       expect(focusedState.available).to.equal(false)
//    //       rootStore.setFieldValues({ name: 'Steve' })
//    //       expect(focusedState.available).to.equal(true)
//    //       expect(focusedStateTransitions).to.equal(2)
//    //    })
//    // })

//    // describe('.focusFields() with computed values', () => {
//    //    let focusedStore: ComputedStore<Pick<State, 'todo'>, ComputedValues>
//    //    let focusedState: Pick<State, 'todo'> & ComputedValues
//    //    let focusedStateTransitions: number

//    //    beforeEach(() => {
//    //       focusedStore = store.focusFields(['todo'], ['available'])
//    //       focusedStateTransitions = 0
//    //       focusedStore.state$.subscribe(state => {
//    //          focusedState = state
//    //          ++focusedStateTransitions
//    //       })
//    //    })

//    //    it('does not emit new state when unrelated slice of parent state changes', () => {
//    //       rootStore.updateFields({
//    //          flag: value => !value
//    //       })
//    //       expect(focusedStateTransitions).to.equal(1)
//    //    })

//    //    it('emits new state when value computed from parent normalized state is recomputed', () => {
//    //       expect(focusedState.available).to.equal(false)
//    //       rootStore.setFieldValues({ name: 'Steve' })
//    //       expect(focusedState.available).to.equal(true)
//    //       expect(focusedStateTransitions).to.equal(2)
//    //    })
//    // })

//    // describe('.recompose() with computed values', () => {
//    //    let focusedStore: ComputedStore<{ todoList: string[] }, ComputedValues>
//    //    let focusedState: { todoList: string[] } & ComputedValues
//    //    let focusedStateTransitions: number

//    //    beforeEach(() => {
//    //       focusedStore = store.recompose({
//    //          todoList: store.lens.focusPath('todo', 'list')
//    //       }, ['available'])
//    //       focusedStateTransitions = 0
//    //       focusedStore.state$.subscribe(state => {
//    //          focusedState = state
//    //          ++focusedStateTransitions
//    //       })
//    //    })

//    //    it('does not emit new state when unrelated slice of parent state changes', () => {
//    //       rootStore.updateFields({
//    //          flag: value => !value
//    //       })
//    //       expect(focusedStateTransitions).to.equal(1)
//    //    })

//    //    it('emits new state when value computed from parent normalized state is recomputed', () => {
//    //       expect(state.available).to.equal(false)
//    //       rootStore.setFieldValues({ name: 'Steve' })
//    //       expect(focusedState.available).to.equal(true)
//    //       expect(focusedStateTransitions).to.equal(2)
//    //    })
//    // })

// })
